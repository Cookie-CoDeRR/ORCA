"""
Project ORCA (SIH26176) — pgvector Knowledge Base Wrapper
Provides high-performance vector insertion, hybrid metadata filtering,
and cosine similarity semantic search over the `marine_advisories` table.
"""

import json
import logging
from typing import Any
from pathlib import Path

from .connection import get_db_connection, execute_query, fetch_all

logger = logging.getLogger("ORCA.PGVectorStore")

VECTOR_DIMENSION = 768


class PGVectorStore:
    """
    Asynchronous pgvector wrapper for embedding storage and semantic search
    over Indian Maritime Regulations and Advisories.
    """

    def __init__(self, table_name: str = "marine_advisories"):
        self.table_name = table_name

    async def insert_chunk(
        self,
        doc_id: str,
        chunk_id: str,
        title: str,
        category: str,
        source: str,
        content: str,
        embedding: list[float],
        authority: str | None = None,
        jurisdiction: str | None = None,
        metadata: dict | None = None
    ) -> None:
        """Inserts or updates a single policy text chunk with its 768-dim embedding."""
        if len(embedding) != VECTOR_DIMENSION:
            raise ValueError(f"Embedding dimension must be {VECTOR_DIMENSION}, got {len(embedding)}")

        embedding_str = "[" + ",".join(f"{x:.6f}" for x in embedding) + "]"
        metadata_json = json.dumps(metadata or {})

        query = f"""
        INSERT INTO {self.table_name} 
            (doc_id, chunk_id, title, category, source, authority, jurisdiction, content, metadata, embedding)
        VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
        ON CONFLICT (chunk_id) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            source = EXCLUDED.source,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding;
        """
        await execute_query(
            query,
            (doc_id, chunk_id, title, category, source, authority, jurisdiction, content, metadata_json, embedding_str)
        )

    async def insert_chunks_batch(self, chunks: list[dict[str, Any]], embeddings: list[list[float]]) -> int:
        """Batch inserts multiple chunks and corresponding vector embeddings in a single transaction."""
        if len(chunks) != len(embeddings):
            raise ValueError("Length of chunks and embeddings must match")

        query = f"""
        INSERT INTO {self.table_name} 
            (doc_id, chunk_id, title, category, source, authority, jurisdiction, content, metadata, embedding)
        VALUES 
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
        ON CONFLICT (chunk_id) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            source = EXCLUDED.source,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding;
        """

        count = 0
        async with get_db_connection() as conn:
            async with conn.cursor() as cur:
                for chunk, emb in zip(chunks, embeddings):
                    if len(emb) != VECTOR_DIMENSION:
                        continue
                    embedding_str = "[" + ",".join(f"{x:.6f}" for x in emb) + "]"
                    metadata_json = json.dumps(chunk.get("metadata", {}))

                    await cur.execute(
                        query,
                        (
                            chunk.get("doc_id", "DOC-ORCA"),
                            chunk["id"],
                            chunk.get("title", ""),
                            chunk.get("category", "General Policy"),
                            chunk.get("source", ""),
                            chunk.get("metadata", {}).get("authority", ""),
                            chunk.get("metadata", {}).get("jurisdiction", ""),
                            chunk["content"],
                            metadata_json,
                            embedding_str
                        )
                    )
                    count += 1

        logger.info(f"✅ Successfully inserted/updated {count} vector chunks into {self.table_name}")
        return count

    async def similarity_search(
        self,
        query_embedding: list[float],
        top_k: int = 4,
        category: str | None = None,
        jurisdiction: str | None = None
    ) -> list[dict[str, Any]]:
        """
        Performs Cosine Similarity search against the pgvector table.
        Computes cosine distance (embedding <=> query_embedding) and returns top_k closest chunks.
        """
        if len(query_embedding) != VECTOR_DIMENSION:
            raise ValueError(f"Query embedding must be {VECTOR_DIMENSION} dimensions, got {len(query_embedding)}")

        embedding_str = "[" + ",".join(f"{x:.6f}" for x in query_embedding) + "]"

        filters = []
        params = [embedding_str]

        if category:
            filters.append("category = %s")
            params.append(category)

        if jurisdiction:
            filters.append("(jurisdiction ILIKE %s OR jurisdiction = 'All Maritime States (National EEZ)')")
            params.append(f"%{jurisdiction}%")

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        # Cosine distance operator is '<=>' in pgvector
        query = f"""
        SELECT 
            id,
            doc_id,
            chunk_id,
            title,
            category,
            source,
            authority,
            jurisdiction,
            content,
            metadata,
            (1 - (embedding <=> %s::vector)) AS similarity_score,
            (embedding <=> %s::vector) AS cosine_distance
        FROM {self.table_name}
        {where_clause}
        ORDER BY embedding <=> %s::vector ASC
        LIMIT %s;
        """
        params_full = [embedding_str, embedding_str] + params[1:] + [embedding_str, top_k]
        results = await fetch_all(query, tuple(params_full))
        return results

    async def ingest_from_chunks_json(self, json_file_path: Path, embedder_func=None) -> int:
        """
        Reads `maritime_policy_chunks.json` generated by script 08
        and inserts all records into pgvector.
        """
        if not json_file_path.exists():
            logger.error(f"Chunks JSON not found at {json_file_path}")
            return 0

        with open(json_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        chunks = data.get("chunks", [])
        if not chunks:
            logger.warning("No chunks found in file.")
            return 0

        logger.info(f"Ingesting {len(chunks)} policy chunks into pgvector...")

        # If no embedding function is passed, generate deterministic normalized mock 768-dim embeddings
        embeddings = []
        for c in chunks:
            if embedder_func:
                emb = await embedder_func(c["content"])
            else:
                import hashlib
                import numpy as np
                # Deterministic pseudo-embedding for testing without API keys
                h = hashlib.sha256(c["content"].encode()).digest()
                seed = int.from_bytes(h[:4], "big")
                rng = np.random.default_rng(seed)
                vec = rng.standard_normal(VECTOR_DIMENSION).astype(float)
                vec = (vec / np.linalg.norm(vec)).tolist()
                emb = vec
            embeddings.append(emb)

        return await self.insert_chunks_batch(chunks, embeddings)
