"""
Project ORCA — Ocean Analytics Agent Node
Ingests spatial coordinates from state, runs raster slicing and PFZ cluster detection,
and updates state["ocean_data"].
"""

import logging
from typing import Any
from ..state import AgentState
from .tools import get_sst_and_chlorophyll, find_nearby_pfz_clusters

logger = logging.getLogger("ORCA.OceanAnalyticsAgent")


async def ocean_analytics_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Executes ocean analytics and PFZ cluster identification.
    """
    coords = state.get("target_coordinates") or state.get("origin_coordinates") or [20.902, 70.368]
    lat, lon = coords[0], coords[1]

    logger.info(f"🌊 [Ocean Analytics Agent] Slicing ocean rasters for [{lat}, {lon}]...")

    telemetry = get_sst_and_chlorophyll(lat, lon)
    pfz_clusters = find_nearby_pfz_clusters(lat, lon, radius_km=50.0)

    ocean_data = {
        "coordinates": [lat, lon],
        "telemetry": telemetry,
        "pfz_clusters_count": len(pfz_clusters),
        "pfz_geojson_features": pfz_clusters,
        "sea_state": "Moderate & Operable" if telemetry["significant_wave_height_m"] < 2.5 else "Rough Sea Advisory"
    }

    return {"ocean_data": ocean_data}
