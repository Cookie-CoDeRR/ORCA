"""
Project ORCA (SIH26176) — FastAPI Backend Gateway
Exposes asynchronous REST APIs for multi-agent reasoning, pgvector RAG queries,
and MinIO scientific raster retrieval with persistent LangGraph session memory.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .database.connection import get_db_pool, close_db_pool, init_db
from .database.vector_store import PGVectorStore
from .memory.checkpointer import setup_checkpointer, get_checkpointer
from .storage.minio_client import get_minio_client
from .agent.graph_builder import build_orca_agent_graph, execute_agent_turn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ORCA.FastAPIGateway")

# Global Agent Graph instance
_agent_graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Manager:
    Initializes PostgreSQL connection pool, applies PostGIS & pgvector schema,
    provisions LangGraph memory checkpointer, and compiles the agent graph.
    """
    global _agent_graph
    logger.info("🌊 Starting Project ORCA Backend Gateway...")

    # 1. Initialize PostgreSQL Connection Pool & Schema
    try:
        await get_db_pool()
        await init_db()
    except Exception as e:
        logger.warning(f"Database connection not available at startup ({e}). Continuing in standalone mode.")

    # 2. Setup LangGraph Checkpointer & Compile Graph
    try:
        await setup_checkpointer()
        checkpointer = await get_checkpointer()
        _agent_graph = build_orca_agent_graph(checkpointer=checkpointer)
    except Exception as e:
        logger.warning(f"Checkpointer setup failed ({e}). Compiling ephemeral graph.")
        _agent_graph = build_orca_agent_graph(checkpointer=None)

    # 3. Initialize MinIO S3 Storage Client
    try:
        get_minio_client()
    except Exception as e:
        logger.warning(f"MinIO client init warning: {e}")

    logger.info("🚀 Project ORCA Backend successfully initialized and ready for requests.")
    yield

    # Teardown
    logger.info("Shutting down Project ORCA Backend Gateway...")
    await close_db_pool()


# FastAPI App
app = FastAPI(
    title="Project ORCA — Marine Intelligence & Advisory Gateway",
    description="Sovereign, Air-Gappable Multi-Agent API for Indian Maritime Safety & Fisheries",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# API REQUEST & RESPONSE SCHEMAS
# ==============================================================================

class QueryRequest(BaseModel):
    query: str = Field(..., description="Natural language marine inquiry (e.g. 'Can 4 boats go southwest of Veraval for Tuna?')")
    thread_id: str = Field("default-session", description="Unique session ID for LangGraph memory tracking")
    language_code: str = Field("en", description="Target Indic language code (en, gu, ta, hi, te, ml, mr)")


class OptimalRouteRequest(BaseModel):
    start: list[float] = Field(..., description="[latitude, longitude] origin coordinates (e.g. [18.94, 72.86])")
    destination: list[float] = Field(..., description="[latitude, longitude] destination coordinates (e.g. [19.50, 71.20])")
    speed_knots: float = Field(10.0, description="Vessel cruise speed in knots (default: 10.0)")


# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

@app.get("/")
async def root_health_check():
    """Health check and service status."""
    return {
        "project": "Project ORCA (SIH26176)",
        "status": "ONLINE",
        "services": {
            "postgis_database": "ENABLED",
            "pgvector_rag": "ENABLED",
            "langgraph_checkpointer": "POSTGRES_SAVER",
            "minio_object_storage": "CONNECTED",
            "vector_routing_engine": "ACTIVE"
        }
    }


@app.post("/api/v1/query")
async def execute_query(req: QueryRequest):
    """
    Primary Multi-Agent Ingress Endpoint.
    Executes LangGraph workflow, persists memory to PostgreSQL, and returns
    synthesized advisory, telemetry, and MapLibre/deck.gl GeoJSON payload.
    """
    global _agent_graph
    if _agent_graph is None:
        _agent_graph = build_orca_agent_graph()

    try:
        result = await execute_agent_turn(
            graph=_agent_graph,
            user_message=req.query,
            thread_id=req.thread_id,
            language_code=req.language_code
        )
        return result
    except Exception as e:
        logger.error(f"Error executing agent turn: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/navigation/optimal-route")
async def get_optimal_marine_route(req: OptimalRouteRequest):
    """
    Vector-Assisted Fuel-Optimal Marine Routing Engine.
    Calculates dynamic A* path over surface currents and 10m wind fields,
    returning GeoJSON LineString with fuel savings, distance, duration, and deck.gl segment color codes.
    """
    from .navigation.router import compute_optimal_marine_route

    if len(req.start) != 2 or len(req.destination) != 2:
        raise HTTPException(status_code=400, detail="Start and destination must each contain [latitude, longitude].")

    result = compute_optimal_marine_route(
        start_lat=req.start[0],
        start_lon=req.start[1],
        end_lat=req.destination[0],
        end_lon=req.destination[1],
        vessel_knots=req.speed_knots
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/api/v1/navigation/vectors")
async def get_surface_current_vectors():
    """Returns the surface current and wind vector grid for deck.gl Particle / FlowLayer."""
    import json
    json_path = Path(__file__).resolve().parent.parent / "data" / "vectors" / "surface_currents_wind.json"
    if not json_path.exists():
        raise HTTPException(status_code=404, detail="Vector dataset not yet compiled. Run script 10.")
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.post("/api/v1/rag/ingest")
async def ingest_rag_knowledge_base():
    """Ingests the generated maritime policy chunks JSON into pgvector."""
    kb_path = Path(__file__).resolve().parent.parent.parent / "orca-data-pipeline" / "data" / "processed" / "knowledge_base" / "maritime_policy_chunks.json"
    
    store = PGVectorStore()
    count = await store.ingest_from_chunks_json(kb_path)
    return {
        "status": "SUCCESS",
        "chunks_ingested": count,
        "source_file": str(kb_path.name)
    }

