"use client";

import React, { useState } from "react";
import {
  Database,
  Satellite,
  Calendar,
  Clock,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Layers,
  Search,
  ExternalLink,
  Activity,
  Waves,
  Filter,
  Eye,
  Sliders,
  Table,
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
  dimensions: string;
}

const EO_CATALOG: EODataset[] = [
  {
    id: "sst",
    name: "Sea Surface Temperature (SST)",
    sourceEntity: "MOSDAC / Copernicus Marine (OSTIA)",
    ingestionFrequency: "Daily (24h)",
    nativeResolution: "0.083° (~9 km)",
    coverage: "Indian Ocean EEZ (4°N - 28°N)",
    dataType: "Raster NetCDF",
    status: "ONLINE",
    lastSync: "Today, 04:30 UTC",
    cacheSize: "1.4 GB",
    variables: ["analysed_sst", "sst_anomaly", "sea_ice_fraction"],
    description: "High-resolution foundational temperature grid derived from satellite infrared and microwave radiometers for thermal front detection.",
    dimensions: "time: 1, lat: 288, lon: 480 (float32)",
  },
  {
    id: "chlorophyll",
    name: "Chlorophyll-a Biomass Concentration",
    sourceEntity: "Sentinel-3 / MOSDAC OLCI",
    ingestionFrequency: "Daily (24h)",
    nativeResolution: "300 m / 0.083°",
    coverage: "Continental Shelf & Offshore",
    dataType: "Raster NetCDF",
    status: "ONLINE",
    lastSync: "Today, 06:15 UTC",
    cacheSize: "890 MB",
    variables: ["CHL", "Kd490", "photosynthetically_available_radiation"],
    description: "Ocean color radiometry providing surface phytoplankton pigment density to pinpoint biological primary production zones.",
    dimensions: "time: 1, lat: 288, lon: 480 (float32)",
  },
  {
    id: "currents",
    name: "Zonal & Meridional Current Vectors (uo, vo)",
    sourceEntity: "INCOIS / Copernicus Ocean Physics",
    ingestionFrequency: "6-Hour Sync",
    nativeResolution: "0.083° Vector Grid",
    coverage: "Surface to 10m Depth Layer",
    dataType: "Raster NetCDF",
    status: "ONLINE",
    lastSync: "32 mins ago",
    cacheSize: "2.1 GB",
    variables: ["uo (eastward)", "vo (northward)", "surface_height_above_geoid"],
    description: "Eulerian ocean velocity fields driving hydrodynamic particle advection and fuel-optimal continuous A* routing paths.",
    dimensions: "time: 4, depth: 1, lat: 288, lon: 480",
  },
  {
    id: "swh",
    name: "Significant Wave Height & Period (SWH)",
    sourceEntity: "INCOIS ERDDAP / WaveWatch III",
    ingestionFrequency: "Hourly In-Situ",
    nativeResolution: "0.1° (~11 km)",
    coverage: "Arabian Sea & Bay of Bengal",
    dataType: "Point Telemetry",
    status: "ONLINE",
    lastSync: "8 mins ago",
    cacheSize: "340 MB",
    variables: ["VHM0 (wave height)", "VMDR (mean wave dir)", "VTPK (peak period)"],
    description: "Real-time surface wave energy spectrum determining small-craft operational thresholds and seafarer safety warnings.",
    dimensions: "station_id: 18, time: 24 (hourly)",
  },
  {
    id: "imbl_mpa",
    name: "IMBL Boundaries & Protected Marine Areas",
    sourceEntity: "Naval Hydrographic Office / MoEFCC",
    ingestionFrequency: "Static Statutory",
    nativeResolution: "Sub-meter Geodesic",
    coverage: "India-Pakistan & India-Sri Lanka",
    dataType: "Vector GeoJSON",
    status: "CACHED",
    lastSync: "Air-Gapped Local",
    cacheSize: "45 MB",
    variables: ["sovereignty_treaty_id", "buffer_radius_km", "restriction_tier"],
    description: "Authenticated maritime boundary coordinates and marine protected biodiversity reserves for real-time geofencing.",
    dimensions: "features: 14 polygons & treaty lines",
  },
  {
    id: "gebco_bathymetry",
    name: "GEBCO High-Res Bathymetry & Contours",
    sourceEntity: "GEBCO 2024 / INCOIS Hydrography",
    ingestionFrequency: "Annual Baseline",
    nativeResolution: "15 Arc-Seconds (~450 m)",
    coverage: "Indian Ocean Basin Bathymetry",
    dataType: "Bathymetric DEM",
    status: "CACHED",
    lastSync: "Air-Gapped Local",
    cacheSize: "4.8 GB",
    variables: ["elevation_meters", "continental_shelf_200m", "slope_gradient"],
    description: "Digital elevation model of seafloor contours, canyons, and 200m continental shelf break lines for bathymetric upwelling analysis.",
    dimensions: "elevation: 21600 x 43200 grid (GeoTIFF)",
  },
  {
    id: "ais_traffic",
    name: "Real-Time AIS Vessel Traffic Stream",
    sourceEntity: "AISStream.io / Coastal Radar Chain",
    ingestionFrequency: "Real-Time (2s)",
    nativeResolution: "Kinematic GPS Pips",
    coverage: "Indian Ocean Bounding Box",
    dataType: "Point Telemetry",
    status: "ONLINE",
    lastSync: "Live Stream Active",
    cacheSize: "620 MB",
    variables: ["mmsi", "sog_knots", "cog_deg", "cpa_nm", "tcpa_min", "colregs_rule"],
    description: "Live vessel transponder kinematic vectors with automated closest-point-of-approach (CPA/TCPA) collision risk evaluation.",
    dimensions: "vessels: dynamic in-memory cache",
  },
];

