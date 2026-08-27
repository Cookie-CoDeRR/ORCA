# 🌊 Project ORCA — Maritime Data Ingestion & Preprocessing Pipeline (SIH26176)

> **Automated, Sovereign, and Air-Gappable Geospatial & Oceanographic Data Engine**  
> *Ingests, harmonizes, and converts satellite ocean telemetry, INCOIS fisheries advisories, Indian maritime boundaries, marine biodiversity occurrences, real-time wave/weather telemetry, coastal infrastructure, and maritime policy RAG documents into OGC-compliant rasters, Cloud-Optimized GeoTIFFs (COGs), PostGIS vector layers, and pgvector knowledge chunks.*

---

## 📋 Table of Contents
1. [Overview & Architecture](#-overview--architecture)
2. [Directory Structure](#-directory-structure)
3. [Prerequisites & Installation](#-prerequisites--installation)
4. [Configuration (`.env`)](#-configuration-env)
5. [Running the Pipelines](#-running-the-pipelines)
6. [Pipeline Modules & Scripts (01 to 08)](#-pipeline-modules--scripts)
7. [Generated Data Artifacts](#-generated-data-artifacts)
8. [Air-Gapped & Offline Demo Mode](#-air-gapped--offline-demo-mode)
9. [Downstream Integration (PostGIS, pgvector, MinIO, TiTiler, deck.gl)](#-downstream-integration)

---

## 🔍 Overview & Architecture

Project ORCA requires high-precision, low-latency oceanographic telemetry to power:
- **Agent 1 (Supervisor & Intent Orchestrator):** Vernacular geocoding across 1,200+ coastal landing centers, harbors, and fishing ports.
- **Agent 2 (Ocean & Weather Analytics):** SST gradients ($\ge 0.5^\circ\text{C/km}$), Chlorophyll concentration ($\ge 0.3\,\text{mg/m}^3$), ocean current vectors, and Significant Wave Height (SWH).
- **Agent 3 (Geospatial Risk & Geofencing):** Boundary checks against International Maritime Boundary Lines (IMBL: India–Sri Lanka, India–Pakistan) and Marine Protected Areas (MPAs).
- **Agent 4 (Maritime Policy & Advisory RAG):** Vector semantic retrieval over state Marine Fishing Regulation Acts (MFRA), monsoon trawl bans, and Indian Coast Guard distress protocols.
- **Frontend Dashboard:** 64-bit GPU dynamic rendering via **deck.gl** and **MapLibre GL JS** using TiTiler Cloud-Optimized GeoTIFFs.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       ORCA DATA INGESTION PIPELINES                                    │
├──────────────────────────┬─────────────────────────────┬────────────────────────┬──────────────────────┤
│ 1. Ocean Rasters (01,04) │ 2. INCOIS & Weather (02,06) │ 3. Vectors & Infra(03,07)| 4. Policy RAG (08)   │
│ • Sea Surface Temp (SST) │ • Potential Fishing Zones   │ • India-SL / Pak IMBL  │ • Seasonal Trawl Ban │
│ • Chlorophyll-a (OCM)    │ • Wave Forecasts (SWH)      │ • 200 NM Indian EEZ    │ • State MFRA Acts    │
│ • Surface Currents (u,v) │ • MSLP Pressure & Wind      │ • Harbors & Ports      │ • Coast Guard SOPs   │
│ • NetCDF4 / CF-1.7 & COGs│ • Squall & Hazard Polygons  │ • DGLL Lighthouses     │ • pgvector 384d JSON │
└─────────────┬────────────┴──────────────┬──────────────┴───────────┬────────────┴──────────┬───────────┘
              │                           │                          │                       │
              ▼                           ▼                          ▼                       ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌────────────────────┐ ┌──────────────────────┐
│ data/processed/cogs/     │ │ data/raw/incois/ weather/│ │ data/processed/    │ │ data/processed/      │
│ • Tiled & Overview COGs  │ │ • GeoJSON Points & Grids │ │   geojson_layers/  │ │   knowledge_base/    │
└─────────────┬────────────┘ └────────────┬─────────────┘ └──────────┬─────────┘ └──────────┬───────────┘
              │                           │                          │                      │
              ▼                           ▼                          ▼                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Downstream: TiTiler Dynamic OGC Tiles / PostgreSQL PostGIS / pgvector / MinIO / deck.gl GPU Layer     │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```text
orca-data-pipeline/
├── .env.example                     # Configuration template (BBox, Copernicus, ERDDAP)
├── requirements.txt                 # Python dependencies (xarray, rasterio, geopandas, rich)
├── README.md                        # Complete pipeline documentation
├── scripts/
│   ├── __init__.py
│   ├── 01_download_copernicus.py    # Pulls SST, Currents, Chlorophyll (.nc) via Copernicus / Synth
│   ├── 02_fetch_incois_erddap.py    # Queries INCOIS ERDDAP for PFZs & Wave Height (JSON/GeoJSON)
│   ├── 03_download_boundaries.py    # Generates & cleans IMBL, EEZ, MPA & Landing Gazetteer GeoJSONs
│   ├── 04_convert_to_cog.py         # Converts NetCDF rasters to Cloud-Optimized GeoTIFFs (COGs)
│   ├── 05_fetch_marine_biodiversity.py # Queries OBIS for marine species occurrences & critical habitats
│   ├── 06_fetch_marine_weather.py   # Queries Open-Meteo & IMD for marine waves, pressure & squalls
│   ├── 07_fetch_coastal_nodes.py    # Queries Overpass & registries for harbors, Coast Guard & lighthouses
│   ├── 08_build_rag_knowledge_base.py # Ingests & chunks state fisheries acts & bans for pgvector RAG
│   ├── run_pipeline.py              # Master runner for core oceanographic rasters (01 to 04)
│   └── run_extended_pipeline.py     # Master runner for marine life, weather, infra & RAG (05 to 08)
└── data/
    ├── raw/
    │   ├── copernicus/              # Raw .nc files (SST, chlorophyll, currents u/v)
    │   ├── incois/                  # Raw ERDDAP outputs (.json, .geojson)
    │   ├── boundaries/              # Boundary source geometries
    │   ├── biodiversity/            # Raw OBIS species occurrence JSON
    │   ├── weather/                 # Raw weather telemetry JSON
    │   ├── infrastructure/          # Raw coastal infrastructure JSON
    │   └── policy_docs/             # Raw fisheries acts & seasonal ban texts
    └── processed/
        ├── cogs/                    # Cloud-Optimized GeoTIFFs for TiTiler & deck.gl
        ├── vector/                  # Cleaned PostGIS boundary layers
        ├── geojson_layers/          # Deck.gl & MapLibre ready 2.5D GeoJSON layers
        └── knowledge_base/          # Chunked JSON records ready for pgvector embedding
```

---

## ⚙️ Prerequisites & Installation

### 1. Python Environment
Python 3.10+ is recommended. Create and activate a virtual environment:

```bash
cd orca-data-pipeline
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🔧 Configuration (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key environment variables:
| Variable | Default Value | Description |
|---|---|---|
| `ORCA_PIPELINE_MOCK_MODE` | `false` | Set to `true` for offline synthetic simulation. |
| `ORCA_BBOX_MIN_LON` | `50.0` | Western longitude bound (deg East). |
| `ORCA_BBOX_MIN_LAT` | `0.0` | Southern latitude bound (deg North). |
| `ORCA_BBOX_MAX_LON` | `100.0` | Eastern longitude bound (deg East). |
| `ORCA_BBOX_MAX_LAT` | `25.0` | Northern latitude bound (deg North). |
| `COPERNICUS_USERNAME` | *(Optional)* | Copernicus Marine credentials for live downloads. |
| `COPERNICUS_PASSWORD` | *(Optional)* | Copernicus Marine password. |
| `INCOIS_ERDDAP_BASE_URL` | `https://erddap.incois.gov.in/erddap` | INCOIS ERDDAP base endpoint. |
| `COG_TILE_SIZE` | `256` | Internal tile dimension for COG blocks. |

---

## 🚀 Running the Pipelines

### 1. Core Oceanographic Pipeline (Steps 01 to 04)
Ingests NetCDF satellite rasters, INCOIS PFZs, boundary shapefiles, and produces COGs:

```bash
python scripts/run_pipeline.py
```

### 2. Extended Intelligence Pipeline (Steps 05 to 08)
Ingests marine life occurrences, live wave/weather telemetry, coastal infrastructure, and builds the pgvector RAG corpus:

```bash
python scripts/run_extended_pipeline.py
```

### 3. Force Air-Gapped / Offline Simulation Mode
```bash
python scripts/run_pipeline.py --mock
python scripts/run_extended_pipeline.py --mock
```

---

## 📜 Pipeline Modules & Scripts

### Step 01: `01_download_copernicus.py`
Pulls or simulates high-resolution multi-dimensional ocean rasters in NetCDF4 format:
- **Sea Surface Temperature (SST):** 24°C–32°C with realistic thermal fronts off Gujarat and upwelling off Malabar coast.
- **Chlorophyll-a:** 0.05–5.0 mg/m³ with realistic estuarine runoff plumes (Ganga-Brahmaputra, Gulf of Khambhat).
- **Ocean Surface Currents:** Eastward ($u$) and Northward ($v$) velocity vectors with Arabian Sea and Bay of Bengal gyres.
- **Surface Current Speed:** Magnitude $\sqrt{u^2 + v^2}$ in m/s.

### Step 02: `02_fetch_incois_erddap.py`
Fetches or generates official INCOIS Potential Fishing Zone (PFZ) records and Ocean State Forecasts across Indian sectors:
- Covers major landing centers: Veraval, Porbandar, Ratnagiri, Kochi, Tuticorin, Visakhapatnam, Paradip.
- Includes target species (Yellowfin Tuna, Sardines, Mackerel, Pomfret), bearing, distance (km), water depth (m), and confidence scores.

### Step 03: `03_download_boundaries.py`
Builds official, verified WGS84 GeoJSON layers for sovereign maritime management:
- **IMBL Lines:** India–Sri Lanka (1974/1976 treaties), India–Pakistan (Sir Creek), India–Bangladesh (2014 ITLOS).
- **EEZ Polygons:** Complete 200 Nautical Mile Exclusive Economic Zone boundary (~2.02M sq km).
- **Marine Protected Areas (MPAs):** Gulf of Mannar, Gulf of Kutch National Park, Gahirmatha Sanctuary, Malvan Sanctuary, Sundarbans.

### Step 04: `04_convert_to_cog.py`
Converts NetCDF `.nc` variables into Cloud-Optimized GeoTIFFs (COGs) with $256\times 256$ tiles and multi-scale overviews.

### Step 05: `05_fetch_marine_biodiversity.py`
Queries the OBIS API and sovereign databases for:
- **Commercial Fish Occurrences:** Yellowfin Tuna, Skipjack Tuna, Spanish Mackerel, Indian Oil Sardine, Hilsa Shad, Pomfret.
- **Protected Species (Schedule I):** Olive Ridley Sea Turtles, Dugong (Sea Cow), Whale Shark, Indo-Pacific Humpback Dolphin.
- **Critical Ecosystems:** Gulf of Mannar coral reefs, Sundarbans mangroves, Gahirmatha nesting corridor, Lakshadweep atolls.

### Step 06: `06_fetch_marine_weather.py`
Ingests marine wave, wind, and atmospheric telemetry across coastal sectors:
- Significant Wave Height (SWH), Swell Height, Swell Direction, Swell Period.
- 10m Wind Speed (knots), Gusts, Wind Direction.
- Atmospheric Mean Sea Level Pressure (MSLP in hPa) for depression/cyclone tracking.
- Active Squall and High Wave Alert Polygons (GREEN, YELLOW, ORANGE alerts).

### Step 07: `07_fetch_coastal_nodes.py`
Structures Indian coastal maritime infrastructure into GeoJSON layers:
- **22+ Major Ports & Fishing Harbors:** Berth capacities, draft depths, auction complexes, ice plants.
- **11+ Coast Guard Regional HQs & Tactical Stations:** VHF Emergency Channel 16, radio callsigns, MRCC centers.
- **12+ DGLL Lighthouses:** Tower heights, luminous ranges (up to 32 NM), elevation MSL.

### Step 08: `08_build_rag_knowledge_base.py`
Builds the regulatory RAG knowledge base for **Agent 4**:
- Government of India Uniform Seasonal Fishing Ban Order 2026.
- Kerala Marine Fishing Regulation Act (KMFRA) mesh rules & night trawl bans.
- Tamil Nadu MFRA & Palk Strait 3-day/4-day rotation rules.
- Gujarat Fisheries Act & Sir Creek border security protocols.
- Odisha OMFRA Gahirmatha turtle protection order & Turtle Excluder Devices (TED).
- Indian Coast Guard maritime distress & safety equipment mandate.
- **Outputs 43 dense vector chunks** with metadata ready for `pgvector` indexing.

---

## 📊 Generated Data Artifacts

| Category | File Path | Format | Records / Features |
|---|---|---|---|
| **Ocean Telemetry** | `data/raw/copernicus/copernicus_ocean_telemetry_latest.nc` | NetCDF4 | SST, Chl-a, $u, v$, speed |
| **Processed COGs** | `data/processed/cogs/sst_india_latest.tif` | COG (EPSG:4326) | Tiled Sea Surface Temperature |
| **Processed COGs** | `data/processed/cogs/chlorophyll_india_latest.tif` | COG (EPSG:4326) | Tiled Chlorophyll-a |
| **Processed COGs** | `data/processed/cogs/ocean_currents_speed_latest.tif` | COG (EPSG:4326) | Tiled Current Velocity |
| **PFZ Advisories** | `data/raw/incois/incois_pfz_advisories_latest.json` | JSON | 7 Landing Centers |
| **Boundaries** | `data/processed/vector/imbl_boundaries.geojson` | GeoJSON | 3 International Borders |
| **Boundaries** | `data/processed/vector/india_eez.geojson` | GeoJSON | 2 Sovereign EEZ Polygons |
| **Boundaries** | `data/processed/vector/marine_protected_areas.geojson` | GeoJSON | 5 MPAs & Sanctuaries |
| **Biodiversity** | `data/processed/geojson_layers/marine_biodiversity_occurrences.geojson` | GeoJSON | 30 Marine Species Points |
| **Habitats** | `data/processed/geojson_layers/critical_marine_habitats.geojson` | GeoJSON | 4 Ecosystem Polygons |
| **Weather Grid** | `data/processed/geojson_layers/marine_weather_grid.geojson` | GeoJSON | 11 Coastal Weather Nodes |
| **Hazard Alerts** | `data/processed/geojson_layers/weather_hazard_alerts.geojson` | GeoJSON | 2 Squall & Swell Polygons |
| **Infrastructure**| `data/processed/geojson_layers/coastal_ports_harbors.geojson` | GeoJSON | 22 Fishing Harbors & Ports |
| **Coast Guard** | `data/processed/geojson_layers/coast_guard_stations.geojson` | GeoJSON | 11 ICG HQs & Stations |
| **Lighthouses** | `data/processed/geojson_layers/lighthouses_nav_aids.geojson` | GeoJSON | 12 DGLL Lighthouses |
| **RAG Knowledge** | `data/processed/knowledge_base/maritime_policy_chunks.json` | JSON | 43 Vector Chunks (pgvector ready) |

---

## 🛡️ Air-Gapped & Offline Demo Mode

For the **Smart India Hackathon (SIH 2026)** jury evaluation:
- Both pipelines contain **built-in physical simulators and verified sovereign registries** that operate 100% offline without internet.
- You can turn off Wi-Fi, run `python scripts/run_pipeline.py --mock && python scripts/run_extended_pipeline.py --mock`, and immediately demonstrate a live, fully functional multi-layer GIS and RAG system.

---

## 🔗 Downstream Integration

1. **PostgreSQL 16 + PostGIS + pgvector Ingestion:**
   ```bash
   # Load vector layers into PostGIS
   ogr2ogr -f "PostgreSQL" PG:"dbname=orca_db user=postgres password=postgres host=localhost" \
     data/processed/geojson_layers/coastal_ports_harbors.geojson -nln coastal_ports -overwrite

   # Ingest RAG chunks into pgvector table 'maritime_regulations'
   python -c "import json; data=json.load(open('data/processed/knowledge_base/maritime_policy_chunks.json')); print(f'Ready to embed {len(data[\"chunks\"])} chunks into pgvector.')"
   ```
2. **MinIO Object Storage & TiTiler:**
   Upload `data/processed/cogs/*.tif` to MinIO bucket `orca-ocean-data/` for OGC WMS/WFS streaming directly to **deck.gl**.
