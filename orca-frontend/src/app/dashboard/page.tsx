"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer, ArcLayer, LineLayer, PathLayer } from "@deck.gl/layers";
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
} from "lucide-react";
import LayerControlPanel, { LayerVisibility } from "@/components/LayerControlPanel";
import { fetchOceanData, OceanDataResult } from "@/lib/oceanDataService";
import { buildGraticuleLines } from "@/lib/graticuleLayer";
import {
  connectAisStream,
  tickSimVessels,
  Vessel,
  VesselType,
} from "@/lib/aisStream";

// ─── Constants ────────────────────────────────────────────────────────────────
const CARTO_API_KEY =
  process.env.NEXT_PUBLIC_CARTO_API_KEY || "cb1_2dhp_1_9403bbcac732699b29121f7e";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const AIS_API_KEY = process.env.NEXT_PUBLIC_AIS_API_KEY || "";

// Indian port coordinates (real positions)
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

const IMBL_PAKISTAN: [number, number][] = [
  [61.32, 22.35], [62.70, 22.65], [63.90, 22.85],
  [65.30, 22.90], [66.50, 23.08], [67.80, 22.76], [68.17, 23.50],
];
const IMBL_SRILANKA: [number, number][] = [
  [79.42, 9.76], [80.00, 9.52], [80.50, 9.18],
  [80.80, 8.83], [81.10, 8.48],
];

// GEBCO 200m isobath shelf break nodes
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

// ─── Vessel colour by type ────────────────────────────────────────────────────
const VESSEL_COLORS: Record<VesselType, [number, number, number, number]> = {
  cargo:     [220, 220, 220, 230],  // near-white
  tanker:    [103, 232, 249, 230],  // cyan
  fishing:   [52,  211, 153, 220],  // emerald
  military:  [244,  63,  94, 240],  // rose
  passenger: [196, 181, 253, 230],  // lavender
  sailing:   [251, 191,  36, 220],  // amber
  tug:       [253, 186,  47, 210],  // orange
  unknown:   [113, 113, 122, 180],  // zinc
};

// ─── Map Style Builder ────────────────────────────────────────────────────────
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

// ─── Interfaces ───────────────────────────────────────────────────────────────
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

// ─── Vessel Tooltip Component ─────────────────────────────────────────────────
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
        <div className="text-zinc-400">Last Update</div>
        <div className="text-white">{new Date(vessel.lastUpdate).toLocaleTimeString()}</div>
      </div>
      <div className="px-4 py-2 border-t border-white/10 text-[9px] font-mono text-zinc-500">
        AIS · aisstream.io
      </div>
    </div>
  );
}

