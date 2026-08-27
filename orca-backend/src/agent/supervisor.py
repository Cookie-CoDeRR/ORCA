"""
Project ORCA (SIH26176) — Supervisor Routing Agent Node
Uses ChatOllama (Qwen 2.5) with structured output binding (RouteDecision) to deconstruct
user queries into target coordinates, intent classification, and next agent routing directives.
"""

import logging
from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import BaseMessage

from .state import ChatState
from .schemas import RouteDecision, SupervisorRoutingDecision
from .llm_config import chat_llm, check_ollama_health

logger = logging.getLogger("ORCA.SupervisorAgent")

# ==============================================================================
# PROMPT DEFINITIONS
# ==============================================================================

SUPERVISOR_SYSTEM_PROMPT = (
    "You are the orchestrator for Project ORCA, a marine intelligence system. "
    "Your job is to analyze the user's query, extract geographical targets, and decide which "
    "specialized agent must process the request next. You must return your response matching "
    "the specified JSON schema."
)

supervisor_prompt_template = ChatPromptTemplate.from_messages([
    ("system", SUPERVISOR_SYSTEM_PROMPT),
    ("human", "{user_query}")
])

# ==============================================================================
# INDIAN COASTAL GAZETTEER FOR ROBUST COORDINATE EXTRACTION
# ==============================================================================

COASTAL_COORDINATES_LOOKUP: dict[str, dict[str, Any]] = {
    "veraval": {"lat": 20.902, "lon": 70.368, "state": "Gujarat", "name": "Veraval", "species": "Yellowfin Tuna"},
    "porbandar": {"lat": 21.638, "lon": 69.595, "state": "Gujarat", "name": "Porbandar", "species": "Ribbonfish / Pomfret"},
    "okha": {"lat": 22.470, "lon": 69.075, "state": "Gujarat", "name": "Okha", "species": "Croakers"},
    "ratnagiri": {"lat": 16.995, "lon": 73.275, "state": "Maharashtra", "name": "Ratnagiri", "species": "King Seer / Surmai"},
    "mumbai": {"lat": 18.915, "lon": 72.825, "state": "Maharashtra", "name": "Mumbai", "species": "Bombay Duck"},
    "mangalore": {"lat": 12.855, "lon": 74.832, "state": "Karnataka", "name": "Mangalore", "species": "Mackerel / Sardine"},
    "kochi": {"lat": 9.942, "lon": 76.262, "state": "Kerala", "name": "Kochi", "species": "Indian Oil Sardine"},
    "cochin": {"lat": 9.942, "lon": 76.262, "state": "Kerala", "name": "Kochi", "species": "Indian Oil Sardine"},
    "tuticorin": {"lat": 8.800, "lon": 78.160, "state": "Tamil Nadu", "name": "Tuticorin", "species": "Pelagic Tuna"},
    "rameswaram": {"lat": 9.285, "lon": 79.315, "state": "Tamil Nadu", "name": "Rameswaram", "species": "Blue Swimming Crab"},
    "chennai": {"lat": 13.128, "lon": 80.298, "state": "Tamil Nadu", "name": "Chennai", "species": "Seer Fish"},
    "visakhapatnam": {"lat": 17.698, "lon": 83.298, "state": "Andhra Pradesh", "name": "Visakhapatnam", "species": "Yellowfin Tuna"},
    "vizag": {"lat": 17.698, "lon": 83.298, "state": "Andhra Pradesh", "name": "Visakhapatnam", "species": "Yellowfin Tuna"},
    "paradip": {"lat": 20.298, "lon": 86.685, "state": "Odisha", "name": "Paradip", "species": "Hilsa / Pomfret"},
    "port blair": {"lat": 11.672, "lon": 92.735, "state": "Andaman & Nicobar", "name": "Port Blair", "species": "Skipjack Tuna"}
}


def extract_coastal_target(query_text: str) -> dict[str, Any]:
    """Extracts sovereign Indian coastal coordinates from query text or vernacular names."""
    text_lower = query_text.lower()
    for key, data in COASTAL_COORDINATES_LOOKUP.items():
        if key in text_lower:
            return data
    # Default fallback: Veraval Harbor, Gujarat
    return COASTAL_COORDINATES_LOOKUP["veraval"]


