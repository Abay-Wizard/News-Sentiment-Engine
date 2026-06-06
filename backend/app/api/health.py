from fastapi import APIRouter, Depends
from app.core.database import get_conn
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health(conn=Depends(get_conn)):
    v = await conn.fetchval("SELECT version()")
    return {"status": "ok", "app": settings.app_name,
            "env": settings.environment, "db": v.split()[1] if v else "unknown"}


@router.get("/ping")
async def ping():
    return {"pong": True}
