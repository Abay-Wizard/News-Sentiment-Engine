import re
from typing import Optional

ENTITIES: list[tuple[str, Optional[str], str]] = [
    ("Apple", "AAPL", "company"), ("Microsoft", "MSFT", "company"),
    ("Alphabet", "GOOGL", "company"), ("Google", "GOOGL", "company"),
    ("Amazon", "AMZN", "company"), ("Meta Platforms", "META", "company"),
    ("Meta", "META", "company"), ("Nvidia", "NVDA", "company"),
    ("Tesla", "TSLA", "company"), ("Netflix", "NFLX", "company"),
    ("Intel", "INTC", "company"), ("AMD", "AMD", "company"),
    ("Salesforce", "CRM", "company"), ("Adobe", "ADBE", "company"),
    ("JPMorgan Chase", "JPM", "company"), ("JPMorgan", "JPM", "company"),
    ("Goldman Sachs", "GS", "company"), ("Morgan Stanley", "MS", "company"),
    ("Bank of America", "BAC", "company"), ("Wells Fargo", "WFC", "company"),
    ("Citigroup", "C", "company"), ("Berkshire Hathaway", "BRK.B", "company"),
    ("BlackRock", "BLK", "company"), ("Visa", "V", "company"),
    ("Mastercard", "MA", "company"), ("PayPal", "PYPL", "company"),
    ("Walmart", "WMT", "company"), ("Target", "TGT", "company"),
    ("Costco", "COST", "company"), ("Home Depot", "HD", "company"),
    ("FedEx", "FDX", "company"), ("UPS", "UPS", "company"),
    ("ExxonMobil", "XOM", "company"), ("Chevron", "CVX", "company"),
    ("ConocoPhillips", "COP", "company"), ("NextEra Energy", "NEE", "company"),
    ("Johnson & Johnson", "JNJ", "company"), ("Pfizer", "PFE", "company"),
    ("Eli Lilly", "LLY", "company"), ("UnitedHealth", "UNH", "company"),
    ("Boeing", "BA", "company"), ("Caterpillar", "CAT", "company"),
    ("Bitcoin", "BTC", "crypto"), ("Ethereum", "ETH", "crypto"),
    ("Coinbase", "COIN", "company"), ("MicroStrategy", "MSTR", "company"),
    ("S&P 500", "SPY", "index"), ("Dow Jones", "DJI", "index"),
    ("Nasdaq", "QQQ", "index"), ("Russell 2000", "IWM", "index"),
    ("Federal Reserve", None, "institution"), ("Fed", None, "institution"),
    ("SEC", None, "institution"), ("CFTC", None, "institution"),
    ("OPEC", None, "institution"), ("OPEC+", None, "institution"),
    ("Treasury", None, "institution"), ("IMF", None, "institution"),
    ("World Bank", None, "institution"),
]


def extract(text: str) -> list[dict]:
    found: dict[str, dict] = {}
    for name, ticker, etype in ENTITIES:
        pat = re.compile(r"\b" + re.escape(name) + r"\b", re.IGNORECASE)
        n = len(pat.findall(text))
        if n:
            key = ticker or name
            if key in found:
                found[key]["count"] += n
            else:
                found[key] = {"name": name, "ticker": ticker, "type": etype, "count": n}
    return sorted(found.values(), key=lambda x: x["count"], reverse=True)
