"""
Project ORCA — Fuel-Optimal Navigation & COLREGs Collision Avoidance Package
"""

from .router import MaritimePathOptimizer, compute_optimal_marine_route, get_path_optimizer
from .colregs import (
    ColregsEvaluation,
    ColregsEncounterType,
    RiskLevel,
    compute_relative_kinematics,
    calculate_collision_risk_index,
    classify_colregs_encounter,
    evaluate_colregs_for_traffic
)
from .dynamic_router import DynamicColregsRouter, dynamic_router

__all__ = [
    "MaritimePathOptimizer",
    "compute_optimal_marine_route",
    "get_path_optimizer",
    "ColregsEvaluation",
    "ColregsEncounterType",
    "RiskLevel",
    "compute_relative_kinematics",
    "calculate_collision_risk_index",
    "classify_colregs_encounter",
    "evaluate_colregs_for_traffic",
    "DynamicColregsRouter",
    "dynamic_router"
]
