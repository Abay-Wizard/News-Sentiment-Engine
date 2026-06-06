import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db, get_pool
from app.core.logging import setup_logging
from app.api import auth, news, sentiment, watchlist, health

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} [{settings.environment}]")
    await init_db()

    # Start the single background worker
    from app.services.worker import start_worker
    pool = await get_pool()
    worker_task = asyncio.create_task(start_worker(pool))

    yield

    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass
    await close_db()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="NSE · News Sentiment Engine",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,     prefix="/api/v1")
app.include_router(auth.router,       prefix="/api/v1")
app.include_router(news.router,       prefix="/api/v1")
app.include_router(sentiment.router,  prefix="/api/v1")
app.include_router(watchlist.router,  prefix="/api/v1")


@app.get("/")
async def root():
    return {"name": settings.app_name, "version": "3.0.0", "docs": "/docs"}
