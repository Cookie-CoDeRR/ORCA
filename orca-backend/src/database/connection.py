"""
Project ORCA (SIH26176) — Asynchronous Database Connection Pool
Manages connection pooling for PostgreSQL 16 + PostGIS + pgvector using psycopg_pool.
"""

import os
import logging
from typing import AsyncGenerator, Any
from pathlib import Path
from contextlib import asynccontextmanager

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

logger = logging.getLogger("ORCA.DatabaseConnection")

# Database Configuration Defaults
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_USER = os.getenv("POSTGRES_USER", "orca_admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "orca_secure_password_2026")
POSTGRES_DB = os.getenv("POSTGRES_DB", "orca_db")
POSTGRES_POOL_MIN_SIZE = int(os.getenv("POSTGRES_POOL_MIN_SIZE", "4"))
POSTGRES_POOL_MAX_SIZE = int(os.getenv("POSTGRES_POOL_MAX_SIZE", "20"))

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Global Async Connection Pool instance
_pool: AsyncConnectionPool | None = None


def get_conn_string() -> str:
    """Returns the standardized PostgreSQL connection URI."""
    return DATABASE_URL


async def get_db_pool() -> AsyncConnectionPool:
    """
    Initializes or returns the active AsyncConnectionPool.
    Configured with dict_row row factory for key-value dictionary outputs.
    """
    global _pool
    if _pool is None or _pool.closed:
        logger.info(f"Connecting to PostgreSQL at {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB} (Pool: {POSTGRES_POOL_MIN_SIZE}-{POSTGRES_POOL_MAX_SIZE})...")
        _pool = AsyncConnectionPool(
            conninfo=DATABASE_URL,
            min_size=POSTGRES_POOL_MIN_SIZE,
            max_size=POSTGRES_POOL_MAX_SIZE,
            timeout=1.0,
            max_idle=300.0,
            kwargs={"row_factory": dict_row, "autocommit": False, "connect_timeout": 1}
        )
        try:
            await _pool.open(wait=False)
            logger.info("✅ PostgreSQL AsyncConnectionPool opened.")
        except Exception as e:
            logger.debug(f"Pool open deferred: {e}")
    return _pool


async def close_db_pool():
    """Gracefully closes the connection pool upon application shutdown."""
    global _pool
    if _pool and not _pool.closed:
        logger.info("Closing PostgreSQL AsyncConnectionPool...")
        await _pool.close()
        _pool = None
        logger.info("PostgreSQL AsyncConnectionPool closed.")


@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[psycopg.AsyncConnection, None]:
    """
    Async context manager yielding a dedicated connection from the pool.
    Automatically handles transaction commits and rollbacks.
    """
    pool = await get_db_pool()
    async with pool.connection() as conn:
        try:
            yield conn
            await conn.commit()
        except Exception as e:
            await conn.rollback()
            logger.error(f"Database transaction error: {e}")
            raise


async def execute_query(query: str, params: tuple | dict | None = None) -> None:
    """Executes a non-returning SQL query (INSERT, UPDATE, DELETE, DDL)."""
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)


async def fetch_all(query: str, params: tuple | dict | None = None) -> list[dict[str, Any]]:
    """Executes a SQL query and returns all matching rows as dictionaries."""
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            rows = await cur.fetchall()
            return [dict(r) for r in rows] if rows else []


async def fetch_one(query: str, params: tuple | dict | None = None) -> dict[str, Any] | None:
    """Executes a SQL query and returns a single matching row as a dictionary."""
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            row = await cur.fetchone()
            return dict(row) if row else None


async def init_db(schema_file_path: Path | None = None) -> bool:
    """
    Executes the init_schema.sql script to enable PostGIS, pgvector,
    and provision the required tables and spatial/vector indexes.
    """
    if schema_file_path is None:
        schema_file_path = Path(__file__).resolve().parent / "init_schema.sql"

    if not schema_file_path.exists():
        logger.error(f"Schema file not found at: {schema_file_path}")
        return False

    logger.info(f"Initializing database schema from {schema_file_path}...")
    try:
        with open(schema_file_path, "r", encoding="utf-8") as f:
            sql_script = f.read()

        async with get_db_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql_script)

        logger.info("✅ Database schema initialized with PostGIS and pgvector.")
        return True
    except Exception as e:
        logger.error(f"Database schema initialization failed: {e}")
        return False
