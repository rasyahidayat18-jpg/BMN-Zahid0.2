import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from database import db
from auth import get_current_user, require_permission
from models import MaintenanceItem, ApprovalAction, StatusUpdate, CommentCreate
from utils import gen_id, now_iso, log_activity, clean, notify, notify_roles, gen_sequence_number
import rbac

router = APIRouter()

LEVEL_ROLE = {1: rbac.PENGELOLA_BMN, 2: rbac.KEPALA_TU, 3: rbac.KEPALA_SATKER}
LEVEL_STATUS = {1: "Menunggu Approval Tingkat 1", 2: "Menunggu Approval Tingkat 2", 3: "Menunggu Approval Tingkat 3"}


async def _attach(m: dict) -> dict:
    m = clean(dict(m))
    imgs = await db.maintenance_images.find({"maintenance_request_id": m["id"]}, {"_id": 0, "data": 0}).to_list(50)
    m["images"] = imgs
    return m


@router.get("/maintenance")
async def list_maintenance(user=Depends(get_current_user), status: Optional[str] = None, queue: bool = False):
    role = user["role"]
    perms = user["permissions"]
    q = {}
    if status:
        q["status"] = status
    # Approval queue: only items waiting at this user's approval level
    if queue:
        if "maintenance_approve_1" in perms:
            q["status"] = LEVEL_STATUS[1]
        elif "maintenance_approve_2" in perms:
            q["status"] = LEVEL_STATUS[2]
        elif "maintenance_approve_3" in perms:
            q["status"] = LEVEL_STATUS[3]
        else:
            return []
    else:
        # Visibility rules
        if "maintenance_view_all" not in perms:
            q["created_by"] = user["id"]
    items = await db.maintenance_requests.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return [await _attach(i) for i in items]


@router.get("/maintenance/{req_id}")
async def get_maintenance(req_id: str, user=Depends(get_current_user)):
    m = await db.maintenance_requests.find_one({"id": req_id}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if "maintenance_view_all" not in user["permissions"] and m.get("created_by") != user["id"]:
        # approvers at any level may still view; others restricted
        if not any(p in user["permissions"] for p in ["maintenance_approve_1", "maintenance_approve_2", "maintenance_approve_3"]):
            raise HTTPException(status_code=403, detail="Tidak memiliki akses ke pengajuan ini")
    return await _attach(m)


@router.post("/maintenance")
async def create_maintenance(data: MaintenanceItem, user=Depends(require_permission("maintenance_create"))):
    num = await gen_sequence_number("PM", db.maintenance_requests)
    submit = data.submit
    status = LEVEL_STATUS[1] if submit else "Draft"
    doc = data.model_dump()
    doc.pop("submit", None)
    doc.update({
        "id": gen_id(), "request_number": num, "status": status,
        "current_level": 1 if submit else 0,
        "created_by": user["id"], "created_by_name": user.get("nama_lengkap"), "created_by_role": user.get("role"),
        "approvals": [], "comments": [],
        "history": [{"status": status, "oleh": user.get("nama_lengkap"), "timestamp": now_iso()}],
        "created_at": now_iso(), "updated_at": now_iso(),
    })
    await db.maintenance_requests.insert_one(doc)
    await log_activity(user, "Ajukan Pemeliharaan", f"Mengajukan pemeliharaan {doc['asset_name']} ({num})")
    if submit:
        await notify_roles([rbac.PENGELOLA_BMN], "Pengajuan Pemeliharaan Baru",
                           f"Pengajuan pemeliharaan baru dari {user.get('nama_lengkap')} - {doc['asset_name']} ({num})",
                           "maintenance", f"/pemeliharaan/{doc['id']}")
    return await _attach(doc)


@router.post("/maintenance/{req_id}/submit")
async def submit_draft(req_id: str, user=Depends(require_permission("maintenance_create"))):
    m = await db.maintenance_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if m.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="Bukan pengajuan Anda")
    if m.get("status") != "Draft":
        raise HTTPException(status_code=400, detail="Pengajuan sudah disubmit")
    hist = m.get("history", [])
    hist.append({"status": LEVEL_STATUS[1], "oleh": user.get("nama_lengkap"), "timestamp": now_iso()})
    await db.maintenance_requests.update_one({"id": req_id}, {"$set": {"status": LEVEL_STATUS[1], "current_level": 1, "history": hist, "updated_at": now_iso()}})
    await notify_roles([rbac.PENGELOLA_BMN], "Pengajuan Pemeliharaan Baru",
                       f"Pengajuan pemeliharaan dari {user.get('nama_lengkap')} - {m['asset_name']}", "maintenance", f"/pemeliharaan/{req_id}")
    fresh = await db.maintenance_requests.find_one({"id": req_id}, {"_id": 0})
    return await _attach(fresh)


