"""
Project ORCA (SIH26176) — LangGraph Persistent Memory Checkpointer
Configures AsyncPostgresSaver to persist multi-agent session state,
message history, and tool execution state in PostgreSQL.
"""

import os
import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from ..database.connection import get_conn_string

logger = logging.getLogger("ORCA.LangGraphMemory")


@asynccontextmanager
async def get_postgres_saver_cm() -> AsyncGenerator[AsyncPostgresSaver, None]:
    """
    Async context manager that yields a connected AsyncPostgresSaver instance.
    Ensures connection pooling lifecycle is cleanly managed during graph invocations.
    """
    conn_string = get_conn_string()
    async with AsyncPostgresSaver.from_conn_string(conn_string) as checkpointer:
        yield checkpointer


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
        logger.error(f"Failed to setup LangGraph memory tables: {e}")
        return False


async def get_checkpointer() -> AsyncPostgresSaver:
    """
    Creates and returns an AsyncPostgresSaver configured with the primary connection string.
    Note: When compiling long-running graphs, use within an async context or persistent lifespan.
    """
    conn_string = get_conn_string()
    return AsyncPostgresSaver.from_conn_string(conn_string)
