"""
Project ORCA (SIH26176) — Supervisor Routing Agent Node
Uses ChatOllama with structured output binding (SupervisorRoutingDecision) to deconstruct
user queries into spatial bounding boxes, target species, and multi-agent dispatch instructions.
"""

import json
import logging
from typing import Any
from pathlib import Path

from langchain_core.messages import SystemMessage, HumanMessage

from .state import ChatState
from .schemas import SupervisorRoutingDecision
from .llm_config import get_chat_llm, check_ollama_health

logger = logging.getLogger("ORCA.SupervisorAgent")

# Curated Indian Coastal Gazetteer with accurate sovereign coordinates & vernacular names
INDIAN_COASTAL_GAZETTEER = {
    "veraval": {
        "name": "Veraval",
        "state": "Gujarat",
        "lat": 20.902,
        "lon": 70.368,
        "sector": "North-West Arabian Sea",
        "default_bbox": [69.80, 20.40, 70.80, 21.30],
        "primary_species": "Yellowfin Tuna",
        "vernacular": ["વેરાવળ", "वेरावल", "veraval"]
    },
    "porbandar": {
        "name": "Porbandar",
        "state": "Gujarat",
        "lat": 21.638,
        "lon": 69.595,
        "sector": "Saurashtra Coast",
        "default_bbox": [69.00, 21.10, 70.00, 22.00],
        "primary_species": "Ribbonfish / Pomfret",
        "vernacular": ["પોરબંદર", "पोरबंदर", "porbandar"]
    },
    "okha": {
        "name": "Okha",
        "state": "Gujarat",
        "lat": 22.470,
        "lon": 69.075,
        "sector": "Gulf of Kutch",
        "default_bbox": [68.50, 22.00, 69.50, 22.80],
        "primary_species": "Croakers / Shrimps",
        "vernacular": ["ઓખા", "ओखा", "okha"]
    },
    "ratnagiri": {
        "name": "Ratnagiri",
        "state": "Maharashtra",
        "lat": 16.995,
        "lon": 73.275,
        "sector": "Central Konkan Coast",
        "default_bbox": [72.60, 16.40, 73.60, 17.40],
        "primary_species": "King Seer / Surmai",
        "vernacular": ["रत्नागिरी", "ratnagiri"]
    },
    "mumbai": {
        "name": "Mumbai (Sassoon Dock)",
        "state": "Maharashtra",
        "lat": 18.915,
        "lon": 72.825,
        "sector": "Konkan Coast",
        "default_bbox": [72.20, 18.30, 73.20, 19.30],
        "primary_species": "Bombay Duck / Pomfret",
        "vernacular": ["मुंबई", "mumbai", "bombay"]
    },
    "mangalore": {
        "name": "Mangalore (Old Bunder)",
        "state": "Karnataka",
        "lat": 12.855,
        "lon": 74.832,
        "sector": "Canara Coast",
        "default_bbox": [74.20, 12.30, 75.20, 13.30],
        "primary_species": "Mackerel / Sardine",
        "vernacular": ["ಮಂಗಳೂರು", "मंगलुरु", "mangalore"]
    },
    "kochi": {
        "name": "Kochi (Cochin Harbor)",
        "state": "Kerala",
        "lat": 9.942,
        "lon": 76.262,
        "sector": "Malabar Coast",
        "default_bbox": [75.60, 9.40, 76.60, 10.40],
        "primary_species": "Indian Oil Sardine",
        "vernacular": ["കൊച്ചി", "कोच्चि", "kochi", "cochin"]
    },
    "tuticorin": {
        "name": "Tuticorin (Thoothukudi)",
        "state": "Tamil Nadu",
        "lat": 8.800,
        "lon": 78.160,
        "sector": "Gulf of Mannar",
        "default_bbox": [77.60, 8.20, 78.60, 9.20],
        "primary_species": "Pelagic Tuna / Snappers",
        "vernacular": ["தூத்துக்குடி", "तूतीकोरिन", "tuticorin", "thoothukudi"]
    },
    "rameswaram": {
        "name": "Rameswaram",
        "state": "Tamil Nadu",
        "lat": 9.285,
        "lon": 79.315,
        "sector": "Palk Strait Border Zone",
        "default_bbox": [78.80, 8.80, 79.80, 9.60],
        "primary_species": "Blue Swimming Crab / Tuna",
        "vernacular": ["ராமேஸ்வரம்", "रामेश्वरम", "rameswaram", "palk"]
    },
    "chennai": {
        "name": "Chennai (Kasimedu Harbor)",
        "state": "Tamil Nadu",
        "lat": 13.128,
        "lon": 80.298,
        "sector": "Coromandel Coast",
        "default_bbox": [79.80, 12.60, 80.80, 13.60],
        "primary_species": "Seer Fish / Prawns",
        "vernacular": ["சென்னை", "चेन्नई", "chennai", "madras", "kasimedu"]
    },
    "visakhapatnam": {
        "name": "Visakhapatnam",
        "state": "Andhra Pradesh",
        "lat": 17.698,
        "lon": 83.298,
        "sector": "Northern Circars",
        "default_bbox": [82.80, 17.10, 83.80, 18.10],
        "primary_species": "Yellowfin Tuna / Ribbonfish",
        "vernacular": ["విశాఖపట్నం", "विशाखापट्टनम", "visakhapatnam", "vizag"]
    },
    "paradip": {
        "name": "Paradip",
        "state": "Odisha",
        "lat": 20.298,
        "lon": 86.685,
        "sector": "North-East Bay of Bengal",
        "default_bbox": [86.10, 19.80, 87.10, 20.80],
        "primary_species": "Hilsa / Pomfret",
        "vernacular": ["ପାରାଦୀପ", "पारादीप", "paradip"]
    },
    "portblair": {
        "name": "Port Blair",
        "state": "Andaman & Nicobar",
        "lat": 11.672,
        "lon": 92.735,
        "sector": "Andaman Sea",
        "default_bbox": [92.20, 11.20, 93.20, 12.20],
        "primary_species": "Skipjack Tuna / Trevally",
        "vernacular": ["पोर्ट ब्लेयर", "port blair", "portblair", "andaman"]
    }
}