@router.post("/maintenance/{req_id}/images")
async def upload_maintenance_images(req_id: str, files: list[UploadFile] = File(...), user=Depends(require_permission("maintenance_create"))):
    m = await db.maintenance_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    for f in files:
        content = await f.read()
        b64 = base64.b64encode(content).decode("utf-8")
        await db.maintenance_images.insert_one({
            "id": gen_id(), "maintenance_request_id": req_id, "data": b64,
            "content_type": f.content_type or "image/jpeg", "image_name": f.filename or "foto.jpg",
            "created_at": now_iso(),
        })
    await log_activity(user, "Upload Foto Kerusakan", f"Mengunggah {len(files)} foto kerusakan ({m.get('request_number')})")
    imgs = await db.maintenance_images.find({"maintenance_request_id": req_id}, {"_id": 0, "data": 0}).to_list(50)
    return imgs


@router.post("/maintenance/{req_id}/approve")
async def approve_maintenance(req_id: str, data: ApprovalAction, user=Depends(get_current_user)):
    m = await db.maintenance_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    level = m.get("current_level", 1)
    required_role = LEVEL_ROLE.get(level)
    if user["role"] != required_role:
        raise HTTPException(status_code=403, detail=f"Approval tingkat {level} hanya untuk {required_role}")
    if m.get("status") != LEVEL_STATUS.get(level):
        raise HTTPException(status_code=400, detail="Pengajuan tidak dalam status menunggu approval Anda")

    approvals = m.get("approvals", [])
    hist = m.get("history", [])
    ts = now_iso()
    if data.action == "reject":
        approvals.append({"level": level, "approver_name": user.get("nama_lengkap"), "role": user.get("role"),
                          "status": "Ditolak", "catatan": data.catatan, "timestamp": ts})
        hist.append({"status": "Ditolak", "oleh": user.get("nama_lengkap"), "timestamp": ts})
        await db.maintenance_requests.update_one({"id": req_id}, {"$set": {
            "status": "Ditolak", "approvals": approvals, "history": hist, "updated_at": ts}})
        await notify(m["created_by"], "Pengajuan Pemeliharaan Ditolak",
                     f"Pengajuan {m['request_number']} ditolak pada tingkat {level}. Silakan lihat catatan.", "error", f"/pemeliharaan/{req_id}")
        await log_activity(user, "Tolak Pemeliharaan", f"Menolak pengajuan {m['request_number']} (tingkat {level})")
    else:
        approvals.append({"level": level, "approver_name": user.get("nama_lengkap"), "role": user.get("role"),
                          "status": "Disetujui", "catatan": data.catatan, "timestamp": ts})
        if level < 3:
            new_level = level + 1
            new_status = LEVEL_STATUS[new_level]
            hist.append({"status": new_status, "oleh": user.get("nama_lengkap"), "timestamp": ts})
            await db.maintenance_requests.update_one({"id": req_id}, {"$set": {
                "status": new_status, "current_level": new_level, "approvals": approvals, "history": hist, "updated_at": ts}})
            await notify(m["created_by"], "Pengajuan Diteruskan",
                         f"Pengajuan {m['request_number']} disetujui tingkat {level} dan diteruskan ke {LEVEL_ROLE[new_level]}.", "info", f"/pemeliharaan/{req_id}")
            await notify_roles([LEVEL_ROLE[new_level]], "Menunggu Approval Anda",
                               f"Pengajuan pemeliharaan {m['request_number']} menunggu approval Anda.", "maintenance", f"/pemeliharaan/{req_id}")
        else:
            hist.append({"status": "Disetujui", "oleh": user.get("nama_lengkap"), "timestamp": ts})
            await db.maintenance_requests.update_one({"id": req_id}, {"$set": {
                "status": "Disetujui", "approvals": approvals, "history": hist, "updated_at": ts}})
            await notify(m["created_by"], "Pengajuan Pemeliharaan Disetujui",
                         f"Pengajuan {m['request_number']} telah disetujui sepenuhnya.", "success", f"/pemeliharaan/{req_id}")
        await log_activity(user, "Approval Pemeliharaan", f"Menyetujui pengajuan {m['request_number']} (tingkat {level})")
    fresh = await db.maintenance_requests.find_one({"id": req_id}, {"_id": 0})
    return await _attach(fresh)


