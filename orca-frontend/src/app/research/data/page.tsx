"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3, Waves, Database, Download, Calendar, Filter,
  Layers, ArrowUpRight, CheckCircle2, Clock, MapPin,
  RefreshCw, Radio, HardDrive, Compass, ChevronDown,
  Info, ExternalLink, ArrowLeft, Sliders, ShieldCheck,
  Thermometer, FlaskConical
} from "lucide-react";

// ─── Telemetry Data Types ─────────────────────────────────────────────────────

type MetricType = "sst" | "chlorophyll" | "swh" | "thermocline";
type BasinType = "arabian_sea" | "bay_of_bengal" | "lakshadweep" | "andaman";

interface DataPoint {
  time: string;
  value: number;
  baseline: number;
  label: string;
}

interface DepthPoint {
  depth: number; // meters (0 to 400)
  temp: number;  // °C
  salinity: number; // PSU
}

interface DatasetItem {
  id: string;
  name: string;
  agency: string;
  format: "NetCDF4" | "GeoTIFF (COG)" | "CSV / ASCII" | "JSON";
  resolution: string;
  frequency: string;
  size: string;
  coverage: string;
  lastUpdated: string;
  downloadUrl: string;
  parameters: string[];
}

interface OceanBuoy {
  id: string;
  name: string;
  basin: string;
  lat: number;
  lon: number;
  sst1m: number;
  sst5m: number;
  airTemp: number;
  windSpeed: number;
  swh: number;
  battery: number;
  status: "ONLINE" | "STANDBY" | "ALERT";
  lastUplink: string;
}

// ─── Mock Datasets & Time-Series ──────────────────────────────────────────────

const SST_SERIES: DataPoint[] = [
  { time: "00:00", value: 28.1, baseline: 27.8, label: "00:00 IST" },
  { time: "03:00", value: 27.9, baseline: 27.7, label: "03:00 IST" },
  { time: "06:00", value: 28.0, baseline: 27.7, label: "06:00 IST" },
  { time: "09:00", value: 28.3, baseline: 27.9, label: "09:00 IST" },
  { time: "12:00", value: 28.7, baseline: 28.2, label: "12:00 IST" },
  { time: "15:00", value: 28.9, baseline: 28.3, label: "15:00 IST" },
  { time: "18:00", value: 28.6, baseline: 28.1, label: "18:00 IST" },
  { time: "21:00", value: 28.4, baseline: 27.9, label: "21:00 IST" },
];

const CHL_SERIES: DataPoint[] = [
  { time: "00:00", value: 1.12, baseline: 0.95, label: "00:00 IST" },
  { time: "03:00", value: 1.15, baseline: 0.94, label: "03:00 IST" },
  { time: "06:00", value: 1.22, baseline: 0.96, label: "06:00 IST" },
  { time: "09:00", value: 1.34, baseline: 0.98, label: "09:00 IST" },
  { time: "12:00", value: 1.38, baseline: 1.02, label: "12:00 IST" },
  { time: "15:00", value: 1.31, baseline: 1.01, label: "15:00 IST" },
  { time: "18:00", value: 1.26, baseline: 0.98, label: "18:00 IST" },
  { time: "21:00", value: 1.19, baseline: 0.96, label: "21:00 IST" },
];

const SWH_SERIES: DataPoint[] = [
  { time: "00:00", value: 1.8, baseline: 1.5, label: "00:00 IST" },
  { time: "03:00", value: 1.7, baseline: 1.5, label: "03:00 IST" },
  { time: "06:00", value: 1.6, baseline: 1.4, label: "06:00 IST" },
  { time: "09:00", value: 1.5, baseline: 1.4, label: "09:00 IST" },
  { time: "12:00", value: 1.6, baseline: 1.5, label: "12:00 IST" },
  { time: "15:00", value: 1.8, baseline: 1.6, label: "15:00 IST" },
  { time: "18:00", value: 1.7, baseline: 1.6, label: "18:00 IST" },
  { time: "21:00", value: 1.6, baseline: 1.5, label: "21:00 IST" },
];

