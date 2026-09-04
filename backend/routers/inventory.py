from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from database import db
from auth import get_current_user, require_permission
from models import InventoryCreate, ApprovalAction, StatusUpdate, CommentCreate, PartialApprovalAction
from utils import gen_id, now_iso, log_activity, clean, notify, notify_roles, gen_sequence_number
import rbac

router = APIRouter()

FULFILL_FLOW = ["Disetujui", "Disetujui Sebagian", "Sedang Diproses", "Barang Diserahkan", "Selesai"]


async def _deduct_stock_for_request(req_doc, user):
    """Deduct stock for each item when status becomes Barang Diserahkan."""
    items = req_doc.get("items", [])
    for it in items:
        qty_to_deduct = it.get("jumlah_diserahkan") or it.get("jumlah_disetujui") or it.get("jumlah", 0)
        if qty_to_deduct <= 0:
            continue
        # Try to find matching stock item by name
        stock_item = await db.inventory_items.find_one(
            {"item_name": {"$regex": f"^{it['nama_barang']}$", "$options": "i"}}
        )
        if not stock_item:
            continue

        stock_before = stock_item.get("current_stock", 0)
        stock_after = max(0, stock_before - qty_to_deduct)

        tx = {
            "id": gen_id(),
            "item_id": stock_item["id"],
            "item_name": stock_item.get("item_name"),
            "transaction_number": await gen_sequence_number("OUT", db.inventory_stock_transactions),
            "transaction_type": "STOCK_OUT",
            "quantity": qty_to_deduct,
            "stock_before": stock_before,
            "stock_after": stock_after,
            "reference_id": req_doc.get("id"),
            "reference_number": req_doc.get("request_number"),
            "notes": f"Penyerahan barang untuk permintaan {req_doc.get('request_number')}",
            "created_by": user.get("nama_lengkap"),
            "created_by_id": user.get("id"),
            "created_at": now_iso(),
        }
        await db.inventory_stock_transactions.insert_one(tx)
        await db.inventory_items.update_one({"id": stock_item["id"]}, {
            "$set": {"current_stock": stock_after, "updated_at": now_iso()},
            "$inc": {"stock_out_total": qty_to_deduct},
        })
        # Check low stock
        current = stock_after
        minimum = stock_item.get("minimum_stock", 0)
        if current <= 0:
            await notify_roles([rbac.PENGELOLA_BMN], "STOK HABIS",
                f"{stock_item.get('item_name')} saat ini telah habis.", "error", "/persediaan/stock")
        elif minimum > 0 and current <= minimum:
            await notify_roles([rbac.PENGELOLA_BMN], "STOK MENIPIS",
                f"{stock_item.get('item_name')} tersisa {current} {stock_item.get('unit')}.", "warning", "/persediaan/stock")


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
async def approve_inventory(req_id: str, data: PartialApprovalAction, user=Depends(require_permission("inventory_approve"))):
    m = await db.inventory_requests.find_one({"id": req_id})
    if not m:
        raise HTTPException(status_code=404, detail="Permintaan tidak ditemukan")
    if m.get("status") != "Menunggu Approval":
        raise HTTPException(status_code=400, detail="Permintaan tidak menunggu approval")
    ts = now_iso()
    hist = m.get("history", [])
    items = m.get("items", [])

    if data.action == "reject":
        if not data.catatan:
            raise HTTPException(status_code=400, detail="Alasan penolakan wajib diisi")
        hist.append({"status": "Ditolak", "oleh": user.get("nama_lengkap"), "catatan": data.catatan, "timestamp": ts})
        await db.inventory_requests.update_one({"id": req_id}, {"$set": {"status": "Ditolak", "reject_reason": data.catatan, "history": hist, "updated_at": ts}})
        await notify(m["created_by"], "Permintaan Barang Ditolak", f"Permintaan {m['request_number']} ditolak. {data.catatan}", "error", f"/persediaan/{req_id}")
        await log_activity(user, "Tolak Permintaan Barang", f"Menolak {m['request_number']}")
    elif data.action == "partial":
        # Partial approval
        if not data.catatan:
            raise HTTPException(status_code=400, detail="Catatan wajib diisi untuk approval sebagian")
        if data.items_approved:
            for ia in data.items_approved:
                idx = ia.get("index", 0)
                if 0 <= idx < len(items):
                    items[idx]["jumlah_disetujui"] = ia.get("jumlah_disetujui", 0)
        # Set items that weren't partially set to full approval
        for it in items:
            if "jumlah_disetujui" not in it:
                it["jumlah_disetujui"] = it.get("jumlah", 0)

        hist.append({"status": "Disetujui Sebagian", "oleh": user.get("nama_lengkap"), "catatan": data.catatan, "timestamp": ts})
        await db.inventory_requests.update_one({"id": req_id}, {"$set": {
            "status": "Disetujui Sebagian", "items": items, "history": hist, "updated_at": ts
        }})
        await notify(m["created_by"], "Permintaan Barang Disetujui Sebagian",
            f"Permintaan {m['request_number']} disetujui sebagian. {data.catatan}", "info", f"/persediaan/{req_id}")
        await log_activity(user, "Setujui Sebagian Permintaan Barang", f"Menyetujui sebagian {m['request_number']}")
    else:
        # Full approval - check stock availability
        stock_warnings = []
        for it in items:
            stock_item = await db.inventory_items.find_one(
                {"item_name": {"$regex": f"^{it['nama_barang']}$", "$options": "i"}},
                {"_id": 0}
            )
            if stock_item:
                if stock_item.get("current_stock", 0) < it.get("jumlah", 0):
                    stock_warnings.append(
                        f"{it['nama_barang']}: diminta {it['jumlah']} {it.get('satuan','')}, stok tersedia {stock_item.get('current_stock', 0)} {stock_item.get('unit','')}"
                    )
            it["jumlah_disetujui"] = it.get("jumlah", 0)

        hist.append({"status": "Disetujui", "oleh": user.get("nama_lengkap"), "catatan": data.catatan, "timestamp": ts,
                      "stock_warnings": stock_warnings if stock_warnings else None})
        await db.inventory_requests.update_one({"id": req_id}, {"$set": {
            "status": "Disetujui", "items": items, "history": hist, "updated_at": ts
        }})
        msg = f"Permintaan {m['request_number']} telah disetujui."
        if stock_warnings:
            msg += " Perhatian: ada item dengan stok terbatas."
        await notify(m["created_by"], "Permintaan Barang Disetujui", msg, "success", f"/persediaan/{req_id}")
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

    # Auto-deduct stock when Barang Diserahkan
    if data.status == "Barang Diserahkan":
        await _deduct_stock_for_request(m, user)

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
