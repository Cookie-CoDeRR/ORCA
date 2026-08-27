"""
Project ORCA — Navigation Agent Tools
Integrates dynamic A* path routing over ocean currents and wind rasters.
"""

import logging
from typing import Any
from ...navigation.router import compute_optimal_marine_route

logger = logging.getLogger("ORCA.NavigationTools")


def calculate_vector_optimized_route(
    start_coords: list[float],
    end_coords: list[float],
    vessel_knots: float = 10.0
) -> dict[str, Any]:
    """
    Computes fuel-optimal marine route taking surface currents (uo, vo) and wind (u10, v10) into account.
    Returns GeoJSON Feature LineString with fuel savings percentage and colored segments.
    """
    return compute_optimal_marine_route(
        start_lat=start_coords[0],
        start_lon=start_coords[1],
        end_lat=end_coords[0],
        end_lon=end_coords[1],
        vessel_knots=vessel_knots
    )
