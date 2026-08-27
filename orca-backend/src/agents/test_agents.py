"""
Project ORCA (SIH26176) — Modular Multi-Agent System Test Suite
Tests all 6 individual sub-agent nodes and end-to-end execution of the compiled LangGraph.
"""

import pytest
from src.agents.state import AgentState
from src.agents.supervisor.schemas import SubTaskPlan
from src.agents.supervisor.agent import supervisor_agent_node
from src.agents.ocean_analytics.agent import ocean_analytics_agent_node
from src.agents.risk_geofencing.agent import risk_geofencing_agent_node
from src.agents.navigation.agent import navigation_agent_node
from src.agents.policy_rag.agent import policy_rag_agent_node
from src.agents.synthesizer.agent import synthesizer_agent_node
from src.agents.graph import build_orca_graph, run_orca_multi_agent


@pytest.mark.asyncio
async def test_supervisor_node_planning():
    """Validates supervisor query decomposition and spatial extraction."""
    state: AgentState = {
        "user_query": "Can 4 mechanized boats fish 30km off Veraval for Tuna tomorrow?",
        "messages": [],
        "active_tasks": []
    }
    result = await supervisor_agent_node(state)
    assert "active_tasks" in result
    assert "origin_coordinates" in result
    assert "target_coordinates" in result
    assert len(result["origin_coordinates"]) == 2
    assert "ocean_analytics" in result["active_tasks"]


@pytest.mark.asyncio
async def test_ocean_analytics_node():
    """Validates SST, Chlorophyll, and PFZ feature generation."""
    state: AgentState = {
        "origin_coordinates": [20.902, 70.368],
        "target_coordinates": [20.650, 70.150]
    }
    result = await ocean_analytics_agent_node(state)
    assert "ocean_data" in result
    data = result["ocean_data"]
    assert "telemetry" in data
    assert 20.0 <= data["telemetry"]["sst_celsius"] <= 35.0
    assert data["pfz_clusters_count"] >= 1
    assert len(data["pfz_geojson_features"]) >= 1


@pytest.mark.asyncio
async def test_risk_geofencing_node():
    """Validates PostGIS IMBL geofencing and MPA checks."""
    state: AgentState = {
        "origin_coordinates": [9.285, 79.315], # Rameswaram (near Sri Lanka IMBL)
        "target_coordinates": [9.150, 79.450]
    }
    result = await risk_geofencing_agent_node(state)
    assert "risk_assessment" in result
    risk = result["risk_assessment"]
    assert "imbl_check" in risk
    assert "mpa_check" in risk
    assert risk["imbl_check"]["distance_km"] < 25.0 # Close to Palk Strait


@pytest.mark.asyncio
async def test_navigation_node():
    """Validates vector-assisted dynamic A* path routing."""
    state: AgentState = {
        "origin_coordinates": [18.94, 72.86], # Mumbai
        "target_coordinates": [19.50, 71.20]
    }
    result = await navigation_agent_node(state)
    assert "route_plan" in result
    route = result["route_plan"]
    assert route.get("type") == "Feature"
    assert route.get("geometry", {}).get("type") == "LineString"
    assert route["properties"]["estimated_fuel_savings_percent"] > 0


@pytest.mark.asyncio
async def test_policy_rag_node():
    """Validates semantic retrieval of maritime circulars."""
    state: AgentState = {
        "user_query": "What is the monsoon fishing ban schedule for Gujarat trawlers?"
    }
    result = await policy_rag_agent_node(state)
    assert "policy_advisories" in result
    assert len(result["policy_advisories"]) >= 1


@pytest.mark.asyncio
async def test_master_multi_agent_graph_turn():
    """Validates end-to-end multi-agent graph orchestration."""
    query = "Plan a safe fishing trip from Veraval targeting Tuna with fuel-optimal navigation."
    result = await run_orca_multi_agent(
        user_query=query,
        thread_id="test-session-modular-001",
        checkpointer=None
    )
    assert result["thread_id"] == "test-session-modular-001"
    assert "response" in result
    resp = result["response"]
    assert "markdown_advisory" in resp
    assert "geojson_payload" in resp
    assert resp["geojson_payload"]["type"] == "FeatureCollection"
    assert len(resp["geojson_payload"]["features"]) >= 2
    print("\n✅ Master Multi-Agent LangGraph Execution Succeeded in:", result["execution_time_ms"], "ms")
