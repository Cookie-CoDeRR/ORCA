"""
Project ORCA (SIH26176) — Maritime Collision Risk & COLREGs Engine
Implements real-time Closest Point of Approach (CPA), Time to CPA (TCPA),
Dynamic Navigation Ship Domain (DNSD), and IMO Convention on the International Regulations
for Preventing Collisions at Sea, 1972 (COLREGs Rules 13, 14, 15, 17).
"""

import math
from typing import Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum


class ColregsEncounterType(str, Enum):
    HEAD_ON = "HEAD_ON"                    # Rule 14: Both vessels must alter course to starboard
    CROSSING_GIVE_WAY = "CROSSING_GIVE_WAY"  # Rule 15: Target is on starboard side; own-ship must give way
    CROSSING_STAND_ON = "CROSSING_STAND_ON"  # Rule 17: Target is on port side; own-ship stands on
    OVERTAKING_GIVE_WAY = "OVERTAKING_GIVE_WAY"  # Rule 13: Own-ship is overtaking; must keep clear
    BEING_OVERTAKEN = "BEING_OVERTAKEN"      # Rule 13: Target is overtaking own-ship
    SAFE_SEPARATION = "SAFE_SEPARATION"      # No risk of collision


class RiskLevel(str, Enum):
    SAFE = "SAFE"
    CAUTION = "CAUTION"
    CRITICAL_RISK = "CRITICAL_RISK"


@dataclass
class ColregsEvaluation:
    target_mmsi: int
    target_name: str
    distance_nm: float
    relative_bearing_deg: float
    cpa_nm: float
    tcpa_minutes: float
    is_converging: bool
    risk_level: RiskLevel
    collision_risk_index: float  # 0.0 to 1.0
    encounter_type: ColregsEncounterType
    rule_applied: str
    obligation: str  # "GIVE_WAY", "STAND_ON", "NONE"
    recommended_action: str
    recommended_heading_delta_deg: float  # Suggested course adjustment (positive = starboard)
    hazard_zone: Optional[dict[str, Any]] = None  # Velocity obstacle / domain geometry

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_angle(angle_deg: float) -> float:
    """Normalizes an angle to [0.0, 360.0)."""
    return angle_deg % 360.0


def angle_diff(a: float, b: float) -> float:
    """Computes the shortest angular difference between two headings in [-180, 180]."""
    diff = (a - b + 180.0) % 360.0 - 180.0
    return diff


def compute_relative_kinematics(
    own_lat: float,
    own_lon: float,
    own_sog: float,
    own_cog: float,
    tgt_lat: float,
    tgt_lon: float,
    tgt_sog: float,
    tgt_cog: float
) -> tuple[float, float, float, float, float, float, bool]:
    """
    Computes distance, relative bearing, relative velocity, DCPA, and TCPA.
    Returns:
        (distance_nm, rel_bearing_deg, aspect_angle_deg, cpa_nm, tcpa_min, v_rel_knots, is_converging)
    """
    # 1. Geographic displacement in Nautical Miles (East-North frame)
    mean_lat_rad = math.radians((own_lat + tgt_lat) / 2.0)
    dx_nm = (tgt_lon - own_lon) * 60.0 * math.cos(mean_lat_rad)
    dy_nm = (tgt_lat - own_lat) * 60.0
    distance_nm = math.sqrt(dx_nm ** 2 + dy_nm ** 2)

    # 2. True bearing from own-ship to target
    true_bearing_deg = normalize_angle(math.degrees(math.atan2(dx_nm, dy_nm)))

    # Relative bearing from own-ship bow (0° to 360° clockwise)
    rel_bearing_deg = normalize_angle(true_bearing_deg - own_cog)

    # Aspect angle (bearing of own-ship from target's bow)
    back_bearing_deg = normalize_angle(true_bearing_deg + 180.0)
    aspect_angle_deg = normalize_angle(back_bearing_deg - tgt_cog)

    # 3. Velocity vectors in knots (East, North)
    v_own_x = own_sog * math.sin(math.radians(own_cog))
    v_own_y = own_sog * math.cos(math.radians(own_cog))

    v_tgt_x = tgt_sog * math.sin(math.radians(tgt_cog))
    v_tgt_y = tgt_sog * math.cos(math.radians(tgt_cog))

    # Relative velocity: V_rel = V_tgt - V_own
    v_rel_x = v_tgt_x - v_own_x
    v_rel_y = v_tgt_y - v_own_y
    v_rel_sq = v_rel_x ** 2 + v_rel_y ** 2
    v_rel_knots = math.sqrt(v_rel_sq)

    # 4. CPA & TCPA
    if v_rel_knots < 1e-4:
        # Ships are travelling at identical velocity vector
        cpa_nm = distance_nm
        tcpa_min = 0.0
        is_converging = False
    else:
        # Vector dot product: - (P_rel . V_rel) / |V_rel|^2 (hours)
        p_dot_v = dx_nm * v_rel_x + dy_nm * v_rel_y
        tcpa_hours = -p_dot_v / v_rel_sq
        tcpa_min = tcpa_hours * 60.0

        if tcpa_min < 0:
            # Ships are diverging (CPA was in the past)
            cpa_nm = distance_nm
            is_converging = False
        else:
            is_converging = True
            cpa_x = dx_nm + v_rel_x * tcpa_hours
            cpa_y = dy_nm + v_rel_y * tcpa_hours
            cpa_nm = math.sqrt(cpa_x ** 2 + cpa_y ** 2)

    return distance_nm, rel_bearing_deg, aspect_angle_deg, cpa_nm, tcpa_min, v_rel_knots, is_converging


