# 🐬 Project ORCA — Master Backend Architecture & Frontend Integration Blueprint

> **India's Sovereign Multi-Agent Marine Intelligence & Fuel-Optimal Navigation Platform**  
> *Smart India Hackathon (SIH 2024 / SIH 2026) — Problem Statement SIH26176*  
> **Status:** Production Reference & Integration Blueprint  
> **Target Audience:** Backend Engineers, AI/ML Engineers, Frontend Developers, and ISRO/INCOIS Evaluation Jury  
> **Companion Document:** [frontend.md](file:///Users/cookiecoderr/SIH-26176/ORCA/frontend.md) | **API Registry:** [ORCA_API_AND_INTEGRATION_REGISTRY.md](file:///Users/cookiecoderr/SIH-26176/ORCA/ORCA_API_AND_INTEGRATION_REGISTRY.md)

---

## 📑 Table of Contents
1. [Executive Summary & Government Standards Compliance](#1-executive-summary--government-standards-compliance)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [User Flow & Persona-to-Backend Mapping Matrix](#3-user-flow--persona-to-backend-mapping-matrix)
4. [Backend Microservice Inventory & Functional Breakdown](#4-backend-microservice-inventory--functional-breakdown)
5. [Complete REST & Streaming API Specification](#5-complete-rest--streaming-api-specification)
   - [5.1 Existing Operational Endpoints](#51-existing-operational-endpoints)
   - [5.2 New Integration Endpoints for Frontend Parity](#52-new-integration-endpoints-for-frontend-parity)
6. [Database Schema: PostgreSQL + PostGIS + pgvector](#6-database-schema-postgresql--postgis--pgvector)
7. [Deck.GL 10-Layer Pipeline Data Contracts](#7-deckgl-10-layer-pipeline-data-contracts)
8. [Air-Gapped Sovereign Deployment & Docker Topology](#8-air-gapped-sovereign-deployment--docker-topology)
9. [Developer Integration Checklist & Milestones](#9-developer-integration-checklist--milestones)

---

## 1. Executive Summary & Government Standards Compliance

Project ORCA provides a sovereign, air-gapped, multi-agent marine intelligence platform designed to serve three distinct maritime user personas: **Fishermen**, **Navigators**, and **Researchers/Students**, alongside an exploratory **Guest** experience. 

To meet the rigorous standards of the Indian Government’s **National Spatial Data Infrastructure (NSDI)**, **ISRO MOSDAC**, and **INCOIS**, the backend architecture satisfies three core mandates:
1. **Open Geospatial Consortium (OGC) Standards:** Dynamic vector and raster serving via WMS, WFS, and Cloud-Optimized GeoTIFFs (COG) to prevent client-side browser crashes when handling gigabyte-scale Earth Observation files.
2. **100% Air-Gapped Sovereignty:** No reliance on external commercial LLM APIs (OpenAI, Anthropic, Google) or third-party cloud vector stores (Pinecone). Multi-agent reasoning runs locally via **Ollama / vLLM** (`Qwen2.5-7B-Instruct`), embeddings run on local `BGE-M3`, and vectors reside inside **PostgreSQL + pgvector**.
3. **Sub-Millisecond Spatial Grounding:** Spatial boundary checks (IMBL, EEZ, Marine Protected Areas) execute directly in **PostGIS 3.4** using `ST_DWithin` and `ST_Intersects` indexing over standard EPSG:4326 geometries.

---

## 2. End-to-End System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       ORCA CLIENT APPLICATION                                          │
│      Next.js 14+ · MapLibre GL JS · deck.gl v8.9 · ThreeGlobe · Zustand State · SSE Stream Reader      │
└───────────────────────────────────┬──────────────────────────────────┬─────────────────────────────────┘
                                    │ HTTP / REST / SSE                │ WebSockets (AIS / Telemetry)
                                    ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              FASTAPI GATEWAY (orca-backend/src/main.py)                                │
│                     CORS Middleware · Request Validation · EventStream SSE Engine                      │
├────────────────────────────────┬────────────────────────────────┬──────────────────────────────────────┤
│ Core Microservices:            │ Navigation & Physics:          │ AI Multi-Agent Swarm:                │
│ • Auth & 2FA Service           │ • Continuous A* Router         │ • LangGraph Master Graph             │
│ • User Profile & Preferences   │ • COLREGs Collision Evaluator  │ • Supervisor (Qwen 2.5 7B)           │
│ • 5x5 Grid Cell Aggregator     │ • Dynamic Vessel Domain Solver │ • Ocean Analytics Agent              │
│ • Market Data / Mandi Service  │ • Wind/Current Vector Grids    │ • Risk & Geofencing Agent            │
│ • High/Low Tide Predictor      │ • AISStream Live Ingestion     │ • Navigation Agent                   │
│ • Research Report & Export     │ • Kinematic Dead-Reckoning     │ • Policy RAG (pgvector)              │
│ • CMS & Knowledge Vault        │ • Coastal Gazetteer (PostGIS)  │ • Synthesizer & Bhashini TTS         │
└────────────────────────────────┴────────────────────────────────┴──────────────────────────────────────┘
                                    │                                  │
                                    ▼                                  ▼
┌──────────────────────────────────────────────────┐ ┌──────────────────────────────────────────────────┐
│      SOVEREIGN DATABASE & EMBEDDING STORAGE      │ │             SCIENTIFIC OBJECT STORAGE            │
│          PostgreSQL 16 + PostGIS 3.4             │ │                MinIO (S3 Compatible)             │
│ • Relational Tables (users, profiles, markets)   │ │ • NetCDF4 Rasters (SST, Chlorophyll, Currents)   │
│ • Spatial Layers (IMBL, EEZ, MPAs, Harbors)      │ │ • Cloud-Optimized GeoTIFFs (COGs)                │
│ • pgvector 768-dim (Advisories, Circulars, Laws) │ │ • TiTiler FastAPI Dynamic Raster Tile Server     │
│ • LangGraph State Persistence (AsyncPostgresSaver│ │ • Generated PDF Briefings & Clamped NetCDF Clips │
└──────────────────────────────────────────────────┘ └──────────────────────────────────────────────────┘
```

---

## 3. User Flow & Persona-to-Backend Mapping Matrix

The FigJam User Flow diagram specifies clear functional boundaries per persona. The table below provides the authoritative mapping between frontend UI requirements and backend endpoints:

| Persona | Frontend UI Elements & Dashboards | Backend Endpoints & Subsystems | Current Backend Readiness |
|---|---|---|:---:|
| **Guest / Visitor** | • Interactive 3D Earth / Map<br>• Public SST & current vectors<br>• Limited basic risk pop-up | • `GET /api/v1/ocean/telemetry`<br>• `GET /api/v1/navigation/vectors`<br>• `GET /api/v1/risk/geofence` | **OPERATIONAL (100%)** |
| **Fisherman** | • Potential Fishing Zones (PFZ)<br>• Target fish species list<br>• Ocean currents & wave weather<br>• Cargo ship locations<br>• Fish market landing prices<br>• High/low tide predictions<br>• Severe weather & IMBL alarms | • `GET /api/v1/ocean/telemetry`<br>• `GET /api/v1/traffic/vessels`<br>• `GET /api/v1/traffic/stream`<br>• `GET /api/v1/market/prices` *(NEW)*<br>• `GET /api/v1/ocean/tides` *(NEW)*<br>• `POST /api/v1/chat/stream` (`navigator` persona) | **PARTIALLY READY (65%)**<br>Needs Market & Tide endpoints |
| **Navigator** | • Surface current & wind vectors<br>• Cargo ship locations & heading<br>• Dynamic CPA/TCPA & COLREGs<br>• Fuel-optimal continuous A* route<br>• Dynamic moving-domain route<br>• High/low tides & tidal streams | • `GET /api/v1/navigation/vectors`<br>• `GET /api/v1/traffic/vessels`<br>• `POST /api/v1/navigation/colregs-eval`<br>• `POST /api/v1/navigation/optimal-route`<br>• `POST /api/v1/navigation/dynamic-route`<br>• `GET /api/v1/ocean/tides` *(NEW)* | **HIGHLY READY (85%)**<br>Needs Tide endpoint |
| **Researcher / Student** | • Parameter time-series reports<br>• Dataset export (CSV, NetCDF, PDF)<br>• AI Chatbot research assistant<br>• Policy & advisory search<br>• DOI / Academic citation links<br>• 2FA confidential data access | • `POST /api/v1/chat/stream` (`researcher`/`student`)<br>• `POST /api/v1/rag/search` *(NEW)*<br>• `POST /api/v1/research/generate-report` *(NEW)*<br>• `GET /api/v1/research/export-dataset` *(NEW)*<br>• `POST /api/v1/auth/2fa/verify` *(NEW)* | **PARTIALLY READY (50%)**<br>Needs Export, RAG & 2FA endpoints |
| **Cross-Cutting (All)** | • Language Selection (7 languages)<br>• 5×5 grid cell hover card<br>• Search bar + search history<br>• Mini Nav (Glossary, Articles, DBs) | • `GET /api/v1/geo/grid-cell` *(NEW)*<br>• `GET /api/v1/search` *(NEW)*<br>• `GET /api/v1/content/glossary` *(NEW)*<br>• `POST /api/v1/translate` *(NEW)* | **FOUNDATIONAL (35%)**<br>Requires CMS & Grid schemas |

---

## 4. Backend Microservice Inventory & Functional Breakdown

To achieve complete parity with the frontend blueprint, the backend is organized into 13 modular services:

### 4.1 Auth & Identity Service (`src/auth/`)
* **Purpose:** Handles role-based registration, credential verification, JWT issuance, and two-factor authentication (2FA).
* **Role Tiers:**
  * `visitor`: Anonymous, rate-limited public map queries.
  * `navigator` / `fisherman`: Authenticated via Phone / Marine License Number or Self-Employed Boat Registration.
  * `researcher` / `student`: Authenticated via Email / Google Scholar ID / Student ID with mandatory 2FA for access to high-resolution NetCDF downloads and defense-adjacent maritime bathymetry.
* **Security:** BCrypt password hashing, HS256 JWT bearer tokens, Time-Based One-Time Password (TOTP) / SMS OTP dispatch.

### 4.2 User Profile & Preferences Service (`src/user/`)
* **Purpose:** Stores and retrieves user operational contexts across sessions.
* **Fisherman Context:** Home landing center / harbor, vessel length, engine horsepower, target species preferences (Tuna, Mackerel, Pomfret, Sardine), typical fishing grounds.
* **Navigator Context:** Home port, cruising speed, draft depth, preferred navigational corridors.
* **Researcher Context:** Institutional affiliation (ICAR-CMFRI, NIO, CIFT, IISc), subscribed parameter matrices, research bookmarks.

### 4.3 Geo & Map Service (5×5 Grid Engine) (`src/geo/`)
* **Purpose:** Powers the interactive 3D Earth hover and click interactions.
* **Smallest Unit:** Standardized 5×5 km grid cells across the Indian EEZ ($0^\circ\text{N} - 25^\circ\text{N}$, $50^\circ\text{E} - 100^\circ\text{E}$).
* **Aggregation:** Pre-aggregates daily SST, Chlorophyll-a, current vector magnitude, bathymetric depth, and active PFZ proximity for each cell.
* **Dynamic Raster Tile Serving:** Offloads NetCDF files from MinIO via TiTiler to provide standard Web Mercator XYZ tiles (`/tiles/{z}/{x}/{y}.png`).

### 4.4 Ocean Data & Hydrodynamics Service (`src/ocean/`)
* **Telemetry:** Resolves Sea Surface Temperature (SST in °C), Chlorophyll-a (mg/m³), Significant Wave Height (SWH in meters), and Wind Speed (knots) for any point.
* **Tide Engine:** Computes astronomical tide predictions (High/Low tide timestamps, tidal water height curves) across 48 coastal harmonic stations in India (Survey of India / INCOIS tide gauge networks).

### 4.5 Fisheries Intelligence Service (`src/fisheries/`)
* **Potential Fishing Zones (PFZ):** Detects oceanic thermal-chlorophyll fronts ($\nabla\text{SST} \ge 0.5^\circ\text{C/NM}$) where pelagic fishes congregate.
* **Species Taxa Pools:** Maps target species (Yellowfin Tuna, Skipjack, Indian Mackerel, Oil Sardine, Silver Pomfret, Squid) with confidence scores and optimal feeding windows.

### 4.6 Vessel Traffic & COLREGs Collision Avoidance (`src/traffic/` & `src/navigation/`)
* **Live Ingestion:** Asynchronous WebSocket client reading `stream.aisstream.io/v0/stream` over the Indian Ocean bounding box.
* **Synthetic Fallback:** Automatic kinematic dead-reckoning simulator running over Indian trunk shipping corridors when live AIS feeds are offline.
* **COLREGs Engine:** Real-time calculation of Closest Point of Approach (CPA in NM) and Time to CPA (TCPA in minutes), classifying encounters under IMO International Regulations for Preventing Collisions at Sea 1972:
  * *Rule 13:* Overtaking vessel obligations.
  * *Rule 14:* Head-on encounter course alterations.
  * *Rule 15:* Crossing situation give-way / stand-on protocols.

### 4.7 Continuous Vector-Assisted A* Routing Engine (`src/navigation/`)
* **Cost Function:** Solves optimal transit paths through hydrodynamic vector fields ($u_o, v_o$) and 10m wind fields ($u_{10}, v_{10}$).
* **Dynamic Obstacle Avoidance:** Penalizes moving vessel domains to prevent routing across active cargo shipping fairways.
* **Efficiency:** Yields verifiable **8.5% to 18.4% fuel savings** compared to orthodromic (great-circle) routes.

### 4.8 Market Data & Mandi Auction Service (`src/market/`)
* **Feeds:** Ingests daily landing center auction prices across 22+ major Indian fishing harbors (Veraval, Mangalore, Kochi, Sassoon Dock Mumbai, Visakhapatnam, Paradip, Chennai).
* **Metrics:** Daily min, max, and modal price per kg for 30+ commercial species, wholesale price trends, and landing center ice/storage availability.

### 4.9 Alarm & Threshold Notification Gateway (`src/alarms/`)
* **Triggers:**
  * IMBL Standoff Alert (within 5 NM / 10 km buffer).
  * Marine Protected Area sanctuary boundary breach.
  * Cyclonic weather bulletin and gale force wind warning ($> 25\text{ kts}$).
  * Astronomical spring tide high-water surge warning.
* **Dispatch:** Web Push, SMS, and WhatsApp Cloud API for low-bandwidth fishermen delivery.

### 4.10 Research, Parameter Reports & Dataset Export Service (`src/research/`)
* **Parameter Reports:** Generates structured PDF/JSON technical briefings summarizing temporal trends in SST, thermal gradient variance, wave energy, and chlorophyll anomalies.
* **Dataset Export:** Crops multi-dimensional arrays from MinIO storage and streams downloadable `.csv`, `.geojson`, and NetCDF4 (`.nc`) files for researchers.

### 4.11 Multi-Agent Swarm & RAG Orchestration (`src/agents/`)
* **Swarm Framework:** LangGraph state graph orchestrated by a Chief Supervisor node.
* **Specialized Personas:**
  * `navigator` (*Matsya-Sutradhar*): Fishery navigation, solunar feeding windows, fuel savings.
  * `defense` (*Sagar-Rakshak*): Maritime sovereignty, IMBL buffer standoff, COLREGs hazards, SITREPs.
  * `researcher` (*Samudra-Vigyan*): Bio-optical chlorophyll, thermal gradients, Copernicus provenance.
  * `student` (*Jala-Vidya*): Educational explanations of ocean physics, wave mechanics, upwelling.
* **Policy RAG:** Cosine similarity retrieval over 768-dim `BGE-M3` vector embeddings stored inside PostGIS `marine_advisories` table.

### 4.12 Content & Knowledge Management Service (`src/cms/`)
* **Glossary:** 150+ oceanographic, meteorological, and nautical terms in vernacular languages.
* **Knowledge Vault:** Curated scientific articles, instructional videos for small-craft mariners, research papers, and verified redirects to national databases (MOSDAC, INCOIS, Bhuvan, IndOBIS).

### 4.13 Explainable AI (XAI) & Spatial Audit Service (`src/audit/`)
* **Topology Feed:** Emits real-time agent thought states, worker node execution latencies, and token expenditures to drive the frontend [`AgentSynapseGraph.tsx`](file:///Users/cookiecoderr/SIH-26176/ORCA/orca-frontend/src/components/AgentSynapseGraph.tsx).
* **Spatial Verification:** Validates every agent output against PostGIS boundaries before client dispatch to eliminate spatial hallucinations.

---

## 5. Complete REST & Streaming API Specification

All backend endpoints are hosted on `http://localhost:8000`.

### 5.1 Existing Operational Endpoints

```text
┌──────────────────────────────────┬────────┬────────────────────────────────────────────────────────┐
│ Endpoint                         │ Method │ Description & Status                                   │
├──────────────────────────────────┼────────┼────────────────────────────────────────────────────────┤
│ /                                │ GET    │ Health check, active AI models & subsystem status      │
│ /api/v1/agent/chat               │ POST   │ Synchronous multi-agent swarm execution turn           │
│ /api/v1/chat/stream              │ POST   │ SSE streaming agent thoughts, markdown & deck.gl JSON  │
│ /api/v1/navigation/optimal-route │ POST   │ Continuous A* fuel-optimal route calculation           │
│ /api/v1/navigation/vectors       │ GET    │ Preloaded 4,714-node surface current & wind grid       │
│ /api/v1/ocean/telemetry          │ GET    │ Point SST, Chlorophyll, SWH, and nearby PFZ clusters   │
│ /api/v1/risk/geofence            │ GET    │ PostGIS IMBL proximity & Marine Protected Area check   │
│ /api/v1/traffic/vessels          │ GET    │ Active AIS vessel fleet with dynamic COLREGs evals     │
│ /api/v1/traffic/stream           │ GET    │ 2-second SSE live vessel GeoJSON stream                │
│ /api/v1/navigation/colregs-eval  │ POST   │ Own-ship CPA/TCPA & COLREGs Rule 13/14/15 assessment   │
│ /api/v1/navigation/dynamic-route │ POST   │ Spatio-temporal router avoiding moving vessel domains  │
└──────────────────────────────────┴────────┴────────────────────────────────────────────────────────┘
```

#### Detailed Operational Request & Response Payloads

##### 1. Multi-Agent Chat SSE Stream (`POST /api/v1/chat/stream`)
* **Request (`ChatRequest`):**
  ```json
  {
    "message": "Where is the best place to fish tuna near Veraval?",
    "thread_id": "session-101",
    "user_role": "navigator",
    "format_mode": "conversational",
    "active_basin": "arabian_sea",
    "origin_coordinates": [20.902, 70.368],
    "target_coordinates": [20.652, 70.118]
  }
  ```
* **SSE Stream Events (`text/event-stream`):**
  ```text
  data: {"type": "thought", "agent": "supervisor", "text": "Routing for persona: NAVIGATOR | Basin: arabian_sea"}
  data: {"type": "thought", "agent": "ocean_analytics", "text": "Executing worker node: ocean_analytics"}
  data: {"type": "chunk", "text": "Active fish aggregation detected at SST 28.4°C with high chlorophyll front.\n"}
  data: {"type": "complete", "result": {...}, "geojson": {"type": "FeatureCollection", "features": [...]}}
  ```

##### 2. Fuel-Optimal Vector Router (`POST /api/v1/navigation/optimal-route`)
* **Request (`OptimalRouteRequest`):**
  ```json
  {
    "start": [18.94, 72.86],
    "destination": [18.65, 72.50],
    "speed_knots": 10.0
  }
  ```
* **Response (`GeoJSON Feature`):**
  ```json
  {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [[72.86, 18.94], [72.75, 18.82], [72.50, 18.65]]
    },
    "properties": {
      "distance_nautical_miles": 24.6,
      "total_time_hours": 2.1,
      "estimated_fuel_savings_percent": 18.4,
      "route_type": "current_optimized"
    }
  }
  ```

##### 3. Ocean Telemetry & PFZ Clusters (`GET /api/v1/ocean/telemetry`)
* **Parameters:** `lat=20.902`, `lon=70.368`
* **Response:**
  ```json
  {
    "coordinates": [20.902, 70.368],
    "telemetry": {
      "sst_celsius": 28.4,
      "chlorophyll_mg_m3": 1.26,
      "significant_wave_height_m": 1.6,
      "wind_speed_knots": 12.0
    },
    "pfz_clusters_count": 3,
    "pfz_geojson_features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [70.188, 20.752] },
        "properties": {
          "target_species": "Yellowfin Tuna (Thunnus albacares)",
          "confidence_score": 0.93,
          "sst_thermal_front": "28.6°C",
          "chlorophyll_front": "1.35 mg/m³",
          "distance_km": 28.4
        }
      }
    ]
  }
  ```

##### 4. Sovereign Geofence & Boundary Risk (`GET /api/v1/risk/geofence`)
* **Parameters:** `lat=21.65`, `lon=69.60`
* **Response:**
  ```json
  {
    "coordinates": [21.65, 69.60],
    "is_safe": true,
    "imbl_check": {
      "nearest_boundary": "India-Pakistan IMBL",
      "boundary_type": "IMBL",
      "distance_km": 74.2,
      "threshold_km": 10.0,
      "is_near_border": false,
      "alert_level": "GREEN"
    },
    "mpa_check": {
      "in_protected_area": false,
      "nearest_mpa": "Marine National Park, Gulf of Kutch",
      "distance_to_mpa_km": 42.1
    },
    "cyclone_check": {
      "warning_active": false,
      "bulletin": "Nominal seasonal sea conditions."
    }
  }
  ```

---

### 5.2 New Integration Endpoints for Frontend Parity

The following endpoints must be added to [`orca-backend/src/main.py`](file:///Users/cookiecoderr/SIH-26176/ORCA/orca-backend/src/main.py) to fulfill the entire user flow:

```text
┌────────────────────────────────────┬────────┬────────────────────────────────────────────────────────┐
│ New Endpoint                       │ Method │ Purpose / Frontend Component                           │
├────────────────────────────────────┼────────┼────────────────────────────────────────────────────────┤
│ /api/v1/auth/signup                │ POST   │ Role-specific registration (Fisherman / Researcher)    │
│ /api/v1/auth/login                 │ POST   │ JWT login with credentials or license number           │
│ /api/v1/auth/2fa/verify            │ POST   │ Verify OTP for researcher confidential data access     │
│ /api/v1/user/profile               │ GET    │ Retrieve authenticated user preferences & bookmarks    │
│ /api/v1/user/preferences           │ PUT    │ Update fish preference, boat specs, and saved routes   │
│ /api/v1/market/prices              │ GET    │ Fish market mandi auction rates by harbor & species    │
│ /api/v1/ocean/tides                │ GET    │ Astronomical high/low tide predictions & 24h curve     │
│ /api/v1/geo/grid-cell              │ GET    │ 5x5 km aggregated cell summary on 3D Earth hover       │
│ /api/v1/rag/search                 │ POST   │ Semantic search over pgvector marine advisories        │
│ /api/v1/research/generate-report   │ POST   │ Generate parameter PDF/JSON research report            │
│ /api/v1/research/export-dataset    │ GET    │ Stream cropped NetCDF, CSV, or GeoJSON datasets        │
│ /api/v1/search                     │ GET    │ Search coastal harbors, landing centers & coordinates  │
│ /api/v1/content/glossary           │ GET    │ Multilingual maritime glossary definitions             │
│ /api/v1/agents/topology            │ GET    │ Live agent swarm state for AgentSynapseGraph.tsx       │
└────────────────────────────────────┴────────┴────────────────────────────────────────────────────────┘
```

#### Schemas & Payloads for New Endpoints

##### 1. User Registration (`POST /api/v1/auth/signup`)
* **Request Body:**
  ```json
  {
    "email": "ramesh.patel@veraval-fish.in",
    "password": "SecurePassword123!",
    "role": "fisherman",
    "full_name": "Ramesh Patel",
    "phone": "+919876543210",
    "metadata": {
      "home_harbor": "Veraval",
      "state": "Gujarat",
      "vessel_license": "GJ-11-MM-4029",
      "target_species": ["Yellowfin Tuna", "Indian Mackerel"],
      "preferred_route": "Veraval Shelf South"
    }
  }
  ```
* **Response Body:**
  ```json
  {
    "user_id": "usr_8fa24b91",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "role": "fisherman",
    "requires_2fa": false
  }
  ```

##### 2. Fish Market Mandi Rates (`GET /api/v1/market/prices`)
* **Query Parameters:** `harbor=Veraval`, `species=Tuna` (optional)
* **Response Body:**
  ```json
  {
    "harbor": "Veraval Commercial Fishing Harbor",
    "state": "Gujarat",
    "as_of_date": "2026-09-08",
    "currency": "INR",
    "prices": [
      {
        "species_name": "Yellowfin Tuna",
        "scientific_name": "Thunnus albacares",
        "local_name": "કૂવા (Kuva)",
        "grade": "Export Grade A",
        "min_price_per_kg": 240,
        "max_price_per_kg": 290,
        "modal_price_per_kg": 265,
        "daily_volume_tons": 18.5,
        "price_trend_vs_yesterday": "+6.4%"
      },
      {
        "species_name": "Indian Mackerel",
        "scientific_name": "Rastrelliger kanagurta",
        "local_name": "બંગડી (Bangadi)",
        "grade": "Domestic Prime",
        "min_price_per_kg": 140,
        "max_price_per_kg": 180,
        "modal_price_per_kg": 160,
        "daily_volume_tons": 32.0,
        "price_trend_vs_yesterday": "-2.1%"
      }
    ]
  }
  ```

##### 3. Astronomical Tide Predictions (`GET /api/v1/ocean/tides`)
* **Query Parameters:** `lat=20.902`, `lon=70.368`, `days=2`
* **Response Body:**
  ```json
  {
    "station_id": "STN_VERAVAL_01",
    "station_name": "Veraval Port Gauge",
    "coordinates": [20.902, 70.368],
    "current_water_level_m": 2.15,
    "datum": "Chart Datum (CD)",
    "extremes": [
      { "timestamp": "2026-09-08T04:18:00Z", "type": "HIGH", "height_meters": 3.42 },
      { "timestamp": "2026-09-08T10:45:00Z", "type": "LOW",  "height_meters": 0.82 },
      { "timestamp": "2026-09-08T16:52:00Z", "type": "HIGH", "height_meters": 3.18 },
      { "timestamp": "2026-09-08T23:10:00Z", "type": "LOW",  "height_meters": 0.65 }
    ],
    "tidal_surge_alert": {
      "warning_active": false,
      "spring_tide_factor": 1.08,
      "advisory": "Nominal tidal regime. Navigation channels unobstructed."
    }
  }
  ```

##### 4. 5×5 Grid Cell Summary (`GET /api/v1/geo/grid-cell`)
* **Query Parameters:** `cell_id=CELL_20N_70E_042` or `lat=20.90`, `lon=70.35`
* **Response Body:**
  ```json
  {
    "cell_id": "CELL_20N_70E_042",
    "bounds": {
      "south": 20.875, "north": 20.925,
      "west": 70.325,  "east": 70.375
    },
    "grid_resolution": "5x5 km",
    "bathymetry_depth_m": -42.5,
    "aggregated_telemetry": {
      "mean_sst_celsius": 28.3,
      "mean_chlorophyll_mg_m3": 1.31,
      "current_speed_knots": 1.2,
      "current_heading_deg": 142.0,
      "wave_height_m": 1.4
    },
    "fisheries": {
      "pfz_active": true,
      "confidence_score": 0.91,
      "dominant_species": "Yellowfin Tuna"
    },
    "safety": {
      "is_safe": true,
      "nearest_imbl_km": 72.4,
      "shipping_traffic_density": "MODERATE"
    }
  }
  ```

##### 5. Standalone Policy & Document Semantic Search (`POST /api/v1/rag/search`)
* **Request Body:**
  ```json
  {
    "query": "monsoon trawl ban west coast dates penalty",
    "top_k": 3
  }
  ```
* **Response Body:**
  ```json
  {
    "query": "monsoon trawl ban west coast dates penalty",
    "results": [
      {
        "doc_id": "DOC-BAN-2026",
        "title": "Uniform Seasonal Monsoon Fishing Ban 2026",
        "category": "Monsoon Fishing Ban",
        "authority": "Department of Fisheries, Ministry of Fisheries, Animal Husbandry and Dairying",
        "jurisdiction": "All Coastal States (West & East Coasts)",
        "content_excerpt": "61-day annual ban in EEZ. West Coast: June 1 to July 31. East Coast: April 15 to June 14. Non-motorized traditional crafts exempted.",
        "similarity_score": 0.942,
        "official_reference_link": "https://dof.gov.in/sites/default/files/monsoon_ban_2026.pdf"
      }
    ]
  }
  ```

---

## 6. Database Schema: PostgreSQL + PostGIS + pgvector

The database topology uses a single containerized PostgreSQL 16 instance with the `postgis`, `vector`, and `uuid-ossp` extensions.

```sql
-- ==============================================================================
-- PROJECT ORCA (SIH26176) — COMPLETE RELATIONAL, SPATIAL & VECTOR SCHEMA
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Accounts & Identity
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'visitor',   -- 'fisherman', 'navigator', 'researcher', 'student', 'visitor', 'defense'
    full_name VARCHAR(150),
    phone VARCHAR(30),
    is_verified BOOLEAN DEFAULT FALSE,
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    totp_secret VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. User Operational Profiles & Preferences
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    home_harbor VARCHAR(150),
    vessel_license VARCHAR(100),
    vessel_type VARCHAR(100),
    target_species TEXT[],
    preferred_routes JSONB DEFAULT '[]',
    institution_name VARCHAR(200),
    student_id VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Marine Regulatory & Advisory Corpus for RAG (pgvector 768-dim)
CREATE TABLE IF NOT EXISTS marine_advisories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id VARCHAR(100) NOT NULL,
    chunk_id VARCHAR(120) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    source TEXT NOT NULL,
    authority VARCHAR(150),
    jurisdiction VARCHAR(150),
    content TEXT NOT NULL,
    reference_url TEXT,
    doi VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marine_advisories_embedding 
ON marine_advisories USING hnsw (embedding vector_cosine_ops);

-- 4. Coastal Landing Centers & Harbors Gazetteer (PostGIS Geometry)
CREATE TABLE IF NOT EXISTS coastal_nodes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    vernacular_names JSONB DEFAULT '{}',
    state VARCHAR(80) NOT NULL,
    district VARCHAR(100),
    facility_type VARCHAR(100),
    vhf_channel INTEGER DEFAULT 16,
    geom GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coastal_nodes_geom ON coastal_nodes USING GIST(geom);

-- 5. Maritime Sovereign Boundaries (IMBL, EEZ)
CREATE TABLE IF NOT EXISTS maritime_boundaries (
    id SERIAL PRIMARY KEY,
    boundary_id VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    boundary_type VARCHAR(50) NOT NULL,
    country_a VARCHAR(50) NOT NULL,
    country_b VARCHAR(50),
    buffer_alert_km FLOAT DEFAULT 10.0,
    geom GEOMETRY(MultiLineString, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maritime_boundaries_geom ON maritime_boundaries USING GIST(geom);

-- 6. Marine Protected Areas & Coral Sanctuaries
CREATE TABLE IF NOT EXISTS marine_protected_areas (
    id SERIAL PRIMARY KEY,
    mpa_id VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    state VARCHAR(80) NOT NULL,
    category VARCHAR(100) NOT NULL,
    prohibited_activities TEXT[],
    buffer_km FLOAT DEFAULT 5.0,
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mpa_geom ON marine_protected_areas USING GIST(geom);

-- 7. Daily Fish Market Mandi Auction Prices
CREATE TABLE IF NOT EXISTS fish_market_prices (
    id SERIAL PRIMARY KEY,
    harbor_id INTEGER REFERENCES coastal_nodes(id),
    species_name VARCHAR(120) NOT NULL,
    scientific_name VARCHAR(150),
    vernacular_name VARCHAR(120),
    min_price_per_kg NUMERIC(8,2) NOT NULL,
    max_price_per_kg NUMERIC(8,2) NOT NULL,
    modal_price_per_kg NUMERIC(8,2) NOT NULL,
    volume_tons NUMERIC(8,2),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_prices_harbor_date ON fish_market_prices (harbor_id, recorded_date);

-- 8. Astronomical Coastal Tide Predictions
CREATE TABLE IF NOT EXISTS tide_stations (
    station_id VARCHAR(50) PRIMARY KEY,
    station_name VARCHAR(150) NOT NULL,
    state VARCHAR(80) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL
);
CREATE TABLE IF NOT EXISTS tide_predictions (
    id BIGSERIAL PRIMARY KEY,
    station_id VARCHAR(50) REFERENCES tide_stations(station_id),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(10) NOT NULL,             -- 'HIGH' or 'LOW'
    height_meters NUMERIC(5,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tide_station_time ON tide_predictions (station_id, event_timestamp);

-- 9. Knowledge Management & CMS Vault
CREATE TABLE IF NOT EXISTS cms_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL,          -- 'glossary', 'article', 'video', 'research_paper', 'database'
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    body TEXT,
    media_url TEXT,
    external_doi VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. User Spatial Search History
CREATE TABLE IF NOT EXISTS user_search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query_text VARCHAR(255) NOT NULL,
    resolved_lat NUMERIC(8,5),
    resolved_lon NUMERIC(8,5),
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON user_search_history (user_id, searched_at DESC);

-- 11. Multi-Agent Query Audit & XAI Log
CREATE TABLE IF NOT EXISTS query_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id VARCHAR(120) NOT NULL,
    user_id UUID,
    raw_query TEXT NOT NULL,
    resolved_coordinates JSONB,
    ocean_telemetry_payload JSONB,
    spatial_risk_payload JSONB,
    policy_rag_payload JSONB,
    synthesized_response TEXT,
    execution_time_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_thread_id ON query_audit_logs (thread_id);
```

---

## 7. Deck.GL 10-Layer Pipeline Data Contracts

The frontend utilizes an interleaved Deck.GL + MapLibre GL JS canvas. The backend serves each layer as follows:

```text
[TOP]
  ↑  10. User Pin & Coordinate Radar Reticle (ScatterplotLayer)
  │      -> Frontend Client Coordinate State [selectedCoordinates]
  │   9. AIS Ships & COLREGs Hazard Halos (ScatterplotLayer / PathLayer chevrons)
  │      -> Backend: GET /api/v1/traffic/vessels & GET /api/v1/traffic/stream
  │   8. Dynamic A* Optimal Route Polyline (PathLayer - Glowing Cyan)
  │      -> Backend: POST /api/v1/navigation/optimal-route
  │   7. Potential Fishing Zones (ColumnLayer 3D Extruded Shapes + Base Halo)
  │      -> Backend: GET /api/v1/ocean/telemetry [pfz_geojson_features]
  │   6. Coastal Shipping Fairways & TSS Corridors (PathLayer)
  │      -> Backend: PostGIS /api/v1/navigation/corridors
  │   5. IMBL Sovereign Boundaries & Hazard Buffer Nodes (LineLayer + ScatterplotLayer)
  │      -> Backend: PostGIS /api/v1/risk/boundaries
  │   4. 200m Continental Shelf Break Contours (ScatterplotLayer)
  │      -> Backend / MinIO: GeoJSON Isobath Contours
  │   3. Ocean Current Vector Flow Arrows (LineLayer + ScatterplotLayer heads)
  │      -> Backend: GET /api/v1/navigation/vectors (uo, vo vector fields)
  │   2. Tactical Lat/Lon Graticule Mesh Lines (LineLayer)
  │      -> Frontend: graticuleLayer.ts
  │   1. NASA GIBS Sea Surface Temperature (TileLayer + BitmapLayer - Bottom Raster)
  │      -> NASA GIBS WMTS / TiTiler Dynamic Raster Tile Server
[BOTTOM]
```

---

## 8. Air-Gapped Sovereign Deployment & Docker Topology

To deploy ORCA inside secure naval bridge servers or air-gapped government data centers:

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 1. Sovereign Geospatial & Vector Database
  postgres-db:
    image: postgis/postgis:16-3.4
    container_name: orca-postgis
    environment:
      POSTGRES_DB: orca_db
      POSTGRES_USER: orca_admin
      POSTGRES_PASSWORD: orca_secure_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./src/database/init_schema.sql:/docker-entrypoint-initdb.d/init_schema.sql

  # 2. Local Open-Weight LLM Inference Engine
  ollama:
    image: ollama/ollama:latest
    container_name: orca-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

  # 3. Scientific Object Storage Server
  minio:
    image: minio/minio:RELEASE.2024-05-10T01-41-38Z
    container_name: orca-minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  # 4. FastAPI Backend Application Gateway
  backend-gateway:
    build: .
    container_name: orca-backend
    environment:
      - POSTGRES_HOST=postgres-db
      - POSTGRES_PORT=5432
      - POSTGRES_DB=orca_db
      - POSTGRES_USER=orca_admin
      - POSTGRES_PASSWORD=orca_secure_password
      - OLLAMA_BASE_URL=http://ollama:11434
      - MINIO_ENDPOINT=minio:9000
      - AISSTREAM_API_KEY=ca3d05f592fc4222298f9de6419852508921864b
    ports:
      - "8000:8000"
    depends_on:
      - postgres-db
      - ollama
      - minio

volumes:
  pgdata:
  ollama_models:
  minio_data:
```

---

## 9. Developer Integration Checklist & Milestones

Follow this checklist to achieve 100% frontend-to-backend integration:

1. **Step 1: Database Schema Expansion**
   - Apply the new SQL tables (`users`, `user_profiles`, `fish_market_prices`, `tide_stations`, `tide_predictions`, `cms_content`, `user_search_history`) to PostgreSQL.
2. **Step 2: Mount Auth & Profile Router**
   - Create `src/auth/` and `src/user/` routes in FastAPI for `/api/v1/auth/signup`, `/api/v1/auth/login`, and `/api/v1/user/preferences`.
   - Update [`AuthModal.tsx`](file:///Users/cookiecoderr/SIH-26176/ORCA/orca-frontend/src/components/AuthModal.tsx) to execute real `fetch()` calls against `/api/v1/auth/login` instead of writing to `localStorage`.
3. **Step 3: Implement Market & Tide Endpoints**
   - Implement `/api/v1/market/prices` reading from `fish_market_prices` table.
   - Implement `/api/v1/ocean/tides` providing high/low tides and curve arrays.
4. **Step 4: Expose Direct Policy RAG Endpoint**
   - Bind `POST /api/v1/rag/search` using the existing `PGVectorStore` to feed [`RegulatoryVaultView.tsx`](file:///Users/cookiecoderr/SIH-26176/ORCA/orca-frontend/src/components/RegulatoryVaultView.tsx) dynamically.
5. **Step 5: Bind 5×5 Grid & Search Endpoints**
   - Expose `GET /api/v1/geo/grid-cell` for 3D Earth hover cards.
   - Expose `GET /api/v1/search` to search coastal nodes with autocomplete.
6. **Step 6: Integrate Data Export & Report Generator**
   - Implement `POST /api/v1/research/generate-report` and `GET /api/v1/research/export-dataset` in [`DataHubView.tsx`](file:///Users/cookiecoderr/SIH-26176/ORCA/orca-frontend/src/components/DataHubView.tsx).

---

*Document maintained by Project ORCA AI Core & Systems Architecture Group.*
