import os
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL", "").strip()
FALLBACK_DB_URL = os.getenv("DATABASE_URL", "postgresql://finuser:finpass@localhost:5432/finai_db")

# ── Supabase client (for API-level operations) ────────────────────────────────
supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client  # type: ignore
        supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialised (URL: {})", SUPABASE_URL)
    except Exception as exc:
        logger.warning("Supabase client init failed — {}", exc)

# ── Resolve which PostgreSQL URL to use ──────────────────────────────────────
def _resolve_database_url() -> str:
    """
    Priority:
      1. SUPABASE_DB_URL  — direct Supabase PostgreSQL connection string
      2. DATABASE_URL     — any other PostgreSQL instance
    """
    if SUPABASE_DB_URL:
        logger.info("Database → Supabase PostgreSQL (SUPABASE_DB_URL)")
        return SUPABASE_DB_URL

    logger.info("Database → fallback PostgreSQL (DATABASE_URL)")
    return FALLBACK_DB_URL


DATABASE_URL = _resolve_database_url()

# ── SQLAlchemy engine ─────────────────────────────────────────────────────────
# Supabase requires SSL; local/fallback connections work with or without it
_connect_args = {"sslmode": "require"} if SUPABASE_DB_URL else {}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Returns True if the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("DB connection check failed — {}", exc)
        return False
