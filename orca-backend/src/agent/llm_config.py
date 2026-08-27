"""
Project ORCA (SIH26176) — Local LLM & Embedding Engine Configuration
Configures sovereign, 100% local open-weight models using ChatOllama (Qwen 2.5) and OllamaEmbeddings (BGE-M3).
Ensures zero external cloud data egress and deterministic (temp=0.0) spatial routing.
"""

import os
import logging
import hashlib
import numpy as np
from typing import Any

from langchain_ollama import ChatOllama, OllamaEmbeddings

logger = logging.getLogger("ORCA.LLMConfig")

# ==============================================================================
# OLLAMA CONFIGURATION DEFAULTS
# ==============================================================================
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Primary Reasoning & Structured Output LLM (Qwen 2.5 7B Instruct)
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct-q5_k_m")
OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.0"))
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "8192"))

# Primary Multilingual Dense Embedding Model (BGE-M3)
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "bge-m3")
EMBEDDING_DIMENSION = 768


# ==============================================================================
# FACTORY FUNCTIONS & EXPORTED INSTANCES
# ==============================================================================

def init_chat_llm(
    model: str | None = None,
    temperature: float | None = None,
    format: str | None = None,
    timeout: float = 60.0
) -> ChatOllama:
    """
    Initializes a ChatOllama instance configured for deterministic structured routing.
    
    Args:
        model: Target local LLM (defaults to 'qwen2.5:7b-instruct-q5_k_m').
        temperature: Set strictly to 0.0 for deterministic spatial & mathematical routing.
        format: Optional format mode ('json' or None for schema-guided output).
        timeout: Maximum HTTP timeout in seconds for local inference.
    """
    target_model = model or OLLAMA_MODEL
    target_temp = temperature if temperature is not None else OLLAMA_TEMPERATURE

    logger.info(f"Initializing ChatOllama [model='{target_model}', temperature={target_temp}, base_url='{OLLAMA_BASE_URL}']")
    return ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=target_model,
        temperature=target_temp,
        num_ctx=OLLAMA_NUM_CTX,
        format=format,
        timeout=timeout
    )


def init_embeddings_model(model: str | None = None) -> OllamaEmbeddings:
    """
    Initializes an OllamaEmbeddings instance targeting BGE-M3 for sovereign vector encoding.
    
    Args:
        model: Target local embedding model (defaults to 'bge-m3').
    """
    target_embed_model = model or OLLAMA_EMBED_MODEL
    logger.info(f"Initializing OllamaEmbeddings [model='{target_embed_model}', base_url='{OLLAMA_BASE_URL}']")
    return OllamaEmbeddings(
        base_url=OLLAMA_BASE_URL,
        model=target_embed_model
    )


# Export standard pre-configured instances for direct import across agent nodes
chat_llm: ChatOllama = init_chat_llm()
embed_model: OllamaEmbeddings = init_embeddings_model()


def get_chat_llm() -> ChatOllama:
    """Returns the primary configured ChatOllama instance."""
    return chat_llm


def get_embeddings_model() -> OllamaEmbeddings:
    """Returns the primary configured OllamaEmbeddings instance."""
    return embed_model


def generate_deterministic_embedding(text: str, dim: int = EMBEDDING_DIMENSION) -> list[float]:
    """
    Generates a deterministic normalized unit vector from input text.
    Ensures 100% test reliability and offline resilience when the local Ollama daemon is starting up.
    """
    h = hashlib.sha256(text.encode("utf-8")).digest()
    seed = int.from_bytes(h[:4], "big")
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(dim).astype(float)
    unit_vec = (vec / np.linalg.norm(vec)).tolist()
    return unit_vec


async def check_ollama_health() -> bool:
    """Checks if the local Ollama server is reachable and serving models."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return res.status_code == 200
    except Exception:
        return False
