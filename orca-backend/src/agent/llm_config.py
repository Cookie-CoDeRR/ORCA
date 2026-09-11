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
def resolve_ollama_base_url() -> str:
    explicit = os.getenv("OLLAMA_BASE_URL")
    if explicit:
        return explicit
    if os.path.exists("/.dockerenv") or os.getenv("DOCKER_CONTAINER", "") == "true":
        return "http://host.docker.internal:11434"
    return "http://localhost:11434"

OLLAMA_BASE_URL = resolve_ollama_base_url()

def get_installed_ollama_models() -> list[str]:
    """Queries the local Ollama server for currently installed and ready model tags."""
    try:
        import urllib.request
        import json
        req = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/tags", headers={"User-Agent": "ORCA"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return [m.get("name", "") for m in data.get("models", [])]
    except Exception as e:
        logger.debug(f"[Model Resolver] Tag inspection error: {e}")
        return []


def resolve_active_model() -> str:
    """
    Intelligently resolves the active LLM model.
    Prioritizes Gemma 4 E4B (Google DeepMind edge-optimized multimodal MoE architecture).
    If Gemma 4 E4B is downloading or not yet ready, falls back to the best ready model
    (e.g., Qwen 2.5 7B or Gemma 2) and switches to Gemma 4 E4B automatically as soon as ready.
    """
    target = os.getenv("OLLAMA_MODEL", "gemma4:e4b-it-q4_K_M")
    installed = get_installed_ollama_models()

    if not installed:
        return target

    # 1. Check if requested target is already installed and ready
    for m in installed:
        if target in m or m.startswith(target):
            return m

    # 2. Check for any ready Gemma 4 variants
    for pref in ["gemma4:e4b-it-q4_K_M", "gemma4:e4b", "gemma4:26b", "gemma4"]:
        for m in installed:
            if pref in m or m.startswith(pref):
                return m

    # 3. Fall back to ready installed models while Gemma 4 download completes
    for fallback in ["qwen2.5:7b-instruct-q5_k_m", "qwen2.5:latest", "gemma2:latest", "gemma2:2b"]:
        for m in installed:
            if fallback in m or m.startswith(fallback):
                logger.info(f"⏳ [Model Resolver] Target '{target}' is downloading; active local fallback: '{m}'")
                return m

    return installed[0] if installed else target


# Primary Reasoning & Structured Output LLM (Gemma 4 E4B by default)
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:e4b-it-q4_K_M")
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
    """
    target_model = model or resolve_active_model()
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
    """
    target_embed_model = model or OLLAMA_EMBED_MODEL
    logger.info(f"Initializing OllamaEmbeddings [model='{target_embed_model}', base_url='{OLLAMA_BASE_URL}']")
    return OllamaEmbeddings(
        base_url=OLLAMA_BASE_URL,
        model=target_embed_model
    )


def get_chat_llm(
    model: str | None = None,
    temperature: float | None = None,
    format: str | None = None,
    timeout: float = 60.0
) -> ChatOllama:
    """Returns a freshly configured ChatOllama instance."""
    return init_chat_llm(model=model, temperature=temperature, format=format, timeout=timeout)


def get_embeddings_model() -> OllamaEmbeddings:
    """Returns the primary configured OllamaEmbeddings instance."""
    return init_embeddings_model()


# Global singletons exported for backward compatibility
chat_llm = init_chat_llm()
embed_model = init_embeddings_model()


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
    urls = [OLLAMA_BASE_URL]
    if "host.docker.internal" not in OLLAMA_BASE_URL:
        urls.append("http://host.docker.internal:11434")
    if "localhost" not in OLLAMA_BASE_URL:
        urls.append("http://localhost:11434")
    for u in urls:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{u}/api/tags")
                if res.status_code == 200:
                    return True
        except Exception:
            continue
    return False
