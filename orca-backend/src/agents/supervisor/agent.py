"""
Project ORCA (SIH26176) — Supervisor Agent Node
Uses ChatOllama (Qwen 2.5) with SubTaskPlan structured output to decompose queries
into spatial coordinates, apply persona pre-prompts, and selectively trigger worker nodes.
"""

import re
import logging
from typing import Any

from langchain_core.messages import SystemMessage, HumanMessage

from ..state import AgentState
from .schemas import SubTaskPlan
from .prompts import SUPERVISOR_SYSTEM_PROMPT, supervisor_prompt_template
from ...agent.llm_config import get_chat_llm, check_ollama_health

logger = logging.getLogger("ORCA.SupervisorAgent")

# Sovereign Indian coastal ports & landing centers gazetteer
GAZETTEER = {
    "veraval": [20.902, 70.368],
    "porbandar": [21.638, 69.595],
    "okha": [22.470, 69.075],
    "kandla": [23.000, 70.220],
    "ratnagiri": [16.995, 73.275],
    "mumbai": [18.915, 72.825],
    "goa": [15.498, 73.827],
    "panaji": [15.498, 73.827],
    "karwar": [14.818, 74.130],
    "mangalore": [12.855, 74.832],
    "malpe": [13.350, 74.700],
    "kochi": [9.942, 76.262],
    "cochin": [9.942, 76.262],
    "kollam": [8.893, 76.589],
    "trivandrum": [8.487, 76.952],
    "kanyakumari": [8.088, 77.538],
    "tuticorin": [8.800, 78.160],
    "rameswaram": [9.285, 79.315],
    "palk strait": [9.500, 79.500],
    "nagapattinam": [10.765, 79.842],
    "chennai": [13.128, 80.298],
    "visakhapatnam": [17.698, 83.298],
    "vizag": [17.698, 83.298],
    "kakinada": [16.989, 82.247],
    "paradip": [20.298, 86.685],
    "dhamra": [20.800, 86.950],
    "kolkata": [22.572, 88.363],
    "digha": [21.626, 87.507],
    "port blair": [11.672, 92.735],
    "kavaratti": [10.566, 72.641],
    "lakshadweep": [10.566, 72.641],
    "andaman": [11.672, 92.735],
}

BASIN_DEFAULT_COORDS = {
    "arabian_sea": [20.902, 70.368],
    "bay_of_bengal": [17.698, 83.298],
    "lakshadweep": [10.566, 72.641],
    "andaman": [11.672, 92.735],
}

ROLE_PROMPT_PREFIXES = {
    "researcher": "Role: Marine Scientist / Oceanographer. Focus on analytical precision, raw parameters (SST, Chlorophyll, SWH), spatial correlations, and scientific data provenance.",
    "navigator": "Role: Fishing Fleet Master / Commercial Navigator. Focus on pragmatic safety, targeted fish species, feeding windows, fuel conservation, and clear hazard alerts.",
    "student": "Role: Oceanography Student / Learner. Provide clear, educational explanations of oceanic mechanisms (thermal fronts, upwelling, currents) along with answers.",
    "defense": "Role: Naval / Coast Guard Defense Officer. Prioritize sovereign boundary clearance (IMBL), standoff distances, AIS vessel surveillance, and safety communications.",
    "authority": "Role: Coastal / Disaster Management Authority. Emphasize cyclone track buffers, adverse sea state warnings, and public safety directives.",
}


