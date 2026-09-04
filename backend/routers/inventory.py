from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from database import db
from auth import get_current_user, require_permission
from models import InventoryCreate, ApprovalAction, StatusUpdate, CommentCreate
from utils import gen_id, now_iso, log_activity, clean, notify, notify_roles, gen_sequence_number
import rbac

router = APIRouter()

FULFILL_FLOW = ["Disetujui", "Sedang Diproses", "Barang Diserahkan", "Selesai"]


@router.get("/inventory")
async def list_inventory(user=Depends(get_current_user), status: Optional[str] = None, queue: bool = False):
    perms = user["permissions"]
    q = {}
    if status:
        q["status"] = status
    if queue and "inventory_approve" in perms:
        q["status"] = "Menunggu Approval"
    elif "inventory_view_all" not in perms:
        q["created_by"] = user["id"]
    items = await db.inventory_requests.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return [clean(i) for i in items]


@router.get("/inventory/{req_id}")
async def get_inventory(req_id: str, user=Depends(get_current_user)):
    m = await db.inventory_requests.find_one({"id": req_id}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    if "inventory_view_all" not in user["permissions"] and m.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Tidak memiliki akses ke permintaan ini")
    return m


@router.post("/inventory")
async def create_inventory(data: InventoryCreate, user=Depends(require_permission("inventory_create"))):
    if not data.items:
        raise HTTPException(status_code=400, detail="Minimal satu item barang harus diisi")
    num = await gen_sequence_number("PB", db.inventory_requests)
    submit = data.submit
    status = "Menunggu Approval" if submit else "Draft"
    doc = {
        "id": gen_id(), "request_number": num, "status": status,
        "pemohon_name": user.get("nama_lengkap"), "role": user.get("role"),
        "unit": data.unit or user.get("unit", ""),
        "tanggal_permintaan": data.tanggal_permintaan or now_iso()[:10],
        "catatan": data.catatan,
        "items": [i.model_dump() for i in data.items],
        "comments": [],
        "history": [{"status": status, "oleh": user.get("nama_lengkap"), "timestamp": now_iso()}],
        "created_by": user["id"], "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.inventory_requests.insert_one(doc)
    await log_activity(user, "Ajukan Permintaan Barang", f"Mengajukan permintaan barang {num}")
    if submit:
        await notify_roles([rbac.PENGELOLA_BMN], "Permintaan Barang Baru",
                           f"Permintaan barang baru dari {user.get('nama_lengkap')} ({num})", "inventory", f"/persediaan/{doc['id']}")
    return clean(doc)


@router.post("/inventory/{req_id}/submit")
async def submit_inventory(req_id: str, user=Depends(require_permission("inventory_create"))):
    m = await db.inventory_requests.find_one({"id": req_id})
    if not m or m.get("created_by") != user["id"]:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    if m.get("status") != "Draft":
        raise HTTPException(status_code=400, detail="Sudah disubmit")
    hist = m.get("history", []) + [{"status": "Menunggu Approval", "oleh": user.get("nama_lengkap"), "timestamp": now_iso()}]
    await db.inventory_requests.update_one({"id": req_id}, {"$set": {"status": "Menunggu Approval", "history": hist, "updated_at": now_iso()}})
    await notify_roles([rbac.PENGELOLA_BMN], "Permintaan Barang Baru", f"Permintaan barang dari {user.get('nama_lengkap')} ({m['request_number']})", "inventory", f"/persediaan/{req_id}")
    return clean(await db.inventory_requests.find_one({"id": req_id}, {"_id": 0}))


@router.post("/inventory/{req_id}/approve")
async def approve_inventory(req_id: str, data: ApprovalAction, user=Depends(require_permission("inventory_approve"))):
    m = await db.inventory_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    if m.get("status") != "Menunggu Approval":
        raise HTTPException(status_code=400, detail="Permintaan tidak menunggu approval")
    ts = now_iso()
    hist = m.get("history", [])
    if data.action == "reject":
        if not data.catatan:
            raise HTTPException(status_code=400, detail="Alasan penolakan wajib diisi")
        hist.append({"status": "Ditolak", "oleh": user.get("nama_lengkap"), "catatan": data.catatan, "timestamp": ts})
        await db.inventory_requests.update_one({"id": req_id}, {"$set": {"status": "Ditolak", "reject_reason": data.catatan, "history": hist, "updated_at": ts}})
        await notify(m["created_by"], "Permintaan Barang Ditolak", f"Permintaan {m['request_number']} ditolak. {data.catatan}", "error", f"/persediaan/{req_id}")
        await log_activity(user, "Tolak Permintaan Barang", f"Menolak {m['request_number']}")
    else:
        hist.append({"status": "Disetujui", "oleh": user.get("nama_lengkap"), "catatan": data.catatan, "timestamp": ts})
        await db.inventory_requests.update_one({"id": req_id}, {"$set": {"status": "Disetujui", "history": hist, "updated_at": ts}})
        await notify(m["created_by"], "Permintaan Barang Disetujui", f"Permintaan {m['request_number']} telah disetujui.", "success", f"/persediaan/{req_id}")
        await log_activity(user, "Setujui Permintaan Barang", f"Menyetujui {m['request_number']}")
    return clean(await db.inventory_requests.find_one({"id": req_id}, {"_id": 0}))


@router.post("/inventory/{req_id}/status")
async def update_inv_status(req_id: str, data: StatusUpdate, user=Depends(require_permission("inventory_approve"))):
    m = await db.inventory_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    if data.status not in FULFILL_FLOW:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    hist = m.get("history", []) + [{"status": data.status, "oleh": user.get("nama_lengkap"), "timestamp": now_iso()}]
    await db.inventory_requests.update_one({"id": req_id}, {"$set": {"status": data.status, "history": hist, "updated_at": now_iso()}})
    await notify(m["created_by"], "Status Permintaan Diperbarui", f"Permintaan {m['request_number']} kini: {data.status}", "info", f"/persediaan/{req_id}")
    await log_activity(user, "Ubah Status Permintaan", f"{m['request_number']} -> {data.status}")
    return clean(await db.inventory_requests.find_one({"id": req_id}, {"_id": 0}))


@router.post("/inventory/{req_id}/comments")
async def add_inv_comment(req_id: str, data: CommentCreate, user=Depends(get_current_user)):
    m = await db.inventory_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    comment = {"id": gen_id(), "user_id": user["id"], "name": user.get("nama_lengkap"), "role": user.get("role"), "isi": data.isi, "timestamp": now_iso()}
    await db.inventory_requests.update_one({"id": req_id}, {"$push": {"comments": comment}})
    if m.get("created_by") != user["id"]:
        await notify(m["created_by"], "Catatan Baru", f"{user.get('nama_lengkap')} menambahkan catatan pada {m['request_number']}", "info", f"/persediaan/{req_id}")
    return clean(await db.inventory_requests.find_one({"id": req_id}, {"_id": 0}))


@router.delete("/inventory/{req_id}")
async def delete_inventory(req_id: str, user=Depends(get_current_user)):
    m = await db.inventory_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    if m.get("created_by") != user["id"] and "inventory_view_all" not in user["permissions"]:
        raise HTTPException(status_code=403, detail="Tidak diizinkan")
    await db.inventory_requests.delete_one({"id": req_id})
    return {"message": "Permintaan dihapus"}
