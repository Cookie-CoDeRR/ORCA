"""
Project ORCA (SIH26176) — Research Literature RAG Agent Node
Performs semantic vector search over peer-reviewed oceanographic papers (CMFRI, INCOIS, Journals)
and updates state["research_papers"].
"""

import logging
from typing import Any
from ..state import AgentState
from .tools import retrieve_research_papers

logger = logging.getLogger("ORCA.ResearchRAGAgent")


async def research_rag_agent_node(state: AgentState) -> dict[str, Any]:
    """
    Executes dense semantic vector retrieval over peer-reviewed research papers.
    """
    query = state.get("user_query", "Coastal upwelling and pelagic fish habitat suitability in the Indian Ocean")
    logger.info(f"🔬 [Research RAG Agent] Retrieving peer-reviewed papers for query: '{query[:80]}...'")

    papers = await retrieve_research_papers(query_text=query, top_k=3)
    logger.info(f"📚 [Research RAG Agent] Retrieved {len(papers)} research papers.")

    return {"research_papers": papers}
