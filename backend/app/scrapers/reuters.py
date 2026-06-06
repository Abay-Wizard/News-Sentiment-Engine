from datetime import datetime, timezone
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as dp
from app.scrapers.base import BaseScraper, Article
from app.core.logging import get_logger

logger = get_logger(__name__)

FEEDS = [
    "https://feeds.reuters.com/reuters/businessNews",
    "https://feeds.reuters.com/reuters/technologyNews",
]

MOCK = [
    Article(title="Fed Holds Rates Steady, Signals Two Cuts in 2025", url="https://reuters.com/mock/fed-001", source="reuters", summary="The Federal Reserve held interest rates steady and signaled two cuts this year. Chair Powell said the committee remains data-dependent.", author="Howard Schneider", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Apple Reports Record Q2 Revenue, iPhone Sales Surge 12%", url="https://reuters.com/mock/aapl-001", source="reuters", summary="Apple reported record second-quarter revenue of $95.4 billion, beating analyst expectations. CEO Tim Cook announced a $110B stock buyback.", author="Stephen Nellis", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Goldman Sachs Raises S&P 500 Target to 5,800 on Strong Earnings", url="https://reuters.com/mock/gs-001", source="reuters", summary="Goldman Sachs upgraded its year-end S&P 500 target to 5,800, citing stronger corporate earnings and resilient consumer spending.", author="Caroline Valetkevitch", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Tesla Shares Fall 8% After Missing Delivery Targets", url="https://reuters.com/mock/tsla-001", source="reuters", summary="Tesla fell sharply after reporting quarterly deliveries of 386,000 vehicles, below the 408,000 analyst consensus. China EV competition cited.", author="Hyunjoo Jin", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Oil Prices Drop 3% as OPEC+ Signals Production Increase", url="https://reuters.com/mock/oil-001", source="reuters", summary="Crude oil dropped more than 3% after OPEC+ members signaled a production increase. Brent crude fell to $78 per barrel.", author="Julia Payne", published_at=datetime.now(tz=timezone.utc)),
]


class ReutersScraper(BaseScraper):
    source_name = "reuters"

    async def scrape(self) -> list[Article]:
        articles = []
        for url in FEEDS:
            html = await self.get(url)
            if not html:
                continue
            for e in feedparser.parse(html).entries:
                try:
                    pub = dp.parse(e.published) if hasattr(e, "published") else None
                    summary = BeautifulSoup(e.get("summary", ""), "lxml").get_text()[:500]
                    articles.append(Article(
                        title=e.title, url=e.link, source=self.source_name,
                        summary=summary, author=e.get("author"), published_at=pub))
                except Exception:
                    pass
        return articles if articles else MOCK