# ==============================================================================
# SUPERVISOR NODE IMPLEMENTATION
# ==============================================================================

async def supervisor_node(state: ChatState) -> dict[str, Any]:
    """
    Supervisor LangGraph Node:
    1. Reads the latest user message from the LangGraph state.
    2. Calls model.with_structured_output(RouteDecision).
    3. Returns the structured output appended to the state so LangGraph can
       conditionally route execution to the appropriate Python engine.
    """
    messages: list[BaseMessage] = state.get("messages", [])
    if not messages:
        user_query_str = "Can we go for Tuna fishing near Veraval?"
    else:
        user_query_str = str(messages[-1].content).strip()

    logger.info(f"🧭 [Supervisor Node] Ingesting query: '{user_query_str[:80]}...'")

    coastal_target = extract_coastal_target(user_query_str)
    route_decision: RouteDecision | None = None

    # Check if local Ollama daemon is running with Qwen 2.5
    is_ollama_available = await check_ollama_health()

    if is_ollama_available:
        try:
            structured_model = chat_llm.with_structured_output(RouteDecision)
            chain = supervisor_prompt_template | structured_model
            result = await chain.ainvoke({"user_query": user_query_str})
            if isinstance(result, RouteDecision):
                route_decision = result
                logger.info(f"✅ [Supervisor Node] Structured Qwen2.5 decision: intent='{route_decision.intent}', next='{route_decision.next_agent}'")
        except Exception as e:
            logger.warning(f"Ollama structured invocation fallback triggered ({e}). Using deterministic routing.")

    # Fallback to deterministic routing logic if Ollama daemon is starting up or offline
    if route_decision is None:
        text_lower = user_query_str.lower()
        lat, lon = coastal_target["lat"], coastal_target["lon"]

        if any(w in text_lower for w in ["border", "imbl", "sri lanka", "pakistan", "safe", "danger", "risk", "warning"]):
            intent = "CHECK_SAFETY"
            next_agent = "risk_geofencing"
            reasoning = f"User inquired about border safety and navigation risk near {coastal_target['name']}."
        elif any(w in text_lower for w in ["ban", "rule", "law", "act", "monsoon", "permit", "license", "penalty"]):
            intent = "POLICY_QUERY"
            next_agent = "policy_rag"
            reasoning = f"User inquired about maritime policy and seasonal monsoon regulations in {coastal_target['state']}."
        elif any(w in text_lower for w in ["fish", "tuna", "mackerel", "catch", "zone", "pfz", "sea", "ocean", "weather", "sst"]):
            intent = "FIND_FISHING_ZONE"
            next_agent = "ocean_analytics"
            reasoning = f"User requested Potential Fishing Zone (PFZ) oceanographic analytics for {coastal_target['name']}."
        else:
            intent = "GENERAL_ADVISORY"
            next_agent = "synthesizer"
            reasoning = f"General maritime advisory request mapped to {coastal_target['name']} landing center."

        route_decision = RouteDecision(
            intent=intent,
            target_coordinates=[lat, lon],
            next_agent=next_agent,
            reasoning=reasoning
        )

    # Resolve target bounding box around target coordinates
    lat = route_decision.target_coordinates[0] if route_decision.target_coordinates else coastal_target["lat"]
    lon = route_decision.target_coordinates[1] if len(route_decision.target_coordinates) > 1 else coastal_target["lon"]
    target_bbox = [round(lon - 0.4, 2), round(lat - 0.4, 2), round(lon + 0.4, 2), round(lat + 0.4, 2)]

    # Populate state dictionary with strict type safety
    origin_payload = {
        "name": coastal_target["name"],
        "state": coastal_target["state"],
        "lat": lat,
        "lon": lon,
        "route_decision": route_decision.model_dump()
    }

    return {
        "origin": origin_payload,
        "target_bbox": target_bbox,
        "species": coastal_target["species"],
        "spatial_risk": {"route_decision": route_decision.model_dump()}
    }
