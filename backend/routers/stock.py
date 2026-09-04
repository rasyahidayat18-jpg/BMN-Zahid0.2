"""Stock Barang Persediaan router — Admin-only."""

import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import Response
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from database import db
from auth import get_current_user, require_permission
from models import StockItemCreate, StockItemUpdate, StockInCreate, StockAdjustmentCreate
from utils import gen_id, now_iso, log_activity, clean, notify_roles, gen_sequence_number
import rbac

router = APIRouter(prefix="/stock")

STOCK_CATEGORIES = [
    "ATK", "Kertas", "Tinta Printer", "Toner",
    "Peralatan Kebersihan", "Barang Elektronik",
    "Perlengkapan Kantor", "Lainnya",
]


async def _check_low_stock(item: dict):
    """Send notification if stock is low or depleted."""
    current = item.get("current_stock", 0)
    minimum = item.get("minimum_stock", 0)
    name = item.get("item_name", "")
    unit = item.get("unit", "")

    if current <= 0:
        await notify_roles(
            [rbac.PENGELOLA_BMN],
            "STOK HABIS",
            f"{name} saat ini telah habis (0 {unit}).",
            "error",
            "/persediaan/stock"
        )
    elif minimum > 0 and current <= minimum:
        await notify_roles(
            [rbac.PENGELOLA_BMN],
            "STOK MENIPIS",
            f"{name} tersisa {current} {unit} (minimum: {minimum} {unit}).",
            "warning",
            "/persediaan/stock"
        )


def _stock_status(current: float, minimum: float) -> str:
    if current <= 0:
        return "Habis"
    if minimum > 0 and current <= minimum:
        return "Menipis"
    return "Aman"


# ---- Categories ----
@router.get("/categories")
async def list_categories(user=Depends(require_permission("stock_manage"))):
    return STOCK_CATEGORIES


# ---- Dashboard Stats ----
@router.get("/dashboard")
async def stock_dashboard(
    user=Depends(require_permission("stock_manage")),
    period: Optional[str] = "month",
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    items = await db.inventory_items.find({}, {"_id": 0}).to_list(10000)
    total = len(items)
    aman = sum(1 for i in items if _stock_status(i.get("current_stock", 0), i.get("minimum_stock", 0)) == "Aman")
    menipis = sum(1 for i in items if _stock_status(i.get("current_stock", 0), i.get("minimum_stock", 0)) == "Menipis")
    habis = sum(1 for i in items if _stock_status(i.get("current_stock", 0), i.get("minimum_stock", 0)) == "Habis")

    # Period filter for transactions
    now = datetime.now(timezone.utc)
    if start and end:
        date_start = start
        date_end = end
    elif period == "today":
        date_start = now.strftime("%Y-%m-%d")
        date_end = date_start
    elif period == "week":
        week_start = now - timedelta(days=now.weekday())
        date_start = week_start.strftime("%Y-%m-%d")
        date_end = now.strftime("%Y-%m-%d")
    elif period == "year":
        date_start = f"{now.year}-01-01"
        date_end = now.strftime("%Y-%m-%d")
    else:  # month
        date_start = f"{now.year}-{now.month:02d}-01"
        date_end = now.strftime("%Y-%m-%d")

    tx_q = {"created_at": {"$gte": date_start, "$lte": date_end + "T23:59:59"}}
    all_tx = await db.inventory_stock_transactions.find(tx_q, {"_id": 0}).to_list(50000)

    masuk = sum(t.get("quantity", 0) for t in all_tx if t.get("transaction_type") == "STOCK_IN")
    keluar = sum(t.get("quantity", 0) for t in all_tx if t.get("transaction_type") == "STOCK_OUT")

    # Low stock items list
    low_stock_items = [
        clean(i) for i in items
        if _stock_status(i.get("current_stock", 0), i.get("minimum_stock", 0)) != "Aman"
    ][:10]

    return {
        "total_jenis": total,
        "stok_aman": aman,
        "stok_menipis": menipis,
        "stok_habis": habis,
        "barang_masuk": masuk,
        "barang_keluar": keluar,
        "period": period,
        "date_start": date_start,
        "date_end": date_end,
        "low_stock_items": low_stock_items,
    }


# ---- Master Items CRUD ----
@router.get("/items")
async def list_items(
    user=Depends(require_permission("stock_manage")),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None,
    sort_by: Optional[str] = "item_name",
    sort_dir: Optional[str] = "asc",
    page: int = 1,
    per_page: int = 20,
):
    q = {}
    if search:
        q["$or"] = [
            {"item_name": {"$regex": search, "$options": "i"}},
            {"item_code": {"$regex": search, "$options": "i"}},
        ]
    if category:
        q["category"] = category
    if location:
        q["storage_location"] = {"$regex": location, "$options": "i"}

    total_count = await db.inventory_items.count_documents(q)
    direction = 1 if sort_dir == "asc" else -1
    skip = (page - 1) * per_page

    items_raw = await db.inventory_items.find(q, {"_id": 0}).sort(sort_by, direction).skip(skip).limit(per_page).to_list(per_page)

    items = []
    for it in items_raw:
        it = clean(it)
        it["stock_status"] = _stock_status(it.get("current_stock", 0), it.get("minimum_stock", 0))
        # Get primary image
        img = await db.inventory_images.find_one({"item_id": it["id"], "is_primary": True}, {"_id": 0, "data": 0})
        it["primary_image"] = img
        items.append(it)

    # Filter by stock status after computing
    if status:
        items = [i for i in items if i["stock_status"] == status]
        total_count = len(items)

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total_count + per_page - 1) // per_page),
    }


