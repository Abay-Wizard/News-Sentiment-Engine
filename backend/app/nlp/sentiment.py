"""
FinBERT sentiment analysis with reliable keyword fallback.
Lazy-loads model on first use. Runs sync inference in thread pool.
"""
import asyncio
import re
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
_pipe = None


def _load():
    global _pipe
    if _pipe is not None:
        return _pipe
    try:
        from transformers import pipeline
        logger.info(f"Loading FinBERT ({settings.finbert_model})...")
        _pipe = pipeline(
            "text-classification",
            model=settings.finbert_model,
            return_all_scores=True,
            device=-1,
        )
        logger.info("FinBERT ready.")
    except Exception as e:
        logger.warning(f"FinBERT unavailable — keyword fallback active. ({e})")
        _pipe = None
    return _pipe


def _clean(text: str) -> str:
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _keyword(text: str) -> dict:
    t = text.lower()
    pos = sum(1 for w in [
        "surges","gains","beats","record","strong","rally","growth",
        "profit","rises","bullish","upgrades","positive","outperform",
        "beat","exceeded","robust","accelerates","boom",
    ] if w in t)
    neg = sum(1 for w in [
        "falls","drops","miss","loss","decline","weak","warning",
        "risk","cuts","layoffs","bearish","plunge","slump","crash",
        "recession","default","downgrade","missed","disappoints",
    ] if w in t)
    if pos > neg:
        s = min(0.55 + 0.08 * (pos - neg), 0.94)
        return {"label":"positive","score":s,"positive_score":s,"negative_score":0.06,"neutral_score":round(1-s-0.06,3)}
    if neg > pos:
        s = min(0.55 + 0.08 * (neg - pos), 0.94)
        return {"label":"negative","score":s,"positive_score":0.06,"negative_score":s,"neutral_score":round(1-s-0.06,3)}
    return {"label":"neutral","score":0.62,"positive_score":0.19,"negative_score":0.19,"neutral_score":0.62}


def _run_sync(title: str, summary: str) -> dict:
    text = _clean(f"{title}. {summary}")[:512]
    pipe = _load()
    if pipe is None:
        return _keyword(text)
    try:
        raw = pipe(text, truncation=True)
        # return_all_scores=True wraps output in an extra list: [[{...}, {...}]]
        results = raw[0] if isinstance(raw[0], list) else raw
        scores = {r["label"].lower(): r["score"] for r in results}
        label = max(scores, key=scores.get)
        return {
            "label": label,
            "score": scores[label],
            "positive_score": scores.get("positive", 0.0),
            "negative_score": scores.get("negative", 0.0),
            "neutral_score":  scores.get("neutral",  0.0),
        }
    except Exception as e:
        logger.error(f"FinBERT inference error: {e}")
        return _keyword(text)

async def analyze(title: str, summary: str = "") -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_sync, title, summary)