SUPERVISOR_SYSTEM_PROMPT = """
You are the Chief Maritime Supervisor & Spatial Intent Orchestrator for Project ORCA (SIH26176).
Your task is to analyze natural language fishing and navigation queries for the Indian Exclusive Economic Zone (EEZ).

Extract the following structured information:
1. Origin Harbor: Match to known Indian fishing ports (e.g., Veraval, Kochi, Ratnagiri, Rameswaram, Visakhapatnam, Paradip, etc.).
2. Target Species: Identify target fish (e.g., Tuna, Mackerel, Sardine, Crab, Pomfret).
3. Vessel parameters: Count and type (mechanized trawler, motorized boat, etc.).
4. Sub-agent dispatching flags: Determine whether to trigger Ocean Analytics, Geospatial Risk, and Policy RAG engines.
5. Language code: Detect English (en), Gujarati (gu), Tamil (ta), Hindi (hi), Telugu (te), Malayalam (ml), Marathi (mr).

Always output strictly according to the SupervisorRoutingDecision schema.
"""


def detect_indic_language(text: str) -> str:
    """Detects Indic script or returns 'en'."""
    for char in text:
        code = ord(char)
        if 0x0A80 <= code <= 0x0AFF:
            return "gu"  # Gujarati
        elif 0x0B80 <= code <= 0x0BFF:
            return "ta"  # Tamil
        elif 0x0900 <= code <= 0x097F:
            return "hi"  # Hindi / Marathi
        elif 0x0C00 <= code <= 0x0C7F:
            return "te"  # Telugu
        elif 0x0D00 <= code <= 0x0D7F:
            return "ml"  # Malayalam
    return "en"


def resolve_coastal_gazetteer(query_text: str) -> dict[str, Any]:
    """Resolves coastal harbor and state metadata by scanning query text against gazetteer."""
    text_lower = query_text.lower()

    for key, data in INDIAN_COASTAL_GAZETTEER.items():
        if key in text_lower:
            return data
        for v in data["vernacular"]:
            if v.lower() in text_lower:
                return data

    # Default fallback: Veraval, Gujarat
    return INDIAN_COASTAL_GAZETTEER["veraval"]


async def supervisor_node(state: ChatState) -> dict[str, Any]:
    """
    Supervisor LangGraph Node:
    Extracts structured intent using ChatOllama with structured output binding,
    or falls back to high-accuracy deterministic gazetteer resolution.
    """
    messages = state.get("messages", [])
    user_query = messages[-1].content if messages else ""
    user_query_str = str(user_query).strip()

    logger.info(f"🧭 [Supervisor Node] Processing query: '{user_query_str[:80]}...'")

    detected_lang = detect_indic_language(user_query_str)
    gazetteer_match = resolve_coastal_gazetteer(user_query_str)

    decision: SupervisorRoutingDecision | None = None

    # 1. Attempt LLM Structured Output with Ollama if running
    is_ollama_online = await check_ollama_health()
    if is_ollama_online:
        try:
            llm = get_chat_llm(temperature=0.0)
            structured_llm = llm.with_structured_output(SupervisorRoutingDecision)
            
            prompt_messages = [
                SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT),
                HumanMessage(content=user_query_str)
            ]
            llm_result = await structured_llm.ainvoke(prompt_messages)
            if isinstance(llm_result, SupervisorRoutingDecision):
                decision = llm_result
                logger.info(f"✅ [Supervisor Node] Ollama structured decision extracted: {decision.origin_harbor}")
        except Exception as e:
            logger.warning(f"Ollama structured invocation fallback triggered: {e}")

    # 2. Fallback to Deterministic Gazetteer Resolution if LLM unavailable or partial
    if decision is None:
        logger.info(f"ℹ️ [Supervisor Node] Using deterministic gazetteer resolution for '{gazetteer_match['name']}'")
        
        # Extract species keywords
        species = gazetteer_match["primary_species"]
        for sp in ["Tuna", "Mackerel", "Sardine", "Pomfret", "Hilsa", "Crab", "Shrimp", "Kingfish", "Surmai"]:
            if sp.lower() in user_query_str.lower():
                species = sp
                break

        decision = SupervisorRoutingDecision(
            origin_harbor=gazetteer_match["name"],
            state_or_union_territory=gazetteer_match["state"],
            coordinates=[gazetteer_match["lon"], gazetteer_match["lat"]],
            target_bbox=gazetteer_match["default_bbox"],
            target_species=species,
            vessel_count=1,
            vessel_type="mechanized_trawler",
            distance_offshore_km=30.0,
            time_horizon_hours=24,
            dispatch_ocean_analytics=True,
            dispatch_spatial_risk=True,
            dispatch_policy_rag=True,
            detected_language=detected_lang,
            intent_summary=f"Maritime advisory request for {gazetteer_match['name']} targeting {species}."
        )

    # Format state updates to propagate through LangGraph
    origin_payload = {
        "name": decision.origin_harbor,
        "state": decision.state_or_union_territory,
        "lat": decision.coordinates[1],
        "lon": decision.coordinates[0],
        "distance_offshore_km": decision.distance_offshore_km,
        "vessel_type": decision.vessel_type
    }

    return {
        "origin": origin_payload,
        "target_bbox": decision.target_bbox,
        "species": decision.target_species,
        "language_code": decision.detected_language
    }
