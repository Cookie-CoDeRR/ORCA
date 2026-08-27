"""
Project ORCA — Navigation Agent Node
Calculates optimal waypoint routes and fuel savings, and updates state["route_plan"].
"""

import logging
from typing import Any
from ..state import AgentState
from .tools import calculate_vector_optimized_route

logger = logging.getLogger("ORCA.NavigationAgent")


async def navigation_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Executes vector-assisted dynamic routing from origin to target coordinates.
    """
    origin = state.get("origin_coordinates") or [20.902, 70.368]
    target = state.get("target_coordinates") or [round(origin[0] - 0.35, 3), round(origin[1] - 0.35, 3)]

    logger.info(f"🧭 [Navigation Agent] Computing optimal vector route: {origin} -> {target}...")

    route_plan = calculate_vector_optimized_route(
        start_coords=origin,
        end_coords=target,
        vessel_knots=10.0
    )

    return {"route_plan": route_plan}
