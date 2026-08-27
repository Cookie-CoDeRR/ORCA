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
from ...agent.llm_config import get_chat_llm, check_ollama_health

logger = logging.getLogger("ORCA.SupervisorAgent")

SUPERVISOR_ROLE_PROMPT = """
You are the Chief Maritime Supervisor Agent for Project ORCA (SIH26176).
Your role is to decompose the user's maritime, fishing, or navigation request into specific sub-tasks.

You must output a structured SubTaskPlan indicating:
1. `intent_summary`: Short summary of user inquiry.
2. `tasks_to_trigger`: Select one or more of ['ocean_analytics', 'risk_geofencing', 'navigation', 'policy_rag'].
3. `origin_coordinates`: [latitude, longitude] of starting harbor.
4. `target_coordinates`: [latitude, longitude] of destination or fishing zone.
5. `reasoning`: Technical justification for the plan.
"""

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
                SystemMessage(content=SUPERVISOR_ROLE_PROMPT),
                HumanMessage(content=user_query)
            ])
            if isinstance(res, SubTaskPlan):
                plan = res
                logger.info(f"✅ [Supervisor Node] Structured plan generated: {plan.tasks_to_trigger}")
        except Exception as e:
            logger.warning(f"Ollama plan generation fallback: {e}")

    # 2. Deterministic Fallback if LLM daemon is offline
    if plan is None:
        text_lower = user_query.lower()
        
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
        if any(w in text_lower for w in ["fish", "pfz", "tuna", "mackerel", "catch", "ocean", "sea", "temp", "chlorophyll"]):
            tasks.append("ocean_analytics")
        if any(w in text_lower for w in ["border", "imbl", "safe", "danger", "risk", "warning", "sri lanka", "pakistan"]):
            tasks.append("risk_geofencing")
        if any(w in text_lower for w in ["route", "path", "fuel", "navigate", "distance", "heading", "optimal"]):
            tasks.append("navigation")
        if any(w in text_lower for w in ["ban", "rule", "law", "trawl", "monsoon", "policy", "permit", "license"]):
            tasks.append("policy_rag")

        if not tasks:
            tasks = ["ocean_analytics", "risk_geofencing", "policy_rag"]

        plan = SubTaskPlan(
            intent_summary=f"Maritime query for {user_query[:60]}",
            tasks_to_trigger=tasks,
            origin_coordinates=origin_coords,
            target_coordinates=target_coords,
            reasoning="Deterministic gazetteer & keyword routing."
        )

    return {
        "user_query": user_query,
        "active_tasks": plan.tasks_to_trigger,
        "origin_coordinates": plan.origin_coordinates,
        "target_coordinates": plan.target_coordinates
    }
