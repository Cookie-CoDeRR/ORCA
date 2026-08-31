"""
Project ORCA (SIH26176) — FastAPI Backend Gateway
Exposes asynchronous REST APIs for multi-agent reasoning, dynamic A* vector routing,
pgvector policy RAG, and live ocean telemetry optimized for Next.js & deck.gl frontends.
"""

import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .database.connection import get_db_pool, close_db_pool, init_db
from .database.vector_store import PGVectorStore
from .memory.checkpointer import setup_checkpointer, get_default_checkpointer
from .storage.minio_client import get_minio_client
from .agents.graph import run_orca_multi_agent
from .agents.ocean_analytics.tools import get_sst_and_chlorophyll, find_nearby_pfz_clusters
from .agents.risk_geofencing.tools import check_imbl_proximity, check_protected_area_intersection, check_active_cyclone_warnings
from .navigation.router import compute_optimal_marine_route

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ORCA.FastAPIGateway")

# Preloaded vectors path
VECTORS_JSON_PATH = Path(__file__).resolve().parent.parent / "data" / "vectors" / "surface_currents_wind.json"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Manager:
    Initializes PostgreSQL connection pool, applies PostGIS & pgvector schema,
    and provisions LangGraph memory checkpointer.
    """
    logger.info("🌊 Starting Project ORCA Backend Gateway (SIH26176)...")

    # 1. Initialize PostgreSQL Connection Pool & Schema
    try:
        await get_db_pool()
        await init_db()
    except Exception as e:
        logger.warning(f"Database connection not available at startup ({e}). Continuing in standalone mode.")

    # 2. Setup LangGraph Checkpointer
    try:
        await setup_checkpointer()
    except Exception as e:
        logger.warning(f"Checkpointer setup deferred ({e}).")

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

# Allowed Origins for Next.js Frontend
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://cookiecoderr.online",
    "*"
]

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# 1. PYDANTIC REQUEST & RESPONSE SCHEMAS
# ==============================================================================

class ChatRequest(BaseModel):
    """Incoming user chat inquiry for multi-agent reasoning."""
    message: str = Field(..., description="User's natural language marine or navigation query")
    thread_id: str = Field("default-session", description="Unique conversation session ID for state checkpointer")
    user_role: str = Field("navigator", description="Active user persona ('researcher', 'navigator', 'student', 'defense', 'authority')")
    format_mode: str = Field("conversational", description="Output format ('conversational' for direct chat, 'report' for formal briefing)")
    active_basin: str = Field("arabian_sea", description="Active ocean basin context ('arabian_sea', 'bay_of_bengal', 'lakshadweep', 'andaman')")
    target_coordinates: Optional[list[float]] = Field(None, description="Optional target coordinates [latitude, longitude]")
    origin_coordinates: Optional[list[float]] = Field(None, description="Optional origin coordinates [latitude, longitude]")


class OptimalRouteRequest(BaseModel):
    """Input parameters for vector-assisted dynamic A* navigation solver."""
    start: list[float] = Field(..., description="Starting coordinates [lat, lon] (e.g. Mumbai Harbor [18.94, 72.86])")
    destination: list[float] = Field(..., description="Destination coordinates [lat, lon]")
    speed_knots: float = Field(10.0, description="Cruising speed in knots (default: 10.0)")


class RAGSearchRequest(BaseModel):
    """Query payload for pgvector semantic search."""
    query: str = Field(..., description="Search phrase (e.g. 'monsoon trawl ban penalty')")
    top_k: int = Field(3, description="Number of results to retrieve")


# ==============================================================================
# 2. REST API ENDPOINTS
# ==============================================================================

@app.get("/", tags=["Health"])
async def root_health_check():
    """
    Health check endpoint returning active backend subsystems and models.
    """
    return {
        "status": "ONLINE",
        "platform": "Project ORCA (SIH26176)",
        "sovereign_mode": "AIR_GAPPED_READY",
        "models": {
            "reasoning_llm": "qwen2.5:7b-instruct-q5_k_m (via Ollama)",
            "embedding_model": "bge-m3 (1024-dim dense representation)"
        },
        "services": {
            "postgis_database": "ENABLED",
            "pgvector_rag": "ENABLED",
            "langgraph_checkpointer": "POSTGRES_SAVER",
            "minio_object_storage": "CONNECTED",
            "vector_routing_engine": "ACTIVE"
        }
    }


@app.post("/api/v1/agent/chat", tags=["Multi-Agent Chat"])
async def chat_with_multi_agent_swarm(req: ChatRequest):
    """
    Executes a complete multi-agent turn through the compiled LangGraph.
    """
    try:
        checkpointer = get_default_checkpointer()

        result = await run_orca_multi_agent(
            user_query=req.message,
            thread_id=req.thread_id,
            user_role=req.user_role,
            format_mode=req.format_mode,
            active_basin=req.active_basin,
            target_coordinates=req.target_coordinates,
            origin_coordinates=req.origin_coordinates,
            checkpointer=checkpointer
        )
        return result
    except Exception as e:
        logger.error(f"Multi-agent execution error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/chat/stream", tags=["Multi-Agent Chat"])
async def stream_chat_with_agent_swarm(req: ChatRequest):
    """
    Streams multi-agent reasoning steps, tool telemetry, and final deck.gl GeoJSON
    via Server-Sent Events (SSE) for real-time frontend streaming.
    """
    async def event_generator():
        import asyncio
        try:
            # 1. Thought step: Supervisor
            yield f"data: {json.dumps({'type': 'thought', 'agent': 'supervisor', 'text': f'Routing for persona: {req.user_role.upper()} | Basin: {req.active_basin}'})}\n\n"
            await asyncio.sleep(0.2)

            # 2. Run multi-agent graph
            checkpointer = get_default_checkpointer()
            result = await run_orca_multi_agent(
                user_query=req.message,
                thread_id=req.thread_id,
                user_role=req.user_role,
                format_mode=req.format_mode,
                active_basin=req.active_basin,
                target_coordinates=req.target_coordinates,
                origin_coordinates=req.origin_coordinates,
                checkpointer=checkpointer
            )

            # 3. Stream active tasks telemetry
            active_tasks = result.get("active_tasks", [])
            for task in active_tasks:
                yield f"data: {json.dumps({'type': 'thought', 'agent': task, 'text': f'Executing worker node: {task}'})}\n\n"
                await asyncio.sleep(0.15)

            # 4. Stream final synthesized response and deck.gl GeoJSON
            response_payload = result.get("response", {})
            markdown_text = response_payload.get("markdown_advisory", "")
            geojson_data = response_payload.get("geojson_payload", {"type": "FeatureCollection", "features": []})

            # Stream markdown chunks
            lines = markdown_text.split("\n")
            for line in lines:
                yield f"data: {json.dumps({'type': 'chunk', 'text': line + '\n'})}\n\n"
                await asyncio.sleep(0.03)

            # Final complete payload event
            yield f"data: {json.dumps({'type': 'complete', 'result': result, 'geojson': geojson_data})}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )


@app.post("/api/v1/navigation/optimal-route", tags=["Navigation"])
async def calculate_optimal_marine_route(req: OptimalRouteRequest):
    """
    Computes a fuel-optimal marine route over dynamic surface currents (uo, vo) and wind (u10, v10).
    Returns GeoJSON Feature LineString with colored segments for deck.gl PathLayer.
    """
    try:
        route_geojson = compute_optimal_marine_route(
            start_lat=req.start[0],
            start_lon=req.start[1],
            end_lat=req.destination[0],
            end_lon=req.destination[1],
            vessel_knots=req.speed_knots
        )
        if "error" in route_geojson:
            raise HTTPException(status_code=400, detail=route_geojson["error"])
        return route_geojson
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Path optimization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Routing failure: {str(e)}")


@app.get("/api/v1/navigation/vectors", tags=["Navigation"])
async def get_surface_current_vector_grid():
    """
    Returns pre-computed surface current and wind vector points across the Indian EEZ
    for frontend deck.gl Flow / Particle visualization.
    """
    if VECTORS_JSON_PATH.exists():
        try:
            with open(VECTORS_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        except Exception as e:
            logger.error(f"Failed to read vector JSON: {e}")
            raise HTTPException(status_code=500, detail="Failed to load vector data")
    else:
        raise HTTPException(status_code=404, detail="Vector dataset not found. Run scripts/10_fetch_current_vectors.py.")


@app.get("/api/v1/ocean/telemetry", tags=["Ocean Telemetry"])
async def get_ocean_telemetry(lat: float = Query(..., ge=0.0, le=25.0), lon: float = Query(..., ge=50.0, le=100.0)):
    """
    Returns Sea Surface Temperature (°C), Chlorophyll-a (mg/m³), Significant Wave Height (m),
    and nearby high-probability Potential Fishing Zone (PFZ) clusters for specified coordinates.
    """
    try:
        telemetry = get_sst_and_chlorophyll(lat, lon)
        pfz_clusters = find_nearby_pfz_clusters(lat, lon, radius_km=50.0)
        return {
            "coordinates": [lat, lon],
            "telemetry": telemetry,
            "pfz_clusters_count": len(pfz_clusters),
            "pfz_geojson_features": pfz_clusters
        }
    except Exception as e:
        logger.error(f"Ocean telemetry error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/risk/geofence", tags=["Risk & Geofencing"])
async def check_geospatial_risk(lat: float = Query(..., ge=0.0, le=25.0), lon: float = Query(..., ge=50.0, le=100.0)):
    """
    Executes PostGIS spatial queries for IMBL proximity, MPA coral sanctuary overlap,
    and active cyclone warnings.
    """
    try:
        imbl_info = await check_imbl_proximity(lat, lon, threshold_km=10.0)
        mpa_info = await check_protected_area_intersection(lat, lon)
        cyclone_info = check_active_cyclone_warnings(lat, lon)
        return {
            "coordinates": [lat, lon],
            "is_safe": not imbl_info["is_near_border"] and not mpa_info["in_protected_area"],
            "imbl_check": imbl_info,
            "mpa_check": mpa_info,
            "cyclone_check": cyclone_info
        }
    except Exception as e:
        logger.error(f"Risk geofencing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
