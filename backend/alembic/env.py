import os, sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv()

config = context.config

# Build sync URL from env
sync_url = os.environ.get("SYNC_DATABASE_URL", "")
if not sync_url:
    sync_url = (os.environ.get("DATABASE_URL", "")
                .replace("postgresql+asyncpg://", "postgresql+psycopg2://")
                .replace("ssl=require", "sslmode=require"))

config.set_main_option("sqlalchemy.url", sync_url)

if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = None


def run_migrations_offline():
    context.configure(url=sync_url, target_metadata=target_metadata,
                      literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.", poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
