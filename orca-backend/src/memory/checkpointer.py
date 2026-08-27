"""
Project ORCA (SIH26176) — LangGraph Persistent Memory Checkpointer
Configures MemorySaver & AsyncPostgresSaver to persist multi-agent session state,
message history, and tool execution state in PostgreSQL.
"""

import os
import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from ..database.connection import get_conn_string

logger = logging.getLogger("ORCA.LangGraphMemory")

# In-memory ephemeral fallback checkpointer
_memory_saver = MemorySaver()


@asynccontextmanager
async def get_postgres_saver_cm() -> AsyncGenerator[AsyncPostgresSaver, None]:
    """
    Async context manager that yields a connected AsyncPostgresSaver instance.
    """
    conn_string = get_conn_string()
    try:
        async with AsyncPostgresSaver.from_conn_string(conn_string) as checkpointer:
            yield checkpointer
    except Exception as e:
        logger.warning(f"PostgresSaver unavailable ({e}). Yielding InMemorySaver.")
        yield _memory_saver


async def setup_checkpointer() -> bool:
    """
    Initializes and provisions the required LangGraph memory tables in PostgreSQL:
      - `checkpoints`: Thread metadata and state pointers
      - `checkpoint_blobs`: Complex serialized objects and GeoJSON outputs
      - `checkpoint_writes`: Intermediate pending writes across agent turns
    """
    conn_string = get_conn_string()
    logger.info("Initializing LangGraph PostgreSQL checkpointer schema...")
    try:
        async with AsyncPostgresSaver.from_conn_string(conn_string) as checkpointer:
            await checkpointer.setup()
        logger.info("✅ LangGraph memory tables (checkpoints, checkpoint_blobs, checkpoint_writes) verified.")
        return True
    except Exception as e:
        logger.debug(f"PostgreSQL checkpointer setup deferred: {e}")
        return False


def get_default_checkpointer() -> MemorySaver:
    """Returns the persistent active memory checkpointer instance."""
    return _memory_saver


def get_checkpointer() -> MemorySaver:
    """Backward-compatible alias for get_default_checkpointer."""
    return _memory_saver