@router.post("/items")
async def create_item(data: StockItemCreate, user=Depends(require_permission("stock_manage"))):
    # Check duplicate code
    existing = await db.inventory_items.find_one({"item_code": data.item_code})
    if existing:
        raise HTTPException(status_code=400, detail=f"Kode barang '{data.item_code}' sudah digunakan")

    doc = data.model_dump()
    doc["id"] = gen_id()
    doc["current_stock"] = data.initial_stock
    doc["stock_in_total"] = 0
    doc["stock_out_total"] = 0
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.inventory_items.insert_one(doc)

    # Create initial stock transaction if initial_stock > 0
    if data.initial_stock > 0:
        tx = {
            "id": gen_id(),
            "item_id": doc["id"],
            "item_name": doc["item_name"],
            "transaction_number": await gen_sequence_number("STK", db.inventory_stock_transactions),
            "transaction_type": "STOCK_IN",
            "quantity": data.initial_stock,
            "stock_before": 0,
            "stock_after": data.initial_stock,
            "reference_id": None,
            "notes": "Stok awal",
            "source": "Stok Awal",
            "created_by": user.get("nama_lengkap"),
            "created_by_id": user["id"],
            "created_at": now_iso(),
        }
        await db.inventory_stock_transactions.insert_one(tx)

    await log_activity(user, "Tambah Barang Persediaan", f"Menambahkan {data.item_name} ({data.item_code})")
    await _check_low_stock(doc)
    doc.pop("_id", None)
    doc["stock_status"] = _stock_status(doc["current_stock"], doc.get("minimum_stock", 0))
    return doc


@router.get("/items/{item_id}")
async def get_item(item_id: str, user=Depends(require_permission("stock_manage"))):
    item = await db.inventory_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    item["stock_status"] = _stock_status(item.get("current_stock", 0), item.get("minimum_stock", 0))
    # Attach images
    imgs = await db.inventory_images.find({"item_id": item_id}, {"_id": 0, "data": 0}).to_list(50)
    item["images"] = imgs
    return item


@router.put("/items/{item_id}")
async def update_item(item_id: str, data: StockItemUpdate, user=Depends(require_permission("stock_manage"))):
    item = await db.inventory_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    if "item_code" in upd and upd["item_code"] != item.get("item_code"):
        dup = await db.inventory_items.find_one({"item_code": upd["item_code"], "id": {"$ne": item_id}})
        if dup:
            raise HTTPException(status_code=400, detail=f"Kode barang '{upd['item_code']}' sudah digunakan")
    upd["updated_at"] = now_iso()
    await db.inventory_items.update_one({"id": item_id}, {"$set": upd})
    await log_activity(user, "Edit Barang Persediaan", f"Mengubah {item.get('item_name')}")
    fresh = await db.inventory_items.find_one({"id": item_id}, {"_id": 0})
    fresh["stock_status"] = _stock_status(fresh.get("current_stock", 0), fresh.get("minimum_stock", 0))

    # Check low stock after editing minimum
    await _check_low_stock(fresh)
    return fresh


