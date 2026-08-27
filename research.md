# Project ORCA — Research & Scientific Foundation (SIH26176)

This document details the scientific references, academic papers, marine datasets, and mathematical formulations underpinning **Project ORCA (Ocean Resource & Coastal Advisory)**.

---

## 1. Multi-Agent Systems (MAS) & Orchestrated Reasoning

### 1.1 Orchestrated Reasoning with Collaborative Agents
- **Citation:** *ORCA: Orchestrated Reasoning with Collaborative Agents* (2026).
- **Core Concept:** Multi-agent architectures that divide complex decision processes into modular execution stages: intent decomposition, specialized tool routing, and collaborative synthesis.
- **Application in Project ORCA:** The LangGraph supervisor acts as the primary orchestrator, decomposing natural language user queries into parallel deterministic tasks (spatial risk validation and ocean raster analytics) and semantic retrieval (regulatory RAG).

### 1.2 Multi-Agent Collaboration Mechanisms
- **Citation:** *Multi-Agent Collaboration Mechanisms: A Survey of LLMs* (2025).
- **Core Concept:** Surveys how specialized, task-constrained agents outperform monolithic Large Language Models by eliminating hallucination loops and enabling verifiable sub-tasks.
- **Application in Project ORCA:** Enforces our core architectural rule: **"Deterministic engines for numerical and spatial calculations; LLMs strictly for semantic parsing and language synthesis."**

---

## 2. Marine Science & Oceanographic Data Sources

### 2.1 Potential Fishing Zone (PFZ) Identification Methodology
- **Reference:** *Indian National Centre for Ocean Information Services (INCOIS) PFZ Advisory WebGIS Manual*.
- **Scientific Principle:** Marine pelagic fish (such as Tuna, Mackerel, and Sardine) aggregate at oceanographic features like thermal fronts, oceanic eddies, and upwelling zones where chlorophyll-a concentrations are highest.
- **Mathematical Formulations for PFZ Detection:**
  1. **Sea Surface Temperature (SST) Thermal Gradient:**
     $$\|\nabla \text{SST}\| = \sqrt{\left(\frac{\partial \text{SST}}{\partial x}\right)^2 + \left(\frac{\partial \text{SST}}{\partial y}\right)^2} \ge 0.5^\circ\text{C / km}$$
  2. **Chlorophyll-a Concentration Threshold:**
     $$\text{Chl-}a \ge 0.3\,\text{mg/m}^3 \quad \text{with oceanic frontal intersection}$$
  3. **Wind & Wave Operational Envelope:**
     $$\text{SWH (Significant Wave Height)} \le 2.5\,\text{m}, \quad \text{Wind Speed} \le 20\,\text{knots}$$

### 2.2 Official Indian Satellite & Marine Feeds
- **MOSDAC (ISRO):**
  - High-resolution Sea Surface Temperature (INSAT-3D / 3DR) in NetCDF4 / HDF5.
  - Oceansat-3 Ocean Colour Monitor (OCM) Chlorophyll-a grids.
  - Scatterometer wind vector fields.
- **INCOIS ERDDAP Server:**
  - Real-time & forecasted Significant Wave Height (SWH).
  - Ocean Surface Current velocity vectors ($u, v$ components).
  - High-wave and swell surge warning bulletins.

---

## 3. Marine Visual Understanding & Species Archiving

### 3.1 Object Recognition and Marine Species Archiving
- **Citation:** *ORCA: Object Recognition and Comprehension for Archiving Marine Species* (WACV 2026).
- **Core Concept:** Multi-modal benchmark capturing morphology-oriented visual attributes across marine species for visual grounding and conservation tracking.
- **Application in Project ORCA:** Provides foundation for species-level catch advisory, juvenile mesh compliance checking, and future computer vision vessel catch analysis.

---

## 4. OGC Standards & Sovereign Geospatial Infrastructure

### 4.1 National Spatial Data Infrastructure (NSDI) Compliance
- **OGC Web Map Service (WMS):** Dynamically rendering raster tiles via TiTiler directly from S3/MinIO NetCDF archives.
- **OGC Web Feature Service (WFS):** Serving vector maritime boundaries, MPAs, and coastal gazetteers.
- **PostGIS Spatial SQL Calculations:** Geodesic distance checks using `ST_Distance` on WGS84 spheroids (`EPSG:4326` / `EPSG:3857`) for infallible border geofencing.
