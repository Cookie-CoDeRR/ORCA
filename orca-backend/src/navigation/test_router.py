"""
Project ORCA (SIH26176) — Vector Router Unit Test Suite
Verifies dynamic A* path optimization from Mumbai Harbor (18.94, 72.86)
to an offshore fishing node (19.50, 71.20) over real ocean current vectors.
"""

import pytest
from src.navigation.router import compute_optimal_marine_route, MaritimePathOptimizer


def test_optimal_marine_routing_mumbai_to_fishing_node():
    """
    Tests vector-assisted navigation calculation between:
      - Origin: Mumbai Sassoon Dock / Harbor (18.94 N, 72.86 E)
      - Destination: Offshore PFZ Fishing Node (19.50 N, 71.20 E)
    """
    start_lat, start_lon = 18.94, 72.86
    end_lat, end_lon = 19.50, 71.20
    vessel_speed_knots = 10.0

    route = compute_optimal_marine_route(
        start_lat=start_lat,
        start_lon=start_lon,
        end_lat=end_lat,
        end_lon=end_lon,
        vessel_knots=vessel_speed_knots
    )

    # 1. GeoJSON Structure Validation
    assert "error" not in route, f"Router returned error: {route.get('error')}"
    assert route.get("type") == "Feature", "Expected GeoJSON Feature"
    assert route.get("geometry", {}).get("type") == "LineString", "Expected LineString geometry"

    coords = route["geometry"]["coordinates"]
    assert len(coords) >= 4, f"Expected at least 4 waypoints, got {len(coords)}"

    # 2. Origin & Destination Proximity Validation
    first_coord = coords[0]  # [lon, lat]
    last_coord = coords[-1]  # [lon, lat]
    assert abs(first_coord[0] - start_lon) < 0.1, "Origin longitude mismatch"
    assert abs(first_coord[1] - start_lat) < 0.1, "Origin latitude mismatch"
    assert abs(last_coord[0] - end_lon) < 0.1, "Destination longitude mismatch"
    assert abs(last_coord[1] - end_lat) < 0.1, "Destination latitude mismatch"

    # 3. Nautical Metrics & Fuel Savings
    props = route["properties"]
    assert props["distance_nautical_miles"] > 20.0, "Expected realistic nautical distance (> 20 NM)"
    assert props["total_time_hours"] > 0.0, "Expected positive transit duration"
    assert 5.0 <= props["estimated_fuel_savings_percent"] <= 30.0, (
        f"Fuel savings {props['estimated_fuel_savings_percent']}% outside expected 5-30% range"
    )

    # 4. Deck.gl Color Coding & Segment Verification
    segments = props.get("segments", [])
    assert len(segments) > 0, "Expected segment-level vector telemetry"
    for seg in segments:
        assert "color" in seg, "Segment missing deck.gl RGB color"
        assert len(seg["color"]) == 3, "Color must be 3-element RGB list"
        assert seg["color"] in [[34, 197, 94], [239, 68, 68]], "Color must be green (tail) or red (head)"

    print("\n✅ Navigation Routing Test Passed:")
    print(f"  - Distance: {props['distance_nautical_miles']} NM")
    print(f"  - Duration: {props['total_time_hours']} hours (Avg SOG: {props['average_sog_knots']} knots)")
    print(f"  - Estimated Fuel Savings: {props['estimated_fuel_savings_percent']}%")
    print(f"  - Waypoints Generated: {len(coords)}")
