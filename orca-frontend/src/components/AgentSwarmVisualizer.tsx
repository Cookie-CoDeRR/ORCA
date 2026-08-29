"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Waves,
  ShieldAlert,
  Compass,
  BookOpen,
  FileCheck,
  Zap,
  CheckCircle2,
  Database,
  Radio,
  Terminal,
} from "lucide-react";

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: string;
  icon: any;
  color: string;
  bgGlow: string;
  borderColor: string;
  description: string;
  inputs: string[];
  outputs: string[];
  latency: string;
  formula?: string;
}

const AGENTS: AgentInfo[] = [
  {
    id: "supervisor",
    name: "Supervisor Orchestrator",
    role: "Zero-Shot Intent Parsing & Task Graph Decomposer",
    model: "Qwen 2.5 7B (GGUF / Ollama)",
    icon: Cpu,
    color: "text-cyan-400",
    bgGlow: "from-cyan-500/20 to-blue-600/10",
    borderColor: "border-cyan-500/40",
    description: "Decomposes complex natural language queries into parallel deterministic worker execution graphs using strict Pydantic JSON schemas.",
    inputs: ["Raw Fishermen / Coast Guard Chat Query", "Extracted Target & Origin Coordinates [Lat, Lon]"],
    outputs: ["SubTaskPlan Schema", "Active Worker Agent Routing Sequence"],
    latency: "380ms",
  },
  {
    id: "ocean_analytics",
    name: "Ocean Analytics Node",
    role: "SST, Chlorophyll-a & PFZ Cluster Extractor",
    model: "xarray + Copernicus NetCDF Rasters",
    icon: Waves,
    color: "text-emerald-400",
    bgGlow: "from-emerald-500/20 to-teal-600/10",
    borderColor: "border-emerald-500/40",
    description: "Performs sub-second spatial multidimensional slicing over 0.083° Sea Surface Temperature and Chlorophyll-a grids to detect fish feeding thermal fronts.",
    inputs: ["Sector Bounding Box", "Climatology Rasters (.nc)"],
    outputs: ["SST & Chlorophyll Matrix", "High-Probability PFZ Clusters GeoJSON Points"],
    latency: "12ms (Native C/Rust)",
    formula: "PFZ_{conf} = \\sigma(\\alpha \\cdot \\nabla SST + \\beta \\cdot [Chl\\text{-}a])",
  },
  {
    id: "risk_geofencing",
    name: "Risk & Geofencing Node",
    role: "Sub-Meter Border Standoff & MPA Protection",
    model: "PostGIS Spatial Engine (ST_Distance / ST_Intersects)",
    icon: ShieldAlert,
    color: "text-rose-400",
    bgGlow: "from-rose-500/20 to-red-600/10",
    borderColor: "border-rose-500/40",
    description: "Runs spatial spherical distance calculations against India-Pakistan and India-Sri Lanka IMBL coordinates, triggering automatic proximity warnings.",
    inputs: ["Vessel Position [Lat, Lon]", "Sovereign Maritime Boundary Polygons"],
    outputs: ["IMBL Standoff Distance (km)", "No-Trawl Zone Violation State", "IMD Cyclone Alerts"],
    latency: "4ms (PostGIS R-Tree)",
    formula: "D_{IMBL} = \\min_{p \\in \\partial IMBL} \\text{ST\\_DistanceSpheroid}(V_{pos}, p)",
  },
  {
    id: "navigation",
    name: "Dynamic Navigation Node",
    role: "Vector-Assisted Continuous A* Routing",
    model: "Eulerian Ocean Current & Wind Physics Engine",
    icon: Compass,
    color: "text-sky-400",
    bgGlow: "from-sky-500/20 to-blue-600/10",
    borderColor: "border-sky-500/40",
    description: "Evaluates surface velocity vectors (uo, vo) and wind drag to compute the global fuel-optimal marine trajectory that rides assisting ocean currents.",
    inputs: ["Origin Harbor Node", "Target PFZ Destination", "Vector Rasters (uo, vo, u10, v10)"],
    outputs: ["Multi-segment GeoJSON LineString", "Fuel Savings Delta (15% - 22%)", "Speed Over Ground (SOG)"],
    latency: "18ms (Heuristic Graph A*)",
    formula: "\\vec{V}_{ground} = \\vec{V}_{ship} + \\vec{V}_{current} + K_{wind} \\cdot \\vec{V}_{wind}",
  },
  {
    id: "policy_rag",
    name: "Sovereign Policy RAG",
    role: "Statutory Maritime Circular & SOP Retriever",
    model: "BGE-M3 (1024-dim) + pgvector (HNSW Index)",
    icon: BookOpen,
    color: "text-purple-400",
    bgGlow: "from-purple-500/20 to-indigo-600/10",
    borderColor: "border-purple-500/40",
    description: "Retrieves authentic gazette notifications regarding uniform monsoon fishing bans, mesh size regulations, and Coast Guard distress channel protocols.",
    inputs: ["User Context", "Target State Coastal Waters (Gujarat, Maharashtra, TN)"],
    outputs: ["Department of Fisheries Circulars", "Coast Guard Distress SOP Directives"],
    latency: "25ms (pgvector HNSW Cosine)",
  },
  {
    id: "synthesizer",
    name: "Synthesizer & Dispatcher",
    role: "Unified Actionable Intelligence Compiler",
    model: "Multi-Modal Markdown & deck.gl GeoJSON Aggregator",
    icon: FileCheck,
    color: "text-amber-400",
    bgGlow: "from-amber-500/20 to-orange-600/10",
    borderColor: "border-amber-500/40",
    description: "Merges all worker outputs into an actionable, localized advisory with interactive 3D map overlays and regional language broadcasts.",
    inputs: ["Aggregated Agent States", "GeoJSON Features"],
    outputs: ["Structured Maritime Advisory", "deck.gl FeatureCollection Payload"],
    latency: "45ms",
  },
];

