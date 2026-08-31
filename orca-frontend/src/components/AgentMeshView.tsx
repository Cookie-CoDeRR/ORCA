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
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Activity,
  Zap,
  Code2,
  Database,
  Layers,
  ArrowRight,
  Clock,
  Check,
  Info,
  X,
  Network,
  GitBranch,
} from "lucide-react";
import AgentSynapseGraph from "@/components/AgentSynapseGraph";

interface AgentNode {
  id: string;
  name: string;
  category: "LLM Orchestrator" | "Deterministic Raster" | "Spatial Engine" | "Kinematics" | "Vector RAG" | "Synthesis";
  modelCore: string;
  icon: any;
  status: "idle" | "running" | "completed" | "error";
  latencyMs: number;
  inputPayload: any;
  outputPayload: any;
  toolQueryLog: string;
  description: string;
  formula?: string;
}

const NODES_DATA: AgentNode[] = [
  {
    id: "supervisor",
    name: "1. Supervisor Orchestrator",
    category: "LLM Orchestrator",
    modelCore: "Qwen 2.5 7B-Instruct (GGUF Q5_K_M)",
    icon: Cpu,
    status: "completed",
    latencyMs: 240,
    inputPayload: {
      user_query: "Can 4 mechanized boats fish 30km off Veraval for Tuna tomorrow morning?",
      session_thread: "thread_f829a1b0",
      target_basin: "Arabian Sea",
    },
    outputPayload: {
      origin_coords: [20.902, 70.368],
      target_coords: [20.652, 70.118],
      intent_summary: "Fishery feasibility & IMBL safety check for Veraval pelagic fleet",
      tasks_to_trigger: ["ocean_analytics", "risk_geofencing", "navigation", "policy_rag"],
      active_persona_agent: "Matsya-Sutradhar (Fishery & Tactical Navigation)",
    },
    toolQueryLog: `[Supervisor] Parsing query with StructuredOutput(SubTaskPlan)...
[Supervisor] Matched Indian Coastal Gazetteer: 'Veraval' -> [20.902, 70.368]
[Supervisor] Routing to Persona Agent: 'Matsya-Sutradhar'
[Supervisor] Emitted 4 parallel asynchronous task dispatches.`,
    description: "Decomposes unstructured natural language into structured Pydantic task graphs and dynamically routes to the appropriate persona agent.",
  },
  {
    id: "ocean_analytics",
    name: "2. Ocean Analytics Node",
    category: "Deterministic Raster",
    modelCore: "xarray + NetCDF4 / Open-Meteo API",
    icon: Waves,
    status: "completed",
    latencyMs: 16,
    inputPayload: {
      bbox: [20.50, 70.00, 21.00, 70.50],
      variables: ["sea_surface_temperature", "chlorophyll_a", "significant_wave_height"],
      time_slice: "2026-08-31T06:00:00Z",
    },
    outputPayload: {
      sst_celsius: 28.4,
      chlorophyll_a_mg_m3: 1.26,
      wave_height_m: 1.61,
      pfz_detected: true,
      species_candidates: [
        { name: "Yellowfin Tuna", confidence: 88, sst_optimal: 28.7 },
        { name: "Indian Mackerel", confidence: 92, sst_optimal: 28.7 },
      ],
      diurnal_feeding_window: "Dawn (04:30 - 07:30 IST)",
    },
    toolQueryLog: `[OceanAnalytics] Invoking Open-Meteo Marine API @ [20.90, 70.37]
[OceanAnalytics] Ingesting Copernicus SST (OSTIA 0.083°) & Sentinel-3 OLCI Chlorophyll
[OceanAnalytics] Thermal gradient detected: ∇SST = 0.82°C/km -> PFZ CONFIRMED (Confidence: 88%)`,
    description: "High-speed numerical pipeline running multidimensional array slicing over SST and chlorophyll raster grids to isolate Potential Fishing Zones (PFZs).",
    formula: "PFZ_{conf} = \\sigma(\\alpha \\cdot \\nabla SST + \\beta \\cdot [Chl\\text{-}a] - \\gamma \\cdot SWH)",
  },
  {
    id: "risk_geofencing",
    name: "3. Risk & Geofencing Node",
    category: "Spatial Engine",
    modelCore: "PostgreSQL 16 / PostGIS 3.4 (ST_Distance)",
    icon: ShieldAlert,
    status: "completed",
    latencyMs: 8,
    inputPayload: {
      vessel_location: [20.652, 70.118],
      target_trajectory: "LineString(70.368 20.902, 70.118 20.652)",
      hazard_buffer_km: 15.0,
    },
    outputPayload: {
      imbl_proximity_km: 45.0,
      imbl_standoff_status: "GREEN_CLEAR",
      mpa_violation: false,
      active_cyclonic_alert: false,
      overall_risk_level: "LOW_OPERABLE",
    },
    toolQueryLog: `SELECT ST_DistanceSpheroid(
  ST_SetSRID(ST_Point(70.118, 20.652), 4326),
  geom_imbl
) / 1000.0 AS dist_km
FROM sovereign_imbl_boundaries WHERE zone = 'pakistan_imbl';
-> Result: 45.02 km (Status: GREEN_SAFE)`,
    description: "Calculates sub-meter spherical geodesic distances to international maritime boundaries (IMBL) and Marine Protected Areas (MPAs).",
    formula: "D_{IMBL} = \\min_{p \\in \\partial IMBL} \\text{ST\\_DistanceSpheroid}(V_{pos}, p)",
  },
  {
    id: "navigation",
    name: "4. Vector Navigation Engine",
    category: "Kinematics",
    modelCore: "Continuous Eulerian A* Solver (uo, vo, u10)",
    icon: Compass,
    status: "completed",
    latencyMs: 22,
    inputPayload: {
      origin: [70.368, 20.902],
      destination: [70.118, 20.652],
      engine_speed_knots: 10.0,
      current_field_active: true,
    },
    outputPayload: {
      total_distance_nm: 21.4,
      estimated_time_hours: 1.8,
      fuel_savings_percent: 22.4,
      route_waypoints_count: 14,
    },
    toolQueryLog: `[A* Nav] Integrating Mercator currents (uo=0.32 m/s, vo=-0.15 m/s)
[A* Nav] Optimal streamline found. Fuel consumption delta: -22.4% vs rhumb line.`,
    description: "Evaluates cost surfaces over dynamic vector fields to produce fuel-minimizing trajectories riding ocean currents.",
  },
  {
    id: "policy_rag",
    name: "5. Policy RAG Node",
    category: "Vector RAG",
    modelCore: "pgvector + text-embedding-3-small",
    icon: BookOpen,
    status: "completed",
    latencyMs: 34,
    inputPayload: {
      query: "Monsoon fishing ban dates Gujarat Arabian Sea",
      top_k: 3,
    },
    outputPayload: {
      matched_circular: "DoF/GOI/2026/M-BAN-WEST-COAST",
      ban_active: false,
      regulatory_clearance: "APPROVED",
    },
    toolQueryLog: `[Policy RAG] Embedding query with text-embedding-3-small (1536-dim)
[Policy RAG] Top Cosine Match: 'Gujarat Marine Fisheries Regulation Act (GMFRA 2003)' (Score: 0.91)`,
    description: "Semantic vector retrieval over Indian maritime policy documents, seasonal fishing bans, and Coast Guard regulations.",
  },
  {
    id: "synthesizer",
    name: "6. Multilingual Synthesizer",
    category: "Synthesis",
    modelCore: "Qwen 2.5 7B-Instruct",
    icon: FileCheck,
    status: "completed",
    latencyMs: 510,
    inputPayload: {
      persona_agent: "Matsya-Sutradhar",
      user_role: "navigator",
      format_mode: "conversational",
    },
    outputPayload: {
      advisory_markdown: "Advisory generated via Matsya-Sutradhar with targeted species and feeding window.",
      deckgl_geojson_layers: ["pfz_hexagons", "current_arcs", "imbl_line", "a_star_path"],
      confidence_score: 0.94,
    },
    toolQueryLog: `[Synthesizer] Persona active: Matsya-Sutradhar (Fishery & Tactical Navigation)
[Synthesizer] Compiling multi-agent state into structured advisory...
[Synthesizer] Generated deck.gl FeatureCollection with active geospatial layers.`,
    description: "Reconciles findings from all 5 workers and outputs tailored insights via the active specialized persona agent.",
  },
];

