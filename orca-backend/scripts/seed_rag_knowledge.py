"""
Project ORCA (SIH26176) — Vector Knowledge Base Seeding Script
Seeds both:
1. `marine_advisories` (authoritative Department of Fisheries policy circulars, monsoon bans, Coast Guard SOPs)
2. `research_papers` (peer-reviewed oceanographic and fisheries research papers)
into PostgreSQL pgvector using 768-dimensional normalized dense vector representations.
"""

import asyncio
import json
import logging
import hashlib
import numpy as np
from pathlib import Path
from typing import Any

from src.database.connection import get_db_connection, execute_query
from src.database.vector_store import PGVectorStore, VECTOR_DIMENSION

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ORCA.SeedKnowledge")

BASE_DIR = Path(__file__).resolve().parent.parent
POLICY_CHUNKS_PATH = BASE_DIR.parent / "orca-data-pipeline" / "data" / "processed" / "knowledge_base" / "maritime_policy_chunks.json"
RESEARCH_CORPUS_PATH = BASE_DIR / "src" / "database" / "research_papers_corpus.json"


def generate_dense_embedding(text: str, dim: int = 768) -> list[float]:
    """Generates a deterministic 768-dimensional normalized pseudo-embedding from text hash."""
    h = hashlib.sha256(text.encode("utf-8")).digest()
    seed = int.from_bytes(h[:4], "big")
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(dim).astype(float)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


async def seed_marine_advisories() -> int:
    """Seeds marine_advisories table with 12 policy chunks from maritime_policy_chunks.json."""
    if not POLICY_CHUNKS_PATH.exists():
        logger.error(f"Policy chunks not found at {POLICY_CHUNKS_PATH}")
        return 0

    with open(POLICY_CHUNKS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    chunks = data.get("chunks", [])
    logger.info(f"Loaded {len(chunks)} policy chunks for marine_advisories.")

    store = PGVectorStore(table_name="marine_advisories")
    embeddings = [generate_dense_embedding(c["content"] + " " + c.get("title", ""), VECTOR_DIMENSION) for c in chunks]

    inserted = await store.insert_chunks_batch(chunks, embeddings)
    logger.info(f"✅ Ingested {inserted} chunks into marine_advisories table.")
    return inserted


async def seed_research_papers() -> int:
    """Seeds research_papers table with peer-reviewed literature from research_papers_corpus.json."""
    if not RESEARCH_CORPUS_PATH.exists():
        logger.error(f"Research corpus not found at {RESEARCH_CORPUS_PATH}")
        return 0

    with open(RESEARCH_CORPUS_PATH, "r", encoding="utf-8") as f:
        papers = json.load(f)

    logger.info(f"Loaded {len(papers)} peer-reviewed papers for research_papers table.")

    query = """
    INSERT INTO research_papers 
        (paper_id, title, authors, journal, year, doi, topic, keywords, abstract, key_findings, url, metadata, embedding)
    VALUES 
        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
    ON CONFLICT (paper_id) DO UPDATE SET
        title = EXCLUDED.title,
        authors = EXCLUDED.authors,
        journal = EXCLUDED.journal,
        year = EXCLUDED.year,
        doi = EXCLUDED.doi,
        topic = EXCLUDED.topic,
        keywords = EXCLUDED.keywords,
        abstract = EXCLUDED.abstract,
        key_findings = EXCLUDED.key_findings,
        url = EXCLUDED.url,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding;
    """

    count = 0
    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            for p in papers:
                full_text = f"{p['title']} {p['topic']} {' '.join(p.get('keywords', []))} {p['abstract']} {p['key_findings']}"
                emb = generate_dense_embedding(full_text, VECTOR_DIMENSION)
                embedding_str = "[" + ",".join(f"{x:.6f}" for x in emb) + "]"
                metadata_json = json.dumps(p.get("metadata", {}))

                await cur.execute(
                    query,
                    (
                        p["paper_id"],
                        p["title"],
                        p["authors"],
                        p["journal"],
                        p["year"],
                        p.get("doi"),
                        p["topic"],
                        p.get("keywords", []),
                        p["abstract"],
                        p["key_findings"],
                        p.get("url"),
                        metadata_json,
                        embedding_str
                    )
                )
                count += 1

    logger.info(f"✅ Ingested {count} academic papers into research_papers table.")
    return count


async def main():
    logger.info("🌊 Starting Project ORCA Vector Knowledge Base Seeding...")
    p_count = await seed_marine_advisories()
    r_count = await seed_research_papers()
    logger.info(f"🎉 Seeding Complete! Ingested {p_count} policy advisories and {r_count} research papers into PostgreSQL.")


if __name__ == "__main__":
    asyncio.run(main())
