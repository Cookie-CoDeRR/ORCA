"use client";

import React, { useState } from "react";
import {
  CloudRain,
  Waves,
  Fish,
  Mountain,
  Navigation,
  ShieldAlert,
  Sliders,
  Check,
  Info,
} from "lucide-react";

interface ParameterPillar {
  id: string;
  name: string;
  icon: any;
  shortDesc: string;
  parameters: { title: string; sensorSource: string; mathDesc: string }[];
  clearanceLevel: "Public" | "Scientific" | "Restricted Defense";
}

const PILLARS: ParameterPillar[] = [
  {
    id: "weather",
    name: "Weather & Atmosphere",
    icon: CloudRain,
    shortDesc: "Sea surface temperature, wave energy spectrums & cyclonic track alerts.",
    clearanceLevel: "Public",
    parameters: [
      { title: "Sea Surface Temperature (SST)", sensorSource: "Copernicus OSTIA / INSAT-3D", mathDesc: "High-resolution thermal grid (0.083°)" },
      { title: "Significant Wave Height (SWH)", sensorSource: "WaveWatch III / INCOIS", mathDesc: "VHM0 surface sea state spectrum" },
      { title: "Surface Wind Vectors (u10, v10)", sensorSource: "ECMWF ERA5 / IMD", mathDesc: "10-meter wind velocity & aerodynamic drag" },
      { title: "IMD Cyclone Alert Status", sensorSource: "India Meteorological Dept", mathDesc: "Tropical depression & storm track alerts" },
    ],
  },
  {
    id: "currents",
    name: "Sea Currents & Hydrodynamics",
    icon: Waves,
    shortDesc: "Eulerian eastward/northward velocities & dynamic vector navigation.",
    clearanceLevel: "Scientific",
    parameters: [
      { title: "Eastward Velocity (uo)", sensorSource: "Copernicus Mercator Ocean", mathDesc: "Zonal current velocity in meters/second" },
      { title: "Northward Velocity (vo)", sensorSource: "Copernicus Mercator Ocean", mathDesc: "Meridional current velocity in meters/second" },
      { title: "Speed Over Ground (SOG)", sensorSource: "ORCA Kinematic Engine", mathDesc: "V_ground = V_ship + V_current + K_wind·V_wind" },
      { title: "Ocean Eddy Drift Vector", sensorSource: "Altimetry SLA / Ssalto/Duacs", mathDesc: "Mesoscale anticyclonic eddy assist" },
    ],
  },
  {
    id: "marinelife",
    name: "Marine Life & PFZ Fisheries",
    icon: Fish,
    shortDesc: "Chlorophyll-a aggregation fronts, pelagic taxonomy & diurnal feeding windows.",
    clearanceLevel: "Public",
    parameters: [
      { title: "Chlorophyll-a Density", sensorSource: "MODIS-Aqua / Sentinel-3 OLCI", mathDesc: "Phytoplankton bloom concentration (mg/m³)" },
      { title: "PFZ Cluster Intersections", sensorSource: "INCOIS Climatology / ORCA AI", mathDesc: "Thermal front + chlorophyll spatial union" },
      { title: "Target Pelagic Taxonomy", sensorSource: "ICAR-CMFRI Marine Catalog", mathDesc: "Yellowfin Tuna, Mackerel, Ribbonfish classification" },
      { title: "Diurnal / Lunar Windows", sensorSource: "Biological Circadian Models", mathDesc: "Dawn/Dusk vertical plankton migration" },
    ],
  },
  {
    id: "resources",
    name: "Ocean Resources & Bathymetry",
    icon: Mountain,
    shortDesc: "3D DEM underwater topography, trench contours & benthic habitats.",
    clearanceLevel: "Scientific",
    parameters: [
      { title: "Global Terrarium DEM", sensorSource: "AWS Open Data / GEBCO", mathDesc: "High-resolution elevation & ocean bathymetry" },
      { title: "Shelf Break Contours", sensorSource: "ETOPO1 Global Relief", mathDesc: "200m depth shelf break gradient" },
      { title: "Benthic Substrate Map", sensorSource: "Geological Survey of India", mathDesc: "Seabed composition & mineral sediment" },
      { title: "Coral Reef Reserve Bounds", sensorSource: "Wildlife Institute of India", mathDesc: "Ecologically sensitive no-anchor zones" },
    ],
  },
  {
    id: "transport",
    name: "Ocean Transportation & Logistics",
    icon: Navigation,
    shortDesc: "Fuel-optimal continuous A* courses, port clearance & statutory bans.",
    clearanceLevel: "Public",
    parameters: [
      { title: "Fuel Delta Savings (%)", sensorSource: "Continuous A* Router", mathDesc: "15% to 22% fuel reduction via eddy assist" },
      { title: "Transit Duration (Hours)", sensorSource: "Kinematic Route Integrator", mathDesc: "Time-to-destination factoring drift" },
      { title: "Monsoon Fishing Ban Rules", sensorSource: "Dept of Fisheries Gazette", mathDesc: "61-day seasonal mechanized trawler ban" },
      { title: "Harbor Departure Clearance", sensorSource: "Major Port Authority SOPs", mathDesc: "AIS harbor node clearance verification" },
    ],
  },
  {
    id: "defense",
    name: "Defense & Maritime Sovereignty",
    icon: ShieldAlert,
    shortDesc: "Classified IMBL buffer standoff, dark vessel drift projection & border alerts.",
    clearanceLevel: "Restricted Defense",
    parameters: [
      { title: "IMBL Standoff Distance (km)", sensorSource: "PostGIS Spatial Engine", mathDesc: "Sub-meter spherical distance to Pakistan/Sri Lanka" },
      { title: "No-Trawl Zone Violation", sensorSource: "PostGIS ST_Intersects", mathDesc: "Real-time geofence polygon intersection" },
      { title: "Hostile Drift Projection", sensorSource: "Eulerian Particle Advection", mathDesc: "Projected intercept coordinates over current vectors" },
      { title: "Coast Guard VHF 16 SOP", sensorSource: "Indian Coast Guard Directives", mathDesc: "Toll-free 1554 & 156.800 MHz distress rules" },
    ],
  },
];