// ─── Dashboard Content ────────────────────────────────────────────────────────
function DashboardContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "visitor";
  const isDefenseUser = roleParam === "defense";

  const [mounted, setMounted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [threadId, setThreadId] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeGeojson, setActiveGeojson] = useState<any>(null);

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
    longitude: 76.5,
    latitude: 14.5,
    zoom: 4.8,
    pitch: 45,
    bearing: 0,
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

  // Graticule mesh (pre-computed)
  const graticuleLines = useMemo(() => buildGraticuleLines(), []);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);

    const savedThread = localStorage.getItem("orca_thread_id") || uuidv4();
    localStorage.setItem("orca_thread_id", savedThread);
    setThreadId(savedThread);

    if (isDefenseUser) {
      setLayerVisibility((prev) => ({ ...prev, military: true }));
    }

    const roleLabel: Record<string, string> = {
      researcher: "Marine Researcher",
      learner: "Oceanography Student",
      navigator: "Fleet Navigator",
      defense: "Defense Officer",
      visitor: "Coastal Navigator",
    };
    const greetingRole = roleLabel[roleParam] ?? "Mission Operator";

    setMessages([
      {
        id: "msg_welcome",
        role: "assistant",
        content: `### 🐬 Welcome, ${greetingRole} — Project ORCA (SIH26176)

**India's Sovereign Multi-Agent Marine Intelligence Platform.**

- The map shows a **lat/lon tactical mesh** over the Indian Ocean EEZ.
- **Real ship positions** are updated live from AIS transponders.
- Click any **vessel icon** or **map coordinate** to query ORCA.
- Toggle layers via the **Layers** button (top-right).`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [roleParam, isDefenseUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThoughts]);

  // ─── Open-Meteo ocean data ─────────────────────────────────────────────────
  useEffect(() => {
    fetchOceanData()
      .then((data) => { setRealOceanData(data); setIsLoadingData(false); })
      .catch(() => { setDataError("Ocean API unavailable"); setIsLoadingData(false); });
  }, []);

  // ─── AIS ship tracking ─────────────────────────────────────────────────────
  useEffect(() => {
    if (AIS_API_KEY) {
      // Live AIS stream
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
      // Simulation mode — deterministic ships along real routes
      startSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startSimulation() {
    const initial = tickSimVessels(0);
    setVessels([...initial]);

    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = setInterval(() => {
      const updated = tickSimVessels(10); // advance 10 seconds per tick
      setVessels([...updated]);
    }, 10000); // update every 10s
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
      setSelectedCoordinates([+lon.toFixed(4), +lat.toFixed(4)]);
    }
  };

  const handleResetView = () =>
    setViewState({ longitude: 76.5, latitude: 14.5, zoom: 4.8, pitch: 45, bearing: 0 });

  const handleTogglePerspective = () =>
    setViewState((prev) => ({
      ...prev,
      pitch: prev.pitch > 20 ? 0 : 45,
      bearing: prev.pitch > 20 ? 0 : 0,
    }));

  const handlePresetClick = (query: string, coords: [number, number]) => {
    setInputMessage(query);
    setSelectedCoordinates(coords);
    setViewState({ longitude: coords[0], latitude: coords[1], zoom: 6.5, pitch: 40, bearing: 0 });
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
    setCurrentThoughts(["Orchestrating supervisor reasoning with Qwen 2.5 7B..."]);

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
        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: `⚠ Cannot reach ORCA backend at ${API_BASE}. Start the FastAPI server on port 8000.`, timestamp: new Date().toLocaleTimeString() }]);
      }
    } finally {
      setIsStreaming(false);
      setCurrentThoughts([]);
    }
  };

  // ─── DeckGL Layer Building ─────────────────────────────────────────────────
  const oceanPoints = realOceanData?.weatherPoints ?? [];
  const currentArcs = realOceanData?.currentVectors ?? [];
  const pfzPoints   = realOceanData?.pfzPoints ?? [];

  const sstColor = (sst: number): [number, number, number, number] => {
    const t = Math.max(0, Math.min(1, (sst - 22) / 10));
    return [Math.round(56 + t * 199), Math.round(189 - t * 126), Math.round(248 - t * 248), 200];
  };

  const portArcs = INDIA_PORTS.slice(0, -1).map((p, i) => ({
    source: p.pos,
    target: INDIA_PORTS[i + 1].pos,
    name: `${p.name} → ${INDIA_PORTS[i + 1].name}`,
  }));

  const allImblPoints = [
    ...IMBL_PAKISTAN.map((pos) => ({ position: pos, zone: "Pakistan IMBL" })),
    ...IMBL_SRILANKA.map((pos) => ({ position: pos, zone: "Sri Lanka IMBL" })),
  ];
  const imblArcs = [
    ...IMBL_PAKISTAN.slice(0, -1).map((pos, i) => ({ source: pos, target: IMBL_PAKISTAN[i + 1] })),
    ...IMBL_SRILANKA.slice(0, -1).map((pos, i) => ({ source: pos, target: IMBL_SRILANKA[i + 1] })),
  ];

  // Build heading arrow paths for vessels
  const vesselHeadingPaths = vessels
    .filter((v) => v.sog > 0.5)
    .map((v) => {
      const rad = ((v.cog - 90) * Math.PI) / 180;
      const len = Math.max(0.06, v.sog * 0.009); // length ∝ speed
      const endLon = v.lon + len * Math.cos(rad);
      const endLat = v.lat + len * Math.sin(rad);
      return {
        path: [[v.lon, v.lat], [endLon, endLat]] as [number, number][],
        color: VESSEL_COLORS[v.type],
      };
    });

  const deckLayers: any[] = [];

  // ━━━ GRATICULE MESH (always visible — tactical map feel) ━━━━━━━━━━━━━━━━━━
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

  // ① WEATHER — real SST spectral heatmap (Open-Meteo)
  if (layerVisibility.weather && oceanPoints.length > 0) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-weather-sst",
        data: oceanPoints,
        getPosition: (d: any) => d.position,
        getFillColor: (d: any) => sstColor(d.sst),
        getLineColor: [200, 230, 255, 60],
        getRadius: (d: any) => 22000 + d.waveHeight * 7000,
        radiusUnits: "meters",
        stroked: false,
        filled: true,
        opacity: 0.55,
        pickable: true,
        updateTriggers: { getFillColor: [realOceanData?.fetchedAt] },
      })
    );
  }

  // ② CURRENTS — real velocity-scaled arcs (Open-Meteo)
  if (layerVisibility.currents && currentArcs.length > 0) {
    deckLayers.push(
      new ArcLayer({
        id: "layer-currents",
        data: currentArcs,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getSourceColor: [103, 232, 249, 200],
        getTargetColor: (d: any) => (d.velocity > 1.0 ? [147, 197, 253, 240] : [6, 182, 212, 200]),
        getWidth: (d: any) => Math.max(1.5, d.velocity * 3.5),
        widthUnits: "pixels",
        opacity: 0.85,
        pickable: false,
        updateTriggers: { getWidth: [realOceanData?.fetchedAt] },
      })
    );
  }

  // ③ RESOURCES — GEBCO 200m shelf break
  if (layerVisibility.resources) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-shelf",
        data: SHELF_BREAK,
        getPosition: (d: any) => d.position,
        getFillColor: [251, 191, 36, 160],
        getLineColor: [253, 230, 138, 200],
        getRadius: 18000,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1,
        opacity: 0.7,
        pickable: true,
      })
    );
  }

  // ④ FISHING ZONES — derived from real SST
  if (layerVisibility.fishingZones && pfzPoints.length > 0) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-pfz",
        data: pfzPoints,
        getPosition: (d: any) => d.position,
        getFillColor: (d: any) => [52, 211, 153, Math.round(120 + d.confidence * 0.7)],
        getLineColor: [167, 243, 208, 180],
        getRadius: (d: any) => 14000 + d.confidence * 200,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1,
        opacity: 0.85,
        pickable: true,
        updateTriggers: { getFillColor: [realOceanData?.fetchedAt], getRadius: [realOceanData?.fetchedAt] },
      })
    );
  }

  // ⑤ TRANSPORT — Indian Coastal Shipping Network
  if (layerVisibility.transport) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-ports",
        data: INDIA_PORTS,
        getPosition: (d: any) => d.pos,
        getFillColor: [255, 255, 255, 220],
        getLineColor: [180, 180, 180, 180],
        getRadius: 7000,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1.5,
        opacity: 0.95,
        pickable: true,
      })
    );
    deckLayers.push(
      new ArcLayer({
        id: "layer-shipping-lanes",
        data: portArcs,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getSourceColor: [255, 255, 255, 180],
        getTargetColor: [160, 160, 160, 140],
        getWidth: 2,
        widthUnits: "pixels",
        opacity: 0.7,
        pickable: false,
      })
    );
  }

  // ⑥ MILITARY — Treaty IMBL boundaries
  if (layerVisibility.military && isDefenseUser) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-imbl-nodes",
        data: allImblPoints,
        getPosition: (d: any) => d.position,
        getFillColor: [244, 63, 94, 200],
        getLineColor: [255, 180, 180, 255],
        getRadius: 24000,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 2,
        opacity: 0.9,
        pickable: true,
      })
    );
    deckLayers.push(
      new ArcLayer({
        id: "layer-imbl-arc",
        data: imblArcs,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getSourceColor: [244, 63, 94, 220],
        getTargetColor: [244, 63, 94, 220],
        getWidth: 4,
        widthUnits: "pixels",
        opacity: 0.9,
      })
    );
  }

  // ⑦ SHIPS — AIS vessel positions (always shown when toggle is on)
  if (showVessels && vessels.length > 0) {
    // Vessel position dots
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-ais-vessels",
        data: vessels,
        getPosition: (d: any) => [d.lon, d.lat],
        getFillColor: (d: any) => VESSEL_COLORS[d.type as VesselType] ?? [200, 200, 200, 200],
        getLineColor: [0, 0, 0, 100],
        getRadius: 4500,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 10,
        opacity: 1,
        pickable: true,
        onClick: (info: any) => {
          if (info.object) setSelectedVessel(info.object as Vessel);
        },
        updateTriggers: {
          getPosition: [vessels.map((v) => v.mmsi).join(",")],
        },
      })
    );
    // Heading vectors
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

  // ⑧ API GeoJSON overlay from chat
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
          f.geometry?.type === "LineString" ? [255, 255, 255, 255] : [244, 63, 94, 255],
        getFillColor: (f: any) => {
          if (f.properties?.type === "origin_node") return [255, 255, 255, 255];
          if (f.properties?.target_species) return [52, 211, 153, 200];
          return [244, 63, 94, 120];
        },
        getPointRadius: 12000,
        pointRadiusMinPixels: 5,
      })
    );
  }

  // ⑨ Target cursor
  if (selectedCoordinates) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-target",
        data: [{ position: selectedCoordinates }],
        getPosition: (d: any) => d.position,
        getFillColor: [255, 255, 255, 200],
        getLineColor: [255, 255, 255, 255],
        getRadius: 10000,
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
      })
    );
  }

  // ─── Render guard ──────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-mono">
        <Compass className="h-8 w-8 animate-spin mr-3" />
        <span>Loading Project ORCA Tactical Radar...</span>
      </div>
    );
  }

  const currentMapStyle = buildMapStyle(activeMapMode, enable3DTerrain, terrainExaggeration);
  const vesselCounts = vessels.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-black text-white font-sans">

      {/* ================================================================= */}
      {/* LEFT PANEL: Tactical Advisory Chat                                 */}
      {/* ================================================================= */}
      <div className={`relative z-20 flex flex-col border-r border-white/10 bg-black/95 backdrop-blur-2xl transition-all duration-300 ${isChatOpen ? "w-full md:w-[390px]" : "w-0 overflow-hidden border-r-0"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="p-1.5 rounded-lg bg-white text-black">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-wide">PROJECT ORCA</h1>
                <span className="text-[9px] font-mono px-1 rounded bg-white/10 text-zinc-300 border border-white/15">SIH26176</span>
                {isDefenseUser && <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">DEFENSE</span>}
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Multi-Agent Marine Swarm</p>
            </div>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer">
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="border-b border-white/10 p-2.5 bg-black/60 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1">⚡ Quick Scenarios</div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Veraval Tuna PFZ", sub: "Thermal Front", icon: Fish, color: "text-emerald-400", query: "Tuna fishing potential off Veraval Gujarat?", coords: [70.37, 20.90] as [number, number] },
              { label: "IMBL Border Alert", sub: "Sovereignty", icon: Shield, color: "text-rose-400", query: "Am I near the Sri Lanka IMBL?", coords: [79.315, 9.285] as [number, number] },
              { label: "Mumbai → Kochi", sub: "A* Routing", icon: Navigation, color: "text-white", query: "Optimal fuel route Mumbai to Kochi currents?", coords: [72.83, 18.92] as [number, number] },
              { label: "Lakshadweep SST", sub: "Weather State", icon: Waves, color: "text-sky-400", query: "Wave height and SST in Lakshadweep sea?", coords: [73.0, 10.5] as [number, number] },
            ].map(({ label, sub, icon: Icon, color, query, coords }) => (
              <button key={label} onClick={() => handlePresetClick(query, coords)} className="p-2 rounded-xl border border-white/10 bg-zinc-950/60 hover:bg-zinc-900 text-left text-[11px] transition cursor-pointer">
                <div className={`font-bold flex items-center gap-1 ${color}`}>
                  <Icon className="h-3 w-3" /><span>{label}</span>
                </div>
                <span className="text-[9px] text-zinc-500 block">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-white/10">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${msg.role === "user" ? "bg-white text-black rounded-br-none font-medium" : "bg-zinc-900/90 text-zinc-200 border border-white/10 rounded-bl-none"}`}>
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="orca-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                )}
                <div className="mt-1.5 text-[9px] text-zinc-500 text-right">{msg.timestamp}</div>
              </div>
              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="p-3 rounded-xl border border-white/15 bg-zinc-900/60 text-xs text-zinc-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Multi-Agent Thought Stream</span>
              </div>
              <div className="space-y-1 pl-4 border-l border-white/20">
                {currentThoughts.map((t, i) => <p key={i} className="text-[11px] font-mono text-zinc-400">{t}</p>)}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 bg-black p-3">
          {selectedCoordinates && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-white/15 bg-zinc-950 px-2.5 py-1 text-[11px] text-white">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 animate-pulse" />
                <span>Lock: <strong>[{selectedCoordinates[1]}°N, {selectedCoordinates[0]}°E]</strong></span>
              </div>
              <button onClick={() => setSelectedCoordinates(null)} className="text-zinc-500 hover:text-rose-400 cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={selectedCoordinates ? "Query at locked coordinate..." : "Click map or type a query..."}
              disabled={isStreaming}
              className="flex-1 rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black transition disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Panel toggle button */}
      {!isChatOpen && (
        <button onClick={() => setIsChatOpen(true)} className="absolute top-4 left-4 z-30 flex items-center gap-2 p-2.5 rounded-xl bg-black/90 border border-white/20 text-white shadow-2xl backdrop-blur-md cursor-pointer hover:bg-zinc-900">
          <PanelLeftOpen className="h-5 w-5" />
          <span className="text-xs font-bold font-mono">TACTICAL PANEL</span>
        </button>
      )}

      {/* ================================================================= */}
      {/* RIGHT: DeckGL MAP                                                  */}
      {/* ================================================================= */}
      <div className="relative flex-1 h-full w-full bg-black">

        {/* Vessel Tooltip */}
        {selectedVessel && (
          <VesselTooltip vessel={selectedVessel} onClose={() => setSelectedVessel(null)} />
        )}

        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 flex-wrap justify-end">
          {selectedCoordinates && (
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/90 px-3 py-1.5 shadow-xl backdrop-blur-md text-white text-xs font-mono font-semibold">
              <MapPin className="h-3.5 w-3.5" />
              <span>{selectedCoordinates[1]}°N, {selectedCoordinates[0]}°E</span>
            </div>
          )}

          {/* Basemap */}
          <div className="flex rounded-xl border border-white/15 bg-black/90 p-1 shadow-xl backdrop-blur-md">
            {(["dark", "voyager", "satellite"] as const).map((mode) => {
              const Icon = { dark: Navigation, voyager: Compass, satellite: Globe }[mode];
              const label = { dark: "Dark", voyager: "Nautical", satellite: "Satellite" }[mode];
              return (
                <button key={mode} onClick={() => setActiveMapMode(mode)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${activeMapMode === mode ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                  <Icon className="h-3 w-3" /><span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* 3D */}
          <button onClick={() => setEnable3DTerrain(!enable3DTerrain)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold shadow-xl backdrop-blur-md transition cursor-pointer ${enable3DTerrain ? "bg-zinc-900 text-white border-white/30" : "bg-black/90 text-zinc-400 border-white/15 hover:text-white"}`}>
            <Mountain className="h-3.5 w-3.5" />
            <span>3D {enable3DTerrain ? "ON" : "OFF"}</span>
          </button>

          {/* Ships toggle */}
          <button onClick={() => setShowVessels(!showVessels)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold shadow-xl backdrop-blur-md transition cursor-pointer ${showVessels ? "bg-zinc-900 text-white border-white/30" : "bg-black/90 text-zinc-400 border-white/15 hover:text-white"}`}>
            <Anchor className="h-3.5 w-3.5" />
            <span>Ships {showVessels ? `(${vessels.length})` : "OFF"}</span>
          </button>

          <button onClick={handleTogglePerspective} className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/15 bg-black/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={handleResetView} className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/15 bg-black/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer">
            <RotateCcw className="h-4 w-4" />
          </button>

          <LayerControlPanel visibility={layerVisibility} onToggle={handleLayerToggle} isDefenseUser={isDefenseUser} />
        </div>

        {/* AIS Status badge */}
        <div className="absolute top-16 right-4 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-black/80 px-3 py-1.5 backdrop-blur-md text-[10px] font-mono">
          <Radio className={`h-3 w-3 ${aisConnected ? "text-emerald-400" : "text-amber-400"}`} />
          <span className={aisConnected ? "text-emerald-400" : "text-amber-300"}>
            {aisConnected ? `AIS LIVE · ${vessels.length} vessels` : `AIS SIM · ${vessels.length} vessels`}
          </span>
        </div>

        {/* Bottom-right Legend */}
        <div className="absolute bottom-6 right-6 z-20 rounded-2xl border border-white/10 bg-black/90 p-4 shadow-2xl backdrop-blur-md text-[11px] text-zinc-300 min-w-[180px]">
          <div className="font-bold text-white flex items-center gap-1.5 mb-2">
            <Layers className="h-3.5 w-3.5" />
            <span>Active Layers</span>
            {isLoadingData && <RefreshCw className="h-3 w-3 animate-spin text-zinc-400 ml-auto" />}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><span className="h-1 w-4 rounded" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0,rgba(255,255,255,0.25) 2px,transparent 2px,transparent 4px)" }} /><span className="text-zinc-400">Graticule Mesh</span></div>
            {layerVisibility.weather && <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /><span>SST Heatmap{realOceanData ? " (Live)" : " …"}</span></div>}
            {layerVisibility.currents && <div className="flex items-center gap-2"><span className="h-1 w-4 rounded bg-cyan-300" /><span>Currents{realOceanData ? " (Live)" : " …"}</span></div>}
            {layerVisibility.resources && <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span>Shelf 200m</span></div>}
            {layerVisibility.fishingZones && <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span>PFZ{realOceanData ? ` (${pfzPoints.length})` : " …"}</span></div>}
            {layerVisibility.transport && <div className="flex items-center gap-2"><span className="h-1 w-4 rounded bg-white" /><span>Shipping Lanes</span></div>}
            {layerVisibility.military && isDefenseUser && <div className="flex items-center gap-2"><span className="h-1 w-4 rounded bg-rose-500" /><span>IMBL Boundary</span></div>}
            {showVessels && (
              <>
                {Object.entries(vesselCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `rgb(${VESSEL_COLORS[type as VesselType]?.slice(0, 3).join(",") ?? "150,150,150"})` }} />
                    <span className="capitalize">{type} ({count})</span>
                  </div>
                ))}
              </>
            )}
            {selectedCoordinates && <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-zinc-700" /><span>Target Lock</span></div>}
          </div>
          {realOceanData && (
            <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-zinc-500 font-mono">
              Open-Meteo · {new Date(realOceanData.fetchedAt).toLocaleTimeString()}
            </div>
          )}
          {dataError && <div className="mt-1 text-[9px] text-amber-500">⚠ {dataError}</div>}
        </div>

        {/* Defense badge */}
        {isDefenseUser && (
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/80 px-3 py-2 shadow-2xl backdrop-blur-md text-xs font-mono text-rose-300">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Defense Clearance — Military Layers Unlocked</span>
          </div>
        )}

        {/* DeckGL Canvas */}
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
  );
}

export default function OrcaDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-mono">
        <Compass className="h-8 w-8 animate-spin mr-3" />
        <span>Loading ORCA Tactical Radar...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
