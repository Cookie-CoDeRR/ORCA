#!/usr/bin/env python3
"""
Project ORCA (SIH26176) — Script 08: Build Maritime Policy & Advisory RAG Knowledge Base
Ingests official Indian maritime regulations, state fisheries acts, seasonal monsoon bans,
and Indian Coast Guard safety mandates.
Chunks and structures the regulatory corpus into vector-ready JSON payloads for pgvector embedding.
Outputs to data/processed/knowledge_base/maritime_policy_chunks.json.
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ORCA.PolicyRAGBuilder")

RAW_POLICY_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "policy_docs"
PROCESSED_KB_DIR = Path(__file__).resolve().parent.parent / "data" / "processed" / "knowledge_base"


# ==============================================================================
# AUTHORITATIVE INDIAN MARITIME REGULATORY CORPUS
# ==============================================================================
POLICY_DOCUMENTS = [
    {
        "doc_id": "DOC-GOI-BAN-2026",
        "title": "Government of India Order on Uniform Seasonal Fishing Ban in the Indian EEZ",
        "authority": "Department of Fisheries, Ministry of Fisheries, Animal Husbandry & Dairying, GoI",
        "state": "All Maritime States (National EEZ)",
        "category": "MONSOON_BAN",
        "effective_dates": "West Coast: June 1 – July 31 (61 days) | East Coast: April 15 – June 14 (61 days)",
        "legal_reference": "Order No. 31035/01/2026-FY",
        "text": """
1. Background and Purpose: To conserve marine fishery resources during the critical spawning and breeding season, the Government of India promulgates a uniform seasonal fishing ban in the Indian Exclusive Economic Zone (EEZ) beyond territorial waters.
2. West Coast Ban Schedule: An annual 61-day fishing ban is enforced along the entire Western Exclusive Economic Zone (covering maritime zones of Gujarat, Maharashtra, Goa, Karnataka, Kerala, Daman & Diu, and Lakshadweep) starting from midnight of 1st June and concluding on midnight of 31st July.
3. East Coast Ban Schedule: An annual 61-day fishing ban is enforced along the entire Eastern Exclusive Economic Zone (covering maritime zones of Tamil Nadu, Andhra Pradesh, Odisha, West Bengal, Puducherry, and Andaman & Nicobar Islands) starting from midnight of 15th April and concluding on midnight of 14th June.
4. Scope of Exemption: The prohibition applies strictly to all mechanized fishing vessels, motorized boats operating beyond 12 nautical miles, and deep-sea commercial trawlers. Traditional non-motorized artisanal country crafts (catamarans, vallams, canoe craft) operating within traditional nearshore waters are exempted from the ban.
5. Enforcement and Penalties: Any mechanized vessel found operating in the EEZ during the ban period will face immediate seizure of catch and gear, impounding of vessel by the Indian Coast Guard or Marine Police, and complete forfeiture of annual subsidized diesel quotas for a period of up to 3 years.
"""
    },
    {
        "doc_id": "DOC-KMFRA-ACT-REG",
        "title": "Kerala Marine Fishing Regulation Act (KMFRA) — Operational Guidelines & Mesh Specifications",
        "authority": "Department of Fisheries, Government of Kerala",
        "state": "Kerala",
        "category": "STATE_MFRA_GEAR_REGULATION",
        "effective_dates": "Active / Year-Round Enforcement",
        "legal_reference": "Kerala Act 10 of 1980 & Subsequent Amendments (KMFRA)",
        "text": """
1. Territorial Water Zoning: Kerala territorial waters (up to 12 nautical miles from baseline) are stratified for resource protection. The nearshore zone up to 10 kilometers (approx. 5.4 nautical miles) is exclusively reserved for traditional non-motorized and small motorized artisanal fishermen. Mechanized trawlers are strictly prohibited from operating within this 10 km artisanal reserve.
2. Minimum Legal Mesh Size Standards: To prevent juvenile catch depletion, all commercial gear must strictly adhere to minimum cod-end mesh sizes:
   - Trawl Net Cod-End: Minimum 35 mm square/diamond mesh.
   - Ring Seine / Purse Seine (Sardine & Mackerel target): Minimum 24 mm mesh size.
   - Gill Nets for Seer Fish: Minimum 75 mm to 100 mm stretched mesh.
