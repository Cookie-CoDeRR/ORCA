"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer, LineLayer, PathLayer, ColumnLayer, PolygonLayer, BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
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
  BookOpen,
} from "lucide-react";

import CommandPortalLayout, { PortalTab, UserRole, USER_ROLES } from "@/components/CommandPortalLayout";
import LayerControlPanel, { LayerVisibility } from "@/components/LayerControlPanel";
import AgentMeshView from "@/components/AgentMeshView";
import DataHubView from "@/components/DataHubView";
import RegulatoryVaultView from "@/components/RegulatoryVaultView";
import { fetchOceanData, OceanDataResult } from "@/lib/oceanDataService";
import { buildGraticuleLines } from "@/lib/graticuleLayer";
import {
  connectAisStream,
  tickSimVessels,
  generateSimVessels,
  Vessel,
  VesselType,
  computeClientColregs,
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
  { name: "Kochi",     pos: [76.26, 9.93] },
  { name: "Tuticorin", pos: [78.13, 8.76] },
  { name: "Chennai",   pos: [80.27, 13.08] },
  { name: "Vizag",     pos: [83.21, 17.68] },
  { name: "Paradip",   pos: [86.60, 20.26] },
  { name: "Kolkata",   pos: [88.36, 22.57] },
  { name: "Port Blair", pos: [92.74, 11.62] },
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

function VesselTooltip({
  vessel,
  onClose,
  ownShipCoords,
}: {
  vessel: Vessel;
  onClose: () => void;
  ownShipCoords: [number, number] | null;
}) {
  const typeLabel: Record<VesselType, string> = {
    cargo: "Cargo Vessel",
    tanker: "Oil/Gas Tanker",
    fishing: "Fishing Vessel",
    military: "Naval / Patrol",
    passenger: "Passenger Ferry",
    sailing: "Sailing Vessel",
    tug: "Tugboat",
    unknown: "Unknown Vessel",
  };

  const colregs = ownShipCoords
    ? computeClientColregs(ownShipCoords[1], ownShipCoords[0], 10.0, 0.0, vessel)
    : null;

  const isCritical =
    vessel.risk_level === "CRITICAL_RISK" ||
    (colregs && colregs.risk_level === "CRITICAL_RISK");
  const isCaution =
    vessel.risk_level === "CAUTION" ||
    (colregs && colregs.risk_level === "CAUTION");

  const color = isCritical
    ? [239, 68, 68]
    : isCaution
    ? [245, 158, 11]
    : VESSEL_COLORS[vessel.type] || [200, 200, 200];
  const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-80 rounded-2xl border border-white/20 bg-zinc-950/98 shadow-2xl backdrop-blur-2xl overflow-hidden font-mono">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60">
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${isCritical ? "animate-ping" : ""}`}
            style={{ backgroundColor: cssColor }}
          />
          <span className="text-xs font-bold text-white truncate">
            {vessel.name || "Unknown Vessel"}
          </span>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Collision Risk Indicator Bar */}
      {(isCritical || isCaution) && (
        <div
          className={`px-4 py-2 border-b flex items-center justify-between text-[10px] font-bold ${
            isCritical
              ? "bg-rose-950/80 border-rose-500/40 text-rose-300"
              : "bg-amber-950/80 border-amber-500/40 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{isCritical ? "CRITICAL COLLISION RISK" : "CAUTION CONVERGING"}</span>
          </div>
          <span>
            CRI: {vessel.collision_risk_index ?? colregs?.collision_risk_index ?? 0.82}
          </span>
        </div>
      )}

      <div className="px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
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
        <div className="text-white">{vessel.flag ?? "IND"}</div>

        {/* CPA / TCPA Metrics */}
        <div className="text-zinc-400">CPA Distance</div>
        <div className={`font-bold ${isCritical ? "text-rose-400 font-black" : "text-sky-300"}`}>
          {vessel.cpa_nm ?? colregs?.cpa_nm ?? "—"} NM
        </div>
        <div className="text-zinc-400">Time to CPA</div>
        <div className="text-white font-semibold">
          {vessel.tcpa_minutes ?? colregs?.tcpa_minutes ?? "—"} min
        </div>
      </div>

      {/* IMO COLREGs Rule & Recommended Action */}
      <div className="px-4 py-2.5 border-t border-white/10 bg-zinc-900/80 text-[10px] space-y-1.5">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="font-bold text-zinc-300">COLREGs Rule:</span>
          <span className="font-bold text-sky-400">
            {vessel.colregs_rule ?? colregs?.colregs_rule ?? "Rule 8 Safe Clearance"}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-black/70 border border-white/10 text-zinc-200 text-[10px] leading-relaxed">
          {vessel.recommended_action ??
            colregs?.recommended_action ??
            "Maintain navigational watch. Clear water ahead."}
        </div>
      </div>

      <div className="px-4 py-2 border-t border-white/10 text-[9px] font-mono text-zinc-500 flex justify-between">
        <span>AIS · AISStream.io</span>
        <span>Auto-COLREGs Engine</span>
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Role / Auth Check
  const roleParam = searchParams.get("role");
  const isDefenseUser = roleParam === "defense" || roleParam === "admin";

  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState<PortalTab>("tactical");
  const [activeBasin, setActiveBasin] = useState("arabian_sea");
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [userRole, setUserRole] = useState<UserRole>("navigator");
  const [chatMode, setChatMode] = useState<"conversational" | "report">("conversational");

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
  const [vessels, setVessels] = useState<Vessel[]>(() => generateSimVessels());
  const [aisConnected, setAisConnected] = useState(false);
  const [showVessels, setShowVessels] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const graticuleLines = useMemo(() => buildGraticuleLines(), []);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleLayerToggle = (id: keyof LayerVisibility) => {
    if (id === "military" && !isDefenseUser) return;
    setLayerVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetView = () =>
    setViewState({ longitude: 70.368, latitude: 20.902, zoom: 6.2, pitch: 45, bearing: 10 });

  const handleTogglePerspective = () =>
    setViewState((prev) => ({
      ...prev,
      pitch: prev.pitch > 20 ? 0 : 45,
      bearing: prev.pitch > 20 ? 0 : 10,
    }));

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

    const langCodes: Record<string, string> = {
      EN: "en-IN",
      HI: "hi-IN",
      GU: "gu-IN",
      TA: "ta-IN",
      ML: "ml-IN",
      TE: "te-IN",
      BN: "bn-IN",
    };

    recognition.lang = langCodes[selectedLanguage] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsRecording(false);
      // Auto-submit recognized speech query
      setTimeout(() => {
        handleSubmit(undefined, transcript);
      }, 300);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // ─── Initialize session & fetch data ───────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const sid = `orca-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setThreadId(sid);

    async function loadData() {
      setIsLoadingData(true);
      try {
        const data = await fetchOceanData();
        setRealOceanData(data);
      } catch (err: any) {
        setDataError(err?.message ?? "Failed to fetch marine data");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  // ─── Live AIS or simulation ────────────────────────────────────────────────
  useEffect(() => {
    let wsCleanup: (() => void) | null = null;
    const apiKey = process.env.NEXT_PUBLIC_AIS_API_KEY;

    if (apiKey) {
      wsCleanup = connectAisStream(
        apiKey,
        (vesselMap) => {
          setVessels(Array.from(vesselMap.values()));
          setAisConnected(true);
        },
        () => {
          setAisConnected(false);
        }
      );
    } else {
      setVessels(tickSimVessels(0));
      setAisConnected(true);
      simTimerRef.current = setInterval(() => {
        setVessels(tickSimVessels(10));
      }, 4000);
    }

    return () => {
      if (wsCleanup) wsCleanup();
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThoughts]);

  // Interactive DeckGL Tooltip on Hover for PFZ clusters and AIS vessels
  const getMapTooltip = (info: any) => {
    if (!info.object) return null;
    const obj = info.object;
    const layerId = info.layer?.id;

    // 1. PFZ Fishing Cluster Tooltip
    if (layerId?.startsWith("layer-pfz")) {
      const speciesList = obj.speciesList || [];
      const speciesBadges = speciesList
        .map(
          (sp: any) => `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div>
              <strong style="color:#ffffff; font-size:11px;">${sp.name}</strong>
              <span style="color:#94a3b8; font-size:9px; font-style:italic; margin-left:4px;">(${sp.sciName})</span>
            </div>
            <span style="color:#34d399; font-weight:700; font-size:10px; font-family:monospace; background:rgba(6,78,59,0.7); border:1px solid rgba(52,211,153,0.3); padding:1px 5px; border-radius:4px;">
              ${sp.confidence}% Catch
            </span>
          </div>`
        )
        .join("");

      return {
        html: `
          <div style="background:#090d16; color:#f1f5f9; padding:12px 14px; border-radius:10px; border:1px solid #1e293b; box-shadow:0 12px 30px -5px rgba(0,0,0,0.9); font-family:system-ui, sans-serif; min-width:280px; max-width:330px; pointer-events:none;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:15px;">🐟</span>
                <div>
                  <div style="font-weight:700; font-size:12px; color:#ffffff;">${obj.name || "Potential Fishing Zone"}</div>
                  <div style="font-size:9px; color:#64748b; font-family:monospace;">[${obj.position[1]}°N, ${obj.position[0]}°E] • ${obj.zone === "bay_of_bengal" ? "Bay of Bengal" : "Arabian Sea"}</div>
                </div>
              </div>
              <span style="background:#064e3b; color:#34d399; font-size:10px; font-weight:700; font-family:monospace; padding:2px 6px; border-radius:4px; border:1px solid #059669; white-space:nowrap;">
                ${obj.confidence}% PFZ
              </span>
            </div>

            <div style="margin-bottom:8px;">
              <div style="font-size:9px; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700; margin-bottom:2px;">Target Species In This Area:</div>
              ${speciesBadges || `<div style="font-size:11px; color:#ffffff; font-weight:600;">${obj.species}</div>`}
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; background:#0f172a; padding:6px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); font-family:monospace; font-size:10px; margin-bottom:8px;">
              <div><span style="color:#64748b;">SST (Temp):</span> <strong style="color:#38bdf8;">${obj.sst}°C</strong></div>
              <div><span style="color:#64748b;">Chlorophyll:</span> <strong style="color:#34d399;">${obj.chlorophyll || 1.25} mg/m³</strong></div>
              <div><span style="color:#64748b;">Wave (Hs):</span> <strong style="color:#e2e8f0;">${obj.waveHeight || 1.4} m</strong></div>
              <div><span style="color:#64748b;">Thermal Front:</span> <strong style="color:#f59e0b;">∇ ${obj.thermalGradient || "0.82°C/km"}</strong></div>
            </div>

            <div style="font-size:10px; color:#94a3b8; line-height:1.3; background:rgba(59,130,246,0.08); padding:5px 7px; border-radius:4px; border-left:2px solid #38bdf8;">
              <strong style="color:#e2e8f0;">⏰ Feeding Window:</strong> ${obj.feedingWindow || "Dawn (04:30 – 07:30 IST) & Dusk (17:30 – 20:30 IST)"}
              <div style="color:#64748b; font-size:9px; margin-top:2px;">📍 ~${obj.distanceOffshoreKm || 28} km offshore • Depth: ~${obj.depthMeters || 60}m</div>
            </div>
            
            <div style="font-size:9px; color:#38bdf8; text-align:center; margin-top:6px; font-weight:600;">
              🖱 Click to lock sector & calculate optimal route
            </div>
          </div>
        `,
      };
    }

    // 2. AIS Vessel Tooltip
    if (layerId?.startsWith("layer-ais") || obj.mmsi) {
      return {
        html: `
          <div style="background:#090d16; color:#f1f5f9; padding:10px 12px; border-radius:8px; border:1px solid #1e293b; font-family:monospace; font-size:11px; max-width:260px; pointer-events:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px; margin-bottom:6px;">
              <strong style="color:#38bdf8; font-size:12px;">🚢 ${obj.name || "VESSEL"}</strong>
              <span style="color:#94a3b8; font-size:9px;">MMSI: ${obj.mmsi}</span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:10px;">
              <div><span style="color:#64748b;">Speed (SOG):</span> <strong style="color:#ffffff;">${obj.sog} kts</strong></div>
              <div><span style="color:#64748b;">Course (COG):</span> <strong style="color:#ffffff;">${obj.cog}°</strong></div>
              <div><span style="color:#64748b;">Type:</span> <strong style="color:#34d399;">${obj.type}</strong></div>
              <div><span style="color:#64748b;">Flag:</span> <strong style="color:#ffffff;">${obj.flag || "IND"}</strong></div>
            </div>
          </div>
        `,
      };
    }

    return null;
  };

  // Map Click
  const handleMapClick = (info: any) => {
    // 1. If clicked directly on a PFZ point, select it and update telemetry immediately
    if (info.object && (info.layer?.id?.startsWith("layer-pfz") || info.object.speciesList)) {
      const pfz = info.object;
      const [lon, lat] = pfz.position;
      setSelectedCoordinates([lon, lat]);
      setActionCardData((prev) => ({
        ...prev,
        sst: pfz.sst,
        chlorophyll: pfz.chlorophyll || 1.25,
        swh: pfz.waveHeight || 1.4,
        confidence: pfz.confidence || 88,
        imblStandoffKm: parseFloat((25 + Math.abs(lat - 22.5) * 15).toFixed(1)),
      }));
      return;
    }

    // 2. Standard map click
    if (info.coordinate) {
      const [lon, lat] = info.coordinate;
      const roundedLon = parseFloat(lon.toFixed(4));
      const roundedLat = parseFloat(lat.toFixed(4));
      setSelectedCoordinates([roundedLon, roundedLat]);

      // Telemetry lookup
      if (realOceanData?.weatherPoints) {
        const closest = realOceanData.weatherPoints.reduce((best, pt) => {
          const d = Math.hypot(pt.position[0] - lon, pt.position[1] - lat);
          return !best || d < best.d ? { pt, d } : best;
        }, null as any);

        if (closest?.pt) {
          setActionCardData((prev) => ({
            ...prev,
            sst: closest.pt.sst,
            chlorophyll: parseFloat((0.8 + Math.sin(lat) * 0.5).toFixed(2)),
            swh: closest.pt.waveHeight,
            windKnots: closest.pt.windSpeed,
            imblStandoffKm: parseFloat((25 + Math.abs(lat - 22.5) * 15).toFixed(1)),
          }));
        }
      }
    }
  };

  const handlePresetClick = (query: string, coords: [number, number]) => {
    setSelectedCoordinates([coords[0], coords[1]]);
    setInputMessage(query);
    setViewState({ longitude: coords[0], latitude: coords[1], zoom: 7.0, pitch: 45, bearing: 10 });
  };

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string, overrideFormatMode?: "conversational" | "report") => {
    if (e) e.preventDefault();
    const query = (customQuery || inputMessage).trim();
    if (!query || isStreaming) return;

    const modeToSend = overrideFormatMode || chatMode;

    const targetCoords = selectedCoordinates
      ? [selectedCoordinates[1], selectedCoordinates[0]]
      : [viewState.latitude, viewState.longitude];

    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputMessage("");
    setIsStreaming(true);
    setCurrentThoughts([`[SUPERVISOR] Routing for persona: ${userRole.toUpperCase()} | Format: ${modeToSend.toUpperCase()}...`]);

    const assistantId = uuidv4();
    let acc = "";

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          thread_id: threadId,
          user_role: userRole,
          format_mode: modeToSend,
          active_basin: activeBasin,
          target_coordinates: targetCoords,
        }),
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
          body: JSON.stringify({
            message: query,
            thread_id: threadId,
            user_role: userRole,
            format_mode: modeToSend,
            active_basin: activeBasin,
            target_coordinates: targetCoords,
          }),
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

  // True compass heading vector & directional chevron
  const vesselHeadingPaths = vessels
    .filter((v) => v.sog > 0.5)
    .map((v) => {
      const cogRad = (v.cog * Math.PI) / 180;
      const len = Math.max(0.06, Math.min(0.20, (v.sog / 20) * 0.15));
      const latCos = Math.cos((v.lat * Math.PI) / 180) || 1.0;
      const dLon = (len * Math.sin(cogRad)) / latCos;
      const dLat = len * Math.cos(cogRad);
      const endLon = v.lon + dLon;
      const endLat = v.lat + dLat;

      // Chevron wings
      const wingLen = len * 0.35;
      const wingAngle1 = cogRad + (145 * Math.PI) / 180;
      const wingAngle2 = cogRad - (145 * Math.PI) / 180;
      const w1Lon = endLon + (wingLen * Math.sin(wingAngle1)) / latCos;
      const w1Lat = endLat + wingLen * Math.cos(wingAngle1);
      const w2Lon = endLon + (wingLen * Math.sin(wingAngle2)) / latCos;
      const w2Lat = endLat + wingLen * Math.cos(wingAngle2);

      const isCriticalRisk =
        v.risk_level === "CRITICAL_RISK" ||
        (selectedCoordinates &&
          computeClientColregs(selectedCoordinates[1], selectedCoordinates[0], 10.0, 0.0, v).risk_level === "CRITICAL_RISK");
      const isCaution =
        v.risk_level === "CAUTION" ||
        (selectedCoordinates &&
          computeClientColregs(selectedCoordinates[1], selectedCoordinates[0], 10.0, 0.0, v).risk_level === "CAUTION");

      const headingColor = isCriticalRisk
        ? [239, 68, 68, 255]
        : isCaution
        ? [245, 158, 11, 230]
        : VESSEL_COLORS[v.type] || [255, 255, 255, 220];

      return {
        path: [
          [v.lon, v.lat],
          [endLon, endLat],
          [w1Lon, w1Lat],
          [endLon, endLat],
          [w2Lon, w2Lat],
        ] as [number, number][],
        color: headingColor,
      };
    });

  const deckLayers: any[] = [];

  // ━━━ 1. REAL NASA GIBS SEA SURFACE TEMPERATURE (Continuous Raster TileLayer) ──
  // Consumes high-resolution GHRSST L4 MUR global sea surface temperature imagery
  if (layerVisibility.weather) {
    deckLayers.push(
      new TileLayer({
        id: "layer-nasa-gibs-sst",
        data: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/2024-05-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
        minZoom: 0,
        maxZoom: 7,
        tileSize: 256,
        opacity: 0.55,
        renderSubLayers: (props: any) => {
          const { boundingBox } = props.tile;
          return new BitmapLayer(props, {
            data: undefined,
            image: props.data,
            bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
          });
        },
      })
    );
  }

  // ━━━ 2. TACTICAL GRATICULE MESH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  // ━━━ 5. POTENTIAL FISHING ZONES (3D Extruded ColumnLayer & Interactive Reticles)
  // Distinct 3D columns with elevation proportional to fish catch probability
  if (layerVisibility.fishingZones && pfzPoints.length > 0) {
    // 5A: Radiant Ground Base Halo
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-pfz-base-halo",
        data: pfzPoints,
        getPosition: (d: any) => d.position,
        getFillColor: [16, 185, 129, 35],
        getLineColor: [52, 211, 153, 200],
        getRadius: (d: any) => 9000 + (d.confidence || 75) * 40,
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1.5,
        opacity: 0.85,
        pickable: true,
      })
    );

    // 5B: 3D Extruded Elevation Column
    deckLayers.push(
      new ColumnLayer({
        id: "layer-pfz-3d-columns",
        data: pfzPoints,
        getPosition: (d: any) => d.position,
        getFillColor: (d: any) => [16, 185, 129, Math.round(140 + (d.confidence || 75) * 1.1)],
        getLineColor: [167, 243, 208, 255],
        getElevation: (d: any) => (d.confidence || 75) * 450,
        radius: 4500,
        elevationScale: 1,
        stroked: true,
        filled: true,
        extruded: true,
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
        getFillColor: [255, 255, 255, 250],
        getRadius: 1000,
        radiusUnits: "meters",
        radiusMinPixels: 3.5,
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

  // ━━━ 8. LIVE AIS SHIP TRANSPONDERS & COLREGS RADAR ━━━━━━━━━━━━━━━━━━━━━━━
  if (showVessels && vessels.length > 0) {
    // 8A. Collision Hazard Domains (Pulsing Red Outer Danger Ring)
    const riskVessels = vessels.filter((v) => {
      if (v.risk_level === "CRITICAL_RISK") return true;
      if (selectedCoordinates) {
        const c = computeClientColregs(selectedCoordinates[1], selectedCoordinates[0], 10.0, 0.0, v);
        return c.risk_level === "CRITICAL_RISK";
      }
      return false;
    });

    if (riskVessels.length > 0) {
      deckLayers.push(
        new ScatterplotLayer({
          id: "layer-ais-risk-halos",
          data: riskVessels,
          getPosition: (d: any) => [d.lon, d.lat],
          getFillColor: [239, 68, 68, 45],
          getLineColor: [239, 68, 68, 240],
          getRadius: 18000,
          radiusUnits: "meters",
          stroked: true,
          lineWidthMinPixels: 2,
          opacity: 0.9,
          pickable: false,
        })
      );
    }

    // 8B. Core Vessel Hull Glyphs
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-ais-vessels",
        data: vessels,
        getPosition: (d: any) => [d.lon, d.lat],
        getFillColor: (d: any) => {
          if (d.risk_level === "CRITICAL_RISK") return [239, 68, 68, 255];
          if (selectedCoordinates) {
            const c = computeClientColregs(selectedCoordinates[1], selectedCoordinates[0], 10.0, 0.0, d);
            if (c.risk_level === "CRITICAL_RISK") return [239, 68, 68, 255];
            if (c.risk_level === "CAUTION") return [245, 158, 11, 240];
          }
          return VESSEL_COLORS[d.type as VesselType] ?? [200, 200, 200, 200];
        },
        getLineColor: [0, 0, 0, 160],
        getRadius: 4500,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1.5,
        radiusMinPixels: 4,
        radiusMaxPixels: 10,
        opacity: 1,
        pickable: true,
        onClick: (info: any) => {
          if (info.object) setSelectedVessel(info.object as Vessel);
        },
      })
    );

    // 8C. Directional COG Course Vectors & Chevron Wings
    if (vesselHeadingPaths.length > 0) {
      deckLayers.push(
        new PathLayer({
          id: "layer-vessel-headings",
          data: vesselHeadingPaths,
          getPath: (d: any) => d.path,
          getColor: (d: any) => d.color,
          getWidth: 2.0,
          widthUnits: "pixels",
          opacity: 0.9,
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
      userRole={userRole}
      onRoleChange={setUserRole}
    >
      {/* ─── TAB 1: TACTICAL COMMAND ─────────────────────────────────────── */}
      {currentTab === "tactical" && (
        <div className="relative flex h-full w-full overflow-hidden">
          {/* LEFT: RETRACTABLE AGENT CHAT (CLEAN HIGH-READABILITY INTERFACE) */}
          <div
            className={`relative z-20 flex flex-col border-r border-white/10 bg-zinc-950 backdrop-blur-2xl transition-all duration-300 ${
              isChatOpen ? "w-full md:w-[420px] lg:w-[470px]" : "w-0 overflow-hidden border-r-0"
            }`}
          >
            {/* Clean Header Bar */}
            <div className="px-4 py-3 bg-zinc-950 border-b border-white/10 flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black font-black shadow-md shadow-white/10">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      ORCA Tactical Assistant
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10">
                      {USER_ROLES.find((r) => r.id === userRole)?.label.split(" ")[0]}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
                    {selectedCoordinates ? (
                      <span className="text-sky-300 font-semibold">
                        Sector: {selectedCoordinates[1]}°N, {selectedCoordinates[0]}°E
                      </span>
                    ) : (
                      <span className="text-zinc-500">No Sector Locked (Click Map)</span>
                    )}
                    {selectedCoordinates && (
                      <button
                        onClick={() => setSelectedCoordinates(null)}
                        className="text-zinc-500 hover:text-white text-[9px] underline ml-1 cursor-pointer"
                        title="Clear Sector Target"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                    title="Clear Conversation History"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Collapse for Full Map View"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Unobtrusive Swarm Execution Accordion */}
            <div className="px-3.5 py-1.5 bg-black/60 border-b border-white/5 flex items-center justify-between text-[10px] font-mono">
              <button
                onClick={() => setShowThoughtStream(!showThoughtStream)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <Cpu className="h-3 w-3 text-sky-400" />
                <span>Multi-Agent Swarm Telemetry</span>
                {isStreaming && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
              </button>
              <button
                onClick={() => setShowThoughtStream(!showThoughtStream)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showThoughtStream ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            <AnimatePresence>
              {showThoughtStream && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3.5 py-2 space-y-1 text-[10px] font-mono text-zinc-400 bg-zinc-950/90 border-b border-white/10 max-h-28 overflow-y-auto"
                >
                  {currentThoughts.length > 0 ? (
                    currentThoughts.map((t, idx) => (
                      <div key={idx} className="text-emerald-300">{t}</div>
                    ))
                  ) : (
                    <div className="text-zinc-500">
                      [SUPERVISOR] Swarm ready · Persona: {userRole.toUpperCase()} · Basin: {activeBasin}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages / Welcome Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-center space-y-4 my-auto py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 text-white shadow-xl">
                    <Bot className="h-6 w-6 text-zinc-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Sovereign Maritime Intelligence Assistant
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                      Ask about ocean currents, fishery aggregation zones, collision hazards, or coastal safety regulations.
                    </p>
                  </div>

                  {/* Quick Suggested Scenarios */}
                  <div className="w-full space-y-2 pt-3 text-left">
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-1">
                      ⚡ Quick Scenarios
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Veraval Tuna PFZ", sub: "Thermal Front", icon: Fish, color: "text-emerald-400", query: "Tuna fishing potential off Veraval Gujarat?", coords: [70.37, 20.90] as [number, number] },
                        { label: "IMBL Border Alert", sub: "Sovereignty Check", icon: Shield, color: "text-rose-400", query: "Am I crossing the Sri Lanka IMBL boundary?", coords: [79.315, 9.285] as [number, number] },
                        { label: "Mumbai → Kochi", sub: "A* Current Routing", icon: Navigation, color: "text-white", query: "Optimal fuel route Mumbai to Kochi currents?", coords: [72.83, 18.92] as [number, number] },
                        { label: "Lakshadweep SST", sub: "Weather Telemetry", icon: Waves, color: "text-sky-400", query: "Wave height and SST in Lakshadweep sea?", coords: [73.0, 10.5] as [number, number] },
                      ].map(({ label, sub, icon: Icon, color, query, coords }) => (
                        <button
                          key={label}
                          onClick={() => handlePresetClick(query, coords)}
                          className="p-2.5 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <div className={`font-bold flex items-center gap-1.5 text-xs ${color}`}>
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{label}</span>
                          </div>
                          <span className="text-[9px] text-zinc-400 block mt-0.5 truncate">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
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
                        <div>
                          <div className="orca-markdown">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                          {/* Quick Action: Generate Formal Report */}
                          {!msg.content.includes("Formal Maritime Operational Advisory Report") && (
                            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                              <button
                                onClick={() =>
                                  handleSubmit(
                                    undefined,
                                    `Generate a full formal operational advisory report for sector ${
                                      selectedCoordinates
                                        ? `[${selectedCoordinates[1]}°N, ${selectedCoordinates[0]}°E]`
                                        : activeBasin
                                    }.`,
                                    "report"
                                  )
                                }
                                disabled={isStreaming}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/15 text-[10px] font-mono transition cursor-pointer"
                                title="Compile comprehensive formal multi-agent briefing"
                              >
                                <BookOpen className="h-3 w-3 text-sky-400" />
                                <span>📑 Generate Full Advisory Report</span>
                              </button>
                            </div>
                          )}
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
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar with Output Style Toggle & Voice Mic */}
            <div className="border-t border-white/10 bg-black p-3 space-y-2 select-none">
              {/* Output Style Toggle */}
              <div className="flex items-center justify-between px-1 text-[10px] font-mono">
                <span className="text-zinc-500 uppercase tracking-wider text-[9px] font-bold">Response Format:</span>
                <div className="flex items-center rounded-lg border border-white/10 bg-zinc-950 p-0.5">
                  <button
                    type="button"
                    onClick={() => setChatMode("conversational")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer text-[10px] ${
                      chatMode === "conversational"
                        ? "bg-white text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    💬 Direct Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatMode("report")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer text-[10px] ${
                      chatMode === "report"
                        ? "bg-white text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    📑 Formal Report
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    selectedCoordinates
                      ? `Query sector [${selectedCoordinates[1]}°N, ${selectedCoordinates[0]}°E]...`
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
              <VesselTooltip
                vessel={selectedVessel}
                onClose={() => setSelectedVessel(null)}
                ownShipCoords={selectedCoordinates}
              />
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
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                        activeMapMode === mode
                          ? "bg-white text-black font-bold shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 3D Bathymetry Toggle */}
              <button
                onClick={() => setEnable3DTerrain(!enable3DTerrain)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition cursor-pointer shadow-xl backdrop-blur-md ${
                  enable3DTerrain
                    ? "bg-white text-black font-bold border-white"
                    : "bg-black/90 text-zinc-400 border-white/15 hover:text-white"
                }`}
                title="Toggle 3D Bathymetry & Terrain"
              >
                <Mountain className="h-3.5 w-3.5" />
                <span>3D {enable3DTerrain ? "ON" : "OFF"}</span>
              </button>

              {/* AIS Vessel Toggle Button */}
              <button
                onClick={() => setShowVessels(!showVessels)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition cursor-pointer shadow-xl backdrop-blur-md ${
                  showVessels
                    ? "bg-zinc-900 text-cyan-300 border-cyan-500/40 font-bold"
                    : "bg-black/90 text-zinc-400 border-white/15 hover:text-white"
                }`}
                title="Toggle AIS Vessel Feed"
              >
                <Anchor className="h-3.5 w-3.5" />
                <span>Ships ({vessels.length})</span>
                {aisConnected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>

              {/* Quick Preset Fly-to */}
              <button
                onClick={() => {
                  setViewState({ longitude: 70.368, latitude: 20.902, zoom: 7.2, pitch: 45, bearing: 10 });
                  setSelectedCoordinates([70.368, 20.902]);
                }}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/15 bg-black/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer"
                title="Focus Veraval Sector"
              >
                <Eye className="h-4 w-4" />
              </button>

              <button
                onClick={() => setViewState({ longitude: 72.83, latitude: 18.92, zoom: 6.5, pitch: 40, bearing: 0 })}
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

            {/* CONTEXTUAL BOTTOM TELEMETRY STRIP (ROLE & LOCATION SPECIFIC) */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-xl text-xs font-mono select-none border-t border-slate-700/60">
              {!selectedCoordinates ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
                  <span className="text-[11px]">Select a point on map to inspect real-time sector ocean telemetry</span>
                </div>
              ) : userRole === "researcher" ? (
                // 🔬 Scientific Research Parameters
                <>
                  <div className="flex items-center gap-1.5 text-sky-300">
                    <Droplets className="h-3.5 w-3.5" />
                    <span>Ts: <strong>{actionCardData.sst}°C</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <Fish className="h-3.5 w-3.5" />
                    <span>Chl-a: <strong>{actionCardData.chlorophyll} mg/m³</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Waves className="h-3.5 w-3.5" />
                    <span>Hs: <strong>{actionCardData.swh}m</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Wind className="h-3.5 w-3.5" />
                    <span>∇SST: <strong>0.82°C/km</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-indigo-300">
                    <Globe className="h-3.5 w-3.5" />
                    <span>U10: <strong>{actionCardData.windKnots}kt</strong></span>
                  </div>
                </>
              ) : userRole === "defense" ? (
                // 🛡️ Sovereign Defense & Coast Guard Parameters
                <>
                  <div className="flex items-center gap-1.5 text-rose-300">
                    <Shield className="h-3.5 w-3.5" />
                    <span>IMBL Standoff: <strong>{Math.round(actionCardData.imblStandoffKm / 1.852)} NM</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Navigation className="h-3.5 w-3.5" />
                    <span>EEZ: <strong>Sovereign Waters</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Radio className="h-3.5 w-3.5" />
                    <span>AIS Contacts: <strong>{vessels.length} Tracked</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <Waves className="h-3.5 w-3.5" />
                    <span>Sea State: <strong>Code {actionCardData.swh > 2 ? 4 : 3} ({actionCardData.swh}m)</strong></span>
                  </div>
                </>
              ) : userRole === "student" ? (
                // 🎓 Educational Ocean Learner Parameters
                <>
                  <div className="flex items-center gap-1.5 text-sky-300">
                    <Droplets className="h-3.5 w-3.5" />
                    <span>Water Temp: <strong>{actionCardData.sst}°C (Tropical)</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Waves className="h-3.5 w-3.5" />
                    <span>Waves: <strong>{actionCardData.swh}m (Mild)</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <Fish className="h-3.5 w-3.5" />
                    <span>Plankton Density: <strong>{actionCardData.chlorophyll} mg/m³</strong></span>
                  </div>
                </>
              ) : (
                // 🧭 Navigator & Commercial Fishery Parameters
                <>
                  <div className="flex items-center gap-1.5 text-sky-300">
                    <Droplets className="h-3.5 w-3.5" />
                    <span>SST: <strong>{actionCardData.sst}°C</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <Fish className="h-3.5 w-3.5" />
                    <span>PFZ Catch: <strong>{actionCardData.confidence}% (Tuna)</strong></span>
                  </div>
                  <span className="text-zinc-700">|</span>
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Waves className="h-3.5 w-3.5" />
                    <span>Sea State: <strong>{actionCardData.swh > 2.0 ? "Rough" : "Operable"} ({actionCardData.swh}m)</strong></span>
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
                </>
              )}
            </div>

            {/* Bottom-right Active Layers Legend (True Dynamic Active Layers Only) */}
            <div className="absolute bottom-4 right-4 z-20 rounded-2xl border border-white/10 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur-md text-[11px] text-zinc-300 min-w-[190px] select-none">
              <div className="font-bold text-white flex items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-sky-400" />
                  <span>Active Layers</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                  {[
                    layerVisibility.weather,
                    layerVisibility.currents,
                    layerVisibility.fishingZones,
                    layerVisibility.transport,
                    layerVisibility.resources,
                    layerVisibility.military && isDefenseUser,
                    showVessels,
                  ].filter(Boolean).length}{" "}
                  ON
                </span>
              </div>

              <div className="space-y-1.5">
                {layerVisibility.weather && (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    <span className="text-zinc-200">SST Thermal Field</span>
                  </div>
                )}
                {layerVisibility.currents && (
                  <div className="flex items-center gap-2">
                    <span className="h-1 w-3.5 rounded bg-cyan-300" />
                    <span className="text-zinc-200">Current Flow Vectors</span>
                  </div>
                )}
                {layerVisibility.fishingZones && (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-zinc-200">PFZ Aggregations ({pfzPoints.length})</span>
                  </div>
                )}
                {layerVisibility.transport && (
                  <div className="flex items-center gap-2">
                    <span className="h-1 w-3.5 rounded bg-white" />
                    <span className="text-zinc-200">Shipping Lanes & TSS</span>
                  </div>
                )}
                {layerVisibility.resources && (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full border border-amber-400" />
                    <span className="text-zinc-200">200m Shelf Break</span>
                  </div>
                )}
                {layerVisibility.military && isDefenseUser && (
                  <div className="flex items-center gap-2">
                    <span className="h-1 w-3.5 rounded bg-rose-500" />
                    <span className="text-zinc-200">IMBL Sovereignty Line</span>
                  </div>
                )}
                {showVessels && (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="text-zinc-200">AIS Ships ({vessels.length})</span>
                  </div>
                )}
                {![
                  layerVisibility.weather,
                  layerVisibility.currents,
                  layerVisibility.fishingZones,
                  layerVisibility.transport,
                  layerVisibility.resources,
                  layerVisibility.military && isDefenseUser,
                  showVessels,
                ].some(Boolean) && (
                  <div className="text-[10px] text-zinc-500 italic py-1">
                    No active overlays (Enable via Layers menu)
                  </div>
                )}
              </div>
            </div>

            {/* DeckGL Map Canvas */}
            <DeckGL
              viewState={viewState}
              onViewStateChange={(e: any) => setViewState(e.viewState)}
              controller={true}
              layers={deckLayers}
              onClick={handleMapClick}
              getTooltip={getMapTooltip}
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
