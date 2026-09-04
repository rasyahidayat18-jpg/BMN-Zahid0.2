from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import (get_current_user, hash_password, verify_password,
                  create_access_token, require_permission)
from models import (LoginRequest, UserCreate, UserUpdate, PasswordReset,
                    ProfileUpdate, ChangePassword)
from utils import gen_id, now_iso, log_activity, clean
from rbac import get_permissions

router = APIRouter()


def public_user(u: dict) -> dict:
    u = clean(dict(u))
    u.pop("password", None)
    u["permissions"] = get_permissions(u.get("role", ""))
    return u


@router.post("/auth/login")
async def login(data: LoginRequest):
    ident = data.email.strip().lower()
    user = await db.users.find_one({"$or": [
        {"email": ident}, {"username": data.email.strip()}
    ]}, {"_id": 0})
    if not user or not verify_password(data.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Akun Anda dinonaktifkan. Hubungi administrator.")
    token = create_access_token(user["id"])
    await log_activity(user, "Login", f"{user.get('nama_lengkap')} masuk ke sistem")
    return {"access_token": token, "token_type": "bearer", "user": public_user(user)}


@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)


@router.put("/profile")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    if upd:
        await db.users.update_one({"id": user["id"]}, {"$set": upd})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return public_user(fresh)


@router.post("/profile/change-password")
async def change_password(data: ChangePassword, user=Depends(get_current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not verify_password(data.old_password, full.get("password", "")):
        raise HTTPException(status_code=400, detail="Password lama salah")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password": hash_password(data.new_password)}})
    return {"message": "Password berhasil diubah"}


# ---- Admin user management ----
@router.get("/users")
async def list_users(user=Depends(require_permission("manage_users"))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(1000)
    for u in users:
        u["permissions"] = get_permissions(u.get("role", ""))
    return users


@router.get("/users/options")
async def user_options(user=Depends(get_current_user)):
    """Lightweight list for dropdowns (penanggung jawab, etc)."""
    users = await db.users.find({"is_active": True}, {"_id": 0, "id": 1, "nama_lengkap": 1, "role": 1, "unit": 1}).to_list(1000)
    return users


@router.post("/users")
async def create_user(data: UserCreate, user=Depends(require_permission("manage_users"))):
    email = data.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    if await db.users.find_one({"username": data.username.strip()}):
        raise HTTPException(status_code=400, detail="Username sudah terdaftar")
    doc = data.model_dump()
    doc["email"] = email
    doc["username"] = data.username.strip()
    doc["password"] = hash_password(data.password)
    doc["id"] = gen_id()
    doc["created_at"] = now_iso()
    await db.users.insert_one(doc)
    await log_activity(user, "Tambah User", f"Menambahkan user {data.nama_lengkap} ({data.role})")
    return public_user(doc)


@router.put("/users/{user_id}")
async def update_user(user_id: str, data: UserUpdate, user=Depends(require_permission("manage_users"))):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    if "email" in upd:
        upd["email"] = upd["email"].strip().lower()
        dup = await db.users.find_one({"email": upd["email"], "id": {"$ne": user_id}})
        if dup:
            raise HTTPException(status_code=400, detail="Email sudah digunakan user lain")
    if upd:
        await db.users.update_one({"id": user_id}, {"$set": upd})
    await log_activity(user, "Edit User", f"Mengubah data user {target.get('nama_lengkap')}")
    fresh = await db.users.find_one({"id": user_id}, {"_id": 0})
    return public_user(fresh)


@router.post("/users/{user_id}/reset-password")
async def reset_password(user_id: str, data: PasswordReset, user=Depends(require_permission("manage_users"))):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    await db.users.update_one({"id": user_id}, {"$set": {"password": hash_password(data.new_password)}})
    await log_activity(user, "Reset Password", f"Mereset password user {target.get('nama_lengkap')}")
    return {"message": "Password berhasil direset"}


@router.post("/users/{user_id}/toggle-active")
async def toggle_active(user_id: str, user=Depends(require_permission("manage_users"))):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if target.get("is_super_admin"):
        raise HTTPException(status_code=400, detail="Administrator Utama tidak dapat dinonaktifkan")
    new_state = not target.get("is_active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": new_state}})
    await log_activity(user, "Ubah Status User", f"{'Mengaktifkan' if new_state else 'Menonaktifkan'} user {target.get('nama_lengkap')}")
    return {"message": "Status user diperbarui", "is_active": new_state}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user=Depends(require_permission("manage_users"))):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if target.get("is_super_admin"):
        raise HTTPException(status_code=400, detail="Administrator Utama tidak dapat dihapus")
    await db.users.delete_one({"id": user_id})
    await log_activity(user, "Hapus User", f"Menghapus user {target.get('nama_lengkap')}")
    return {"message": "User berhasil dihapus"}
