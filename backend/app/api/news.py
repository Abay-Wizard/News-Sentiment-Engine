import json
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.database import get_conn, get_pool
from app.core.deps import current_user
from app.db.article_queries import fetch_articles, count_articles
from app.schemas.articles import ArticleOut, ArticlesResponse
from app.services.worker import _run_cycle

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/", response_model=ArticlesResponse)
async def list_articles(
    source: Optional[str]    = Query(None),
    sentiment: Optional[str] = Query(None, enum=["positive", "negative", "neutral"]),
    ticker: Optional[str]    = Query(None),
    search: Optional[str]    = Query(None, description="Full-text search"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str]   = Query(None),
    page: int  = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    conn=Depends(get_conn),
    _user=Depends(current_user),
):
    offset = (page - 1) * limit
    rows = await fetch_articles(
        conn, source=source, sentiment=sentiment, ticker=ticker,
        search=search, date_from=date_from, date_to=date_to,
        limit=limit, offset=offset,
    )
    total = await count_articles(conn, source=source, sentiment=sentiment, search=search)

    articles = []
    for row in rows:
        row = dict(row)
        ents = row.get("entities") or []
        if isinstance(ents, str):
            try:
                ents = json.loads(ents)
            except Exception:
                ents = []
        row["entities"] = ents
        articles.append(ArticleOut(**row))

    return ArticlesResponse(total=total, page=page, limit=limit, articles=articles)


@router.post("/ingest")
async def trigger_ingest(_user=Depends(current_user)):
    """Manually trigger a scrape + full sentiment cycle."""
    pool = await get_pool()
    stats = await _run_cycle(pool)
    return stats
