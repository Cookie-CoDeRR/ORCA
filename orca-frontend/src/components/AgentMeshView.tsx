"use client";

import React, { useState } from "react";
import {
  Cpu,
  Waves,
  ShieldAlert,
  Compass,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Terminal,
  Activity,
  Code2,
  Database,
  ArrowRight,
  Clock,
  Check,
  ChevronRight,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";

interface AgentNode {
  id: string;
  name: string;
  stageName: string;
  stageNum: number;
  category: "Input Ingestion" | "Supervisor Router" | "Worker Agent" | "Response Synthesis";
  modelCore: string;
  icon: any;
  status: "completed" | "running" | "idle" | "error";
  latencyMs: number;
  inputPayload: any;
  outputPayload: any;
  toolQueryLog: string;
  description: string;
}

const PIPELINE_NODES: AgentNode[] = [
  {
    id: "ingestion",
    name: "Input Ingestion & Spatial Lock",
    stageName: "Stage 1: Ingestion",
    stageNum: 1,
    category: "Input Ingestion",
    modelCore: "Geodesic Gazetteer + Spatial Extractor",
    icon: Server,
    status: "completed",
    latencyMs: 12,
    inputPayload: {
      raw_query: "Can 4 mechanized trawlers fish 30km off Veraval for Yellowfin Tuna tomorrow morning?",
      session_thread: "thread_f829a1b0",
      active_basin: "Arabian Sea (AS)",
      user_persona: "navigator",
    },
    outputPayload: {
      origin_coords: [20.902, 70.368],
      target_coords: [20.652, 70.118],
      spatial_buffer_nm: 15.0,
      query_intent: "Fishery feasibility, SST/Chlorophyll PFZ extraction & IMBL safety verification",
    },
    toolQueryLog: `[Ingestion 04:30:00.012] Received query on thread 'thread_f829a1b0'
[Ingestion 04:30:00.018] Gazette match: 'Veraval' -> Lat: 20.902°N, Lon: 70.368°E
[Ingestion 04:30:00.024] Spatial bounding box locked: [[[20.0, 69.5], [21.5, 71.0]]]`,
    description: "Ingests raw natural language or voice queries, extracts harbor gazetteer points, and normalizes spatial bounding boxes.",
  },
  {
    id: "supervisor",
    name: "Supervisor Router",
    stageName: "Stage 2: Supervisor Planning",
    stageNum: 2,
    category: "Supervisor Router",
    modelCore: "Qwen 2.5 7B-Instruct (GGUF Q5_K_M)",
    icon: Cpu,
    status: "completed",
    latencyMs: 140,
    inputPayload: {
      user_role: "navigator",
      format_mode: "conversational",
      target_coords: [20.652, 70.118],
      intent_summary: "Fishery feasibility & IMBL safety verification",
    },
    outputPayload: {
      active_persona: "Matsya-Sutradhar (Fishery & Tactical Navigation)",
      parallel_tasks: ["ocean_analytics", "risk_geofencing", "navigation", "policy_rag"],
      dispatch_mode: "Async Fan-Out (4 Workers)",
    },
    toolQueryLog: `[Supervisor 04:30:00.035] Initializing LangGraph state router...
[Supervisor 04:30:00.088] LLM StructuredOutput(SubTaskPlan) matched 4 worker requirements:
  - Task 1: ocean_analytics (PFZ Thermal/Chlorophyll front detection)
  - Task 2: risk_geofencing (PostGIS IMBL boundary distance evaluation)
  - Task 3: navigation (Eulerian A* surface current vector routing)
  - Task 4: policy_rag (pgvector seasonal monsoon ban check)
[Supervisor 04:30:00.175] Emitted 4 asynchronous parallel worker dispatches.`,
    description: "Evaluates the user persona, creates a structured Pydantic SubTaskPlan, and triggers parallel worker agents.",
  },
  {
    id: "ocean_analytics",
    name: "Ocean Analytics Agent",
    stageName: "Stage 3A: Worker",
    stageNum: 3,
    category: "Worker Agent",
    modelCore: "xarray + NetCDF4 / Open-Meteo Marine API",
    icon: Waves,
    status: "completed",
    latencyMs: 16,
    inputPayload: {
      coordinates: [20.652, 70.118],
      variables: ["sea_surface_temperature", "chlorophyll_a", "significant_wave_height"],
      time_slice: "2026-08-31T06:00:00Z",
    },
    outputPayload: {
      sst_celsius: 28.4,
      chlorophyll_a_mg_m3: 1.26,
      wave_height_m: 1.61,
      thermal_gradient_c_per_km: 0.82,
      pfz_detected: true,
      top_species: "Yellowfin Tuna (88% Confidence)",
      feeding_window: "Dawn (04:30 - 07:30 IST)",
    },
    toolQueryLog: `[OceanAnalytics 04:30:00.180] Slicing Copernicus OSTIA 0.083° SST grid @ [20.652, 70.118]
[OceanAnalytics 04:30:00.188] Ingesting Sentinel-3 OLCI surface chlorophyll: 1.26 mg/m³
[OceanAnalytics 04:30:00.196] Thermal gradient detected: ∇SST = 0.82°C/km -> PFZ CONFIRMED`,
    description: "Executes numerical array operations over sea surface temperature and chlorophyll rasters to isolate Potential Fishing Zones (PFZs).",
  },
  {
    id: "risk_geofencing",
    name: "Risk & Geofencing Agent",
    stageName: "Stage 3B: Worker",
    stageNum: 3,
    category: "Worker Agent",
    modelCore: "PostgreSQL 16 / PostGIS 3.4 (ST_Distance)",
    icon: ShieldAlert,
    status: "completed",
    latencyMs: 8,
    inputPayload: {
      vessel_location: [20.652, 70.118],
      target_trajectory: "LineString(70.368 20.902, 70.118 20.652)",
      standoff_buffer_km: 15.0,
    },
    outputPayload: {
      imbl_distance_km: 45.0,
      imbl_standoff_status: "GREEN_CLEAR",
      mpa_overlap: false,
      cyclonic_alert: false,
      overall_risk: "LOW_OPERABLE",
    },
    toolQueryLog: `[PostGIS 04:30:00.182] Executing ST_DistanceSpheroid(ST_Point(70.118, 20.652), geom_imbl)
[PostGIS 04:30:00.186] Distance to Pakistan IMBL: 45.02 km (Status: GREEN_CLEAR)
[PostGIS 04:30:00.190] Spatial check: 0 MPA violations, 0 cyclone buffer intersections`,
    description: "Runs geodesic PostGIS spatial queries against International Maritime Boundary Lines (IMBL), MPAs, and cyclone buffer polygons.",
  },
  {
    id: "navigation",
    name: "Dynamic Navigation Engine",
    stageName: "Stage 3C: Worker",
    stageNum: 3,
    category: "Worker Agent",
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
      distance_nm: 21.4,
      transit_time_hours: 1.8,
      fuel_savings_percent: 22.4,
      waypoints_count: 14,
    },
    toolQueryLog: `[A* Nav 04:30:00.184] Ingesting INCOIS 0.083° surface current vectors [uo=0.32, vo=-0.15]
[A* Nav 04:30:00.198] Optimal Eulerian trajectory computed across 14 waypoints
[A* Nav 04:30:00.206] Projected fuel consumption delta: -22.4% vs straight rhumb line`,
    description: "Evaluates hydrodynamic cost surfaces over real-time zonal/meridional current vectors to calculate fuel-minimizing routes.",
  },
  {
    id: "policy_rag",
    name: "Maritime Policy RAG",
    stageName: "Stage 3D: Worker",
    stageNum: 3,
    category: "Worker Agent",
    modelCore: "pgvector + text-embedding-3-small",
    icon: BookOpen,
    status: "completed",
    latencyMs: 34,
    inputPayload: {
      query: "Monsoon fishing ban dates Gujarat Arabian Sea",
      top_k: 3,
      state_jurisdiction: "Gujarat",
    },
    outputPayload: {
      matched_circular: "DoF/GOI/2026/M-BAN-WEST-COAST",
      ban_active: false,
      regulatory_status: "APPROVED_OPERABLE",
      mandatory_sop: "VHF Channel 16 active watch + BIS-approved life jackets",
    },
    toolQueryLog: `[Policy RAG 04:30:00.185] Embedding query with text-embedding-3-small (1536-dim)
[Policy RAG 04:30:00.210] HNSW cosine search over 'maritime_regulatory_vault' table
[Policy RAG 04:30:00.219] Top match: 'Uniform Seasonal Fishing Ban 2026' (Similarity: 0.94)`,
    description: "Retrieves statutory Department of Fisheries gazettes, seasonal trawl bans, and Coast Guard safety bulletins using dense vector search.",
  },
  {
    id: "synthesizer",
    name: "Response Synthesis Engine",
    stageName: "Stage 4: Synthesis & Output",
    stageNum: 4,
    category: "Response Synthesis",
    modelCore: "Qwen 2.5 7B-Instruct + GeoJSON Generator",
    icon: FileCheck,
    status: "completed",
    latencyMs: 420,
    inputPayload: {
      active_persona: "Matsya-Sutradhar",
      user_role: "navigator",
      format_mode: "conversational",
      worker_payloads_count: 4,
    },
    outputPayload: {
      advisory_text: "Advisory generated via Matsya-Sutradhar with Yellowfin Tuna target and feeding window.",
      geojson_features_emitted: 3,
      confidence_index: 0.94,
    },
    toolQueryLog: `[Synthesizer 04:30:00.225] Ingested 4 worker states (Ocean, Geofence, Nav, Policy)
[Synthesizer 04:30:00.480] Applied persona formatting for 'Matsya-Sutradhar'
[Synthesizer 04:30:00.645] Generated deck.gl FeatureCollection (PFZ points + A* route line)`,
    description: "Cross-correlates findings from all worker nodes, validates safety thresholds, and formats persona-adapted advisories and GeoJSON layers.",
  },
];