export default function AgentMeshView() {
  const [selectedNode, setSelectedNode] = useState<AgentNode>(NODES_DATA[0]);
  const [viewMode, setViewMode] = useState<"synapse" | "dag">("synapse");

  const handleSynapseNodeSelect = (nodeId: string, agentRef?: string) => {
    if (agentRef) {
      const match = NODES_DATA.find((n) => n.id === agentRef);
      if (match) setSelectedNode(match);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-black text-white">
      {/* LEFT: GRAPH CANVAS (SYNAPSE OR DAG) */}
      <div className="flex-1 flex flex-col h-full border-r border-white/10 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Header with View Mode Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-0.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Multi-Agent Swarm Inspector</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Agentic Reasoning Mesh & Execution Architecture
            </h3>
          </div>

          {/* View Mode Toggle Switch */}
          <div className="flex rounded-xl border border-white/15 bg-zinc-950 p-1 shadow-xl">
            <button
              onClick={() => setViewMode("synapse")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "synapse" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Synaptic Neural Flow</span>
            </button>
            <button
              onClick={() => setViewMode("dag")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === "dag" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Modular Swarm DAG</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: SYNAPTIC NEURAL FLOW GRAPH */}
        {viewMode === "synapse" && (
          <div className="flex-1 w-full min-h-[540px]">
            <AgentSynapseGraph
              onNodeSelect={handleSynapseNodeSelect}
              selectedAgentRef={selectedNode.id}
            />
          </div>
        )}

        {/* VIEW 2: MODULAR ARCHITECTURE DAG */}
        {viewMode === "dag" && (
          <div className="space-y-4">
            {/* Layer 1: Ingress & Supervisor */}
            <div className="flex justify-center">
              <div
                onClick={() => setSelectedNode(NODES_DATA[0])}
                className={`w-full max-w-xl p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedNode.id === "supervisor"
                    ? "bg-zinc-900 border-white shadow-xl shadow-white/10"
                    : "bg-zinc-950/80 border-white/15 hover:border-white/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white text-black font-bold">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Agent 1: Supervisor Orchestrator</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15">
                          LLM Planner
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Zero-Shot Intent Extraction & Pydantic Task Decomposition</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">● 240ms</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center text-xs font-mono text-zinc-600">
              <span>↓ Parallel Async Fan-Out Dispatch (4 Specialized Workers)</span>
            </div>

            {/* Layer 2: 4 Parallel Workers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NODES_DATA.slice(1, 5).map((node) => {
                const Icon = node.icon;
                const isSelected = selectedNode.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 border-white shadow-lg shadow-white/10"
                        : "bg-zinc-950/70 border-white/15 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{node.name}</h4>
                          <span className="text-[9px] font-mono text-zinc-400">{node.category}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{node.latencyMs}ms</span>
                    </div>
                    <p className="mt-2 text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {node.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center text-xs font-mono text-zinc-600">
              <span>↓ State Aggregation & CoT Cross-Correlation</span>
            </div>

            {/* Layer 3: Synthesizer */}
            <div className="flex justify-center">
              <div
                onClick={() => setSelectedNode(NODES_DATA[5])}
                className={`w-full max-w-xl p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedNode.id === "synthesizer"
                    ? "bg-zinc-900 border-white shadow-xl shadow-white/10"
                    : "bg-zinc-950/80 border-white/15 hover:border-white/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white text-black font-bold">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Agent 6: Multilingual Synthesizer</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15">
                          Synthesis + DeckGL
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Reconciliation, Indic Regional Translation & GeoJSON Layer Dispatch</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">● 510ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latency Waterfall Bar */}
        <div className="p-3.5 rounded-2xl border border-white/10 bg-zinc-950/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> End-to-End Latency Waterfall
            </span>
            <span className="text-emerald-400 font-bold">Total Turn: 832ms</span>
          </div>
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-zinc-900 border border-white/10">
            <div style={{ width: "29%" }} className="bg-sky-400" title="Supervisor (240ms)" />
            <div style={{ width: "2%" }} className="bg-emerald-400" title="Ocean Analytics (16ms)" />
            <div style={{ width: "1%" }} className="bg-rose-400" title="Risk Geofencing (8ms)" />
            <div style={{ width: "3%" }} className="bg-amber-400" title="Navigation (22ms)" />
            <div style={{ width: "4%" }} className="bg-purple-400" title="Policy RAG (34ms)" />
            <div style={{ width: "61%" }} className="bg-white" title="Synthesizer (510ms)" />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-zinc-500">
            <span>Supervisor 29%</span>
            <span>Deterministic Workers 10% (Parallel)</span>
            <span>Synthesizer 61%</span>
          </div>
        </div>
      </div>

      {/* RIGHT: NODE DEEP-DIVE INSPECTION DRAWER */}
      <div className="w-full md:w-[410px] lg:w-[460px] h-full flex flex-col bg-zinc-950 p-6 overflow-y-auto space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white text-black font-bold">
              {React.createElement(selectedNode.icon, { className: "h-5 w-5" })}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{selectedNode.name}</h3>
              <p className="text-[10px] font-mono text-zinc-400">{selectedNode.modelCore}</p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
            ● {selectedNode.status.toUpperCase()}
          </span>
        </div>

        {/* Mathematical Formulation */}
        {selectedNode.formula && (
          <div className="p-3 rounded-xl border border-white/10 bg-black/60 space-y-1">
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-bold">Mathematical Formulation</span>
            <div className="text-xs font-mono text-white p-2 rounded bg-zinc-900 overflow-x-auto">
              {selectedNode.formula}
            </div>
          </div>
        )}

        {/* Input Payload Schema */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-sky-400" /> Input Payload (Pydantic Schema)
            </span>
          </div>
          <pre className="p-3 rounded-xl bg-black border border-white/10 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-40 leading-relaxed">
            {JSON.stringify(selectedNode.inputPayload, null, 2)}
          </pre>
        </div>

        {/* Tool Execution Logs */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-amber-400" /> Native Tool Execution Logs
            </span>
          </div>
          <pre className="p-3 rounded-xl bg-black border border-white/10 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-36 leading-relaxed whitespace-pre-wrap">
            {selectedNode.toolQueryLog}
          </pre>
        </div>

        {/* Output Payload Schema */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-400" /> Output State Dispatched
            </span>
          </div>
          <pre className="p-3 rounded-xl bg-black border border-white/10 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-40 leading-relaxed">
            {JSON.stringify(selectedNode.outputPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