@router.delete("/items/{item_id}")
async def delete_item(item_id: str, user=Depends(require_permission("stock_manage"))):
    item = await db.inventory_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    await db.inventory_items.delete_one({"id": item_id})
    await db.inventory_images.delete_many({"item_id": item_id})
    await log_activity(user, "Hapus Barang Persediaan", f"Menghapus {item.get('item_name')}")
    return {"message": "Barang berhasil dihapus"}


# ---- Stock Item Images ----
@router.post("/items/{item_id}/images")
async def upload_item_images(item_id: str, files: list[UploadFile] = File(...), user=Depends(require_permission("stock_manage"))):
    item = await db.inventory_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    existing_count = await db.inventory_images.count_documents({"item_id": item_id})
    created = []
    for idx, f in enumerate(files):
        content = await f.read()
        b64 = base64.b64encode(content).decode("utf-8")
        img_id = gen_id()
        is_primary = (existing_count == 0 and idx == 0)
        doc = {
            "id": img_id, "item_id": item_id, "data": b64,
            "content_type": f.content_type or "image/jpeg",
            "image_name": f.filename or "image.jpg",
            "is_primary": is_primary, "created_at": now_iso(),
        }
        await db.inventory_images.insert_one(doc)
        created.append({k: doc[k] for k in doc if k != "data"})
    await log_activity(user, "Upload Foto Barang", f"Mengunggah {len(files)} foto untuk {item.get('item_name')}")
    imgs = await db.inventory_images.find({"item_id": item_id}, {"_id": 0, "data": 0}).to_list(50)
    return imgs


@router.put("/items/{item_id}/images/{image_id}/primary")
async def set_item_primary_image(item_id: str, image_id: str, user=Depends(require_permission("stock_manage"))):
    img = await db.inventory_images.find_one({"id": image_id, "item_id": item_id})
    if not img:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")
    await db.inventory_images.update_many({"item_id": item_id}, {"$set": {"is_primary": False}})
    await db.inventory_images.update_one({"id": image_id}, {"$set": {"is_primary": True}})
    return await db.inventory_images.find({"item_id": item_id}, {"_id": 0, "data": 0}).to_list(50)


@router.delete("/items/{item_id}/images/{image_id}")
async def delete_item_image(item_id: str, image_id: str, user=Depends(require_permission("stock_manage"))):
    img = await db.inventory_images.find_one({"id": image_id, "item_id": item_id})
    if not img:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")
    await db.inventory_images.delete_one({"id": image_id})
    if img.get("is_primary"):
        nxt = await db.inventory_images.find_one({"item_id": item_id})
        if nxt:
            await db.inventory_images.update_one({"id": nxt["id"]}, {"$set": {"is_primary": True}})
    return await db.inventory_images.find({"item_id": item_id}, {"_id": 0, "data": 0}).to_list(50)


