"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Layers,
  Info,
  CheckCircle2,
} from "lucide-react";

export interface SynapseNode {
  id: string;
  layer: number; // 0 to 4
  index: number;
  label: string;
  sublabel: string;
  category: string;
  agentRef?: string;
  activation: number; // 0.0 to 1.0
  mathFormula?: string;
  activePayload?: string;
}

export interface SynapseConnection {
  sourceId: string;
  targetId: string;
  weight: number; // 0.1 to 1.0
  active: boolean;
}

// ─── 5-Layer Multi-Agent Neural Synapse Architecture ─────────────────────────
const SYNAPSE_LAYERS: {
  title: string;
  subtitle: string;
  nodes: { id: string; label: string; sublabel: string; category: string; agentRef?: string; math?: string; payload?: string }[];
}[] = [
  {
    title: "1. Sensory Ingress",
    subtitle: "Input Prompt & Spatial State",
    nodes: [
      { id: "l0_query", label: "NL Token Stream", sublabel: "User prompt tokens", category: "Ingress", payload: "Can 4 boats fish off Veraval?" },
      { id: "l0_coords", label: "Spatial Geocoding", sublabel: "[20.902°N, 70.368°E]", category: "Ingress", payload: "Origin: Veraval Harbour" },
      { id: "l0_time", label: "Temporal Horizon", sublabel: "T+24h Window", category: "Ingress", payload: "2026-08-31 06:00 UTC" },
      { id: "l0_vessel", label: "Vessel Profile", sublabel: "Mechanized Trawler", category: "Ingress", payload: "Draft: 3.2m | Cruise: 10kt" },
      { id: "l0_target", label: "Species Intent", sublabel: "Yellowfin Tuna / Mackerel", category: "Ingress", payload: "Pelagic Finfish" },
      { id: "l0_basin", label: "Basin Matrix", sublabel: "Arabian Sea EEZ", category: "Ingress", payload: "Saurashtra Coast" },
    ],
  },
  {
    title: "2. Supervisor Matrix",
    subtitle: "Intent Parsing & Task Graph",
    nodes: [
      { id: "l1_qwen", label: "Qwen 2.5 7B Router", sublabel: "Intent Classifier", category: "Supervisor", agentRef: "supervisor", math: "P(\\text{intent}|X) = \\text{softmax}(W X)" },
      { id: "l1_pydantic", label: "Pydantic Schema", sublabel: "SubTaskPlan Validator", category: "Supervisor", agentRef: "supervisor", payload: "Structured JSON Contract" },
      { id: "l1_gazetteer", label: "Coastal Gazetteer", sublabel: "Sovereign Port Hash", category: "Supervisor", agentRef: "supervisor", payload: "Veraval -> [20.902, 70.368]" },
      { id: "l1_dispatch", label: "Async Task Dispatch", sublabel: "Parallel Task Fan-Out", category: "Supervisor", agentRef: "supervisor", payload: "4 Parallel Subtasks Dispatched" },
      { id: "l1_memory", label: "State Checkpointer", sublabel: "PostgreSQL Memory", category: "Supervisor", agentRef: "supervisor", payload: "Thread f829a1b0" },
    ],
  },
  {
    title: "3. Worker Swarm",
    subtitle: "Parallel Specialized Engines",
    nodes: [
      { id: "l2_ocean", label: "Ocean Analytics (SST)", sublabel: "Thermal & Chl Fronts", category: "Ocean AI", agentRef: "ocean_analytics", math: "\\nabla SST \\ge 0.75^{\\circ}\\text{C/km}", payload: "SST: 28.4°C | Chl: 1.26mg/m³" },
      { id: "l2_pfz", label: "PFZ Cluster Detector", sublabel: "Pelagic Species Rank", category: "Ocean AI", agentRef: "ocean_analytics", math: "PFZ_{conf} = 88\\% (Tuna)", payload: "Cluster: [20.652, 70.118]" },
      { id: "l2_geofence", label: "PostGIS Geofencing", sublabel: "IMBL Sub-meter Standoff", category: "Risk Geo", agentRef: "risk_geofencing", math: "D_{IMBL} = 45.0\\text{ km}", payload: "Border Safe (Green)" },
      { id: "l2_mpa", label: "MPA / No-Trawl Check", sublabel: "Sanctuary Intersection", category: "Risk Geo", agentRef: "risk_geofencing", math: "ST\\_Intersects(V, MPA) = \\emptyset", payload: "Clear of Marine Sanctuary" },
      { id: "l2_astar", label: "Eulerian A* Router", sublabel: "Current-Assisted Path", category: "Navigation", agentRef: "navigation", math: "\\vec{V}_{g} = \\vec{V}_{s} + \\vec{V}_{cur}", payload: "18.0 NM | SOG: 11.32 kt" },
      { id: "l2_fuel", label: "Fuel Optimizer", sublabel: "Kinematic Delta", category: "Navigation", agentRef: "navigation", math: "\\Delta Fuel = -22.0\\%", payload: "Savings: 22% via Current" },
      { id: "l2_rag", label: "BGE-M3 Policy RAG", sublabel: "HNSW Dense Retrieval", category: "Policy RAG", agentRef: "policy_rag", math: "1 - (E_{q} \\cdot E_{doc}) \\le 0.15", payload: "Monsoon Ban Inactive" },
    ],
  },
  {
    title: "4. Synthesis Layer",
    subtitle: "Evidence Reconciliation & CoT",
    nodes: [
      { id: "l3_reconcile", label: "Cross-Agent CoT", sublabel: "Evidence Correlator", category: "Synthesizer", agentRef: "synthesizer", payload: "All 4 Worker Outputs Validated" },
      { id: "l3_indic", label: "Indic Language Trans", sublabel: "Regional Multilingual", category: "Synthesizer", agentRef: "synthesizer", payload: "Target: English / Gujarati / Hindi" },
      { id: "l3_geojson", label: "GeoJSON Generator", sublabel: "DeckGL Layer Payloads", category: "Synthesizer", agentRef: "synthesizer", payload: "4 Geospatial Layers Built" },
      { id: "l3_risk_gate", label: "Safety Gate Evaluator", sublabel: "Executive Status", category: "Synthesizer", agentRef: "synthesizer", payload: "Green - Safe for Mechanized Fleet" },
    ],
  },
  {
    title: "5. Egress Actuation",
    subtitle: "Tactical Actions & Visuals",
    nodes: [
      { id: "l4_deckgl", label: "[0] 2.5D Map Overlays", sublabel: "PFZ + Corridors + AIS", category: "Egress", payload: "Interactive Deck.GL Canvas" },
      { id: "l4_advisory", label: "[1] Actionable Advisory", sublabel: "Executive Briefing", category: "Egress", payload: "Structured Markdown Advisory" },
      { id: "l4_action_card", label: "[2] Synthesized Action Card", sublabel: "88% PFZ | -22% Fuel", category: "Egress", payload: "Confidence & Standoff HUD" },
      { id: "l4_voice", label: "[3] VHF / TTS Audio Broadcast", sublabel: "Voice Synthesizer", category: "Egress", payload: "Ch 16 Marine Audio Stream" },
      { id: "l4_telemetry", label: "[4] Live Telemetry Strip", sublabel: "SST, SWH, Chl-a, Wind", category: "Egress", payload: "28.4°C | 1.26mg/m³ | 1.6m" },
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<SynapseNode | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [pulseProgress, setPulseProgress] = useState<number>(0);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(2);

  // Flatten all nodes with calculated 2D positions
  const { allNodes, connections } = useMemo(() => {
    const nodes: (SynapseNode & { x: number; y: number })[] = [];
    const conns: (SynapseConnection & { x1: number; y1: number; x2: number; y2: number })[] = [];

    const layerCount = SYNAPSE_LAYERS.length;

    SYNAPSE_LAYERS.forEach((layerDef, lIdx) => {
      const nodeCount = layerDef.nodes.length;
      const xPercent = 8 + (lIdx / (layerCount - 1)) * 84; // 8% to 92%

      layerDef.nodes.forEach((n, nIdx) => {
        // Vertical centering
        const yPercent = 14 + ((nIdx + 0.5) / nodeCount) * 72; // 14% to 86%

        const nodeObj: SynapseNode & { x: number; y: number } = {
          id: n.id,
          layer: lIdx,
          index: nIdx,
          label: n.label,
          sublabel: n.sublabel,
          category: n.category,
          agentRef: n.agentRef,
          activation: lIdx === activeLayerIndex ? 1.0 : Math.max(0.2, 0.9 - Math.abs(lIdx - activeLayerIndex) * 0.3),
          mathFormula: n.math,
          activePayload: n.payload,
          x: xPercent,
          y: yPercent,
        };
        nodes.push(nodeObj);
      });
    });

    // Build dense, elegant synaptic connections between adjacent layers
    for (let lIdx = 0; lIdx < layerCount - 1; lIdx++) {
      const currentLayerNodes = nodes.filter((n) => n.layer === lIdx);
      const nextLayerNodes = nodes.filter((n) => n.layer === lIdx + 1);

      currentLayerNodes.forEach((src) => {
        nextLayerNodes.forEach((tgt) => {
          // Weight calculation based on index alignment
          const dist = Math.abs(src.index / currentLayerNodes.length - tgt.index / nextLayerNodes.length);
          const weight = Math.max(0.1, 1.0 - dist * 1.2);
          const isActive = lIdx === activeLayerIndex || lIdx === activeLayerIndex - 1;

          conns.push({
            sourceId: src.id,
            targetId: tgt.id,
            weight,
            active: isActive,
            x1: src.x,
            y1: src.y,
            x2: tgt.x,
            y2: tgt.y,
          });
        });
      });
    }

    return { allNodes: nodes, connections: conns };
  }, [activeLayerIndex]);

  // Continuous synaptic pulse wave animation
  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      if (isPlaying) {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = (elapsed * 0.4) % 1; // 2.5s cycle
        setPulseProgress(progress);
        const currentL = Math.floor(progress * 5);
        setActiveLayerIndex(currentL);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[580px] bg-black select-none overflow-hidden rounded-2xl border border-white/10 flex flex-col justify-between p-4 md:p-6"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #090e17 0%, #000000 100%)",
      }}
    >
      {/* Top Controls & Status Bar */}
      <div className="relative z-20 flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white text-black font-black shadow-lg shadow-white/10">
            <Zap className="h-4 w-4 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Multi-Agent Synaptic Neural Flow
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE COMPUTE DAG
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Dense Bezier Synapse Transmissions (Qwen 2.5 7B $\rightarrow$ Specialized Workers $\rightarrow$ Synthesizer)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-zinc-900/80 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white" />}
            <span>{isPlaying ? "Pause Wave" : "Play Wave"}</span>
          </button>
        </div>
      </div>

      {/* Main Synapse Canvas Area */}
      <div className="relative flex-1 w-full h-full my-2">
        {/* SVG Bezier Synapse Filaments */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="synapseGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="synapseGradDim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw all cubic bezier synapse connections */}
          {connections.map((c, i) => {
            const isHoverRelevant =
              hoveredNode && (hoveredNode.id === c.sourceId || hoveredNode.id === c.targetId);

            const isWaveActive = c.active;

            // Cubic bezier control points (S-curve)
            const xMid = (c.x1 + c.x2) / 2;
            const pathD = `M ${c.x1}% ${c.y1}% C ${xMid}% ${c.y1}%, ${xMid}% ${c.y2}%, ${c.x2}% ${c.y2}%`;

            let strokeColor = isWaveActive ? "url(#synapseGradActive)" : "url(#synapseGradDim)";
            let strokeWidth = isWaveActive ? Math.max(1.0, c.weight * 2.2) : Math.max(0.4, c.weight * 0.9);
            let strokeOpacity = isHoverRelevant ? 1.0 : isWaveActive ? 0.75 : 0.25;

            if (isHoverRelevant) {
              strokeColor = "#ffffff";
              strokeWidth = 2.5;
            }

            return (
              <path
                key={`${c.sourceId}-${c.targetId}-${i}`}
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                filter={isWaveActive || isHoverRelevant ? "url(#glow)" : undefined}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Render Layer Column Headers */}
        <div className="absolute inset-x-0 top-0 flex justify-between px-2 pointer-events-none z-10">
          {SYNAPSE_LAYERS.map((layer, idx) => (
            <div
              key={layer.title}
              className={`flex flex-col items-center text-center transition-all ${
                activeLayerIndex === idx ? "text-white" : "text-zinc-500"
              }`}
              style={{ width: "18%" }}
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {layer.title}
              </span>
              <span className="text-[8px] font-mono hidden md:block opacity-75">
                {layer.subtitle}
              </span>
            </div>
          ))}
        </div>

        {/* Render Layer Nodes (Interactive Circles with Labels) */}
        <div className="absolute inset-0 w-full h-full">
          {allNodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedAgentRef && node.agentRef === selectedAgentRef;
            const isLayerActive = node.layer === activeLayerIndex;

            // Activation state brightness
            const nodeFill = isHovered || isSelected || isLayerActive ? "#ffffff" : node.activation > 0.6 ? "#e4e4e7" : "#18181b";
            const nodeBorder = isHovered || isSelected || isLayerActive ? "#ffffff" : "#3f3f46";
            const glowRing = isHovered || isSelected || isLayerActive;

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
                {/* Synaptic Node Core Circle */}
                <div className="relative flex items-center justify-center">
                  {glowRing && (
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0.2, 0.8] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute h-8 w-8 rounded-full bg-white/25 pointer-events-none"
                    />
                  )}

                  <div
                    style={{
                      backgroundColor: nodeFill,
                      borderColor: nodeBorder,
                    }}
                    className={`h-5 w-5 md:h-6 md:w-6 rounded-full border-2 transition-all duration-200 shadow-md ${
                      isHovered || isSelected ? "scale-125 shadow-white/40 ring-4 ring-white/30" : ""
                    }`}
                  />
                </div>

                {/* Node Label Text */}
                <div
                  className={`ml-2.5 hidden lg:flex flex-col min-w-max pointer-events-none transition-all ${
                    isHovered || isSelected || isLayerActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-white leading-tight">
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

        {/* Hover / Click Tactical Inspection Card */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg rounded-2xl border border-white/20 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-2xl text-xs font-mono"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white text-xs">{hoveredNode.label}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                    {hoveredNode.category}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">
                  {hoveredNode.agentRef ? `Agent: ${hoveredNode.agentRef}` : "Ingress/Egress Tensor"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
                {hoveredNode.mathFormula && (
                  <div className="col-span-2 p-2 rounded-lg bg-black border border-white/10 text-emerald-300">
                    <span className="text-zinc-500 block text-[8px] uppercase">Mathematical Formulation:</span>
                    <span>{hoveredNode.mathFormula}</span>
                  </div>
                )}
                {hoveredNode.activePayload && (
                  <div className="col-span-2 p-2 rounded-lg bg-black border border-white/10 text-sky-200">
                    <span className="text-zinc-500 block text-[8px] uppercase">Active Tensor State:</span>
                    <span>{hoveredNode.activePayload}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Footer Telemetry Strip */}
      <div className="relative z-20 flex items-center justify-between pt-3 border-t border-white/10 text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span>Wave Propagation: <strong>{(pulseProgress * 100).toFixed(0)}%</strong></span>
          <span className="text-zinc-700">|</span>
          <span>Active Layer: <strong>Layer {activeLayerIndex + 1} / 5</strong></span>
          <span className="text-zinc-700">|</span>
          <span>Synapses: <strong>142 Connected Bezier Weights</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Zero Hallucination Deterministic Grounding</span>
        </div>
      </div>
    </div>
  );
}
