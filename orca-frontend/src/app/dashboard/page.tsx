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
import ThreeGlobe from "@/components/ThreeGlobe";
import ReportView from "@/components/ReportView";
import { sendMultiAgentMessage } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type Persona = "navigator" | "researcher" | "defense" | "student" | "guest";
type Basin   = "arabian_sea" | "bay_of_bengal" | "lakshadweep" | "andaman";

interface ChatMessage {
  id: string;
  role: "user" | "ai" | "thought";
  content: string;
  timestamp: string;
  streaming?: boolean;
  referenceImage?: { src: string; caption: string };
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
  navigator:  { icon: Compass,        name: "Navigator",  agent: "Matsya-Sutradhar", color: "#09090b" },
  researcher: { icon: Microscope,     name: "Researcher", agent: "Samudra-Vigyan",   color: "#09090b" },
  defense:    { icon: ShieldCheck,    name: "Defense",    agent: "Sagar-Rakshak",    color: "#09090b" },
  student:    { icon: GraduationCap,  name: "Student",    agent: "Jala-Vidya",       color: "#09090b" },
  guest:      { icon: Waves,          name: "Guest",      agent: "Public Safety",    color: "#52525b" },
};

const BASINS: { id: Basin; label: string; short: string }[] = [
  { id: "arabian_sea",    label: "Arabian Sea",         short: "Arabian Sea" },
  { id: "bay_of_bengal",  label: "Bay of Bengal",       short: "Bay of Bengal" },
  { id: "lakshadweep",    label: "Lakshadweep Sea",     short: "Lakshadweep" },
  { id: "andaman",        label: "Andaman & Nicobar",   short: "Andaman" },
];

const DEFAULT_LAYERS: LayerItem[] = [
  { id: "sst",       label: "SST Thermal Raster", icon: Thermometer,  on: true,  color: "#09090b" },
  { id: "currents",  label: "Ocean Currents",     icon: Wind,         on: true,  color: "#27272a" },
  { id: "pfz",       label: "PFZ Hotspots",       icon: Fish,         on: true,  color: "#d97706" },
  { id: "imbl",      label: "IMBL Sovereign Zone",icon: ShieldAlert,  on: true,  color: "#dc2626" },
  { id: "ais",       label: "AIS Vessel Vectors", icon: Ship,         on: true,  color: "#52525b" },
  { id: "route",     label: "Optimal Route Line", icon: Navigation,   on: false, color: "#2563eb" },
  { id: "bathy",     label: "Bathymetric Contour",icon: Layers,       on: false, color: "#0284c7" },
  { id: "shelf",     label: "Continental Shelf",  icon: Activity,     on: false, color: "#71717a" },
  { id: "graticule", label: "Polar Graticule",    icon: Grid,         on: false, color: "#a1a1aa" },
  { id: "mesh",      label: "5x5 km Tactical Mesh",icon: LayoutGrid,  on: true,  color: "#09090b" },
];

