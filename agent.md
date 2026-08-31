To design a robust, jury-winning architecture for **Project ORCA (SIH26176)**, you must follow a core engineering principle: **Only use LLMs where semantic reasoning or language synthesis is required; use deterministic code (Python/PostGIS) for numerical and spatial calculations.**

Using an LLM for geometric calculations or raw array parsing causes hallucinations and slows down response times. Deterministic tools provide exact, sub-second results at zero token cost.

---

## Agent Architecture Overview: LLM vs. Deterministic

| Agent                               | Uses LLM?                | Model / Tech Core                              | Primary Responsibility                                                                     |
| ----------------------------------- | ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **1. Supervisor & Orchestrator**    | **Yes**                  | Open-Weight LLM (Function Calling / JSON mode) | Parses natural language intent, extracts spatial entities, and plans task execution.       |
| **2. Ocean & Weather Analytics**    | **No** _(Deterministic)_ | Python (`xarray`, `rasterio`, `netCDF4`)       | Queries NetCDF grids for SST, Chlorophyll-a, wave heights, and winds at given coordinates. |
| **3. Geospatial Risk & Geofencing** | **No** _(Deterministic)_ | PostgreSQL / PostGIS (`GEOS`, `Shapely`)       | Executes spatial SQL checks against boundary polygons (IMBL, EEZ, MPAs) and hazards.       |

|
| **4. Advisory & Policy RAG** | **Yes** | Embedding Model + Local LLM | Performs semantic search over INCOIS safety bulletins, port advisories, and fishing regulations.

|
| **5. Synthesizer & Localization** | **Yes** | Multilingual LLM / Bhashini API | Merges telemetry and spatial flags into a clear explanation with regional language support.

|

---

## Detailed Breakdown of Each Agent

```
                     ┌──────────────────────────────┐
                     │ User Query (Text / Audio)    │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │  Agent 1: Supervisor (LLM)   │
                     └──────┬───────────────┬───────┘
                            │ (Parallel)    │                 goa 15 km fishes information
            ┌───────────────┴────────┐      └────────────────────────┐
            ▼                        ▼                               ▼
  ┌─────────────────────┐ ┌─────────────────────────┐ ┌────────────────────────┐
  │ Agent 2: Analytics  │ │ Agent 3: Risk & Geo     │ │ Agent 4: Policy RAG    │ Retrival argumented generation
  │ (Pure Python/NetCDF)│ │ (Pure PostGIS / SQL)    │ │ (Vector Search + LLM)  │
  └─────────┬───────────┘ └──────────┬──────────────┘ └──────────┬─────────────┘godaddy ya google
            │                        │                           │
            └────────────────────────┼───────────────────────────┘
                                     ▼
                     ┌──────────────────────────────┐
                     │ Agent 5: Synthesizer (LLM)   │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ UI Payload (JSON + GeoJSON)  │
                     └──────────────────────────────┘

```

---

### Agent 1: Supervisor & Intent Orchestrator

- **LLM Role:** Receives the unstructured user query, normalizes regional/vernacular place names into coordinates or bounding boxes, and emits a structured JSON execution plan.
- **What It Needs:**
- **Input:** Raw user string (e.g., _"Can 4 boats go 30km southwest of Veraval tomorrow morning for Tuna?"_).
- **Prompt/Schema:** Pydantic schema enforcing structured tool calls.
- **Gazetteer / Geocoding Tool:** Local lookup table mapping Indian coastal landing centers, harbors, and fishing zones to coordinates.

- **Output:**

```json
{
  "origin": { "name": "Veraval", "lat": 20.9, "lon": 70.36 },
  "target_bbox": [20.6, 70.0, 20.85, 70.3],
  "time_window": "2026-08-28T06:00:00Z",
  "required_checks": ["ocean_telemetry", "geofence_risk", "policy_rag"]
}
```

---

### Agent 2: Ocean & Weather Analytics (Deterministic Engine)

