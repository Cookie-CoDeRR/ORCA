"use client";

import React, {
  useState, useEffect, useRef, useCallback, Suspense
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Globe, Fish, Waves, ShieldCheck, ShieldAlert, Radio,
  Database, BookOpen, Network, User, ChevronDown,
  ChevronRight, ChevronLeft, Send, Mic, FileText,
  Map, Download, Volume2, RotateCcw, Plus, Minus,
  LayoutGrid, X, Sliders, Layers, Sparkles,
  Thermometer, Navigation, Anchor, Info, CheckCircle2, Compass,
  MapPin, Wind, Ship, Activity, Grid, GraduationCap, Microscope,
  FlaskConical, Cpu, ArrowDown, Image as ImageIcon
} from "lucide-react";
import ThreeGlobe, { EnvironmentalRasterType, VectorOverlayToggles } from "@/components/ThreeGlobe";
import ReportView from "@/components/ReportView";
import { sendMultiAgentMessage } from "@/lib/api";
import { isReportRequest, generateReportPipeline } from "@/lib/reportGenerator";
import { reportStore, DEFAULT_TUNA_REPORT } from "@/lib/reportStore";
import { Report, ReportGenerationProgress } from "@/lib/reportTypes";

// ─── Types ────────────────────────────────────────────────────────────────────
type Persona = "navigator" | "researcher" | "defense" | "student" | "guest";
type Basin = "arabian_sea" | "bay_of_bengal" | "lakshadweep" | "andaman";

interface ChatMessage {
  id: string;
  role: "user" | "ai" | "thought" | "system";
  content: string;
  timestamp: string;
  streaming?: boolean;
  referenceImage?: { src: string; caption: string };
  isReportProgress?: boolean;
  progressData?: ReportGenerationProgress;
  generatedReport?: Report;
}

interface LayerItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  on: boolean;
  color: string;
  lockedFor?: Persona[];
}

// ─── Light Studio & Google Maps Style Design Constants ────────────────────────
const PERSONA_META: Record<Persona, {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  name: string;
  agent: string;
  color: string;
}> = {
  navigator: { icon: Compass, name: "Navigator", agent: "Matsya-Sutradhar", color: "#09090b" },
  researcher: { icon: Microscope, name: "Researcher", agent: "Samudra-Vigyan", color: "#09090b" },
  defense: { icon: ShieldCheck, name: "Defense", agent: "Sagar-Rakshak", color: "#09090b" },
  student: { icon: GraduationCap, name: "Student", agent: "Jala-Vidya", color: "#09090b" },
  guest: { icon: Waves, name: "Guest", agent: "Public Safety", color: "#52525b" },
};

const BASINS: { id: Basin; label: string; short: string }[] = [
  { id: "arabian_sea", label: "Arabian Sea", short: "Arabian Sea" },
  { id: "bay_of_bengal", label: "Bay of Bengal", short: "Bay of Bengal" },
  { id: "lakshadweep", label: "Lakshadweep Sea", short: "Lakshadweep" },
  { id: "andaman", label: "Andaman & Nicobar", short: "Andaman" },
];

