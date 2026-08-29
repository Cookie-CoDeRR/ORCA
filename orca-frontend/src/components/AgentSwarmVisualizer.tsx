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
  Activity,
} from "lucide-react";

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: string;
  icon: any;
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
    description: "Merges all worker outputs into an actionable, localized advisory with interactive 3D map overlays and regional language broadcasts.",
    inputs: ["Aggregated Agent States", "GeoJSON Features"],
    outputs: ["Structured Maritime Advisory", "deck.gl FeatureCollection Payload"],
    latency: "45ms",
  },
];

export default function AgentSwarmVisualizer() {
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo>(AGENTS[0]);

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-zinc-950/80 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
            <Activity className="w-3.5 h-3.5 text-white" />
            <span>Autonomous Swarm Topology</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Air-Gapped LangGraph Orchestration
          </h3>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Swarm Latency: <strong className="text-white">&lt; 480ms</strong></span>
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
              className={`p-4 rounded-2xl text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer border ${
                isSelected
                  ? "bg-white/10 border-white/40 shadow-xl shadow-white/5"
                  : "bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    isSelected ? "bg-white text-black border-white" : "bg-zinc-900 text-zinc-300 border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">{agent.name.split(" ")[0]}</p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{agent.latency}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Agent Inspector Drawer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAgent.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="p-6 md:p-8 rounded-2xl bg-zinc-900/60 border border-white/10 shadow-xl"
        >
          <div className="grid md:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Description & Details */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-black">
                  <selectedAgent.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedAgent.name}</h4>
                  <p className="text-xs font-mono text-zinc-400">{selectedAgent.role}</p>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                {selectedAgent.description}
              </p>

              {selectedAgent.formula && (
                <div className="p-3.5 rounded-xl bg-black border border-white/15 font-mono text-xs text-white">
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Mathematical Formulation:</span>
                  <span className="font-semibold">{selectedAgent.formula}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1.5">Input Telemetry:</span>
                  <ul className="text-xs text-zinc-300 space-y-1.5">
                    {selectedAgent.inputs.map((inp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-white font-bold">•</span>
                        <span>{inp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1.5">Output Schema:</span>
                  <ul className="text-xs text-zinc-300 space-y-1.5">
                    {selectedAgent.outputs.map((out, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-white font-bold">•</span>
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Telemetry Card */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-black border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                  <Terminal className="w-3.5 h-3.5 text-white" />
                  <span>Execution Telemetry</span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white border border-white/20">
                  OPERATIONAL
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Backbone Model:</span>
                  <span className="text-white font-semibold text-right">{selectedAgent.model}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Inference Latency:</span>
                  <span className="text-white font-bold">{selectedAgent.latency}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/80">
                  <span className="text-zinc-400">Memory Saver:</span>
                  <span className="text-zinc-200">AsyncPostgresSaver</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Data Isolation:</span>
                  <span className="text-white font-bold">100% Air-Gapped</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
