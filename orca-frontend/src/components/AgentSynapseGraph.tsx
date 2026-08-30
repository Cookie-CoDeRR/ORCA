"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Layers,
  Info,
  CheckCircle2,
  Sliders,
  Flame,
  ShieldAlert,
  Navigation,
  BookOpen,
  Waves,
} from "lucide-react";

export interface SynapseNode {
  id: string;
  layer: number; // 0 to 4
  index: number;
  label: string;
  sublabel: string;
  category: "ingress" | "supervisor" | "ocean" | "risk" | "navigation" | "policy" | "synthesis" | "egress";
  agentRef?: string;
  color: string;
  glowColor: string;
  activeInScenarios: string[];
  activation: number;
  mathFormula?: string;
  activePayload?: string;
}

export interface SynapseConnection {
  sourceId: string;
  targetId: string;
  sourceCategory: string;
  targetCategory: string;
  color: string;
  weight: number;
  active: boolean;
}

// ─── Color Palette by Domain ──────────────────────────────────────────────────
const DOMAIN_COLORS: Record<
  string,
  { hex: string; rgb: string; glow: string; label: string }
> = {
  ingress:    { hex: "#38bdf8", rgb: "56, 189, 248",  glow: "rgba(56, 189, 248, 0.6)",  label: "Sensory Ingress" },
  supervisor: { hex: "#a855f7", rgb: "168, 85, 247", glow: "rgba(168, 85, 247, 0.6)", label: "Supervisor LLM" },
  ocean:      { hex: "#10b981", rgb: "16, 185, 129", glow: "rgba(16, 185, 129, 0.6)", label: "Ocean Analytics" },
  risk:       { hex: "#f43f5e", rgb: "244, 63, 94",  glow: "rgba(244, 63, 94, 0.6)",  label: "Risk & Geofencing" },
  navigation: { hex: "#06b6d4", rgb: "6, 182, 212",  glow: "rgba(6, 182, 212, 0.6)",  label: "Vector Navigation" },
  policy:     { hex: "#f59e0b", rgb: "245, 158, 11",  glow: "rgba(245, 158, 11, 0.6)",  label: "Policy RAG" },
  synthesis:  { hex: "#e0f2fe", rgb: "224, 242, 254", glow: "rgba(224, 242, 254, 0.7)", label: "Synthesizer CoT" },
  egress:     { hex: "#818cf8", rgb: "129, 140, 248", glow: "rgba(129, 140, 248, 0.6)", label: "Egress Actuation" },
};

// ─── Preset Scenarios for Deterministic Multi-Agent Testing ───────────────────
export const TEST_SCENARIOS = [
  {
    id: "veraval_tuna",
    title: "1. Veraval Pelagic PFZ Feasibility",
    badge: "Fisheries & IMBL",
    badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
    query: "Can 4 mechanized boats fish 30km off Veraval for Tuna tomorrow morning?",
    activeNodes: [
      "l0_query", "l0_coords", "l0_target", "l0_basin",
      "l1_qwen", "l1_pydantic", "l1_gazetteer", "l1_dispatch",
      "l2_ocean", "l2_pfz", "l2_geofence", "l2_rag",
      "l3_reconcile", "l3_indic", "l3_geojson", "l3_risk_gate",
      "l4_deckgl", "l4_advisory", "l4_action_card", "l4_telemetry"
    ],
  },
  {
    id: "imbl_alert",
    title: "2. Palk Strait Border Standoff Warning",
    badge: "Defense & Border",
    badgeColor: "text-rose-400 border-rose-500/30 bg-rose-950/40",
    query: "Am I crossing the Sri Lanka IMBL boundary near Rameswaram?",
    activeNodes: [
      "l0_query", "l0_coords", "l0_vessel",
      "l1_qwen", "l1_pydantic", "l1_gazetteer", "l1_dispatch",
      "l2_geofence", "l2_mpa", "l2_rag",
      "l3_reconcile", "l3_risk_gate", "l3_geojson",
      "l4_deckgl", "l4_advisory", "l4_voice"
    ],
  },
  {
    id: "mumbai_kochi_route",
    title: "3. Mumbai → Kochi Current-Assisted A* Path",
    badge: "Fuel Optimization",
    badgeColor: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
    query: "What is the optimal fuel route from Mumbai to Kochi considering ocean currents?",
    activeNodes: [
      "l0_query", "l0_coords", "l0_vessel", "l0_time",
      "l1_qwen", "l1_pydantic", "l1_dispatch",
      "l2_astar", "l2_fuel", "l2_ocean",
      "l3_reconcile", "l3_geojson", "l3_indic",
      "l4_deckgl", "l4_advisory", "l4_action_card", "l4_telemetry"
    ],
  },
];

