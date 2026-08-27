#!/usr/bin/env python3
"""
Project ORCA (SIH26176) — Script 08: Build Maritime Policy RAG Knowledge Base
Downloads and structures authoritative Indian maritime regulatory summaries:
  1. Uniform Seasonal Monsoon Fishing Ban Rules (West & East Coast schedules)
  2. Standard Operating Procedures for Maritime Distress & VHF Channel 16
  3. Indian Maritime Zones Act (Territorial Waters, Contiguous Zone, EEZ)
  4. Marine Protected Areas & Wildlife Protection Act guidelines for coral reefs
Implements recursive text chunker (chunk size: 500 characters, overlap: 50 characters).
Outputs structured vector-ready chunks:
  { id: str, title: str, category: str, source: str, content: str, metadata: dict }
Saves to: data/processed/knowledge_base/maritime_policy_chunks.json
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
logger = logging.getLogger("ORCA.RAGKnowledgeBase")

RAW_POLICY_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "policy_docs"
PROCESSED_KB_DIR = Path(__file__).resolve().parent.parent / "data" / "processed" / "knowledge_base"


# ==============================================================================
# AUTHORITATIVE INDIAN MARITIME POLICY SUMMARIES
# ==============================================================================
POLICY_DOCUMENTS = [
    {
        "doc_id": "POL-BAN-UNIFORM-2026",
        "title": "Uniform Seasonal Monsoon Fishing Ban Rules in Indian Exclusive Economic Zone",
        "category": "Monsoon Fishing Ban",
        "source": "Ministry of Fisheries, Animal Husbandry and Dairying, Government of India (Order No. 31035/01/2026-FY)",
        "metadata": {
            "authority": "Department of Fisheries, GoI",
            "jurisdiction": "Indian EEZ (All Coastal States)",
            "effective_dates": "West Coast: June 1 to July 31 (61 days) | East Coast: April 15 to June 14 (61 days)",
            "applicable_to": "Mechanized and motorized fishing vessels beyond territorial waters",
            "exemption": "Traditional non-motorized artisanal country craft",
            "penalties": "Vessel impoundment, confiscation of catch and gear, suspension of subsidized diesel"
        },
        "text": """
The Government of India enforces an annual uniform seasonal fishing ban in the Indian Exclusive Economic Zone (EEZ) to facilitate fish breeding, biological rejuvenation, and conservation of pelagic and demersal marine stocks.
On the West Coast (covering the maritime zones of Gujarat, Maharashtra, Goa, Karnataka, Kerala, Daman & Diu, and Lakshadweep), the 61-day ban is active from midnight of 1st June to midnight of 31st July every year.
On the East Coast (covering the maritime zones of Tamil Nadu, Andhra Pradesh, Odisha, West Bengal, Puducherry, and Andaman & Nicobar Islands), the 61-day ban is active from midnight of 15th April to midnight of 14th June every year.
The prohibition applies strictly to all mechanized fishing trawlers, purse-seiners, and motorized vessels venturing beyond 12 nautical miles. Traditional non-motorized country crafts are permitted to fish in nearshore waters. Violating vessels face interception by the Indian Coast Guard, seizure of vessel, and cancellation of maritime fishing permits.
"""
    },
    {
        "doc_id": "POL-DISTRESS-VHF-SOP",
        "title": "Standard Operating Procedures for Maritime Distress Signaling & VHF Channel 16",
        "category": "Maritime Safety & Distress",
        "source": "Indian Coast Guard Coastal Security & Search and Rescue (SAR) Directive",
        "metadata": {
            "authority": "Indian Coast Guard (Ministry of Defence)",
            "jurisdiction": "Indian Maritime Search and Rescue Region (ISRR)",
            "emergency_frequencies": "VHF Marine Channel 16 (156.8 MHz), MF 2182 kHz, Toll-free 1554",
            "mandatory_equipment": "Life jackets, Lifebuoys with lines, Parachute flares, Smoke signals, AIS Class B",
            "mcc_contact": "Maritime Rescue Coordination Centre (MRCC) Mumbai, Chennai, Port Blair"
        },
        "text": """
