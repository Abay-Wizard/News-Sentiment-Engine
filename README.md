# NSE v3 · News Sentiment Engine

Production-grade financial news aggregation and NLP sentiment analysis platform.

## What's new in v3

- **React Query** replaces custom hooks — caching, retries, background refetch, no race conditions
- **Single background worker** — scrape → store → analyze ALL → sleep. No partial processing.
- **7-day sentiment window** — always has data, even on a fresh install
- **COALESCE(published_at, fetched_at)** everywhere — live RSS articles with null dates always appear
- **Watchlist** — pin tickers, track their sentiment over time
- **Sentiment momentum** — ↑/↓ indicator showing if market is improving vs previous 6h
- **Full-text search** — PostgreSQL GIN index on title + summary
- **Axios interceptors** — silent token refresh, no manual token management in hooks
- **Responsive** — sidebar on desktop, hamburger + bottom nav on mobile

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Edit .env — paste your Neon URLs
cp .env .env.local

# Run migrations
alembic upgrade head

# Start
uvicorn app.main:app --reload
```

The worker starts automatically. On boot it scrapes Reuters, CNBC, Yahoo Finance,
stores new articles, then analyzes EVERY unprocessed article before sleeping.
No manual trigger needed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, register, done.

---

## Environment Variables (backend/.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...neon.tech/db?ssl=require` |
| `SYNC_DATABASE_URL` | `postgresql+psycopg2://...neon.tech/db?sslmode=require` |
| `SECRET_KEY` | JWT signing key — min 32 chars |
| `INGEST_INTERVAL_MINUTES` | How often to scrape (default: 30) |

---

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register + auto-login |
| POST | `/api/v1/auth/login` | — | Login |
| POST | `/api/v1/auth/refresh` | — | Refresh token |
| POST | `/api/v1/auth/logout` | ✓ | Logout |
| GET  | `/api/v1/auth/me` | ✓ | Current user |
| GET  | `/api/v1/news/` | ✓ | Articles (search, filter, paginate) |
| POST | `/api/v1/news/ingest` | ✓ | Manual scrape trigger |
| GET  | `/api/v1/sentiment/summary` | ✓ | 7-day market sentiment + momentum |
| GET  | `/api/v1/sentiment/trend` | ✓ | Hourly trend (`?hours=24`) |
| GET  | `/api/v1/sentiment/entities` | ✓ | Top mentioned companies |
| GET  | `/api/v1/sentiment/sources` | ✓ | Per-source breakdown |
| GET  | `/api/v1/sentiment/stats` | ✓ | Dashboard counts |
| GET  | `/api/v1/sentiment/watchlist` | ✓ | Watchlist sentiment |
| GET  | `/api/v1/watchlist/` | ✓ | Get watchlist |
| POST | `/api/v1/watchlist/` | ✓ | Add ticker |
| DELETE | `/api/v1/watchlist/{ticker}` | ✓ | Remove ticker |

---

## Alembic

```bash
alembic upgrade head          # apply migrations
alembic current               # check version
alembic history --verbose     # see all migrations
alembic revision -m "name"    # create new migration
alembic downgrade -1          # roll back one step
```
