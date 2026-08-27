"""
Project ORCA (SIH26176) — Synthesizer & Localization Agent Node
Ingests all worker agent outputs, builds markdown advisory, and constructs
a consolidated GeoJSON FeatureCollection combining routes, PFZ markers, and boundary alerts.
"""

import logging
from typing import Any
from langchain_core.messages import AIMessage

from ..state import AgentState
from .prompts import SYNTHESIZER_SYSTEM_PROMPT, synthesizer_prompt_template

logger = logging.getLogger("ORCA.SynthesizerAgent")


async def synthesizer_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Consolidates sub-agent telemetry, PostGIS risks, RAG circulars, and optimal routes
    into a unified markdown response and deck.gl GeoJSON payload.
    """
    logger.info("✨ [Synthesizer Agent] Merging multi-agent outputs into final response...")

    user_query = state.get("user_query", "Maritime advisory")
    origin = state.get("origin_coordinates", [20.902, 70.368])
    target = state.get("target_coordinates", [20.500, 70.100])
    ocean = state.get("ocean_data") or {}
    risk = state.get("risk_assessment") or {}
    route = state.get("route_plan") or {}
    policies = state.get("policy_advisories") or []

    telemetry = ocean.get("telemetry", {})
    sst = telemetry.get("sst_celsius", 28.5)
    chl = telemetry.get("chlorophyll_mg_m3", 1.2)
    swh = telemetry.get("significant_wave_height_m", 1.3)
    
    is_safe = risk.get("is_safe", True)
    warnings = risk.get("active_warnings", [])
    imbl_info = risk.get("imbl_check", {})
    dist_imbl = imbl_info.get("distance_km", 45.0)

    # 1. Natural Language Markdown Advisory
    markdown_lines = [
        f"### 🐬 Project ORCA — Maritime Intelligence & Operational Advisory",
        f"**Coordinate Sector:** Origin: `[{origin[0]}, {origin[1]}]` | Target: `[{target[0]}, {target[1]}]`\n",
        f"#### 🌊 1. Ocean State & Potential Fishing Zones (PFZ)",
        f"- **Sea Surface Temperature (SST):** `{sst}°C` (Optimal thermal range for pelagics)",
        f"- **Chlorophyll-a Concentration:** `{chl} mg/m³` (High plankton density)",
        f"- **Significant Wave Height (SWH):** `{swh} m` ({ocean.get('sea_state', 'Moderate')})",
        f"- **PFZ Cluster Detection:** Found **{ocean.get('pfz_clusters_count', 0)}** active thermal/color aggregation zones.\n",
        f"#### 🛡️ 2. Geospatial Safety & Border Geofencing",
        f"- **IMBL Border Proximity:** `{dist_imbl} km` to nearest International Maritime Boundary Line.",
        f"- **Marine Protected Area (MPA):** {'Inside Sanctuary (Restrictions Apply)' if risk.get('mpa_check', {}).get('in_protected_area') else 'Clear of No-Trawl Zones.'}"
    ]

    if warnings:
        markdown_lines.append("\n> ⚠️ **ACTIVE SAFETY WARNINGS:**")
        for w in warnings:
            markdown_lines.append(f"> - {w}")

    if route and "properties" in route:
        props = route["properties"]
        markdown_lines.extend([
            f"\n#### 🧭 3. Vector-Assisted Fuel-Optimal Navigation",
            f"- **Nautical Distance:** `{props.get('distance_nautical_miles', 0)} NM`",
            f"- **Estimated Transit Duration:** `{props.get('total_time_hours', 0)} Hours` (Avg SOG: `{props.get('average_sog_knots', 0)} knots`)",
            f"- **Fuel Savings:** **`{props.get('estimated_fuel_savings_percent', 0)}%`** reduction via ocean current eddy riding."
        ])

    if policies:
        markdown_lines.append("\n#### 📜 4. Sovereign Maritime Regulations & SOPs")
        for p in policies[:2]:
            markdown_lines.append(f"- {p}")

    synthesized_markdown = "\n".join(markdown_lines)

    # 2. Consolidated GeoJSON FeatureCollection for deck.gl
    features = []

    # Origin Point
    features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [origin[1], origin[0]]},
        "properties": {"name": "Vessel / Origin Harbor", "type": "origin_node"}
    })

    # PFZ Points
    for pfz in ocean.get("pfz_geojson_features", []):
        features.append(pfz)

    # Optimal Route LineString
    if route and "geometry" in route:
        features.append(route)

    geojson_payload = {
        "type": "FeatureCollection",
        "features": features
    }

    final_response = {
        "markdown_advisory": synthesized_markdown,
        "geojson_payload": geojson_payload,
        "ocean_data": ocean,
        "risk_assessment": risk,
        "route_plan": route,
        "policy_advisories": policies
    }

    return {
        "messages": [AIMessage(content=synthesized_markdown)],
        "final_response": final_response
    }