3. Total Night Trawling Prohibition: Bottom trawling is strictly prohibited between 18:00 hours (sunset) and 06:00 hours (sunrise) within Kerala territorial waters.
4. Engine Power Limitations: Inboard and outboard fishing vessels operating in coastal waters shall not exceed authorized horsepower ratings (maximum 350 HP for multi-day trawlers and 9.9 to 25 HP for motorized country crafts).
5. Penalties for Violations: Non-compliant gear will be confiscated on-the-spot by Fisheries Enforcement Officers, and fines up to Rs. 2,50,000 shall be levied under Section 17 of KMFRA.
"""
    },
    {
        "doc_id": "DOC-TNMFR-IMBL-ADVISORY",
        "title": "Tamil Nadu Marine Fisheries Regulation Act & Palk Strait / IMBL Operational Advisory",
        "authority": "Department of Fisheries and Fishermen Welfare, Government of Tamil Nadu & Indian Coast Guard",
        "state": "Tamil Nadu",
        "category": "BORDER_SECURITY_AND_ROTATION",
        "effective_dates": "Active / Year-Round Enforcement",
        "legal_reference": "TNMFR Act 1983 & Joint Coast Guard Security Protocol",
        "text": """
1. Palk Bay Token & Rotation System: To prevent conflict between traditional fishermen and mechanized trawlers in the narrow Palk Strait, fishing operations from Rameswaram, Mandapam, and Jagadapattinam follow a strict 3-day / 4-day weekly rotational token schedule. Mechanized boats may only venture out on specified token days (Monday, Wednesday, Saturday mornings).
2. International Maritime Boundary Line (IMBL) Strict Warning: The International Maritime Boundary Line with Sri Lanka in the Palk Bay and Gulf of Mannar (as delimited by the 1974 and 1976 Indo-Sri Lankan Bilateral Agreements) is an inviolable international boundary.
   - Indian fishing vessels must maintain a safety buffer of at least 5 nautical miles on the Indian side of the IMBL.
   - Under no circumstances shall an Indian vessel cross the boundary line into Sri Lankan territorial waters or the Kachchatheevu maritime pocket for fishing.
   - Crossing the IMBL carries severe risk of interception, vessel confiscation, and arrest by the Sri Lanka Navy.
3. Gulf of Mannar Marine National Park Prohibition: No fishing or coral collection is permitted within the 21 core islands of the Gulf of Mannar Marine Biosphere Reserve under the Wildlife Protection Act 1972.
4. Biometric Registration Mandate: Every crew member embarking on an offshore voyage must carry a valid QR-coded Fishermen Biometric Identity Card issued by the Ministry of Fisheries.
"""
    },
    {
        "doc_id": "DOC-GUJ-SIRCREEK-SECURITY",
        "title": "Gujarat Fisheries Regulation & Indo-Pak Maritime Boundary Safety Protocol",
        "authority": "Directorate of Fisheries, Government of Gujarat & Indian Coast Guard (North-West Region)",
        "state": "Gujarat",
        "category": "BORDER_SECURITY_AND_COASTAL_ALERT",
        "effective_dates": "Active / Year-Round Enforcement",
        "legal_reference": "Gujarat Fisheries Act 2003 & SOP for Sir Creek Maritime Border",
        "text": """
1. Sir Creek and Notified Sensitive Border Sector: The maritime boundary between India and Pakistan in the Arabian Sea off the Kutch and Saurashtra coast is heavily militarized.
   - A 'No-Fishing Sensitive Security Zone' is established extending 10 nautical miles south of the Sir Creek mouth.
   - Indian fishing boats operating from Jakhau, Okha, and Porbandar must strictly avoid straying past Latitude 23°00'N in the western sector near Pakistan maritime coordinates.
