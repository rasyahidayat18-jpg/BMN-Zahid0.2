import uuid
from datetime import datetime, timezone
from database import db


def gen_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def clean(doc: dict) -> dict:
    """Remove Mongo _id if present."""
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


async def log_activity(user: dict, action: str, detail: str = ""):
    entry = {
        "id": gen_id(),
        "user_id": user.get("id"),
        "user_name": user.get("nama_lengkap") or user.get("username"),
        "role": user.get("role"),
        "action": action,
        "detail": detail,
        "timestamp": now_iso(),
    }
    await db.activity_logs.insert_one(entry)


async def notify(user_id: str, title: str, message: str, ntype: str = "info", link: str = ""):
    entry = {
        "id": gen_id(),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": ntype,
        "link": link,
        "is_read": False,
        "created_at": now_iso(),
    }
    await db.notifications.insert_one(entry)


async def notify_roles(roles: list, title: str, message: str, ntype: str = "info", link: str = "", exclude_user_id: str = None):
    cursor = db.users.find({"role": {"$in": roles}, "is_active": True}, {"_id": 0, "id": 1})
    async for u in cursor:
        if exclude_user_id and u["id"] == exclude_user_id:
            continue
        await notify(u["id"], title, message, ntype, link)


async def gen_sequence_number(prefix: str, collection) -> str:
    """Generate a sequential number like PREFIX-YYYYMM-0001."""
    now = datetime.now(timezone.utc)
    ym = now.strftime("%Y%m")
    count = await collection.count_documents({}) + 1
    return f"{prefix}-{ym}-{count:04d}"
