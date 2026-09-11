"""
Project ORCA (SIH26176) — Vector Knowledge Base Seeding Module
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

from .connection import get_db_connection
from .vector_store import PGVectorStore, VECTOR_DIMENSION

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ORCA.SeedKnowledge")

CURRENT_DIR = Path(__file__).resolve().parent
RESEARCH_CORPUS_PATH = CURRENT_DIR / "research_papers_corpus.json"

# In-memory backup of policy advisories chunks (derived from maritime_policy_chunks.json)
DEFAULT_POLICY_CHUNKS = [
    {
        "id": "ORCA-RAG-0001",
        "doc_id": "POL-BAN-UNIFORM-2026",
        "title": "Uniform Seasonal Monsoon Fishing Ban Rules in Indian Exclusive Economic Zone",
        "category": "Monsoon Fishing Ban",
        "source": "Ministry of Fisheries, Animal Husbandry and Dairying, Government of India (Order No. 31035/01/2026-FY)",
        "content": "The Government of India enforces an annual uniform seasonal fishing ban in the Indian Exclusive Economic Zone (EEZ) to facilitate fish breeding, biological rejuvenation, and conservation of pelagic and demersal marine stocks. On the West Coast (covering the maritime zones of Gujarat, Maharashtra, Goa, Karnataka, Kerala, Daman & Diu, and Lakshadweep), the 61-day ban is active from midnight of 1st June to midnight of 31st July every year.",
        "metadata": {
            "authority": "Department of Fisheries, GoI",
            "jurisdiction": "West Coast & Lakshadweep",
            "effective_dates": "June 1 to July 31 (61 days)",
            "applicable_to": "Mechanized and motorized fishing trawlers beyond territorial waters"
        }
    },
    {
        "id": "ORCA-RAG-0002",
        "doc_id": "POL-BAN-UNIFORM-2026",
        "title": "Uniform Seasonal Monsoon Fishing Ban Rules — East Coast Directives",
        "category": "Monsoon Fishing Ban",
        "source": "Ministry of Fisheries, Animal Husbandry and Dairying, Government of India (Order No. 31035/01/2026-FY)",
        "content": "On the East Coast (covering the maritime zones of Tamil Nadu, Andhra Pradesh, Odisha, West Bengal, Puducherry, and Andaman & Nicobar Islands), the 61-day uniform fishing ban is active from midnight of 15th April to midnight of 14th June every year. The prohibition applies strictly to all mechanized fishing trawlers, purse-seiners, and motorized vessels venturing beyond 12 nautical miles. Traditional non-motorized artisanal craft are exempt.",
        "metadata": {
            "authority": "Department of Fisheries, GoI",
            "jurisdiction": "East Coast & Andaman Sea",
            "effective_dates": "April 15 to June 14 (61 days)"
        }
    },
    {
        "id": "ORCA-RAG-0003",
        "doc_id": "SOP-ICG-DISTRESS-2026",
        "title": "Indian Coast Guard Maritime Search and Rescue (SAR) Distress Protocols",
        "category": "Maritime Safety & Distress",
        "source": "Directorate of Operations, Indian Coast Guard Headquarters, New Delhi",
        "content": "In accordance with the National Maritime Search and Rescue Manual and International Maritime Organization (IMO) conventions, all fishing vessels and commercial craft operating within the Indian Search and Rescue Region (ISRR) must maintain a continuous listening watch on VHF Marine Channel 16 (156.800 MHz). In life-threatening emergencies, vessel skippers must transmit Mayday distress calls or contact the national toll-free maritime emergency helpline 1554.",
        "metadata": {
            "authority": "Indian Coast Guard (ICG)",
            "jurisdiction": "Indian Search and Rescue Region (ISRR)",
            "vhf_frequency": "156.800 MHz (VHF Ch 16)",
            "emergency_helpline": "1554 (Toll-Free 24/7)"
        }
    },
    {
        "id": "ORCA-RAG-0004",
        "doc_id": "LEG-TERRITORIAL-1976",
        "title": "Territorial Waters, Continental Shelf, and Exclusive Economic Zone Act, 1976",
        "category": "Maritime Boundaries & Sovereignty",
        "source": "Ministry of Law and Justice, Government of India (Act No. 80 of 1976)",
        "content": "The sovereignty of India extends over its territorial waters up to 12 nautical miles from the baseline. The Contiguous Zone extends to 24 nautical miles, and the Exclusive Economic Zone (EEZ) extends to 200 nautical miles. Within the EEZ, the Union possesses sovereign rights for exploring, exploiting, conserving, and managing natural resources. Crossing the International Maritime Boundary Line (IMBL) into foreign sovereign waters (e.g. Sri Lanka, Pakistan) without authorization constitutes a non-bailable statutory offense.",
        "metadata": {
            "authority": "Ministry of Law & Justice / Indian Navy / Coast Guard",
            "jurisdiction": "National Sovereign Maritime Zones",
            "eez_extent": "200 Nautical Miles",
            "territorial_limit": "12 Nautical Miles"
        }
    },
    {
        "id": "ORCA-RAG-0005",
        "doc_id": "WILD-PROT-1972-MPA",
        "title": "Wild Life (Protection) Act, 1972 — Marine Protected Areas & Schedule I Species",
        "category": "Marine Protected Areas & Conservation",
        "source": "Ministry of Environment, Forest and Climate Change (MoEFCC)",
        "content": "Sections 35 and 38 of the Wild Life (Protection) Act, 1972 prohibit all commercial fishing, mechanized trawling, dredging, and coral collection within designated Marine Protected Areas (MPAs) including the Gulf of Mannar Marine National Park, Marine National Park (Gulf of Kutch), and Gahirmatha Marine Sanctuary. Any accidental entanglement of Schedule I marine species (Dugongs, Whale Sharks, Olive Ridley Turtles) requires immediate release and reporting to the State Forest Department.",
        "metadata": {
            "authority": "MoEFCC / Wildlife Crime Control Bureau (WCCB)",
            "jurisdiction": "Marine Protected Areas (MPAs)",
            "protected_sanctuaries": ["Gulf of Mannar", "Gulf of Kutch", "Gahirmatha", "Malvan"]
        }
    }
]


def generate_dense_embedding(text: str, dim: int = 768) -> list[float]:
    """Generates a deterministic 768-dimensional normalized dense pseudo-embedding from text hash."""
    h = hashlib.sha256(text.encode("utf-8")).digest()
    seed = int.from_bytes(h[:4], "big")
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(dim).astype(float)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


async def seed_marine_advisories() -> int:
    """Seeds marine_advisories table with policy chunks."""
    store = PGVectorStore(table_name="marine_advisories")
    embeddings = [generate_dense_embedding(c["content"] + " " + c.get("title", ""), VECTOR_DIMENSION) for c in DEFAULT_POLICY_CHUNKS]
    inserted = await store.insert_chunks_batch(DEFAULT_POLICY_CHUNKS, embeddings)
    logger.info(f"✅ Ingested {inserted} policy advisories into marine_advisories table.")
    return inserted


async def seed_research_papers() -> int:
    """Seeds research_papers table with peer-reviewed oceanographic papers."""
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


async def run_seeding():
    logger.info("🌊 Seeding Project ORCA Vector Knowledge Bases...")
    p_count = await seed_marine_advisories()
    r_count = await seed_research_papers()
    logger.info(f"🎉 Seeding Complete! {p_count} policy circulars and {r_count} research papers in PostgreSQL pgvector.")


if __name__ == "__main__":
    asyncio.run(run_seeding())