- **LLM Role:** **None.** This is a high-speed numerical pipeline.
- **What It Needs:**
- **Data Inputs:** MOSDAC NetCDF/HDF5 files (SST, wind vectors), INCOIS NetCDF/GeoTIFF feeds (Significant Wave Height, Chlorophyll concentration, Ocean Current velocities).

- **Libraries:** `xarray`, `numpy`, `scipy.spatial`.

- **How It Works:**

1. Opens the localized raster datasets for the requested timestamp.
2. Runs spatial indexing to extract values within `target_bbox`.
3. Computes thermal and chlorophyll gradient intersections to confirm Potential Fishing Zones (PFZs).

- **Output:**

```json
{
  "pfz_detected": true,
  "pfz_coordinates": [
    [20.72, 70.15],
    [20.75, 70.18]
  ],
  "telemetry": {
    "sst_celsius": 28.4,
    "wave_height_m": 1.4,
    "wind_speed_knots": 14.2,
    "sea_condition": "Moderate"
  }
}
```

---

### Agent 3: Geospatial Risk & Geofencing (Spatial Validator)

- **LLM Role:** **None.** Boundary checking must be mathematically infallible to prevent illegal border crossings or marine sanctuary violations.

- **What It Needs:**
- **Database:** PostgreSQL with the PostGIS extension.
- **Spatial Layers (Shapefiles/GeoJSON):**
- International Maritime Boundary Line (IMBL) — e.g., India–Sri Lanka, India–Pakistan.

- Exclusive Economic Zone (EEZ) boundaries.

- Marine Protected Areas (MPAs) & wildlife sanctuaries (e.g., Gulf of Mannar).

- Active Cyclone / High-Wave hazard buffer zones.

- **How It Works:**
  Runs spatial queries (e.g., `ST_DWithin`, `ST_Intersects`) calculating the distance from the target trajectory to restricted polygons.
- **Output:**

```json
{
  "is_safe": true,
  "imbl_proximity_km": 42.6,
  "in_protected_area": false,
  "active_hazard_warnings": []
}
```

---

### Agent 4: Maritime Policy & Advisory RAG (Domain Specialist)

- **LLM Role:** Interprets unstructured government bulletins, seasonal fishing bans (e.g., monsoon trawl bans), species catch limitations, and emergency advisories.
- **What It Needs:**
- **Vector Database:** Local Qdrant or Milvus instance.
- **Document Corpus:** State fisheries department notifications, seasonal monsoon ban circulars, Coast Guard emergency protocols, and INCOIS weather bulletins.

- **Embedding Model:** `bge-small-en-v1.5` or `sentence-transformers`.

- **How It Works:**
  Vectorizes the intent query, retrieves the top-$k$ relevant regulatory clauses, and produces a structured summary of applicable restrictions.
- **Output:**

```json
{
  "active_bans": "No monsoon ban currently active in Gujarat sector.",
  "species_advisory": "Standard juvenile mesh size regulations apply.",
  "source_reference": "Dept of Fisheries Circular GJR-2026-04"
}
```

---

### Agent 5: Synthesizer & Localization Agent

- **LLM Role:** Ingests the outputs from Agents 2, 3, and 4, reconciles any conflicting observations, generates a conversational summary, and translates it into the requested Indian regional language.

- **What It Needs:**
- **Input:** Unified JSON state from all sub-agents.
- **LLM / Translation Pipeline:** Open-weight LLM with Indian language support (or integration with Bhashini API endpoints for Indic translations).

- **Output:**
- **Frontend Data Payload:** GeoJSON for MapLibre/Deck.gl (PFZ polygons, safe route paths, buffer zones).
- **Text/Voice Response:**
  > _"Tomorrow morning off the coast of Veraval is safe for fishing. A Potential Fishing Zone is detected 31 km southwest with moderate sea state (wave height 1.4 m). You are 42 km clear of the IMBL. No active restrictions in this sector."_
  >
  > _(Also delivered in Gujarati / Tamil / Hindi / Telugu based on user preference)._
