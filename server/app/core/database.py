from typing import Optional, Generator
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from app.core.config import settings


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""
    pass


def get_db_url() -> str:
    """Normalize database URL for SQLAlchemy with the psycopg (v3) driver."""
    url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""
    if not url:
        return ""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


_engine: Optional[Engine] = None
_SessionLocal: Optional[sessionmaker[Session]] = None


def get_engine() -> Engine:
    """Lazily create or return the persistent SQLAlchemy engine with connection pooling."""
    global _engine
    if _engine is None:
        db_url = get_db_url()
        if not db_url:
            raise RuntimeError(
                "DATABASE_URL is not configured. Please set DATABASE_URL in your environment or .env file."
            )
        _engine = create_engine(
            db_url,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=True,
        )
    return _engine


def get_sessionmaker() -> sessionmaker[Session]:
    """Return configured sessionmaker bound to the SQLAlchemy engine."""
    global _SessionLocal
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db_session() -> Generator[Session, None, None]:
    """Dependency that yields a managed SQLAlchemy session, committing on success and rolling back on error."""
    sm = get_sessionmaker()
    session = sm()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
