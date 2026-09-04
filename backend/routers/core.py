from fastapi import APIRouter, Depends
from typing import Optional
from database import db
from auth import get_current_user, require_permission
from utils import clean
import rbac

router = APIRouter()


@router.get("/meta/roles")
async def list_roles(user=Depends(get_current_user)):
    return [{"name": r, "description": rbac.ROLE_DESCRIPTIONS.get(r, ""), "permissions": rbac.get_permissions(r)} for r in rbac.ALL_ROLES]


@router.get("/meta/locations")
async def list_locations(user=Depends(get_current_user)):
    locs = await db.asset_locations.find({}, {"_id": 0}).to_list(100)
    return locs


@router.get("/audit-logs")
async def audit_logs(user=Depends(require_permission("audit_view")), search: Optional[str] = None, limit: int = 300):
    q = {}
    if search:
        q["$or"] = [
            {"user_name": {"$regex": search, "$options": "i"}},
            {"action": {"$regex": search, "$options": "i"}},
            {"detail": {"$regex": search, "$options": "i"}},
        ]
    logs = await db.activity_logs.find(q, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return logs


@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    perms = user["permissions"]
    is_admin_view = "maintenance_view_all" in perms or "asset_manage" in perms

    # Asset stats (respect PJ kendaraan scoping)
    asset_q = {}
    if user["role"] == rbac.PJ_KENDARAAN:
        asset_q["penanggung_jawab_id"] = user["id"]
    total_aset = await db.assets.count_documents(asset_q)
    total_kendaraan = await db.assets.count_documents({**asset_q, "jenis_aset": "Kendaraan"})
    total_bergerak = total_kendaraan
    baik = await db.assets.count_documents({**asset_q, "kondisi": "Baik"})
    rusak_ringan = await db.assets.count_documents({**asset_q, "kondisi": "Rusak Ringan"})
    rusak_berat = await db.assets.count_documents({**asset_q, "kondisi": "Rusak Berat"})

    # Maintenance stats
    maint_menunggu = await db.maintenance_requests.count_documents({"status": {"$regex": "^Menunggu"}})
    kendaraan_pemeliharaan = await db.maintenance_requests.count_documents({"status": "Sedang Dalam Pemeliharaan"})

    # Inventory stats
    inv_menunggu = await db.inventory_requests.count_documents({"status": "Menunggu Approval"})
    inv_disetujui = await db.inventory_requests.count_documents({"status": {"$in": ["Disetujui", "Sedang Diproses", "Barang Diserahkan", "Selesai"]}})

    stats = {
        "total_aset": total_aset,
        "total_aset_bergerak": total_bergerak,
        "total_kendaraan": total_kendaraan,
        "aset_baik": baik,
        "aset_rusak_ringan": rusak_ringan,
        "aset_rusak_berat": rusak_berat,
        "kendaraan_pemeliharaan": kendaraan_pemeliharaan,
        "pemeliharaan_menunggu": maint_menunggu,
        "permintaan_menunggu": inv_menunggu,
        "permintaan_disetujui": inv_disetujui,
    }

    # Condition chart
    kondisi_chart = [
        {"name": "Baik", "value": baik, "fill": "#16a34a"},
        {"name": "Rusak Ringan", "value": rusak_ringan, "fill": "#d97706"},
        {"name": "Rusak Berat", "value": rusak_berat, "fill": "#dc2626"},
    ]

    # Inventory per month (last 6 months)
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        m = (now.month - i - 1) % 12 + 1
        y = now.year + ((now.month - i - 1) // 12)
        key = f"{y:04d}-{m:02d}"
        label = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][m-1]
        months.append((key, label))
    inv_all = await db.inventory_requests.find({}, {"_id": 0, "created_at": 1}).to_list(5000)
    per_month = {k: 0 for k, _ in months}
    for r in inv_all:
        ca = (r.get("created_at") or "")[:7]
        if ca in per_month:
            per_month[ca] += 1
    permintaan_chart = [{"name": lbl, "jumlah": per_month[k]} for k, lbl in months]

    # Recent activity / requests / notifications / approval queue
    recent_activity = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(6) if is_admin_view else []
    recent_maint = await db.maintenance_requests.find({}, {"_id": 0, "approvals": 0, "comments": 0, "history": 0}).sort("created_at", -1).to_list(5)
    recent_inv = await db.inventory_requests.find({}, {"_id": 0, "comments": 0, "history": 0}).sort("created_at", -1).to_list(5)
    recent_notif = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(5)

    # Approval queue relevant to this user
    approval_queue = []
    if "maintenance_approve_1" in perms:
        approval_queue = await db.maintenance_requests.find({"status": "Menunggu Approval Tingkat 1"}, {"_id": 0, "approvals": 0, "comments": 0, "history": 0}).sort("created_at", -1).to_list(10)
    elif "maintenance_approve_2" in perms:
        approval_queue = await db.maintenance_requests.find({"status": "Menunggu Approval Tingkat 2"}, {"_id": 0, "approvals": 0, "comments": 0, "history": 0}).sort("created_at", -1).to_list(10)
    elif "maintenance_approve_3" in perms:
        approval_queue = await db.maintenance_requests.find({"status": "Menunggu Approval Tingkat 3"}, {"_id": 0, "approvals": 0, "comments": 0, "history": 0}).sort("created_at", -1).to_list(10)

    return {
        "stats": stats,
        "kondisi_chart": kondisi_chart,
        "permintaan_chart": permintaan_chart,
        "recent_activity": recent_activity,
        "recent_maintenance": recent_maint,
        "recent_inventory": recent_inv,
        "recent_notifications": recent_notif,
        "approval_queue": approval_queue,
    }