async def supervisor_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Decomposes the incoming user query into sub-tasks and extracts spatial coordinates.
    """
    messages = state.get("messages", [])
    if messages:
        user_query = str(messages[-1].content).strip()
    else:
        user_query = state.get("user_query", "Maritime inquiry")

    user_role = state.get("user_role", "navigator")
    active_basin = state.get("active_basin", "arabian_sea")
    format_mode = state.get("format_mode", "conversational")

    logger.info(f"🧭 [Supervisor Node] Evaluating query: '{user_query[:80]}...' | Role: '{user_role}' | Mode: '{format_mode}'")

    plan: SubTaskPlan | None = None

    # 1. Attempt LLM Structured Output with Qwen 2.5
    is_live = await check_ollama_health()
    if is_live:
        try:
            llm = get_chat_llm(model="qwen2.5:7b-instruct-q5_k_m", temperature=0.0)
            structured_llm = llm.with_structured_output(SubTaskPlan)
            system_instruction = f"{SUPERVISOR_SYSTEM_PROMPT}\n\n{ROLE_PROMPT_PREFIXES.get(user_role, '')}"
            res = await structured_llm.ainvoke([
                SystemMessage(content=system_instruction),
                HumanMessage(content=user_query)
            ])
            if isinstance(res, SubTaskPlan):
                plan = res
                logger.info(f"✅ [Supervisor Node] Structured plan generated: {plan.tasks_to_trigger}")
        except Exception as e:
            logger.warning(f"Ollama plan generation fallback: {e}")

    # 2. Deterministic Fallback if LLM daemon is offline
    if plan is None:
        text_lower = user_query.lower().strip()
        
        # Check for conversational greetings / help
        is_greeting = any(
            text_lower == w or text_lower.startswith(w + " ") or text_lower.endswith(" " + w)
            for w in ["hi", "hello", "hey", "namaste", "vanakkam", "halo", "help", "who are you", "what can you do", "morning", "good morning", "good evening", "how are you"]
        )

        # Priority 1: Check if coordinates or region were explicitly mentioned in text
        origin_coords = None
        for name, coords in GAZETTEER.items():
            if name in text_lower:
                origin_coords = coords
                break

        # Priority 2: Use existing state coordinates if user pinned map or asked follow-up
        if not origin_coords:
            origin_coords = state.get("target_coordinates") or state.get("origin_coordinates")

        # Priority 3: Default to active basin center
        if not origin_coords:
            origin_coords = BASIN_DEFAULT_COORDS.get(active_basin, [20.902, 70.368])

        # Check for explicit numeric coordinates in query (e.g. 20.65, 70.11)
        coord_match = re.search(r"(\d+\.\d+)\s*[Nn]?\s*,\s*(\d+\.\d+)\s*[Ee]?", user_query)
        if coord_match:
            target_coords = [float(coord_match.group(1)), float(coord_match.group(2))]
        else:
            target_coords = [round(origin_coords[0] - 0.22, 3), round(origin_coords[1] - 0.22, 3)]

        # Specific task routing
        tasks = []
        if any(w in text_lower for w in ["fish", "pfz", "tuna", "mackerel", "sardine", "catch", "chlorophyll", "species", "feeding", "where to fish"]):
            tasks.append("ocean_analytics")
        if any(w in text_lower for w in ["weather", "sea", "wave", "swh", "temp", "sst", "wind", "cyclone", "storm", "safe to venture"]):
            if "ocean_analytics" not in tasks:
                tasks.append("ocean_analytics")
        if any(w in text_lower for w in ["border", "imbl", "safe", "danger", "risk", "warning", "sri lanka", "pakistan", "mpa", "sanctuary", "restricted"]):
            tasks.append("risk_geofencing")
        if any(w in text_lower for w in ["route", "path", "fuel", "navigate", "distance", "heading", "optimal", "transit", "waypoint"]):
            tasks.append("navigation")
        if any(w in text_lower for w in ["ban", "rule", "law", "trawl", "monsoon", "policy", "permit", "license", "vhf", "1554", "fine", "penalty"]):
            tasks.append("policy_rag")

        # Conversational greeting without specific task
        if is_greeting and not tasks:
            plan = SubTaskPlan(
                intent_summary="Conversational greeting & capabilities inquiry",
                tasks_to_trigger=[],
                origin_coordinates=origin_coords,
                target_coordinates=target_coords,
                reasoning="Conversational interaction without domain calculation requirements."
            )
        elif not tasks:
            # If user asks for report, run full assessment
            if "report" in text_lower or format_mode == "report":
                tasks = ["ocean_analytics", "risk_geofencing", "navigation", "policy_rag"]
            else:
                # Default targeted ocean check
                tasks = ["ocean_analytics"]

            plan = SubTaskPlan(
                intent_summary=f"General maritime evaluation for {user_query[:60]}",
                tasks_to_trigger=tasks,
                origin_coordinates=origin_coords,
                target_coordinates=target_coords,
                reasoning="Contextual maritime evaluation."
            )
        else:
            plan = SubTaskPlan(
                intent_summary=f"Domain query for {user_query[:60]}",
                tasks_to_trigger=tasks,
                origin_coordinates=origin_coords,
                target_coordinates=target_coords,
                reasoning="Targeted domain routing."
            )

    return {
        "user_query": user_query,
        "user_role": user_role,
        "format_mode": format_mode,
        "active_basin": active_basin,
        "active_tasks": plan.tasks_to_trigger,
        "origin_coordinates": plan.origin_coordinates,
        "target_coordinates": plan.target_coordinates
    }
