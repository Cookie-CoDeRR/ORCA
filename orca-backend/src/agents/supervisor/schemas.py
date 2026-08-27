"""
Project ORCA — Supervisor Agent Schemas
Defines structured decomposition plans for dispatching sub-agents in parallel or sequence.
"""

from typing import Literal
from pydantic import BaseModel, Field


class SubTaskPlan(BaseModel):
    """
    Deconstructed execution plan emitted by the Supervisor LLM.
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
