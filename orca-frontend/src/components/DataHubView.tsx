"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Satellite,
  Calendar,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Layers,
  Search,
  ExternalLink,
  Sliders,
  Activity,
  Info,
  Waves,
  Mountain,
  Fish,
} from "lucide-react";

interface EODataset {
  id: string;
  name: string;
  sourceEntity: string;
  ingestionFrequency: string;
  nativeResolution: string;
  coverage: string;
  dataType: "Raster NetCDF" | "Vector GeoJSON" | "Point Telemetry" | "Bathymetric DEM";
  status: "ONLINE" | "CACHED" | "SYNCING";
  lastSync: string;
  cacheSize: string;
  variables: string[];
  description: string;
}

const EO_CATALOG: EODataset[] = [
  {
    id: "sst",
    name: "Sea Surface Temperature (SST)",
    sourceEntity: "MOSDAC / Copernicus Marine (OSTIA)",
    ingestionFrequency: "Daily (24-Hour Sync)",
    nativeResolution: "0.083° (~9 km)",
    coverage: "Full Indian Ocean EEZ (4°N - 28°N)",
    dataType: "Raster NetCDF",
    status: "ONLINE",
    lastSync: "Today, 04:30 UTC",
    cacheSize: "1.4 GB",
    variables: ["analysed_sst", "sst_anomaly", "sea_ice_fraction"],
    description: "High-resolution foundational temperature grid derived from satellite infrared and microwave radiometers for thermal front detection.",
  },
  {
    id: "chlorophyll",
    name: "Chlorophyll-a Biomass Concentration",
    sourceEntity: "Sentinel-3 / MOSDAC OLCI",
    ingestionFrequency: "1-Day Composite",
    nativeResolution: "300 m / 0.083° Grid",
    coverage: "Coastal & Offshore Continental Shelf",
    dataType: "Raster NetCDF",
    status: "ONLINE",
    lastSync: "Today, 06:15 UTC",
    cacheSize: "890 MB",
    variables: ["CHL", "Kd490", "photosynthetically_available_radiation"],
    description: "Ocean color radiometry providing surface phytoplankton pigment density to pinpoint biological primary production zones.",
  },
  {
    id: "currents",
    name: "Zonal & Meridional Current Vectors (uo, vo)",
    sourceEntity: "INCOIS / Copernicus Global Ocean Physics",
    ingestionFrequency: "6-Hour Forecast Sync",
    nativeResolution: "0.083° Vector Grid",
    coverage: "Surface to 10m Depth Layer",
    dataType: "Raster NetCDF",
    status: "ONLINE",
    lastSync: "32 mins ago",
    cacheSize: "2.1 GB",
    variables: ["uo (eastward)", "vo (northward)", "surface_height_above_geoid"],
    description: "Eulerian ocean velocity fields driving hydrodynamic particle advection and fuel-optimal continuous A* routing paths.",
  },
  {
    id: "swh",
    name: "Significant Wave Height & Period (SWH)",
    sourceEntity: "INCOIS ERDDAP / Open-Meteo WaveWatch",
    ingestionFrequency: "Hourly In-Situ & Model",
    nativeResolution: "0.1° (~11 km)",
    coverage: "Arabian Sea & Bay of Bengal Basins",
    dataType: "Point Telemetry",
    status: "ONLINE",
    lastSync: "8 mins ago",
    cacheSize: "340 MB",
    variables: ["VHM0 (wave height)", "VMDR (mean wave dir)", "VTPK (peak period)"],
    description: "Real-time surface wave energy spectrum determining small-craft operational thresholds and seafarer safety warnings.",
  },
  {
    id: "imbl_mpa",
    name: "Sovereign Maritime Boundaries & MPAs",
    sourceEntity: "Ministry of Environment / MEA / IHO",
    ingestionFrequency: "Static Curated Database",
    nativeResolution: "Sub-Meter Vector Polygons",
    coverage: "India-Pak & India-SL IMBL, EEZ, Coral Reserves",
    dataType: "Vector GeoJSON",
    status: "CACHED",
    lastSync: "Persistent PostGIS Table",
    cacheSize: "68 MB",
    variables: ["geom_polygon", "standoff_buffer_m", "treaty_reference"],
    description: "Authoritative spatial boundary datasets used for deterministic border standoff warnings and Marine Protected Area enforcement.",
  },
  {
    id: "biodiversity",
    name: "Marine Biodiversity Occurrences (IndOBIS)",
    sourceEntity: "IndOBIS / CMLRE Kochi",
    ingestionFrequency: "Monthly Batch Archive",
    nativeResolution: "425,000+ Point Records",
    coverage: "Exclusive Economic Zone & High Seas",
    dataType: "Vector GeoJSON",
    status: "ONLINE",
    lastSync: "Aug 15, 2026",
    cacheSize: "512 MB",
    variables: ["scientific_name", "aphia_id", "depth_m", "occurrence_date"],
    description: "Authentic biological database cataloging commercial pelagic species, coral habitats, and endangered cetacean sightings.",
  },
  {
    id: "dem_bathymetry",
    name: "3D Global Bathymetric Relief (Terrarium)",
    sourceEntity: "AWS Open Data / GEBCO / ETOPO1",
    ingestionFrequency: "Static 256px Tile Pyramids",
    nativeResolution: "15-Arc-Second Grid",
    coverage: "Global Continental Shelf & Ocean Trenches",
    dataType: "Bathymetric DEM",
    status: "CACHED",
    lastSync: "Global Cached Raster Tile Pyramid",
    cacheSize: "4.8 GB",
    variables: ["elevation_m", "shelf_gradient", "trench_depth"],
    description: "Three-dimensional underwater elevation map powering MapLibre hillshading, 200m shelf contours, and seamount detection.",
  },
];

