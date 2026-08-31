# 🐬 Project ORCA — Master API, Tokens, Endpoints & Integration Registry

> **Status:** Production Reference Document  
> **Target Audience:** Frontend/UI Engineers, Backend Engineers, and AI Subagents building the new ORCA UI.  
> **Purpose:** A single, consolidated reference containing all API keys, external data providers, FastAPI backend endpoints, multi-agent persona prompts, frontend services, and deck.gl layer pipelines. Use this document to easily wire up the new UI without costly back-and-forth token exploration.

---

## 📑 Table of Contents
1. [Environment Variables & Authentication Tokens](#1-environment-variables--authentication-tokens)
2. [External Feeds & Satellite Raster Tile Providers](#2-external-feeds--satellite-raster-tile-providers)
3. [Backend REST & Streaming API Endpoints](#3-backend-rest--streaming-api-endpoints)
4. [Multi-Agent Personas & System Prompts](#4-multi-agent-personas--system-prompts)
5. [Frontend TypeScript Data Services & Utility Functions](#5-frontend-typescript-data-services--utility-functions)
6. [Deck.GL Layer Pipeline & Z-Index Ordering](#6-deckgl-layer-pipeline--z-index-ordering)
7. [New UI Integration Blueprint](#7-new-ui-integration-blueprint)

---

## 1. Environment Variables & Authentication Tokens

### A. Frontend Environment (`orca-frontend/.env.local`)
| Variable | Description | Current Configured Value / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE` | FastAPI Backend URL | `http://localhost:8000` |
| `NEXT_PUBLIC_AIS_API_KEY` | AISStream.io WebSocket Key | `ca3d05f592fc4222298f9de6419852508921864b` |
| `NEXT_PUBLIC_CARTO_API_KEY` | CARTO / MapLibre Basemap Key | `cb1_2dhp_1_9403bbcac732699b29121f7e` |

### B. Backend Environment (`orca-backend/.env`)
| Variable | Description | Value |
| :--- | :--- | :--- |
| `AISSTREAM_API_KEY` | AISStream.io real-time ingestion | `ca3d05f592fc4222298f9de6419852508921864b` |
| `POSTGRES_USER` | PostgreSQL User | `orca_admin` |
| `POSTGRES_PASSWORD` | PostgreSQL Password | `orca_secure_password` |
| `POSTGRES_DB` | PostGIS / pgvector DB | `orca_db` |
| `POSTGRES_HOST` | Database Host | `localhost` |
| `POSTGRES_PORT` | Database Port | `5432` |
| `MINIO_ENDPOINT` | Object Storage Host | `localhost:9000` |
| `MINIO_ACCESS_KEY` | MinIO Access Key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO Secret Key | `minioadmin` |

---

## 2. External Feeds & Satellite Raster Tile Providers

### A. NASA GIBS Sea Surface Temperature (WMTS XYZ Tiles)
- **Layer Name:** `GHRSST_L4_MUR_Sea_Surface_Temperature`
- **URL Template:**
  ```text
  https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/2024-05-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png
  ```
- **Zoom Extents:** `minZoom: 0`, `maxZoom: 7`, `tileSize: 256`
- **Recommended Opacity:** `0.55` (allows bathymetry to show underneath)

### B. Real-Time Marine Weather & Surface Currents API (Open-Meteo)
- **Base Endpoint:** `https://marine-api.open-meteo.com/v1/marine`
- **Parameters:**
  ```text
  ?latitude={lat}&longitude={lon}&hourly=wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction,wind_wave_height
  ```
- **Companion Meteorological Endpoint:** `https://api.open-meteo.com/v1/forecast`
  ```text
  ?latitude={lat}&longitude={lon}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m
  ```

### C. AISStream.io WebSocket Live Vessel Feed
- **WebSocket Endpoint:** `wss://stream.aisstream.io/v0/stream`
- **Subscription Payload:**
  ```json
  {
    "APIKey": "ca3d05f592fc4222298f9de6419852508921864b",
    "BoundingBoxes": [
      [[4.0, 65.0], [26.0, 95.0]]
    ],
    "FilterMessageTypes": ["PositionReport", "ShipStaticData"]
  }
  ```

### D. MapLibre / CARTO Basemap Styles
- **Dark Matter (Industrial/Defense Default):** `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`
- **Positron (Clean Light/Research):** `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- **Voyager (Nautical Hybrid):** `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`
- **Terrarium DEM (3D Bathymetry Elevation):** `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`

---

## 3. Backend REST & Streaming API Endpoints

All endpoints run on `http://localhost:8000`.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ FastAPI Gateway (orca-backend/src/main.py)                                             │
├────────────────────────────────┬────────┬──────────────────────────────────────────────┤
│ Endpoint                       │ Method │ Purpose                                      │
├────────────────────────────────┼────────┼──────────────────────────────────────────────┤
│ /                              │ GET    │ Health check & active subsystem status       │
│ /api/v1/agent/chat             │ POST   │ Multi-agent execution turn (synchronous)     │
│ /api/v1/chat/stream            │ POST   │ Multi-agent SSE streaming (thoughts + output)│
│ /api/v1/navigation/optimal-route│ POST  │ Dynamic A* vector-assisted route calculation │
│ /api/v1/navigation/vectors     │ GET    │ Preloaded surface current & wind vector grid │
│ /api/v1/ocean/telemetry        │ GET    │ SST, Chlorophyll-a, and PFZ cluster finder   │
│ /api/v1/risk/geofence          │ GET    │ PostGIS IMBL proximity & Marine Park check   │
│ /api/v1/traffic/vessels        │ GET    │ Active AIS fleet with dynamic COLREGs evals  │
│ /api/v1/traffic/stream         │ GET    │ Live 2-second SSE vessel GeoJSON updates     │
│ /api/v1/navigation/colregs-eval│ POST   │ CPA/TCPA & COLREGs Rule 13/14/15 evaluator   │
│ /api/v1/navigation/dynamic-route│ POST  │ COLREGs dynamic moving-domain router         │
└────────────────────────────────┴────────┴──────────────────────────────────────────────┘
```

---

### Endpoint Schemas & Payloads

#### 1. Multi-Agent Chat Stream (`POST /api/v1/chat/stream`)
**Request Body (`ChatRequest`):**
```json
{
  "message": "Where is the best place to fish tuna near Veraval?",
  "thread_id": "session-101",
  "user_role": "navigator",       // Options: 'navigator', 'defense', 'researcher', 'student'
  "format_mode": "conversational",// Options: 'conversational' (short/concise), 'report' (formal advisory)
  "active_basin": "arabian_sea",  // Options: 'arabian_sea', 'bay_of_bengal', 'lakshadweep', 'andaman'
  "origin_coordinates": [20.902, 70.368],
  "target_coordinates": [20.652, 70.118]
}
```
**SSE Output Events (`text/event-stream`):**
- `data: {"type": "thought", "agent": "supervisor", "text": "Routing for persona: NAVIGATOR"}`
- `data: {"type": "chunk", "text": "Active fish aggregation detected at SST 28.4°C...\n"}`
- `data: {"type": "complete", "result": {...}, "geojson": {"type": "FeatureCollection", "features": [...]}}`

---

#### 2. Vector-Assisted Route Planner (`POST /api/v1/navigation/optimal-route`)
**Request Body (`OptimalRouteRequest`):**
```json
{
  "start": [18.94, 72.86],
  "destination": [18.65, 72.50],
  "speed_knots": 10.0
}
```
**Response Body (`GeoJSON Feature`):**
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

---

#### 3. Ocean Telemetry & PFZ Clusters (`GET /api/v1/ocean/telemetry`)
**Query Parameters:**
- `lat`: `20.902` (0.0 to 25.0)
- `lon`: `70.368` (50.0 to 100.0)

**Response Body:**
```json
{
  "coordinates": [20.902, 70.368],
  "telemetry": {
    "sst_celsius": 28.4,
    "chlorophyll_mg_m3": 1.26,
    "wave_height_m": 1.6,
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

---

#### 4. Sovereign Geofencing & Risk Audit (`GET /api/v1/risk/geofence`)
**Query Parameters:**
- `lat`: `21.65`
- `lon`: `69.60`

**Response Body:**
```json
{
  "coordinates": [21.65, 69.60],
  "is_safe": true,
  "imbl_check": {
    "is_near_border": false,
    "distance_to_imbl_km": 74.2,
    "nearest_boundary": "India-Pakistan IMBL",
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

#### 5. Live AIS Vessel Traffic & COLREGs Evaluator (`GET /api/v1/traffic/vessels`)
**Query Parameters (Optional for relative own-ship CPA):**
- `lat`: `18.92` (Own ship lat)
- `lon`: `72.82` (Own ship lon)
- `own_sog`: `10.0`
- `own_cog`: `220.0`
- `radius_nm`: `50.0`

**Response Body (`FeatureCollection`):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [72.45, 18.60] },
      "properties": {
        "mmsi": 419001004,
        "name": "MV MAERSK BHARAT",
        "ship_type": "Cargo",
        "sog_knots": 14.2,
        "cog_deg": 165.0,
        "flag": "IND",
        "cpa_nm": 1.4,
        "tcpa_minutes": 16.8,
        "risk_level": "CAUTION",
        "colregs_encounter": "CROSSING_GIVE_WAY",
        "colregs_rule": "Rule 15 (Crossing - Give-Way Vessel)",
        "recommended_action": "Alter course to Starboard to pass astern."
      }
    }
  ],
  "metadata": {
    "count": 24,
    "is_live_stream": true,
    "is_synthetic_fallback": false
  }
}
```

---

## 4. Multi-Agent Personas & System Prompts

| Persona Code | Role Name | Agent Call-Sign | Primary Focus |
| :--- | :--- | :--- | :--- |
| `navigator` | Commercial Fisher / Navigator | **ORCA-Fisher** (*Matsya-Sutradhar*) | Catch chance, optimal feeding windows, fuel savings, simple language |
| `defense` | Coast Guard / Law Enforcement | **ORCA-Tactical** (*Sagar-Rakshak*) | Zero-ambiguity SITREPs, IMBL standoff, TPI, COLREGs hazards, VHF 16 hail |
| `researcher` | Oceanographer / CMFRI Researcher | **ORCA-Scholar** (*Samudra-Vigyan*) | NetCDF4 profiles, $\nabla\text{SST}$, trophic HSI index, IndOBIS species taxa |
| `student` | Student / Maritime Learner | **ORCA-Student** (*Jala-Vidya*) | Educational explanations of upwelling, wave mechanics, EEZ sovereignty |

---

## 5. Frontend TypeScript Data Services & Utility Functions

All found in `orca-frontend/src/lib/`:

### A. `oceanDataService.ts`
- `fetchOceanData()`: Reads Open-Meteo across 24 Indian EEZ grid nodes and returns:
  - `weatherPoints: WeatherPoint[]` (SST, SWH, Wind, Pressure)
  - `currentVectors: CurrentVector[]` (Source/Target flow vectors with $u_o, v_o$)
  - `pfzPoints: PFZPoint[]` (High-confidence Potential Fishing Zones with rich 7-region species pools)
- `PFZPoint` Schema:
  ```typescript
  interface PFZPoint {
    name: string;
    position: [number, number]; // [lon, lat]
    zone: "arabian_sea" | "bay_of_bengal";
    species: string;
    speciesList: { name: string; sciName: string; confidence: number }[];
    confidence: number;
    sst: number;
    chlorophyll: number;
    waveHeight: number;
    thermalGradient: string;
    feedingWindow: string;
    distanceOffshoreKm: number;
    depthMeters: number;
  }
  ```

### B. `aisStream.ts`
- `connectAisStream(apiKey, onVesselsUpdate)`: Connects to live AISStream.io WebSocket or activates seamless local kinematic dead-reckoning fallback.
- `tickSimVessels(deltaSeconds)`: Updates moving vessel kinematics along Indian trunk shipping lanes.
- `computeClientColregs(ownLat, ownLon, ownSog, ownCog, targetVessel)`: Returns client-side CPA, TCPA, and COLREGs Rule 13/14/15 encounter classification.

### C. `graticuleLayer.ts`
- `buildGraticuleLines()`: Generates tactical latitude/longitude nautical grid lines every $2^\circ$ across the Indian Ocean basin with labeled equatorial and boundary highlights.

---

## 6. Deck.GL Layer Pipeline & Z-Index Ordering

When rendering Deck.GL layers on the map, ensure they are placed in this exact order:

```text
[TOP]
  ↑  10. User Pin & Coordinate Radar Reticle (ScatterplotLayer)
  │   9. AIS Ships & COLREGs Hazard Halos (ScatterplotLayer / PathLayer chevrons)
  │   8. Dynamic A* Optimal Route Polyline (PathLayer - Glowing Cyan)
  │   7. Potential Fishing Zones (ColumnLayer 3D Extruded Shapes + Base Halo)
  │   6. Coastal Shipping Fairways & TSS Corridors (PathLayer)
  │   5. IMBL Sovereign Boundaries & Hazard Buffer Nodes (LineLayer + ScatterplotLayer)
  │   4. 200m Continental Shelf Break Contours (ScatterplotLayer)
  │   3. Ocean Current Vector Flow Arrows (LineLayer + ScatterplotLayer heads)
  │   2. Tactical Lat/Lon Graticule Mesh Lines (LineLayer)
  │   1. NASA GIBS Sea Surface Temperature (TileLayer + BitmapLayer - Bottom Raster)
[BOTTOM]
```

---

## 7. New UI Integration Blueprint

When creating the clean, state-of-the-art UI:
1. **Connect State Store / Hooks**: Use `fetchOceanData()` on initial mount to populate ocean telemetry, PFZs, and flow vectors.
2. **Mount WebSocket Feed**: Use `connectAisStream(process.env.NEXT_PUBLIC_AIS_API_KEY, setVessels)` for live ships.
3. **Map Canvas Component**: Use `<DeckGL>` wrapping `<Map>` from `react-map-gl/maplibre` with Dark Matter basemap style and NASA GIBS `TileLayer`.
4. **Chat & Copilot Component**: Connect to `/api/v1/chat/stream` via `EventSource` / `fetch` streaming reader to display agent thoughts and render responses in markdown with persona styling.
5. **Interactive Telemetry Component**: Bind clicked map coordinates to `/api/v1/ocean/telemetry` and `/api/v1/risk/geofence`.

---
*Document maintained by Project ORCA AI Core.*
