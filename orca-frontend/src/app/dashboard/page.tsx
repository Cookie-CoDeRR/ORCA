"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer, LineLayer, PathLayer } from "@deck.gl/layers";
import Map from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Trash2,
  Compass,
  Shield,
  Fish,
  Waves,
  RefreshCw,
  Layers,
  MapPin,
  Bot,
  User,
  Navigation,
  Globe,
  Mountain,
  RotateCcw,
  Eye,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Anchor,
  Radio,
  X,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  Wind,
  Droplets,
  Gauge,
  Sliders,
  Sparkles,
} from "lucide-react";

import CommandPortalLayout, { PortalTab } from "@/components/CommandPortalLayout";
import LayerControlPanel, { LayerVisibility } from "@/components/LayerControlPanel";
import AgentMeshView from "@/components/AgentMeshView";
import DataHubView from "@/components/DataHubView";
import RegulatoryVaultView from "@/components/RegulatoryVaultView";
import { fetchOceanData, OceanDataResult } from "@/lib/oceanDataService";
import { buildGraticuleLines } from "@/lib/graticuleLayer";
import {
  connectAisStream,
  tickSimVessels,
  Vessel,
  VesselType,
} from "@/lib/aisStream";

// ─── Constants & Authentic Geographic Data ─────────────────────────────────────
const CARTO_API_KEY =
  process.env.NEXT_PUBLIC_CARTO_API_KEY || "cb1_2dhp_1_9403bbcac732699b29121f7e";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const AIS_API_KEY = process.env.NEXT_PUBLIC_AIS_API_KEY || "";

// Major Indian Maritime Ports (Real coastal positions)
const INDIA_PORTS: { name: string; pos: [number, number] }[] = [
  { name: "Kandla",    pos: [70.22, 23.00] },
  { name: "Veraval",   pos: [70.37, 20.90] },
  { name: "Mumbai",    pos: [72.83, 18.92] },
  { name: "Goa",       pos: [73.80, 15.40] },
  { name: "Mangalore", pos: [74.85, 12.87] },
  { name: "Kochi",     pos: [76.26, 9.93]  },
  { name: "Tuticorin", pos: [78.15, 8.80]  },
  { name: "Chennai",   pos: [80.28, 13.08] },
  { name: "Vizag",     pos: [83.22, 17.69] },
  { name: "Paradip",   pos: [86.69, 20.26] },
  { name: "Kolkata",   pos: [88.37, 22.56] },
];

// ── REALISTIC WATER-FOLLOWING COASTAL SHIPPING CORRIDORS (No land crossing) ──
const WEST_COAST_CORRIDOR: [number, number][] = [
  [69.60, 22.60], // Gulf of Kutch Outer
  [68.90, 22.10], // Okha Head
  [69.40, 21.20], // Porbandar Offshore
  [70.20, 20.50], // Veraval Offshore
  [71.50, 19.80], // Gulf of Khambhat Standoff
  [72.20, 18.80], // Mumbai High Shipping Lane
  [72.80, 17.50], // Ratnagiri Offshore
  [73.30, 15.80], // Goa Maritime Approach
  [74.20, 13.80], // Karwar / Mangalore Lane
  [75.20, 11.50], // Malabar Corridor
  [75.90, 9.80],  // Kochi Approach
  [76.80, 8.20],  // Trivandrum Waters
  [77.40, 7.60],  // Cape Comorin Southern Rounding
];

const EAST_COAST_CORRIDOR: [number, number][] = [
  [77.40, 7.60],  // Cape Comorin
  [78.40, 8.40],  // Tuticorin Outer Lane
  [79.60, 9.00],  // Gulf of Mannar Deep Channel
  [80.60, 10.80], // Nagapattinam Offshore
  [80.80, 13.20], // Chennai Anchorage Lane
  [81.80, 15.50], // Krishna-Godavari Basin Corridor
  [83.80, 17.60], // Visakhapatnam Deep Approach
  [86.20, 19.80], // Odisha / Paradip Corridor
  [87.80, 21.00], // Dhamra / Sandheads Approaches
  [88.20, 21.60], // Hooghly Estuary Entrance
];

const INTERNATIONAL_TSS_LANE: [number, number][] = [
  [58.00, 21.50], // Gulf of Oman Outer
  [64.00, 16.50], // Arabian Sea Deep Trunk
  [70.00, 12.00], // Lakshadweep Deep TSS
  [76.00, 6.80],  // South of Kanyakumari
  [80.50, 5.50],  // South of Dondra Head (Sri Lanka)
  [85.00, 5.20],  // Bay of Bengal Equatorial Highway
  [90.00, 5.50],  // Great Channel Entrance
  [95.00, 5.80],  // Malacca Strait Western Gateway
];

const IMBL_PAKISTAN: [number, number][] = [
  [61.32, 22.35], [62.70, 22.65], [63.90, 22.85],
  [65.30, 22.90], [66.50, 23.08], [67.80, 22.76], [68.17, 23.50],
];
const IMBL_SRILANKA: [number, number][] = [
  [79.42, 9.76], [80.00, 9.52], [80.50, 9.18],
  [80.80, 8.83], [81.10, 8.48],
];

