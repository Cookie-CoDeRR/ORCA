"""
Project ORCA — Policy RAG Agent Node
Performs semantic vector search over Indian maritime circulars and updates state["policy_advisories"].
"""

import logging
from typing import Any
from ..state import AgentState
from .tools import retrieve_maritime_policy_circulars

logger = logging.getLogger("ORCA.PolicyRAGAgent")


async def policy_rag_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Executes semantic RAG query against the sovereign maritime policy database.
    """
    query = state.get("user_query", "Monsoon ban and fishing regulations in Indian EEZ")
    logger.info(f"📜 [Policy RAG Agent] Retrieving regulatory circulars for query: '{query[:80]}...'")

    advisories = await retrieve_maritime_policy_circulars(query_text=query, top_k=3)
    return {"policy_advisories": advisories}
