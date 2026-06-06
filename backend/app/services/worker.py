"""
Background worker — scheduled ingestion only.
Does NOT run on startup. Fires on interval only.
Real-world pattern: app serves data, scheduler handles ingestion.
"""
import asyncio
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)


async def _run_cycle(pool) -> dict:
    from app.scrapers.reuters import ReutersScraper
    from app.scrapers.cnbc import CNBCScraper
    from app.scrapers.yahoo_finance import YahooFinanceScraper
    from app.db.article_queries import (
        insert_article, fetch_unprocessed, mark_processed,
        insert_sentiment, insert_entities,
    )
    from app.nlp.sentiment import analyze
    from app.nlp.entities import extract

    scrapers = [ReutersScraper(), CNBCScraper(), YahooFinanceScraper()]

    results = await asyncio.gather(*[s.run() for s in scrapers], return_exceptions=True)

    stored = skipped = 0
    seen_hashes: set[str] = set()

    async with pool.acquire() as conn:
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Scraper failed: {result}")
                continue
            for art in result:
                d = art.to_dict()
                if d["content_hash"] in seen_hashes:
                    skipped += 1
                    continue
                seen_hashes.add(d["content_hash"])
                aid = await insert_article(conn, d)
                if aid:
                    stored += 1
                else:
                    skipped += 1

    logger.info(f"Ingestion: {stored} new, {skipped} skipped")

    total_processed = 0
    while True:
        async with pool.acquire() as conn:
            batch = await fetch_unprocessed(conn, limit=25)
        if not batch:
            break
        for article in batch:
            try:
                result = await analyze(
                    article["title"],
                    article.get("summary") or "",
                )
                async with pool.acquire() as conn:
                    await insert_sentiment(
                        conn, article["id"],
                        result["label"], result["score"],
                        result["positive_score"],
                        result["negative_score"],
                        result["neutral_score"],
                    )
                    ents = extract(
                        article["title"] + " " + (article.get("summary") or "")
                    )
                    if ents:
                        await insert_entities(conn, article["id"], ents)
                    await mark_processed(conn, article["id"])
                total_processed += 1
            except Exception as e:
                logger.error(f"NLP error on {article['id']}: {e}")
                async with pool.acquire() as conn:
                    await mark_processed(conn, article["id"])

    logger.info(f"NLP: {total_processed} articles analyzed")
    return {"stored": stored, "processed": total_processed}


async def start_worker(pool) -> None:
    """
    Scheduled worker — fires every INGEST_INTERVAL_MINUTES.
    First run is delayed by the full interval, not on startup.
    App starts clean and fast. Data is already in the DB from previous runs.
    """
    interval = settings.ingest_interval_minutes * 60
    logger.info(f"Scheduler ready — first run in {settings.ingest_interval_minutes} minutes.")

    while True:
        await asyncio.sleep(interval)
        try:
            logger.info("Scheduled ingestion starting...")
            stats = await _run_cycle(pool)
            logger.info(f"Scheduled ingestion complete: {stats}")
        except Exception as e:
            logger.error(f"Scheduled ingestion failed: {e}")