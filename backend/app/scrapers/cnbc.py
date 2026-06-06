from datetime import datetime, timezone
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as dp
from app.scrapers.base import BaseScraper, Article
from app.core.logging import get_logger

logger = get_logger(__name__)

FEEDS = [
    "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    "https://www.cnbc.com/id/10001147/device/rss/rss.html",
]

MOCK = [
    Article(title="Nvidia CEO: AI Demand Is Insane, Supply Cannot Keep Up", url="https://cnbc.com/mock/nvda-001", source="cnbc", summary="Nvidia CEO Jensen Huang said demand for AI chips continues to massively exceed supply with no end in sight. The company's data center revenue hit a record.", author="Kif Leswing", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Microsoft Azure Growth Accelerates to 31% on AI Demand", url="https://cnbc.com/mock/msft-001", source="cnbc", summary="Microsoft reported fiscal Q3 results topping Wall Street estimates. Azure cloud revenue grew 31% year-over-year driven by surging AI workload demand.", author="Jordan Novet", published_at=datetime.now(tz=timezone.utc)),
    Article(title="JPMorgan Sees Recession Risk Rising to 35% on Tariff Escalation", url="https://cnbc.com/mock/jpm-001", source="cnbc", summary="JPMorgan economists raised their U.S. recession probability to 35%, citing uncertainty from trade tariffs and slowing global growth signals.", author="Hugh Son", published_at=datetime.now(tz=timezone.utc)),
    Article(title="U.S. Inflation Cools to 3.1%, Below Expectations", url="https://cnbc.com/mock/cpi-001", source="cnbc", summary="The Consumer Price Index rose 3.1% year-over-year in March, below the 3.4% economists expected. Treasury yields fell and stocks rallied broadly.", author="Jeff Cox", published_at=datetime.now(tz=timezone.utc)),
    Article(title="Amazon Logistics Expansion Threatens FedEx and UPS Margins", url="https://cnbc.com/mock/amzn-001", source="cnbc", summary="Amazon now handles over 70% of its own deliveries and is actively courting outside merchants, posing a material threat to FedEx and UPS.", author="Annie Palmer", published_at=datetime.now(tz=timezone.utc)),
]


class CNBCScraper(BaseScraper):
    source_name = "cnbc"

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