def calculate_collision_risk_index(
    distance_nm: float,
    cpa_nm: float,
    tcpa_min: float,
    rel_bearing_deg: float,
    is_converging: bool,
    d_safe: float = 1.5,
    t_safe: float = 20.0
) -> float:
    """
    Synthesizes a continuous Collision Risk Index (CRI) in [0.0, 1.0].
    Based on Fuji-Goodwin ship domain potential & time-distance hazard weighting.
    """
    if not is_converging or distance_nm > 20.0:
        return 0.0

    # DCPA risk component: 1.0 when CPA=0, decaying to ~0 beyond d_safe
    u_dcpa = math.exp(-((cpa_nm / max(d_safe, 0.1)) ** 2) * 1.8)

    # TCPA risk component: 1.0 when TCPA=0, decaying to ~0 beyond t_safe
    u_tcpa = math.exp(-((max(tcpa_min, 0.0) / max(t_safe, 1.0)) ** 2) * 1.5)

    # Proximity risk component: inverse decay over distance
    u_dist = math.exp(-((distance_nm / 8.0) ** 2) * 1.2)

    # Bearing hazard factor: encounters ahead (near 0°) carry higher initial hazard
    bearing_rad = math.radians(rel_bearing_deg)
    u_bearing = 0.5 * (1.0 + math.cos(bearing_rad))  # 1.0 on bow, 0.0 on stern

    # Weighted synthesis
    cri = 0.40 * u_dcpa + 0.35 * u_tcpa + 0.15 * u_dist + 0.10 * u_bearing
    return round(min(max(cri, 0.0), 1.0), 3)


