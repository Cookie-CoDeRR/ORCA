"""
Project ORCA (SIH26176) — Supervisor Agent Schemas
Defines structured decomposition plans and routing schemas for dispatching sub-agents.
"""

from typing import Literal
from pydantic import BaseModel, Field


class RouteDecision(BaseModel):
    """
    Structured output schema for atomic Qwen2.5 supervisor intent routing.
    """
    intent: str = Field(
        ...,
        description="Categorization of user request: 'FIND_FISHING_ZONE', 'CHECK_SAFETY', or 'POLICY_QUERY'."
    )
    target_coordinates: list[float] = Field(
        default_factory=list,
        description="A list of exactly two floats: [latitude, longitude]."
    )
    next_agent: Literal["ocean_analytics", "risk_geofencing", "policy_rag", "synthesizer"] = Field(
        ...,
        description="Target worker agent to invoke next."
    )
    reasoning: str = Field(
        ...,
        description="Brief explanation of the routing choice."
    )


class SubTaskPlan(BaseModel):
    """
    Deconstructed multi-task execution plan emitted by the Supervisor LLM.
    """
    intent_summary: str = Field(
        ...,
        description="Brief summary of what the user is asking."
    )
    tasks_to_trigger: list[
        Literal["ocean_analytics", "risk_geofencing", "navigation", "policy_rag"]
    ] = Field(
        default_factory=lambda: ["ocean_analytics", "risk_geofencing", "policy_rag"],
        description="List of worker agents required to fulfill this maritime query."
    )
    origin_coordinates: list[float] = Field(
        default=[20.902, 70.368],
        description="Resolved starting point [latitude, longitude] (default: Veraval Harbor [20.902, 70.368])."
    )
    target_coordinates: list[float] = Field(
        default=[20.500, 70.100],
        description="Resolved target coordinates [latitude, longitude] in the ocean."
    )
    reasoning: str = Field(
        ...,
        description="Justification for the chosen tasks and spatial parameters."
    )
