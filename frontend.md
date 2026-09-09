# 🐬 Project ORCA — Master Frontend Engineering Specification & UI/UX Blueprint

> **Sovereign Marine Intelligence, Multi-Agent Swarm & Earth Observation Platform (SIH26176)**  
> **Status:** Production Design & Engineering Blueprint  
> **Scope:** Complete screen specifications, ISRO & Earth Observation satellite inputs, multi-source telemetry, persona-linked interfaces, Deck.GL/MapLibre layer pipelines, and backend dataset APIs.

---

## 📑 Table of Contents

1. [Architectural Overview & High-Performance Stack](#1-architectural-overview--high-performance-stack)
2. [ISRO Satellite Images & Earth Observation (EO) Data Inputs](#2-isro-satellite-images--earth-observation-eo-data-inputs)
3. [Other Maritime & Hydrodynamic Data Inputs](#3-other-maritime--hydrodynamic-data-inputs)
4. [User Profiles, Personas & Role-Linked Screens](#4-user-profiles-personas--role-linked-screens)
5. [Comprehensive Screen Catalog & UI Wireframe Specifications](#5-comprehensive-screen-catalog--ui-wireframe-specifications)
   - [Screen 1: Tactical GIS Command Canvas (`/dashboard` & `/research/map`)](#screen-1-tactical-gis-command-canvas-dashboard--researchmap)
   - [Screen 2: Earth Observation & Telemetry Hub (`/research/data`)](#screen-2-earth-observation--telemetry-hub-researchdata)
   - [Screen 3: Multi-Agent Synthesis Studio & Report Lab (`/research/reports`)](#screen-3-multi-agent-synthesis-studio--report-lab-researchreports)
   - [Screen 4: Defense & Sovereign Maritime Command Center (`/defense`)](#screen-4-defense--sovereign-maritime-command-center-defense)
   - [Screen 5: Regulatory Vault & Statutory Compliance Hub (`/regulatory-vault`)](#screen-5-regulatory-vault--statutory-compliance-hub-regulatory-vault)
   - [Screen 6: Multi-Agent Swarm Mesh & Synapse Visualizer (`/agents`)](#screen-6-multi-agent-swarm-mesh--synapse-visualizer-agents)
   - [Screen 7: Low-Bandwidth Vernacular Mobile Portal (Fisherman PWA & Voice Bot)](#screen-7-low-bandwidth-vernacular-mobile-portal-fisherman-pwa--voice-bot)
6. [Deck.GL 10-Layer Pipeline & Interleaved MapLibre Rendering](#6-deckgl-10-layer-pipeline--interleaved-maplibre-rendering)
7. [Master Dataset APIs & Backend Integration Registry](#7-master-dataset-apis--backend-integration-registry)
8. [Global State Management (Zustand) & Data Services Architecture](#8-global-state-management-zustand--data-services-architecture)

---

## 1. Architectural Overview & High-Performance Stack

To ensure the ORCA dashboard runs smoothly on regional government workstations, naval bridge computers, and mobile devices over constrained coastal networks, the frontend architecture offloads heavy data crunching directly to the GPU.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     PROJECT ORCA FRONTEND ARCHITECTURE                               │
├────────────────────────────┬─────────────────────────────┬───────────────────────────────────────────┤
│ Core Framework             │ Next.js 14+ (React 18/19)   │ Server-Side Rendering (SSR) & Fast Payloads│
│ Base Map Engine            │ MapLibre GL JS (WebGL)      │ 60 FPS GPU-accelerated Vector & DEM Tiles  │
│ 64-Bit Data Visualization  │ deck.gl v8.9 / v9           │ Multi-million point vectors, rasters, GLSL│
│ Global State Management    │ Zustand (Targeted Selectors)│ Zero-boilerplate agent-map synchronization│
│ Styling & Design Tokens    │ Tailwind CSS + Shadcn/ui    │ High-contrast dark maritime design system │
│ Real-Time Streaming        │ SSE (Server-Sent Events)    │ Token-by-token agent thoughts & telemetry │
│ Live Transponder Feed      │ WebSockets (AISStream.io)   │ 2-second kinematic position updates       │
│ Vernacular Localization    │ Bhashini API / AI4Bharat    │ 7 Scheduled Indian Coastal Languages       │
└────────────────────────────┴─────────────────────────────┴───────────────────────────────────────────┘
```

### Key Technical Mandates:

- **Zero DOM Map Crashes:** Never render thousands of SVG/DOM markers. Use Deck.GL binary attributes (`ScatterplotLayer`, `PathLayer`, `ColumnLayer`, `BitmapLayer`).
- **Dynamic Tile Offloading:** Never pass raw multi-gigabyte NetCDF files to client browsers. Ingest rasters via FastAPI/TiTiler as dynamic Web Mercator XYZ tiles or Cloud-Optimized GeoTIFF (COG) slices.
- **Strict Role-Gating:** Adapt UI widgets, parameter matrices, map layers, and advisory vocabulary based on active user persona (`navigator`, `researcher`, `defense`, `student`, `visitor`).

---

## 2. ISRO Satellite Images & Earth Observation (EO) Data Inputs

Project ORCA integrates high-resolution spatial observations from Indian Space Research Organisation (ISRO) constellations, archives from **MOSDAC** (Meteorological and Oceanographic Satellite Data Archival Centre), **Bhuvan**, and **INCOIS**.

| Satellite / Mission                  | Instrument / Sensor                                   | Measurable Oceanographic Variable                                                                                                      | Processing Level & Data Format                                                           | Frontend Rendering Component & Shader                                                                                                                 |
| :----------------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Oceansat-3 (EOS-06) / Oceansat-2** | **OCM-3 / OCM-2** (Ocean Colour Monitor)              | **Chlorophyll-a Concentration** ($0.01 - 10.0\text{ mg/m}^3$), Total Suspended Matter (TSM), Diffuse Attenuation ($K_d 490$), PAR      | Level-3 NetCDF4 / COG via MOSDAC (360m native resolution, daily repeat)                  | Deck.GL `TileLayer` / `BitmapLayer` with Chlorophyll Colormap (Navy $\rightarrow$ Emerald $\rightarrow$ Yellow $\rightarrow$ Crimson)                 |
| **Oceansat-3 / SCATSAT-1**           | **OSCAT / Ku-band Scatterometer**                     | **Ocean Surface Wind Vectors** ($u_{10}, v_{10}$ at 10m MSL), Wind Speed (0–60 kts), Wind Direction                                    | Level-3 NetCDF4 grid ($0.25^\circ \times 0.25^\circ$ & $0.125^\circ \times 0.125^\circ$) | Deck.GL `LineLayer` + Dynamic Arrow Heads or GLSL Particle Flow Shader                                                                                |
| **INSAT-3D / INSAT-3DR**             | **Multispectral Imager & 19-Channel Sounder**         | **Sea Surface Temperature (SST)** in TIR-1 (10.8 µm), TIR-2 (12.0 µm), MIR (3.9 µm), Cloud Top Temperature (CTT), Cyclone Eye Tracking | Half-hourly Level-2/3 NetCDF / HDF5 from MOSDAC                                          | Deck.GL `TileLayer` with SST Colormap ($24^\circ\text{C} - 32^\circ\text{C}$), Thermal Front $\nabla\text{SST}$ Contours ($\ge 0.5^\circ\text{C/km}$) |
| **RISAT-1A (EOS-04)**                | **C-band Synthetic Aperture Radar (SAR)**             | Ocean surface roughness, internal wave solitons, dark vessel wake signatures, oil slick damping                                        | Level-2 Terrain-corrected GeoTIFF (Stripmap & ScanSAR)                                   | Deck.GL `BitmapLayer` with high-contrast radar grayscale + Dark Vessel target reticles                                                                |
| **NASA GIBS / JPL MUR**              | **Blended GHRSST L4 Multi-Scale Ultra-High Res**      | Foundational global baseline SST at 1 km resolution                                                                                    | WMTS XYZ Raster Tiles (`epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature`)            | Deck.GL `TileLayer` (Opacity: 0.55, Bottom of stack)                                                                                                  |
| **INCOIS Ocean State Forecast**      | **WaveWatch III / SWAN Model + In-Situ Moored Buoys** | Significant Wave Height (SWH $0 - 8\text{ m}$), Swell Height, Peak Period ($T_p$), Mean Wave Direction                                 | In-Situ ERDDAP JSON + Level-4 GeoJSON grid                                               | Dynamic SVG compass arrows, Deck.GL `ScatterplotLayer` with Wave Alert color halos (Green/Yellow/Red)                                                 |
| **GEBCO 2024 / INCOIS Hydrography**  | **Digital Seafloor Bathymetric Model**                | Seafloor depth (0 to -6,000m), Continental Shelf Break (200m depth contour), submarine canyons                                         | Terrarium RGB-encoded DEM (`elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`)             | MapLibre 3D Hillshade Terrain Mesh (`terrain-dem` source, exaggeration: 2.2x)                                                                         |

### Satellite Frontal Calculus Visualized in UI:

1. **$\nabla\text{SST}$ Thermal Fronts:** Highlight boundary zones where temperature gradients exceed $0.5^\circ\text{C}$ per nautical mile.
2. **Chlorophyll Plumes:** Track estuarine runoff plumes (Indus Delta, Gulf of Khambhat, Ganges-Brahmaputra) where nutrient-rich water stimulates phytoplankton aggregations.
3. **Upwelling Divergence:** Correlate SCATSAT-1 offshore wind stress vectors with INSAT-3D coastal cooling anomalies off the Malabar and Saurashtra coasts.

---

## 3. Other Maritime & Hydrodynamic Data Inputs

Beyond satellite imagery, the frontend synthesizes diverse operational data streams:

### A. Live AIS Vessel Transponders & Kinematics

- **Source:** Real-time WebSocket feed (`stream.aisstream.io/v0/stream`) or FastAPI SSE (`/api/v1/traffic/stream`).
- **Bounding Box:** $[4.0^\circ\text{N}, 65.0^\circ\text{E}] \times [26.0^\circ\text{N}, 95.0^\circ\text{E}]$ (Indian Ocean Basin).
- **Tracked Parameters:** MMSI, Vessel Name, Ship Type (Cargo, Tanker, Fishing, Law Enforcement, Passenger), Length, Breadth, Speed Over Ground (SOG), Course Over Ground (COG), True Heading, Navigation Status, Destination.
- **Safety Computations:** Dynamic Closest Point of Approach (CPA in NM), Time to CPA (TCPA in minutes), Collision Risk Index (CRI), and IMO COLREGs Rules 13, 14, 15 classifications.

### B. Sovereign Maritime Geofences & Administrative Boundaries

- **International Maritime Boundary Lines (IMBL):**
  - _India–Sri Lanka IMBL:_ 1974 and 1976 bilateral treaties across Palk Bay and Gulf of Mannar (Kachchatheevu sector).
  - _India–Pakistan IMBL:_ Sir Creek boundary and maritime extension in Northwest Arabian Sea.
  - _India–Bangladesh IMBL:_ 2014 ITLOS arbitral award boundary in the Bay of Bengal.
- **Indian Exclusive Economic Zone (EEZ):** 200 Nautical Mile boundary encompassing ~2.02 million square kilometers.
- **Marine Protected Areas (MPAs) & Coral Sanctuaries:**
  - Gulf of Mannar Biosphere Reserve (Tamil Nadu)
  - Gulf of Kutch Marine National Park (Gujarat)
  - Gahirmatha Marine Sanctuary (Odisha - Olive Ridley nesting corridor)
  - Malvan Marine Sanctuary (Maharashtra)
  - Sundarbans Mangrove Reserve (West Bengal)

### C. Coastal Infrastructure & Navigational Aids

- **Major Ports & Fishing Harbors (22+ Nodes):** Veraval, Porbandar, Sassoon Dock (Mumbai), Mangalore, Kochi, Tuticorin, Visakhapatnam, Paradip. Includes draft depths, auction facilities, ice capacity, and VHF communication channels.
- **Indian Coast Guard (ICG) Regional HQs & Stations (11+ Nodes):** Mumbai (RHQ West), Gandhinagar (RHQ NW), Chennai (RHQ East), Kolkata (RHQ NE), Port Blair (RHQ A&N). Includes 24/7 MRCC emergency contacts and VHF Channel 16 monitoring frequencies.
- **DGLL Lighthouses (12+ Navigational Aids):** Tower heights, elevation above MSL, luminous range (up to 32 NM), and flashing character codes.

### D. Marine Biodiversity & Habitat Occurrences

- **Data Source:** IndOBIS (Ocean Biodiversity Information System) & CMFRI registry.
- **Commercial Pelagics:** Yellowfin Tuna (_Thunnus albacares_), Indian Mackerel (_Rastrelliger kanagurta_), Oil Sardine (_Sardinella longiceps_), Silver Pomfret (_Pampus argenteus_), King Seer / Surmai (_Scomberomorus commerson_).
- **Schedule I Protected Species:** Dugong (_Dugong dugon_), Olive Ridley Sea Turtle (_Lepidochelys olivacea_), Whale Shark (_Rhincodon typus_), Indo-Pacific Humpback Dolphin (_Sousa chinensis_).

---

## 4. User Profiles, Personas & Role-Linked Screens

Project ORCA implements 4 AI Personas and 5 distinct operational user profiles. Each profile alters the application layout, map layer visibility, information density, and AI prompt template:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       USER PROFILES & AI PERSONAS                                      │
├──────────────────┬──────────────────────┬──────────────────────┬──────────────────────┬────────────────┤
│ 1. Navigator     │ 2. Marine Researcher │ 3. Coast Guard / Def │ 4. Ocean Learner     │ 5. Citizen     │
│ (ORCA-Fisher)    │ (ORCA-Scholar)       │ (ORCA-Tactical)      │ (ORCA-Student)       │ (Public Safety)│
├──────────────────┼──────────────────────┼──────────────────────┼──────────────────────┼────────────────┤
│ Matsya-Sutradhar │ Samudra-Vigyan       │ Sagar-Rakshak        │ Jala-Vidya           │ Samudra-Seva   │
│ 🧭 Icon          │ 🔬 Icon              │ 🛡️ Icon              │ 🎓 Icon              │ 🌊 Icon        │
└──────────────────┴──────────────────────┴──────────────────────┴──────────────────────┴────────────────┘
```

### Detailed Profile Breakdown:

#### 1. Commercial Fisher / Fleet Navigator (`navigator`)

- **Agent Identity:** ORCA-Fisher (_Matsya-Sutradhar_)
- **Primary Objectives:** Maximum catch volume, fuel conservation, collision avoidance, and staying well inside Indian sovereign waters.
- **Language & Tone:** Actionable, zero-jargon, localized Hindi/Tamil/Gujarati/Malayalam. Uses terms like "Catch Chance" rather than "Habitat Suitability Index".
- **Default Active Layers:** PFZ 3D Columns, Optimal Route Polyline (Cyan), Surface Current Arrows, IMBL Hazard Buffer Lines.
- **Custom HUD Elements:**
  - `GO / NO-GO` Sea State Verdict Badge
  - Fuel Savings Counter (`18.4% conserved via 1.2 knot tail-current`)
  - Target Catch & Feeding Window Card (`Dawn 04:30 - 07:30`)
  - Border Warning Radar (`74.2 km to IMBL — GREEN SAFE`)

#### 2. Marine Oceanographic Researcher (`researcher`)

- **Agent Identity:** ORCA-Scholar (_Samudra-Vigyan_)
- **Primary Objectives:** Scientific analysis of bio-optical parameters, NetCDF multi-dimensional array slicing, ocean-atmosphere carbon exchange, and taxonomic records.
- **Language & Tone:** Quantitative, rigorous, ISO unit compliance, formal scientific citations (MODIS, Sentinel-3, CMEMS, IndOBIS).
- **Default Active Layers:** NASA GIBS SST, Chlorophyll-a raster, Graticule Mesh ($2^\circ$ Grid), 200m Bathymetric Shelf Break, Species Occurrences.
- **Custom HUD Elements:**
  - $\nabla\text{SST}$ Thermal Front Gradient Matrix ($^\circ\text{C/km}$)
  - Primary Productivity Anomaly ($\pm\%$)
  - Multidimensional NetCDF Slice Inspector
  - Export Station: GeoJSON, NetCDF4 Sub-grid, CSV Parquet

#### 3. Coast Guard & Maritime Defense Commander (`defense`)

- **Agent Identity:** ORCA-Tactical (_Sagar-Rakshak_)
- **Primary Objectives:** Sovereign border enforcement, Time to Projected Incursion (TPI), hostile/dark vessel tracking, and COLREGs collision mitigation.
- **Language & Tone:** Zero-ambiguity military SITREP format, coordinates in DD°MM.MM'N, statutory legal citations (MZI Act 1981, UNCLOS).
- **Default Active Layers:** Dark Matter Basemap, AIS Vessel Vector Chevrons, COLREGs Hazard Halos, IMBL Sovereign Lines, Marine Protected Areas.
- **Custom HUD Elements:**
  - Threat Level SITREP HUD (Level 1 Normal / Level 2 Advisory / Level 3 Intercept)
  - IMBL Geofence Standoff Distance & Incursion Timer
  - COLREGs Collision Risk Matrix (CPA, TCPA, Encounter Classification)
  - VHF Channel 16 Hail Order & Intercept Course Calculator

#### 4. Oceanography Student & Maritime Learner (`student`)

- **Agent Identity:** ORCA-Student (_Jala-Vidya_)
- **Primary Objectives:** Educational discovery of ocean physics, Ekman upwelling mechanics, diurnal migration, and AI agent architectures.
- **Language & Tone:** Engaging, explanatory, conceptual diagrams, step-by-step math breakdowns.
- **Default Active Layers:** Current Vector Arrows, Coastal Upwelling Highlights, Bathymetric Terrain 3D Relief.
- **Custom HUD Elements:**
  - Kinematic Formula Sandbox ($V_g = V_s + V_c + K_w V_w$)
  - Multi-Agent LangGraph Swarm State Explorer
  - Pelagic Species Flashcards & Diurnal Migration Timelines

#### 5. Coastal Citizen & Public Visitor (`visitor`)

- **Agent Identity:** Public Safety Advisor (_Samudra-Seva_)
- **Primary Objectives:** Recreational boating safety, beach wave advisories, IMD cyclone tracking, and marine wildlife conservation.
- **Default Active Layers:** Wave Height Alert Polygons, Cyclone isobar tracks, Marine National Park boundaries.
- **Custom HUD Elements:**
  - Beach Safety Rating (Calm / Moderate / Rough)
  - IMD Weather Alert Banner (Green / Yellow / Orange)
  - Marine Wildlife Protection Guide

---

## 5. Comprehensive Screen Catalog & UI Wireframe Specifications

The ORCA frontend is structured into **7 core application screens**, each fulfilling a specific operational workflow:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ORCA MASTER SCREEN HIERARCHY                              │
├────────────────────────────────┬─────────────────┬─────────────────────────────────────┤
│ Route Path                     │ Screen Title    │ Primary Focus                       │
├────────────────────────────────┼─────────────────┼─────────────────────────────────────┤
│ /dashboard & /research/map     │ Tactical GIS    │ 2D/3D MapLibre + Deck.GL 10-Layers  │
│ /research/data                 │ Telemetry Hub   │ NetCDF4 Slicer, 2D Spectral Graphs  │
│ /research/reports              │ Synthesis Studio│ Multi-Agent Chat & PDF Report Lab   │
│ /defense                       │ Defense Command │ IMBL Standoff, AIS CPA & SITREPs    │
│ /regulatory-vault              │ Compliance Vault│ 43 pgvector Acts, Monsoon Bans, SOPs│
│ /agents                        │ Swarm Visualizer│ LangGraph DAG, Node Latency, Traces │
│ /mobile or /pwa                │ Fisherman PWA   │ Low-Bandwidth Vernacular Voice/Text │
└────────────────────────────────┴─────────────────┴─────────────────────────────────────┘
```

---

### Screen 1: Tactical GIS Command Canvas (`/dashboard` & `/research/map`)

The foundational operational screen combining full-viewport geospatial exploration with the multi-agent AI assistant.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🐬 ORCA v2.0]  [Basin: Arabian Sea ▼]  [Lang: தமிழ் ▼]  [Role: Navigator ▼]     [Backend: 🟢 LIVE]│
├─────────────────────────┬────────────────────────────────────────────────────┬───────────────────┤
│ MULTI-AGENT CHAT PANEL  │ MAPLIBRE + DECK.GL 3D SPATIAL CANVAS               │ TELEMETRY HUD     │
│                         │                                                    │                   │
│ [Agent: Matsya-Sutradhar│ • MapLibre Dark Matter Basemap                     │ 📍 Coords:        │
│  🧭 Fisher Copilot]     │ • Layer 1: NASA GIBS SST (0.55 Opacity Raster)     │ 20.902°N, 70.368°E│
│                         │ • Layer 2: Tactical Lat/Lon Graticule (2° Lines)   │                   │
│ 👤 User:                │ • Layer 3: Surface Current Arrows (uo, vo Vectors) │ 🌊 SST: 28.4°C    │
│ Where to catch tuna off │ • Layer 4: 200m Continental Shelf Break Contours   │ 🧪 Chl-a: 1.26mg  │
│ Veraval with low fuel?  │ • Layer 5: IMBL Boundaries & 10km Hazard Buffers   │ 💨 SWH: 1.6m      │
│                         │ • Layer 6: Coastal Shipping Fairways / TSS         │                   │
│ 🤖 Agent:               │ • Layer 7: PFZ Clusters (3D Extruded Columns)      │ 🐟 PFZ CLUSTERS:  │
│ 🚨 STATUS: 🟢 SAFE      │ • Layer 8: Dynamic A* Route Polyline (Glowing Cyan)│ [Veraval Sector 1]│
│ Wave: 1.6m | Wind: 12kt │ • Layer 9: AIS Ships with COLREGs Risk Halos       │ Conf: 93% • Tuna  │
│                         │ • Layer 10: Selected Coordinate Radar Reticle      │ Bearing: 215° 28km│
│ 🐟 TARGET: Yellowfin    │                                                    │                   │
│ Feeding: 04:30 - 07:30  │ [Map Controls: 2D/3D Pitch | Reset | Layer Toggles]│ ⛽ FUEL SIMULATOR: │
│                         │                                                    │ Distance: 24.6 NM │
│ 🧭 COURSE: 215° 28km    ├────────────────────────────────────────────────────┤ Savings: 18.4%    │
│ Current Push: +1.2 kts  │ ACTIVE SATELLITE STATUS: Oceansat-3 OCM | INSAT-3D │                   │
│ Fuel Saved: 18.4%       │ AIS Fleet: 142 Vessels | Border Separation: 74 km  │ [Export Waypoints]│
│                         │                                                    │                   │
│ [🎤 Voice] [Send Query] │                                                    │                   │
└─────────────────────────┴────────────────────────────────────────────────────┴───────────────────┘
```

#### Key UI Components for Screen 1:

1. **Interactive Chat Dock (Left, 380px):**
   - SSE streaming reader displaying real-time agent thoughts (`Supervisor -> Ocean Analytics -> Navigation -> Synthesizer`).
   - Markdown advisory formatter with collapsible reasoning steps.
   - Vernacular audio playback button (Bhashini TTS integration).
2. **Deck.GL Canvas (Center-Fill):**
   - Interleaved WebGL canvas rendering 10 distinct layers.
   - Click-to-query coordinate reticle binding coordinates to `/api/v1/ocean/telemetry` and `/api/v1/risk/geofence`.
3. **Telemetry & Route Sidebar (Right, 340px):**
   - Live telemetry cards: SST, Chlorophyll, Wave Height, Wind Velocity.
   - Fuel savings comparative calculator (Standard Straight Line vs Vector-Assisted Route).
   - Instant waypoint export (GeoJSON / GPX for marine chartplotters).

---

### Screen 2: Earth Observation & Telemetry Hub (`/research/data`)

A data-dense oceanographic workbench designed for marine scientists, INCOIS analysts, and CMFRI researchers to inspect multidimensional satellite arrays and export validated datasets.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🔬 ORCA_LAB: Telemetry Hub]  [7/7 Feeds Synchronized 🟢]  [Local Cache: 10.1 GB]  [Sync Feeds 🔄]│
├──────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ SEARCHABLE EARTH OBSERVATION CATALOG (60%)   │ DATASET METADATA & 2D SPECTRAL INSPECTOR (40%)    │
│                                              │                                                   │
│ [🔍 Search datasets, variables, sensors...]   │ [Dataset: Sea Surface Temperature (SST)]          │
│ Filters: [ALL] [Raster NetCDF] [Vector] [DEM]│ Source: MOSDAC / Copernicus Marine (OSTIA)        │
│                                              │ Resolution: 0.083° (~9 km) | Daily Ingestion      │
│ ┌──────────────────────────────────────────┐ │ Variables: analysed_sst, sst_anomaly              │
│ │ Dataset Name       │ Source   │ Status   │ │ Dimensions: time: 1, lat: 288, lon: 480 (float32) │
│ ├────────────────────┼──────────┼──────────┤ │                                                   │
│ │ Sea Surface Temp   │ MOSDAC   │ ONLINE 🟢│ │ 📈 72-HOUR IN-SITU BUOY TREND (Recharts)          │
│ │ Chlorophyll-a OCM  │ Sentinel │ ONLINE 🟢│ │  30°C ──────────────────────── SST (°C)          │
│ │ Current Vectors uv │ INCOIS   │ ONLINE 🟢│ │  28°C ───-..-──-..-─────                        │
│ │ Significant Wave Ht│ INCOIS   │ ONLINE 🟢│ │  26°C                                             │
│ │ IMBL Sovereign GIS │ Naval HO │ CACHED 📦│ │   2mg ────────-..-─────── Chl-a (mg/m³)          │
│ │ GEBCO Bathymetry   │ GEBCO    │ CACHED 📦│ │   0mg ───────────────────                         │
│ │ Real-Time AIS Feed │ AISStream│ ONLINE 🟢│ │       00:00   12:00   24:00   36:00   48:00       │
│ └──────────────────────────────────────────┘ │                                                   │
│                                              │ 🌐 POINT COORDINATE SLICER:                       │
│ Time-Slider: [-24h] [-12h] [-6h] [NOW: 0h]   │ Lat: [20.902]  Lon: [70.368]  [Slice Array]       │
│ Selected Basin: North Arabian Sea EEZ        │ Value: 28.42°C (Anomaly: +0.65°C above baseline)  │
│                                              │                                                   │
│                                              │ [⬇ Download NetCDF4 Slice]  [⬇ Download GeoTIFF] │
└──────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

#### Key UI Components for Screen 2:

1. **Catalog Table:** Displays source agency, ingestion interval, cache volume, and dimensions for each of the 7 master feeds.
2. **Recharts 2D Graph Panel:** Real-time multi-metric time-series curves comparing SST, Chlorophyll, and Wave Height over 72 hours.
3. **Array Slicer Widget:** Allows researchers to input exact coordinates or click the mini-map to extract instantaneous raw values and anomalies from NetCDF files.
4. **Data Exporter:** Triggers local slicing and downloads in standard formats (`.nc`, `.tif`, `.geojson`, `.csv`).

---

### Screen 3: Multi-Agent Synthesis Studio & Report Lab (`/research/reports`)

An explainable AI (XAI) synthesis suite where users can converse with ORCA-Scholar, inspect multi-agent reasoning traces, and preview auto-generated formal marine advisories.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [📄 ORCA: Synthesis Studio]  [Model: Qwen 2.5 7B (Ollama)]  [Embedding: BGE-M3]  [Mode: Scholar] │
├──────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ AGENT EXECUTION TRACE & CHAT INTERFACE (50%) │ FORMAL REGULATORY & SCIENTIFIC REPORT (50%)       │
│                                              │                                                   │
│ 💬 User Query:                               │ ╔═══════════════════════════════════════════════╗ │
│ "Generate a synoptic oceanographic profile   │ ║   PROJECT ORCA — GOVERNMENT OF INDIA          ║ │
│ for the Saurashtra shelf break off Veraval." │ ║   MARINE FISHERIES SCIENTIFIC ADVISORY        ║ │
│                                              │ ╠═══════════════════════════════════════════════╣ │
│ ⚙️ LangGraph Swarm Execution Trace:          │ ║ Bulletin ID: ORCA-SCI-2026-0907               ║ │
│ ├─ 🟢 Supervisor: Route -> Ocean & Policy     │ ║ Issue Date: September 7, 2026                 ║ │
│ ├─ 🟢 Ocean Worker: Sliced NetCDF SST=28.4°C │ ║ Sector: Northwest Arabian Sea (Veraval)       ║ │
│ ├─ 🟢 Geofence Worker: ST_Distance IMBL=74km │ ╠═══════════════════════════════════════════════╣ │
│ └─ 🟢 Synthesizer: Compile Synoptic Profile  │ ║ 1. SYNOPTIC OCEANOGRAPHIC PROFILE             ║ │
│                                              │ ║ • Centroid: 20.902°N, 70.368°E                ║ │
│ 🤖 ORCA-Scholar:                             │ ║ • Bathymetric Depth: 64m (Shelf Break)        ║ │
│ Synoptic analysis complete. Active thermal   │ ║ • SST Frontal Gradient: 0.083°C/km            ║ │
│ front identified at 28.4°C correlated with   │ ║ • Chlorophyll Density: 1.26 mg/m³ (+18% Anom) ║ │
│ primary chlorophyll bloom of 1.26 mg/m³.     │ ║ • Zonal Velocity (uo): +0.32 m/s Eastward     ║ │
│                                              │ ║                                               ║ │
│ [Parameters Used]                            │ ║ 2. TAXONOMIC OCCURRENCES & HABITAT INDEX      ║ │
│ SST: 28.4°C | Chl-a: 1.26 | SWH: 1.6m        │ ║ • Dominant: Thunnus albacares (Yellowfin)     ║ │
│ HSI Score: 0.93 (High Biological Capacity)   │ ║ • HSI Score: 0.93 | Trophic Level: 4.1        ║ │
│                                              │ ║ • Minimum Legal Size: 35 cm (CMFRI Gazette)   ║ │
│ 💬 Enter query or prompt for revision...     │ ║                                               ║ │
│ [Type inquiry...]                  [Send]    │ ║ 3. GEOFENCING & STATUTORY NOTICE              ║ │
│                                              │ ║ • IMBL Standoff: 74.2 km (Nominal Green)      ║ │
│                                              │ ║ • Seasonal Ban: West Coast Operable           ║ │
│                                              │ ╚═══════════════════════════════════════════════╝ │
│                                              │ [⬇ Download PDF Advisory]  [📋 Copy Markdown]   │
└──────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

#### Key UI Components for Screen 3:

1. **Trace Inspection Accordion:** Transparently reveals tool execution, SQL queries, and raster slicing latency for every agent turn.
2. **Bilingual Report Previewer:** Formats scientific profiles or commercial fishing advisories into official government memo formats.
3. **One-Click PDF Generator:** Compiles markdown into downloadable, print-ready PDF bulletins with embedded maps and charts.

---

### Screen 4: Defense & Sovereign Maritime Command Center (`/defense`)

A tactical command console for the Indian Coast Guard, Coastal Police, and Naval Hydrographic authorities to monitor sovereign border integrity, illegal foreign intrusions, and COLREGs collision hazards.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🛡️ SAGAR-RAKSHAK: DEFENSE COMMAND]  [DEFCON: NORMAL 🟢]  [Active Targets: 24]  [Radar: 30 NM]   │
├──────────────────────────────────────┬───────────────────────────────────────────────────────────┤
│ TACTICAL SITREP & INTERCEPT HUD (35%)│ HIGH-CONTRAST SITUATIONAL RADAR MAP (65%)                 │
│                                      │                                                           │
│ 🛡️ ACTIVE SITUATION REPORT (SITREP)   │ • 3D Terrain DEM with Crimson Hillshade Relief            │
│ Target: MV MAERSK BHARAT (Cargo)     │ • Red Glowing Boundary: India–Pakistan IMBL (Sir Creek)   │
│ MMSI: 419001004 | Flag: IND          │ • Orange Buffer Zone: 10 km Critical Geofence Threshold   │
│ Pos: 18.60°N, 72.45°E | SOG: 14.2 kt │ • Blue Polygon: Marine National Park, Gulf of Kutch       │
│ Vector: COG 165° | Heading: 164°     │                                                           │
│                                      │                   [PAKISTAN SOVEREIGN WATERS]             │
│ 📍 BOUNDARY & GEOFENCING AUDIT       │ ═════════════════════════════════════════════════════════ │
│ Nearest Border: India-Pak IMBL       │ ───────────────── IMBL Boundary Line ──────────────────── │
│ Standoff Distance: 45.2 km           │                 ▲                                         │
│ Incursion Risk: DIVERGING (Safe)     │               10 km Buffer                                │
│ Marine Protected Area: CLEAR         │                 ▼                                         │
│                                      │ ───────────────── Buffer Threshold ─────────────────────  │
│ ⚓ COLREGS COLLISION RISK            │                     ⚓ Target Ship [SOG 14.2kt, COG 165°] │
│ Contact: Fishing Craft FV SAGAR-1    │                    /                                      │
│ CPA: 1.4 NM | TCPA: 16.8 Minutes     │                   / CPA Vector Line                       │
│ Rule: Rule 15 (Crossing Give-Way)    │                  ▼                                        │
│ Action: Alter course to Starboard    │               ◎ Own-Ship Reticle [Mumbai Sector]          │
│                                      │                                                           │
│ 📻 DIRECTIVES & ESCALATION           │ [Layer Toggles: TSS Shipping Corridors | AIS Fleet | MPAs]│
│ [Issue VHF Ch 16 Hail]  [Log SITREP] │ [Radar Zoom: 10 NM | 30 NM | 50 NM | Pan to Border]       │
└──────────────────────────────────────┴───────────────────────────────────────────────────────────┘
```

#### Key UI Components for Screen 4:

1. **Tactical SITREP Feed:** Formatted in naval operational brevity codes with target MMSI, kinematics, flag, and threat level.
2. **IMBL Incursion Vector:** Calculates instantaneous Time to Projected Incursion (TPI) based on vessel speed and course heading.
3. **COLREGs Collision Triage Panel:** Flags vessels violating IMO Rules 13, 14, 15, and computes recommended heading alterations.
4. **VHF Channel 16 Hail Synthesizer:** Pre-fills standardized international distress/warning radio hail text for patrol operators.

---

### Screen 5: Regulatory Vault & Statutory Compliance Hub (`/regulatory-vault`)

A semantic compliance search portal powered by `pgvector` dense embeddings, indexing 43+ Indian maritime regulation chunks, seasonal trawl ban schedules, and coastal safety SOPs.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [📜 ORCA: Statutory Compliance Vault]  [pgvector: Active (1024-d)]  [Monsoon Ban: OPERABLE 🟢]     │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔍 SEMANTIC RAG SEARCH BAR:                                                                      │
│ [Search fisheries acts, mesh size rules, seasonal bans, safety equipment mandates...] [Search]  │
├──────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ VERIFIED STATUTORY ACTS & ORDERS (65%)       │ ACTIVE MONSOON BAN & SAFETY DIRECTIVES (35%)      │
│                                              │                                                   │
│ ┌──────────────────────────────────────────┐ │ 🚫 UNIFORM MONSOON FISHING BAN 2026               │
│ │ [Monsoon Ban] Dept Fisheries Order 2026  │ │ • West Coast (Arabian Sea):                       │
│ │ Similarity Score: 0.94                   │ │   Period: June 1 – July 31 (61 Days)              │
│ │ Jurisdiction: Pan-India EEZ              │ │   Status: 🟢 OPERABLE (Ban currently inactive)   │
│ │ 61-day annual ban on mechanized vessels. │ │   Exemptions: Non-motorized crafts permitted      │
│ ├──────────────────────────────────────────┤ │ • East Coast (Bay of Bengal):                     │
│ │ [Border Law] MZI Act 1981 / Section 10   │ │   Period: April 15 – June 14 (61 Days)            │
│ │ Similarity Score: 0.89                   │ │   Status: 🟢 OPERABLE (Ban currently inactive)   │
│ │ Strict prohibition of unauthorized entry │ │                                                   │
│ │ into foreign waters. Violators face ICG  │ │ 📻 MANDATORY SAFETY APPARATUS SOP                 │
│ │ interception, boat impoundment & fines.  │ │ • VHF Radio: Channel 16 continuous monitoring     │
│ ├──────────────────────────────────────────┤ │ • Life Jackets: 1 BIS-certified jacket per crew   │
│ │ [Mesh Regulations] ICAR-CMFRI 2025       │ │ • Beacons: Distress Alert Transmitter (DAT-B)     │
│ │ Minimum diamond mesh size: 35mm for fish │ │                                                   │
│ │ trawl, 25mm for shrimp trawl. Yellowfin  │ │ 🚨 MARITIME EMERGENCY CONTACTS                    │
│ │ MLS: 35 cm. Possession of undersized     │ │ • Coast Guard Toll-Free Distress: 1554            │
│ │ catch triggers market confiscation.      │ │ • MRCC Mumbai: +91-22-24388065 (VHF 16)           │
│ └──────────────────────────────────────────┘ │ • MRCC Chennai: +91-44-23460405                   │
└──────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

#### Key UI Components for Screen 5:

1. **pgvector Semantic Query Engine:** Connects to PostgreSQL `marine_advisories` table to retrieve relevant legal provisions.
2. **Real-Time Monsoon Ban Countdown:** Dynamically calculates days remaining until the seasonal breeding ban takes effect for both coasts.
3. **State MFRA Rule Matrix:** Quick-reference dropdown comparing mesh sizes and engine horsepower limits across Gujarat, Maharashtra, Kerala, Tamil Nadu, and Odisha.
4. **Emergency Directory:** Interactive dialing links and radio frequencies for all Indian Maritime Rescue Coordination Centres (MRCCs).

---

### Screen 6: Multi-Agent Swarm Mesh & Synapse Visualizer (`/agents`)

An interactive system topology graph visualizing the LangGraph multi-agent execution pipeline, inter-agent message passing, tool execution latency, and checkpointer state.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [🕸️ ORCA: Agent Swarm Mesh Topology]  [Engine: LangGraph 0.2]  [Checkpointer: PostgreSQL]         │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│                        ┌────────────────────────────┐                                            │
│                        │     USER NATURAL QUERY     │                                            │
│                        └─────────────┬──────────────┘                                            │
│                                      │                                                           │
│                                      ▼                                                           │
│                        ┌────────────────────────────┐                                            │
│                        │      SUPERVISOR AGENT      │  Intent Decomposition                      │
│                        │     (Matsya-Sutradhar)     │  Latency: 142ms                            │
│                        └──────┬──────┬───────┬──────┘                                            │
│                               │      │       │                                                   │
│                ┌──────────────┘      │       └──────────────┐                                    │
│                ▼                     ▼                      ▼                                    │
│     ┌─────────────────────┐┌───────────────────┐┌────────────────────────┐                      │
│     │   OCEAN ANALYTICS   ││  RISK GEOFENCING  ││   NAVIGATION ROUTER    │  Worker Nodes         │
│     │ • NetCDF SST & Chl-a││ • PostGIS IMBL    ││ • Vector-Assisted A*   │  Parallel Execution   │
│     │ • PFZ Front Calculus││ • Marine Sanctuary││ • COLREGs Domain Avoid │  Avg Latency: 310ms   │
│     │ Latency: 280ms      ││ Latency: 95ms     ││ Latency: 380ms         │                       │
│     └──────────┬──────────┘└─────────┬─────────┘└───────────┬────────────┘                       │
│                │                     │                      │                                    │
│                └──────────────┐      │       ┌──────────────┘                                    │
│                               ▼      ▼       ▼                                                   │
│                        ┌────────────────────────────┐                                            │
│                        │     SYNTHESIZER AGENT      │  Advisory & GeoJSON Assembly               │
│                        │     (Advisory Compiler)    │  Bhashini Indic Translation                │
│                        └─────────────┬──────────────┘  Latency: 410ms                            │
│                                      │                                                           │
│                                      ▼                                                           │
│                        ┌────────────────────────────┐                                            │
│                        │  DECK.GL GEOJSON + STREAM  │                                            │
│                        └────────────────────────────┘                                            │
│                                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ METRICS: End-to-End Latency: 1.22s | Active Checkpoint Sessions: 14 | Model: Qwen 2.5 7B Q5_K_M │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key UI Components for Screen 6:

1. **Interactive Node-Link Canvas:** Built with React Flow or SVG canvas, showing active worker execution status with pulsing green nodes.
2. **Node Inspector Flyout:** Displays inputs, outputs, JSON payloads, and tool execution error rates for each agent.
3. **Performance Metrics Strip:** Displays memory checkpointer usage, Ollama inference speed (tokens/sec), and database connection pool health.

---

### Screen 7: Low-Bandwidth Vernacular Mobile Portal (Fisherman PWA & Voice Bot)

A streamlined Progressive Web App (PWA) under 100 KB payload, optimized for low-end Android phones operating on intermittent 2G/EDGE networks at sea.

```
┌───────────────────────────────────────────────────┐
│ 🐬 ORCA MATSYA-SEVA          [🇮🇳 தமிழ் | தமிழ் ▼] │
├───────────────────────────────────────────────────┤
│                                                   │
│   🚨 இன்றைய கடல் நிலை:                             │
│   [ 🟢 பாதுகாப்பானது — கடலுக்கு செல்லலாம் ]        │
│                                                   │
│   🌊 அலை உயரம்: 1.4 மீ | காற்று: 12 நாட்ஸ்        │
│   📍 எல்லை பாதுகாப்பு: எல்லைக்கு அப்பால் 65 கி.மீ    │
│                                                   │
├───────────────────────────────────────────────────┤
│   🐟 சிறந்த மீன்பிடி மண்டலம் (PFZ):               │
│                                                   │
│   • இலக்கு: சூரை மீன் (Yellowfin Tuna)            │
│   • தூரம்: துறைமுகத்திலிருந்து 26 கி.மீ           │
│   • திசை: தென்மேற்கு (215° SW)                    │
│   • அதிக மீன் கிடைக்கும் நேரம்: காலை 04:30 - 07:00│
│                                                   │
│   ⛽ டீசல் சேமிப்பு: 18% (நீரோட்ட உதவி)            │
├───────────────────────────────────────────────────┤
│                                                   │
│   [ 🎤 குரல் மூலம் கேளுங்கள் (SPEAK QUESTION) ]    │
│                                                   │
│   [ 🗺️ வரைபடம் பார்க்க (LIGHTWEIGHT MAP) ]       │
│                                                   │
│   [ 🆘 அவசர உதவி (COAST GUARD 1554) ]            │
│                                                   │
├───────────────────────────────────────────────────┤
│ VHF Channel 16-ஐ கண்காணிக்கவும் | SMS சேவை இயங்குகிறது│
└───────────────────────────────────────────────────┘
```

#### Key UI Components for Screen 7:

1. **Large High-Contrast Action Buttons:** Easily tappable with wet hands on boat decks in sunlight.
2. **Audio-First Vernacular Interaction:** Integrates Bhashini Speech-to-Speech so fishermen speak queries and receive audio advisories.
3. **SMS / WhatsApp Fallback:** Displays the official ORCA WhatsApp bot number and shortcode SMS syntax for zero-internet zones.
4. **Instant SOS Trigger:** One-tap emergency beacon dispatching GPS coordinates via SMS to the nearest Coast Guard MRCC.

---

## 6. Deck.GL 10-Layer Pipeline & Interleaved MapLibre Rendering

To prevent visual clutter and maintain high performance, map layers must be rendered in this precise **Z-index stack order**:

```
[TOP / FOREGROUND]
  ↑  10. Coordinate Radar Reticle & User Marker   (ScatterplotLayer - Pulsing Cyan/White)
  │   9. AIS Vessels & COLREGs Hazard Halos       (ScatterplotLayer + PathLayer Chevrons)
  │   8. Dynamic A* Optimal Route Polyline        (PathLayer - Glowing Cyan Glow 4px)
  │   7. Potential Fishing Zones (PFZ Clusters)   (ColumnLayer 3D Cylinders + Base Halos)
  │   6. Coastal Shipping Fairways & TSS Lanes    (PathLayer - Dashed Muted Amber)
  │   5. Sovereign IMBL & Hazard Buffer Lines     (LineLayer + ScatterplotLayer Nodes)
  │   4. 200m Continental Shelf Break Contours    (ScatterplotLayer / PathLayer - Navy Accent)
  │   3. Ocean Surface Current Vector Flow Arrows (LineLayer + Scatterplot Arrowheads)
  │   2. Tactical Lat/Lon Graticule Nautical Mesh (LineLayer - 2° Grid with Text Labels)
  │   1. NASA GIBS Sea Surface Temperature (SST)  (TileLayer + BitmapLayer - Raster Base)
[BOTTOM / BASEMAP]
```

### TypeScript Deck.GL Layer Construction Recipe:

```typescript
import {
  ScatterplotLayer,
  LineLayer,
  PathLayer,
  ColumnLayer,
} from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";

export function buildOrcaDeckLayers({
  sstVisible = true,
  currentsVisible = true,
  pfzVisible = true,
  imblVisible = true,
  aisVisible = true,
  routeVisible = true,
  routeData = null,
  vessels = [],
  pfzPoints = [],
  currentVectors = [],
  selectedCoord = null,
}) {
  return [
    // Layer 1: NASA GIBS Blended Sea Surface Temperature
    sstVisible &&
      new TileLayer({
        id: "nasa-gibs-sst-layer",
        data: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/2024-05-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
        minZoom: 0,
        maxZoom: 7,
        tileSize: 256,
        opacity: 0.55,
        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
          } = props.tile;
          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north],
          });
        },
      }),

    // Layer 2: Surface Current Vector Flow Arrows
    currentsVisible &&
      new LineLayer({
        id: "ocean-currents-vectors",
        data: currentVectors,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getColor: (d: any) => [0, 220, 255, Math.min(255, d.magnitude * 180)],
        getWidth: 2.5,
        widthUnits: "pixels",
      }),

    // Layer 5: Sovereign IMBL Boundaries & Warning Buffer
    imblVisible &&
      new LineLayer({
        id: "sovereign-imbl-lines",
        data: [
          {
            name: "Sir Creek (Indo-Pak)",
            from: [68.1, 23.6],
            to: [66.5, 21.0],
            color: [244, 63, 94, 255],
          },
          {
            name: "Palk Strait (Indo-SL)",
            from: [79.31, 9.28],
            to: [80.5, 10.1],
            color: [244, 63, 94, 255],
          },
        ],
        getSourcePosition: (d: any) => d.from,
        getTargetPosition: (d: any) => d.to,
        getColor: (d: any) => d.color,
        getWidth: 3,
        widthUnits: "pixels",
      }),

    // Layer 7: 3D Extruded Potential Fishing Zone Columns
    pfzVisible &&
      new ColumnLayer({
        id: "pfz-3d-columns",
        data: pfzPoints,
        diskResolution: 24,
        radius: 4000,
        extruded: true,
        elevationScale: 100,
        getPosition: (d: any) => d.position,
        getElevation: (d: any) => d.confidence * 100,
        getFillColor: (d: any) => [16, 185, 129, 200], // Emerald Glow
        pickable: true,
      }),

    // Layer 8: Vector-Assisted Optimal Fuel Route Polyline
    routeVisible &&
      routeData &&
      new PathLayer({
        id: "optimal-marine-route",
        data: [routeData],
        getPath: (d: any) => d.geometry.coordinates,
        getColor: [6, 182, 212, 255], // Glowing Cyan
        getWidth: 4,
        widthUnits: "pixels",
        capRounded: true,
        jointRounded: true,
      }),

    // Layer 9: Real-Time AIS Vessels with COLREGs Collision Hazard Halos
    aisVisible &&
      new ScatterplotLayer({
        id: "ais-vessel-fleet",
        data: vessels,
        getPosition: (d: any) => [d.lon, d.lat],
        getRadius: (d: any) => (d.risk_level === "CRITICAL" ? 3500 : 2000),
        getFillColor: (d: any) => {
          if (d.risk_level === "CRITICAL") return [239, 68, 68, 240]; // Crimson Red
          if (d.risk_level === "CAUTION") return [245, 158, 11, 220]; // Amber
          return [56, 189, 248, 200]; // Sky Blue Safe
        },
        stroked: true,
        getLineColor: [255, 255, 255, 220],
        lineWidthMinPixels: 1.5,
        pickable: true,
      }),

    // Layer 10: Selected Coordinate Radar Reticle
    selectedCoord &&
      new ScatterplotLayer({
        id: "selected-coordinate-reticle",
        data: [{ position: selectedCoord }],
        getPosition: (d: any) => d.position,
        getRadius: 6000,
        stroked: true,
        filled: false,
        getLineColor: [255, 255, 255, 240],
        lineWidthMinPixels: 2,
      }),
  ].filter(Boolean);
}
```

---

## 7. Master Dataset APIs & Backend Integration Registry

All backend services run on `http://localhost:8000`. The frontend communicates with the gateway via structured REST requests and persistent Server-Sent Events (SSE).

### Gateway Endpoints Summary:

```text
┌──────────────────────────────────┬────────┬──────────────────────────────────────────────┐
│ Endpoint                         │ Method │ Purpose                                      │
├──────────────────────────────────┼────────┼──────────────────────────────────────────────┤
│ /                                │ GET    │ Backend health check & active subsystem state│
│ /api/v1/chat/stream              │ POST   │ Multi-agent SSE streaming (thoughts + output)│
│ /api/v1/agent/chat               │ POST   │ Synchronous multi-agent reasoning turn       │
│ /api/v1/navigation/optimal-route │ POST   │ Vector-assisted dynamic A* route calculation │
│ /api/v1/navigation/vectors       │ GET    │ Preloaded surface current & wind vector grid │
│ /api/v1/ocean/telemetry          │ GET    │ Point SST, Chlorophyll, SWH & PFZ clusters   │
│ /api/v1/risk/geofence            │ GET    │ PostGIS IMBL proximity & Marine Park check   │
│ /api/v1/traffic/vessels          │ GET    │ Active AIS fleet with dynamic COLREGs evals  │
│ /api/v1/traffic/stream           │ GET    │ Live 2-second SSE vessel GeoJSON updates     │
│ /api/v1/navigation/colregs-eval  │ POST   │ CPA/TCPA & COLREGs Rule 13/14/15 evaluator   │
│ /api/v1/navigation/dynamic-route │ POST   │ Dynamic moving-domain COLREGs route solver   │
└──────────────────────────────────┴────────┴──────────────────────────────────────────────┘
```

---

### Detailed Endpoint Specifications & Payloads:

#### 1. Multi-Agent Reasoning Stream (`POST /api/v1/chat/stream`)

- **Headers:** `Content-Type: application/json`, `Accept: text/event-stream`
- **Request Body (`ChatRequest`):**
  ```json
  {
    "message": "Where is the best place to fish tuna near Veraval with current assistance?",
    "thread_id": "session-101",
    "user_role": "navigator",
    "format_mode": "conversational",
    "active_basin": "arabian_sea",
    "origin_coordinates": [20.902, 70.368],
    "target_coordinates": [20.652, 70.118]
  }
  ```
- **SSE Event Stream:**
  ```text
  data: {"type": "thought", "agent": "supervisor", "text": "Routing for persona: NAVIGATOR | Basin: arabian_sea"}
  data: {"type": "thought", "agent": "ocean_analytics", "text": "Executing worker node: ocean_analytics"}
  data: {"type": "chunk", "text": "🚨 **SAFETY STATUS & SEA CONDITION**\n- Go/No-Go: 🟢 SAFE TO VENTURE\n- Wave Height: 1.6m\n"}
  data: {"type": "complete", "result": {...}, "geojson": {"type": "FeatureCollection", "features": [...]}}
  ```

#### 2. Vector-Assisted Route Planner (`POST /api/v1/navigation/optimal-route`)

- **Request Body (`OptimalRouteRequest`):**
  ```json
  {
    "start": [20.902, 70.368],
    "destination": [20.652, 70.118],
    "speed_knots": 10.0
  }
  ```
- **Response Body (`GeoJSON Feature`):**
  ```json
  {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [70.368, 20.902],
        [70.24, 20.78],
        [70.118, 20.652]
      ]
    },
    "properties": {
      "distance_nautical_miles": 24.6,
      "total_time_hours": 2.1,
      "estimated_fuel_savings_percent": 18.4,
      "route_type": "current_optimized"
    }
  }
  ```

#### 3. Ocean Telemetry & PFZ Clusters (`GET /api/v1/ocean/telemetry`)

- **Query Parameters:** `lat=20.902`, `lon=70.368`
- **Response Body:**
  ```json
  {
    "coordinates": [20.902, 70.368],
    "telemetry": {
      "sst_celsius": 28.4,
      "chlorophyll_mg_m3": 1.26,
      "significant_wave_height_m": 1.6
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

#### 4. Sovereign Geofencing & Risk Audit (`GET /api/v1/risk/geofence`)

- **Query Parameters:** `lat=21.65`, `lon=69.60`
- **Response Body:**
  ```json
  {
    "coordinates": [21.65, 69.6],
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
      "sanctuary_name": null
    },
    "cyclone_check": {
      "warning_active": false,
      "bulletin": "Nominal seasonal sea conditions."
    }
  }
  ```

#### 5. Live AIS Fleet Traffic & Dynamic COLREGs (`GET /api/v1/traffic/vessels`)

- **Query Parameters (Optional for Own-Ship relative CPA):** `lat=18.92`, `lon=72.82`, `own_sog=10.0`, `own_cog=220.0`, `radius_nm=50.0`
- **Response Body (`FeatureCollection`):**
  ```json
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [72.45, 18.6] },
        "properties": {
          "mmsi": 419001004,
          "name": "MV MAERSK BHARAT",
          "ship_type": "Cargo",
          "sog_knots": 14.2,
          "cog_deg": 165.0,
          "flag": "IND",
          "cpa_nm": 1.4,
          "tcpa_minutes": 16.8,
          "collision_risk_index": 0.72,
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

## 8. Global State Management (Zustand) & Data Services Architecture

To avoid unnecessary React re-renders while streaming agent output and panning high-precision maps, manage global state with **Zustand**:

```typescript
// orca-frontend/src/lib/store.ts
import { create } from "zustand";

export interface OrcaState {
  // Navigation & Personas
  userRole: "navigator" | "researcher" | "defense" | "student" | "visitor";
  activeBasin: "arabian_sea" | "bay_of_bengal" | "lakshadweep" | "andaman";
  language: "EN" | "HI" | "GU" | "TA" | "ML" | "TE" | "BN";

  // Map Viewport
  viewport: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  selectedCoordinates: [number, number] | null;

  // Active Map Layers
  layers: {
    sst: boolean;
    currents: boolean;
    pfz: boolean;
    imbl: boolean;
    ais: boolean;
    route: boolean;
    bathymetry3D: boolean;
  };

  // Telemetry Cache
  telemetry: any | null;
  riskAssessment: any | null;
  activeRoute: any | null;
  vessels: any[];

  // Actions
  setUserRole: (role: OrcaState["userRole"]) => void;
  setActiveBasin: (basin: OrcaState["activeBasin"]) => void;
  setLanguage: (lang: OrcaState["language"]) => void;
  setViewport: (vp: Partial<OrcaState["viewport"]>) => void;
  setSelectedCoordinates: (coords: [number, number] | null) => void;
  toggleLayer: (layerKey: keyof OrcaState["layers"]) => void;
  setTelemetry: (data: any) => void;
  setRiskAssessment: (data: any) => void;
  setActiveRoute: (route: any) => void;
  setVessels: (vessels: any[]) => void;
}

export const useOrcaStore = create<OrcaState>((set) => ({
  userRole: "navigator",
  activeBasin: "arabian_sea",
  language: "EN",
  viewport: {
    longitude: 70.368,
    latitude: 20.902,
    zoom: 7.2,
    pitch: 25,
    bearing: 0,
  },
  selectedCoordinates: [70.368, 20.902],
  layers: {
    sst: true,
    currents: true,
    pfz: true,
    imbl: true,
    ais: true,
    route: true,
    bathymetry3D: true,
  },
  telemetry: null,
  riskAssessment: null,
  activeRoute: null,
  vessels: [],

  setUserRole: (userRole) => set({ userRole }),
  setActiveBasin: (activeBasin) => set({ activeBasin }),
  setLanguage: (language) => set({ language }),
  setViewport: (vp) => set((s) => ({ viewport: { ...s.viewport, ...vp } })),
  setSelectedCoordinates: (selectedCoordinates) => set({ selectedCoordinates }),
  toggleLayer: (k) =>
    set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  setTelemetry: (telemetry) => set({ telemetry }),
  setRiskAssessment: (riskAssessment) => set({ riskAssessment }),
  setActiveRoute: (activeRoute) => set({ activeRoute }),
  setVessels: (vessels) => set({ vessels }),
}));
```

---

## 9. Summary & Action Checklist for Frontend Engineering

When building or updating the UI pages:

1. **Verify Base Layouts:**
   - Keep navigation global and clean (`CommandPortalLayout.tsx`).
   - Use `MapLibre GL JS` with CARTO Dark Matter and Deck.GL interleaved canvas.
2. **Mount Data Services:**
   - Initialize `fetchOceanData()` in `oceanDataService.ts` on initial mount to populate Open-Meteo weather nodes, ocean current vectors, and PFZ points.
   - Start the AIS vessel WebSocket or SSE stream (`aisStream.ts` / `/api/v1/traffic/stream`).
3. **Bind Chat to Streaming Endpoint:**
   - Use `fetch` streaming reader against `POST /api/v1/chat/stream` to stream token chunks and LangGraph thoughts into the chat UI.
4. **Coordinate Click Synchronization:**
   - On map click, update `selectedCoordinates`, fly the viewport, and trigger concurrent calls to `/api/v1/ocean/telemetry` and `/api/v1/risk/geofence`.
5. **Implement Role-Based Theming & Widgets:**
   - Render the appropriate HUD cards, alert thresholds, and language translations depending on whether the user selects `navigator`, `researcher`, `defense`, `student`, or `visitor`.

_Document maintained by Project ORCA Frontend & AI Engineering Core._

research agent

research on report format
