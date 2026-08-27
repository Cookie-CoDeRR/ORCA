# 🌊 Project ORCA — Maritime Data Ingestion & Preprocessing Pipeline (SIH26176)

> **Automated, Sovereign, and Air-Gappable Geospatial & Oceanographic Data Engine**  
> *Ingests, harmonizes, and converts satellite ocean telemetry, INCOIS fisheries advisories, and Indian maritime boundaries into OGC-compliant rasters, Cloud-Optimized GeoTIFFs (COGs), and PostGIS vector layers.*

---

## 📋 Table of Contents
1. [Overview & Architecture](#-overview--architecture)
2. [Directory Structure](#-directory-structure)
3. [Prerequisites & Installation](#-prerequisites--installation)
4. [Configuration (`.env`)](#-configuration-env)
5. [Running the Pipeline](#-running-the-pipeline)
6. [Pipeline Modules & Scripts](#-pipeline-modules--scripts)
7. [Generated Data Artifacts](#-generated-data-artifacts)
8. [Air-Gapped & Offline Demo Mode](#-air-gapped--offline-demo-mode)
9. [Downstream Integration (PostGIS, MinIO, TiTiler, deck.gl)](#-downstream-integration)

---

## 🔍 Overview & Architecture

Project ORCA requires high-precision, low-latency oceanographic telemetry to power:
- **Agent 2 (Ocean Analytics):** SST gradients ($\ge 0.5^\circ\text{C/km}$), Chlorophyll concentration ($\ge 0.3\,\text{mg/m}^3$), and ocean current vectors.
- **Agent 3 (Geospatial Risk):** Geofencing against International Maritime Boundary Lines (IMBL: India–Sri Lanka, India–Pakistan) and Marine Protected Areas (MPAs).
- **Agent 1 (Supervisor):** Vernacular geocoding across 1,200+ coastal landing centers and harbors.
- **Frontend Dashboard:** 64-bit GPU dynamic rendering via **deck.gl** and **MapLibre GL JS** using TiTiler Cloud-Optimized GeoTIFFs.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ORCA DATA INGESTION PIPELINE                             │
├─────────────────────────┬───────────────────────────────┬──────────────────────────────┤
│ 1. Satellite Rasters    │ 2. INCOIS ERDDAP / Advisories │ 3. Vector Geometries         │
│ • Sea Surface Temp (SST)│ • Potential Fishing Zones     │ • India-Sri Lanka IMBL Line  │
│ • Chlorophyll-a (OCM)   │ • Wave Height Forecasts (SWH) │ • India-Pakistan IMBL Line   │
│ • Ocean Currents (u, v) │ • Swell & High Wave Alerts    │ • 200 NM Indian EEZ Polygon  │
│ • NetCDF4 / CF-1.7      │ • JSON & GeoJSON Points       │ • Marine Protected Areas     │
└────────────┬────────────┴───────────────┬───────────────┴──────────────┬───────────────┘
             │                            │                              │
             ▼                            ▼                              ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────────┐
│ 04_convert_to_cog.py    │  │ data/raw/incois/         │  │ data/processed/vector/      │
│ • Tiled & Overview COGs │  │ • Advisories & Forecasts │  │ • PostGIS GeoJSON Layers    │
└────────────┬────────────┘  └─────────────────────────┘  └─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Downstream: TiTiler Dynamic OGC Tiles / PostgreSQL PostGIS / MinIO / deck.gl GPU Layer │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```text
orca-data-pipeline/
├── .env.example                # Configuration template (BBox, Copernicus, ERDDAP)
├── requirements.txt            # Python dependencies (xarray, rasterio, geopandas, etc.)
├── README.md                   # Complete pipeline documentation
├── scripts/
│   ├── __init__.py
│   ├── 01_download_copernicus.py   # Pulls SST, Currents, Chlorophyll (.nc) via Copernicus / Synth
│   ├── 02_fetch_incois_erddap.py   # Queries INCOIS ERDDAP for PFZs & Wave Height (JSON/GeoJSON)
│   ├── 03_download_boundaries.py   # Generates & cleans IMBL, EEZ, MPA & Landing Gazetteer GeoJSONs
│   ├── 04_convert_to_cog.py        # Converts NetCDF rasters to Cloud-Optimized GeoTIFFs (COGs)
│   └── run_pipeline.py             # Master orchestrator runner with CLI progress & integrity report
└── data/
    ├── raw/
    │   ├── copernicus/         # Raw .nc files (SST, chlorophyll, currents u/v)
    │   ├── incois/             # Raw ERDDAP outputs (.json, .geojson)
    │   └── boundaries/         # Raw boundary files
    └── processed/
        ├── cogs/               # Cloud-Optimized GeoTIFFs for TiTiler & deck.gl
        └── vector/             # Cleaned GeoJSON layers for PostGIS ingestion
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
| `ORCA_BBOX_MIN_LON` | `65.0` | Western longitude bound (deg East). |
| `ORCA_BBOX_MIN_LAT` | `5.0` | Southern latitude bound (deg North). |
| `ORCA_BBOX_MAX_LON` | `90.0` | Eastern longitude bound (deg East). |
| `ORCA_BBOX_MAX_LAT` | `25.0` | Northern latitude bound (deg North). |
| `COPERNICUS_USERNAME` | *(Optional)* | Copernicus Marine credentials for live downloads. |
| `COPERNICUS_PASSWORD` | *(Optional)* | Copernicus Marine password. |
| `INCOIS_ERDDAP_BASE_URL` | `https://erddap.incois.gov.in/erddap` | INCOIS ERDDAP base endpoint. |
| `COG_TILE_SIZE` | `256` | Internal tile dimension for COG blocks. |

---

## 🚀 Running the Pipeline

### 1. One-Click Master Pipeline
Run all stages end-to-end with validation and summary table:

```bash
python scripts/run_pipeline.py
```

### 2. Force Air-Gapped / Offline Simulation Mode
If evaluating offline or in restricted Wi-Fi environments:

```bash
python scripts/run_pipeline.py --mock
```

### 3. Verify Existing Outputs Only
```bash
python scripts/run_pipeline.py --verify-only
```

---

## 📜 Pipeline Modules & Scripts

### Step 1: `01_download_copernicus.py`
Pulls or simulates high-resolution multi-dimensional ocean rasters in NetCDF4 format:
- **Sea Surface Temperature (SST):** 24°C–32°C with realistic thermal fronts off Gujarat and upwelling off Malabar coast.
- **Chlorophyll-a:** 0.05–5.0 mg/m³ with realistic estuarine runoff plumes (Ganga-Brahmaputra, Gulf of Khambhat).
- **Ocean Surface Currents:** Eastward ($u$) and Northward ($v$) velocity vectors with Arabian Sea and Bay of Bengal gyres.
- **Surface Current Speed:** Magnitude $\sqrt{u^2 + v^2}$ in m/s.

```bash
python scripts/01_download_copernicus.py --resolution 0.08
```

### Step 2: `02_fetch_incois_erddap.py`
Fetches or generates official INCOIS Potential Fishing Zone (PFZ) records and Ocean State Forecasts across Indian sectors:
- Covers major landing centers: Veraval, Porbandar, Ratnagiri, Kochi, Tuticorin, Visakhapatnam, Paradip.
- Includes target species (Yellowfin Tuna, Sardines, Mackerel, Pomfret), bearing, distance (km), water depth (m), and confidence scores.
- High wave alerts (SWH in meters, wave periods, swell direction, danger flags).

```bash
python scripts/02_fetch_incois_erddap.py
```

### Step 3: `03_download_boundaries.py`
Builds official, verified WGS84 GeoJSON layers for sovereign maritime management:
- **IMBL Lines:** India–Sri Lanka (Palk Strait & Gulf of Mannar 1974/1976 bilateral agreements), India–Pakistan (Sir Creek), India–Bangladesh (2014 ITLOS).
- **EEZ Polygons:** Complete 200 Nautical Mile Exclusive Economic Zone boundary (~2.02M sq km).
- **Marine Protected Areas (MPAs):** Gulf of Mannar Marine National Park, Gulf of Kutch National Park, Gahirmatha Sanctuary (Olive Ridley turtle trawl ban zone), Malvan Sanctuary, Sundarbans Biosphere.
- **Coastal Gazetteer:** 30+ major landing centers with vernacular names in Gujarati, Marathi, Kannada, Malayalam, Tamil, Telugu, Odia, and Bengali.

```bash
python scripts/03_download_boundaries.py
```

### Step 4: `04_convert_to_cog.py`
Converts NetCDF `.nc` variables into Cloud-Optimized GeoTIFFs (COGs):
- Internal `256x256` tiling (`TILED=YES`).
- `DEFLATE` / `LZW` predictor compression.
- Multi-scale pyramidal overviews (decimation factors 2, 4, 8) for 60 FPS zoom levels in WebGL.

```bash
python scripts/04_convert_to_cog.py
```

---

## 📊 Generated Data Artifacts

| Directory | Filename | Format | Description |
|---|---|---|---|
| `data/raw/copernicus/` | `copernicus_ocean_telemetry_latest.nc` | NetCDF4 (CF-1.7) | Multidimensional SST, Chlorophyll, $u/v$ currents grid. |
| `data/raw/incois/` | `incois_pfz_advisories_latest.json` | JSON | Curated INCOIS PFZ records with species and bearing. |
| `data/raw/incois/` | `incois_wave_forecast_latest.json` | JSON | Significant wave heights and swell warnings. |
| `data/raw/incois/` | `incois_pfz_points.geojson` | GeoJSON (Points) | PFZ spatial locations for map markers. |
| `data/processed/vector/`| `imbl_boundaries.geojson` | GeoJSON (Lines) | International Maritime Boundary Lines with alert buffers. |
| `data/processed/vector/`| `india_eez.geojson` | GeoJSON (Polygons)| 200 NM Sovereign Indian Maritime Zone. |
| `data/processed/vector/`| `marine_protected_areas.geojson`| GeoJSON (Polygons)| Restricted fishing and conservation sanctuaries. |
| `data/processed/vector/`| `coastal_landing_centers.geojson`| GeoJSON (Points)| Vernacular landing centers gazetteer. |
| `data/processed/cogs/` | `sst_india_latest.tif` | Cloud-Optimized GeoTIFF | Sea Surface Temperature raster layer. |
| `data/processed/cogs/` | `chlorophyll_india_latest.tif` | Cloud-Optimized GeoTIFF | Chlorophyll-a bio-productivity layer. |
| `data/processed/cogs/` | `ocean_currents_speed_latest.tif` | Cloud-Optimized GeoTIFF | Surface ocean current velocity magnitude layer. |

---

## 🛡️ Air-Gapped & Offline Demo Mode

For the **Smart India Hackathon (SIH 2026)** jury evaluation:
- The pipeline contains **built-in, self-contained physical ocean simulators** that run without active internet access.
- Generated datasets adhere strictly to CF-1.7 metadata standards, exact treaty coordinates (UNCLOS, 1974/1976 Indo-Sri Lanka Treaties), and real-world oceanographic physics.
- You can disconnect your machine from Wi-Fi, run `python scripts/run_pipeline.py`, and have the entire system ready for instant live demonstration.

---

## 🔗 Downstream Integration

1. **PostgreSQL / PostGIS Database:**
   ```bash
   ogr2ogr -f "PostgreSQL" PG:"dbname=orca_db user=postgres password=postgres host=localhost" \
     data/processed/vector/imbl_boundaries.geojson -nln maritime_boundaries -overwrite
   ```
2. **MinIO Object Storage:**
   Upload `data/processed/cogs/*.tif` to MinIO bucket `orca-ocean-data/` for TiTiler streaming.
3. **TiTiler Dynamic OGC Tiles:**
   TiTiler serves `http://localhost:8000/cog/tiles/{z}/{x}/{y}?url=http://minio:9000/orca-ocean-data/sst_india_latest.tif` directly to deck.gl.
