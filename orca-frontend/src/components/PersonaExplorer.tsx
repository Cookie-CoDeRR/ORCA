"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Microscope,
  User,
  GraduationCap,
  Anchor,
  ShieldAlert,
  Waves,
  Fish,
  Compass,
  FileText,
  Activity,
  ArrowRight,
  TrendingDown,
  CloudRain,
  Database,
  Lock,
} from "lucide-react";

interface PersonaConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  parameters: { name: string; value: string; unit: string; desc: string }[];
  keyCapabilities: string[];
  sampleQuery: string;
  ctaText: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: "researcher",
    title: "Marine Researcher",
    subtitle: "Oceanographic raster analysis & biological productivity modeling",
    icon: Microscope,
    badge: "Scientific Telemetry",
    parameters: [
      { name: "SST Thermal Gradient", value: "0.083°", unit: "Grid Slicing", desc: "Sub-kilometer front boundary detection" },
      { name: "Chlorophyll-a Front", value: "1.26", unit: "mg/m³", desc: "Phytoplankton bloom concentration" },
      { name: "Significant Wave Height", value: "1.61", unit: "Meters", desc: "Copernicus VHM0 wave spectrum" },
      { name: "Carbon Flux Sink", value: "-0.42", unit: "mol C/m²/yr", desc: "Ocean-atmosphere CO2 exchange" },
    ],
    keyCapabilities: [
      "Direct NetCDF & xarray multidimensional spatial raster slicing",
      "Thermal boundary & primary productivity front correlation calculus",
      "Real-time INCOIS / Copernicus data layer comparisons",
    ],
    sampleQuery: "Extract SST thermal front coordinates and chlorophyll-a density within the Saurashtra shelf break.",
    ctaText: "Launch Scientific Radar",
  },
  {
    id: "visitor",
    title: "Coastal Citizen & Visitor",
    subtitle: "Recreational sea state safety, beach weather & marine wildlife",
    icon: User,
    badge: "Public Safety",
    parameters: [
      { name: "Recreational Sea State", value: "Calm", unit: "Grade 2", desc: "Safe for nearshore boating & swimming" },
      { name: "Beach Wind Gusts", value: "14.2", unit: "km/h", desc: "Mild onshore breeze" },
      { name: "IMD Cyclone Alert", value: "Clear", unit: "Zero Risk", desc: "No active depression in Arabian Sea" },
      { name: "Marine Sanctuary", value: "Protected", unit: "Wildlife", desc: "Gulf of Mannar Dugong reserve" },
    ],
    keyCapabilities: [
      "Real-time surf and wave height advisories for nearshore recreation",
      "Instant IMD coastal weather and cyclone early warnings",
      "Marine wildlife habitat protection guidelines and no-trawl zones",
    ],
    sampleQuery: "Is it safe for recreational boating 5km off Mumbai coast today, and are wave heights under 1.5m?",
    ctaText: "View Public Coastal Safety",
  },
  {
    id: "learner",
    title: "Oceanography Student & Learner",
    subtitle: "Interactive physics formulations, AI architecture & taxonomy",
    icon: GraduationCap,
    badge: "Academic Sandbox",
    parameters: [
      { name: "Vector Formula", value: "V_g = V_s + V_c + K_w·V_w", unit: "Kinematics", desc: "Ship drift and aerodynamic drag" },
      { name: "Taxonomy Database", value: "1,420+", unit: "Species", desc: "Indian EEZ commercial pelagics" },
      { name: "Swarm Reduction", value: "6 Nodes", unit: "LangGraph", desc: "Deterministic air-gapped workers" },
      { name: "PostGIS Precision", value: "Sub-Meter", unit: "Spatial", desc: "ST_Distance spherical math" },
    ],
    keyCapabilities: [
      "Step-by-step breakdown of continuous Eulerian A* routing over vector fields",
      "Explore local open-weight AI (Qwen 2.5 7B & BGE-M3) LangGraph reducer state",
      "Interactive pelagic taxonomy with diurnal feeding migration timelines",
    ],
    sampleQuery: "How does ocean current velocity alter vessel Speed Over Ground (SOG) using the vector addition formula?",
    ctaText: "Explore Sandbox Models",
  },
  {
    id: "navigator",
    title: "Commercial Fleet Navigator",
    subtitle: "Fuel-optimal routing, statutory monsoon bans & port SOPs",
    icon: Anchor,
    badge: "Fleet Logistics",
    parameters: [
      { name: "Transit Fuel Delta", value: "22.0%", unit: "Savings", desc: "Assisting current eddy riding" },
      { name: "Route Distance", value: "18.0", unit: "Nautical Miles", desc: "Continuous A* pathing" },
      { name: "Monsoon Fishing Ban", value: "Strict", unit: "61 Days", desc: "Active West Coast June 1 - July 31" },
      { name: "Coast Guard VHF", value: "Ch 16", unit: "156.80 MHz", desc: "Mandatory emergency listening watch" },
    ],
    keyCapabilities: [
      "Dynamic A* vector pathfinding computing multi-segment waypoint courses",
      "Automated compliance verification against Department of Fisheries circulars",
      "Projected diesel conservation and trip cost savings in Indian Rupees (₹)",
    ],
    sampleQuery: "Plot a fuel-optimal route from Sassoon Dock to Veraval PFZ considering current eddies and verify monsoon ban.",
    ctaText: "Plan Commercial Course",
  },
  {
    id: "defense",
    title: "Defense & Coast Guard Officer",
    subtitle: "Classified IMBL standoff radar, dark vessel drift & border alerts",
    icon: ShieldAlert,
    badge: "Restricted Clearance",
    parameters: [
      { name: "IMBL Standoff Distance", value: "45.0", unit: "Kilometers", desc: "Pakistan / Sri Lanka sovereign border" },
      { name: "Dark Vessel Intercept", value: "2.1 kts", unit: "Drift Vector", desc: "Projected 2-hour trajectory" },
      { name: "No-Trawl Violation", value: "0 Detected", unit: "Geofence", desc: "Marine Protected Sanctuary breach" },
      { name: "Air-Gapped Privacy", value: "100%", unit: "Zero Cloud", desc: "On-premise edge execution" },
    ],
    keyCapabilities: [
      "Sub-meter PostGIS spherical distance checks to sovereign maritime boundaries",
      "Hostile / drifting vessel trajectory simulation factored across surface currents",
      "Role-gated portal with classified situational awareness and restricted overlays",
    ],
    sampleQuery: "URGENT: Track unidentified drifting vessel at 23.15 N, 68.20 E and project time to Pakistan IMBL crossing.",
    ctaText: "Access Defense Portal",
  },
];

