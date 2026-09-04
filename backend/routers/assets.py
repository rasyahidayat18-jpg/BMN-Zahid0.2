import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import Response
from typing import Optional
from database import db
from auth import get_current_user, require_permission
from models import AssetCreate, AssetUpdate, ResponsibleAssign
from utils import gen_id, now_iso, log_activity, clean
import rbac

router = APIRouter()


async def _attach_meta(asset: dict) -> dict:
    asset = clean(dict(asset))
    imgs = await db.asset_images.find({"asset_id": asset["id"]}, {"_id": 0, "data": 0}).to_list(50)
    asset["images"] = imgs
    asset["image_count"] = len(imgs)
    return asset


@router.get("/assets")
async def list_assets(
    user=Depends(require_permission("asset_view")),
    search: Optional[str] = None,
    kondisi: Optional[str] = None,
    lokasi: Optional[str] = None,
    jenis_aset: Optional[str] = None,
    only_mine: bool = False,
):
    q = {}
    if search:
        q["$or"] = [
            {"nama_barang": {"$regex": search, "$options": "i"}},
            {"kode_barang": {"$regex": search, "$options": "i"}},
            {"nup": {"$regex": search, "$options": "i"}},
            {"merk_tipe": {"$regex": search, "$options": "i"}},
            {"nomor_polisi": {"$regex": search, "$options": "i"}},
        ]
    if kondisi:
        q["kondisi"] = kondisi
    if lokasi:
        q["lokasi"] = lokasi
    if jenis_aset:
        q["jenis_aset"] = jenis_aset
    # PJ Kendaraan can only view own vehicles
    if user["role"] == rbac.PJ_KENDARAAN or only_mine:
        q["penanggung_jawab_id"] = user["id"]
    assets = await db.assets.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    result = []
    for a in assets:
        result.append(await _attach_meta(a))
    return result


@router.get("/assets/{asset_id}")
async def get_asset(asset_id: str, user=Depends(get_current_user)):
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Aset tidak ditemukan")
    return await _attach_meta(asset)


@router.post("/assets")
async def create_asset(data: AssetCreate, user=Depends(require_permission("asset_manage"))):
    doc = data.model_dump()
    doc["id"] = gen_id()
    doc["primary_image_id"] = None
    doc["responsible_history"] = []
    if doc.get("penanggung_jawab"):
        doc["responsible_history"].append({
            "penanggung_jawab": doc["penanggung_jawab"],
            "penanggung_jawab_id": doc.get("penanggung_jawab_id"),
            "tanggal": now_iso(), "oleh": user.get("nama_lengkap"), "catatan": "Penetapan awal",
        })
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.assets.insert_one(doc)
    await log_activity(user, "Tambah Aset", f"Menambahkan aset {data.nama_barang}")
    return await _attach_meta(doc)


@router.put("/assets/{asset_id}")
async def update_asset(asset_id: str, data: AssetUpdate, user=Depends(require_permission("asset_manage"))):
    asset = await db.assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Aset tidak ditemukan")
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    upd["updated_at"] = now_iso()
    await db.assets.update_one({"id": asset_id}, {"$set": upd})
    await log_activity(user, "Edit Aset", f"Mengubah aset {asset.get('nama_barang')}")
    fresh = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    return await _attach_meta(fresh)


@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, user=Depends(require_permission("asset_manage"))):
    asset = await db.assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Aset tidak ditemukan")
    await db.assets.delete_one({"id": asset_id})
    await db.asset_images.delete_many({"asset_id": asset_id})
    await log_activity(user, "Hapus Aset", f"Menghapus aset {asset.get('nama_barang')}")
    return {"message": "Aset berhasil dihapus"}


# ---- Images ----
@router.post("/assets/{asset_id}/images")
async def upload_asset_images(asset_id: str, files: list[UploadFile] = File(...), user=Depends(require_permission("asset_manage"))):
    asset = await db.assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Aset tidak ditemukan")
    existing_count = await db.asset_images.count_documents({"asset_id": asset_id})
    created = []
    for idx, f in enumerate(files):
        content = await f.read()
        b64 = base64.b64encode(content).decode("utf-8")
        img_id = gen_id()
        is_primary = (existing_count == 0 and idx == 0)
        doc = {
            "id": img_id, "asset_id": asset_id, "data": b64,
            "content_type": f.content_type or "image/jpeg",
            "image_name": f.filename or "image.jpg",
            "is_primary": is_primary, "created_at": now_iso(),
        }
        await db.asset_images.insert_one(doc)
        if is_primary:
            await db.assets.update_one({"id": asset_id}, {"$set": {"primary_image_id": img_id}})
        created.append({k: doc[k] for k in doc if k != "data"})
    await log_activity(user, "Upload Foto Aset", f"Mengunggah {len(files)} foto untuk aset {asset.get('nama_barang')}")
    imgs = await db.asset_images.find({"asset_id": asset_id}, {"_id": 0, "data": 0}).to_list(50)
    return imgs