export default function DataHubView() {
  const [selectedDataset, setSelectedDataset] = useState<EODataset>(EO_CATALOG[0]);
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-black text-white">
      {/* LEFT: DATASET PROVENANCE CATALOG TABLE */}
      <div className="flex-1 flex flex-col h-full border-r border-white/10 overflow-y-auto p-6 space-y-6">
        {/* Header & Sync Status */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
              <Satellite className="h-3.5 w-3.5 text-sky-400" />
              <span>Earth Observation (EO) Data Hub</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Satellite Raster Catalog & Live Telemetry Ingestion
            </h3>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-xs font-mono text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>7 / 7 DATA FEEDS HEALTHY</span>
          </div>
        </div>

        {/* Interactive Temporal Scrubber Bar */}
        <div className="p-4 rounded-2xl border border-white/10 bg-zinc-950/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-white font-bold">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Interactive Temporal Timeline Scrubber</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Current Forecast Frame:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${timeOffsetHours === 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300"}`}>
                {timeOffsetHours === 0 ? "NOW (Live Satellite Observation)" : `${timeOffsetHours > 0 ? "+" : ""}${timeOffsetHours}h (${timeOffsetHours > 0 ? "Forecast" : "Historical Archive"})`}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayToggle}
              className="p-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition cursor-pointer"
              title={isPlaying ? "Pause Timeline" : "Play 72h Forecast Animation"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-black" />}
            </button>

            <div className="flex-1 relative">
              <input
                type="range"
                min={-48}
                max={72}
                step={6}
                value={timeOffsetHours}
                onChange={(e) => setTimeOffsetHours(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-1">
                <span>-48h (Historical)</span>
                <span>-24h</span>
                <span className="text-emerald-400 font-bold">0h (Live Sync)</span>
                <span>+24h</span>
                <span>+48h</span>
                <span>+72h (Forecast)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="font-bold text-white">Active Earth Observation Data Feeds ({EO_CATALOG.length})</span>
            <span>Click any dataset to inspect metadata</span>
          </div>

          <div className="space-y-2">
            {EO_CATALOG.map((ds) => {
              const isSelected = selectedDataset.id === ds.id;
              return (
                <div
                  key={ds.id}
                  onClick={() => setSelectedDataset(ds)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 border-white shadow-lg shadow-white/10"
                      : "bg-zinc-950/70 border-white/15 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-white">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{ds.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15">
                            {ds.dataType}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400">{ds.sourceEntity}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                        ● {ds.status}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500">{ds.nativeResolution}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: DATASET INSPECTION DETAIL DRAWER */}
      <div className="w-full md:w-[420px] lg:w-[460px] h-full flex flex-col bg-zinc-950 p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white">{selectedDataset.name}</h3>
            <p className="text-[10px] font-mono text-zinc-400">{selectedDataset.sourceEntity}</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md">
            {selectedDataset.cacheSize}
          </span>
        </div>

        {/* Description */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-black/60 text-xs text-zinc-300 leading-relaxed">
          {selectedDataset.description}
        </div>

        {/* Telemetry Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="p-3 rounded-xl border border-white/10 bg-black">
            <span className="text-zinc-500 block mb-1 font-mono text-[9px]">INGESTION FREQUENCY</span>
            <span className="text-white font-semibold">{selectedDataset.ingestionFrequency}</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-black">
            <span className="text-zinc-500 block mb-1 font-mono text-[9px]">NATIVE RESOLUTION</span>
            <span className="text-white font-semibold">{selectedDataset.nativeResolution}</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-black">
            <span className="text-zinc-500 block mb-1 font-mono text-[9px]">GEOSPATIAL COVERAGE</span>
            <span className="text-white font-semibold">{selectedDataset.coverage}</span>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-black">
            <span className="text-zinc-500 block mb-1 font-mono text-[9px]">LAST AIR-GAP SYNC</span>
            <span className="text-emerald-400 font-semibold">{selectedDataset.lastSync}</span>
          </div>
        </div>

        {/* Available Raster Variables */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-zinc-400 font-bold flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-sky-400" /> Exported NetCDF Data Variables
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedDataset.variables.map((v) => (
              <span key={v} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300">
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Cache Integrity & Indexing Gauge */}
        <div className="p-4 rounded-xl border border-white/10 bg-black space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white font-semibold">Local Storage Allocation</span>
            <span className="text-zinc-400">{selectedDataset.cacheSize} / 16.0 GB Total Cache</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-white/10">
            <div style={{ width: "35%" }} className="h-full bg-emerald-400" />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono block">
            HNSW pgvector index active · Sub-15ms vector retrieval verified.
          </span>
        </div>
      </div>
    </div>
  );
}
