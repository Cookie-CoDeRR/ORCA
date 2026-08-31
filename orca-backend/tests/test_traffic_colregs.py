"""
Project ORCA (SIH26176) — Comprehensive Test Suite for AIS Traffic & COLREGs Collision Avoidance
"""

import pytest
from src.traffic.traffic_cache import TrafficCache, VesselState, decode_ship_type, haversine_nm
from src.traffic.mock_replay import MockAisReplayer
from src.navigation.colregs import (
    compute_relative_kinematics,
    calculate_collision_risk_index,
    classify_colregs_encounter,
    evaluate_colregs_for_traffic,
    ColregsEncounterType,
    RiskLevel
)
from src.navigation.dynamic_router import DynamicColregsRouter


def test_decode_ship_type():
    assert decode_ship_type(70) == "cargo"
    assert decode_ship_type(85) == "tanker"
    assert decode_ship_type(30) == "fishing"
    assert decode_ship_type(55) == "defense"
    assert decode_ship_type(60) == "passenger"
    assert decode_ship_type(52) == "defense"


def test_haversine_distance():
    # Mumbai to Goa ~ 220 NM
    dist = haversine_nm(18.92, 72.83, 15.40, 73.80)
    assert 210.0 < dist < 240.0


def test_traffic_cache_upsert_and_prune():
    cache = TrafficCache(max_stale_seconds=1.0)
    vessel = VesselState(
        mmsi=419001234,
        name="MV TEST SHIP",
        ship_type=70,
        ship_category="cargo",
        lat=18.90,
        lon=72.80,
        sog_knots=12.0,
        cog_deg=180.0,
        heading=180.0,
        timestamp="2026-08-31T12:00:00Z"
    )
    cache.upsert_vessel(vessel)
    assert cache.get_vessel(419001234) is not None
    assert len(cache.get_all_vessels()) == 1

    # Radial search
    in_range = cache.get_active_vessels_in_radius(18.91, 72.81, radius_nm=10.0)
    assert len(in_range) == 1

    out_of_range = cache.get_active_vessels_in_radius(10.0, 80.0, radius_nm=10.0)
    assert len(out_of_range) == 0

    # GeoJSON export
    geojson = cache.to_geojson()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 1
    assert geojson["features"][0]["properties"]["mmsi"] == 419001234


def test_colregs_rule_14_head_on():
    """
    Own ship heading 000° (North) at 12 knots.
    Target ship heading 180° (South) at 12 knots, bearing 000° (directly ahead), distance 4 NM.
    Expected: Head-On encounter, Rule 14, Mandatory Starboard Alteration.
    """
    dist, rel_bearing, aspect, cpa, tcpa, v_rel, converging = compute_relative_kinematics(
        own_lat=18.80, own_lon=72.80, own_sog=12.0, own_cog=0.0,
        tgt_lat=18.866, tgt_lon=72.80, tgt_sog=12.0, tgt_cog=180.0
    )

    assert converging is True
    assert cpa < 0.2  # Near zero CPA
    assert 0 < tcpa < 15.0

    cri = calculate_collision_risk_index(dist, cpa, tcpa, rel_bearing, converging)
    assert cri > 0.65

    eval_result = classify_colregs_encounter(
        dist, rel_bearing, aspect,
        own_cog=0.0, tgt_cog=180.0,
        own_sog=12.0, tgt_sog=12.0,
        cpa_nm=cpa, tcpa_min=tcpa, cri=cri,
        target_mmsi=419001111, target_name="TARGET HEAD-ON"
    )

    assert eval_result.encounter_type == ColregsEncounterType.HEAD_ON
    assert "Rule 14" in eval_result.rule_applied
    assert eval_result.obligation == "GIVE_WAY"
    assert "Starboard" in eval_result.recommended_action
    assert eval_result.recommended_heading_delta_deg == +30.0


def test_colregs_rule_15_crossing_give_way():
    """
    Own ship heading 000° (North) at 10 knots.
    Target ship approaching from Starboard (bearing 045°) heading 270° (West) at 10 knots.
    Expected: Crossing Give-Way, Rule 15, Alter course to Starboard to pass astern.
    """
    evals = evaluate_colregs_for_traffic(
        own_lat=18.80, own_lon=72.80, own_sog=10.0, own_cog=0.0,
        traffic_vessels=[
            {
                "mmsi": 419002222,
                "name": "STARBOARD CROSSER",
                "lat": 18.83,
                "lon": 72.84,
                "sog_knots": 10.0,
                "cog_deg": 270.0
            }
        ]
    )

    assert len(evals) == 1
    e = evals[0]
    assert e.encounter_type == ColregsEncounterType.CROSSING_GIVE_WAY
    assert "Rule 15" in e.rule_applied
    assert e.obligation == "GIVE_WAY"
    assert "Starboard" in e.recommended_action


def test_mock_replayer_step():
    cache = TrafficCache()
    replayer = MockAisReplayer(cache=cache)
    updated = replayer.step(delta_seconds=2.0)
    assert len(updated) > 0
    assert len(cache.get_all_vessels()) == len(updated)


def test_dynamic_router_avoidance():
    router = DynamicColregsRouter()
    # Route around Mumbai High
    res = router.calculate_dynamic_route(
        start_lat=18.80, start_lon=72.75,
        end_lat=19.05, end_lon=72.75,
        vessel_speed_knots=10.0
    )
    assert "type" in res
    assert res["type"] == "Feature"
    assert "properties" in res
    assert res["properties"]["distance_nautical_miles"] > 0
