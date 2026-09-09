"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Brain, Waves, ShieldAlert, Compass, BookOpen, Sparkles,
  Play, RotateCcw, Download, CheckCircle2, AlertTriangle,
  Clock, Cpu, Zap, Eye, Terminal, ArrowRight, ArrowLeft,
  ChevronRight, Layers, FileCode2, Search, Filter, ShieldCheck,
  Fish
} from "lucide-react";

// ─── Topologies & Types ───────────────────────────────────────────────────────

export type AgentId =
  | "supervisor"
  | "ocean_analytics"
  | "risk_geofencing"
  | "navigation"
  | "policy_rag"
  | "synthesizer";

export interface AgentNode {
  id: AgentId;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  accent: string;
  glow: string;
  model: string;
  role: string;
  activeTools: string[];
  systemPrompt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: AgentId;
  target?: AgentId;
  message: string;
  type: "dispatch" | "processing" | "result" | "safety_check" | "synthesis";
  latencyMs?: number;
  confidence?: number;
  payload?: any;
}

export interface PresetScenario {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  query: string;
  activeAgents: AgentId[];
  logs: Omit<AuditLogEntry, "id" | "timestamp">[];
  finalOutput: string;
}

const AGENTS: Record<AgentId, AgentNode> = {
  supervisor: {
    id: "supervisor",
    label: "SUPERVISOR",
    sub: "Qwen 2.5 (7B-Instruct)",
    icon: Brain,
    x: 18,
    y: 50,
    accent: "#38bdf8",
    glow: "#083344",
    model: "Qwen2.5-7B-Instruct (4-bit AWQ Air-Gapped)",
    role: "Central Orchestrator & Multi-Turn Cognitive Decomposer",
    activeTools: ["intent_classifier", "dag_scheduler", "tool_router", "safety_guardrail"],
    systemPrompt: `You are the ORCA Master Supervisor. Decompose complex user maritime queries into parallel execution graphs for Ocean AI, Geofence, Navigation, and Policy RAG workers. Enforce sovereign Indian EEZ boundary safety.`,
  },
  ocean_analytics: {
    id: "ocean_analytics",
    label: "OCEAN AI",
    sub: "xarray / NetCDF4",
    icon: Waves,
    x: 50,
    y: 16,
    accent: "#10b981",
    glow: "#064e3b",
    model: "INCOIS NetCDF / PyXarray Engine",
    role: "Thermal Front & Primary Productivity Extractor",
    activeTools: ["sst_gradient_detector", "chl_anomaly_filter", "upwelling_index", "thermal_front_contour"],
    systemPrompt: `Analyze multidimensional oceanographic rasters (SST, Chlorophyll-a, Salinity). Identify persistent frontal boundaries and calculate potential fish forage aggregation likelihood.`,
  },
  risk_geofencing: {
    id: "risk_geofencing",
    label: "RISK & GEO",
    sub: "PostGIS 3.4 ST_DWithin",
    icon: ShieldAlert,
    x: 50,
    y: 38,
    accent: "#f43f5e",
    glow: "#4c0519",
    model: "PostGIS 3.4 Spatial Index (EPSG:4326)",
    role: "Sovereign Maritime Boundary & Collision Monitor",
    activeTools: ["st_distance_imbl", "eez_breach_detector", "mpa_containment_check", "ais_cpa_tcpa_evaluator"],
    systemPrompt: `Enforce international maritime boundary line (IMBL) clearance and calculate closest point of approach (CPA) for surrounding commercial cargo vessels in real time.`,
  },
  navigation: {
    id: "navigation",
    label: "NAVIGATION",
    sub: "Continuous A* Router",
    icon: Compass,
    x: 50,
    y: 62,
    accent: "#f59e0b",
    glow: "#451a03",
    model: "Continuous A* Current-Vector Solver",
    role: "Fuel-Optimal & Current-Assisted Waypoint Generator",
    activeTools: ["ocean_current_drift_assist", "wave_resistance_penalty", "colregs_safe_corridor", "fuel_burn_integrator"],
    systemPrompt: `Calculate Pareto-optimal maritime courses maximizing tailcurrent propulsion assist while strictly avoiding shallow bathymetry and high sea-state hazards.`,
  },
  policy_rag: {
    id: "policy_rag",
    label: "POLICY RAG",
    sub: "pgvector / BGE-M3",
    icon: BookOpen,
    x: 50,
    y: 84,
    accent: "#a855f7",
    glow: "#3b0764",
    model: "BGE-M3 Dense + Sparse Hybrid Embeddings",
    role: "Maritime Legal & Fisheries Regulation Retrieval",
    activeTools: ["unclos_treaty_lookup", "monsoon_ban_calendar", "gear_mesh_validator", "subsidy_circular_retriever"],
    systemPrompt: `Retrieve statutory legal clauses from the Territorial Waters Act, CMFRI marine advisories, and state monsoon trawling bans using cosine similarity ranking.`,
  },
  synthesizer: {
    id: "synthesizer",
    label: "SYNTHESIZER",
    sub: "GeoJSON / Bhashini",
    icon: Sparkles,
    x: 82,
    y: 50,
    accent: "#84cc16",
    glow: "#1a2e05",
    model: "ORCA Multilingual Consensus Synthesizer",
    role: "Final Multilingual Advisory & GeoJSON Payload Formatter",
    activeTools: ["geojson_feature_builder", "bhashini_regional_tts", "confidence_aggregator", "whatsapp_sms_formatter"],
    systemPrompt: `Merge outputs from all specialist workers into an authoritative, actionable, plain-language advisory in coastal regional languages. Guarantee zero hallucinations.`,
  },
};

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "fishing",
    name: "Tuna PFZ Verification",
    icon: Fish,
    color: "#10b981",
    query: "Can 4 mechanized boats fish 30km southwest of Veraval for Yellowfin Tuna?",
    activeAgents: ["supervisor", "ocean_analytics", "risk_geofencing", "navigation", "synthesizer"],
    logs: [
      {
        source: "supervisor",
        target: "ocean_analytics",
        message: "Decomposed query: Requesting 9km SST raster slice & Chl-a gradient at 20.75°N, 70.19°E.",
        type: "dispatch",
        latencyMs: 14,
      },
      {
        source: "supervisor",
        target: "risk_geofencing",
        message: "Requesting PostGIS ST_Distance against Pakistan IMBL and active coastal defense corridors.",
        type: "dispatch",
        latencyMs: 18,
      },
      {
        source: "ocean_analytics",
        target: "synthesizer",
        message: "Detected active thermal front (28.4°C → 26.1°C). Chlorophyll anomaly: +18.4%. PFZ Confidence: 93%.",
        type: "result",
        latencyMs: 112,
        confidence: 0.93,
      },
      {
        source: "risk_geofencing",
        target: "synthesizer",
        message: "Calculated ST_Distance to IMBL: 74.2 km (Clearance SAFE > 20km). Geofence status: GREEN.",
        type: "safety_check",
        latencyMs: 38,
        confidence: 0.99,
      },
      {
        source: "supervisor",
        target: "navigation",
        message: "Requesting current-assisted course from Veraval Harbor to target PFZ coordinate.",
        type: "dispatch",
        latencyMs: 12,
      },
      {
        source: "navigation",
        target: "synthesizer",
        message: "Course: 215° bearing, 28.4 NM. 1.2 kt tailcurrent saves 18.4% fuel. Estimated transit: 2h 45m.",
        type: "result",
        latencyMs: 148,
        confidence: 0.95,
      },
      {
        source: "synthesizer",
        message: "Consensus validated. Formatted bilingual advisory in Gujarati & English. Ready for dispatch.",
        type: "synthesis",
        latencyMs: 64,
        confidence: 0.96,
      },
    ],
    finalOutput: `[SEA STATUS: VERIFIED - SAFE TO VENTURE]\n\nTarget PFZ 28 km SW of Veraval at **20.75°N, 70.19°E** confirmed for **Yellowfin Tuna**.\n\n• **SST**: 28.4°C (Peak thermal front)\n• **Chl-a**: 1.26 mg/m³ (+18.4% anomaly)\n• **IMBL Clearance**: 74.2 km (SAFE GREEN)\n• **Optimal Bearing**: 215° with 1.2 kt tailcurrent assist (18.4% fuel saving)\n• **Solunar Feed Window**: 04:30 – 07:30 IST`,
  },
  {
    id: "border_risk",
    name: "IMBL Proximity Alert",
    icon: AlertTriangle,
    color: "#f43f5e",
    query: "Vessel IND-GJ-04-MM-1982 heading 285° at 8.2 knots near Pakistani maritime line.",
    activeAgents: ["supervisor", "risk_geofencing", "navigation", "synthesizer"],
    logs: [
      {
        source: "supervisor",
        target: "risk_geofencing",
        message: "URGENT: Kinetic track evaluation for vessel heading 285° northwest.",
        type: "dispatch",
        latencyMs: 8,
      },
      {
        source: "risk_geofencing",
        target: "navigation",
        message: "ST_DWithin breach detected: Vessel is 3.8 NM from Pakistan IMBL! Time to breach: 26 minutes.",
        type: "safety_check",
        latencyMs: 24,
        confidence: 0.99,
      },
      {
        source: "navigation",
        target: "synthesizer",
        message: "Emergency evasion vector computed: Immediate hard turn to 135° SE to re-enter Indian EEZ core.",
        type: "result",
        latencyMs: 42,
        confidence: 0.98,
      },
      {
        source: "synthesizer",
        message: "High-priority siren alert dispatched via VHF Channel 16 & NavIC SMS broadcast.",
        type: "synthesis",
        latencyMs: 31,
        confidence: 0.99,
      },
    ],
    finalOutput: `[CRITICAL BORDER PROXIMITY ALERT - IMMEDIATE ACTION REQUIRED]\n\n• **Vessel**: IND-GJ-04-MM-1982\n• **Distance to IMBL**: **3.8 Nautical Miles**\n• **Estimated Incursion**: **26 minutes at current speed**\n\n[MANDATORY EVASION COURSE]: Steer **135° SE** immediately to maintain sovereign clearance. Indian Coast Guard station alerted.`,
  },
  {
    id: "monsoon_ban",
    name: "Monsoon Ban & Regulation",
    icon: BookOpen,
    color: "#a855f7",
    query: "Are mechanized bottom trawlers allowed to operate 15 NM off Mangalore in June?",
    activeAgents: ["supervisor", "policy_rag", "risk_geofencing", "synthesizer"],
    logs: [
      {
        source: "supervisor",
        target: "policy_rag",
        message: "Querying Karnataka Marine Fisheries Regulation Act (KMFRA) monsoon ban dates.",
        type: "dispatch",
        latencyMs: 15,
      },
      {
        source: "policy_rag",
        target: "synthesizer",
        message: "Matched clause: Uniform 61-day monsoon fishing ban on West Coast applies from June 1 to July 31.",
        type: "result",
        latencyMs: 89,
        confidence: 0.98,
      },
      {
        source: "risk_geofencing",
        target: "synthesizer",
        message: "15 NM coordinate falls inside Karnataka territorial surveillance geofence.",
        type: "safety_check",
        latencyMs: 28,
        confidence: 0.99,
      },
      {
        source: "synthesizer",
        message: "Formulated advisory citing legal penalties under Section 7 of KMFRA.",
        type: "synthesis",
        latencyMs: 42,
        confidence: 0.97,
      },
    ],
    finalOutput: `[OPERATION PROHIBITED: MONSOON TRAWLING BAN ACTIVE]\n\nUnder the **Karnataka Marine Fishing (Regulation) Act, 1986** and Central Ministry directive:\n• **Period**: June 1 to July 31 (61 days)\n• **Applicability**: All mechanized vessels and bottom trawlers\n• **Exemption**: Traditional non-mechanized crafts (up to 10 HP motors) operating within territorial waters\n• **Penalty**: Confiscation of catch and suspension of diesel subsidy.`,
  },
  {
    id: "navigation",
    name: "Fuel-Optimal Eco-Route",
    icon: Compass,
    color: "#f59e0b",
    query: "Plot fuel-efficient commercial route from Kochi to Kavaratti Island avoiding monsoon swell.",
    activeAgents: ["supervisor", "ocean_analytics", "navigation", "synthesizer"],
    logs: [
      {
        source: "supervisor",
        target: "ocean_analytics",
        message: "Fetching Lakshadweep Sea current vector grid & wave spectra model.",
        type: "dispatch",
        latencyMs: 19,
      },
      {
        source: "ocean_analytics",
        target: "navigation",
        message: "Surface current: 1.8 kts westward drift. SWH wave height: 2.1m reducing to 1.4m south of Kalpeni.",
        type: "result",
        latencyMs: 135,
        confidence: 0.94,
      },
      {
        source: "navigation",
        target: "synthesizer",
        message: "Continuous A* computed 4-waypoint route riding westward current jet. Fuel saving: 14.8%.",
        type: "result",
        latencyMs: 210,
        confidence: 0.96,
      },
      {
        source: "synthesizer",
        message: "Generated GPX & GeoJSON waypoint corridor with ETA and bunkering telemetry.",
        type: "synthesis",
        latencyMs: 51,
        confidence: 0.95,
      },
    ],
    finalOutput: `[FUEL-OPTIMAL ECO-ROUTE CALCULATED - KOCHI TO KAVARATTI]\n\n• **Total Distance**: 224.6 Nautical Miles\n• **Estimated Time of Arrival**: 18 hours 40 mins @ 12.0 kts\n• **Net Fuel Saving**: **14.8%** (230 Liters saved)\n• **Strategy**: Slight southward deflection via Kalpeni channel to utilize 1.8 kt westward jet and avoid 2.6m swell zone.\n• **GeoJSON Corridor**: Export ready for ECDIS / NavIC receiver.`,
  },
];

