"""
Database connection and session factory with retry logic and graceful degradation
"""
import os
import time
import logging
from urllib.parse import quote_plus, urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from .config import settings

logger = logging.getLogger(__name__)


def _build_database_url() -> str:
    """
    Build a safe DATABASE_URL.
    If DATABASE_URL is set and valid, use it directly.
    If the password contains special characters (e.g. @), reconstruct
    the URL from individual DB_* variables to avoid URL-parsing issues.
    For Supabase/PostgreSQL, ensure sslmode=require is set.
    """
    # Local override: if DATABASE_URL is explicitly sqlite, always use it.
    # Prevents stale Supabase DB_* vars in local .env from forcing a 30s+
    # remote connection retry on every startup (frontend then times out).
    explicit_url = os.getenv("DATABASE_URL", "")
    if explicit_url.strip().startswith("sqlite"):
        return explicit_url.strip().strip('"').strip("'")

    # If individual DB_* parts are provided, build URL from them
    # (avoids @ in password breaking URL parsing)
    db_host = os.getenv("DB_HOST", "")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "postgres")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "")

    if db_host and db_password:
        safe_password = quote_plus(db_password)
        url = f"postgresql://{db_user}:{safe_password}@{db_host}:{db_port}/{db_name}"
        # Ensure sslmode=require for Supabase
        if "supabase" in db_host.lower() or "pooler" in db_host.lower():
            url += "?sslmode=require"
        return url

    url = settings.DATABASE_URL

    # If it's a PostgreSQL URL, ensure sslmode=require for Supabase
    if url.startswith("postgresql://") or url.startswith("postgresql+psycopg2://"):
        parsed = urlparse(url)
        # Check if it's a Supabase host
        if parsed.hostname and ("supabase" in parsed.hostname.lower() or "pooler" in parsed.hostname.lower()):
            query_params = parse_qs(parsed.query)
            if "sslmode" not in query_params:
                query_params["sslmode"] = ["require"]
                new_query = urlencode(query_params, doseq=True)
                url = urlunparse(parsed._replace(query=new_query))

    return url


def _create_engine_with_retry(database_url: str, max_retries: int = 5, base_delay: float = 1.0):
    """
    Create SQLAlchemy engine with retry logic and exponential backoff.
    Returns engine or None if all retries fail.
    """
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    
    # Add connection pool settings for PostgreSQL
    if not database_url.startswith("sqlite"):
        connect_args.update({
            "connect_timeout": 10,
            "application_name": "deployai_backend"
        })

    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            engine = create_engine(
                database_url,
                connect_args=connect_args,
                echo=False,
                pool_pre_ping=True,  # Validates connections before use
                pool_recycle=3600,   # Recycle connections after 1 hour
                pool_size=5,         # Connection pool size
                max_overflow=10,     # Max overflow connections
            )
            
            # Test the connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            logger.info(f"Database connection successful on attempt {attempt}")
            return engine
            
        except Exception as e:
            last_exception = e
            logger.warning(f"Database connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                delay = base_delay * (2 ** (attempt - 1))  # Exponential backoff: 1s, 2s, 4s, 8s, 16s
                logger.info(f"Retrying in {delay}s...")
                time.sleep(delay)
    
    logger.error(f"All {max_retries} database connection attempts failed. Last error: {last_exception}")
    return None


DATABASE_URL = _build_database_url()

# Create engine with retry logic
engine = _create_engine_with_retry(DATABASE_URL)

if engine is None:
    logger.critical("Failed to connect to database after retries. Running in degraded mode (no database).")
    # Create a dummy engine for SQLite in-memory to allow app to start
    # This prevents import-time crashes
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    else:
        # Fallback to SQLite for graceful degradation
        fallback_url = "sqlite:///./deployai_fallback.db"
        logger.warning(f"Falling back to SQLite: {fallback_url}")
        engine = create_engine(fallback_url, connect_args={"check_same_thread": False}, echo=False)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

# Add connection event listeners for better debugging
@event.listens_for(engine, "connect")
def on_connect(dbapi_connection, connection_record):
    logger.debug("New database connection established")

@event.listens_for(engine, "checkout")
def on_checkout(dbapi_connection, connection_record, connection_proxy):
    logger.debug("Connection checked out from pool")

@event.listens_for(engine, "checkin")
def on_checkin(dbapi_connection, connection_record):
    logger.debug("Connection checked in to pool")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_health() -> dict:
    """Check database connection health for /api/health endpoint."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "connected", 
            "database_url": _sanitize_url(DATABASE_URL),
            "pool_size": engine.pool.size() if hasattr(engine.pool, 'size') else 0,
            "pool_checked_out": engine.pool.checkedout() if hasattr(engine.pool, 'checkedout') else 0
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "disconnected", "error": str(e), "database_url": _sanitize_url(DATABASE_URL)}


def _sanitize_url(url: str) -> str:
    """Remove password from URL for logging."""
    try:
        parsed = urlparse(url)
        if parsed.password:
            netloc = f"{parsed.username}:****@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
            return urlunparse(parsed._replace(netloc=netloc))
        return url
    except Exception:
        return "****"
