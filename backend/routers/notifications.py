from fastapi import APIRouter, Depends
from database import db
from auth import get_current_user
from utils import now_iso, clean

router = APIRouter()


@router.get("/notifications")
async def list_notifications(user=Depends(get_current_user)):
    items = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    unread = await db.notifications.count_documents({"user_id": user["id"], "is_read": False})
    return {"items": items, "unread": unread}


@router.get("/notifications/unread-count")
async def unread_count(user=Depends(get_current_user)):
    unread = await db.notifications.count_documents({"user_id": user["id"], "is_read": False})
    return {"unread": unread}


@router.post("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, user=Depends(get_current_user)):
    await db.notifications.update_one({"id": notif_id, "user_id": user["id"]}, {"$set": {"is_read": True}})
    return {"message": "ok"}


@router.post("/notifications/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"], "is_read": False}, {"$set": {"is_read": True}})
    return {"message": "Semua notifikasi ditandai dibaca"}