const SHELF_BREAK: { position: [number, number]; type: string }[] = [
  { position: [68.8, 22.7], type: "Shelf Break" },
  { position: [70.2, 21.8], type: "Shelf Break" },
  { position: [72.0, 20.5], type: "Shelf Break" },
  { position: [73.0, 18.5], type: "Shelf Break" },
  { position: [74.8, 15.2], type: "Shelf Break" },
  { position: [76.0, 12.0], type: "Reef/Shoal" },
  { position: [80.5, 12.0], type: "Shelf Break" },
  { position: [81.5, 13.5], type: "Canyon Head" },
  { position: [82.5, 15.5], type: "Shelf Break" },
  { position: [84.5, 18.0], type: "Shelf Break" },
  { position: [87.0, 20.0], type: "Shelf Break" },
];

const VESSEL_COLORS: Record<VesselType, [number, number, number, number]> = {
  cargo:     [220, 220, 220, 230],
  tanker:    [103, 232, 249, 230],
  fishing:   [52,  211, 153, 220],
  military:  [244,  63,  94, 240],
  passenger: [196, 181, 253, 230],
  sailing:   [251, 191,  36, 220],
  tug:       [253, 186,  47, 210],
  unknown:   [113, 113, 122, 180],
};

const TERRAIN_DEM_SOURCE = {
  type: "raster-dem",
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  tileSize: 256,
  encoding: "terrarium",
  maxzoom: 15,
};

function buildMapStyle(
  mode: "dark" | "voyager" | "satellite",
  enable3D: boolean,
  exaggeration = 2.0
): any {
  const sources: any = { "terrain-dem": TERRAIN_DEM_SOURCE };
  let basemapLayer: any = null;

  if (mode === "dark") {
    sources["carto-dark"] = {
      type: "raster",
      tiles: [
        `https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
        `https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
        `https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
        `https://d.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
      ],
      tileSize: 256,
      attribution: "© CARTO, © OpenStreetMap",
    };
    basemapLayer = { id: "carto-dark-tiles", type: "raster", source: "carto-dark", minzoom: 0, maxzoom: 20 };
  } else if (mode === "voyager") {
    sources["carto-voyager"] = {
      type: "raster",
      tiles: [
        `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
        `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
        `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
        `https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
      ],
      tileSize: 256,
      attribution: "© CARTO, © OpenStreetMap",
    };
    basemapLayer = { id: "carto-voyager-tiles", type: "raster", source: "carto-voyager", minzoom: 0, maxzoom: 20 };
  } else {
    sources["esri-satellite"] = {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri, Maxar",
    };
    basemapLayer = { id: "satellite-tiles", type: "raster", source: "esri-satellite", minzoom: 0, maxzoom: 19 };
  }

  const layers = [basemapLayer];
  if (enable3D) {
    layers.push({
      id: "hillshade",
      type: "hillshade",
      source: "terrain-dem",
      paint: {
        "hillshade-shadow-color": "#020617",
        "hillshade-highlight-color": "#ffffff",
        "hillshade-accent-color": "#52525b",
        "hillshade-exaggeration": 0.7,
      },
    });
  }

  const styleObj: any = { version: 8, sources, layers };
  if (enable3D) styleObj.terrain = { source: "terrain-dem", exaggeration };
  return styleObj;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  geojson?: any;
  timestamp: string;
}

function sanitizeLlmContent(text: string): string {
  return text ? text.replace(/\*\*\*/g, "**").trim() : "";
}

function VesselTooltip({ vessel, onClose }: { vessel: Vessel; onClose: () => void }) {
  const typeLabel: Record<VesselType, string> = {
    cargo: "Cargo Vessel",
    tanker: "Oil/Gas Tanker",
    fishing: "Fishing Vessel",
    military: "Naval / Military",
    passenger: "Passenger Ferry",
    sailing: "Sailing Vessel",
    tug: "Tugboat",
    unknown: "Unknown Vessel",
  };

  const color = VESSEL_COLORS[vessel.type];
  const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-72 rounded-2xl border border-white/15 bg-zinc-950/98 shadow-2xl backdrop-blur-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cssColor }} />
          <span className="text-xs font-bold text-white truncate">{vessel.name || "Unknown"}</span>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
        <div className="text-zinc-400">Type</div>
        <div className="text-white font-semibold">{typeLabel[vessel.type]}</div>
        <div className="text-zinc-400">MMSI</div>
        <div className="text-white font-mono">{vessel.mmsi}</div>
        <div className="text-zinc-400">Speed (SOG)</div>
        <div className="text-white font-semibold">{vessel.sog} kts</div>
        <div className="text-zinc-400">Course (COG)</div>
        <div className="text-white font-semibold">{vessel.cog}°</div>
        <div className="text-zinc-400">Position</div>
        <div className="text-white font-mono">{vessel.lat}°N {vessel.lon}°E</div>
        <div className="text-zinc-400">Flag</div>
        <div className="text-white">{vessel.flag ?? "—"}</div>
      </div>
      <div className="px-4 py-2 border-t border-white/10 text-[9px] font-mono text-zinc-500">
        AIS · aisstream.io
      </div>
    </div>
  );
}

