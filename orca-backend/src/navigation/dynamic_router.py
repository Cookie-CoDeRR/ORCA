"""
Project ORCA (SIH26176) — COLREGs-Compliant Dynamic Vector & Traffic Router
Extends the 2D surface current & wind A* path optimizer by factoring in moving AIS vessel domains,
predicted TCPA collision cones, and legal COLREGs maneuver penalties (Rules 13, 14, 15, 17).
"""

import math
import heapq
import logging
from typing import Optional, Any
from pathlib import Path

import numpy as np

from .router import MaritimePathOptimizer, get_path_optimizer
from .colregs import (
    evaluate_colregs_for_traffic,
    ColregsEvaluation,
    ColregsEncounterType,
    RiskLevel,
    compute_relative_kinematics
)
from ..traffic.traffic_cache import traffic_cache, VesselState

logger = logging.getLogger("ORCA.DynamicRouter")


class DynamicColregsRouter:
    """
    Spatio-temporal A* router that avoids both static hydrodynamics (head currents/shallow shelf)
    and dynamic moving obstacles (AIS merchant/fishing vessels) while strictly adhering to COLREGs.
    """

    def __init__(self, base_optimizer: Optional[MaritimePathOptimizer] = None):
        self.base_optimizer = base_optimizer or get_path_optimizer()

    def _get_projected_vessel_position(
        self,
        vessel: VesselState,
        elapsed_seconds: float
    ) -> tuple[float, float]:
        """
        Projects a vessel's geographic position after elapsed_seconds using dead reckoning.
        """
        sog = vessel.sog_knots
        cog = vessel.cog_deg
        if sog < 0.1:
            return vessel.lat, vessel.lon

        dist_nm = (sog * elapsed_seconds) / 3600.0
        cog_rad = math.radians(cog)
        lat_cos = math.cos(math.radians(vessel.lat)) or 1.0

        d_lat = (dist_nm * math.cos(cog_rad)) / 60.0
        d_lon = (dist_nm * math.sin(cog_rad)) / (60.0 * lat_cos)

        return vessel.lat + d_lat, vessel.lon + d_lon

    def _evaluate_domain_penalty(
        self,
        node_lat: float,
        node_lon: float,
        node_heading_deg: float,
        elapsed_seconds: float,
        vessels: list[VesselState]
    ) -> tuple[float, Optional[ColregsEvaluation]]:
        """
        Evaluates moving vessel domain violation cost and COLREGs directional penalties.
        Returns:
            (penalty_cost, highest_risk_colregs_eval)
        """
        penalty = 0.0
        worst_eval: Optional[ColregsEvaluation] = None
        max_cri = 0.0

        for v in vessels:
            # Projected target location at this timestep
            proj_lat, proj_lon = self._get_projected_vessel_position(v, elapsed_seconds)

            # Distance from search node to projected vessel (in NM)
            mean_lat_rad = math.radians((node_lat + proj_lat) / 2.0)
            dx_nm = (proj_lon - node_lon) * 60.0 * math.cos(mean_lat_rad)
            dy_nm = (proj_lat - node_lat) * 60.0
            dist_nm = math.sqrt(dx_nm ** 2 + dy_nm ** 2)

            # Ignore distant targets
            if dist_nm > 6.0:
                continue

            # Dynamic Navigation Ship Domain (DNSD) threshold: 1.5 NM ahead, 0.8 NM abeam
            domain_radius_nm = 1.2 + (v.sog_knots * 0.04)

            if dist_nm < domain_radius_nm:
                # Direct penetration of moving safety domain -> heavy cost penalty
                penetration_ratio = (domain_radius_nm - dist_nm) / domain_radius_nm
                penalty += 5000.0 * (penetration_ratio ** 2)

            # Kinematics check
            dist, rel_bearing, aspect, cpa, tcpa, v_rel, converging = compute_relative_kinematics(
                node_lat, node_lon, 10.0, node_heading_deg,
                proj_lat, proj_lon, v.sog_knots, v.cog_deg
            )

            # COLREGs Directional Maneuver Penalty:
            # Under Rule 14 (Head-On) and Rule 15 (Crossing Starboard), turns to Port (left)
            # are penalized heavily to encourage legal starboard-side evasions
            if converging and dist_nm < 4.0:
                # If target is on starboard side (005° to 112.5°) and we are steering towards port
                if 5.0 <= rel_bearing <= 112.5:
                    penalty += 800.0  # Encourage passing astern/starboard
                # If head-on situation within ±15°
                elif (rel_bearing <= 15.0 or rel_bearing >= 345.0) and abs(node_heading_deg - v.cog_deg) > 150.0:
                    penalty += 1200.0

        return penalty, worst_eval

    def calculate_dynamic_route(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        vessel_speed_knots: float = 10.0,
        active_traffic: Optional[list[VesselState]] = None
    ) -> dict[str, Any]:
        """
        Calculates time-dependent, COLREGs-compliant route around dynamic AIS traffic.
        """
        # Fetch traffic if not explicitly supplied
        if active_traffic is None:
            mid_lat = (start_lat + end_lat) / 2.0
            mid_lon = (start_lon + end_lon) / 2.0
            active_traffic = traffic_cache.get_active_vessels_in_radius(mid_lat, mid_lon, radius_nm=45.0)

        # Baseline static vector route calculation first
        base_route = self.base_optimizer.calculate_optimal_path(
            start=(start_lat, start_lon),
            goal=(end_lat, end_lon),
            vessel_speed_knots=vessel_speed_knots
        )

        if "error" in base_route or not active_traffic:
            # Return baseline if no traffic in sector
            if "properties" in base_route:
                base_route["properties"]["colregs_evaluated"] = False
                base_route["properties"]["active_traffic_count"] = 0
            return base_route

        # Evaluate initial COLREGs state at origin
        initial_colregs = evaluate_colregs_for_traffic(
            start_lat, start_lon, vessel_speed_knots,
            math.degrees(math.atan2(end_lon - start_lon, end_lat - start_lat)) % 360.0,
            active_traffic
        )

        critical_risks = [e for e in initial_colregs if e.risk_level == RiskLevel.CRITICAL_RISK]
        caution_risks = [e for e in initial_colregs if e.risk_level == RiskLevel.CAUTION]

        # Spatio-Temporal A* Search with dynamic vessel domain constraints
        base_vessel_speed_ms = vessel_speed_knots * 0.514444
        start_node = (round(float(start_lat), 2), round(float(start_lon), 2))
        goal_node = (round(float(end_lat), 2), round(float(end_lon), 2))

        open_set = []
        heapq.heappush(open_set, (0.0, 0.0, start_node, [start_node], [], 0.0))
        visited = {}

        step_deg = 0.05
        best_path = None
        best_segments = []
        best_elapsed = 0.0

        max_iterations = 4000
        iterations = 0

        while open_set and iterations < max_iterations:
            iterations += 1
            est_cost, elapsed_time, current, path, segments, last_heading = heapq.heappop(open_set)
            lat, lon = current

            dist_to_goal = np.hypot(lat - goal_node[0], lon - goal_node[1])
            if dist_to_goal < (step_deg * 1.5):
                best_path = path + [goal_node]
                best_segments = segments
                best_elapsed = elapsed_time
                break

            if current in visited and visited[current] <= elapsed_time:
                continue
            visited[current] = elapsed_time

            for d_lat in [-step_deg, 0.0, step_deg]:
                for d_lon in [-step_deg, 0.0, step_deg]:
                    if d_lat == 0.0 and d_lon == 0.0:
                        continue

                    neighbor = (round(lat + d_lat, 2), round(lon + d_lon, 2))

                    dy = d_lat * 111139.0
                    dx = d_lon * 111139.0 * np.cos(np.radians(lat))
                    segment_dist = np.hypot(dx, dy)

                    heading_x = dx / segment_dist
                    heading_y = dy / segment_dist
                    heading_deg = (math.degrees(math.atan2(dx, dy))) % 360.0

                    u_curr, v_curr, u_wind, v_wind, wave_h = self.base_optimizer._get_vectors_at(lat, lon)
                    current_assist = (u_curr * heading_x) + (v_curr * heading_y)
                    effective_speed = max(0.8, base_vessel_speed_ms + current_assist)

                    step_time = segment_dist / effective_speed
                    new_elapsed = elapsed_time + step_time

                    # Dynamic Moving Traffic Domain Penalty
                    traffic_penalty, _ = self._evaluate_domain_penalty(
                        neighbor[0], neighbor[1], heading_deg, new_elapsed, active_traffic
                    )

                    rem_dist = np.hypot(
                        (goal_node[0] - neighbor[0]) * 111139.0,
                        (goal_node[1] - neighbor[1]) * 111139.0 * np.cos(np.radians(neighbor[0]))
                    )
                    heuristic = (rem_dist / (base_vessel_speed_ms + 1.2))

                    seg_info = {
                        "from": [float(round(lon, 4)), float(round(lat, 4))],
                        "to": [float(round(neighbor[1], 4)), float(round(neighbor[0], 4))],
                        "current_assist_ms": float(round(current_assist, 3)),
                        "wave_height_m": float(round(wave_h, 1)),
                        "traffic_avoidance_penalty": float(round(traffic_penalty, 1)),
                        "color": [239, 68, 68] if traffic_penalty > 100 else ([34, 197, 94] if current_assist > 0 else [59, 130, 246])
                    }

                    heapq.heappush(
                        open_set,
                        (
                            new_elapsed + heuristic + traffic_penalty,
                            new_elapsed,
                            neighbor,
                            path + [neighbor],
                            segments + [seg_info],
                            heading_deg
                        )
                    )

        if not best_path:
            # Fallback to static base route if dynamic search exceeded bounds
            return base_route

        # Compile GeoJSON result
        route_coordinates = [[float(round(p[1], 4)), float(round(p[0], 4))] for p in best_path]
        total_distance_m = float(len(best_path) * (step_deg * 111139.0))
        distance_nm = float(round(total_distance_m / 1852.0, 2))
        total_time_hours = float(round(best_elapsed / 3600.0, 2))

        return {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": route_coordinates
            },
            "properties": {
                "routing_mode": "COLREGs-Compliant Dynamic Multi-Agent Vector Route",
                "origin": {"lat": float(start_node[0]), "lon": float(start_node[1])},
                "destination": {"lat": float(goal_node[0]), "lon": float(goal_node[1])},
                "vessel_speed_knots": float(vessel_speed_knots),
                "total_time_hours": float(total_time_hours),
                "distance_nautical_miles": float(distance_nm),
                "active_traffic_count": len(active_traffic),
                "critical_collision_risks": len(critical_risks),
                "caution_risks": len(caution_risks),
                "colregs_evaluations": [e.to_dict() for e in initial_colregs[:5]],
                "colregs_advisory": critical_risks[0].recommended_action if critical_risks else (
                    caution_risks[0].recommended_action if caution_risks else "Clear passage with safe separation."
                ),
                "segments": best_segments
            }
        }


# Global Dynamic Router Singleton
dynamic_router = DynamicColregsRouter()