const DEPTH_PROFILE: DepthPoint[] = [
  { depth: 0,   temp: 28.4, salinity: 35.4 },
  { depth: 20,  temp: 28.2, salinity: 35.5 },
  { depth: 40,  temp: 27.6, salinity: 35.6 }, // Thermocline onset
  { depth: 60,  temp: 24.8, salinity: 35.8 },
  { depth: 80,  temp: 21.2, salinity: 36.1 },
  { depth: 100, temp: 18.5, salinity: 36.2 },
  { depth: 140, temp: 15.2, salinity: 35.9 },
  { depth: 200, temp: 13.0, salinity: 35.5 },
  { depth: 300, temp: 11.2, salinity: 35.2 },
  { depth: 400, temp: 9.8,  salinity: 35.0 },
];

const DATASETS: DatasetItem[] = [
  {
    id: "ds-1",
    name: "INCOIS High-Resolution SST Analysis (9km Daily)",
    agency: "INCOIS / MoES",
    format: "NetCDF4",
    resolution: "0.083° (~9 km)",
    frequency: "Daily (06:00 IST)",
    size: "48.2 MB",
    coverage: "Indian Ocean (40°E–100°E, 15°S–30°N)",
    lastUpdated: "Today · 06:15 IST",
    downloadUrl: "#",
    parameters: ["analysed_sst", "analysis_error", "sea_ice_fraction", "mask"],
  },
  {
    id: "ds-2",
    name: "Sentinel-3 OLCI Ocean Color Chlorophyll-a Level-3",
    agency: "Copernicus / ESA & ISRO MOSDAC",
    format: "NetCDF4",
    resolution: "1 km Coastal Plume",
    frequency: "Daily Global Mosaic",
    size: "124.8 MB",
    coverage: "Indian EEZ & Coastal Shelf",
    lastUpdated: "Yesterday · 22:30 IST",
    downloadUrl: "#",
    parameters: ["CHL_NN", "CHL_OC4ME", "KD490", "photosynthetically_active_radiation"],
  },
  {
    id: "ds-3",
    name: "INCOIS SWAN Numerical Wave Model (Wave Spectra)",
    agency: "INCOIS Coastal Hazard Division",
    format: "NetCDF4",
    resolution: "0.1° (~11 km)",
    frequency: "3-Hourly Forecast",
    size: "86.4 MB",
    coverage: "Arabian Sea & Bay of Bengal",
    lastUpdated: "3 hours ago",
    downloadUrl: "#",
    parameters: ["significant_wave_height", "peak_period", "mean_wave_direction", "swell_height"],
  },
  {
    id: "ds-4",
    name: "Argo Float #2902189 Depth CTD Profile Time-Series",
    agency: "INCOIS National Argo Center (UNESCO-IOC)",
    format: "CSV / ASCII",
    resolution: "In-situ Vertical (0–2000m)",
    frequency: "10-Day Cycle",
    size: "6.2 MB",
    coverage: "Station 19.42°N, 68.85°E",
    lastUpdated: "3 days ago",
    downloadUrl: "#",
    parameters: ["depth_m", "temp_c", "salinity_psu", "dissolved_oxygen_umol"],
  },
  {
    id: "ds-5",
    name: "OSCAR Satellite Ocean Surface Currents Vector Grid",
    agency: "NASA JPL / NOAA CoastWatch",
    format: "GeoTIFF (COG)",
    resolution: "0.25° (~27 km)",
    frequency: "5-Day Average",
    size: "34.1 MB",
    coverage: "Global Tropical Indian Ocean",
    lastUpdated: "2 days ago",
    downloadUrl: "#",
    parameters: ["u_current_mps", "v_current_mps", "current_magnitude_kts"],
  },
];