def classify_colregs_encounter(
    distance_nm: float,
    rel_bearing_deg: float,
    aspect_angle_deg: float,
    own_cog: float,
    tgt_cog: float,
    own_sog: float,
    tgt_sog: float,
    cpa_nm: float,
    tcpa_min: float,
    cri: float,
    target_mmsi: int,
    target_name: str
) -> ColregsEvaluation:
    """
    Applies COLREGs Rules 13, 14, 15, and 17 to determine legal obligations and avoidance maneuvers.
    """
    # Course difference (relative course)
    course_diff = abs(angle_diff(tgt_cog, own_cog))

    # Risk classification
    if cri >= 0.65 or (cpa_nm < 1.0 and 0 <= tcpa_min <= 15.0 and distance_nm < 6.0):
        risk_level = RiskLevel.CRITICAL_RISK
    elif cri >= 0.30 or (cpa_nm < 2.0 and 0 <= tcpa_min <= 30.0 and distance_nm < 10.0):
        risk_level = RiskLevel.CAUTION
    else:
        risk_level = RiskLevel.SAFE

    # Safe separation (no active hazard)
    if risk_level == RiskLevel.SAFE and distance_nm > 5.0:
        return ColregsEvaluation(
            target_mmsi=target_mmsi,
            target_name=target_name,
            distance_nm=round(distance_nm, 2),
            relative_bearing_deg=round(rel_bearing_deg, 1),
            cpa_nm=round(cpa_nm, 2),
            tcpa_minutes=round(tcpa_min, 1),
            is_converging=tcpa_min >= 0,
            risk_level=RiskLevel.SAFE,
            collision_risk_index=cri,
            encounter_type=ColregsEncounterType.SAFE_SEPARATION,
            rule_applied="Rule 8 (Action to avoid collision - Safe clearance maintained)",
            obligation="NONE",
            recommended_action="Maintain scheduled passage. Clear water ahead.",
            recommended_heading_delta_deg=0.0
        )

    # ━━━ 1. RULE 13: OVERTAKING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Target is approaching from > 112.5° abaft own beam OR own ship approaching from > 112.5° abaft target
    if 112.5 < aspect_angle_deg < 247.5 and own_sog > tgt_sog:
        # Own-ship is overtaking target
        return ColregsEvaluation(
            target_mmsi=target_mmsi,
            target_name=target_name,
            distance_nm=round(distance_nm, 2),
            relative_bearing_deg=round(rel_bearing_deg, 1),
            cpa_nm=round(cpa_nm, 2),
            tcpa_minutes=round(tcpa_min, 1),
            is_converging=tcpa_min >= 0,
            risk_level=risk_level,
            collision_risk_index=cri,
            encounter_type=ColregsEncounterType.OVERTAKING_GIVE_WAY,
            rule_applied="Rule 13 (Overtaking) — Give-Way Vessel",
            obligation="GIVE_WAY",
            recommended_action="Keep clear of overtaken vessel. Alter course to starboard (+25°) to pass safely on target's starboard quarter.",
            recommended_heading_delta_deg=+25.0
        )
    elif 112.5 < rel_bearing_deg < 247.5 and tgt_sog > own_sog:
        # Target is overtaking own-ship
        return ColregsEvaluation(
            target_mmsi=target_mmsi,
            target_name=target_name,
            distance_nm=round(distance_nm, 2),
            relative_bearing_deg=round(rel_bearing_deg, 1),
            cpa_nm=round(cpa_nm, 2),
            tcpa_minutes=round(tcpa_min, 1),
            is_converging=tcpa_min >= 0,
            risk_level=risk_level,
            collision_risk_index=cri,
            encounter_type=ColregsEncounterType.BEING_OVERTAKEN,
            rule_applied="Rule 13 (Being Overtaken) — Stand-On Vessel",
            obligation="STAND_ON",
            recommended_action="Maintain steady course and speed. Target vessel is legally obligated to keep clear.",
            recommended_heading_delta_deg=0.0
        )

    # ━━━ 2. RULE 14: HEAD-ON SITUATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Reciprocal or nearly reciprocal courses within ±10° relative bearing
    is_head_on_bearing = (rel_bearing_deg <= 10.0 or rel_bearing_deg >= 350.0)
    is_reciprocal_course = (course_diff >= 165.0 and course_diff <= 195.0)

    if is_head_on_bearing and is_reciprocal_course:
        return ColregsEvaluation(
            target_mmsi=target_mmsi,
            target_name=target_name,
            distance_nm=round(distance_nm, 2),
            relative_bearing_deg=round(rel_bearing_deg, 1),
            cpa_nm=round(cpa_nm, 2),
            tcpa_minutes=round(tcpa_min, 1),
            is_converging=tcpa_min >= 0,
            risk_level=risk_level,
            collision_risk_index=cri,
            encounter_type=ColregsEncounterType.HEAD_ON,
            rule_applied="Rule 14 (Head-on Situation) — Mandatory Mutual Avoidance",
            obligation="GIVE_WAY",
            recommended_action="MANDATORY RULE 14: Alter course to Starboard (+30°) to pass port-to-port. Do NOT turn to port.",
            recommended_heading_delta_deg=+30.0
        )

    # ━━━ 3. RULE 15: CROSSING — GIVE-WAY (Target on Starboard side) ────────
    # Target is on own starboard side (005° to 112.5°) and crossing path
    if 5.0 <= rel_bearing_deg <= 112.5:
        return ColregsEvaluation(
            target_mmsi=target_mmsi,
            target_name=target_name,
            distance_nm=round(distance_nm, 2),
            relative_bearing_deg=round(rel_bearing_deg, 1),
            cpa_nm=round(cpa_nm, 2),
            tcpa_minutes=round(tcpa_min, 1),
            is_converging=tcpa_min >= 0,
            risk_level=risk_level,
            collision_risk_index=cri,
            encounter_type=ColregsEncounterType.CROSSING_GIVE_WAY,
            rule_applied="Rule 15 (Crossing Situation) — Give-Way Vessel",
            obligation="GIVE_WAY",
            recommended_action="RULE 15 GIVE-WAY: Target is to Starboard. Alter course to Starboard (+35°) to pass astern of target.",
            recommended_heading_delta_deg=+35.0
        )

    # ━━━ 4. RULE 17: CROSSING — STAND-ON (Target on Port side) ─────────────
    # Target is on own port side (247.5° to 355°)
    if 247.5 <= rel_bearing_deg <= 355.0:
        return ColregsEvaluation(
            target_mmsi=target_mmsi,
            target_name=target_name,
            distance_nm=round(distance_nm, 2),
            relative_bearing_deg=round(rel_bearing_deg, 1),
            cpa_nm=round(cpa_nm, 2),
            tcpa_minutes=round(tcpa_min, 1),
            is_converging=tcpa_min >= 0,
            risk_level=risk_level,
            collision_risk_index=cri,
            encounter_type=ColregsEncounterType.CROSSING_STAND_ON,
            rule_applied="Rule 17 (Action by Stand-on Vessel)",
            obligation="STAND_ON",
            recommended_action="RULE 17 STAND-ON: Target is on Port side and must give way. Maintain course & speed. Standby for Rule 17(a)(ii) action if target fails to act.",
            recommended_heading_delta_deg=0.0
        )

    # Default fallback safe separation
    return ColregsEvaluation(
        target_mmsi=target_mmsi,
        target_name=target_name,
        distance_nm=round(distance_nm, 2),
        relative_bearing_deg=round(rel_bearing_deg, 1),
        cpa_nm=round(cpa_nm, 2),
        tcpa_minutes=round(tcpa_min, 1),
        is_converging=tcpa_min >= 0,
        risk_level=risk_level,
        collision_risk_index=cri,
        encounter_type=ColregsEncounterType.SAFE_SEPARATION,
        rule_applied="Rule 8 (Action to Avoid Collision)",
        obligation="NONE",
        recommended_action="Maintain navigational watch.",
        recommended_heading_delta_deg=0.0
    )


