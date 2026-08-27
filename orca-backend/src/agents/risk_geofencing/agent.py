"""
Project ORCA — Risk & Geofencing Agent Node
Runs PostGIS boundary queries for IMBL lines, MPAs, and cyclone warnings,
and updates state["risk_assessment"].
"""

import logging
from typing import Any
from ..state import AgentState
from .tools import check_imbl_proximity, check_protected_area_intersection, check_active_cyclone_warnings

logger = logging.getLogger("ORCA.RiskGeofencingAgent")


async def risk_geofencing_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Executes boundary risk, IMBL geofencing, and cyclone safety checks.
    """
    coords = state.get("target_coordinates") or state.get("origin_coordinates") or [20.902, 70.368]
    lat, lon = coords[0], coords[1]

    logger.info(f"🛡️ [Risk & Geofencing Agent] Validating spatial boundaries for [{lat}, {lon}]...")

    imbl_info = await check_imbl_proximity(lat, lon, threshold_km=10.0)
    mpa_info = await check_protected_area_intersection(lat, lon)
    cyclone_info = check_active_cyclone_warnings(lat, lon)

    is_overall_safe = not imbl_info["is_near_border"] and not mpa_info["in_protected_area"] and cyclone_info["safe_to_navigate"]

    warnings = []
    if imbl_info["is_near_border"]:
        warnings.append(f"CRITICAL: Within {imbl_info['distance_km']} km of {imbl_info['nearest_boundary']}.")
    if mpa_info["in_protected_area"]:
        warnings.append(f"RESTRICTION: Inside protected sanctuary '{mpa_info['sanctuary_name']}'. Trawling prohibited.")
    if cyclone_info["active_cyclone_alert"]:
        warnings.append(f"WEATHER ALERT: {cyclone_info['warning_signal']} hoisted.")

    risk_assessment = {
        "is_safe": is_overall_safe,
        "imbl_check": imbl_info,
        "mpa_check": mpa_info,
        "cyclone_check": cyclone_info,
        "active_warnings": warnings
    }

    return {"risk_assessment": risk_assessment}
