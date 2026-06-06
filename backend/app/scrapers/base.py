from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional
import hashlib
import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _hash(title: str, summary: str = "") -> str:
    text = (title + summary[:200]).lower().strip()
    return hashlib.sha256(text.encode()).hexdigest()


class Article:
    """Lightweight value object returned by every scraper."""
    __slots__ = ("title", "url", "summary", "source", "author",
                 "published_at", "content_hash")

    def __init__(self, *, title: str, url: str, source: str,
                 summary: str = "", author: Optional[str] = None,
                 published_at: Optional[datetime] = None):
        self.title        = title
        self.url          = url
        self.source       = source
        self.summary      = summary[:800]
        self.author       = author
        self.published_at = published_at
        self.content_hash = _hash(title, summary)

    def to_dict(self) -> dict:
        return {s: getattr(self, s) for s in self.__slots__}


class BaseScraper(ABC):
    source_name: str = "unknown"

    async def get(self, url: str) -> Optional[str]:
        try:
            async with httpx.AsyncClient(
                timeout=settings.request_timeout_seconds,
                headers={"User-Agent": "Mozilla/5.0 (NSEBot/3.0)"},
                follow_redirects=True,
            ) as client:
                r = await client.get(url)
                r.raise_for_status()
                return r.text
        except Exception as e:
            logger.warning(f"[{self.source_name}] GET {url} failed: {e}")
            return None

    @abstractmethod
    async def scrape(self) -> list[Article]: ...

    async def run(self) -> list[Article]:
        try:
            arts = await self.scrape()
            logger.info(f"[{self.source_name}] {len(arts)} articles")
            return arts[:settings.max_articles_per_source]
        except Exception as e:
            logger.error(f"[{self.source_name}] scrape error: {e}")
            return []
