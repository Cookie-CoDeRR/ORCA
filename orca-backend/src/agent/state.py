"""
Project ORCA (SIH26176) — LangGraph State Schema
Defines the ChatState TypedDict with `add_messages` annotation for persistent,
accumulative conversational memory across multi-agent turns.
"""

from typing import TypedDict, Annotated, Any, Sequence
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class ChatState(TypedDict, total=False):
    """
    Unified LangGraph State Schema for Project ORCA.
    
    Persistent Fields:
      - messages: Accumulated conversation history (User query, AI responses, Tool outputs).
      - thread_id: Unique session identifier for human-in-the-loop and multi-user isolation.
      - origin: Coastal landing center or vessel starting coordinates.
      - target_bbox: Bounding box [min_lon, min_lat, max_lon, max_lat] for spatial queries.
      - species: Target commercial fish or species in query (e.g. Tuna, Mackerel).
      - ocean_telemetry: Deterministic NetCDF data (SST, Chlorophyll-a, current vectors, SWH).
      - spatial_risk: Deterministic PostGIS boundary checks (IMBL distance, MPA alerts).
      - policy_advisories: Retrieved regulatory clauses from pgvector RAG.
      - synthesized_advisory: Final localized natural language advisory.
      - geojson_payload: FeatureCollection for direct rendering in MapLibre / deck.gl.
      - language_code: Target Indic language for translation (en, gu, ta, hi, te, ml, mr).
      - audit_trace: Verifiable execution trace (exact SQL, raster paths, RAG citations) for XAI.
    """
    
    # Accumulative message sequence (new messages appended, not overwritten)
    messages: Annotated[list[BaseMessage], add_messages]
    
    # Session & Spatial Context
    thread_id: str
    origin: dict[str, Any] | None
    target_bbox: list[float] | None
    species: str | None
    language_code: str
    
    # Sub-Agent Outputs
    ocean_telemetry: dict[str, Any] | None
    spatial_risk: dict[str, Any] | None
    policy_advisories: list[dict[str, Any]] | None
    
    # Final Synthesis & UI Output
    synthesized_advisory: str | None
    geojson_payload: dict[str, Any] | None
    audit_trace: dict[str, Any] | None