const BUOY_FLEET: OceanBuoy[] = [
  {
    id: "AD02",
    name: "AD02 — North Arabian Sea Deep Mooring",
    basin: "Arabian Sea",
    lat: 20.84,
    lon: 69.18,
    sst1m: 28.4,
    sst5m: 28.1,
    airTemp: 29.2,
    windSpeed: 12.4,
    swh: 1.6,
    battery: 13.8,
    status: "ONLINE",
    lastUplink: "12 mins ago",
  },
  {
    id: "OB01",
    name: "OB01 — Veraval Shelf Boundary Buoy",
    basin: "Arabian Sea",
    lat: 20.45,
    lon: 70.32,
    sst1m: 28.6,
    sst5m: 28.3,
    airTemp: 29.8,
    windSpeed: 14.1,
    swh: 1.8,
    battery: 13.6,
    status: "ONLINE",
    lastUplink: "4 mins ago",
  },
  {
    id: "BD08",
    name: "BD08 — Central Bay of Bengal Plume Mooring",
    basin: "Bay of Bengal",
    lat: 13.52,
    lon: 84.18,
    sst1m: 29.2,
    sst5m: 28.9,
    airTemp: 30.1,
    windSpeed: 9.8,
    swh: 1.2,
    battery: 13.9,
    status: "ONLINE",
    lastUplink: "18 mins ago",
  },
  {
    id: "SW04",
    name: "SW04 — Lakshadweep Channel Buoy",
    basin: "Lakshadweep",
    lat: 10.12,
    lon: 72.85,
    sst1m: 29.4,
    sst5m: 29.1,
    airTemp: 30.4,
    windSpeed: 11.2,
    swh: 1.5,
    battery: 13.7,
    status: "ONLINE",
    lastUplink: "7 mins ago",
  },
];

const glassStyle = {
  background: "rgba(255, 255, 255, 0.98)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
} as React.CSSProperties;