interface PersonaExplorerProps {
  onOpenAuth: (role: "researcher" | "visitor" | "learner" | "defense" | "navigator") => void;
}

export default function PersonaExplorer({ onOpenAuth }: PersonaExplorerProps) {
  const [selectedPersona, setSelectedPersona] = useState<PersonaConfig>(PERSONAS[0]);

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-zinc-950/80 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
            <Activity className="w-3.5 h-3.5 text-white" />
            <span>Targeted Mission Intelligence</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Tailored For Every Maritime Stakeholder
          </h3>
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Select a persona to inspect specific telemetry parameters & algorithms.
        </span>
      </div>

      {/* Persona Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-8">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPersona.id === p.id;
          const isDef = p.id === "defense";
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPersona(p)}
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
                <p className="text-xs font-bold leading-tight">{p.title.split(" ")[0]} {p.title.split(" ")[1]}</p>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{p.badge}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Persona Detail Box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPersona.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="p-6 md:p-8 rounded-2xl bg-zinc-900/60 border border-white/10 shadow-xl"
        >
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Telemetry Matrix */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white text-black">
                  <selectedPersona.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-bold text-white">{selectedPersona.title}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/15">
                      {selectedPersona.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{selectedPersona.subtitle}</p>
                </div>
              </div>

              {/* 4 Parameter Cards Grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {selectedPersona.parameters.map((param, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                      <span>{param.name}</span>
                      <span className="text-white font-semibold">{param.unit}</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-white tracking-tight">{param.value}</div>
                    <p className="text-[10px] text-zinc-500">{param.desc}</p>
                  </div>
                ))}
              </div>

              {/* Capabilities List */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Key Operational Capabilities:</span>
                <ul className="text-xs text-zinc-300 space-y-1.5">
                  {selectedPersona.keyCapabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-white font-bold">•</span>
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right 5 Columns: Interactive Query & CTA */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-black border border-white/10 space-y-5 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Simulated In-Flight Query</span>
                  <span className="text-[10px] font-mono text-zinc-500">Qwen 2.5 7B</span>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-200 leading-relaxed">
                  "{selectedPersona.sampleQuery}"
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <button
                  onClick={() => onOpenAuth(selectedPersona.id as any)}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-xl flex items-center justify-center space-x-2 cursor-pointer ${
                    selectedPersona.id === "defense"
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40"
                      : "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                  }`}
                >
                  <span>{selectedPersona.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <p className="text-[10px] text-zinc-500 text-center font-mono">
                  {selectedPersona.id === "defense"
                    ? "Requires authorized Coast Guard / Defense credentials"
                    : "Instant local session with tailored parameters"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
