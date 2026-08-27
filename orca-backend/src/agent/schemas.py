"""
Project ORCA (SIH26176) — Structured Output Schemas & Tool Calling Models
Defines Pydantic models that force local Qwen2.5 LLM to output strict JSON variables
for deterministic spatial routing, PostGIS validation, and multi-agent dispatching.
"""

from typing import Any, Literal
from pydantic import BaseModel, Field


# ==============================================================================
# 1. SUPERVISOR ROUTING SCHEMAS
# ==============================================================================

class RouteDecision(BaseModel):
    """
    Structured output schema for Qwen2.5 Supervisor LLM routing.
    Enforces deterministic extraction of intent, coordinates, next agent, and reasoning.
    """
    intent: str = Field(
        ...,
        description="Categorization of user request: e.g. 'FIND_FISHING_ZONE', 'CHECK_SAFETY', 'POLICY_QUERY', or 'GENERAL_ADVISORY'."
    )
    target_coordinates: list[float] = Field(
        default_factory=list,
        description="Target geographic coordinates extracted from query formatted as [latitude, longitude] (e.g. [20.90, 70.36])."
    )
    next_agent: Literal[
        "ocean_analytics",
        "risk_geofencing",
        "policy_rag",
        "synthesizer"
    ] = Field(
        ...,
        description="Restricted routing destination: 'ocean_analytics' for PFZ/rasters, 'risk_geofencing' for IMBL/MPA borders, 'policy_rag' for fishing ban rules, or 'synthesizer' for direct response."
    )
    reasoning: str = Field(
        ...,
        description="Short factual justification explaining why this agent route and coordinates were selected."
    )


class SupervisorRoutingDecision(BaseModel):
    """
    Extended multi-parameter routing schema with gazetteer & vessel parameterization.
    """
    origin_harbor: str = Field(
        default="Veraval",
        description="Indian coastal fishing harbor or landing center identified in the query (e.g. Veraval, Kochi, Ratnagiri, Rameswaram, Visakhapatnam, Paradip)."
    )
    state_or_union_territory: str = Field(
        default="Gujarat",
        description="The maritime State or Union Territory corresponding to the origin harbor (e.g. Gujarat, Kerala, Maharashtra, Tamil Nadu)."
    )
    coordinates: list[float] = Field(
        default=[20.90, 70.36],
        description="Resolved [latitude, longitude] coordinates of the origin landing center."
    )
    target_bbox: list[float] = Field(
        default=[69.80, 20.40, 70.60, 21.10],
        description="Spatial bounding box [min_lon, min_lat, max_lon, max_lat] covering the fishing grounds."
    )
    target_species: str | None = Field(
        default="Yellowfin Tuna",
        description="Commercial marine species targeted in the query (e.g. Yellowfin Tuna, Indian Mackerel, Sardine, Pomfret, Shrimp)."
    )
    vessel_count: int = Field(
        default=1,
        description="Number of fishing vessels involved."
    )
    vessel_type: Literal[
        "mechanized_trawler",
        "motorized_boat",
        "traditional_artisanal",
        "deep_sea_vessel"
    ] = Field(
        default="mechanized_trawler",
        description="Classification of the fishing craft."
    )
    route_decision: RouteDecision | None = Field(
        default=None,
        description="The primary RouteDecision emitted by the supervisor."
    )
    detected_language: str = Field(
        default="en",
        description="ISO 639-1 language code detected from prompt (en, gu, ta, hi, te, ml, mr)."
    )


# ==============================================================================
# 2. SUB-AGENT DETERMINISTIC OUTPUT SCHEMAS
# ==============================================================================

class OceanAnalyticsResult(BaseModel):
    """Structured telemetry output from the Ocean Analytics Engine."""
    pfz_detected: bool = Field(..., description="Whether a Potential Fishing Zone thermal/color front was detected.")
    pfz_target_coordinates: list[list[float]] = Field(default_factory=list, description="Recommended fishing coordinates [[lat, lon]].")
    sst_celsius: float = Field(..., description="Sea Surface Temperature in Celsius.")
    chlorophyll_mg_m3: float = Field(..., description="Chlorophyll-a concentration in mg/m³.")
    significant_wave_height_m: float = Field(..., description="Significant Wave Height in meters.")
    wind_speed_knots: float = Field(..., description="Wind speed at 10m in knots.")
    sea_state: str = Field(..., description="Sea state classification (Calm, Moderate, Rough).")
    computation_engine: str = Field(default="NetCDF4 / xarray CF-1.7 Parser")


class SpatialRiskResult(BaseModel):
    """Structured risk output from the PostGIS Geospatial Risk Engine."""
    is_safe: bool = Field(..., description="Whether operation is safe from international boundary or MPA violations.")
    nearest_imbl_distance_km: float = Field(..., description="Distance in km to the nearest International Maritime Boundary Line.")
    in_marine_protected_area: bool = Field(..., description="Whether coordinates intersect a Marine Protected Area.")
    active_hazard_warnings: list[str] = Field(default_factory=list, description="Specific safety or border warnings.")
    spatial_sql_executed: str = Field(..., description="Exact PostGIS ST_Distance / ST_DWithin query executed.")


class PolicyRAGResult(BaseModel):
    """Structured regulatory output from the pgvector Policy RAG Engine."""
    retrieved_clauses: list[dict[str, Any]] = Field(default_factory=list, description="List of matching regulatory chunks.")
    applicable_ban_active: bool = Field(default=False, description="Whether an active monsoon or seasonal ban is in effect.")
    monsoon_ban_summary: str | None = Field(default=None, description="Summary of seasonal fishing ban timeline.")


class SynthesizedAdvisory(BaseModel):
    """Final unified response returned by Project ORCA."""
    thread_id: str
    advisory_text: str
    language_code: str
    telemetry: OceanAnalyticsResult | None = None
    spatial_risk: SpatialRiskResult | None = None
    policy_advisories: list[dict[str, Any]] | None = None
    geojson_payload: dict[str, Any] | None = None
    audit_trace: dict[str, Any] | None = None
    execution_time_ms: int
