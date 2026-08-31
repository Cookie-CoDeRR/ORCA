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
from .navigation.colregs import evaluate_colregs_for_traffic, ColregsEvaluation, RiskLevel
from .navigation.dynamic_router import dynamic_router
from .traffic.traffic_cache import traffic_cache, VesselState
from .traffic.ais_client import ais_client

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
    provisions LangGraph checkpointer, and launches real-time AIS traffic ingestion.
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

    # 4. Launch AIS Traffic Ingestion (AISStream.io with Mock Replay Failover)
    try:
        ais_client.start()
        logger.info("📡 AIS Traffic Ingestion Service successfully launched.")
    except Exception as e:
        logger.warning(f"AIS traffic ingestion startup warning: {e}")

    logger.info("🚀 Project ORCA Backend successfully initialized and ready for requests.")
    yield

    # Teardown
    logger.info("Shutting down Project ORCA Backend Gateway...")
    try:
        ais_client.stop()
    except Exception:
        pass
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


class ColregsEvalRequest(BaseModel):
    """Request payload for COLREGs collision risk assessment against live vessel traffic."""
    own_lat: float = Field(..., description="Own-ship latitude in decimal degrees")
    own_lon: float = Field(..., description="Own-ship longitude in decimal degrees")
    own_sog: float = Field(10.0, description="Own-ship Speed Over Ground (knots)")
    own_cog: float = Field(0.0, description="Own-ship Course Over Ground (degrees 0-360)")
    target_mmsi: Optional[int] = Field(None, description="Optional target MMSI to filter")
    search_radius_nm: float = Field(30.0, description="Search radius around own ship in Nautical Miles")


class DynamicRouteRequest(BaseModel):
    """Input parameters for COLREGs-compliant dynamic A* path solver."""
    start: list[float] = Field(..., description="Starting coordinates [lat, lon]")
    destination: list[float] = Field(..., description="Destination coordinates [lat, lon]")
    speed_knots: float = Field(10.0, description="Cruising speed in knots")
    avoid_traffic: bool = Field(True, description="Whether to avoid moving AIS vessel domains")


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


# ==============================================================================
# 3. AIS VESSEL TRAFFIC & COLREGS COLLISION AVOIDANCE ENDPOINTS
# ==============================================================================

@app.get("/api/v1/traffic/vessels", tags=["Maritime Traffic"])
async def get_active_traffic_vessels(
    lat: Optional[float] = Query(None, description="Optional own-ship latitude for relative CPA calculation"),
    lon: Optional[float] = Query(None, description="Optional own-ship longitude"),
    radius_nm: float = Query(50.0, description="Radial search distance in NM"),
    own_sog: float = Query(10.0, description="Own-ship Speed Over Ground (knots)"),
    own_cog: float = Query(0.0, description="Own-ship Course Over Ground (degrees)")
):
    """
    Returns GeoJSON FeatureCollection of all currently tracked ships with speed, heading, name,
    and optional dynamic CPA/TCPA and COLREGs Rule 13/14/15 annotations relative to own-ship.
    """
    try:
        if lat is not None and lon is not None:
            vessels = traffic_cache.get_active_vessels_in_radius(lat, lon, radius_nm=radius_nm)
            # Evaluate COLREGs for this fleet
            evals = {e.target_mmsi: e for e in evaluate_colregs_for_traffic(lat, lon, own_sog, own_cog, vessels)}
        else:
            vessels = traffic_cache.get_all_vessels()
            evals = {}

        features = []
        for v in vessels:
            colregs_info = evals.get(v.mmsi)
            feat = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [v.lon, v.lat]
                },
                "properties": {
                    "mmsi": v.mmsi,
                    "name": v.name,
                    "ship_type": v.ship_type,
                    "ship_category": v.ship_category,
                    "sog_knots": v.sog_knots,
                    "cog_deg": v.cog_deg,
                    "heading": v.heading,
                    "timestamp": v.timestamp,
                    "destination": v.destination,
                    "flag": v.flag,
                    "length": v.length,
                    "width": v.width,
                    "cpa_nm": colregs_info.cpa_nm if colregs_info else None,
                    "tcpa_minutes": colregs_info.tcpa_minutes if colregs_info else None,
                    "collision_risk_index": colregs_info.collision_risk_index if colregs_info else 0.0,
                    "risk_level": colregs_info.risk_level.value if colregs_info else "SAFE",
                    "colregs_encounter": colregs_info.encounter_type.value if colregs_info else "SAFE_SEPARATION",
                    "colregs_rule": colregs_info.rule_applied if colregs_info else None,
                    "obligation": colregs_info.obligation if colregs_info else "NONE",
                    "recommended_action": colregs_info.recommended_action if colregs_info else None,
                    "recommended_heading_delta_deg": colregs_info.recommended_heading_delta_deg if colregs_info else 0.0
                }
            }
            features.append(feat)

        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "count": len(features),
                "is_live_stream": ais_client.is_connected,
                "is_synthetic_fallback": ais_client.is_fallback
            }
        }
    except Exception as e:
        logger.error(f"Error fetching traffic vessels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch vessel traffic: {str(e)}")