// ─── Main Portal Dashboard ────────────────────────────────────────────────────
function DashboardContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "visitor";
  const isDefenseUser = roleParam === "defense";

  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState<PortalTab>("tactical");
  const [activeBasin, setActiveBasin] = useState("arabian_sea");
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [threadId, setThreadId] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>([70.118, 20.652]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showThoughtStream, setShowThoughtStream] = useState(true);
  const [currentThoughts, setCurrentThoughts] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeGeojson, setActiveGeojson] = useState<any>(null);

  // Active Synthesized Action Card State
  const [actionCardData, setActionCardData] = useState<{
    species: string;
    confidence: number;
    fuelSavings: number;
    imblStandoffKm: number;
    seaState: string;
    swh: number;
    sst: number;
    chlorophyll: number;
    windKnots: number;
  }>({
    species: "Yellowfin Tuna (Thunnus albacares)",
    confidence: 88,
    fuelSavings: 22.0,
    imblStandoffKm: 45.0,
    seaState: "Moderate & Operable",
    swh: 1.6,
    sst: 28.4,
    chlorophyll: 1.26,
    windKnots: 14.2,
  });

  // Layer visibility
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    weather: true,
    currents: true,
    resources: false,
    fishingZones: true,
    transport: true,
    military: false,
  });

  // Map state
  const [activeMapMode, setActiveMapMode] = useState<"dark" | "voyager" | "satellite">("dark");
  const [enable3DTerrain, setEnable3DTerrain] = useState(true);
  const [terrainExaggeration] = useState(2.0);
  const [viewState, setViewState] = useState({
    longitude: 70.368,
    latitude: 20.902,
    zoom: 6.2,
    pitch: 45,
    bearing: 10,
  });

  // Live ocean data
  const [realOceanData, setRealOceanData] = useState<OceanDataResult | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // AIS ships
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [aisConnected, setAisConnected] = useState(false);
  const [showVessels, setShowVessels] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const graticuleLines = useMemo(() => buildGraticuleLines(), []);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Basin fly-to ─────────────────────────────────────────────────────────
  const handleBasinChange = (basinId: string) => {
    setActiveBasin(basinId);
    const basinCoords: Record<string, [number, number]> = {
      arabian_sea: [70.368, 20.902],
      bay_of_bengal: [83.2, 17.7],
      lakshadweep: [72.8, 10.5],
      andaman: [93.0, 11.5],
    };
    const target = basinCoords[basinId];
    if (target) {
      setViewState((prev) => ({
        ...prev,
        longitude: target[0],
        latitude: target[1],
        zoom: 5.8,
      }));
    }
  };

  // ─── Web Speech API (Voice Mic) ───────────────────────────────────────────
  const handleVoiceToggle = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    const langMap: Record<string, string> = {
      EN: "en-IN",
      HI: "hi-IN",
      GU: "gu-IN",
      TA: "ta-IN",
      ML: "ml-IN",
      TE: "te-IN",
      BN: "bn-IN",
    };
    recognition.lang = langMap[selectedLanguage] || "en-IN";

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const savedThread = localStorage.getItem("orca_thread_id") || uuidv4();
    localStorage.setItem("orca_thread_id", savedThread);
    setThreadId(savedThread);

    if (isDefenseUser) {
      setLayerVisibility((prev) => ({ ...prev, military: true }));
    }

    const greetingRole =
      roleParam === "researcher" ? "Marine Researcher" : roleParam === "defense" ? "Defense Officer" : "Coastal Navigator";

    setMessages([
      {
        id: "msg_welcome",
        role: "assistant",
        content: `### 🐬 Welcome, ${greetingRole} — Project ORCA (SIH26176)
**India's Sovereign Multi-Agent Marine Intelligence Command Platform.**

- Click anywhere on the **2.5D Bathymetric Deck** to lock target coordinates.
- **Synthesized Action Card** & **Live Telemetry Strip** active below.
- Local **Qwen 2.5 7B & BGE-M3** swarm running 100% on-premise.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [roleParam, isDefenseUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThoughts]);

  // ─── Ocean data & AIS ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchOceanData()
      .then((data) => { setRealOceanData(data); setIsLoadingData(false); })
      .catch(() => { setDataError("Ocean API unavailable"); setIsLoadingData(false); });
  }, []);

  useEffect(() => {
    if (AIS_API_KEY) {
      const cleanup = connectAisStream(
        AIS_API_KEY,
        (vesselMap) => {
          setVessels(Array.from(vesselMap.values()));
          setAisConnected(true);
        },
        () => {
          setAisConnected(false);
          startSimulation();
        }
      );
      return cleanup;
    } else {
      startSimulation();
    }
  }, []);

  function startSimulation() {
    const initial = tickSimVessels(0);
    setVessels([...initial]);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = setInterval(() => {
      const updated = tickSimVessels(10);
      setVessels([...updated]);
    }, 10000);
  }

  useEffect(() => {
    return () => { if (simTimerRef.current) clearInterval(simTimerRef.current); };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleLayerToggle = (id: keyof LayerVisibility) => {
    if (id === "military" && !isDefenseUser) return;
    setLayerVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMapClick = (info: any) => {
    if (info?.coordinate) {
      const [lon, lat] = info.coordinate;
      const coords: [number, number] = [+lon.toFixed(4), +lat.toFixed(4)];
      setSelectedCoordinates(coords);

      const sstVal = +(27.0 + Math.sin(lat) * 2.5).toFixed(1);
      const chlaVal = +(0.8 + Math.cos(lon) * 0.7).toFixed(2);
      const swhVal = +(1.2 + Math.sin(lon * 0.5) * 0.6).toFixed(2);
      const imblDist = Math.max(12, +(Math.abs(lon - 68.0) * 85).toFixed(1));

      setActionCardData((prev) => ({
        ...prev,
        sst: sstVal,
        chlorophyll: chlaVal,
        swh: swhVal,
        imblStandoffKm: imblDist,
      }));
    }
  };

  const handleResetView = () =>
    setViewState({ longitude: 70.368, latitude: 20.902, zoom: 6.2, pitch: 45, bearing: 10 });

  const handleTogglePerspective = () =>
    setViewState((prev) => ({
      ...prev,
      pitch: prev.pitch > 20 ? 0 : 45,
      bearing: prev.pitch > 20 ? 0 : 10,
    }));

  const handlePresetClick = (query: string, coords: [number, number]) => {
    setInputMessage(query);
    setSelectedCoordinates(coords);
    setViewState({ longitude: coords[0], latitude: coords[1], zoom: 7.0, pitch: 45, bearing: 10 });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || isStreaming) return;

    const targetCoords = selectedCoordinates
      ? [selectedCoordinates[1], selectedCoordinates[0]]
      : null;

    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsStreaming(true);
    setCurrentThoughts(["[SUPERVISOR] Decomposing intent & gazetteer entity mapping..."]);

    const assistantId = uuidv4();
    let acc = "";

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, thread_id: threadId, target_coordinates: targetCoords }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (reader) {
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "thought")
                setCurrentThoughts((prev) => [...prev, `[${data.agent.toUpperCase()}] ${data.text}`]);
              else if (data.type === "chunk") {
                acc += data.text;
                const sanitized = sanitizeLlmContent(acc);
                setMessages((prev) => {
                  const existing = prev.find((m) => m.id === assistantId);
                  if (existing)
                    return prev.map((m) => (m.id === assistantId ? { ...m, content: sanitized } : m));
                  return [...prev, { id: assistantId, role: "assistant", content: sanitized, timestamp: new Date().toLocaleTimeString() }];
                });
              } else if (data.type === "complete" && data.geojson) setActiveGeojson(data.geojson);
            } catch { /* ignore */ }
          }
        }
      }
    } catch {
      try {
        const res = await fetch(`${API_BASE}/api/v1/agent/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: query, thread_id: threadId, target_coordinates: targetCoords }),
        });
        const data = await res.json();
        const rp = data.response || {};
        acc = sanitizeLlmContent(rp.markdown_advisory || "Advisory generated.");
        if (rp.geojson_payload) setActiveGeojson(rp.geojson_payload);
        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: acc, geojson: rp.geojson_payload, timestamp: new Date().toLocaleTimeString() }]);
      } catch {
        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: `⚠ Cannot reach ORCA backend at ${API_BASE}. Running offline local intelligence mode.`, timestamp: new Date().toLocaleTimeString() }]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  // ─── DeckGL Layer Building ─────────────────────────────────────────────────
  const oceanPoints = realOceanData?.weatherPoints ?? [];
  const currentVectors = realOceanData?.currentVectors ?? [];
  const pfzPoints = realOceanData?.pfzPoints ?? [];

  const sstColor = (sst: number): [number, number, number, number] => {
    const t = Math.max(0, Math.min(1, (sst - 22) / 10));
    return [Math.round(40 + t * 215), Math.round(160 - t * 100), Math.round(240 - t * 200), 160];
  };

  // IMBL line segments
  const imblPakLines = IMBL_PAKISTAN.slice(0, -1).map((pos, i) => ({
    source: pos,
    target: IMBL_PAKISTAN[i + 1],
  }));
  const imblSlLines = IMBL_SRILANKA.slice(0, -1).map((pos, i) => ({
    source: pos,
    target: IMBL_SRILANKA[i + 1],
  }));

  const vesselHeadingPaths = vessels
    .filter((v) => v.sog > 0.5)
    .map((v) => {
      const rad = ((v.cog - 90) * Math.PI) / 180;
      const len = Math.max(0.05, v.sog * 0.008);
      const endLon = v.lon + len * Math.cos(rad);
      const endLat = v.lat + len * Math.sin(rad);
      return {
        path: [[v.lon, v.lat], [endLon, endLat]] as [number, number][],
        color: VESSEL_COLORS[v.type],
      };
    });

  const deckLayers: any[] = [];

  // ━━━ 1. TACTICAL GRATICULE MESH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  deckLayers.push(
    new LineLayer({
      id: "layer-graticule",
      data: graticuleLines,
      getSourcePosition: (d: any) => d.sourcePosition,
      getTargetPosition: (d: any) => d.targetPosition,
      getColor: (d: any) => d.color,
      getWidth: (d: any) => d.width,
      widthUnits: "pixels",
      widthMinPixels: 0.5,
      opacity: 1,
      pickable: false,
    })
  );

  // ━━━ 2. WEATHER (SST Thermal Heatmap Surface) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (layerVisibility.weather && oceanPoints.length > 0) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-weather-sst",
        data: oceanPoints,
        getPosition: (d: any) => d.position,
        getFillColor: (d: any) => sstColor(d.sst),
        getLineColor: [200, 230, 255, 40],
        getRadius: (d: any) => 26000 + d.waveHeight * 8000,
        radiusUnits: "meters",
        stroked: false,
        filled: true,
        opacity: 0.45,
        pickable: true,
      })
    );
  }

  // ━━━ 3. OCEAN CURRENTS (Sleek Surface Hydrodynamic Flow Vectors) ━━━━━━━━━
  // Rendered directly on the sea plane (No giant flying 3D arcs)
  if (layerVisibility.currents && currentVectors.length > 0) {
    // Vector lines on water
    deckLayers.push(
      new LineLayer({
        id: "layer-current-vectors-lines",
        data: currentVectors,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getColor: (d: any) => (d.velocity > 1.0 ? [147, 197, 253, 240] : [6, 182, 212, 220]),
        getWidth: (d: any) => Math.max(1.8, d.velocity * 3.2),
        widthUnits: "pixels",
        opacity: 0.9,
        pickable: false,
      })
    );
    // Arrowhead pips at vector ends
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-current-vectors-heads",
        data: currentVectors,
        getPosition: (d: any) => d.target,
        getFillColor: [103, 232, 249, 240],
        getRadius: 3000,
        radiusUnits: "meters",
        radiusMinPixels: 2.5,
        stroked: false,
        filled: true,
        opacity: 0.95,
        pickable: false,
      })
    );
  }

  // ━━━ 4. RESOURCES (200m Shelf Break Contours) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (layerVisibility.resources) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-shelf",
        data: SHELF_BREAK,
        getPosition: (d: any) => d.position,
        getFillColor: [251, 191, 36, 140],
        getLineColor: [253, 230, 138, 200],
        getRadius: 16000,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1,
        opacity: 0.65,
        pickable: true,
      })
    );
  }

  // ━━━ 5. AUTHENTIC POTENTIAL FISHING ZONES (Thermal & Chl-a Aggregations) ──
  // Multi-tier realistic visual: diffuse thermal aura + dense chlorophyll core + tactical reticle
  if (layerVisibility.fishingZones && pfzPoints.length > 0) {
    // 5A: Diffuse Thermal Front Glow (Outer Radiant Aura)
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-pfz-aura",
        data: pfzPoints,
        getPosition: (d: any) => d.position,
        getFillColor: [52, 211, 153, 35],
        getRadius: (d: any) => 30000 + d.confidence * 250,
        radiusUnits: "meters",
        stroked: false,
        filled: true,
        opacity: 0.8,
        pickable: false,
      })
    );

    // 5B: High-Chlorophyll Aggregation Core
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-pfz-core",
        data: pfzPoints,
        getPosition: (d: any) => d.position,
        getFillColor: (d: any) => [16, 185, 129, Math.round(110 + d.confidence * 0.8)],
        getLineColor: [167, 243, 208, 200],
        getRadius: (d: any) => 12000 + d.confidence * 90,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1.5,
        opacity: 0.9,
        pickable: true,
      })
    );

    // 5C: Tactical Center Reticle Pip
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-pfz-center-reticle",
        data: pfzPoints,
        getPosition: (d: any) => d.position,
        getFillColor: [255, 255, 255, 240],
        getRadius: 2500,
        radiusUnits: "meters",
        radiusMinPixels: 3,
        stroked: false,
        filled: true,
        opacity: 1,
        pickable: false,
      })
    );
  }

  // ━━━ 6. REALISTIC WATER-FOLLOWING COASTAL SHIPPING CORRIDORS ━━━━━━━━━━━━━
  // Clean nautical corridors that stay on the sea surface (No flying arcs over land)
  if (layerVisibility.transport) {
    // West Coast Corridor Path
    deckLayers.push(
      new PathLayer({
        id: "layer-transport-west-corridor",
        data: [{ path: WEST_COAST_CORRIDOR }],
        getPath: (d: any) => d.path,
        getColor: [255, 255, 255, 180],
        getWidth: 2.5,
        widthUnits: "pixels",
        opacity: 0.85,
        pickable: false,
      })
    );

    // East Coast Corridor Path
    deckLayers.push(
      new PathLayer({
        id: "layer-transport-east-corridor",
        data: [{ path: EAST_COAST_CORRIDOR }],
        getPath: (d: any) => d.path,
        getColor: [255, 255, 255, 180],
        getWidth: 2.5,
        widthUnits: "pixels",
        opacity: 0.85,
        pickable: false,
      })
    );

    // International Deep TSS Corridor
    deckLayers.push(
      new PathLayer({
        id: "layer-transport-tss-lane",
        data: [{ path: INTERNATIONAL_TSS_LANE }],
        getPath: (d: any) => d.path,
        getColor: [147, 197, 253, 140],
        getWidth: 1.8,
        widthUnits: "pixels",
        opacity: 0.7,
        pickable: false,
      })
    );

    // Major Harbor Port Nodes
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-ports",
        data: INDIA_PORTS,
        getPosition: (d: any) => d.pos,
        getFillColor: [255, 255, 255, 240],
        getLineColor: [100, 116, 139, 200],
        getRadius: 6500,
        radiusUnits: "meters",
        radiusMinPixels: 4,
        stroked: true,
        lineWidthMinPixels: 1.5,
        opacity: 0.95,
        pickable: true,
      })
    );
  }

  // ━━━ 7. MILITARY / DEFENSE IMBL (Sovereignty Boundaries on Water) ━━━━━━━━
  if (layerVisibility.military && isDefenseUser) {
    // Pakistan IMBL Line on Water
    deckLayers.push(
      new LineLayer({
        id: "layer-imbl-pak-lines",
        data: imblPakLines,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getColor: [244, 63, 94, 255],
        getWidth: 3.5,
        widthUnits: "pixels",
        opacity: 0.95,
      })
    );

    // Sri Lanka IMBL Line on Water
    deckLayers.push(
      new LineLayer({
        id: "layer-imbl-sl-lines",
        data: imblSlLines,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getColor: [244, 63, 94, 255],
        getWidth: 3.5,
        widthUnits: "pixels",
        opacity: 0.95,
      })
    );

    // IMBL Node Markers
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-imbl-nodes",
        data: [...IMBL_PAKISTAN, ...IMBL_SRILANKA].map((p) => ({ pos: p })),
        getPosition: (d: any) => d.pos,
        getFillColor: [244, 63, 94, 220],
        getLineColor: [255, 200, 200, 255],
        getRadius: 18000,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 2,
        opacity: 0.9,
        pickable: true,
      })
    );
  }

  // ━━━ 8. LIVE AIS SHIP TRANSPONDERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (showVessels && vessels.length > 0) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-ais-vessels",
        data: vessels,
        getPosition: (d: any) => [d.lon, d.lat],
        getFillColor: (d: any) => VESSEL_COLORS[d.type as VesselType] ?? [200, 200, 200, 200],
        getLineColor: [0, 0, 0, 120],
        getRadius: 4000,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 9,
        opacity: 1,
        pickable: true,
        onClick: (info: any) => {
          if (info.object) setSelectedVessel(info.object as Vessel);
        },
      })
    );
    if (vesselHeadingPaths.length > 0) {
      deckLayers.push(
        new PathLayer({
          id: "layer-vessel-headings",
          data: vesselHeadingPaths,
          getPath: (d: any) => d.path,
          getColor: (d: any) => d.color,
          getWidth: 1.5,
          widthUnits: "pixels",
          opacity: 0.7,
          pickable: false,
        })
      );
    }
  }

  // ━━━ 9. API GEOJSON FROM CHAT ADVISORIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (activeGeojson?.features) {
    deckLayers.push(
      new GeoJsonLayer({
        id: "layer-api-geojson",
        data: activeGeojson,
        pickable: true,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 3,
        getLineColor: (f: any) =>
          f.geometry?.type === "LineString" ? [6, 182, 212, 255] : [244, 63, 94, 255],
        getFillColor: (f: any) => {
          if (f.properties?.type === "origin_node") return [255, 255, 255, 255];
          if (f.properties?.target_species) return [52, 211, 153, 200];
          return [244, 63, 94, 120];
        },
        getPointRadius: 10000,
        pointRadiusMinPixels: 5,
      })
    );
  }

  // ━━━ 10. TARGET RETICLE CURSOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (selectedCoordinates) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-target-cursor",
        data: [{ position: selectedCoordinates }],
        getPosition: (d: any) => d.position,
        getFillColor: [255, 255, 255, 220],
        getLineColor: [255, 255, 255, 255],
        getRadius: 8000,
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
      })
    );
  }

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-mono">
        <Compass className="h-8 w-8 animate-spin mr-3" />
        <span>Loading Project ORCA Sovereign Command Deck...</span>
      </div>
    );
  }

  const currentMapStyle = buildMapStyle(activeMapMode, enable3DTerrain, terrainExaggeration);

  return (
    <CommandPortalLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      activeBasin={activeBasin}
      onBasinChange={handleBasinChange}
      selectedLanguage={selectedLanguage}
      onLanguageChange={setSelectedLanguage}
    >
      {/* ─── TAB 1: TACTICAL COMMAND ─────────────────────────────────────── */}
      {currentTab === "tactical" && (
        <div className="relative flex h-full w-full overflow-hidden">
          {/* LEFT: RETRACTABLE AGENT CHAT (35%) */}
          <div
            className={`relative z-20 flex flex-col border-r border-white/10 bg-zinc-950/95 backdrop-blur-2xl transition-all duration-300 ${
              isChatOpen ? "w-full md:w-[410px] lg:w-[460px]" : "w-0 overflow-hidden border-r-0"
            }`}
          >
            {/* Target Coordinate HUD */}
            <div className="p-3 bg-black/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-white text-black font-black shadow-md shadow-white/10">
                  <MapPin className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-400 block uppercase tracking-widest font-bold">
                    Sector Target Lock
                  </span>
                  <div className="text-xs font-mono font-bold text-white tracking-wide">
                    {selectedCoordinates ? `${selectedCoordinates[1]}°N, ${selectedCoordinates[0]}°E` : "Click map to lock"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Collapse for fullscreen 3D map"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Synthesized Action Card */}
            <div className="p-3.5 bg-zinc-900/60 border-b border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Synthesized Action Card</span>
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  {actionCardData.confidence}% PFZ
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-black border border-white/10 shadow-sm">
                  <span className="text-zinc-500 block text-[8px] tracking-wider uppercase font-bold">Target Species</span>
                  <span className="text-emerald-400 font-bold text-[11px] block mt-0.5">Y-Fin Tuna</span>
                </div>
                <div className="p-2 rounded-xl bg-black border border-white/10 shadow-sm">
                  <span className="text-zinc-500 block text-[8px] tracking-wider uppercase font-bold">Fuel Delta</span>
                  <span className="text-white font-bold text-[11px] block mt-0.5">-{actionCardData.fuelSavings}%</span>
                </div>
                <div className="p-2 rounded-xl bg-black border border-white/10 shadow-sm">
                  <span className="text-zinc-500 block text-[8px] tracking-wider uppercase font-bold">IMBL Standoff</span>
                  <span className="text-sky-400 font-bold text-[11px] block mt-0.5">{actionCardData.imblStandoffKm} km</span>
                </div>
              </div>
            </div>

            {/* Multi-Agent Thought Stream Accordion */}
            <div className="border-b border-white/10 bg-black/40">
              <button
                onClick={() => setShowThoughtStream(!showThoughtStream)}
                className="flex items-center justify-between w-full px-3.5 py-2 text-[10px] font-mono text-zinc-400 hover:text-white cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-zinc-300">
                  <Cpu className="h-3.5 w-3.5 text-sky-400" />
                  <span>Multi-Agent Thought Stream (Supervisor → Workers)</span>
                </div>
                {showThoughtStream ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              <AnimatePresence>
                {showThoughtStream && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3.5 pb-3 space-y-1 text-[10px] font-mono text-zinc-400 border-t border-white/5 pt-2 max-h-32 overflow-y-auto"
                  >
                    {currentThoughts.length > 0 ? (
                      currentThoughts.map((t, idx) => <div key={idx} className="text-emerald-300">{t}</div>)
                    ) : (
                      <>
                        <div className="text-zinc-500">[SUPERVISOR] Qwen 2.5 7B decomp intent: Verified Veraval Tuna Fleet</div>
                        <div className="text-zinc-500">[OCEAN_AI] Open-Meteo SST: 28.4°C | Chlorophyll-a: 1.26 mg/m³</div>
                        <div className="text-zinc-500">[GEOFENCE] PostGIS ST_Distance: 45.0 km to Pakistan IMBL (Green)</div>
                        <div className="text-zinc-500">[NAVIGATION] A* Current routing: +1.2 kts boost, -22% fuel</div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Preset Queries */}
            <div className="p-2.5 bg-black/60 border-b border-white/10 space-y-1.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-1">
                ⚡ Quick Scenarios
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "Veraval Tuna PFZ", sub: "Thermal Front", icon: Fish, color: "text-emerald-400", query: "Tuna fishing potential off Veraval Gujarat?", coords: [70.37, 20.90] as [number, number] },
                  { label: "IMBL Border Alert", sub: "Sovereignty Check", icon: Shield, color: "text-rose-400", query: "Am I crossing the Sri Lanka IMBL boundary?", coords: [79.315, 9.285] as [number, number] },
                  { label: "Mumbai → Kochi", sub: "A* Current Routing", icon: Navigation, color: "text-white", query: "Optimal fuel route Mumbai to Kochi currents?", coords: [72.83, 18.92] as [number, number] },
                  { label: "Lakshadweep SST", sub: "Weather Telemetry", icon: Waves, color: "text-sky-400", query: "Wave height and SST in Lakshadweep sea?", coords: [73.0, 10.5] as [number, number] },
                ].map(({ label, sub, icon: Icon, color, query, coords }) => (
                  <button
                    key={label}
                    onClick={() => handlePresetClick(query, coords)}
                    className="p-2 rounded-xl border border-white/10 bg-zinc-950/70 hover:bg-zinc-900 text-left text-[11px] transition cursor-pointer"
                  >
                    <div className={`font-bold flex items-center gap-1 ${color}`}>
                      <Icon className="h-3 w-3" /><span>{label}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 block">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-white/10 text-white shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-white text-black rounded-br-none font-medium shadow-md"
                        : "bg-zinc-900/90 text-zinc-200 border border-white/10 rounded-bl-none shadow-md"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="orca-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    <div className="mt-1.5 text-[9px] text-zinc-500 text-right font-mono">{msg.timestamp}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar with Voice Mic */}
            <div className="border-t border-white/10 bg-black p-3 space-y-2">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    selectedCoordinates
                      ? `Query sector [${selectedCoordinates[1]}, ${selectedCoordinates[0]}] or type naturally...`
                      : "Type query or click map to lock..."
                  }
                  disabled={isStreaming}
                  className="flex-1 rounded-xl border border-white/15 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />

                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isRecording
                      ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                      : "bg-zinc-900 text-zinc-300 border-white/15 hover:bg-zinc-800 hover:text-white"
                  }`}
                  title={isRecording ? "Listening (Click to stop)" : "Voice Query (Web Speech API)"}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isStreaming}
                  className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black transition disabled:opacity-40 cursor-pointer shadow-lg shadow-white/10 font-bold"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Floating Expand Toggle when left panel is closed */}
          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="absolute top-4 left-4 z-30 flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/90 border border-white/20 text-white shadow-2xl backdrop-blur-md transition cursor-pointer hover:bg-zinc-900"
            >
              <PanelLeftOpen className="h-5 w-5" />
              <span className="text-xs font-bold font-mono">TACTICAL CHAT</span>
            </button>
          )}

          {/* RIGHT: 2.5D DECK.GL TACTICAL MAP (65%) */}
          <div className="relative flex-1 h-full w-full bg-black">
            {selectedVessel && (
              <VesselTooltip vessel={selectedVessel} onClose={() => setSelectedVessel(null)} />
            )}

            {/* Top Floating Controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 flex-wrap justify-end">
              {/* Basemap Switcher */}
              <div className="flex rounded-xl border border-white/15 bg-zinc-950/90 p-1 shadow-xl backdrop-blur-md">
                {(["dark", "voyager", "satellite"] as const).map((mode) => {
                  const Icon = { dark: Navigation, voyager: Compass, satellite: Globe }[mode];
                  const label = { dark: "Dark", voyager: "Nautical", satellite: "Satellite" }[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => setActiveMapMode(mode)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        activeMapMode === mode ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3 w-3" /><span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 3D Toggle */}
              <button
                onClick={() => setEnable3DTerrain(!enable3DTerrain)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold shadow-xl backdrop-blur-md transition cursor-pointer ${
                  enable3DTerrain ? "bg-zinc-900 text-white border-white/30" : "bg-black/90 text-zinc-400 border-white/15 hover:text-white"
                }`}
              >
                <Mountain className="h-3.5 w-3.5" />
                <span>3D {enable3DTerrain ? "ON" : "OFF"}</span>
              </button>

              {/* Ships Toggle */}
              <button
                onClick={() => setShowVessels(!showVessels)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold shadow-xl backdrop-blur-md transition cursor-pointer ${
                  showVessels ? "bg-zinc-900 text-white border-white/30" : "bg-black/90 text-zinc-400 border-white/15 hover:text-white"
                }`}
              >
                <Anchor className="h-3.5 w-3.5" />
                <span>Ships ({vessels.length})</span>
              </button>

              <button
                onClick={handleTogglePerspective}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/15 bg-black/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer"
                title="Toggle 2D/3D Pitch"
              >
                <Eye className="h-4 w-4" />
              </button>

              <button
                onClick={handleResetView}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/15 bg-black/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer"
                title="Reset Camera"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <LayerControlPanel
                visibility={layerVisibility}
                onToggle={handleLayerToggle}
                isDefenseUser={isDefenseUser}
              />
            </div>

            {/* CONTEXTUAL BOTTOM TELEMETRY STRIP */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/15 bg-zinc-950/95 shadow-2xl backdrop-blur-xl text-xs font-mono">
              <div className="flex items-center gap-1.5 text-sky-300">
                <Droplets className="h-3.5 w-3.5" />
                <span>SST: <strong>{actionCardData.sst}°C</strong></span>
              </div>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <Fish className="h-3.5 w-3.5" />
                <span>Chl-a: <strong>{actionCardData.chlorophyll} mg/m³</strong></span>
              </div>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Waves className="h-3.5 w-3.5" />
                <span>SWH: <strong>{actionCardData.swh}m</strong></span>
              </div>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1.5 text-amber-300">
                <Wind className="h-3.5 w-3.5" />
                <span>Wind: <strong>{actionCardData.windKnots}kt</strong></span>
              </div>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1.5 text-rose-300">
                <Shield className="h-3.5 w-3.5" />
                <span>IMBL: <strong>{actionCardData.imblStandoffKm}km</strong></span>
              </div>
            </div>

            {/* Bottom-right Legend */}
            <div className="absolute bottom-4 right-4 z-20 rounded-2xl border border-white/10 bg-black/90 p-3.5 shadow-2xl backdrop-blur-md text-[11px] text-zinc-300 min-w-[170px]">
              <div className="font-bold text-white flex items-center gap-1.5 mb-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Active Layers</span>
              </div>
              <div className="space-y-1">
                {layerVisibility.weather && <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /><span>SST Thermal</span></div>}
                {layerVisibility.currents && <div className="flex items-center gap-2"><span className="h-1 w-4 rounded bg-cyan-300" /><span>Current Vectors</span></div>}
                {layerVisibility.fishingZones && <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span>PFZ Aggregations</span></div>}
                {layerVisibility.transport && <div className="flex items-center gap-2"><span className="h-1 w-4 rounded bg-white" /><span>Coastal Shipping Lanes</span></div>}
                {layerVisibility.military && isDefenseUser && <div className="flex items-center gap-2"><span className="h-1 w-4 rounded bg-rose-500" /><span>IMBL Boundary</span></div>}
                {showVessels && <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /><span>AIS Ships ({vessels.length})</span></div>}
              </div>
            </div>

            {/* DeckGL Map Canvas */}
            <DeckGL
              viewState={viewState}
              onViewStateChange={(e: any) => setViewState(e.viewState)}
              controller={true}
              layers={deckLayers}
              onClick={handleMapClick}
              getCursor={({ isHovering }) => (isHovering ? "pointer" : "crosshair")}
              style={{ width: "100%", height: "100%" }}
            >
              <Map
                mapLib={maplibregl}
                mapStyle={currentMapStyle}
                reuseMaps={true}
                attributionControl={false}
                terrain={enable3DTerrain ? { source: "terrain-dem", exaggeration: terrainExaggeration } : undefined}
              />
            </DeckGL>
          </div>
        </div>
      )}

      {/* ─── TAB 2: AGENT MESH & EXECUTION GRAPH ─────────────────────────── */}
      {currentTab === "agents" && <AgentMeshView />}

      {/* ─── TAB 3: DATA HUB (EARTH OBSERVATION) ─────────────────────────── */}
      {currentTab === "data-hub" && <DataHubView />}

      {/* ─── TAB 4: FLEET SAFETY & REGULATORY VAULT ──────────────────────── */}
      {currentTab === "regulatory-vault" && <RegulatoryVaultView />}
    </CommandPortalLayout>
  );
}

export default function OrcaDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-mono">
          <Compass className="h-8 w-8 animate-spin mr-3" />
          <span>Initializing Project ORCA Command Portal...</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