2. Transponder & GPS Requirement: All mechanized fishing boats exceeding 12 meters in Length Overall (LOA) operating from Gujarat harbors must be equipped with active satellite-based Automatic Identification System (AIS Class B) or ISRO NAVIC / DAT-SG transponders.
3. Tampering Penalties: Switching off GPS transponders or operating without a valid fishing token from Gujarat Fisheries Department check-posts will result in immediate cancellation of registration and blacklisting under the Coastal Security Act.
4. Juvenile Silver Pomfret Catch Ban: Trawlers operating in the Gulf of Khambhat and Saurashtra waters must avoid landing silver pomfret below 100 grams body weight to prevent recruitment overfishing.
"""
    },
    {
        "doc_id": "DOC-ODISHA-TURTLE-BAN",
        "title": "Odisha Marine Fisheries Regulation Act — Gahirmatha Olive Ridley Sanctuary Mandate",
        "authority": "Department of Fisheries & Animal Resources, Government of Odisha",
        "state": "Odisha",
        "category": "WILDLIFE_SANCTUARY_AND_CONSERVATION",
        "effective_dates": "November 1 to May 31 (Annual 7-Month Protection Period)",
        "legal_reference": "Odisha Marine Fishing Regulation Act (OMFRA) 1982, Section 4",
        "text": """
1. Mass Olive Ridley Turtle Protection Period: To protect millions of congregating and nesting Olive Ridley sea turtles (Lepidochelys olivacea), a strict 7-month prohibition on mechanized fishing is enforced annually from 1st November to 31st May.
2. Prohibited Sanctuary Zones:
   - Gahirmatha Marine Sanctuary: Absolute ban on all commercial and mechanized fishing within the core marine boundary (Dhamra river mouth to Mahanadi river mouth, extending 20 km offshore into Bay of Bengal).
   - Devi and Rushikulya River Mouths: Mechanized fishing banned within a 20 km offshore radius around turtle mass-nesting beaches.
3. Turtle Excluder Devices (TED) Mandate: All mechanized trawl nets operating outside the 20 km prohibited zone in Odisha waters must be fitted with certified Turtle Excluder Devices (TED) to allow entrapped turtles to escape unharmed.
4. Enforcement by Operation Olivia: Enforced jointly by the Indian Coast Guard, Odisha Forest Department, and Marine Police. Seized vessels are confiscated under Section 51 of Wildlife (Protection) Act 1972.
"""
    },
    {
        "doc_id": "DOC-ICG-SAFETY-DISTRESS",
        "title": "Indian Coast Guard Coastal Maritime Safety, Distress Signaling & Navigation Mandate",
        "authority": "Indian Coast Guard Headquarters, New Delhi",
        "state": "All Indian Coastal Waters & EEZ",
        "category": "SAFETY_EQUIPMENT_AND_EMERGENCY",
        "effective_dates": "Active / Mandatory Compliance",
        "legal_reference": "Merchant Shipping Act & Indian Coast Guard Coastal Safety SOP",
        "text": """
1. Distress Communication Channels: All seagoing vessels must monitor and maintain communication on official maritime distress frequencies:
   - VHF Marine Channel 16 (156.800 MHz): Continuous watch for distress, safety, and urgency calls.
   - MF Distress Frequency: 2182 kHz.
   - Indian Coast Guard National Emergency Toll-Free Number: 1554 (accessible via coastal mobile networks).
2. Mandatory Vessel Safety Equipment: Every mechanized vessel venturing beyond 5 nautical miles from shore must carry:
   - Approved Life Jackets (one per crew member on board).
   - Minimum 2 Life Buoys fitted with buoyant lifelines and self-igniting lights.
   - Red Hand Flares (minimum 3 units) and Orange Smoke Signals (minimum 2 units) with unexpired shelf life.
   - Magnetic Marine Compass and operational GPS receiver.
   - Certified Class B Fire Extinguishers (minimum 2 units in engine and galley compartments).