export interface EnvironmentalRasterDef {
  id: EnvironmentalRasterType;
  label: string;
  subtitle: string;
  gradient: string;
  rangeText: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ENVIRONMENTAL_RASTERS: EnvironmentalRasterDef[] = [
  {
    id: "none",
    label: "Natural Satellite",
    subtitle: "NASA Blue Marble 5400x2700 True-Color Bedrock",
    gradient: "linear-gradient(90deg, #1e3a8a 0%, #065f46 50%, #ca8a04 100%)",
    rangeText: "Visible Spectrum Bedrock",
    badge: "TRUE COLOR",
    icon: Globe,
  },
  {
    id: "sst",
    label: "SST Thermal Raster",
    subtitle: "Sea Surface Temp & Coastal Fronts (NOAA/INCOIS)",
    gradient: "linear-gradient(90deg, #1d4ed8 0%, #06b6d4 25%, #22c55e 50%, #eab308 75%, #ef4444 100%)",
    rangeText: "24.0°C – 32.5°C Thermal Envelope",
    badge: "THERMAL FRONTS",
    icon: Thermometer,
  },
  {
    id: "chlorophyll",
    label: "Chlorophyll-a Plumes",
    subtitle: "OceanSat-3 OCM Phytoplankton Bloom Density",
    gradient: "linear-gradient(90deg, #1e1b4b 0%, #0891b2 25%, #10b981 60%, #84cc16 85%, #f59e0b 100%)",
    rangeText: "0.08 – 4.80 mg/m³ Upwelling Plumes",
    badge: "FEEDING GROUNDS",
    icon: Fish,
  },
  {
    id: "currents",
    label: "Currents Velocity Heatmap",
    subtitle: "Eulerian Hydrodynamic Velocity Field (uo, vo)",
    gradient: "linear-gradient(90deg, #0284c7 0%, #38bdf8 40%, #c084fc 80%, #ec4899 100%)",
    rangeText: "0.15 – 2.05 m/s Somali Jet Drift",
    badge: "HYDRODYNAMICS",
    icon: Wind,
  },
  {
    id: "bathymetry",
    label: "Bathymetric Depth Relief",
    subtitle: "GEBCO Seafloor Topography & Shelf Break",
    gradient: "linear-gradient(90deg, #064e3b 0%, #0891b2 40%, #1e40af 80%, #0f172a 100%)",
    rangeText: "0m – 4,500m Abyssal Plain",
    badge: "BATHYMETRY",
    icon: Layers,
  },
];

export interface VectorOverlayDef {
  id: keyof VectorOverlayToggles;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export const VECTOR_OVERLAYS_DEF: VectorOverlayDef[] = [
  {
    id: "pfz",
    label: "PFZ Hotspots",
    subtitle: "14 INCOIS Verified Fish Clusters & Confidence",
    icon: Fish,
    color: "#f59e0b",
  },
  {
    id: "imbl",
    label: "IMBL Sovereign Zone",
    subtitle: "Border Standoff & 5nm Safety Buffer",
    icon: ShieldAlert,
    color: "#ef4444",
  },
  {
    id: "ais",
    label: "AIS Vessel Fleet",
    subtitle: "Real-Time Fleet AIS & Kinematic Courses",
    icon: Ship,
    color: "#38bdf8",
  },
  {
    id: "route",
    label: "Optimal Route Line",
    subtitle: "Hydrodynamic Fuel-Efficient A* Path",
    icon: Navigation,
    color: "#2563eb",
  },
  {
    id: "currentsFlow",
    label: "Current Flow Vectors",
    subtitle: "Directional Streamline Flow Arrows",
    icon: Wind,
    color: "#06b6d4",
  },
  {
    id: "mesh",
    label: "5x5 km Tactical Mesh",
    subtitle: "Geodetic Sector Grid with Reticle Lock",
    icon: LayoutGrid,
    color: "#09090b",
  },
  {
    id: "graticule",
    label: "Global Graticule",
    subtitle: "10° / 2° Parallels & Meridians",
    icon: Grid,
    color: "#71717a",
  },
];

const SEARCH_SUGGESTIONS = [
  { icon: MapPin, label: "Veraval Commercial Harbor", sub: "20.902°N, 70.368°E · Gujarat Hub · 5km Cell [IN-2090-7036]" },
  { icon: MapPin, label: "Kochi Marine Terminal", sub: "9.934°N, 76.259°E · Kerala Hub · 5km Cell [IN-0993-7625]" },
  { icon: MapPin, label: "Chennai — Marina Basin", sub: "13.080°N, 80.270°E · Tamil Nadu · 5km Cell [IN-1308-8027]" },
  { icon: Fish, label: "PFZ Cluster — Arabian Sea", sub: "94% INCOIS Satellite Confidence · 20.75°N, 70.19°E" },
  { icon: Thermometer, label: "Thermal Frontal Zone", sub: "28.4°C → 26.1°C Chlorophyll Upwelling · Western Shelf" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Crisp White Studio Glass
const studioGlass = {
  background: "rgba(255, 255, 255, 0.94)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
} as React.CSSProperties;

// ISRO Scientific Toggle Switch
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative flex-shrink-0 h-5 w-9 rounded-full transition-colors duration-150 focus:outline-none"
      style={{ background: on ? "#1F4E8C" : "#E1E5EA" }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all duration-150"
        style={{ left: on ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

export interface BasinInfo {
  id: Basin;
  short: string;
  label: string;
  sovereignStatus: string;
  isEEZ: boolean;
  imblDistanceKm: number;
}

export function getSovereignBasin(lat: number, lon: number): BasinInfo {
  // 1. Andaman & Nicobar: east of 91°E, latitude between 5.5°N and 14.5°N
  if (lon >= 91.0 && lat >= 5.5 && lat <= 14.5) {
    return {
      id: "andaman",
      short: "Andaman Sea",
      label: "Andaman & Nicobar Basin",
      sovereignStatus: "Indian EEZ (Strategic Island Sector)",
      isEEZ: true,
      imblDistanceKm: 64.8,
    };
  }

  // 2. Lakshadweep Sea: between 71.0°E - 75.2°E and 7.8°N - 13.5°N
  if (lat >= 7.8 && lat <= 13.5 && lon >= 71.0 && lon <= 75.2) {
    return {
      id: "lakshadweep",
      short: "Lakshadweep Sea",
      label: "Lakshadweep Sea Basin",
      sovereignStatus: "Indian EEZ (Archipelagic Sovereign Basin)",
      isEEZ: true,
      imblDistanceKm: 42.5,
    };
  }

  // 3. Bay of Bengal: east of 77.5°E and west of 91.0°E, north of 6.0°N
  if (lon >= 77.5 && lat >= 6.0 && lat <= 23.5 && lon < 91.0) {
    return {
      id: "bay_of_bengal",
      short: "Bay of Bengal",
      label: "Bay of Bengal",
      sovereignStatus: "Indian EEZ (Eastern Seaboard Sector)",
      isEEZ: true,
      imblDistanceKm: 88.2,
    };
  }

  // 4. Arabian Sea: west of 77.5°E, north of 6.0°N, east of 64.0°E
  if (lon < 77.5 && lon >= 64.0 && lat >= 6.0 && lat <= 25.0) {
    return {
      id: "arabian_sea",
      short: "Arabian Sea",
      label: "Arabian Sea",
      sovereignStatus: "Indian EEZ (Western Seaboard Sector)",
      isEEZ: true,
      imblDistanceKm: 74.2,
    };
  }

  // 5. Equatorial Indian Ocean: south of 6.0°N
  if (lat < 6.0 && lon >= 60.0 && lon <= 100.0) {
    return {
      id: "arabian_sea",
      short: "Equatorial Basin",
      label: "Equatorial Indian Ocean",
      sovereignStatus: "High Seas / International Waters",
      isEEZ: false,
      imblDistanceKm: 0,
    };
  }

  // 6. Beyond Indian EEZ:
  return {
    id: "arabian_sea",
    short: "International Waters",
    label: "International Maritime Basin",
    sovereignStatus: "High Seas (Beyond Sovereign EEZ)",
    isEEZ: false,
    imblDistanceKm: 0,
  };
}

// ─── Conversational AI Query Responder (NO report created on normal questions) ─
function getConversationalResponse(q: string, coords: { lat: number; lon: number }, basinName: string): string {
  const query = q.toLowerCase();
  const latStr = coords.lat.toFixed(3);
  const lonStr = coords.lon.toFixed(3);

  if (query.includes("sst") || query.includes("temperature")) {
    return `**Sea Surface Temperature Telemetry:**\n\nAt coordinate **${latStr}°N, ${lonStr}°E** (${basinName}), the current Sea Surface Temperature is **28.4°C** (Sentinel-3 SLSTR radiometer observation).\n\n• **Thermal State:** Normal seasonal baseline with a mild positive thermal gradient (+0.4°C/km).\n• **Ecological Suitability:** Within optimal feeding window for epipelagic tuna (25.0°C – 29.5°C).\n\n*To produce a full formal assessment, click **Generate Report** or ask "Generate a report about SST conditions here."*`;
  }

  if (query.includes("chlorophyll") || query.includes("chl") || query.includes("bloom")) {
    return `**Chlorophyll-a Concentration Telemetry:**\n\nAt coordinate **${latStr}°N, ${lonStr}°E** (${basinName}), Sentinel-3 OLCI records **1.26 mg/m³**.\n\n• **Anomaly:** +18.4% above seasonal climatology, indicating Ekman upwelling along the western shelf.\n• **Trophic Cascade:** Increased zooplankton abundance favorable for mackerel and pelagic forage.\n\n*To produce a full bloom assessment, ask "Generate a chlorophyll report" or click **Generate Report**.*`;
  }

  if (query.includes("wave") || query.includes("swell") || query.includes("sea state")) {
    return `**Hydrodynamic Sea State Telemetry:**\n\nAt coordinate **${latStr}°N, ${lonStr}°E** (${basinName}), INCOIS wave telemetry reports:\n\n• **Significant Wave Height (SWH):** 1.6 m (Safe operating envelope for mechanized vessels)\n• **Dominant Wave Period:** 7.8 seconds\n• **Swell Direction:** 215° SW\n• **Surface Wind:** 12 kt WNW\n\n*To produce a full wave hazard assessment, ask "Generate a report about wave conditions" or click **Generate Report**.*`;
  }

  if (query.includes("fish") || query.includes("species") || query.includes("tuna") || query.includes("catch")) {
    return `**Pelagic Species Habitat Assessment:**\n\nIn the **${basinName}** sector around **${latStr}°N, ${lonStr}°E**, primary commercial target species include:\n\n1. **Yellowfin Tuna (*Thunnus albacares*)** — 93% suitability confidence along the 200m shelf divergence.\n2. **Skipjack Tuna (*Katsuwonus pelamis*)** — 88% confidence in surface thermal eddies.\n3. **Indian Mackerel (*Rastrelliger kanagurta*)** — Inshore upwelling corridors.\n\n*Ask "Generate a report about Yellowfin Tuna" or click **Generate Report** to formulate a full advisory dossier.*`;
  }

  if (query.includes("what information goes into") || query.includes("what goes into") || query.includes("what is a report")) {
    return `**ORCA Maritime Intelligence Dossier Structure:**\n\nWhen a formal report is requested, ORCA's multi-agent system dynamically compiles:\n\n1. **Situation & Advisory** — Suitability index, alert rating, and operational window.\n2. **Ocean Conditions** — In-situ SST, chlorophyll-a, wave height, current vectors, and salinity.\n3. **Domain Modules** — Custom sections depending on topic (Species Profile, Wave Spectrogram, Weather, or Algal Blooms).\n4. **Safety & Guidance** — Sovereign IMBL standoff compliance, emergency shelter ports, and gear SOPs.\n5. **ORCA Reasoning & Research** — Multi-agent pipeline logs and peer-reviewed scientific literature.\n6. **Authoritative Sources** — Grounded in INCOIS, ISRO, and Copernicus data.\n\n*You can generate one anytime by clicking **Generate Report** or asking e.g. "Generate a report for this location."*`;
  }

  return `**ORCA Mission Copilot Telemetry (${basinName}):**\n\nObserving 5km × 5km cell at **${latStr}°N, ${lonStr}°E**.\n\n• **SST:** 28.4°C · **Chlorophyll-a:** 1.26 mg/m³ · **SWH:** 1.6m · **IMBL:** 74.2 km SAFE\n• **Sovereign Status:** Indian Exclusive Economic Zone (EEZ)\n\nI can answer questions regarding ocean physics, species suitability, and safety standoffs, or formulate a full intelligence dossier when requested.`;
}

// ─── AI Chat Drawer (Sleek Crisp White Mission Copilot) ────────────────────────
function AIChatDrawer({
  persona, isOpen, onToggle, onOpenReport, onReportGenerated, selectedCoord, basinLabel,
}: {
  persona: Persona; isOpen: boolean; onToggle: () => void; onOpenReport?: () => void;
  onReportGenerated?: (report: Report) => void;
  selectedCoord?: { lat: number; lon: number } | null;
  basinLabel?: string;
}) {
  const pm = PERSONA_META[persona];
  const PersonaIcon = pm.icon;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<ReportGenerationProgress | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Method 1 & 2: Report Generation Pipeline Trigger
  const triggerReportGeneration = useCallback(async (customTopic?: string) => {
    if (isGenerating || streaming) return;
    const targetTopic = (customTopic && customTopic.trim()) || input.trim() || "Comprehensive Ocean State & Advisory Report";
    setInput("");

    const coordToUse = selectedCoord || { lat: 20.75, lon: 70.19 };
    const basinNameToUse = basinLabel || "Arabian Sea Basin";

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: `Generate report: ${targetTopic}`,
      timestamp: now(),
    };
    setMessages((m) => [...m, userMsg]);
    setIsGenerating(true);

    const progressMsgId = uid();
    const initialProgress: ReportGenerationProgress = {
      stage: 1,
      totalStages: 6,
      stageName: "Understanding request",
      message: `Analyzing intent & extracting topic from: "${targetTopic}"...`,
      progressPercent: 16,
    };

    setMessages((m) => [
      ...m,
      {
        id: progressMsgId,
        role: "system",
        content: "",
        timestamp: now(),
        isReportProgress: true,
        progressData: initialProgress,
      },
    ]);

    try {
      const newReport = await generateReportPipeline(
        targetTopic,
        {
          lat: coordToUse.lat,
          lon: coordToUse.lon,
          basinLabel: basinNameToUse,
          isEEZ: true,
          imblDistanceKm: 74.2,
        },
        (progress) => {
          setGeneratingProgress(progress);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === progressMsgId ? { ...msg, progressData: progress } : msg
            )
          );
        }
      );

      // Complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === progressMsgId
            ? {
              ...msg,
              content: `✅ **Report Complete: ${newReport.title}**\n\nGenerated ${newReport.sections.length} dynamic sections for ${newReport.location}. Automatically opening report view...`,
              generatedReport: newReport,
            }
            : msg
        )
      );

      setIsGenerating(false);
      setGeneratingProgress(null);

      // Automatically navigate to the newly generated report
      if (onReportGenerated) {
        onReportGenerated(newReport);
      }
    } catch (err) {
      console.error("Report generation error:", err);
      setIsGenerating(false);
      setGeneratingProgress(null);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "ai",
          content: "⚠️ **Report Generation Error**\n\nReport generation could not be completed. Please check connection and try again.",
          timestamp: now(),
        },
      ]);
    }
  }, [isGenerating, streaming, input, selectedCoord, basinLabel, onReportGenerated]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming || isGenerating) return;

    // Check intent: Is this explicitly asking to generate/create a report?
    if (isReportRequest(q)) {
      triggerReportGeneration(q);
      return;
    }

    // Normal conversational inquiry
    setInput("");
    const userMsg: ChatMessage = { id: uid(), role: "user", content: q, timestamp: now() };
    setMessages((m) => [...m, userMsg]);
    setStreaming(true);

    const thoughts = [
      "Supervisor → Query Intent classified as conversational",
      "Telemetry Engine → Ingesting localized sensor state",
      "Domain Agent → Synthesizing response without report creation",
    ];

    for (const t of thoughts) {
      await new Promise((r) => setTimeout(r, 160));
      setMessages((m) => [...m, { id: uid(), role: "thought", content: t, timestamp: now() }]);
    }

    const coordToUse = selectedCoord || { lat: 20.75, lon: 70.19 };
    const basinToUse = basinLabel || "Arabian Sea Basin";
    const responseText = getConversationalResponse(userMsg.content, coordToUse, basinToUse);

    const aiId = uid();
    setMessages((m) => [
      ...m,
      {
        id: aiId,
        role: "ai",
        content: "",
        timestamp: now(),
        streaming: true,
      },
    ]);

    let chars = 0;
    const interval = setInterval(() => {
      chars += 5;
      setMessages((m) =>
        m.map((msg) =>
          msg.id === aiId
            ? { ...msg, content: responseText.slice(0, chars), streaming: chars < responseText.length }
            : msg
        )
      );
      if (chars >= responseText.length) {
        clearInterval(interval);
        setStreaming(false);
      }
    }, 12);
  }, [input, streaming, isGenerating, selectedCoord, basinLabel, triggerReportGeneration]);

  return (
    <>
      {/* Pull Tab (Clean White) */}
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1.5 rounded-l-xl border-l border-t border-b py-4 transition-all duration-300 hover:pr-1 bg-white border-zinc-200 text-zinc-900 shadow-lg"
        style={{ width: 34 }}
        title={isOpen ? "Close Mission Copilot" : "Open Mission Copilot"}
      >
        <Sparkles className="h-4 w-4 text-zinc-900" />
        <div
          className="text-[9px] font-mono font-bold text-zinc-800"
          style={{ writingMode: "vertical-rl", letterSpacing: "0.12em" }}
        >
          AI COPILOT
        </div>
        {isOpen
          ? <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
          : <ChevronLeft className="h-3.5 w-3.5 text-zinc-500" />
        }
      </button>

      {/* Drawer */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : 420 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-0 top-0 h-screen z-30 flex flex-col bg-white border-l border-zinc-200 shadow-2xl"
        style={{ width: 420 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 tracking-tight">ORCA AI Mission Copilot</div>
              <div className="text-[10px] font-mono flex items-center gap-1.5 text-zinc-500">
                <PersonaIcon className="h-3 w-3 text-zinc-800" />
                {pm.agent} · 100% Air-Gapped Sovereign
              </div>
            </div>
          </div>
          <button onClick={onToggle} className="text-zinc-500 hover:text-black transition p-1 rounded-lg hover:bg-zinc-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Header Strip with Generate Report Action Button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 flex-shrink-0 text-[11px] font-mono bg-zinc-50/80">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Mode:</span>
            <select
              className="bg-transparent text-zinc-900 outline-none cursor-pointer font-mono font-semibold text-xs"
              defaultValue="conversational"
            >
              <option value="conversational">Conversational</option>
              <option value="advisory">Advisory Brief</option>
              <option value="scientific">Scientific Telemetry</option>
            </select>
          </div>

          <button
            onClick={() => triggerReportGeneration(input)}
            disabled={isGenerating || streaming}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1F4E8C] hover:bg-[#173F72] text-white text-[10px] font-sans font-medium transition disabled:opacity-40 shadow-xs"
            title="Generate a dynamic report for current topic and coordinates"
          >
            <FileText className="h-3 w-3" />
            <span>Generate Report</span>
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-zinc-50/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3 text-zinc-900 shadow-xs">
                <PersonaIcon className="h-6 w-6 text-zinc-800" />
              </div>
              <div className="text-xs font-bold text-zinc-900 mb-1">
                {pm.agent} Mission Terminal Ready
              </div>
              {selectedCoord ? (
                <div className="text-[10px] font-mono text-zinc-700 mb-3 bg-white px-3 py-1 rounded-full border border-zinc-200 shadow-xs">
                  Locked Cell: {selectedCoord.lat.toFixed(3)}°N, {selectedCoord.lon.toFixed(3)}°E
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 mb-3">
                  Double-click anywhere on the 3D globe to lock coordinates.
                </div>
              )}
              <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed mb-6">
                Ask normal questions for conversational answers, or explicitly request a report to dynamically generate a formal dossier.
              </p>

              {/* Quick Query Starters */}
              <div className="w-full space-y-2 max-w-xs text-left">
                <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Quick Queries (Conversational)
                </div>
                {[
                  "What is the SST at this location?",
                  "Why is chlorophyll important?",
                  "What information goes into a fishing report?",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => setInput(promptText)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 text-[11px] text-zinc-800 transition shadow-xs flex items-center justify-between group"
                  >
                    <span>{promptText}</span>
                    <span className="text-zinc-400 group-hover:text-black font-bold">&rarr;</span>
                  </button>
                ))}

                <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider pt-2">
                  Report Commands (Dynamic Dossier)
                </div>
                {[
                  "Generate a report about high wave conditions",
                  "Prepare a chlorophyll bloom report",
                  "Generate a Yellowfin Tuna fishing advisory",
                ].map((reportPrompt) => (
                  <button
                    key={reportPrompt}
                    onClick={() => triggerReportGeneration(reportPrompt)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-[#F0F4FA] border border-[#CBD5E1] hover:border-[#1F4E8C] text-[11px] text-[#1F4E8C] font-medium transition shadow-xs flex items-center justify-between group"
                  >
                    <span>{reportPrompt}</span>
                    <FileText className="h-3 w-3 text-[#1F4E8C]" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.role === "thought") {
                return (
                  <div key={msg.id} className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 animate-pulse" />
                    {msg.content}
                  </div>
                );
              }

              // Dynamic Report Generation Progress Card
              if (msg.isReportProgress && msg.progressData) {
                const p = msg.progressData;
                const isComplete = !!msg.generatedReport;
                return (
                  <div key={msg.id} className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-[#1F4E8C] animate-spin" />
                        )}
                        <span className="text-xs font-bold text-zinc-900">
                          {isComplete ? "Report Complete" : p.stageName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Stage {p.stage}/{p.totalStages}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-600 leading-relaxed whitespace-pre-line">
                      {msg.content || p.message}
                    </p>

                    <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full bg-[#1F4E8C] transition-all duration-300 rounded-full"
                        style={{ width: `${isComplete ? 100 : p.progressPercent}%` }}
                      />
                    </div>

                    {isComplete && (
                      <button
                        onClick={onOpenReport}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1F4E8C] hover:bg-[#173F72] text-white text-xs font-semibold shadow-xs transition mt-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Open Generated Dossier ▼</span>
                      </button>
                    )}
                  </div>
                );
              }

              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[94%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm"
                    style={
                      isUser
                        ? { background: "#09090b", color: "#ffffff", borderRadius: "14px 14px 2px 14px" }
                        : { background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "2px 14px 14px 14px", color: "#18181b" }
                    }
                  >
                    <div className="text-[10px] font-mono mb-1.5 flex items-center gap-1.5" style={{ color: isUser ? "#a1a1aa" : "#71717a" }}>
                      {isUser ? (
                        <>
                          <User className="h-3 w-3 text-white" />
                          <span className="font-semibold text-white">Operator</span>
                        </>
                      ) : (
                        <>
                          <PersonaIcon className="h-3 w-3 text-zinc-900" />
                          <span className="font-semibold text-zinc-900">{pm.agent}</span>
                        </>
                      )}
                      <span>· {msg.timestamp}</span>
                    </div>

                    {msg.content.split("\n").map((line, i) => {
                      const bold = line.replace(/\*\*(.+?)\*\*/g, `<strong class='${isUser ? "font-bold text-white" : "font-bold text-black"}'>$1</strong>`);
                      return (
                        <p key={i} className="mb-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: bold }} />
                      );
                    })}

                    {msg.streaming && (
                      <span className="inline-block text-zinc-900 animate-pulse ml-0.5 font-bold">▋</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-200 px-4 py-3 flex-shrink-0 space-y-2 bg-white">
          <div className="flex items-center gap-2">
            <button className="text-zinc-500 hover:text-black transition p-1.5 rounded-lg hover:bg-zinc-100" title="Audio Input">
              <Mic className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask question, or type 'Generate report on...'"
              className="flex-1 bg-zinc-100/90 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming || isGenerating}
              className="p-2 rounded-xl bg-[#1F4E8C] text-white hover:bg-[#173F72] transition disabled:opacity-30 active:scale-95 shadow-sm"
              title="Send Message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
            <span>5km × 5km Mesh Telemetry</span>
            <button
              onClick={() => triggerReportGeneration(input)}
              disabled={isGenerating || streaming}
              className="text-[#1F4E8C] font-semibold hover:underline flex items-center gap-1"
            >
              <FileText className="h-3 w-3" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}


// ─── Left Layer Dock (Crisp White Theme) ───────────────────────────────────────
// ─── Left Layer Dock (Crisp White Theme) ───────────────────────────────────────
function LayerDock({
  persona,
  visible,
  activeRaster,
  onSelectRaster,
  vectorOverlays,
  onToggleVectorOverlay,
  sstRange,
  setSstRange,
  waveMax,
  setWaveMax,
}: {
  persona: Persona;
  visible: boolean;
  activeRaster: EnvironmentalRasterType;
  onSelectRaster: (raster: EnvironmentalRasterType) => void;
  vectorOverlays: VectorOverlayToggles;
  onToggleVectorOverlay: (key: keyof VectorOverlayToggles) => void;
  sstRange: [number, number];
  setSstRange: (range: [number, number]) => void;
  waveMax: number;
  setWaveMax: (val: number) => void;
}) {
  const pm = PERSONA_META[persona];
  const PersonaIcon = pm.icon;

  const [expanded, setExpanded] = useState(false);

  const activeVectorsCount = Object.values(vectorOverlays).filter(Boolean).length;
  const currentRasterDef = ENVIRONMENTAL_RASTERS.find((r) => r.id === activeRaster) || ENVIRONMENTAL_RASTERS[0];
  const CurrentRasterIcon = currentRasterDef.icon;

  return (
    <div
      className={`fixed left-0 top-0 h-screen z-40 flex transition-opacity duration-300 ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Collapsed Icon Strip */}
      <motion.div
        animate={{ width: expanded ? 0 : 42 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-3 py-20 overflow-hidden flex-shrink-0 bg-white/95 border-r border-zinc-200 shadow-md backdrop-blur-md"
      >
        {/* Active Raster indicator in collapsed bar */}
        <div
          className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#1F4E8C]"
          title={`Active Environmental Raster: ${currentRasterDef.label}`}
        >
          <CurrentRasterIcon className="h-3.5 w-3.5" />
        </div>
        <div className="w-4 h-[1px] bg-zinc-200" />
        {/* Active Vector indicators */}
        {VECTOR_OVERLAYS_DEF.filter((v) => vectorOverlays[v.id]).slice(0, 6).map((v) => {
          const LayerIcon = v.icon;
          return (
            <div
              key={v.id}
              className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800"
              title={`Active Overlay: ${v.label}`}
            >
              <LayerIcon className="h-3.5 w-3.5" />
            </div>
          );
        })}
      </motion.div>

      {/* Expanded Full Dock */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-0 h-full w-72 flex flex-col overflow-hidden shadow-2xl bg-white/98 border-r border-zinc-200"
          >
            {/* Persona & Platform Badge */}
            <div className="px-4 pt-20 pb-3 flex-shrink-0 border-b border-[#E1E5EA]">
              <div className="text-xs font-sans font-bold flex items-center gap-1.5 text-[#202124]">
                <PersonaIcon className="h-3.5 w-3.5 text-[#1F4E8C]" />
                <span>{pm.agent}</span>
              </div>
              <div className="text-[11px] text-[#667085] font-sans mt-0.5">{pm.name} GIS Console</div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-sans px-2 py-1 rounded bg-[#F6F8FA] text-[#202124] border border-[#E1E5EA]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#228B5A]" />
                <span>INCOIS & ISRO Synchronized</span>
              </div>
            </div>

            {/* Scrollable Controls */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {/* ── SECTION 1: ENVIRONMENTAL COLOR RASTERS (MUTUALLY EXCLUSIVE) ── */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E1E5EA]">
                  <div>
                    <div className="text-[10px] font-sans font-bold tracking-wider uppercase text-[#202124]">
                      Environmental Rasters
                    </div>
                    <div className="text-[9px] text-[#667085]">Mutually exclusive · 1 active</div>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    {activeRaster === "none" ? "Satellite" : activeRaster}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  {ENVIRONMENTAL_RASTERS.map((r) => {
                    const RasterIcon = r.icon;
                    const isActive = activeRaster === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onSelectRaster(r.id)}
                        className={`w-full text-left p-2 rounded-xl transition border text-xs flex flex-col gap-1.5 ${
                          isActive
                            ? "bg-[#F0F5FF] border-[#1F4E8C] shadow-xs"
                            : "bg-white hover:bg-[#F8FAFC] border-zinc-200 text-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1 rounded-md ${
                                isActive ? "bg-[#1F4E8C] text-white" : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              <RasterIcon className="h-3 w-3" />
                            </div>
                            <div>
                              <div
                                className={`font-semibold leading-tight text-[11px] ${
                                  isActive ? "text-[#1F4E8C]" : "text-zinc-800"
                                }`}
                              >
                                {r.label}
                              </div>
                              <div className="text-[9.5px] text-zinc-500 leading-tight">
                                {r.rangeText}
                              </div>
                            </div>
                          </div>
                          {isActive && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#1F4E8C] flex-shrink-0" />
                          )}
                        </div>

                        {/* Color Ramp Gradient Bar */}
                        <div
                          className="w-full h-1.5 rounded-full overflow-hidden border border-black/5"
                          style={{ background: r.gradient }}
                          title={r.rangeText}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 2: DIRECT MAP OVERLAYS (MULTI-SELECT TOGGLES) ── */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E1E5EA]">
                  <div>
                    <div className="text-[10px] font-sans font-bold tracking-wider uppercase text-[#202124]">
                      Direct Map Overlays
                    </div>
                    <div className="text-[9px] text-[#667085]">Independent point & vector layers</div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-[#1F4E8C]">
                    {activeVectorsCount} ACTIVE
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  {VECTOR_OVERLAYS_DEF.map((v) => {
                    const LayerIcon = v.icon;
                    const isOn = vectorOverlays[v.id];
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-zinc-50 transition"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <LayerIcon
                            className="h-3.5 w-3.5 flex-shrink-0"
                            style={{ color: isOn ? v.color : "#9ca3af" }}
                          />
                          <div className="truncate">
                            <div
                              className={`text-[11px] leading-tight truncate ${
                                isOn ? "text-zinc-900 font-medium" : "text-zinc-500"
                              }`}
                            >
                              {v.label}
                            </div>
                            <div className="text-[9px] text-zinc-400 truncate leading-tight">
                              {v.subtitle}
                            </div>
                          </div>
                        </div>
                        <Toggle on={isOn} onChange={() => onToggleVectorOverlay(v.id)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 3: SENSOR THRESHOLDS ── */}
              <div>
                <div className="text-[10px] font-sans font-bold tracking-wider uppercase mb-2 pb-1 border-b border-[#E1E5EA] text-[#202124]">
                  Sensor Thresholds
                </div>
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-sans text-[#667085] mb-1">
                      <span>SST Range</span>
                      <span className="text-[#202124] font-mono font-semibold">
                        {sstRange[0]}–{sstRange[1]}°C
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={35}
                      step={0.5}
                      value={sstRange[1]}
                      onChange={(e) => setSstRange([sstRange[0], Number(e.target.value)])}
                      className="w-full h-1.5 rounded-full appearance-none bg-[#E1E5EA] cursor-pointer accent-[#1F4E8C]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-sans text-[#667085] mb-1">
                      <span>Max SWH (Swell)</span>
                      <span className="text-[#202124] font-mono font-semibold">{waveMax}m</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={0.5}
                      value={waveMax}
                      onChange={(e) => setWaveMax(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none bg-[#E1E5EA] cursor-pointer accent-[#1F4E8C]"
                    />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main App Content ─────────────────────────────────────────────────────────
function AppContent() {
  const searchParams = useSearchParams();
  const persona = (searchParams.get("persona") as Persona) || "navigator";

  const [chatOpen, setChatOpen] = useState(false);
  const [basin, setBasin] = useState<Basin>("arabian_sea");
  const [searchFocus, setSearchFocus] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState("yellowfin");
  const [navOpen, setNavOpen] = useState(false);
  const [scrolledPastGlobe, setScrolledPastGlobe] = useState(false);
  const [activeReport, setActiveReport] = useState<Report>(DEFAULT_TUNA_REPORT);

  useEffect(() => {
    setActiveReport(reportStore.getActiveReport());
    const unsub = reportStore.subscribe((_, cur) => {
      setActiveReport(cur);
    });
    return unsub;
  }, []);

  const [activeRaster, setActiveRaster] = useState<EnvironmentalRasterType>("sst");
  const [vectorOverlays, setVectorOverlays] = useState<VectorOverlayToggles>({
    pfz: true,
    imbl: true,
    ais: true,
    route: true,
    currentsFlow: true,
    mesh: true,
    graticule: false,
  });
  const [sstRange, setSstRange] = useState<[number, number]>([24, 32]);
  const [waveMax, setWaveMax] = useState(4.0);

  const toggleVectorOverlay = (key: keyof VectorOverlayToggles) => {
    setVectorOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPastGlobe(window.scrollY > 280);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToReport = useCallback(() => {
    const elem = document.getElementById("orca-report-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const scrollToGlobe = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);



  const pm = PERSONA_META[persona];
  const PersonaIcon = pm.icon;

  const globeRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative w-full min-h-screen select-none scroll-smooth bg-[#f8fafc]"
      style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#09090b" }}
    >
      {/* ══════════════════════════════ 100VH GLOBE SECTION ══════════════════════ */}
      <div className="relative w-full h-screen overflow-hidden flex-shrink-0 bg-[#f8fafc]">
        {/* Base Sharp Geodetic Grid Mesh at the back of Earth */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(51, 65, 85, 0.20) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.20) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            backgroundPosition: "center center",
          }}
        />

        {/* ── Dynamic Depth of Field (DoF): Subtle lens softening closest to Earth, clean falloff ── */}
        {/* Tier 1: Soft Close Blur (Gentle 6px optical blur closest to Earth rim) */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(51, 65, 85, 0.20) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.20) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            backgroundPosition: "center center",
            filter: "blur(6px)",
            WebkitFilter: "blur(6px)",
            maskImage: "radial-gradient(circle at 50% 50%, transparent calc(var(--earth-r, 380px) * 0.98), black calc(var(--earth-r, 380px) + 6px), black calc(var(--earth-r, 380px) + 24px), transparent calc(var(--earth-r, 380px) + 55px))",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent calc(var(--earth-r, 380px) * 0.98), black calc(var(--earth-r, 380px) + 6px), black calc(var(--earth-r, 380px) + 24px), transparent calc(var(--earth-r, 380px) + 55px))",
          }}
        />

        {/* Tier 2: Subtle Transition Blur (Light 2.5px softening fading to sharp grid) */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(51, 65, 85, 0.16) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.16) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            backgroundPosition: "center center",
            filter: "blur(2.5px)",
            WebkitFilter: "blur(2.5px)",
            maskImage: "radial-gradient(circle at 50% 50%, transparent calc(var(--earth-r, 380px) + 15px), black calc(var(--earth-r, 380px) + 30px), black calc(var(--earth-r, 380px) + 50px), transparent calc(var(--earth-r, 380px) + 90px))",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent calc(var(--earth-r, 380px) + 15px), black calc(var(--earth-r, 380px) + 30px), black calc(var(--earth-r, 380px) + 50px), transparent calc(var(--earth-r, 380px) + 90px))",
          }}
        />

        {/* Globe Canvas (Real NASA Satellite Earth, 5km Grid, Double-Click Lock) */}
        <div
          ref={globeRef}
          className="absolute inset-0 z-[1] cursor-crosshair"
        >
          <ThreeGlobe
            autoRotate={!selectedCoord}
            radius={66}
            className="w-full h-full"
            showControls={true}
            targetCoords={selectedCoord}
            chatOpen={chatOpen}
            activeRaster={activeRaster}
            vectorLayers={vectorOverlays}
            onLocationSelect={(coords) => {
              if (coords) {
                setSelectedCoord(coords);
                const info = getSovereignBasin(coords.lat, coords.lon);
                setBasin(info.id);
                setChatOpen(true);
              } else {
                setSelectedCoord(null);
              }
            }}
          />
        </div>

        {/* Soft Ambient Contrast Vignette */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 85% 92% at 50% 50%, transparent 45%, rgba(241, 245, 249, 0.65) 100%)",
          }}
        />

        {/* Left Layer Dock */}
        <LayerDock
          persona={persona}
          visible={!scrolledPastGlobe}
          activeRaster={activeRaster}
          onSelectRaster={setActiveRaster}
          vectorOverlays={vectorOverlays}
          onToggleVectorOverlay={toggleVectorOverlay}
          sstRange={sstRange}
          setSstRange={setSstRange}
          waveMax={waveMax}
          setWaveMax={setWaveMax}
        />

        {/* Dynamic Basin Computation */}
        {(() => {
          const currentBasinInfo = selectedCoord
            ? getSovereignBasin(selectedCoord.lat, selectedCoord.lon)
            : {
              id: basin,
              short: BASINS.find((b) => b.id === basin)?.short || "Arabian Sea",
              label: BASINS.find((b) => b.id === basin)?.label || "Arabian Sea Basin",
              sovereignStatus: "Indian EEZ Sovereign Baseline",
              isEEZ: true,
              imblDistanceKm: 74.2,
            };

          return (
            <>
              {/* Selected 6km x 5km Coordinate HUD Badge / Prompt (Compact & Sleek) */}
              <AnimatePresence>
                {selectedCoord ? (
                  <motion.div
                    key="coord-badge"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-20"
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono shadow-sm backdrop-blur-md bg-white/95 border-zinc-200 text-zinc-900"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                      <span className="text-zinc-900 font-bold whitespace-nowrap">
                        {selectedCoord.lat.toFixed(3)}°N, {selectedCoord.lon.toFixed(3)}°E
                      </span>
                      <span className="text-zinc-500 text-[10px] border-l border-zinc-200 pl-2 whitespace-nowrap">
                        {currentBasinInfo.short} · [IN-EEZ-{(selectedCoord.lat * 100).toFixed(0)}-{(selectedCoord.lon * 100).toFixed(0)}]
                      </span>
                      <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${currentBasinInfo.isEEZ
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        {currentBasinInfo.isEEZ ? "EEZ Safe" : "High Seas"}
                      </span>
                      <button
                        onClick={() => setSelectedCoord(null)}
                        className="text-zinc-400 hover:text-black transition p-0.5 rounded hover:bg-zinc-100 flex-shrink-0 ml-0.5"
                        title="Unlock Cell"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="prompt-badge"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                  >
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono shadow-sm backdrop-blur-md bg-white/95 border-zinc-200 text-zinc-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping flex-shrink-0" />
                      <span className="font-medium text-zinc-700 whitespace-nowrap">
                        Double-click globe to lock 6km × 5km cell
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scroll Cue to Report Button (Compact White Capsule) */}
              <div
                className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-300 ${
                  scrolledPastGlobe ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                <button
                  onClick={scrollToReport}
                  className="group flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 shadow-sm bg-white/95 hover:bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300 backdrop-blur-md"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping flex-shrink-0" />
                  <span className="text-[11px] font-mono font-semibold text-zinc-800">
                    Explore Dossier
                  </span>
                  <ArrowDown className="h-3 w-3 text-zinc-500 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* ══════════════════════════════ SCROLL-DOWN REPORT DOSSIER ══════════════ */}
      <div className="relative z-20">
        <ReportView
          report={activeReport}
          persona={persona}
          selectedSpeciesId={selectedSpecies}
          coordinates={selectedCoord || { lat: 20.75, lon: 70.19 }}
          basinName={
            selectedCoord
              ? getSovereignBasin(selectedCoord.lat, selectedCoord.lon).label
              : BASINS.find((b) => b.id === basin)?.label || "Arabian Sea Basin"
          }
          onBackToGlobe={scrollToGlobe}
          showBackToGlobeButton={true}
        />
      </div>

      {/* ══════════════════════════════ TOP FIXED HEADER (Google Maps Style) ═════ */}
      <header
        className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 bg-white/95 backdrop-blur-md border-b border-[#E1E5EA] shadow-xs"
      >
        {/* National Scientific Platform Branding */}
        <Link
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0 group"
          title="Project ORCA Home"
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#1F4E8C] text-white shadow-xs group-hover:bg-[#173F72] transition">
            <Globe className="h-4 w-4" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-sm text-[#202124] tracking-tight">ORCA</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#E87524]" />
            </div>
            <span className="text-[10px] text-[#667085] font-sans font-medium mt-0.5 tracking-normal">Marine Intelligence Platform</span>
          </div>
        </Link>

        {/* Clean Scientific Search Bar */}
        <div className="flex-1 relative max-w-lg mx-auto">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]"
            />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 180)}
              placeholder="Search ports, coordinates (e.g. 20.75°N, 70.19°E), or zones..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg text-xs font-sans outline-none transition bg-[#F6F8FA] hover:bg-[#F1F5F9] border border-[#E1E5EA] focus:border-[#1F4E8C] focus:bg-white text-[#202124] placeholder-[#98A2B3]"
            />
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {searchFocus && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1.5 left-0 right-0 rounded-lg overflow-hidden shadow-lg bg-white border border-[#E1E5EA]"
              >
                {SEARCH_SUGGESTIONS.map((s, i) => {
                  const SugIcon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchVal(s.label);
                        setSearchFocus(false);
                        if (s.label.includes("Veraval")) {
                          setSelectedCoord({ lat: 20.902, lon: 70.368 });
                          setSelectedSpecies("yellowfin");
                        } else if (s.label.includes("Kochi")) {
                          setSelectedCoord({ lat: 9.934, lon: 76.259 });
                          setSelectedSpecies("skipjack");
                        } else if (s.label.includes("Chennai")) {
                          setSelectedCoord({ lat: 13.08, lon: 80.27 });
                          setSelectedSpecies("mackerel");
                        } else {
                          setSelectedCoord({ lat: 20.75, lon: 70.19 });
                          setSelectedSpecies("yellowfin");
                        }
                        setChatOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-[#F6F8FA] transition border-b border-[#F1F5F9] last:border-b-0"
                    >
                      <div className="p-1 rounded bg-[#F1F5F9] text-[#1F4E8C]">
                        <SugIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-[#202124] font-medium truncate">{s.label}</div>
                        <div className="text-[10px] text-[#667085] font-mono">{s.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Basin Selector */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setNavOpen((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans border transition text-[#202124] bg-white border-[#E1E5EA] hover:border-[#1F4E8C] hover:bg-[#F6F8FA]"
          >
            <Compass className="h-3.5 w-3.5 text-[#1F4E8C]" />
            <span className="hidden sm:inline font-medium">{BASINS.find((b) => b.id === basin)?.short}</span>
            <ChevronDown className="h-3 w-3 text-[#98A2B3]" />
          </button>
          <AnimatePresence>
            {navOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-10 rounded-lg overflow-hidden z-50 shadow-lg bg-white border border-[#E1E5EA] w-48"
              >
                {BASINS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setBasin(b.id); setNavOpen(false); }}
                    className="w-full px-3.5 py-2 text-left text-xs font-sans hover:bg-[#F6F8FA] transition flex items-center justify-between text-[#202124]"
                  >
                    <span>{b.label}</span>
                    {basin === b.id && <CheckCircle2 className="h-3.5 w-3.5 text-[#1F4E8C]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Actions - Subtle Neutral with Active Blue */}
        <div className="hidden md:flex items-center gap-0.5 flex-shrink-0">
          {[
            { icon: Map, label: "Globe", onClick: scrollToGlobe, active: true },
            { icon: Database, label: "Data", href: "/research/data" },
            { icon: FileText, label: "Advisory", onClick: scrollToReport },
            { icon: BookOpen, label: "Vault", href: "/report" },
            { icon: Network, label: "Swarm", href: "/dashboard/agents" },
          ].map((item: any) => {
            const ItemIcon = item.icon;
            const itemClasses = `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${item.active
                ? "text-[#1F4E8C] bg-[#F0F4FA] font-semibold"
                : "text-[#667085] hover:text-[#202124] hover:bg-[#F6F8FA]"
              }`;

            return item.href ? (
              <Link key={item.label} href={item.href} className={itemClasses}>
                <ItemIcon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button key={item.label} onClick={item.onClick} className={itemClasses}>
                <ItemIcon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Persona Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition bg-[#1F4E8C] text-white hover:bg-[#173F72] shadow-xs"
          >
            <PersonaIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{pm.name}</span>
          </Link>
        </div>
      </header>

      {/* AI Chat Drawer */}
      <AIChatDrawer
        persona={persona}
        isOpen={chatOpen}
        onToggle={() => setChatOpen((p) => !p)}
        onOpenReport={scrollToReport}
        onReportGenerated={(newReport) => {
          setActiveReport(newReport);
          setTimeout(() => {
            scrollToReport();
          }, 600);
        }}
        selectedCoord={selectedCoord}
        basinLabel={
          selectedCoord
            ? getSovereignBasin(selectedCoord.lat, selectedCoord.lon).label
            : BASINS.find((b) => b.id === basin)?.label || "Arabian Sea Basin"
        }
      />
    </div>
  );
}

// ─── Exported Dashboard Page (Suspense boundary) ───────────────────────────────
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-white" />}>
      <AppContent />
    </Suspense>
  );
}