All seagoing commercial and fishing vessels operating within the Indian Search and Rescue Region (ISRR) must maintain continuous listening watch on VHF Marine Channel 16 (156.800 MHz) for distress, urgency, and safety alerts.
In emergency situations (vessel sinking, collision, fire, medical evacuation, man overboard), the international standard distress call 'MAYDAY MAYDAY MAYDAY' must be broadcast on Channel 16 stating vessel name, GPS coordinates, nature of distress, and crew count.
Every mechanized fishing vessel is legally required to carry approved life jackets for all crew members, minimum 2 lifebuoys with self-igniting lights, pyrotechnic distress signals (minimum 3 red hand flares and 2 orange smoke signals), and certified fire extinguishers.
Coastal fishermen can also trigger one-touch emergency distress alerts using ISRO Distress Alert Transmitters (DAT-SG) or dial the Coast Guard national toll-free helpline 1554. When Port Warning Signal No. 3 or severe weather alerts are hoisted by IMD/INCOIS, all offshore vessels must immediately retreat to the nearest designated harbor of refuge.
"""
    },
    {
        "doc_id": "POL-MARITIME-ZONES-ACT",
        "title": "Territorial Waters, Continental Shelf, Exclusive Economic Zone and other Maritime Zones Act",
        "category": "Maritime Boundaries & Jurisdiction",
        "source": "The Territorial Waters, Continental Shelf, Exclusive Economic Zone and other Maritime Zones Act, 1976 (Act No. 80 of 1976)",
        "metadata": {
            "authority": "Parliament of India / Ministry of External Affairs",
            "jurisdiction": "Sovereign Maritime Zones of the Republic of India",
            "zones_defined": "Territorial Waters (12 NM), Contiguous Zone (24 NM), EEZ (200 NM)",
            "treaties": "Indo-Sri Lanka Maritime Agreements 1974/1976, UNCLOS 1982",
            "penalties": "Prosecution under Maritime Zones of India (Regulation of Fishing by Foreign Vessels) Act 1981"
        },
        "text": """
Under the Maritime Zones Act of 1976, the sovereignty of India extends to territorial waters up to 12 nautical miles (NM) measured from the baseline. The state fisheries departments exercise primary regulatory control within this 12 NM territorial zone.
The Contiguous Zone extends to 24 nautical miles, wherein Indian authorities exercise customs, fiscal, immigration, and sanitary jurisdiction.
The Exclusive Economic Zone (EEZ) of India extends up to 200 nautical miles from the baseline, enclosing approximately 2.02 million square kilometers. India holds sovereign rights for the purpose of exploring, exploiting, conserving, and managing natural living and non-living resources within the EEZ.
Foreign vessels are strictly prohibited from fishing or conducting scientific research within the Indian EEZ without explicit license from the Central Government.
Furthermore, the International Maritime Boundary Line (IMBL) between India and Sri Lanka (Palk Bay & Gulf of Mannar) and India and Pakistan (Sir Creek Arabian Sea sector) represents inviolable sovereign borders; unauthorized crossing by Indian fishing craft carries high risk of arrest, detention, and confiscation under foreign jurisdiction.
"""
    },
    {
        "doc_id": "POL-MPA-WPA-CORALS",
        "title": "Marine Protected Areas, Coral Reef Protection & Wildlife Protection Act Guidelines",
        "category": "Marine Conservation & Coral Reefs",
        "source": "Wild Life (Protection) Act, 1972 (Schedule I Marine Taxa) & Ministry of Environment, Forest and Climate Change (MoEFCC)",
        "metadata": {
            "authority": "Forest & Environment Departments / Wildlife Crime Control Bureau",
            "protected_sanctuaries": "Gulf of Mannar Marine National Park, Marine National Park Gulf of Kutch, Gahirmatha, Sundarbans, Malvan",
            "schedule_i_species": "All Hard Corals (Scleractinia), Sea Cow (Dugong), Whale Shark, Olive Ridley Turtle, Sea Horses",
            "prohibited_actions": "Bottom trawling, coral reef destruction, blast fishing, collection of sea cucumbers"
        },
        "text": """