export default function ParameterMatrix() {
  const [selectedPillar, setSelectedPillar] = useState<ParameterPillar>(PILLARS[0]);

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-zinc-950/80 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
            <Sliders className="w-3.5 h-3.5 text-white" />
            <span>Comprehensive Telemetry Framework</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            6 Multi-Scale Oceanographic Parameter Pillars
          </h3>
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Click a parameter category to view active data sources and mathematical models.
        </span>
      </div>

      {/* Pillars Tab Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-8">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPillar.id === p.id;
          const isDef = p.id === "defense";
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPillar(p)}
              className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? isDef
                    ? "bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/20 text-white"
                    : "bg-white/10 border-white/40 shadow-lg shadow-white/5 text-white"
                  : "bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-white/20 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2 rounded-xl border ${
                    isSelected
                      ? isDef
                        ? "bg-rose-500 text-white border-rose-400"
                        : "bg-white text-black border-white"
                      : "bg-zinc-800 border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isDef && (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    RESTRICTED
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">{p.name.split(" ")[0]}</p>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{p.clearanceLevel.split(" ")[0]}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Pillar Detailed Grid */}
      <div className="p-6 md:p-8 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-black">
              <selectedPillar.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">{selectedPillar.name}</h4>
              <p className="text-xs text-zinc-400 mt-0.5">{selectedPillar.shortDesc}</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-mono border self-start sm:self-auto ${
              selectedPillar.clearanceLevel === "Restricted Defense"
                ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                : "bg-white/10 border-white/15 text-zinc-300"
            }`}
          >
            {selectedPillar.clearanceLevel}
          </span>
        </div>

        {/* 4 Parameter Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {selectedPillar.parameters.map((param, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white">{param.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                  {param.sensorSource}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950/80 p-2 rounded-lg border border-white/5">
                {param.mathDesc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
