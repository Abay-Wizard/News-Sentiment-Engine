from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib, secrets
import bcrypt
from jose import JWTError, jwt
from app.core.config import settings


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def now_utc() -> datetime:
    return datetime.now(tz=timezone.utc)


def create_access_token(user_id: str, email: str, role: str) -> str:
    exp = now_utc() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "email": email, "role": role,
         "type": "access", "exp": exp, "iat": now_utc()},
        settings.secret_key, algorithm=settings.jwt_algorithm,
    )


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def decode_access_token(token: str) -> Optional[dict]:
    try:
        p = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return p if p.get("type") == "access" else None
    except JWTError:
        return None