@router.put("/assets/{asset_id}/images/{image_id}/primary")
async def set_primary_image(asset_id: str, image_id: str, user=Depends(require_permission("asset_manage"))):
    img = await db.asset_images.find_one({"id": image_id, "asset_id": asset_id})
    if not img:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")
    await db.asset_images.update_many({"asset_id": asset_id}, {"$set": {"is_primary": False}})
    await db.asset_images.update_one({"id": image_id}, {"$set": {"is_primary": True}})
    await db.assets.update_one({"id": asset_id}, {"$set": {"primary_image_id": image_id}})
    await log_activity(user, "Ubah Foto Utama", f"Mengubah foto utama aset")
    imgs = await db.asset_images.find({"asset_id": asset_id}, {"_id": 0, "data": 0}).to_list(50)
    return imgs


@router.delete("/assets/{asset_id}/images/{image_id}")
async def delete_asset_image(asset_id: str, image_id: str, user=Depends(require_permission("asset_manage"))):
    img = await db.asset_images.find_one({"id": image_id, "asset_id": asset_id})
    if not img:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")
    await db.asset_images.delete_one({"id": image_id})
    if img.get("is_primary"):
        nxt = await db.asset_images.find_one({"asset_id": asset_id})
        new_primary = nxt["id"] if nxt else None
        if nxt:
            await db.asset_images.update_one({"id": nxt["id"]}, {"$set": {"is_primary": True}})
        await db.assets.update_one({"id": asset_id}, {"$set": {"primary_image_id": new_primary}})
    await log_activity(user, "Hapus Foto Aset", "Menghapus foto aset")
    imgs = await db.asset_images.find({"asset_id": asset_id}, {"_id": 0, "data": 0}).to_list(50)
    return imgs


# ---- Responsible (Penanggung Jawab) ----
@router.get("/responsibles")
async def list_responsibles(user=Depends(require_permission("asset_view"))):
    q = {}
    if user["role"] == rbac.PJ_KENDARAAN:
        q["penanggung_jawab_id"] = user["id"]
    assets = await db.assets.find(q, {"_id": 0}).to_list(2000)
    return [await _attach_meta(a) for a in assets]


@router.post("/assets/{asset_id}/responsible")
async def assign_responsible(asset_id: str, data: ResponsibleAssign, user=Depends(require_permission("responsible_manage"))):
    asset = await db.assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Aset tidak ditemukan")
    hist = asset.get("responsible_history", [])
    hist.append({
        "penanggung_jawab": data.penanggung_jawab,
        "penanggung_jawab_id": data.penanggung_jawab_id,
        "tanggal": now_iso(), "oleh": user.get("nama_lengkap"), "catatan": data.catatan,
    })
    await db.assets.update_one({"id": asset_id}, {"$set": {
        "penanggung_jawab": data.penanggung_jawab,
        "penanggung_jawab_id": data.penanggung_jawab_id,
        "responsible_history": hist, "updated_at": now_iso(),
    }})
    await log_activity(user, "Tetapkan Penanggung Jawab", f"Menetapkan {data.penanggung_jawab} untuk aset {asset.get('nama_barang')}")
    fresh = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    return await _attach_meta(fresh)


# ---- Image serving (public read of stored image bytes) ----
image_router = APIRouter()


@image_router.get("/images/{image_id}")
async def serve_image(image_id: str):
    img = await db.asset_images.find_one({"id": image_id})
    if not img:
        img = await db.maintenance_images.find_one({"id": image_id})
    if not img:
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan")
    raw = base64.b64decode(img["data"])
    return Response(content=raw, media_type=img.get("content_type", "image/jpeg"),
                    headers={"Cache-Control": "public, max-age=86400"})
