"""initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-01
"""
from alembic import op

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Users
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email         VARCHAR(320) NOT NULL UNIQUE,
            username      VARCHAR(64)  NOT NULL UNIQUE,
            password_hash TEXT         NOT NULL,
            full_name     VARCHAR(255),
            is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
            role          VARCHAR(16)  NOT NULL DEFAULT 'user',
            created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            last_login_at TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")

    # Refresh tokens
    op.execute("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash  VARCHAR(64) NOT NULL UNIQUE,
            expires_at  TIMESTAMPTZ NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            revoked_at  TIMESTAMPTZ,
            user_agent  TEXT,
            ip_address  VARCHAR(45)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_rt_user      ON refresh_tokens(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_rt_hash      ON refresh_tokens(token_hash)")

    # Articles
    op.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title         TEXT        NOT NULL,
            url           TEXT        NOT NULL UNIQUE,
            summary       TEXT,
            source        VARCHAR(64) NOT NULL,
            author        VARCHAR(255),
            published_at  TIMESTAMPTZ,
            fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            content_hash  VARCHAR(64) NOT NULL UNIQUE,
            is_processed  BOOLEAN     NOT NULL DEFAULT FALSE
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_art_source     ON articles(source)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_art_fetched    ON articles(fetched_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_art_published  ON articles(published_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_art_processed  ON articles(is_processed)")

    # Full-text search index on title + summary
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_art_fts ON articles
        USING gin(to_tsvector('english', title || ' ' || COALESCE(summary, '')))
    """)

    # Sentiment
    op.execute("""
        CREATE TABLE IF NOT EXISTS sentiment_results (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            article_id      UUID  NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            label           VARCHAR(16) NOT NULL CHECK (label IN ('positive','negative','neutral')),
            score           FLOAT NOT NULL,
            positive_score  FLOAT NOT NULL DEFAULT 0,
            negative_score  FLOAT NOT NULL DEFAULT 0,
            neutral_score   FLOAT NOT NULL DEFAULT 0,
            analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_sent_article ON sentiment_results(article_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_sent_label   ON sentiment_results(label)")

    # Entities
    op.execute("""
        CREATE TABLE IF NOT EXISTS article_entities (
            id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            article_id    UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            entity_name   VARCHAR(255) NOT NULL,
            ticker        VARCHAR(16),
            entity_type   VARCHAR(32) NOT NULL DEFAULT 'company',
            mention_count INT         NOT NULL DEFAULT 1
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_ent_article ON article_entities(article_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_ent_ticker  ON article_entities(ticker)")

    # Watchlist (new feature)
    op.execute("""
        CREATE TABLE IF NOT EXISTS watchlist (
            id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            ticker      VARCHAR(16) NOT NULL,
            entity_name VARCHAR(255) NOT NULL,
            added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, ticker)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_wl_user ON watchlist(user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS watchlist CASCADE")
    op.execute("DROP TABLE IF EXISTS article_entities CASCADE")
    op.execute("DROP TABLE IF EXISTS sentiment_results CASCADE")
    op.execute("DROP TABLE IF EXISTS articles CASCADE")
    op.execute("DROP TABLE IF EXISTS refresh_tokens CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")
