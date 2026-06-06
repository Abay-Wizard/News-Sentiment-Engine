import asyncpg
import ssl
from typing import Optional
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
_pool: Optional[asyncpg.Pool] = None


def _dsn() -> str:
    return settings.database_url.replace("postgresql+asyncpg://", "postgresql://")


async def init_db() -> None:
    global _pool
    logger.info("Connecting to Neon PostgreSQL...")
    ctx = ssl.create_default_context()
    _pool = await asyncpg.create_pool(
        dsn=_dsn(), min_size=1, max_size=5,
        command_timeout=30, ssl=ctx,
        max_inactive_connection_lifetime=300,
    )
    # Verify
    async with _pool.acquire() as c:
        v = await c.fetchval("SELECT version()")
        logger.info(f"Connected: PostgreSQL {v.split()[1]}")


async def close_db() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def get_pool() -> asyncpg.Pool:
    if not _pool:
        raise RuntimeError("DB pool not initialised")
    return _pool


async def get_conn():
    """FastAPI dependency."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
