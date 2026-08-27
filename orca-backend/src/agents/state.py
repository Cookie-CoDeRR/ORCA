"""
Project ORCA (SIH26176) — Global Multi-Agent State Definition
Defines the central AgentState TypedDict with accumulative messaging, spatial coordinates,
task plan decomposition, and structured outputs across specialized worker nodes.
"""

from typing import TypedDict, Annotated, Sequence, Optional, Any
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict, total=False):
    """
    Unified LangGraph state schema shared across all 6 specialized worker agents.
    
    Fields:
      - messages: Accumulated conversational turns (Human, AI, System, Tool).
      - user_query: Original verbatim user request string.
      - target_coordinates: Resolved destination or search coordinate [latitude, longitude].
      - origin_coordinates: Resolved starting harbor/vessel coordinate [latitude, longitude].
      - active_tasks: Sub-tasks to execute (e.g. ['ocean_analytics', 'risk_geofencing', 'navigation', 'policy_rag']).
      - ocean_data: Sea surface temperature, chlorophyll-a, wave heights, and PFZ coordinates.
      - risk_assessment: PostGIS boundary distance to IMBL, MPA intersections, and cyclone alerts.
      - route_plan: A* vector-optimized GeoJSON LineString, nautical miles, and fuel savings.
      - policy_advisories: Retrieved maritime policy circulars, monsoon fishing ban rules, and SOPs.
      - final_response: Consolidated natural language markdown advice + deck.gl GeoJSON payload.
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    user_query: str
    target_coordinates: Optional[list[float]]
    origin_coordinates: Optional[list[float]]
    active_tasks: list[str]
    ocean_data: Optional[dict[str, Any]]
    risk_assessment: Optional[dict[str, Any]]
    route_plan: Optional[dict[str, Any]]
    policy_advisories: Optional[list[str]]
    final_response: Optional[dict[str, Any]]