// ─── 5-Layer Multi-Agent Neural Synapse Definition ─────────────────────────────
const SYNAPSE_LAYERS_DATA = [
  {
    title: "1. Sensory Ingress",
    subtitle: "Prompt & Geocoded State",
    category: "ingress",
    nodes: [
      { id: "l0_query", label: "NL Token Stream", sublabel: "Parsed user tokens", category: "ingress" as const, payload: "Can 4 boats fish off Veraval?" },
      { id: "l0_coords", label: "Spatial Geo-Hash", sublabel: "[20.902°N, 70.368°E]", category: "ingress" as const, payload: "Veraval Landing Center" },
      { id: "l0_time", label: "Temporal Window", sublabel: "T+24h Horizon", category: "ingress" as const, payload: "2026-08-31 06:00 UTC" },
      { id: "l0_vessel", label: "Vessel Profile", sublabel: "Mechanized Trawler", category: "ingress" as const, payload: "Draft: 3.2m | Speed: 10kt" },
      { id: "l0_target", label: "Species Intent", sublabel: "Yellowfin Tuna / Mackerel", category: "ingress" as const, payload: "Target: Pelagic Finfish" },
      { id: "l0_basin", label: "Basin Context", sublabel: "Arabian Sea EEZ", category: "ingress" as const, payload: "Gujarat Coastal Waters" },
    ],
  },
  {
    title: "2. Supervisor Matrix",
    subtitle: "Qwen 2.5 7B Decomposition",
    category: "supervisor",
    nodes: [
      { id: "l1_qwen", label: "Qwen 2.5 Router", sublabel: "Zero-Shot Intent Classifier", category: "supervisor" as const, agentRef: "supervisor", math: "P(\\text{tasks}|X) = \\text{softmax}(W X)" },
      { id: "l1_pydantic", label: "Pydantic Validator", sublabel: "SubTaskPlan JSON Schema", category: "supervisor" as const, agentRef: "supervisor", payload: "Strict JSON SubTaskPlan" },
      { id: "l1_gazetteer", label: "Coastal Gazetteer", sublabel: "Sovereign Port Hash", category: "supervisor" as const, agentRef: "supervisor", payload: "Veraval -> [20.902, 70.368]" },
      { id: "l1_dispatch", label: "Parallel Dispatch", sublabel: "Async Worker Fan-Out", category: "supervisor" as const, agentRef: "supervisor", payload: "Parallel Asynchronous Task Spawn" },
    ],
  },
  {
    title: "3. Specialized Worker Swarm",
    subtitle: "Parallel Execution Engines",
    category: "workers",
    nodes: [
      { id: "l2_ocean", label: "Ocean Analytics (SST)", sublabel: "Thermal & Chl Fronts", category: "ocean" as const, agentRef: "ocean_analytics", math: "\\nabla SST \\ge 0.75^{\\circ}\\text{C/km}", payload: "SST: 28.4°C | Chl: 1.26 mg/m³" },
      { id: "l2_pfz", label: "PFZ Cluster Detector", sublabel: "Pelagic Species Rank", category: "ocean" as const, agentRef: "ocean_analytics", math: "PFZ_{conf} = 88\\% \\text{ (Tuna)}", payload: "PFZ Cluster @ [20.652, 70.118]" },
      { id: "l2_geofence", label: "PostGIS IMBL Check", sublabel: "Sub-meter Geodesic", category: "risk" as const, agentRef: "risk_geofencing", math: "D_{IMBL} = 45.0\\text{ km (Safe)}", payload: "Distance to Pak IMBL: 45.0 km" },
      { id: "l2_mpa", label: "MPA / Sanctuary Check", sublabel: "No-Trawl Zone Intersect", category: "risk" as const, agentRef: "risk_geofencing", math: "ST\\_Intersects(V, MPA) = \\emptyset", payload: "Clear of Marine Sanctuary" },
      { id: "l2_astar", label: "Eulerian A* Router", sublabel: "Ocean Current Pathing", category: "navigation" as const, agentRef: "navigation", math: "\\vec{V}_{g} = \\vec{V}_{s} + \\vec{V}_{cur}", payload: "18.0 NM | SOG: 11.32 kt" },
      { id: "l2_fuel", label: "Fuel Delta Optimizer", sublabel: "Kinematic Conservation", category: "navigation" as const, agentRef: "navigation", math: "\\Delta Fuel = -22.0\\%", payload: "Fuel Reduction: -22% via Current" },
      { id: "l2_rag", label: "Policy RAG (BGE-M3)", sublabel: "Monsoon Bans & SOPs", category: "policy" as const, agentRef: "policy_rag", math: "1 - (E_{q} \\cdot E_{doc}) \\le 0.15", payload: "Monsoon Ban Inactive (Safe)" },
    ],
  },
  {
    title: "4. Synthesis Layer",
    subtitle: "Evidence Reconciliation & CoT",
    category: "synthesis",
    nodes: [
      { id: "l3_reconcile", label: "Cross-Agent CoT", sublabel: "Evidence Correlator", category: "synthesis" as const, agentRef: "synthesizer", payload: "All 4 Domain Outputs Reconciled" },
      { id: "l3_indic", label: "Indic Language Trans", sublabel: "Regional Multilingual", category: "synthesis" as const, agentRef: "synthesizer", payload: "Localized to EN / GU / HI" },
      { id: "l3_geojson", label: "GeoJSON Generator", sublabel: "DeckGL Layer Payloads", category: "synthesis" as const, agentRef: "synthesizer", payload: "4 Deck.GL Layers Compiled" },
      { id: "l3_risk_gate", label: "Safety Gate Evaluator", sublabel: "Executive Safe / Caution", category: "synthesis" as const, agentRef: "synthesizer", payload: "Overall: Green (Operable)" },
    ],
  },
  {
    title: "5. Egress Actuation",
    subtitle: "Multi-Modal Operational Outputs",
    category: "egress",
    nodes: [
      { id: "l4_deckgl", label: "[0] 2.5D Map Overlays", sublabel: "PFZ + Corridors + AIS", category: "egress" as const, payload: "Interactive Deck.GL Canvas Updated" },
      { id: "l4_advisory", label: "[1] Actionable Advisory", sublabel: "Executive Briefing", category: "egress" as const, payload: "Clean Markdown Advisory Emitted" },
      { id: "l4_action_card", label: "[2] Synthesized Action Card", sublabel: "88% PFZ | -22% Fuel", category: "egress" as const, payload: "Telemetry Card Updated" },
      { id: "l4_voice", label: "[3] VHF / Voice Broadcast", sublabel: "Marine Audio Stream", category: "egress" as const, payload: "VHF Channel 16 Broadcast Ready" },
      { id: "l4_telemetry", label: "[4] Live Telemetry Strip", sublabel: "SST, SWH, Chl-a, Wind", category: "egress" as const, payload: "28.4°C | 1.26mg/m³ | 1.6m" },
    ],
  },
];