The Wild Life (Protection) Act of 1972 accords the highest level of statutory protection (Schedule I) to vulnerable marine species and sensitive reef ecosystems in India.
All species of stony hard corals (Scleractinia), black corals (Antipatharia), sea fans (Gorgonians), sea cucumbers (Holothurians), Dugongs (Dugong dugon), Whale Sharks (Rhincodon typus), and all species of Sea Turtles are classified under Schedule I.
In designated Marine Protected Areas (MPAs) such as the Gulf of Mannar Marine National Park (Tamil Nadu), Marine National Park Gulf of Kutch (Gujarat), and Gahirmatha Marine Sanctuary (Odisha), bottom trawling, purse-seining, and anchoring on live coral reefs are strictly prohibited.
At Gahirmatha and the Rushikulya estuary, an annual 7-month total mechanized fishing ban is enforced between 1st November and 31st May to protect Olive Ridley mass nesting rookeries. All mechanized trawlers operating in adjacent waters must install certified Turtle Excluder Devices (TED). Violators face mandatory imprisonment up to 7 years and vessel confiscation under Section 51 of the Wildlife Protection Act.
"""
    }
]


def recursive_character_chunker(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Recursively splits text into chunks of target size (500 chars) with specified overlap (50 chars),
    respecting sentence and paragraph boundaries where possible.
    """
    cleaned_text = " ".join(text.strip().split())
    if len(cleaned_text) <= chunk_size:
        return [cleaned_text]

    chunks = []
    start = 0
    while start < len(cleaned_text):
        end = start + chunk_size
        if end >= len(cleaned_text):
            chunks.append(cleaned_text[start:])
            break

        # Look for natural punctuation split point (period, semicolon, newline) near end
        split_idx = -1
        for sep in [". ", "? ", "! ", "; ", " "]:
            candidate = cleaned_text.rfind(sep, start + chunk_size - 100, end)
            if candidate != -1:
                split_idx = candidate + len(sep)
                break

        if split_idx == -1 or split_idx <= start:
            split_idx = end

        chunk_str = cleaned_text[start:split_idx].strip()
        if chunk_str:
            chunks.append(chunk_str)

        # Advance start pointer accounting for overlap
        start = max(start + 1, split_idx - overlap)

    return chunks


def build_and_export_knowledge_base():
    """Processes policy documents, performs recursive chunking, and exports structured JSON."""
    RAW_POLICY_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_KB_DIR.mkdir(parents=True, exist_ok=True)

    all_chunks = []
    chunk_counter = 1

    for doc in POLICY_DOCUMENTS:
        # Save raw policy document text file
        raw_file_name = f"{doc['doc_id'].lower().replace('-', '_')}.txt"
        raw_path = RAW_POLICY_DIR / raw_file_name
        with open(raw_path, "w", encoding="utf-8") as f:
            f.write(f"TITLE: {doc['title']}\n")
            f.write(f"CATEGORY: {doc['category']}\n")
            f.write(f"SOURCE: {doc['source']}\n")
            f.write("METADATA:\n" + json.dumps(doc["metadata"], indent=2) + "\n")
            f.write("=" * 80 + "\n\n")
            f.write(doc["text"].strip() + "\n")
        logger.info(f"Saved raw policy document: {raw_path.name}")

        # Chunk text using recursive character chunker (500 chars, 50 overlap)
        text_chunks = recursive_character_chunker(doc["text"], chunk_size=500, overlap=50)

        for sub_idx, chunk_text in enumerate(text_chunks, start=1):
            chunk_obj = {
                "id": f"ORCA-RAG-{chunk_counter:04d}",
                "title": doc["title"],
                "category": doc["category"],
                "source": doc["source"],
                "content": chunk_text,
                "metadata": {
                    "doc_id": doc["doc_id"],
                    "chunk_index": sub_idx,
                    "total_doc_chunks": len(text_chunks),
                    "character_length": len(chunk_text),
                    **doc["metadata"]
                }
            }
            all_chunks.append(chunk_obj)
            chunk_counter += 1

    # Save to requested destination: data/processed/knowledge_base/maritime_policy_chunks.json
    output_kb_path = PROCESSED_KB_DIR / "maritime_policy_chunks.json"
    payload = {
        "metadata": {
            "project": "Project ORCA (SIH26176)",
            "knowledge_base_name": "Indian Maritime Policy & Advisory RAG Corpus",
            "chunk_size": 500,
            "chunk_overlap": 50,
            "total_documents": len(POLICY_DOCUMENTS),
            "total_chunks": len(all_chunks),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "target_vector_db": "PostgreSQL 16 + pgvector (VECTOR(384))"
        },
        "chunks": all_chunks
    }

    with open(output_kb_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    logger.info(f"✅ Successfully exported {len(all_chunks)} vector-ready RAG chunks to {output_kb_path}")
    return len(all_chunks)


def main():
    parser = argparse.ArgumentParser(
        description="Project ORCA — Build Maritime Policy RAG Knowledge Base"
    )
    args = parser.parse_args()
    build_and_export_knowledge_base()


if __name__ == "__main__":
    main()
