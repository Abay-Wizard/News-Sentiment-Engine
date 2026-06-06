from typing import Optional
from datetime import datetime, timedelta, timezone
from app.core.security import hash_token


async def get_by_email(conn, email: str) -> Optional[dict]:
    r = await conn.fetchrow(
        "SELECT id::text,email,username,password_hash,full_name,is_active,role,created_at,last_login_at FROM users WHERE email=$1",
        email.lower().strip())
    return dict(r) if r else None


async def get_by_username(conn, username: str) -> Optional[dict]:
    r = await conn.fetchrow(
        "SELECT id::text,email,username,password_hash,full_name,is_active,role,created_at,last_login_at FROM users WHERE username=$1",
        username.lower().strip())
    return dict(r) if r else None


async def get_by_id(conn, user_id: str) -> Optional[dict]:
    r = await conn.fetchrow(
        "SELECT id::text,email,username,full_name,is_active,role,created_at,last_login_at FROM users WHERE id=$1",
        user_id)
    return dict(r) if r else None


async def create(conn, email: str, username: str, password_hash: str, full_name: Optional[str]) -> dict:
    r = await conn.fetchrow("""
        INSERT INTO users (email,username,password_hash,full_name)
        VALUES ($1,$2,$3,$4)
        RETURNING id::text,email,username,full_name,is_active,role,created_at
    """, email.lower().strip(), username.lower().strip(), password_hash, full_name)
    return dict(r)


async def touch_login(conn, user_id: str) -> None:
    await conn.execute("UPDATE users SET last_login_at=NOW() WHERE id=$1", user_id)


async def email_exists(conn, email: str) -> bool:
    return bool(await conn.fetchval("SELECT 1 FROM users WHERE email=$1", email.lower().strip()))


async def username_exists(conn, username: str) -> bool:
    return bool(await conn.fetchval("SELECT 1 FROM users WHERE username=$1", username.lower().strip()))


# ── Refresh tokens ──────────────────────────────────────────────────────────────

async def store_refresh_token(conn, user_id: str, raw: str, days: int,
                               ua: Optional[str] = None, ip: Optional[str] = None) -> None:
    exp = datetime.now(tz=timezone.utc) + timedelta(days=days)
    await conn.execute("""
        INSERT INTO refresh_tokens (user_id,token_hash,expires_at,user_agent,ip_address)
        VALUES ($1,$2,$3,$4,$5)
    """, user_id, hash_token(raw), exp, ua, ip)


async def get_refresh_token(conn, raw: str) -> Optional[dict]:
    r = await conn.fetchrow("""
        SELECT rt.user_id::text,rt.expires_at,rt.revoked_at,u.is_active,u.role,u.email,u.username
        FROM refresh_tokens rt JOIN users u ON u.id=rt.user_id
        WHERE rt.token_hash=$1
    """, hash_token(raw))
    return dict(r) if r else None


async def revoke_refresh_token(conn, raw: str) -> None:
    await conn.execute(
        "UPDATE refresh_tokens SET revoked_at=NOW() WHERE token_hash=$1", hash_token(raw))


# ── Watchlist ───────────────────────────────────────────────────────────────────

async def get_watchlist(conn, user_id: str) -> list[dict]:
    rows = await conn.fetch(
        "SELECT ticker,entity_name,added_at FROM watchlist WHERE user_id=$1 ORDER BY added_at DESC",
        user_id)
    return [dict(r) for r in rows]


async def add_to_watchlist(conn, user_id: str, ticker: str, entity_name: str) -> dict:
    r = await conn.fetchrow("""
        INSERT INTO watchlist (user_id,ticker,entity_name)
        VALUES ($1,$2,$3)
        ON CONFLICT (user_id,ticker) DO NOTHING
        RETURNING ticker,entity_name,added_at
    """, user_id, ticker.upper(), entity_name)
    return dict(r) if r else {}


async def remove_from_watchlist(conn, user_id: str, ticker: str) -> None:
    await conn.execute(
        "DELETE FROM watchlist WHERE user_id=$1 AND ticker=$2", user_id, ticker.upper())