interface AgentSynapseGraphProps {
  onNodeSelect?: (nodeId: string, agentRef?: string) => void;
  selectedAgentRef?: string;
}

export default function AgentSynapseGraph({
  onNodeSelect,
  selectedAgentRef,
}: AgentSynapseGraphProps) {
  const [selectedScenario, setSelectedScenario] = useState(TEST_SCENARIOS[0]);
  const [hoveredNode, setHoveredNode] = useState<SynapseNode | null>(null);
  const [activeStep, setActiveStep] = useState<number>(4); // 0 to 4 (default completed)
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Trigger deterministic turn simulation
  const handleRunExecution = () => {
    setIsExecuting(true);
    setActiveStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step <= 4) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        setIsExecuting(false);
      }
    }, 700); // 700ms per stage = 3.5s complete cycle
  };

  // Reset to static completed state
  const handleReset = () => {
    setIsExecuting(false);
    setActiveStep(4);
  };

  // Compute node coordinates and synaptic connections
  const { allNodes, connections } = useMemo(() => {
    const nodes: (SynapseNode & { x: number; y: number })[] = [];
    const conns: (SynapseConnection & { x1: number; y1: number; x2: number; y2: number })[] = [];

    const layerCount = SYNAPSE_LAYERS_DATA.length;

    SYNAPSE_LAYERS_DATA.forEach((layerDef, lIdx) => {
      const nodeCount = layerDef.nodes.length;
      const xPercent = 8 + (lIdx / (layerCount - 1)) * 84; // 8% to 92%

      layerDef.nodes.forEach((n: any, nIdx: number) => {
        const yPercent = 14 + ((nIdx + 0.5) / nodeCount) * 72; // 14% to 86%
        const domInfo = DOMAIN_COLORS[n.category] || DOMAIN_COLORS.ingress;

        // Is this node part of the currently active scenario?
        const isScenarioRelevant = selectedScenario.activeNodes.includes(n.id);
        // Is this layer currently active in the execution wave?
        const isLayerActive = lIdx <= activeStep;

        const activation = isScenarioRelevant && isLayerActive ? 1.0 : isScenarioRelevant ? 0.4 : 0.08;

        const nodeObj: SynapseNode & { x: number; y: number } = {
          id: n.id,
          layer: lIdx,
          index: nIdx,
          label: n.label,
          sublabel: n.sublabel,
          category: n.category,
          agentRef: n.agentRef,
          color: domInfo.hex,
          glowColor: domInfo.glow,
          activeInScenarios: [selectedScenario.id],
          activation,
          mathFormula: n.math,
          activePayload: n.payload,
          x: xPercent,
          y: yPercent,
        };
        nodes.push(nodeObj);
      });
    });

    // Build connections only between layers
    for (let lIdx = 0; lIdx < layerCount - 1; lIdx++) {
      const currentLayerNodes = nodes.filter((n) => n.layer === lIdx);
      const nextLayerNodes = nodes.filter((n) => n.layer === lIdx + 1);

      currentLayerNodes.forEach((src) => {
        nextLayerNodes.forEach((tgt) => {
          const srcActive = selectedScenario.activeNodes.includes(src.id);
          const tgtActive = selectedScenario.activeNodes.includes(tgt.id);
          const isPathActive = srcActive && tgtActive;
          const isWavePassing = isPathActive && lIdx === activeStep - 1;

          const dist = Math.abs(src.index / currentLayerNodes.length - tgt.index / nextLayerNodes.length);
          const weight = Math.max(0.15, 1.0 - dist * 1.3);

          conns.push({
            sourceId: src.id,
            targetId: tgt.id,
            sourceCategory: src.category,
            targetCategory: tgt.category,
            color: isWavePassing ? "#ffffff" : isPathActive ? src.color : "rgba(255,255,255,0.06)",
            weight,
            active: isPathActive,
            x1: src.x,
            y1: src.y,
            x2: tgt.x,
            y2: tgt.y,
          });
        });
      });
    }

    return { allNodes: nodes, connections: conns };
  }, [selectedScenario, activeStep]);

  return (
    <div
      className="relative w-full h-full min-h-[580px] bg-black select-none overflow-hidden rounded-2xl border border-white/10 flex flex-col justify-between p-4 md:p-6"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #080d16 0%, #000000 100%)",
      }}
    >
      {/* ━━━ TOP CONTROLS & SCENARIO SELECTOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white text-black font-black">
              <Zap className="h-4 w-4 fill-black" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Deterministic Multi-Agent Synaptic Graph
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              NO RANDOM BLINKING · TRIGGERED ROUTING
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
            Nodes and synapses activate strictly based on intent decomposition and active agent tasks.
          </p>
        </div>

        {/* Scenario Selection Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TEST_SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc);
                  setActiveStep(4);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-white text-black border-white shadow-md font-bold"
                    : "bg-zinc-900/80 text-zinc-400 border-white/10 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {sc.title.split(". ")[1]}
              </button>
            );
          })}

          <button
            onClick={handleRunExecution}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 ml-1"
          >
            {isExecuting ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                <span>Stage {activeStep + 1}/5...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-black" />
                <span>Simulate Turn</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ━━━ MAIN SYNAPSE CANVAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative flex-1 w-full h-full my-2">
        {/* SVG Cubic Bezier Filaments */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <filter id="synapseGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {connections.map((c, i) => {
            const isHoverRelevant =
              hoveredNode && (hoveredNode.id === c.sourceId || hoveredNode.id === c.targetId);

            const xMid = (c.x1 + c.x2) / 2;
            const pathD = `M ${c.x1}% ${c.y1}% C ${xMid}% ${c.y1}%, ${xMid}% ${c.y2}%, ${c.x2}% ${c.y2}%`;

            let strokeColor = c.color;
            let strokeWidth = c.active ? Math.max(1.2, c.weight * 2.4) : 0.6;
            let strokeOpacity = isHoverRelevant ? 1.0 : c.active ? 0.75 : 0.08;

            if (isHoverRelevant) {
              strokeColor = "#ffffff";
              strokeWidth = 2.8;
            }

            return (
              <path
                key={`${c.sourceId}-${c.targetId}-${i}`}
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                filter={c.active || isHoverRelevant ? "url(#synapseGlow)" : undefined}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Column Headers with Domain Indicators */}
        <div className="absolute inset-x-0 top-0 flex justify-between px-2 pointer-events-none z-10">
          {SYNAPSE_LAYERS_DATA.map((layer, idx) => {
            const isStageActive = idx <= activeStep;
            return (
              <div
                key={layer.title}
                className={`flex flex-col items-center text-center transition-all ${
                  isStageActive ? "text-white opacity-100" : "text-zinc-500 opacity-40"
                }`}
                style={{ width: "18%" }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: isStageActive ? DOMAIN_COLORS[layer.category]?.hex || "#fff" : "#52525b" }}
                  />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    {layer.title}
                  </span>
                </div>
                <span className="text-[8px] font-mono hidden md:block mt-0.5 text-zinc-400">
                  {layer.subtitle}
                </span>
              </div>
            );
          })}
        </div>

        {/* Nodes (Colored by Domain & Active in Scenario) */}
        <div className="absolute inset-0 w-full h-full">
          {allNodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedAgentRef && node.agentRef === selectedAgentRef;
            const isNodeActive = node.activation >= 0.8;
            const isNodeStandby = node.activation > 0.1 && node.activation < 0.8;

            const domColor = DOMAIN_COLORS[node.category] || DOMAIN_COLORS.ingress;

            // Color scheme based on state
            const circleBg = isHovered || isSelected || isNodeActive
              ? domColor.hex
              : isNodeStandby
              ? `rgba(${domColor.rgb}, 0.25)`
              : "#11141a";

            const circleBorder = isHovered || isSelected || isNodeActive
              ? "#ffffff"
              : isNodeStandby
              ? domColor.hex
              : "#27272a";

            return (
              <div
                key={node.id}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onNodeSelect?.(node.id, node.agentRef)}
                className="absolute z-20 flex items-center group cursor-pointer"
              >
                {/* Node Ring & Core */}
                <div className="relative flex items-center justify-center">
                  {(isNodeActive || isHovered) && (
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0.15, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      style={{ backgroundColor: domColor.glow }}
                      className="absolute h-8 w-8 rounded-full pointer-events-none"
                    />
                  )}

                  <div
                    style={{
                      backgroundColor: circleBg,
                      borderColor: circleBorder,
                    }}
                    className={`h-5 w-5 md:h-6 md:w-6 rounded-full border-2 transition-all duration-200 shadow-md ${
                      isHovered || isSelected ? "scale-125 ring-4 ring-white/40 shadow-lg" : ""
                    }`}
                  />
                </div>

                {/* Node Text Label */}
                <div
                  className={`ml-2.5 hidden lg:flex flex-col min-w-max pointer-events-none transition-all ${
                    isNodeActive || isHovered || isSelected
                      ? "opacity-100 font-bold"
                      : "opacity-40 group-hover:opacity-100"
                  }`}
                >
                  <span
                    className="text-[10px] font-mono leading-tight"
                    style={{ color: isNodeActive ? "#ffffff" : "#a1a1aa" }}
                  >
                    {node.label}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400">
                    {node.sublabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tactical Hover Detail Card */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg rounded-2xl border border-white/20 bg-zinc-950/98 p-3.5 shadow-2xl backdrop-blur-2xl text-xs font-mono"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: DOMAIN_COLORS[hoveredNode.category]?.hex || "#fff" }}
                  />
                  <span className="font-bold text-white text-xs">{hoveredNode.label}</span>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-md font-bold"
                    style={{
                      backgroundColor: `rgba(${DOMAIN_COLORS[hoveredNode.category]?.rgb || "255,255,255"}, 0.2)`,
                      color: DOMAIN_COLORS[hoveredNode.category]?.hex || "#fff",
                    }}
                  >
                    {DOMAIN_COLORS[hoveredNode.category]?.label || hoveredNode.category}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  {hoveredNode.agentRef ? `Agent: ${hoveredNode.agentRef}` : "Ingress/Egress Tensor"}
                </span>
              </div>

              <div className="space-y-1.5 mt-2 text-[10px]">
                {hoveredNode.mathFormula && (
                  <div className="p-2 rounded-lg bg-black border border-white/10 text-emerald-300">
                    <span className="text-zinc-500 block text-[8px] uppercase font-bold">Mathematical Formulation:</span>
                    <span>{hoveredNode.mathFormula}</span>
                  </div>
                )}
                {hoveredNode.activePayload && (
                  <div className="p-2 rounded-lg bg-black border border-white/10 text-sky-200">
                    <span className="text-zinc-500 block text-[8px] uppercase font-bold">State Tensor:</span>
                    <span>{hoveredNode.activePayload}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ━━━ BOTTOM LEGEND & DOMAIN COLOR GUIDE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative z-20 flex items-center justify-between pt-3 border-t border-white/10 text-[10px] font-mono text-zinc-400 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-400" /><span>Sensory</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /><span>Supervisor</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span>Ocean AI</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /><span>Risk Geo</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400" /><span>Nav A*</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /><span>Policy RAG</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-400" /><span>Egress</span></div>
        </div>

        <div className="flex items-center gap-2">
          <span>Active Turn: <strong className="text-white">{selectedScenario.badge}</strong></span>
          <span className="text-zinc-700">|</span>
          <span className="text-emerald-400 font-bold">Execution Stage: {activeStep + 1} / 5</span>
        </div>
      </div>
    </div>
  );
}
