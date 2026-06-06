from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "NSE · News Sentiment Engine"
    environment: str = "development"
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql+asyncpg://user:pass@localhost/nse"
    sync_database_url: str = "postgresql+psycopg2://user:pass@localhost/nse"

    # Auth
    secret_key: str = "dev-secret-key-min-32-chars-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # NLP
    finbert_model: str = "ProsusAI/finbert"

    # Ingestion
    max_articles_per_source: int = 50
    request_timeout_seconds: int = 15
    ingest_interval_minutes: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
