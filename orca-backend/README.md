# 🐬 Project ORCA — Backend Data Storage, Memory & RAG Infrastructure (SIH26176)

> **Sovereign, Air-Gappable Multi-Agent Backend Engine**  
> *Combines PostgreSQL 16 + PostGIS 3.4 for mathematical spatial validation, pgvector for dense regulatory semantic search, LangGraph `AsyncPostgresSaver` for persistent session memory, MinIO S3 for scientific raster storage, and FastAPI as the high-throughput asynchronous API gateway.*

---

## 📋 Table of Contents
1. [Backend Architecture](#-backend-architecture)
2. [Directory Structure](#-directory-structure)
3. [The Storage & Memory Layers](#-the-storage--memory-layers)
4. [Prerequisites & Installation](#-prerequisites--installation)
5. [Running with Docker Compose](#-running-with-docker-compose)
6. [API Reference & Endpoints](#-api-reference--endpoints)
7. [LangGraph Persistent Memory Lifecycle](#-langgraph-persistent-memory-lifecycle)
8. [pgvector Policy RAG Schema](#-pgvector-policy-rag-schema)
9. [MinIO S3 Scientific Storage](#-minio-s3-scientific-storage)

---

## 🔍 Backend Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ORCA BACKEND ARCHITECTURE                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. FastAPI Ingress Gateway (/api/v1/query, /api/v1/rag)                                │
│    • High-concurrency async endpoints with Pydantic v2 validation                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. LangGraph Multi-Agent Orchestrator                                                  │
│    • Supervisor (Agent 1) -> Parallel Dispatch:                                        │
│        ├── Ocean Analytics Engine (Agent 2: NetCDF4 / xarray)                          │
│        ├── Geospatial Risk Validator (Agent 3: PostGIS ST_Distance / ST_DWithin)       │
│        └── Policy RAG Specialist (Agent 4: pgvector 768-dim Cosine Similarity)         │
│    • Synthesizer & Localization (Agent 5: Advisory Text + MapLibre/deck.gl GeoJSON)    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. Storage & Memory Subsystems                                                         │
│    • Session Memory: LangGraph AsyncPostgresSaver (checkpoints, blobs, writes)         │
│    • Vector Database: PostgreSQL 16 + pgvector (marine_advisories table)               │
│    • Spatial Geometry: PostgreSQL 16 + PostGIS 3.4 (IMBL lines, EEZ, MPAs, Harbors)    │
│    • Scientific Rasters: MinIO S3 (ocean-rasters, geospatial-vectors, agent-logs)      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```text
orca-backend/
├── Dockerfile                      # Production-grade Python 3.11 container
├── docker-compose.yml              # PostgreSQL PostGIS/pgvector, MinIO, FastAPI services
├── requirements.txt                # Core backend dependencies
├── README.md                       # Complete backend documentation
└── src/
    ├── __init__.py
    ├── main.py                     # FastAPI application & lifespan manager
    ├── database/
    │   ├── __init__.py
    │   ├── connection.py           # Async psycopg_pool connection pool setup
    │   ├── init_schema.sql         # PostGIS & pgvector DDL schema
    │   └── vector_store.py         # pgvector wrapper for embedding insertion/search
    ├── memory/
    │   ├── __init__.py
    │   └── checkpointer.py         # LangGraph AsyncPostgresSaver setup & provisioning
    ├── storage/
    │   ├── __init__.py
    │   └── minio_client.py         # MinIO S3 client wrapper for reading/writing COGs
    └── agent/
        ├── __init__.py
        ├── state.py                # TypedDict for LangGraph state with `add_messages`
        └── graph_builder.py        # 5-agent StateGraph with checkpointer compilation
```

---

## 🧠 The Storage & Memory Layers

### 1. Session Memory (The Checkpointer)
- **Engine:** `AsyncPostgresSaver` (`langgraph-checkpoint-postgres`).
- **Function:** Automatically serializes and saves the multi-agent graph state to PostgreSQL after every node transition.
- **Why it matters:** Enables long-context conversations, multi-turn follow-ups, and human-in-the-loop (HITL) approval workflows without in-memory state loss.
- **Tables provisioned:** `checkpoints`, `checkpoint_blobs`, and `checkpoint_writes`.

### 2. Vector Storage (Policy RAG)
- **Engine:** `pgvector` extension inside PostgreSQL 16.
- **Table:** `marine_advisories` with `embedding VECTOR(768)`.
- **Indexing:** Hierarchical Navigable Small World (`HNSW`) index with Cosine Distance (`vector_cosine_ops`) for sub-millisecond retrieval.

### 3. Scientific File Storage (MinIO S3)
- **Engine:** MinIO S3-compatible Object Storage.
- **Default Buckets:**
  - `ocean-rasters`: Stores Cloud-Optimized GeoTIFFs (`sst_india_latest.tif`, `chlorophyll_india_latest.tif`) and NetCDF rasters.
  - `geospatial-vectors`: Stores processed boundary layers and gazetteers.
  - `agent-logs`: Stores full execution audit trails.

---

## 🚀 Running with Docker Compose

### 1. Start the Complete Stack
From the project root or `orca-backend/`:

```bash
docker compose up -d
```

This starts:
- **PostGIS + pgvector Database:** `localhost:5432`
- **MinIO S3 API:** `localhost:9000`
- **MinIO Web Console:** `http://localhost:9001` (User: `orca_minio_admin`, Password: `orca_minio_secret_2026`)
- **FastAPI Gateway:** `http://localhost:8000` (Docs: `http://localhost:8000/docs`)

### 2. Check Service Logs
```bash
docker compose logs -f backend
```

---

## 💻 Running Locally (Development)

```bash
cd orca-backend

# 1. Create and activate virtualenv
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start FastAPI dev server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📡 API Reference & Endpoints

### 1. Health Check
`GET /`
```json
{
  "project": "Project ORCA (SIH26176)",
  "status": "ONLINE",
  "services": {
    "postgis_database": "ENABLED",
    "pgvector_rag": "ENABLED",
    "langgraph_checkpointer": "POSTGRES_SAVER",
    "minio_object_storage": "CONNECTED"
  }
}
```

### 2. Execute Multi-Agent Query
`POST /api/v1/query`

**Request Body:**
```json
{
  "query": "Can 4 boats go 30km southwest of Veraval tomorrow morning for Tuna?",
  "thread_id": "session-user-12345",
  "language_code": "en"
}
```

**Response Body:**
```json
{
  "thread_id": "session-user-12345",
  "advisory": "Maritime Advisory for Veraval:\n• Sea State: Safe for fishing operations with moderate wave height of 1.3 m and SST at 28.4°C.\n• Potential Fishing Zone (PFZ): Detected Yellowfin Tuna aggregation zone approximately 30 km offshore.\n• Border Safety: You are 45.0 km clear of the nearest International Maritime Boundary Line (IMBL).\n• Regulations: No active seasonal monsoon bans in this sector. Standard safety gear mandatory.",
  "telemetry": {
    "pfz_detected": true,
    "pfz_target_coordinates": [[70.11, 20.70], [70.18, 20.75]],
    "sst_celsius": 28.4,
    "significant_wave_height_m": 1.3,
    "wind_speed_knots": 14.2
  },
  "spatial_risk": {
    "is_safe": true,
    "nearest_imbl_distance_km": 45.0
  },
  "geojson": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "audit_trace": {
    "timestamp": "2026-08-27T16:20:00Z",
    "spatial_risk_sql": "SELECT boundary_id, ST_Distance(...) ...",
    "regulatory_citations": ["Order No. 31035/01/2026-FY"]
  },
  "execution_time_ms": 142
}
```

---

## 🔒 Sovereign & Air-Gapped Compliance

- **Zero External Cloud Lock-In:** All components (PostgreSQL, PostGIS, pgvector, MinIO, LangGraph) run locally or inside sovereign government data centers.
- **National Spatial Data Infrastructure (NSDI) Ready:** Adheres to OGC standards and official Indian maritime coordinates.