export default function AgentMeshView() {
  const [selectedNode, setSelectedNode] = useState<AgentNode>(PIPELINE_NODES[1]);
  const [activeTab, setActiveTab] = useState<"params" | "logs" | "output">("params");

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* ━━━ LEFT (65%): CLEAN 4-STAGE PIPELINE DAG ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-y-auto p-5 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>Multi-Agent Swarm Pipeline</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Agentic Workflow & Execution DAG
            </h2>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>StateGraph Compiled • 6 Nodes Online</span>
          </div>
        </div>

        {/* ── 4-STAGE HORIZONTAL PIPELINE DAG ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
          {/* STAGE 1: INGESTION */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
              <span>Stage 1: Ingestion</span>
              <span className="text-emerald-400">12ms</span>
            </div>
            <div
              onClick={() => setSelectedNode(PIPELINE_NODES[0])}
              className={`p-3.5 rounded-xl border transition cursor-pointer ${
                selectedNode.id === "ingestion"
                  ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">Input Ingestion</h4>
                  <span className="text-[10px] font-mono text-slate-400">Spatial Lock</span>
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[10px] font-mono text-slate-300 space-y-0.5">
                <div>Coord: <span className="text-cyan-300 font-semibold">[20.90°N, 70.37°E]</span></div>
                <div>Basin: <span className="text-white">Arabian Sea</span></div>
              </div>
            </div>
          </div>

          {/* STAGE 2: SUPERVISOR */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
              <span>Stage 2: Supervisor</span>
              <span className="text-emerald-400">140ms</span>
            </div>
            <div
              onClick={() => setSelectedNode(PIPELINE_NODES[1])}
              className={`p-3.5 rounded-xl border transition cursor-pointer ${
                selectedNode.id === "supervisor"
                  ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg bg-slate-800 text-white">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">Supervisor Router</h4>
                  <span className="text-[10px] font-mono text-slate-400">Qwen 2.5 7B</span>
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[10px] font-mono text-slate-300 space-y-0.5">
                <div>Persona: <span className="text-emerald-300 font-semibold">Matsya-Sutradhar</span></div>
                <div>Fan-Out: <span className="text-cyan-300">4 Worker Nodes</span></div>
              </div>
            </div>
          </div>

          {/* STAGE 3: 4 PARALLEL WORKERS */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
              <span>Stage 3: Parallel Workers</span>
              <span className="text-emerald-400">85ms total</span>
            </div>
            <div className="space-y-2">
              {PIPELINE_NODES.slice(2, 6).map((node) => {
                const Icon = node.icon;
                const isSelected = selectedNode.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-white leading-none">{node.name}</h4>
                          <span className="text-[9px] font-mono text-slate-400">{node.modelCore.split("/")[0]}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">{node.latencyMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STAGE 4: SYNTHESIS */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
              <span>Stage 4: Synthesis</span>
              <span className="text-emerald-400">420ms</span>
            </div>
            <div
              onClick={() => setSelectedNode(PIPELINE_NODES[6])}
              className={`p-3.5 rounded-xl border transition cursor-pointer ${
                selectedNode.id === "synthesizer"
                  ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">Response Synthesis</h4>
                  <span className="text-[10px] font-mono text-slate-400">GeoJSON + Advisory</span>
                </div>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[10px] font-mono text-slate-300 space-y-0.5">
                <div>Output: <span className="text-emerald-300 font-semibold">Structured Brief</span></div>
                <div>Layers: <span className="text-cyan-300">3 deck.gl Features</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── LATENCY WATERFALL BAR ── */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5 mt-auto">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Execution Latency Waterfall</span>
            </span>
            <span className="text-emerald-400 font-semibold font-mono">
              Total End-to-End: 645 ms
            </span>
          </div>

          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-950 border border-slate-800">
            <div style={{ width: "2%" }} className="bg-slate-400" title="Ingestion (12ms)" />
            <div style={{ width: "22%" }} className="bg-sky-400" title="Supervisor Router (140ms)" />
            <div style={{ width: "13%" }} className="bg-cyan-400" title="Parallel Workers (85ms)" />
            <div style={{ width: "63%" }} className="bg-emerald-400" title="Response Synthesis (420ms)" />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Ingestion 12ms</span>
            <span>Supervisor Router 140ms</span>
            <span>Parallel Workers 85ms</span>
            <span>Response Synthesis 420ms</span>
          </div>
        </div>
      </div>

      {/* ━━━ RIGHT (35%): NODE DEEP-DIVE INSPECTION DRAWER ━━━━━━━━━━━━━━━━ */}
      <div className="w-full md:w-[420px] lg:w-[460px] h-full flex flex-col bg-slate-950 p-5 md:p-6 overflow-y-auto space-y-5">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
              {React.createElement(selectedNode.icon, { className: "h-5 w-5" })}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{selectedNode.name}</h3>
              <p className="text-[10px] font-mono text-slate-400">{selectedNode.modelCore}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
            ● {selectedNode.status.toUpperCase()}
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab("params")}
            className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === "params" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Tool Parameters
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === "logs" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Execution Logs
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === "output" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Output State
          </button>
        </div>

        {/* Tab 1: Tool Parameters (JSON) */}
        {activeTab === "params" && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>Pydantic Input Payload</span>
              </span>
              <span>application/json</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
              {JSON.stringify(selectedNode.inputPayload, null, 2)}
            </pre>
          </div>
        )}

        {/* Tab 2: Execution Logs (Monospace CLI trace) */}
        {activeTab === "logs" && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Terminal className="h-3.5 w-3.5 text-amber-400" />
                <span>Native Runtime Trace</span>
              </span>
              <span>stdout/stderr</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-[380px] leading-relaxed whitespace-pre-wrap">
              {selectedNode.toolQueryLog}
            </pre>
          </div>
        )}

        {/* Tab 3: Output State */}
        {activeTab === "output" && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                <span>Dispatched Output State</span>
              </span>
              <span>StateGraph State</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
              {JSON.stringify(selectedNode.outputPayload, null, 2)}
            </pre>
          </div>
        )}

        {/* Description card */}
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 text-[11px] text-slate-400 leading-relaxed mt-auto">
          <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">
            Component Role
          </div>
          {selectedNode.description}
        </div>
      </div>
    </div>
  );
}