export default function TelemetryHubPage() {
  const [metric, setMetric] = useState<MetricType>("sst");
  const [basin, setBasin] = useState<BasinType>("arabian_sea");
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [sliceBounds, setSliceBounds] = useState({ north: 24.5, south: 16.0, west: 65.0, east: 76.5 });
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  const activeSeries = useMemo(() => {
    switch (metric) {
      case "sst": return SST_SERIES;
      case "chlorophyll": return CHL_SERIES;
      case "swh": return SWH_SERIES;
      default: return SST_SERIES;
    }
  }, [metric]);

  const stats = useMemo(() => {
    if (metric === "thermocline") return null;
    const values = activeSeries.map((d) => d.value);
    const mean = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const min = +Math.min(...values).toFixed(2);
    const max = +Math.max(...values).toFixed(2);
    const delta = +(values[values.length - 1] - values[0]).toFixed(2);
    return { mean, min, max, delta };
  }, [activeSeries, metric]);

  const handleExportSlice = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 p-4 sm:p-6 lg:p-8 space-y-6 select-none">
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HEADER & BASIN SELECTOR BAR                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 border"
        style={glassStyle}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all bg-white hover:bg-blue-50 shadow-xs"
            style={{ borderColor: "#cbd5e1", color: "#2563eb" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Interactive 3D Globe</span>
          </Link>

          <div className="h-5 w-px bg-zinc-200 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-zinc-900">
                ORCA SCIENTIFIC TELEMETRY HUB
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                NetCDF4 / In-situ
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">
              Multi-mission satellite radiometry, coastal wave models & moored ocean buoy networks
            </div>
          </div>
        </div>

        {/* Right Controls: Basin & Sync Status */}
        <div className="flex items-center gap-3">
          <select
            value={basin}
            onChange={(e) => setBasin(e.target.value as BasinType)}
            className="bg-white text-xs font-mono text-zinc-800 border border-zinc-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer shadow-xs focus:border-blue-500"
          >
            <option value="arabian_sea">Arabian Sea (Northeastern Basin)</option>
            <option value="bay_of_bengal">Bay of Bengal (Central Basin)</option>
            <option value="lakshadweep">Lakshadweep Sea</option>
            <option value="andaman">Andaman & Nicobar Waters</option>
          </select>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono"
            style={{ background: "rgba(16, 185, 129, 0.10)", borderColor: "rgba(16, 185, 129, 0.30)", color: "#059669" }}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">LIVE TELEMETRY SYNC</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2D OCEAN PARAMETER CHARTS & CTD PROFILES                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Interactive Time-Series / Depth Graph */}
        <div className="lg:col-span-2 rounded-3xl p-6 border space-y-5" style={glassStyle}>
          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "sst", label: "SST 24h Trend", icon: Thermometer, unit: "°C" },
                { id: "chlorophyll", label: "Chlorophyll-a Plume", icon: FlaskConical, unit: "mg/m³" },
                { id: "swh", label: "Wave SWH Spectra", icon: Waves, unit: "m" },
                { id: "thermocline", label: "Thermocline Depth Cast", icon: Layers, unit: "0–400m" },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = metric === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setMetric(tab.id as MetricType); setHoveredPoint(null); }}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all hover:scale-105"
                    style={{
                      background: isActive ? "#2563eb" : "#ffffff",
                      border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0",
                      color: isActive ? "#ffffff" : "#475569",
                      boxShadow: isActive ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                    }}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Stat pill */}
            {stats && (
              <div className="text-xs font-mono text-zinc-500 flex items-center gap-3">
                <span>Mean: <strong className="text-zinc-900">{stats.mean}</strong></span>
                <span>Min: <strong className="text-blue-600">{stats.min}</strong></span>
                <span>Max: <strong className="text-amber-600">{stats.max}</strong></span>
              </div>
            )}
          </div>

          {/* Chart Display Area */}
          <div className="relative h-72 w-full rounded-2xl bg-white border border-zinc-200 p-4 flex flex-col justify-between overflow-hidden shadow-xs">
            
            {metric !== "thermocline" ? (
              // 2D Time Series SVG Chart
              <div className="relative w-full h-full">
                <svg viewBox="0 0 700 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Graticule Grid Lines */}
                  {[40, 90, 140, 190].map((y) => (
                    <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                  ))}

                  {/* Baseline dotted curve */}
                  <polyline
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    strokeOpacity="0.8"
                    points={activeSeries.map((d, i) => {
                      const x = (i / (activeSeries.length - 1)) * 680 + 10;
                      const minV = Math.min(...activeSeries.map((s) => s.baseline)) * 0.95;
                      const maxV = Math.max(...activeSeries.map((s) => s.baseline)) * 1.05;
                      const y = 200 - ((d.baseline - minV) / (maxV - minV)) * 150;
                      return `${x},${y}`;
                    }).join(" ")}
                  />

                  {/* Filled Area Gradient */}
                  <polygon
                    fill="url(#areaGradient)"
                    points={`10,210 ${activeSeries.map((d, i) => {
                      const x = (i / (activeSeries.length - 1)) * 680 + 10;
                      const minV = Math.min(...activeSeries.map((s) => s.value)) * 0.95;
                      const maxV = Math.max(...activeSeries.map((s) => s.value)) * 1.05;
                      const y = 200 - ((d.value - minV) / (maxV - minV)) * 150;
                      return `${x},${y}`;
                    }).join(" ")} 690,210`}
                  />

                  {/* Main Trend Line */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    points={activeSeries.map((d, i) => {
                      const x = (i / (activeSeries.length - 1)) * 680 + 10;
                      const minV = Math.min(...activeSeries.map((s) => s.value)) * 0.95;
                      const maxV = Math.max(...activeSeries.map((s) => s.value)) * 1.05;
                      const y = 200 - ((d.value - minV) / (maxV - minV)) * 150;
                      return `${x},${y}`;
                    }).join(" ")}
                  />

                  {/* Interactive Nodes */}
                  {activeSeries.map((d, i) => {
                    const x = (i / (activeSeries.length - 1)) * 680 + 10;
                    const minV = Math.min(...activeSeries.map((s) => s.value)) * 0.95;
                    const maxV = Math.max(...activeSeries.map((s) => s.value)) * 1.05;
                    const y = 200 - ((d.value - minV) / (maxV - minV)) * 150;

                    return (
                      <g key={d.time} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(d)}>
                        <circle cx={x} cy={y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        {hoveredPoint?.time === d.time && (
                          <circle cx={x} cy={y} r="12" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeOpacity="0.6" className="animate-ping" />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredPoint && (
                  <div
                    className="absolute top-4 right-4 p-3 rounded-xl border text-xs font-mono"
                    style={{ background: "rgba(255,255,255,0.98)", borderColor: "#93c5fd", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                  >
                    <div className="text-blue-600 font-bold">{hoveredPoint.label}</div>
                    <div className="text-zinc-800">In-Situ Value: <strong>{hoveredPoint.value}</strong></div>
                    <div className="text-zinc-500">Climatology Baseline: {hoveredPoint.baseline}</div>
                    <div className="text-amber-600 text-[10px] font-semibold">
                      Anomaly: {+(hoveredPoint.value - hoveredPoint.baseline).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Vertical Thermocline Cast Graph
              <div className="relative w-full h-full flex items-center justify-between px-6">
                <svg viewBox="0 0 600 220" className="w-full h-full">
                  {/* Layer markers */}
                  <rect x="0" y="10" width="600" height="30" fill="#3b82f6" fillOpacity="0.08" />
                  <text x="15" y="30" fill="#1d4ed8" fontSize="10" fontFamily="monospace" fontWeight="600">Epipelagic Mixed Layer (0–40m)</text>

                  <rect x="0" y="45" width="600" height="85" fill="#f59e0b" fillOpacity="0.08" />
                  <text x="15" y="70" fill="#b45309" fontSize="10" fontFamily="monospace" fontWeight="600">Thermocline Rim (40–160m) — Tuna Hunting Corridor</text>

                  <rect x="0" y="135" width="600" height="75" fill="#0284c7" fillOpacity="0.08" />
                  <text x="15" y="155" fill="#0369a1" fontSize="10" fontFamily="monospace" fontWeight="600">Mesopelagic Deep Core (160–400m)</text>

                  {/* Temperature curve across depth */}
                  <polyline
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2.5"
                    points={DEPTH_PROFILE.map((dp) => {
                      const x = ((dp.temp - 8) / (30 - 8)) * 500 + 50;
                      const y = (dp.depth / 400) * 190 + 15;
                      return `${x},${y}`;
                    }).join(" ")}
                  />

                  {/* Salinity curve across depth */}
                  <polyline
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    points={DEPTH_PROFILE.map((dp) => {
                      const x = ((dp.salinity - 34.5) / (36.5 - 34.5)) * 500 + 50;
                      const y = (dp.depth / 400) * 190 + 15;
                      return `${x},${y}`;
                    }).join(" ")}
                  />
                </svg>
                <div className="absolute bottom-2 right-4 flex items-center gap-4 text-[10px] font-mono">
                  <span className="text-amber-700 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Temperature (°C)</span>
                  <span className="text-blue-700 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Salinity (PSU)</span>
                </div>
              </div>
            )}
          </div>

          {/* Time axis labels */}
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 px-2">
            <span>00:00 IST</span>
            <span>03:00 IST</span>
            <span>06:00 IST</span>
            <span>09:00 IST</span>
            <span>12:00 IST</span>
            <span>15:00 IST</span>
            <span>18:00 IST</span>
            <span>21:00 IST</span>
          </div>
        </div>

        {/* Right 1 Col: Spatial Bounding-Box Slicer & Exporter */}
        <div className="rounded-3xl p-6 border space-y-4 flex flex-col justify-between" style={glassStyle}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4" />
                Spatial Extent Slicer
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                OGC WCS Subsetter
              </span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Extract clamped sub-grids from NetCDF4 and Cloud-Optimized GeoTIFF raster archives without downloading full gigabyte scenes.
            </p>

            {/* Bounding Box Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-zinc-200">
                <span className="text-[10px] text-zinc-500 block font-medium">North Lat (°N)</span>
                <input
                  type="number"
                  step="0.1"
                  value={sliceBounds.north}
                  onChange={(e) => setSliceBounds({ ...sliceBounds, north: +e.target.value })}
                  className="w-full bg-transparent text-zinc-900 font-bold outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-zinc-200">
                <span className="text-[10px] text-zinc-500 block font-medium">South Lat (°N)</span>
                <input
                  type="number"
                  step="0.1"
                  value={sliceBounds.south}
                  onChange={(e) => setSliceBounds({ ...sliceBounds, south: +e.target.value })}
                  className="w-full bg-transparent text-zinc-900 font-bold outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-zinc-200">
                <span className="text-[10px] text-zinc-500 block font-medium">West Lon (°E)</span>
                <input
                  type="number"
                  step="0.1"
                  value={sliceBounds.west}
                  onChange={(e) => setSliceBounds({ ...sliceBounds, west: +e.target.value })}
                  className="w-full bg-transparent text-zinc-900 font-bold outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-zinc-200">
                <span className="text-[10px] text-zinc-500 block font-medium">East Lon (°E)</span>
                <input
                  type="number"
                  step="0.1"
                  value={sliceBounds.east}
                  onChange={(e) => setSliceBounds({ ...sliceBounds, east: +e.target.value })}
                  className="w-full bg-transparent text-zinc-900 font-bold outline-none"
                />
              </div>
            </div>

            {/* Target Format */}
            <div className="p-3 rounded-xl bg-slate-50 border border-zinc-200 space-y-1 text-xs font-mono">
              <span className="text-[10px] text-zinc-500 block font-medium">Export Format:</span>
              <div className="flex gap-2">
                {["NetCDF4", "GeoTIFF", "CSV"].map((fmt, idx) => (
                  <span key={fmt} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${idx === 0 ? "bg-blue-600 border-blue-600 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"}`}>
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportSlice}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition shadow-md hover:bg-blue-700 disabled:opacity-40"
              style={{ background: "#2563eb", color: "#ffffff" }}
            >
              <Download className={`h-4 w-4 ${isExporting ? "animate-bounce" : ""}`} />
              <span>{isExporting ? "Slicing NetCDF Tile..." : "Export Clamped Slice"}</span>
            </button>

            {exportedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center font-mono text-xs text-emerald-700 flex items-center justify-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Dataset slice generated successfully!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* REAL-TIME IN-SITU MOORED OCEAN BUOY FLEET                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl p-6 border space-y-4" style={glassStyle}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-blue-600 uppercase font-bold flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5" />
              National Ocean Buoy Fleet Telemetry
            </div>
            <h3 className="text-xl font-bold text-zinc-900">
              Moored Buoy Network (INCOIS / NIOT)
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-600 flex items-center gap-1.5 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            4 Active Coastal Nodes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUOY_FLEET.map((buoy) => (
            <div
              key={buoy.id}
              className="rounded-2xl p-4 border border-zinc-200 bg-white shadow-xs space-y-3 transition-all hover:border-blue-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-blue-600">{buoy.id}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {buoy.status}
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-zinc-900 truncate">{buoy.name}</div>
                <div className="text-[10px] font-mono text-zinc-500">
                  {buoy.lat}°N, {buoy.lon}°E · {buoy.basin}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-zinc-100">
                <div>
                  <span className="text-[10px] text-zinc-500">SST (1m)</span>
                  <div className="font-bold text-amber-600">{buoy.sst1m}°C</div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Waves SWH</span>
                  <div className="font-bold text-blue-600">{buoy.swh}m</div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Wind Speed</span>
                  <div className="font-bold text-zinc-800">{buoy.windSpeed} kts</div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500">Battery</span>
                  <div className="font-bold text-emerald-600">{buoy.battery} V</div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-zinc-400 pt-1 flex items-center justify-between">
                <span>Uplink: {buoy.lastUplink}</span>
                <span className="text-blue-600 font-semibold">INSAT-3D</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EARTH OBSERVATION SCIENTIFIC DATASET CATALOG                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl p-6 border space-y-4" style={glassStyle}>
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
          <div>
            <div className="text-xs font-mono text-blue-600 uppercase font-bold flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              Sovereign Earth Observation Archives
            </div>
            <h3 className="text-xl font-bold text-zinc-900">
              Scientific Datasets & Raster Slices
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">5 Products Indexed</span>
        </div>

        <div className="space-y-3">
          {DATASETS.map((ds) => (
            <div
              key={ds.id}
              className="rounded-2xl p-4 sm:p-5 border border-zinc-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    {ds.format}
                  </span>
                  <span className="text-amber-700 font-semibold">{ds.agency}</span>
                  <span className="text-zinc-500">· {ds.resolution}</span>
                  <span className="text-emerald-600 font-medium">· {ds.size}</span>
                </div>

                <h4 className="text-base font-bold text-zinc-900 hover:text-blue-600 transition">
                  {ds.name}
                </h4>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ds.parameters.map((p) => (
                    <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(ds, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${ds.id}_metadata.json`;
                    a.click();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 transition shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Product</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