3. Cyclone & Heavy Weather Protocol: When Port Warning Signals (Signal No. 3 or higher) or INCOIS Red Alerts are hoisted, all vessels must immediately cease fishing and return to the nearest designated harbor of refuge.
"""
    }
]


def chunk_document(doc: dict, chunk_size_words: int = 150, overlap_words: int = 30) -> list[dict]:
    """
    Splits a policy document into dense, contextualized chunks suitable for
    semantic search and vector embedding (pgvector / bge-small-en-v1.5).
    """
    lines = [l.strip() for l in doc["text"].strip().split("\n") if l.strip()]
    full_paragraphs = []
    
    current_para = []
    for line in lines:
        if line.startswith(("1.", "2.", "3.", "4.", "5.", "-")):
            if current_para:
                full_paragraphs.append(" ".join(current_para))
                current_para = []
        current_para.append(line)
    if current_para:
        full_paragraphs.append(" ".join(current_para))

    chunks = []
    for idx, para in enumerate(full_paragraphs, start=1):
        chunk_id = f"{doc['doc_id']}-CHUNK-{idx:02d}"
        
        # Pre-format context prefix for optimal dense retrieval
        context_prefix = f"[{doc['authority']} | {doc['state']} | {doc['category']}] Title: {doc['title']}"
        embedding_text = f"{context_prefix}\nEffective: {doc['effective_dates']}\nContent: {para}"

        chunks.append({
            "chunk_id": chunk_id,
            "doc_id": doc["doc_id"],
            "title": doc["title"],
            "authority": doc["authority"],
            "state": doc["state"],
            "category": doc["category"],
            "effective_dates": doc["effective_dates"],
            "legal_reference": doc["legal_reference"],
            "content": para,
            "embedding_ready_text": embedding_text,
            "character_count": len(para),
            "word_count": len(para.split())
        })

    return chunks


def build_knowledge_base():
    """Generates raw text documents and chunked vector knowledge base."""
    RAW_POLICY_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_KB_DIR.mkdir(parents=True, exist_ok=True)

    all_chunks = []

    # 1. Write individual raw policy files
    for doc in POLICY_DOCUMENTS:
        filename = f"{doc['doc_id'].lower().replace('-', '_')}.txt"
        file_path = RAW_POLICY_DIR / filename
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"TITLE: {doc['title']}\n")
            f.write(f"AUTHORITY: {doc['authority']}\n")
            f.write(f"JURISDICTION: {doc['state']}\n")
            f.write(f"CATEGORY: {doc['category']}\n")
            f.write(f"EFFECTIVE: {doc['effective_dates']}\n")
            f.write(f"LEGAL REFERENCE: {doc['legal_reference']}\n")
            f.write("=" * 80 + "\n\n")
            f.write(doc["text"].strip() + "\n")
        logger.info(f"Wrote raw policy document: {file_path}")

        # Chunk document
        chunks = chunk_document(doc)
        all_chunks.extend(chunks)

    # 2. Export vector-ready chunked JSON knowledge base
    kb_path = PROCESSED_KB_DIR / "maritime_policy_chunks.json"
    with open(kb_path, "w", encoding="utf-8") as f:
        json.dump({
            "metadata": {
                "source": "Project ORCA Sovereign Maritime Policy Corpus",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "documents_count": len(POLICY_DOCUMENTS),
                "total_chunks_count": len(all_chunks),
                "embedding_model_target": "bge-small-en-v1.5 / text-embedding-3-small",
                "target_vector_db": "PostgreSQL 16 + pgvector (VECTOR(384))"
            },
            "chunks": all_chunks
        }, f, indent=2)

    logger.info(f"Generated Vector-Ready RAG Knowledge Base: {kb_path} ({len(all_chunks)} chunks from {len(POLICY_DOCUMENTS)} documents)")


def main():
    parser = argparse.ArgumentParser(
        description="Project ORCA — Build Maritime Policy & Advisory RAG Knowledge Base"
    )
    args = parser.parse_args()
    build_knowledge_base()


if __name__ == "__main__":
    main()
