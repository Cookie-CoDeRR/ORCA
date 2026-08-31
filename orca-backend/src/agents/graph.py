"""
Project ORCA (SIH26176) — Master StateGraph Construction & Multi-Agent Compilation
Connects Supervisor, Ocean Analytics, Geospatial Risk, Vector Routing, Policy RAG,
and Multilingual Synthesizer into an executable LangGraph with PostgreSQL checkpointing.
"""

import time
import logging
from typing import Any

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.base import BaseCheckpointSaver
from langchain_core.messages import HumanMessage

from .state import AgentState
from .supervisor.agent import supervisor_agent_node
from .ocean_analytics.agent import ocean_analytics_agent_node
from .risk_geofencing.agent import risk_geofencing_agent_node
from .navigation.agent import navigation_agent_node
from .policy_rag.agent import policy_rag_agent_node
from .synthesizer.agent import synthesizer_agent_node

logger = logging.getLogger("ORCA.MasterGraph")


def build_orca_graph(checkpointer: BaseCheckpointSaver | None = None):
    """
    Constructs and compiles the master ORCA multi-agent workflow.
    """
    builder = StateGraph(AgentState)

    # 1. Register all nodes
    builder.add_node("supervisor", supervisor_agent_node)
    builder.add_node("ocean_analytics", ocean_analytics_agent_node)
    builder.add_node("risk_geofencing", risk_geofencing_agent_node)
    builder.add_node("navigation", navigation_agent_node)
    builder.add_node("policy_rag", policy_rag_agent_node)
    builder.add_node("synthesizer", synthesizer_agent_node)

    # 2. Add edges: Ingress -> Supervisor
    builder.add_edge(START, "supervisor")

    # 3. Add edges: Supervisor -> Parallel Workers
    builder.add_edge("supervisor", "ocean_analytics")
    builder.add_edge("supervisor", "risk_geofencing")
    builder.add_edge("supervisor", "navigation")
    builder.add_edge("supervisor", "policy_rag")

    # 4. Add edges: All Workers -> Synthesizer
    builder.add_edge("ocean_analytics", "synthesizer")
    builder.add_edge("risk_geofencing", "synthesizer")
    builder.add_edge("navigation", "synthesizer")
    builder.add_edge("policy_rag", "synthesizer")

    # 5. Add edge: Synthesizer -> Egress
    builder.add_edge("synthesizer", END)

    if checkpointer:
        logger.info("Compiling Master ORCA Graph with persistent PostgreSQL checkpointer...")
        return builder.compile(checkpointer=checkpointer)
    else:
        logger.info("Compiling Master ORCA Graph in standalone mode...")
        return builder.compile()


async def run_orca_multi_agent(
    user_query: str,
    thread_id: str = "default_session",
    user_role: str = "navigator",
    format_mode: str = "conversational",
    active_basin: str = "arabian_sea",
    target_coordinates: list[float] | None = None,
    origin_coordinates: list[float] | None = None,
    checkpointer: BaseCheckpointSaver | None = None
) -> dict[str, Any]:
    """
    Executes a complete multi-agent turn through the compiled LangGraph with persona and format options.
    """
    start_time = time.time()
    graph = build_orca_graph(checkpointer=checkpointer)

    input_state: AgentState = {
        "messages": [HumanMessage(content=user_query)],
        "user_query": user_query,
        "user_role": user_role,
        "format_mode": format_mode,
        "active_basin": active_basin,
        "target_coordinates": target_coordinates,
        "origin_coordinates": origin_coordinates,
        "active_tasks": []
    }

    config = {"configurable": {"thread_id": str(thread_id)}}
    logger.info(f"🚀 [Master Graph] Invoking turn for thread_id='{thread_id}' | Role='{user_role}' | Mode='{format_mode}'...")

    final_state = await graph.ainvoke(input_state, config=config)
    duration_ms = int((time.time() - start_time) * 1000)

    logger.info(f"✅ [Master Graph] Turn completed in {duration_ms} ms.")

    return {
        "thread_id": thread_id,
        "query": user_query,
        "user_role": user_role,
        "format_mode": format_mode,
        "response": final_state.get("final_response"),
        "active_tasks": final_state.get("active_tasks"),
        "origin_coordinates": final_state.get("origin_coordinates"),
        "target_coordinates": final_state.get("target_coordinates"),
        "execution_time_ms": duration_ms
    }