export default function AgentSwarmVisualizer() {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo>(AGENTS[0]);

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-gradient-to-b from-[#09111e]/90 to-[#040810]/95 border border-slate-800/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Interactive Multi-Agent Swarm Topology</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-100">
            Air-Gapped LangGraph Orchestration
          </h3>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono text-slate-300">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Total Swarm Turnaround: <strong className="text-emerald-400">&lt; 480ms</strong></span>
        </div>
      </div>

      {/* Agent Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const isSelected = selectedAgent.id === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`p-3.5 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer border ${
                isSelected
                  ? `bg-slate-800/80 ${agent.borderColor} shadow-lg shadow-cyan-500/10`
                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center bg-slate-900/80 border ${
                    isSelected ? agent.borderColor : "border-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${agent.color}`} />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 line-clamp-1">{agent.name.split(" ")[0]}</p>
                <p className="text-[10px] text-slate-400 truncate">{agent.latency}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Agent Inspector Drawer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAgent.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#070e1b]/90 border border-slate-800/80 shadow-xl"
        >
          <div className="grid md:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Description & Details */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-slate-900 border ${selectedAgent.borderColor}`}>
                  <selectedAgent.icon className={`w-6 h-6 ${selectedAgent.color}`} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-100">{selectedAgent.name}</h4>
                  <p className="text-xs font-mono text-cyan-400">{selectedAgent.role}</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {selectedAgent.description}
              </p>

              {selectedAgent.formula && (
                <div className="p-3 rounded-xl bg-[#030712] border border-cyan-500/20 font-mono text-xs text-cyan-300">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Mathematical Formulation:</span>
                  <span className="font-semibold">{selectedAgent.formula}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Input Telemetry:</span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {selectedAgent.inputs.map((inp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>{inp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Output Schema:</span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {selectedAgent.outputs.map((out, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400">•</span>
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Telemetry Card */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-[#040810] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Execution Telemetry</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  HEALTHY
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Backbone Model:</span>
                  <span className="text-slate-200 text-right">{selectedAgent.model}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Inference Latency:</span>
                  <span className="text-cyan-400 font-bold">{selectedAgent.latency}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Memory Saver:</span>
                  <span className="text-slate-200">AsyncPostgresSaver</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Data Isolation:</span>
                  <span className="text-emerald-400 font-bold">100% Air-Gapped</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
