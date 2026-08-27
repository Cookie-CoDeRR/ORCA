"""
Project ORCA (SIH26176) — Master Multi-Agent LangGraph System
Compiles the 6-agent StateGraph with dynamic sub-task fan-out,
parallel worker execution, and PostgreSQL checkpointer persistence.
"""

import time
import logging
from typing import Any, Sequence

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.base import BaseCheckpointSaver

from .state import AgentState
from .supervisor import supervisor_agent_node
from .ocean_analytics import ocean_analytics_agent_node
from .risk_geofencing import risk_geofencing_agent_node
from .navigation import navigation_agent_node
from .policy_rag import policy_rag_agent_node
from .synthesizer import synthesizer_agent_node
from ..memory.checkpointer import get_checkpointer

logger = logging.getLogger("ORCA.MasterGraph")


def build_orca_graph(checkpointer: BaseCheckpointSaver | None = None) -> Any:
    """
    Constructs and compiles the master Project ORCA Multi-Agent StateGraph.

    Architecture:
      START -> supervisor
                 ├──> ocean_analytics  ──┐
                 ├──> risk_geofencing  ──┼──> synthesizer -> END
                 ├──> navigation       ──┤
                 └──> policy_rag       ──┘
    """
    builder = StateGraph(AgentState)

    # 1. Register Nodes
    builder.add_node("supervisor", supervisor_agent_node)
    builder.add_node("ocean_analytics", ocean_analytics_agent_node)
    builder.add_node("risk_geofencing", risk_geofencing_agent_node)
    builder.add_node("navigation", navigation_agent_node)
    builder.add_node("policy_rag", policy_rag_agent_node)
    builder.add_node("synthesizer", synthesizer_agent_node)

    # 2. Add Edges: Ingress
    builder.add_edge(START, "supervisor")

    # 3. Dynamic Parallel Dispatch from Supervisor to Workers
    builder.add_edge("supervisor", "ocean_analytics")
    builder.add_edge("supervisor", "risk_geofencing")
    builder.add_edge("supervisor", "navigation")
    builder.add_edge("supervisor", "policy_rag")

    # 4. Join all parallel workers into Synthesizer
    builder.add_edge("ocean_analytics", "synthesizer")
    builder.add_edge("risk_geofencing", "synthesizer")
    builder.add_edge("navigation", "synthesizer")
    builder.add_edge("policy_rag", "synthesizer")

    # 5. Egress
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
    checkpointer: BaseCheckpointSaver | None = None
) -> dict[str, Any]:
    """
    Executes a complete multi-agent turn through the compiled LangGraph.
    """
    start_time = time.time()
    graph = build_orca_graph(checkpointer=checkpointer)

    input_state: AgentState = {
        "messages": [HumanMessage(content=user_query)],
        "user_query": user_query,
        "active_tasks": []
    }

    config = {"configurable": {"thread_id": str(thread_id)}}
    logger.info(f"🚀 [Master Graph] Invoking turn for thread_id='{thread_id}'...")

    final_state = await graph.ainvoke(input_state, config=config)
    duration_ms = int((time.time() - start_time) * 1000)

    logger.info(f"✅ [Master Graph] Turn completed in {duration_ms} ms.")

    return {
        "thread_id": thread_id,
        "query": user_query,
        "response": final_state.get("final_response"),
        "active_tasks": final_state.get("active_tasks"),
        "origin_coordinates": final_state.get("origin_coordinates"),
        "target_coordinates": final_state.get("target_coordinates"),
        "execution_time_ms": duration_ms
    }