def evaluate_colregs_for_traffic(
    own_lat: float,
    own_lon: float,
    own_sog: float,
    own_cog: float,
    traffic_vessels: list[Any]
) -> list[ColregsEvaluation]:
    """
    Evaluates collision risk and COLREGs rules for an entire fleet of surrounding vessels.
    Returns a sorted list of evaluations (highest collision risk first).
    """
    evaluations: list[ColregsEvaluation] = []

    for v in traffic_vessels:
        # Handle dict or VesselState object
        tgt_mmsi = getattr(v, "mmsi", None) or v.get("mmsi", 0)
        tgt_name = getattr(v, "name", None) or v.get("name", f"MMSI-{tgt_mmsi}")
        tgt_lat = getattr(v, "lat", None) if getattr(v, "lat", None) is not None else v.get("lat", 0.0)
        tgt_lon = getattr(v, "lon", None) if getattr(v, "lon", None) is not None else v.get("lon", 0.0)
        tgt_sog = getattr(v, "sog_knots", None) if getattr(v, "sog_knots", None) is not None else v.get("sog_knots", 0.0)
        tgt_cog = getattr(v, "cog_deg", None) if getattr(v, "cog_deg", None) is not None else v.get("cog_deg", 0.0)

        dist, rel_bearing, aspect, cpa, tcpa, v_rel, converging = compute_relative_kinematics(
            own_lat, own_lon, own_sog, own_cog,
            tgt_lat, tgt_lon, tgt_sog, tgt_cog
        )

        # Ignore vessels beyond 30 Nautical Miles
        if dist > 30.0:
            continue

        cri = calculate_collision_risk_index(dist, cpa, tcpa, rel_bearing, converging)

        evaluation = classify_colregs_encounter(
            dist, rel_bearing, aspect,
            own_cog, tgt_cog,
            own_sog, tgt_sog,
            cpa, tcpa, cri,
            tgt_mmsi, tgt_name
        )
        evaluations.append(evaluation)

    # Sort descending by collision risk index
    evaluations.sort(key=lambda x: x.collision_risk_index, reverse=True)
    return evaluations
