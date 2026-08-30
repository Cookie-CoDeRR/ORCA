"""
Project ORCA (SIH26176) — Supervisor Agent Node
Uses ChatOllama (Qwen 2.5) with SubTaskPlan structured output to decompose queries
into spatial coordinates and selectively trigger worker nodes.
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

# Quick sovereign coastal lookup
GAZETTEER = {
    "veraval": [20.902, 70.368],
    "porbandar": [21.638, 69.595],
    "okha": [22.470, 69.075],
    "ratnagiri": [16.995, 73.275],
    "mumbai": [18.915, 72.825],
    "mangalore": [12.855, 74.832],
    "kochi": [9.942, 76.262],
    "cochin": [9.942, 76.262],
    "tuticorin": [8.800, 78.160],
    "rameswaram": [9.285, 79.315],
    "chennai": [13.128, 80.298],
    "visakhapatnam": [17.698, 83.298],
    "vizag": [17.698, 83.298],
    "paradip": [20.298, 86.685],
    "port blair": [11.672, 92.735]
}


async def supervisor_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Decomposes the incoming user query into sub-tasks and extracts spatial coordinates.
    """
    messages = state.get("messages", [])
    if messages:
        user_query = str(messages[-1].content).strip()
    else:
        user_query = state.get("user_query", "Can we fish near Veraval?")

    logger.info(f"🧭 [Supervisor Node] Evaluating query: '{user_query[:80]}...'")

    plan: SubTaskPlan | None = None

    # 1. Attempt LLM Structured Output with Qwen 2.5
    is_live = await check_ollama_health()
    if is_live:
        try:
            llm = get_chat_llm(model="qwen2.5:7b-instruct-q5_k_m", temperature=0.0)
            structured_llm = llm.with_structured_output(SubTaskPlan)
            res = await structured_llm.ainvoke([
                SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT),
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
            for w in ["hi", "hello", "hey", "namaste", "vanakkam", "halo", "help", "who are you", "what can you do", "morning", "good morning", "good evening"]
        )

        # Resolve coordinates from text
        origin_coords = [20.902, 70.368] # Default: Veraval
        for name, coords in GAZETTEER.items():
            if name in text_lower:
                origin_coords = coords
                break

        # Check for explicit numeric coordinates
        coord_match = re.search(r"(\d+\.\d+)\s*[Nn]?\s*,\s*(\d+\.\d+)\s*[Ee]?", user_query)
        if coord_match:
            target_coords = [float(coord_match.group(1)), float(coord_match.group(2))]
        else:
            target_coords = [round(origin_coords[0] - 0.25, 3), round(origin_coords[1] - 0.25, 3)]

        tasks = []
        if any(w in text_lower for w in ["fish", "pfz", "tuna", "mackerel", "catch", "chlorophyll", "species", "feeding"]):
            tasks.append("ocean_analytics")
        if any(w in text_lower for w in ["weather", "sea", "wave", "swh", "temp", "sst", "wind", "cyclone", "storm"]):
            if "ocean_analytics" not in tasks:
                tasks.append("ocean_analytics")
        if any(w in text_lower for w in ["border", "imbl", "safe", "danger", "risk", "warning", "sri lanka", "pakistan", "mpa", "sanctuary"]):
            tasks.append("risk_geofencing")
        if any(w in text_lower for w in ["route", "path", "fuel", "navigate", "distance", "heading", "optimal", "transit"]):
            tasks.append("navigation")
        if any(w in text_lower for w in ["ban", "rule", "law", "trawl", "monsoon", "policy", "permit", "license", "vhf", "1554"]):
            tasks.append("policy_rag")

        # If it's a greeting and no explicit maritime task was requested, don't trigger workers
        if is_greeting and not tasks:
            plan = SubTaskPlan(
                intent_summary="Conversational greeting & capabilities inquiry",
                tasks_to_trigger=[],
                origin_coordinates=origin_coords,
                target_coordinates=target_coords,
                reasoning="Conversational interaction without domain calculation requirements."
            )
        elif not tasks:
            # Fallback for general sector inquiries
            tasks = ["ocean_analytics", "risk_geofencing", "policy_rag"]
            plan = SubTaskPlan(
                intent_summary=f"General maritime sector evaluation for {user_query[:60]}",
                tasks_to_trigger=tasks,
                origin_coordinates=origin_coords,
                target_coordinates=target_coords,
                reasoning="Broad sector feasibility check."
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
        "active_tasks": plan.tasks_to_trigger,
        "origin_coordinates": plan.origin_coordinates,
        "target_coordinates": plan.target_coordinates
    }
