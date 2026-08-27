"""
Project ORCA (SIH26176) — Structured Output Schemas & Tool Calling Models
Defines Pydantic models for structured LLM routing, deterministic telemetry outputs,
spatial risk validation, and final conversational advisory synthesis.
"""

from typing import Any, Literal
from pydantic import BaseModel, Field


class SupervisorRoutingDecision(BaseModel):
    """
    Structured output schema for the Supervisor Routing Agent.
    Deconstructs user queries into actionable spatial coordinates,
    vessel parameters, species intent, and sub-agent dispatch flags.
    """
    origin_harbor: str = Field(
        default="Veraval",
        description="The primary Indian coastal fishing harbor, landing center, or port identified in the user query (e.g. Veraval, Kochi, Ratnagiri, Rameswaram, Visakhapatnam, Paradip)."
    )
    state_or_union_territory: str = Field(
        default="Gujarat",
        description="The maritime State or Union Territory corresponding to the origin harbor (e.g. Gujarat, Kerala, Maharashtra, Tamil Nadu, Andhra Pradesh, Odisha, Karnataka)."
    )
    coordinates: list[float] = Field(
        default=[70.36, 20.90],
        description="Resolved longitude and latitude coordinates [lon, lat] of the origin landing center."
    )
    target_bbox: list[float] = Field(
        default=[69.80, 20.40, 70.60, 21.10],
        description="Spatial bounding box [min_lon, min_lat, max_lon, max_lat] covering the planned fishing grounds."
    )
    target_species: str | None = Field(
        default="Yellowfin Tuna",
        description="Commercial marine species targeted in the query (e.g. Yellowfin Tuna, Indian Mackerel, Sardine, Kingfish, Shrimp, Pomfret, Hilsa)."
    )
    vessel_count: int = Field(
        default=1,
        description="Number of fishing vessels or boats venturing out."
    )
    vessel_type: Literal[
        "mechanized_trawler",
        "motorized_boat",
        "traditional_artisanal",
        "deep_sea_vessel"
    ] = Field(
        default="mechanized_trawler",
        description="Classification of the fishing vessel."
    )
    distance_offshore_km: float = Field(
        default=30.0,
        description="Estimated distance offshore requested in kilometers (derived from query or default 30 km)."
    )
    time_horizon_hours: int = Field(
        default=24,
        description="Forecast time window in hours (e.g. 24, 48, 72)."
    )
    dispatch_ocean_analytics: bool = Field(
        default=True,
        description="Whether to query oceanographic rasters (SST, Chlorophyll, currents, wave height, PFZ)."
    )
    dispatch_spatial_risk: bool = Field(
        default=True,
        description="Whether to execute PostGIS boundary checks (IMBL lines, Marine Protected Areas)."
    )
    dispatch_policy_rag: bool = Field(
        default=True,
        description="Whether to query pgvector for state fishing regulations and seasonal monsoon bans."
    )
    detected_language: str = Field(
        default="en",
        description="ISO 639-1 language code detected from the prompt (en, gu, ta, hi, te, ml, mr)."
    )
    intent_summary: str = Field(
        default="Marine fishing trip advisory and safety risk assessment.",
        description="Concise 1-sentence summary of the user's maritime intent."
    )


class OceanAnalyticsResult(BaseModel):
    """Structured telemetry output from the Ocean Analytics Engine."""
    pfz_detected: bool = Field(..., description="Whether a Potential Fishing Zone thermal/color front was detected.")
    pfz_target_coordinates: list[list[float]] = Field(default_factory=list, description="Recommended fishing coordinates [[lon, lat]].")
    sst_celsius: float = Field(..., description="Sea Surface Temperature in Celsius.")
    chlorophyll_mg_m3: float = Field(..., description="Chlorophyll-a concentration in mg/m³.")
    significant_wave_height_m: float = Field(..., description="Significant Wave Height in meters.")
    wind_speed_knots: float = Field(..., description="Wind speed at 10m in knots.")
    sea_state: str = Field(..., description="Sea state condition classification (e.g. Calm, Moderate, Rough).")
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
