"""
All article-related SQL lives here.
Every query uses COALESCE(published_at, fetched_at) so articles
with null published_at (common with live RSS) always appear.
"""
from typing import Optional


# ── Time expression reused in every query ──────────────────────────────────────
# Falls back to fetched_at when published_at is null
_TIME = "COALESCE(a.published_at, a.fetched_at)"


async def insert_article(conn, data: dict) -> Optional[str]:
    r = await conn.fetchrow("""
        INSERT INTO articles (title,url,summary,source,author,published_at,content_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT DO NOTHING
        RETURNING id::text
    """, data["title"], data["url"], data.get("summary"),
        data["source"], data.get("author"), data.get("published_at"), data["content_hash"])
    return r["id"] if r else None


async def fetch_articles(conn, source=None, sentiment=None, ticker=None,
                         search=None, date_from=None, date_to=None,
                         limit=20, offset=0) -> list[dict]:
    conds, params, i = ["1=1"], [], 1

    if source:
        conds.append(f"a.source=${i}"); params.append(source); i += 1
    if sentiment:
        conds.append(f"sr.label=${i}"); params.append(sentiment); i += 1
    if ticker:
        conds.append(
            f"EXISTS(SELECT 1 FROM article_entities ae "
            f"WHERE ae.article_id=a.id AND ae.ticker=${i})")
        params.append(ticker.upper()); i += 1
    if search:
        conds.append(
            f"to_tsvector('english', a.title || ' ' || COALESCE(a.summary,'')) "
            f"@@ plainto_tsquery('english', ${i})")
        params.append(search); i += 1
    if date_from:
        conds.append(f"{_TIME} >= ${i}"); params.append(date_from); i += 1
    if date_to:
        conds.append(f"{_TIME} <= ${i}"); params.append(date_to); i += 1

    params.extend([limit, offset])

    rows = await conn.fetch(f"""
        SELECT a.id::text, a.title, a.url, a.summary, a.source, a.author,
               a.published_at, a.fetched_at, a.is_processed,
               sr.label  AS sentiment_label,
               sr.score  AS sentiment_score,
               sr.positive_score, sr.negative_score, sr.neutral_score,
               COALESCE(
                   json_agg(
                       json_build_object('name', ae.entity_name, 'ticker', ae.ticker)
                   ) FILTER (WHERE ae.id IS NOT NULL),
                   '[]'::json
               ) AS entities
        FROM articles a
        LEFT JOIN sentiment_results sr ON sr.article_id = a.id
        LEFT JOIN article_entities  ae ON ae.article_id = a.id
        WHERE {' AND '.join(conds)}
        GROUP BY a.id, sr.label, sr.score, sr.positive_score, sr.negative_score, sr.neutral_score
        ORDER BY {_TIME} DESC NULLS LAST
        LIMIT ${i} OFFSET ${i+1}
    """, *params)

    return [dict(r) for r in rows]


async def count_articles(conn, source=None, sentiment=None, search=None) -> int:
    conds, params, i = ["1=1"], [], 1
    if source:
        conds.append(f"a.source=${i}"); params.append(source); i += 1
    if sentiment:
        conds.append(f"sr.label=${i}"); params.append(sentiment); i += 1
    if search:
        conds.append(
            f"to_tsvector('english', a.title || ' ' || COALESCE(a.summary,'')) "
            f"@@ plainto_tsquery('english', ${i})")
        params.append(search); i += 1
    return await conn.fetchval(f"""
        SELECT COUNT(*)
        FROM articles a
        LEFT JOIN sentiment_results sr ON sr.article_id = a.id
        WHERE {' AND '.join(conds)}
    """, *params)


async def fetch_unprocessed(conn, limit: int = 30) -> list[dict]:
    rows = await conn.fetch(
        "SELECT id::text, title, summary FROM articles WHERE is_processed=FALSE LIMIT $1",
        limit)
    return [dict(r) for r in rows]


async def mark_processed(conn, article_id: str) -> None:
    await conn.execute("UPDATE articles SET is_processed=TRUE WHERE id=$1", article_id)


async def insert_sentiment(conn, article_id: str, label: str, score: float,
                           pos: float, neg: float, neu: float) -> None:
    await conn.execute("""
        INSERT INTO sentiment_results
            (article_id, label, score, positive_score, negative_score, neutral_score)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (article_id) DO UPDATE SET
            label=EXCLUDED.label, score=EXCLUDED.score,
            positive_score=EXCLUDED.positive_score,
            negative_score=EXCLUDED.negative_score,
            neutral_score=EXCLUDED.neutral_score,
            analyzed_at=NOW()
    """, article_id, label, score, pos, neg, neu)


async def insert_entities(conn, article_id: str, entities: list[dict]) -> None:
    for e in entities:
        await conn.execute("""
            INSERT INTO article_entities (article_id,entity_name,ticker,entity_type,mention_count)
            VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING
        """, article_id, e["name"], e.get("ticker"), e.get("type", "company"), e.get("count", 1))


# ── Analytics queries ───────────────────────────────────────────────────────────

# Uses a 7-day window so there's always data even on a fresh install
_WINDOW_7D = f"({_TIME} >= NOW() - INTERVAL '7 days' OR {_TIME} IS NULL) AND a.fetched_at >= NOW() - INTERVAL '7 days'"
_WINDOW_2D = f"({_TIME} >= NOW() - INTERVAL '48 hours' OR {_TIME} IS NULL) AND a.fetched_at >= NOW() - INTERVAL '48 hours'"