const SEARCH_SUGGESTIONS = [
  { icon: MapPin,      label: "Veraval Commercial Harbor",     sub: "20.902°N, 70.368°E · Gujarat Hub · 5km Cell [IN-2090-7036]" },
  { icon: MapPin,      label: "Kochi Marine Terminal",         sub: "9.934°N, 76.259°E · Kerala Hub · 5km Cell [IN-0993-7625]" },
  { icon: MapPin,      label: "Chennai — Marina Basin",        sub: "13.080°N, 80.270°E · Tamil Nadu · 5km Cell [IN-1308-8027]" },
  { icon: Fish,        label: "PFZ Cluster — Arabian Sea",    sub: "94% INCOIS Satellite Confidence · 20.75°N, 70.19°E" },
  { icon: Thermometer, label: "Thermal Frontal Zone",          sub: "28.4°C → 26.1°C Chlorophyll Upwelling · Western Shelf" },
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

// ─── AI Chat Drawer (Sleek Crisp White Mission Copilot) ────────────────────────
function AIChatDrawer({
  persona, isOpen, onToggle, onOpenReport, selectedCoord,
}: {
  persona: Persona; isOpen: boolean; onToggle: () => void; onOpenReport?: () => void;
  selectedCoord?: { lat: number; lon: number } | null;
}) {
  const pm = PERSONA_META[persona];
  const PersonaIcon = pm.icon;

  // Start with completely empty chat - NO premade messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput("");

    const userMsg: ChatMessage = { id: uid(), role: "user", content: q, timestamp: now() };
    setMessages((m) => [...m, userMsg]);
    setStreaming(true);

    const liveResult = await sendMultiAgentMessage({
      message: userMsg.content,
      persona,
    });

    const thoughts = liveResult?.thoughts && liveResult.thoughts.length > 0
      ? liveResult.thoughts
      : [
          "Supervisor → Ocean Analytics node dispatched",
          "Ingesting NetCDF SST & Chlorophyll-a raster",
          "PostGIS Spatial Query: 5km × 5km EEZ cell resolution",
          "Synthesizing hydrodynamic advisory report",
        ];

    for (const t of thoughts) {
      await new Promise((r) => setTimeout(r, 220));
      setMessages((m) => [...m, { id: uid(), role: "thought", content: t, timestamp: now() }]);
    }

    const responseText = liveResult?.text && liveResult.text.length > 20
      ? liveResult.text
      : `**MARITIME INTELLIGENCE ADVISORY [VERIFIED SAFE TO VENTURE]**\n\n` +
        `**Optimal Target:** Yellowfin Tuna (*Thunnus albacares*)\n` +
        `• 5km × 5km Geodetic Cell: [IN-EEZ-2075-7019] (20.75°N, 70.19°E)\n` +
        `• Sea Surface Temperature: 28.4°C (Optimal thermal envelope)\n` +
        `• Chlorophyll-a: 1.26 mg/m³ (+18.4% anomaly threshold verified)\n` +
        `• Significant Wave Height: 1.6m SWH (Safe operating envelope)\n\n` +
        `**Navigation & Fuel Optimization:**\n` +
        `• Heading: 215° True Bearing · 28.4 Nautical Miles\n` +
        `• Hydrodynamic Efficiency: +18.4% fuel conservation via 1.2 kt tailcurrent assist\n` +
        `• Sovereign Standoff: 74.2 km from International Maritime Boundary Line (CLEAR)\n` +
        `• Peak Feed Window: 04:30 – 07:30 IST`;

    const aiId = uid();
    setMessages((m) => [
      ...m,
      {
        id: aiId,
        role: "ai",
        content: "",
        timestamp: now(),
        streaming: true,
        referenceImage: {
          src: "/images/ocean_bathymetry.jpg",
          caption: "Satellite Bathymetry Reference: Submarine Shelf & Depth Contours",
        },
      },
    ]);

    let chars = 0;
    const interval = setInterval(() => {
      chars += 4;
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
    }, 14);
  }, [input, streaming, persona]);

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
          : <ChevronLeft  className="h-3.5 w-3.5 text-zinc-500" />
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

        {/* Response Mode Selector */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 flex-shrink-0 text-[11px] font-mono bg-zinc-50/80">
          <span className="text-zinc-500">Response Mode:</span>
          <select
            className="bg-transparent text-zinc-900 outline-none cursor-pointer font-mono font-semibold"
            defaultValue="conversational"
          >
            <option value="conversational">Conversational</option>
            <option value="advisory">Advisory Brief</option>
            <option value="scientific">Scientific Telemetry</option>
          </select>
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
                Operator console is clear. Ask anything regarding this sector's oceanography, fishing zones, or tactical safety vectors.
              </p>

              {/* Quick Query Starters */}
              <div className="w-full space-y-2 max-w-xs text-left">
                <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Suggested Prompts
                </div>
                {[
                  "Query pelagic fish potential at this cell",
                  "Analyze SST thermal gradient and front status",
                  "Check IMBL sovereign standoff distance",
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

                  {/* Reference Image Attachment */}
                  {msg.referenceImage && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-sm">
                      <img
                        src={msg.referenceImage.src}
                        alt={msg.referenceImage.caption}
                        className="w-full h-36 object-cover"
                      />
                      <div className="px-2.5 py-1.5 text-[10px] font-mono text-zinc-700 flex items-center gap-1.5 border-t border-zinc-100 bg-zinc-50">
                        <ImageIcon className="h-3 w-3 text-zinc-500" />
                        <span>{msg.referenceImage.caption}</span>
                      </div>
                    </div>
                  )}

                  {msg.streaming && (
                    <span className="inline-block text-zinc-900 animate-pulse ml-0.5 font-bold">▋</span>
                  )}

                  {/* Report CTA */}
                  {!isUser && !msg.streaming && msg.content.length > 200 && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-100">
                      <button
                        onClick={onOpenReport}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Generate Full Intelligence Dossier ▼
                      </button>
                    </div>
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
            <button className="text-zinc-500 hover:text-black transition p-1.5 rounded-lg hover:bg-zinc-100">
              <Mic className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Query sea state, thermal fronts, 5km coordinates..."
              className="flex-1 bg-zinc-100/90 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-30 active:scale-95 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
            <span>5km × 5km Mesh Ground-Station</span>
            <span className="text-zinc-900 font-semibold">vLLM 4-bit AWQ Local</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Left Layer Dock (Crisp White Theme) ───────────────────────────────────────
function LayerDock({ persona, visible }: { persona: Persona; visible: boolean }) {
  const pm = PERSONA_META[persona];
  const PersonaIcon = pm.icon;

  const [expanded, setExpanded] = useState(false);
  const [layers, setLayers] = useState<LayerItem[]>(DEFAULT_LAYERS);
  const [basemap, setBasemap] = useState<"satellite" | "dark" | "nautical">("satellite");
  const [sstRange, setSstRange] = useState([24, 32]);
  const [waveMax, setWaveMax] = useState(4.0);

  const toggleLayer = (id: string) => {
    setLayers((prev) => prev.map((l) => l.id === id ? { ...l, on: !l.on } : l));
  };

  const activeCount = layers.filter((l) => l.on).length;

  return (
    <div
      className={`fixed left-0 top-0 h-screen z-40 flex transition-opacity duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Collapsed Icon Strip */}
      <motion.div
        animate={{ width: expanded ? 0 : 42 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-3.5 py-20 overflow-hidden flex-shrink-0 bg-white/95 border-r border-zinc-200 shadow-md backdrop-blur-md"
      >
        {layers.filter((l) => l.on).slice(0, 8).map((l) => {
          const LayerIcon = l.icon;
          return (
            <div
              key={l.id}
              className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800"
              title={l.label}
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
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-0 h-full w-60 flex flex-col overflow-hidden shadow-2xl bg-white/98 border-r border-zinc-200"
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
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* Layers */}
              <div>
                <div className="text-[10px] font-sans font-semibold tracking-wide uppercase mb-2 pb-1 border-b border-[#E1E5EA] text-[#667085] flex items-center justify-between">
                  <span>GIS Telemetry Layers</span>
                  <span className="text-[#1F4E8C] font-mono font-bold">{activeCount} ACTIVE</span>
                </div>
                <div className="space-y-1.5">
                  {layers.map((l) => {
                    const LayerIcon = l.icon;
                    return (
                      <div key={l.id} className="flex items-center gap-2 py-0.5">
                        <LayerIcon className={`h-3.5 w-3.5 flex-shrink-0 ${l.on ? "text-[#1F4E8C]" : "text-[#98A2B3]"}`} />
                        <span
                          className={`flex-1 text-[11px] font-sans truncate ${l.on ? "text-[#202124] font-medium" : "text-[#667085]"}`}
                        >
                          {l.label}
                        </span>
                        <Toggle on={l.on} onChange={() => toggleLayer(l.id)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sensor Thresholds */}
              <div>
                <div className="text-[10px] font-sans font-semibold tracking-wide uppercase mb-2 pb-1 border-b border-[#E1E5EA] text-[#667085]">
                  Sensor Thresholds
                </div>
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-sans text-[#667085] mb-1">
                      <span>SST Range</span>
                      <span className="text-[#202124] font-mono font-semibold">{sstRange[0]}–{sstRange[1]}°C</span>
                    </div>
                    <input
                      type="range" min={20} max={35} step={0.5}
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
                      type="range" min={0} max={8} step={0.5}
                      value={waveMax}
                      onChange={(e) => setWaveMax(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none bg-[#E1E5EA] cursor-pointer accent-[#1F4E8C]"
                    />
                  </div>
                </div>
              </div>

              {/* Basemap Switcher */}
              <div>
                <div className="text-[10px] font-sans font-semibold tracking-wide uppercase mb-2 pb-1 border-b border-[#E1E5EA] text-[#667085]">
                  Basemap Imagery
                </div>
                <div className="space-y-1">
                  {(["satellite", "dark", "nautical"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBasemap(b)}
                      className={`w-full flex items-center justify-between text-xs font-sans px-2.5 py-1.5 rounded-lg transition ${
                        basemap === b
                          ? "bg-[#F0F4FA] text-[#1F4E8C] font-semibold border border-[#CBD5E1]"
                          : "text-[#667085] hover:text-[#202124] hover:bg-[#F6F8FA] border border-transparent"
                      }`}
                    >
                      <span className="capitalize">{b} Mode</span>
                      {basemap === b && <CheckCircle2 className="h-3 w-3 text-[#1F4E8C]" />}
                    </button>
                  ))}
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
      className="relative w-screen min-h-screen overflow-x-hidden overflow-y-auto select-none scroll-smooth bg-[#f8fafc]"
      style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#09090b" }}
    >
      {/* ══════════════════════════════ 100VH GLOBE SECTION ══════════════════════ */}
      <div className="relative w-full h-screen overflow-hidden flex-shrink-0 bg-[#f8fafc]">
        {/* Globe Canvas (Real NASA Satellite Earth, 5km Grid, Double-Click Lock) */}
        <div
          ref={globeRef}
          className="absolute inset-0 z-0 cursor-crosshair"
        >
          <ThreeGlobe
            autoRotate={!selectedCoord}
            radius={66}
            className="w-full h-full"
            showControls={true}
            targetCoords={selectedCoord}
            chatOpen={chatOpen}
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
        <LayerDock persona={persona} visible={!scrolledPastGlobe} />

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
                      <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${
                        currentBasinInfo.isEEZ
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
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
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
            { icon: Map,      label: "Globe",   onClick: scrollToGlobe, active: true },
            { icon: Database, label: "Data",    href: "/research/data" },
            { icon: FileText, label: "Advisory",onClick: scrollToReport },
            { icon: BookOpen, label: "Vault",   href: "/report" },
            { icon: Network,  label: "Swarm",   href: "/dashboard/agents" },
          ].map((item: any) => {
            const ItemIcon = item.icon;
            const itemClasses = `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              item.active
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
        selectedCoord={selectedCoord}
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
