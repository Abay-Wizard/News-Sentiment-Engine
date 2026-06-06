from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, status, HTTPException
from app.core.database import get_conn
from app.core.deps import current_user
from app.core.security import (hash_password, verify_password,
                                create_access_token, create_refresh_token)
from app.core.config import settings
from app.db import user_queries
from app.schemas.auth import (RegisterRequest, LoginRequest, RefreshRequest,
                               LogoutRequest, TokenResponse, AccessTokenResponse, UserOut)

router = APIRouter(prefix="/auth", tags=["auth"])


def _make_tokens(user: dict) -> dict:
    return {
        "access_token": create_access_token(user["id"], user["email"], user["role"]),
        "refresh_token": create_refresh_token(),
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": user,
    }


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, conn=Depends(get_conn)):
    if await user_queries.email_exists(conn, body.email):
        raise HTTPException(409, "Email already registered")
    if await user_queries.username_exists(conn, body.username):
        raise HTTPException(409, "Username already taken")

    user = await user_queries.create(
        conn, body.email, body.username,
        hash_password(body.password), body.full_name)

    tokens = _make_tokens(user)
    await user_queries.store_refresh_token(
        conn, user["id"], tokens["refresh_token"],
        settings.refresh_token_expire_days)
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request, conn=Depends(get_conn)):
    # Accept email or username
    user = (await user_queries.get_by_email(conn, body.email)
            if "@" in body.email
            else await user_queries.get_by_username(conn, body.email)
               or await user_queries.get_by_email(conn, body.email))

    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    if not user["is_active"]:
        raise HTTPException(403, "Account deactivated")

    tokens = _make_tokens(user)
    ua = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    await user_queries.store_refresh_token(
        conn, user["id"], tokens["refresh_token"],
        settings.refresh_token_expire_days, ua, ip)
    await user_queries.touch_login(conn, user["id"])
    return tokens


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest, conn=Depends(get_conn)):
    rec = await user_queries.get_refresh_token(conn, body.refresh_token)
    if not rec:
        raise HTTPException(401, "Invalid refresh token")
    if rec["revoked_at"]:
        raise HTTPException(401, "Token revoked")
    exp = rec["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if datetime.now(tz=timezone.utc) > exp:
        raise HTTPException(401, "Token expired")

    # Rotate
    await user_queries.revoke_refresh_token(conn, body.refresh_token)
    new_refresh = create_refresh_token()
    await user_queries.store_refresh_token(
        conn, rec["user_id"], new_refresh, settings.refresh_token_expire_days)

    return {
        "access_token": create_access_token(rec["user_id"], rec["email"], rec["role"]),
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
    }


@router.post("/logout", status_code=204)
async def logout(body: LogoutRequest, user=Depends(current_user), conn=Depends(get_conn)):
    if body.refresh_token:
        await user_queries.revoke_refresh_token(conn, body.refresh_token)


@router.get("/me", response_model=UserOut)
async def me(user=Depends(current_user)):
    return UserOut(**user)