// Glassmorphism tokens (Clean White Theme)
const glassPanel = {
  background: "rgba(255, 255, 255, 0.98)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
} as React.CSSProperties;

export default function AgentTopologyVisualizer() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("supervisor");
  const [activeScenario, setActiveScenario] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
  const [customQuery, setCustomQuery] = useState(PRESET_SCENARIOS[0].query);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [displayedLogs, setDisplayedLogs] = useState<AuditLogEntry[]>([]);
  const [activePulseNodes, setActivePulseNodes] = useState<AgentId[]>([]);
  const [tokenUsage, setTokenUsage] = useState({ prompt: 1420, completion: 480, total: 1900, max: 8192 });
  const [logFilter, setLogFilter] = useState<string>("all");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedLogs]);

  // Execute step-by-step simulation
  const executeSimulation = useCallback((scenario: PresetScenario) => {
    setIsRunning(true);
    setCurrentStepIndex(0);
    setDisplayedLogs([]);
    setActivePulseNodes(["supervisor"]);

    const logs = scenario.logs;
    let step = 0;

    const interval = setInterval(() => {
      if (step < logs.length) {
        const entry = logs[step];
        const newLog: AuditLogEntry = {
          ...entry,
          id: Math.random().toString(36).slice(2, 9),
          timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
        };

        setDisplayedLogs((prev) => [...prev, newLog]);
        setCurrentStepIndex(step);

        // Highlight active nodes
        const active: AgentId[] = [entry.source];
        if (entry.target) active.push(entry.target);
        setActivePulseNodes(active);

        // Update simulated tokens
        setTokenUsage((prev) => ({
          ...prev,
          prompt: prev.prompt + Math.floor(Math.random() * 80 + 40),
          completion: prev.completion + Math.floor(Math.random() * 50 + 20),
          total: prev.prompt + prev.completion,
        }));

        step++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setActivePulseNodes(["synthesizer"]);
      }
    }, 950);

    return () => clearInterval(interval);
  }, []);

  // Run initial scenario on mount
  useEffect(() => {
    executeSimulation(activeScenario);
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetScenario) => {
    setActiveScenario(preset);
    setCustomQuery(preset.query);
    executeSimulation(preset);
  };

  // Particles animation along graph edges
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle structures
    const particles: {
      x: number;
      y: number;
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      progress: number;
      speed: number;
      color: string;
    }[] = [];

    const supervisorPos = { x: (AGENTS.supervisor.x / 100) * width, y: (AGENTS.supervisor.y / 100) * height };
    const synthesizerPos = { x: (AGENTS.synthesizer.x / 100) * width, y: (AGENTS.synthesizer.y / 100) * height };

    const workerKeys: AgentId[] = ["ocean_analytics", "risk_geofencing", "navigation", "policy_rag"];

    // Spawn animated particles
    const spawnTimer = setInterval(() => {
      const workerKey = workerKeys[Math.floor(Math.random() * workerKeys.length)];
      const worker = AGENTS[workerKey];
      const workerPos = { x: (worker.x / 100) * width, y: (worker.y / 100) * height };

      // Supervisor -> Worker
      particles.push({
        x: supervisorPos.x,
        y: supervisorPos.y,
        startX: supervisorPos.x,
        startY: supervisorPos.y,
        targetX: workerPos.x,
        targetY: workerPos.y,
        progress: 0,
        speed: 0.012 + Math.random() * 0.008,
        color: AGENTS.supervisor.accent,
      });

      // Worker -> Synthesizer
      setTimeout(() => {
        particles.push({
          x: workerPos.x,
          y: workerPos.y,
          startX: workerPos.x,
          startY: workerPos.y,
          targetX: synthesizerPos.x,
          targetY: synthesizerPos.y,
          progress: 0,
          speed: 0.014 + Math.random() * 0.008,
          color: worker.accent,
        });
      }, 500);
    }, 420);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Edges with gradient glowing lines
      workerKeys.forEach((key) => {
        const worker = AGENTS[key];
        const wx = (worker.x / 100) * width;
        const wy = (worker.y / 100) * height;

        // Edge: Supervisor -> Worker
        ctx.beginPath();
        ctx.moveTo(supervisorPos.x, supervisorPos.y);
        ctx.bezierCurveTo(
          (supervisorPos.x + wx) / 2, supervisorPos.y,
          (supervisorPos.x + wx) / 2, wy,
          wx, wy
        );
        ctx.strokeStyle = "rgba(37, 99, 235, 0.40)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Edge: Worker -> Synthesizer
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.bezierCurveTo(
          (wx + synthesizerPos.x) / 2, wy,
          (wx + synthesizerPos.x) / 2, synthesizerPos.y,
          synthesizerPos.x, synthesizerPos.y
        );
        ctx.strokeStyle = `${worker.accent}55`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;

        // Bezier interpolation
        const midX = (p.startX + p.targetX) / 2;
        const t = p.progress;
        const cx1 = midX;
        const cy1 = p.startY;
        const cx2 = midX;
        const cy2 = p.targetY;

        p.x = Math.pow(1 - t, 3) * p.startX +
              3 * Math.pow(1 - t, 2) * t * cx1 +
              3 * (1 - t) * Math.pow(t, 2) * cx2 +
              Math.pow(t, 3) * p.targetX;

        p.y = Math.pow(1 - t, 3) * p.startY +
              3 * Math.pow(1 - t, 2) * t * cy1 +
              3 * (1 - t) * Math.pow(t, 2) * cy2 +
              Math.pow(t, 3) * p.targetY;

        // Particle Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.progress >= 1) {
          particles.splice(i, 1);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(spawnTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const agentDetail = AGENTS[selectedAgent];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 pt-4 pb-20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TOP BRAND & SOVEREIGN BADGE BAR                                         */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 border border-zinc-200 bg-white shadow-sm"
          style={glassPanel}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-mono font-bold transition-all hover:bg-zinc-100 text-zinc-800 bg-zinc-50"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-blue-600" />
              <span>3D Globe</span>
            </Link>

            <div className="h-5 w-px bg-zinc-200 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-blue-600 tracking-wider">
                  PROJECT ORCA · MULTI-AGENT SWARM
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  SIH26176
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Live Topology Graph, Memory Token Gauge & Real-Time XAI Execution Auditor
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono bg-emerald-50 border-emerald-200 text-emerald-700"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">100% AIR-GAPPED SOVEREIGN</span>
            </div>

            <button
              onClick={() => executeSimulation(activeScenario)}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
              <span>Replay DAG</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* INTERACTIVE PRESETS & QUERY LAUNCHER                                    */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl p-4 sm:p-5 border border-zinc-200 bg-white space-y-4 shadow-sm" style={glassPanel}>
          {/* Preset Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-blue-600" />
              Select SIH Presentation Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SCENARIOS.map((preset) => {
                const isSelected = activeScenario.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all hover:scale-105 active:scale-95 ${
                      isSelected
                        ? "bg-blue-50 border-2 text-zinc-900 font-bold shadow-xs"
                        : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                    style={{
                      borderColor: isSelected ? preset.color : undefined,
                    }}
                  >
                    {(() => {
                      const PresetIcon = preset.icon;
                      return <PresetIcon className="h-3.5 w-3.5" style={{ color: preset.color }} />;
                    })()}
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Query Input */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-zinc-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Enter maritime question for multi-agent DAG evaluation..."
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-zinc-900 placeholder-zinc-400 outline-none focus:bg-white focus:border-blue-600 shadow-xs"
              />
            </div>
            <button
              onClick={() => {
                const customScenario: PresetScenario = {
                  ...activeScenario,
                  query: customQuery,
                };
                executeSimulation(customScenario);
              }}
              disabled={isRunning}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition shadow-xs hover:bg-blue-700 disabled:opacity-40 bg-blue-600 text-white cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Execute DAG Swarm</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* MAIN VISUALIZER: TOPOLOGY GRAPH CANVAS + LIVE METRICS GAUGES            */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: 2D Multi-Agent Network Topology Canvas */}
          <div className="lg:col-span-2 rounded-3xl p-6 border border-zinc-200 bg-white relative overflow-hidden flex flex-col justify-between shadow-sm" style={{ ...glassPanel, minHeight: 520 }}>
            {/* Canvas Header */}
            <div className="flex items-center justify-between z-10 mb-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                <span className="text-blue-600 font-bold">LANGGRAPH MULTI-AGENT TOPOLOGY</span>
                <span className="text-zinc-400">· Directed Acyclic Graph</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                Click any agent node to inspect runtime state
              </div>
            </div>

            {/* Canvas Container with Interactive Nodes */}
            <div className="relative flex-1 w-full h-full min-h-[420px] bg-slate-50/50 rounded-2xl border border-zinc-100">
              {/* HTML5 Canvas for animated particle streams */}
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

              {/* Interactive Agent Nodes */}
              {Object.values(AGENTS).map((agent) => {
                const isSelected = selectedAgent === agent.id;
                const isPulsing = activePulseNodes.includes(agent.id);

                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform duration-200 hover:scale-110"
                    style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
                  >
                    {/* Outer Glowing Rings */}
                    {isPulsing && (
                      <div
                        className="absolute -inset-2.5 rounded-2xl animate-ping opacity-25"
                        style={{ background: agent.accent }}
                      />
                    )}

                    {/* Node Card */}
                    <div
                      className="rounded-2xl p-3 sm:p-3.5 border flex items-center gap-3 shadow-sm transition-all"
                      style={{
                        background: isSelected ? "#ffffff" : "#ffffff",
                        borderColor: isSelected ? agent.accent : isPulsing ? agent.accent : "#e2e8f0",
                        boxShadow: isSelected || isPulsing ? `0 4px 16px ${agent.accent}35` : "0 1px 3px rgba(0,0,0,0.06)",
                        width: agent.id === "supervisor" || agent.id === "synthesizer" ? 170 : 160,
                      }}
                    >
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border"
                        style={{ background: `${agent.accent}15`, borderColor: `${agent.accent}35` }}
                      >
                        {(() => {
                          const AgentIcon = agent.icon;
                          return <AgentIcon className="h-5 w-5" style={{ color: agent.accent }} />;
                        })()}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold font-mono tracking-wider text-zinc-900">
                          {agent.label}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">
                          {agent.sub}
                        </div>
                        {isPulsing && (
                          <div className="text-[9px] font-mono font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Topology Legend Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 z-10 text-[10px] font-mono text-zinc-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  <span>Cognitive Orchestrator</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Bio-Physical Workers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Consensus Synthesizer</span>
                </div>
              </div>
              <div className="text-zinc-400">
                Zero cloud egress · Local Inference Guaranteed
              </div>
            </div>
          </div>

          {/* Right 1 Col: Agent Inspector & Memory Token Gauge */}
          <div className="space-y-6">
            {/* Agent Node Inspector */}
            <div className="rounded-3xl p-5 border border-zinc-200 bg-white space-y-4 shadow-sm" style={glassPanel}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-blue-600 uppercase font-bold flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Agent State Inspector
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  NODE: {agentDetail.id.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                {(() => {
                  const DetailIcon = agentDetail.icon;
                  return (
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center border"
                      style={{ background: `${agentDetail.accent}15`, borderColor: `${agentDetail.accent}40` }}
                    >
                      <DetailIcon className="h-5 w-5" style={{ color: agentDetail.accent }} />
                    </div>
                  );
                })()}
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">{agentDetail.label}</h4>
                  <div className="text-[11px] font-mono text-zinc-500">{agentDetail.model}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Assigned Operational Role:</div>
                <p className="text-xs text-zinc-700 leading-relaxed">
                  {agentDetail.role}
                </p>
              </div>

              <div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Active Sovereign Tools:</div>
                <div className="flex flex-wrap gap-1.5">
                  {agentDetail.activeTools.map((tool) => (
                    <span key={tool} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-blue-700">
                      <Zap className="h-3 w-3 inline mr-1 text-blue-600" />{tool}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">System Prompt Directive:</div>
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-600 leading-relaxed max-h-24 overflow-y-auto">
                  {agentDetail.systemPrompt}
                </div>
              </div>
            </div>

            {/* Memory Token Gauge & Inference Metrics */}
            <div className="rounded-3xl p-5 border border-zinc-200 bg-white space-y-4 shadow-sm" style={glassPanel}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-amber-600 uppercase font-bold flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  Memory & KV Token Gauge
                </div>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold">vLLM / AWQ</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Context Allocation:</span>
                  <span className="text-blue-600 font-bold">{tokenUsage.total.toLocaleString()} / {tokenUsage.max.toLocaleString()} tokens</span>
                </div>
                <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden border border-zinc-200">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-amber-500 to-blue-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(tokenUsage.total / tokenUsage.max) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Prompt: {tokenUsage.prompt} tk</span>
                  <span>Completion: {tokenUsage.completion} tk</span>
                  <span>Free: {(tokenUsage.max - tokenUsage.total).toLocaleString()} tk</span>
                </div>
              </div>

              {/* Latency & Compression telemetry */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="text-[10px] text-zinc-500">Avg DAG Latency</div>
                  <div className="font-bold text-emerald-600 text-sm mt-0.5">382 ms</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="text-[10px] text-zinc-500">KV Compression</div>
                  <div className="font-bold text-amber-600 text-sm mt-0.5">4-bit AWQ (3.2x)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* REAL-TIME XAI EXECUTION AUDIT LOG STREAM                                */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl p-6 border border-zinc-200 bg-white space-y-4 shadow-sm" style={glassPanel}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-mono font-bold text-zinc-900">
                Real-Time XAI Execution Audit Log Stream (JSONL Verified)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                {displayedLogs.length} Events
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(displayedLogs, null, 2));
                  const downloadAnchor = document.createElement("a");
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `orca_agent_audit_${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border text-blue-600 border-zinc-200 hover:bg-zinc-50 transition cursor-pointer shadow-xs"
              >
                <Download className="h-3 w-3" />
                <span>Export Audit JSON</span>
              </button>
            </div>
          </div>

          {/* Log Stream Container */}
          <div className="rounded-2xl p-4 bg-zinc-50 border border-zinc-200 font-mono text-xs max-h-72 overflow-y-auto space-y-2">
            {displayedLogs.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 font-mono text-xs">
                Executing cognitive multi-agent DAG...
              </div>
            ) : (
              displayedLogs.map((log) => {
                const srcAgent = AGENTS[log.source];
                const tgtAgent = log.target ? AGENTS[log.target] : null;

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-white border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-blue-300 transition shadow-xs"
                  >
                    <div className="flex items-start sm:items-center gap-2 min-w-0">
                      <span className="text-[10px] text-zinc-400 flex-shrink-0">{log.timestamp}</span>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${srcAgent.accent}15`, color: srcAgent.accent }}>
                          {srcAgent.label}
                        </span>
                        {tgtAgent && (
                          <>
                            <ArrowRight className="h-3 w-3 text-zinc-400" />
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${tgtAgent.accent}15`, color: tgtAgent.accent }}>
                              {tgtAgent.label}
                            </span>
                          </>
                        )}
                      </div>

                      <span className="text-xs text-zinc-800 truncate">{log.message}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 text-[10px]">
                      {log.confidence && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          {(log.confidence * 100).toFixed(0)}% Conf
                        </span>
                      )}
                      {log.latencyMs && (
                        <span className="text-zinc-500 font-medium">
                          +{log.latencyMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Final Synthesized Output Card */}
          {!isRunning && displayedLogs.length > 0 && (
            <div className="mt-4 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-2 animate-fadeIn shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Synthesizer Final Consensus Output (Air-Gapped Result)
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">Zero Hallucination Guarantee</span>
              </div>
              <div className="text-xs text-zinc-900 leading-relaxed whitespace-pre-line font-sans">
                {activeScenario.finalOutput}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