@router.post("/maintenance/{req_id}/status")
async def update_maint_status(req_id: str, data: StatusUpdate, user=Depends(require_permission("maintenance_approve_1"))):
    m = await db.maintenance_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    allowed = ["Sedang Dalam Pemeliharaan", "Selesai"]
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    if m.get("status") not in ["Disetujui", "Sedang Dalam Pemeliharaan"]:
        raise HTTPException(status_code=400, detail="Pengajuan harus disetujui terlebih dahulu")
    hist = m.get("history", [])
    hist.append({"status": data.status, "oleh": user.get("nama_lengkap"), "timestamp": now_iso()})
    await db.maintenance_requests.update_one({"id": req_id}, {"$set": {"status": data.status, "history": hist, "updated_at": now_iso()}})
    await notify(m["created_by"], "Status Pemeliharaan Diperbarui", f"Pengajuan {m['request_number']} kini berstatus: {data.status}", "info", f"/pemeliharaan/{req_id}")
    await log_activity(user, "Ubah Status Pemeliharaan", f"{m['request_number']} -> {data.status}")
    fresh = await db.maintenance_requests.find_one({"id": req_id}, {"_id": 0})
    return await _attach(fresh)


@router.post("/maintenance/{req_id}/comments")
async def add_comment(req_id: str, data: CommentCreate, user=Depends(get_current_user)):
    m = await db.maintenance_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    comment = {"id": gen_id(), "user_id": user["id"], "name": user.get("nama_lengkap"), "role": user.get("role"),
               "isi": data.isi, "timestamp": now_iso()}
    await db.maintenance_requests.update_one({"id": req_id}, {"$push": {"comments": comment}})
    # notify the other party
    if m.get("created_by") != user["id"]:
        await notify(m["created_by"], "Catatan Baru", f"{user.get('nama_lengkap')} menambahkan catatan pada {m['request_number']}", "info", f"/pemeliharaan/{req_id}")
    fresh = await db.maintenance_requests.find_one({"id": req_id}, {"_id": 0})
    return await _attach(fresh)


@router.delete("/maintenance/{req_id}")
async def delete_maintenance(req_id: str, user=Depends(get_current_user)):
    m = await db.maintenance_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if m.get("created_by") != user["id"] and "maintenance_view_all" not in user["permissions"]:
        raise HTTPException(status_code=403, detail="Tidak diizinkan")
    if m.get("status") != "Draft" and "maintenance_view_all" not in user["permissions"]:
        raise HTTPException(status_code=400, detail="Hanya draft yang dapat dihapus")
    await db.maintenance_requests.delete_one({"id": req_id})
    await db.maintenance_images.delete_many({"maintenance_request_id": req_id})
    return {"message": "Pengajuan dihapus"}