async def sentiment_summary(conn) -> dict:
    r = await conn.fetchrow(f"""
        SELECT
            COUNT(*)                                          AS total,
            COUNT(*) FILTER (WHERE sr.label='positive')      AS positive,
            COUNT(*) FILTER (WHERE sr.label='negative')      AS negative,
            COUNT(*) FILTER (WHERE sr.label='neutral')       AS neutral,
            ROUND(AVG(sr.score)::numeric, 3)                 AS avg_score,
            -- momentum: compare last 6h vs 6h before that
            COUNT(*) FILTER (WHERE sr.label='positive'
                AND a.fetched_at >= NOW()-INTERVAL '6 hours') AS pos_recent,
            COUNT(*) FILTER (WHERE sr.label='positive'
                AND a.fetched_at BETWEEN NOW()-INTERVAL '12 hours'
                                     AND NOW()-INTERVAL '6 hours')  AS pos_prev
        FROM articles a
        JOIN sentiment_results sr ON sr.article_id = a.id
        WHERE {_WINDOW_7D}
    """)
    return dict(r) if r else {}


async def sentiment_trend(conn, hours: int = 24) -> list[dict]:
    rows = await conn.fetch(f"""
        SELECT
            DATE_TRUNC('hour', COALESCE(a.published_at, a.fetched_at)) AS hour,
            COUNT(*)                                                     AS total,
            COUNT(*) FILTER (WHERE sr.label='positive')                 AS positive,
            COUNT(*) FILTER (WHERE sr.label='negative')                 AS negative,
            COUNT(*) FILTER (WHERE sr.label='neutral')                  AS neutral,
            ROUND(AVG(sr.score)::numeric, 3)                            AS avg_score
        FROM articles a
        JOIN sentiment_results sr ON sr.article_id = a.id
        WHERE (
            a.published_at >= NOW() - ($1 || ' hours')::interval
            OR a.published_at IS NULL
        )
        AND a.fetched_at >= NOW() - ($1 || ' hours')::interval
        GROUP BY DATE_TRUNC('hour', COALESCE(a.published_at, a.fetched_at))
        ORDER BY hour ASC
    """, str(hours))
    return [dict(r) for r in rows]


async def top_entities(conn, limit: int = 10) -> list[dict]:
    rows = await conn.fetch(f"""
        SELECT
            ae.entity_name, ae.ticker, ae.entity_type,
            SUM(ae.mention_count)                             AS total_mentions,
            COUNT(DISTINCT ae.article_id)                     AS article_count,
            COUNT(*) FILTER (WHERE sr.label='positive')       AS positive_count,
            COUNT(*) FILTER (WHERE sr.label='negative')       AS negative_count,
            COUNT(*) FILTER (WHERE sr.label='neutral')        AS neutral_count
        FROM article_entities ae
        JOIN articles a ON a.id = ae.article_id
        LEFT JOIN sentiment_results sr ON sr.article_id = ae.article_id
        WHERE {_WINDOW_2D}
        GROUP BY ae.entity_name, ae.ticker, ae.entity_type
        ORDER BY total_mentions DESC
        LIMIT $1
    """, limit)
    return [dict(r) for r in rows]


async def source_comparison(conn) -> list[dict]:
    rows = await conn.fetch(f"""
        SELECT
            a.source,
            COUNT(*)                                          AS total_articles,
            COUNT(*) FILTER (WHERE sr.label='positive')      AS positive,
            COUNT(*) FILTER (WHERE sr.label='negative')      AS negative,
            COUNT(*) FILTER (WHERE sr.label='neutral')       AS neutral,
            ROUND(AVG(sr.score)::numeric, 3)                 AS avg_score
        FROM articles a
        LEFT JOIN sentiment_results sr ON sr.article_id = a.id
        WHERE {_WINDOW_2D}
        GROUP BY a.source
        ORDER BY total_articles DESC
    """)
    return [dict(r) for r in rows]


async def dashboard_stats(conn) -> dict:
    r = await conn.fetchrow("""
        SELECT
            (SELECT COUNT(*) FROM articles
             WHERE fetched_at >= NOW()-INTERVAL '24 hours')   AS articles_today,
            (SELECT COUNT(*) FROM articles)                   AS articles_total,
            (SELECT COUNT(*) FROM sentiment_results)          AS analyzed_total,
            (SELECT COUNT(DISTINCT source) FROM articles)     AS sources_count,
            (SELECT COUNT(*) FROM articles WHERE is_processed=FALSE) AS pending
    """)
    return dict(r) if r else {}


async def watchlist_sentiment(conn, user_id: str) -> list[dict]:
    """Sentiment for each ticker in the user's watchlist."""
    rows = await conn.fetch(f"""
        SELECT
            w.ticker, w.entity_name, w.added_at,
            COUNT(ae.id)                                       AS mentions,
            COUNT(*) FILTER (WHERE sr.label='positive')        AS positive,
            COUNT(*) FILTER (WHERE sr.label='negative')        AS negative,
            COUNT(*) FILTER (WHERE sr.label='neutral')         AS neutral,
            ROUND(AVG(sr.score)::numeric, 3)                   AS avg_score
        FROM watchlist w
        LEFT JOIN article_entities ae ON ae.ticker = w.ticker
        LEFT JOIN articles a ON a.id = ae.article_id
            AND {_WINDOW_2D}
        LEFT JOIN sentiment_results sr ON sr.article_id = a.id
        WHERE w.user_id = $1
        GROUP BY w.ticker, w.entity_name, w.added_at
        ORDER BY mentions DESC
    """, user_id)
    return [dict(r) for r in rows]