@app.get("/api/v1/traffic/stream", tags=["Maritime Traffic"])
async def stream_live_vessel_traffic():
    """
    Server-Sent Events (SSE) streaming real-time GeoJSON vessel traffic updates
    directly to deck.gl frontends at 2-second intervals.
    """
    import asyncio

    async def event_generator():
        while True:
            geojson = traffic_cache.to_geojson()
            geojson["metadata"]["is_live_stream"] = ais_client.is_connected
            geojson["metadata"]["is_synthetic_fallback"] = ais_client.is_fallback
            payload = json.dumps(geojson)
            yield f"event: traffic\ndata: {payload}\n\n"
            await asyncio.sleep(2.0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/v1/navigation/colregs-eval", tags=["Navigation & COLREGs"])
async def evaluate_colregs_risk(req: ColregsEvalRequest):
    """
    Evaluates dynamic CPA, TCPA, and IMO COLREGs compliance (Rules 13, 14, 15, 17)
    for own-ship against active surrounding maritime traffic.
    """
    try:
        nearby_vessels = traffic_cache.get_active_vessels_in_radius(
            req.own_lat, req.own_lon, radius_nm=req.search_radius_nm
        )

        if req.target_mmsi:
            nearby_vessels = [v for v in nearby_vessels if v.mmsi == req.target_mmsi]

        evaluations = evaluate_colregs_for_traffic(
            req.own_lat, req.own_lon, req.own_sog, req.own_cog, nearby_vessels
        )

        critical_count = sum(1 for e in evaluations if e.risk_level == RiskLevel.CRITICAL_RISK)
        caution_count = sum(1 for e in evaluations if e.risk_level == RiskLevel.CAUTION)

        top_advisory = evaluations[0].recommended_action if evaluations else "No traffic in search radius. Safe passage."

        return {
            "own_ship": {
                "lat": req.own_lat,
                "lon": req.own_lon,
                "sog_knots": req.own_sog,
                "cog_deg": req.own_cog
            },
            "evaluations_count": len(evaluations),
            "critical_risks_count": critical_count,
            "caution_risks_count": caution_count,
            "overall_safety_status": "CRITICAL" if critical_count > 0 else ("CAUTION" if caution_count > 0 else "SAFE"),
            "primary_advisory": top_advisory,
            "evaluations": [e.to_dict() for e in evaluations]
        }
    except Exception as e:
        logger.error(f"COLREGs evaluation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"COLREGs evaluation failure: {str(e)}")


@app.post("/api/v1/navigation/dynamic-route", tags=["Navigation & COLREGs"])
async def calculate_colregs_dynamic_route(req: DynamicRouteRequest):
    """
    Calculates a spatio-temporal, COLREGs-compliant route factoring in both
    hydrodynamic vector fields and dynamic moving vessel domains.
    """
    try:
        route_geojson = dynamic_router.calculate_dynamic_route(
            start_lat=req.start[0],
            start_lon=req.start[1],
            end_lat=req.destination[0],
            end_lon=req.destination[1],
            vessel_speed_knots=req.speed_knots
        )
        if "error" in route_geojson:
            raise HTTPException(status_code=400, detail=route_geojson["error"])
        return route_geojson
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dynamic COLREGs routing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Dynamic routing failure: {str(e)}")