# ---- Barang Masuk (Stock In) ----
@router.post("/transactions/in")
async def stock_in(data: StockInCreate, user=Depends(require_permission("stock_manage"))):
    item = await db.inventory_items.find_one({"id": data.item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Jumlah harus lebih dari 0")

    stock_before = item.get("current_stock", 0)
    stock_after = stock_before + data.quantity

    tx_num = await gen_sequence_number("IN", db.inventory_stock_transactions)
    tx = {
        "id": gen_id(),
        "item_id": data.item_id,
        "item_name": item.get("item_name"),
        "transaction_number": tx_num,
        "transaction_type": "STOCK_IN",
        "quantity": data.quantity,
        "stock_before": stock_before,
        "stock_after": stock_after,
        "reference_id": None,
        "source": data.source,
        "document_number": data.document_number,
        "notes": data.notes,
        "tanggal": data.tanggal or now_iso()[:10],
        "created_by": user.get("nama_lengkap"),
        "created_by_id": user["id"],
        "created_at": now_iso(),
    }
    await db.inventory_stock_transactions.insert_one(tx)
    await db.inventory_items.update_one({"id": data.item_id}, {
        "$set": {"current_stock": stock_after, "updated_at": now_iso()},
        "$inc": {"stock_in_total": data.quantity},
    })

    await log_activity(user, "Barang Masuk", f"Menambahkan {data.quantity} {item.get('unit')} {item.get('item_name')} (Stok: {stock_before} → {stock_after})")

    fresh_item = await db.inventory_items.find_one({"id": data.item_id}, {"_id": 0})
    await _check_low_stock(fresh_item)

    tx.pop("_id", None)
    return tx


# ---- Stock Adjustment ----
@router.post("/adjustments")
async def create_adjustment(data: StockAdjustmentCreate, user=Depends(require_permission("stock_manage"))):
    item = await db.inventory_items.find_one({"id": data.item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    if not data.reason.strip():
        raise HTTPException(status_code=400, detail="Alasan penyesuaian wajib diisi")

    stock_before = item.get("current_stock", 0)
    system_stock = stock_before
    physical_stock = data.physical_stock
    diff = physical_stock - system_stock

    if data.adjustment_type == "Penambahan Stok":
        if diff <= 0:
            diff = abs(physical_stock - system_stock) if physical_stock != system_stock else 0
        tx_type = "ADJUSTMENT_IN"
        stock_after = physical_stock
    elif data.adjustment_type == "Pengurangan Stok":
        tx_type = "ADJUSTMENT_OUT"
        stock_after = physical_stock
    else:
        raise HTTPException(status_code=400, detail="Jenis penyesuaian tidak valid")

    quantity = abs(stock_after - stock_before)
    if quantity == 0:
        raise HTTPException(status_code=400, detail="Tidak ada perubahan stok")

    tx_num = await gen_sequence_number("ADJ", db.inventory_stock_transactions)
    tx = {
        "id": gen_id(),
        "item_id": data.item_id,
        "item_name": item.get("item_name"),
        "transaction_number": tx_num,
        "transaction_type": tx_type,
        "quantity": quantity,
        "stock_before": stock_before,
        "stock_after": stock_after,
        "reference_id": None,
        "reason": data.reason,
        "notes": data.notes,
        "created_by": user.get("nama_lengkap"),
        "created_by_id": user["id"],
        "created_at": now_iso(),
    }
    await db.inventory_stock_transactions.insert_one(tx)

    inc_updates = {}
    if tx_type == "ADJUSTMENT_IN":
        inc_updates["stock_in_total"] = quantity
    else:
        inc_updates["stock_out_total"] = quantity

    await db.inventory_items.update_one({"id": data.item_id}, {
        "$set": {"current_stock": stock_after, "updated_at": now_iso()},
        "$inc": inc_updates,
    })

    await log_activity(user, "Penyesuaian Stok", f"{data.adjustment_type} {item.get('item_name')}: {stock_before} → {stock_after} ({data.reason})")

    fresh_item = await db.inventory_items.find_one({"id": data.item_id}, {"_id": 0})
    await _check_low_stock(fresh_item)

    tx.pop("_id", None)
    return tx


# ---- Riwayat Stock ----
@router.get("/history")
async def stock_history(
    user=Depends(require_permission("stock_manage")),
    item_id: Optional[str] = None,
    tx_type: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    page: int = 1,
    per_page: int = 30,
):
    q = {}
    if item_id:
        q["item_id"] = item_id
    if tx_type:
        q["transaction_type"] = tx_type
    if start:
        q.setdefault("created_at", {})["$gte"] = start
    if end:
        q.setdefault("created_at", {})["$lte"] = end + "T23:59:59"

    total = await db.inventory_stock_transactions.count_documents(q)
    skip = (page - 1) * per_page
    txs = await db.inventory_stock_transactions.find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)

    return {
        "transactions": [clean(t) for t in txs],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


# ---- Stock Check for inventory requests ----
@router.get("/check-availability")
async def check_stock_availability(
    item_name: str,
    quantity: float = 0,
    user=Depends(require_permission("stock_manage")),
):
    """Check if a stock item exists by name and has enough quantity."""
    item = await db.inventory_items.find_one(
        {"item_name": {"$regex": f"^{item_name}$", "$options": "i"}},
        {"_id": 0}
    )
    if not item:
        return {"found": False, "item": None, "sufficient": False}
    sufficient = item.get("current_stock", 0) >= quantity
    item["stock_status"] = _stock_status(item.get("current_stock", 0), item.get("minimum_stock", 0))
    return {"found": True, "item": item, "sufficient": sufficient}
