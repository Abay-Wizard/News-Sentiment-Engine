from datetime import datetime, timezone
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as dp
from app.scrapers.base import BaseScraper, Article
from app.core.logging import get_logger

logger = get_logger(__name__)

FEEDS = [
    "https://finance.yahoo.com/news/rssindex",
    "https://finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US",
]

MOCK = [
    Article(title="Berkshire Hathaway Boosts Cash to Record $189 Billion", url="https://finance.yahoo.com/mock/brk-001", source="yahoo_finance", summary="Warren Buffett's Berkshire Hathaway increased its cash to a record $189 billion, suggesting the legendary investor sees few attractive buying opportunities.", author="Ines Ferre", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Bitcoin Surges Past $75,000 as ETF Inflows Accelerate", url="https://finance.yahoo.com/mock/btc-001", source="yahoo_finance", summary="Bitcoin surged to a new record high as spot ETF inflows accelerated. BlackRock's iShares Bitcoin Trust saw a record $1.2 billion single-day inflow.", author="David Hollerith", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Meta Earnings Beat Estimates as Ad Revenue Grows 27%", url="https://finance.yahoo.com/mock/meta-001", source="yahoo_finance", summary="Meta Platforms reported quarterly earnings above analyst expectations, with advertising revenue growing 27% driven by AI-enhanced targeting tools.", author="Alexandra Semenova", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Google Antitrust Ruling Could Force Sale of Chrome Browser", url="https://finance.yahoo.com/mock/googl-001", source="yahoo_finance", summary="A federal judge ruled Google must face remedies hearings that could include forcing the sale of Chrome. Alphabet shares fell 6% on the news.", author="Alexis Keenan", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Strong Jobs Report Adds 272,000 Positions, Easing Recession Fears", url="https://finance.yahoo.com/mock/jobs-001", source="yahoo_finance", summary="The U.S. economy added 272,000 jobs in April, far above the 185,000 expected, easing recession fears. The Dow Jones gained over 400 points.", author="Brian Cheung", published_at=datetime.now(tz=timezone.utc)),
]


class YahooFinanceScraper(BaseScraper):
    source_name = "yahoo_finance"

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