export default function DataHubView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [selectedDataset, setSelectedDataset] = useState<EODataset>(EO_CATALOG[0]);
  const [activeTimeOffset, setActiveTimeOffset] = useState<string>("0h");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredDatasets = EO_CATALOG.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sourceEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.variables.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === "ALL" || d.dataType === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleRefreshSync = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* ━━━ LEFT (65%): SEARCHABLE STRUCTURED DATASET TABLE ━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-hidden">
        {/* Top Data Sync Status Banner */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800 text-xs font-mono select-none">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>7/7 Feeds Synchronized</span>
            </span>
            <span className="text-slate-700">|</span>
            <span>Total Local Cache: <strong className="text-white">10.1 GB / 16.0 GB</strong></span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Last Air-Gap Sync: <span className="text-slate-200">Today, 04:30 UTC</span></span>
          </div>

          <button
            onClick={handleRefreshSync}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-xs font-mono"
            title="Poll upstream MOSDAC / INCOIS data endpoints"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Sync Feeds"}</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets by parameter, source, or NetCDF variable..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(["ALL", "Raster NetCDF", "Point Telemetry", "Vector GeoJSON"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  filterType === type
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {type === "ALL" ? "All Formats" : type.replace("Raster ", "").replace("Point ", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Structured Dataset Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px] select-none">
                <th className="py-2.5 px-4 font-semibold">Dataset Name</th>
                <th className="py-2.5 px-4 font-semibold">Source Entity</th>
                <th className="py-2.5 px-4 font-semibold">Coverage / Region</th>
                <th className="py-2.5 px-4 font-semibold">Cadence</th>
                <th className="py-2.5 px-4 font-semibold">Format</th>
                <th className="py-2.5 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredDatasets.map((dataset) => {
                const isSelected = selectedDataset.id === dataset.id;
                return (
                  <tr
                    key={dataset.id}
                    onClick={() => setSelectedDataset(dataset)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white font-medium border-l-2 border-l-cyan-400"
                        : "hover:bg-slate-900/50 text-slate-300"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-white text-xs">{dataset.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{dataset.nativeResolution}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{dataset.sourceEntity}</td>
                    <td className="py-3 px-4 text-slate-400">{dataset.coverage}</td>
                    <td className="py-3 px-4 text-slate-400">{dataset.ingestionFrequency}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {dataset.dataType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{dataset.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Time Scrubber Bar */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950 border-t border-slate-800 text-xs font-mono select-none">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-white">Temporal Frame:</span>
            <span className="text-cyan-300 font-semibold">{activeTimeOffset === "0h" ? "Real-Time Live (0h)" : `${activeTimeOffset} Forecast`}</span>
          </div>

          {/* Scrubber Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {["-48h", "-24h", "0h", "+24h", "+48h", "+72h"].map((offset) => (
              <button
                key={offset}
                onClick={() => setActiveTimeOffset(offset)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                  activeTimeOffset === offset
                    ? "bg-cyan-500 text-black font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {offset === "0h" ? "Live 0h" : offset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━ RIGHT (35%): SELECTED DATASET METADATA INSPECTOR ━━━━━━━━━━━━━ */}
      <div className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col bg-slate-950 p-5 md:p-6 overflow-y-auto space-y-5">
        {/* Header */}
        <div className="pb-3 border-b border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
              {selectedDataset.dataType}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Cache: {selectedDataset.cacheSize}
            </span>
          </div>
          <h3 className="text-sm md:text-base font-bold text-white leading-tight">
            {selectedDataset.name}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {selectedDataset.description}
          </p>
        </div>

        {/* Key Technical Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-[10px] text-slate-500 block uppercase">Source Agency</span>
            <span className="text-white font-semibold text-[11px] truncate block">{selectedDataset.sourceEntity}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-[10px] text-slate-500 block uppercase">Spatial Grid</span>
            <span className="text-white font-semibold text-[11px]">{selectedDataset.nativeResolution}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-[10px] text-slate-500 block uppercase">Update Cadence</span>
            <span className="text-white font-semibold text-[11px]">{selectedDataset.ingestionFrequency}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-[10px] text-slate-500 block uppercase">Sync Status</span>
            <span className="text-emerald-400 font-semibold text-[11px]">{selectedDataset.status}</span>
          </div>
        </div>

        {/* NetCDF / GeoJSON Exported Variables */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>Exported Numerical Variables (NetCDF4)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedDataset.variables.map((variable) => (
              <span
                key={variable}
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300"
              >
                {variable}
              </span>
            ))}
          </div>
        </div>

        {/* Array Dimensions */}
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
            Array Dimensions & Types
          </div>
          <div className="text-xs font-mono text-slate-200">
            {selectedDataset.dimensions}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 mt-auto">
          <button
            onClick={() => alert(`Tile layer for ${selectedDataset.name} is rendered on the Tactical Command Map.`)}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
          >
            <Eye className="h-4 w-4" />
            <span>View Tile Layer in Map</span>
          </button>

          <button
            onClick={() => alert(`Raw NetCDF Schema for ${selectedDataset.name}:\nDimensions: ${selectedDataset.dimensions}\nVariables: ${selectedDataset.variables.join(", ")}`)}
            className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Inspect Raw NetCDF Dimensions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
