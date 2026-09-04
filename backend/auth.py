import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import db
from rbac import get_permissions, has_permission

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALGO = "HS256"
TOKEN_EXPIRE_HOURS = 24 * 7

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if creds is None:
        raise HTTPException(status_code=401, detail="Tidak terautentikasi")
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesi telah berakhir, silakan login kembali")
    except Exception:
        raise HTTPException(status_code=401, detail="Token tidak valid")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Akun Anda dinonaktifkan. Hubungi administrator.")
    user["permissions"] = get_permissions(user.get("role", ""))
    user.pop("password", None)
    return user


def require_permission(permission: str):
    async def checker(user=Depends(get_current_user)):
        if not has_permission(user.get("role", ""), permission):
            raise HTTPException(status_code=403, detail="Anda tidak memiliki hak akses untuk aksi ini")
        return user
    return checker


def require_any_permission(*permissions):
    async def checker(user=Depends(get_current_user)):
        role = user.get("role", "")
        if not any(has_permission(role, p) for p in permissions):
            raise HTTPException(status_code=403, detail="Anda tidak memiliki hak akses untuk aksi ini")
        return user
    return checker
