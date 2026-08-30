"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer, ArcLayer } from "@deck.gl/layers";
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
  Lock,
  ShieldAlert,
} from "lucide-react";
import LayerControlPanel, { LayerVisibility } from "@/components/LayerControlPanel";

// ─── Constants ────────────────────────────────────────────────────────────────
const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || "cb1_2dhp_1_9403bbcac732699b29121f7e";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const TERRAIN_DEM_SOURCE = {
  type: "raster-dem",
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  tileSize: 256,
  encoding: "terrarium",
  maxzoom: 15,
};

// ─── Static sample data for visual layers (used when no API response yet) ────
// These give instant visual feedback showing all layers are wired correctly.

/** Weather: 4 representative Arabian Sea SST hotspot nodes */
const WEATHER_SAMPLE_POINTS = [
  { position: [70.5, 20.8], sst: 28.4, label: "SST 28.4°C" },
  { position: [72.8, 18.9], sst: 29.1, label: "SST 29.1°C" },
  { position: [76.3, 10.2], sst: 27.8, label: "SST 27.8°C" },
  { position: [80.3, 13.1], sst: 28.9, label: "SST 28.9°C" },
  { position: [83.2, 17.7], sst: 28.2, label: "SST 28.2°C" },
];

/** Currents: arrow source→target pairs showing Eulerian surface vectors */
const CURRENT_VECTOR_ARCS = [
  { source: [68.0, 22.0], target: [70.5, 21.2], velocity: 1.4 },
  { source: [70.5, 21.2], target: [72.0, 20.1], velocity: 1.6 },
  { source: [72.0, 20.1], target: [73.5, 19.5], velocity: 1.3 },
  { source: [76.0, 11.0], target: [78.2, 10.4], velocity: 0.9 },
  { source: [78.2, 10.4], target: [80.1, 9.8], velocity: 1.1 },
  { source: [80.1, 9.8], target: [81.5, 9.3], velocity: 1.2 },
  { source: [68.5, 14.0], target: [70.0, 13.5], velocity: 1.0 },
];

/** Resources: continental shelf break depth contour markers */
const RESOURCE_SAMPLE_POINTS = [
  { position: [69.2, 21.5], depth: 200, type: "Shelf Break" },
  { position: [71.0, 19.8], depth: 350, type: "Deep Channel" },
  { position: [75.8, 11.8], depth: 180, type: "Reef System" },
  { position: [79.5, 11.2], depth: 220, type: "Shelf Break" },
  { position: [82.0, 15.0], depth: 400, type: "Submarine Canyon" },
  { position: [85.0, 14.2], depth: 280, type: "Seamount" },
];

/** Fishing Zones: PFZ aggregation cluster points */
const PFZ_SAMPLE_POINTS = [
  { position: [70.37, 20.90], species: "Yellowfin Tuna", confidence: 88 },
  { position: [70.65, 20.75], species: "Indian Mackerel", confidence: 92 },
  { position: [71.20, 20.50], species: "Ribbonfish", confidence: 78 },
  { position: [75.5, 11.4], species: "Sardines", confidence: 85 },
  { position: [80.1, 9.85], species: "Skipjack Tuna", confidence: 74 },
];

/** Transport: demo A* optimised route segments */
const TRANSPORT_ROUTE = [
  [70.368, 20.902],
  [70.52, 20.75],
  [70.65, 20.63],
  [70.71, 20.52],
  [70.65, 20.30],
  [70.55, 20.12],
  [70.35, 19.95],
];

/** Military: IMBL boundary reference points (simplified) */
const MILITARY_IMBL_POINTS = [
  { position: [66.5, 23.2], type: "Pakistan IMBL Node", danger: true },
  { position: [67.8, 22.8], type: "Pakistan IMBL Node", danger: true },
  { position: [68.9, 22.1], type: "Pakistan IMBL Node", danger: true },
  { position: [79.0, 9.1], type: "Sri Lanka IMBL Node", danger: true },
  { position: [80.5, 8.6], type: "Sri Lanka IMBL Node", danger: true },
];

// ─── Map Style Builder ────────────────────────────────────────────────────────
function buildMapStyle(mode: "dark" | "voyager" | "satellite", enable3D: boolean, exaggeration = 2.0): any {
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
      attribution: "© CARTO, © OpenStreetMap contributors",
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
      attribution: "© CARTO, © OpenStreetMap contributors",
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
      id: "hillshade-relief",
      type: "hillshade",
      source: "terrain-dem",
      minzoom: 0,
      maxzoom: 18,
      paint: {
        "hillshade-shadow-color": "#020617",
        "hillshade-highlight-color": "#ffffff",
        "hillshade-accent-color": "#52525b",
        "hillshade-exaggeration": 0.85,
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
  role: "user" | "assistant" | "system";
  content: string;
  geojson?: any;
  timestamp: string;
}

function sanitizeLlmContent(text: string): string {
  if (!text) return "";
  return text.replace(/\*\*\*/g, "**").trim();
}

// ─── Dashboard Content (inner, uses hooks) ────────────────────────────────────
function DashboardContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "visitor";
  const isDefenseUser = roleParam === "defense";

  const [mounted, setMounted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [threadId, setThreadId] = useState<string>("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentThoughts, setCurrentThoughts] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeGeojson, setActiveGeojson] = useState<any>(null);

  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    weather: true,
    currents: true,
    resources: false,
    fishingZones: true,
    transport: true,
    military: false,
  });

  // Basemap & 3D Terrain
  const [activeMapMode, setActiveMapMode] = useState<"dark" | "voyager" | "satellite">("dark");
  const [enable3DTerrain, setEnable3DTerrain] = useState<boolean>(true);
  const [terrainExaggeration] = useState<number>(2.2);

  const [viewState, setViewState] = useState({
    longitude: 70.368,
    latitude: 20.902,
    zoom: 5.8,
    pitch: 55,
    bearing: 15,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedThread = localStorage.getItem("orca_thread_id") || uuidv4();
    localStorage.setItem("orca_thread_id", savedThread);
    setThreadId(savedThread);

    // If defense login, unlock military layer by default
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
**India's Sovereign Multi-Agent Marine Intelligence & Navigation Platform.**

- Click anywhere on the **3D Bathymetry Radar** to lock target coordinates.
- Use the **Layers** button (top-right) to toggle Weather, Currents, Resources, Fishing Zones, Transport, and ${isDefenseUser ? "Military overlays." : "Defense layers (restricted)."}
- Local **Qwen 2.5 7B & BGE-M3** swarm running 100% on-premise.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [roleParam, isDefenseUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThoughts]);

  const handleLayerToggle = (id: keyof LayerVisibility) => {
    if (id === "military" && !isDefenseUser) return;
    setLayerVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMapClick = (info: any) => {
    if (info?.coordinate) {
      const [lon, lat] = info.coordinate;
      setSelectedCoordinates([Number(lon.toFixed(4)), Number(lat.toFixed(4))]);
    }
  };

  const handleResetView = () => {
    setViewState({ longitude: 70.368, latitude: 20.902, zoom: 5.8, pitch: 55, bearing: 15 });
  };

  const handleTogglePerspective = () => {
    setViewState((prev) => ({
      ...prev,
      pitch: prev.pitch > 20 ? 0 : 55,
      bearing: prev.pitch > 20 ? 0 : 15,
    }));
  };

  const handlePresetClick = (query: string, coords: [number, number]) => {
    setInputMessage(query);
    setSelectedCoordinates(coords);
    setViewState({ longitude: coords[0], latitude: coords[1], zoom: 7.2, pitch: 55, bearing: 20 });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || isStreaming) return;

    const targetCoords = selectedCoordinates ? [selectedCoordinates[1], selectedCoordinates[0]] : null;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsStreaming(true);
    setCurrentThoughts(["Orchestrating supervisor reasoning with Qwen 2.5 7B..."]);

    const assistantMsgId = uuidv4();
    let accumulatedContent = "";

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
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "thought") {
                  setCurrentThoughts((prev) => [...prev, `[${data.agent.toUpperCase()}] ${data.text}`]);
                } else if (data.type === "chunk") {
                  accumulatedContent += data.text;
                  setMessages((prev) => {
                    const existing = prev.find((m) => m.id === assistantMsgId);
                    const sanitized = sanitizeLlmContent(accumulatedContent);
                    if (existing) {
                      return prev.map((m) => (m.id === assistantMsgId ? { ...m, content: sanitized } : m));
                    }
                    return [...prev, { id: assistantMsgId, role: "assistant", content: sanitized, timestamp: new Date().toLocaleTimeString() }];
                  });
                } else if (data.type === "complete" && data.geojson) {
                  setActiveGeojson(data.geojson);
                }
              } catch {}
            }
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
        accumulatedContent = sanitizeLlmContent(rp.markdown_advisory || "Advisory generated successfully.");
        if (rp.geojson_payload) setActiveGeojson(rp.geojson_payload);
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: "assistant", content: accumulatedContent, geojson: rp.geojson_payload, timestamp: new Date().toLocaleTimeString() },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: "assistant", content: `⚠️ Cannot reach ORCA backend at ${API_BASE}. Make sure the FastAPI server is running on port 8000.`, timestamp: new Date().toLocaleTimeString() },
        ]);
      }
    } finally {
      setIsStreaming(false);
      setCurrentThoughts([]);
    }
  };

  // ─── Build DeckGL Layers based on visibility toggles ─────────────────────
  const deckLayers: any[] = [];

  // ① WEATHER LAYER — SST thermal markers (sky blue)
  if (layerVisibility.weather) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-weather-sst",
        data: WEATHER_SAMPLE_POINTS,
        getPosition: (d: any) => d.position,
        getFillColor: [56, 189, 248, 180],       // sky-400
        getLineColor: [186, 230, 253, 255],       // sky-200
        getRadius: 28000,
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1.5,
        opacity: 0.85,
        pickable: true,
      })
    );
  }

  // ② CURRENTS LAYER — ArcLayer arrows (cyan)
  if (layerVisibility.currents) {
    deckLayers.push(
      new ArcLayer({
        id: "layer-currents-vectors",
        data: CURRENT_VECTOR_ARCS,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getSourceColor: [103, 232, 249, 200],    // cyan-300
        getTargetColor: [6, 182, 212, 240],       // cyan-500
        getWidth: (d: any) => Math.max(2, d.velocity * 2.5),
        widthUnits: "pixels",
        opacity: 0.9,
        pickable: true,
      })
    );
  }

  // ③ RESOURCES LAYER — shelf break & depth markers (amber)
  if (layerVisibility.resources) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-resources-bathymetry",
        data: RESOURCE_SAMPLE_POINTS,
        getPosition: (d: any) => d.position,
        getFillColor: [251, 191, 36, 200],       // amber-400
        getLineColor: [253, 230, 138, 255],       // amber-200
        getRadius: 22000,
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1.5,
        opacity: 0.75,
        pickable: true,
      })
    );
  }

  // ④ FISHING ZONES (PFZ) — aggregation hotspot circles (emerald)
  if (layerVisibility.fishingZones) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-fishing-pfz",
        data: PFZ_SAMPLE_POINTS,
        getPosition: (d: any) => d.position,
        getFillColor: [52, 211, 153, 200],       // emerald-400
        getLineColor: [167, 243, 208, 255],       // emerald-200
        getRadius: (d: any) => 18000 + d.confidence * 100,
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
        opacity: 0.9,
        pickable: true,
      })
    );
  }

  // ⑤ TRANSPORT LAYER — A* optimal route polyline (white)
  if (layerVisibility.transport) {
    const routeFeature: any = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: TRANSPORT_ROUTE },
      properties: { name: "Fuel-Optimal A* Route" },
    };
    deckLayers.push(
      new GeoJsonLayer({
        id: "layer-transport-route",
        data: { type: "FeatureCollection", features: [routeFeature] } as any,
        stroked: true,
        filled: false,
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 5,
        lineWidthUnits: "pixels",
        lineWidthMinPixels: 3,
        opacity: 0.95,
        pickable: true,
      })
    );
    // Waypoint nodes
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-transport-waypoints",
        data: TRANSPORT_ROUTE.map((pos) => ({ position: pos })),
        getPosition: (d: any) => d.position,
        getFillColor: [255, 255, 255, 230],
        getLineColor: [200, 200, 200, 255],
        getRadius: 6000,
        radiusUnits: "meters",
        stroked: true,
        lineWidthMinPixels: 1,
        opacity: 0.9,
      })
    );
  }

  // ⑥ MILITARY LAYER — IMBL border nodes (rose/red) — defense only
  if (layerVisibility.military && isDefenseUser) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-military-imbl",
        data: MILITARY_IMBL_POINTS,
        getPosition: (d: any) => d.position,
        getFillColor: [244, 63, 94, 220],        // rose-500
        getLineColor: [255, 200, 200, 255],
        getRadius: 30000,
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
        opacity: 0.9,
        pickable: true,
      })
    );
    // IMBL boundary arc connecting nodes
    const imblArcs = MILITARY_IMBL_POINTS.slice(0, -1).map((p, i) => ({
      source: p.position,
      target: MILITARY_IMBL_POINTS[i + 1].position,
    }));
    deckLayers.push(
      new ArcLayer({
        id: "layer-military-imbl-arc",
        data: imblArcs,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getSourceColor: [244, 63, 94, 200],
        getTargetColor: [244, 63, 94, 200],
        getWidth: 4,
        widthUnits: "pixels",
        opacity: 0.95,
      })
    );
  }

  // ⑦ API GeoJSON from chat responses (on top of everything)
  if (activeGeojson?.features) {
    deckLayers.push(
      new GeoJsonLayer({
        id: "layer-api-geojson",
        data: activeGeojson,
        pickable: true,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 4,
        getLineColor: (f: any) =>
          f.geometry?.type === "LineString" ? [255, 255, 255, 255] : [244, 63, 94, 255],
        getFillColor: (f: any) => {
          if (f.properties?.type === "origin_node") return [255, 255, 255, 255];
          if (f.properties?.target_species) return [52, 211, 153, 220];
          return [244, 63, 94, 120];
        },
        getPointRadius: (f: any) => (f.properties?.target_species ? 14000 : 8000),
        pointRadiusMinPixels: 6,
      })
    );
  }

  // ⑧ Selected target cursor (always on top)
  if (selectedCoordinates) {
    deckLayers.push(
      new ScatterplotLayer({
        id: "layer-target-cursor",
        data: [{ position: selectedCoordinates }],
        getPosition: (d: any) => d.position,
        getFillColor: [255, 255, 255, 240],
        getLineColor: [255, 255, 255, 255],
        getRadius: 14000,
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
      })
    );
  }

  // ─── Render guard ─────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-mono">
        <Compass className="h-8 w-8 animate-spin" />
        <span className="ml-3">Loading Project ORCA 3D Marine Radar...</span>
      </div>
    );
  }

  const currentMapStyle = buildMapStyle(activeMapMode, enable3DTerrain, terrainExaggeration);

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-black text-white font-sans">
      {/* ================================================================== */}
      {/* LEFT PANEL: RETRACTABLE CHAT & ADVISORY INTERFACE                  */}
      {/* ================================================================== */}
      <div
        className={`relative z-20 flex flex-col border-r border-white/10 bg-zinc-950/95 backdrop-blur-2xl transition-all duration-300 ${
          isChatOpen ? "w-full md:w-[400px] lg:w-[450px]" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-black border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Return to Mission Overview"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="p-1.5 rounded-lg bg-white text-black font-bold">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-wide text-white">PROJECT ORCA</h1>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/20">
                  SIH26176
                </span>
                {isDefenseUser && (
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    DEFENSE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Multi-Agent Marine Swarm</p>
            </div>
          </div>

          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-lg bg-black border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Collapse for fullscreen 3D view"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="border-b border-white/10 p-2.5 bg-black/60 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
            ⚡ Quick Tactical Scenarios
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handlePresetClick("Can 4 mechanized boats fish 30km off Veraval for Tuna?", [70.368, 20.902])}
              className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-left text-[11px] text-zinc-200 transition cursor-pointer"
            >
              <div className="font-bold flex items-center gap-1">
                <Fish className="h-3 w-3 text-emerald-400" />
                <span>Veraval Tuna PFZ</span>
              </div>
              <span className="text-[9px] text-zinc-500 block">Thermal Front</span>
            </button>

            <button
              onClick={() => handlePresetClick("Am I crossing the Sri Lanka IMBL boundary near Rameswaram?", [79.315, 9.285])}
              className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-left text-[11px] text-zinc-200 transition cursor-pointer"
            >
              <div className="font-bold flex items-center gap-1">
                <Shield className="h-3 w-3 text-rose-400" />
                <span>IMBL Border Alert</span>
              </div>
              <span className="text-[9px] text-zinc-500 block">Sovereignty Check</span>
            </button>

            <button
              onClick={() => handlePresetClick("Plot optimal fuel route from Sassoon Dock Mumbai to Kochi considering current vectors.", [72.82, 18.92])}
              className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-left text-[11px] text-zinc-200 transition cursor-pointer"
            >
              <div className="font-bold flex items-center gap-1">
                <Navigation className="h-3 w-3 text-white" />
                <span>Mumbai → Kochi</span>
              </div>
              <span className="text-[9px] text-zinc-500 block">A* Route Planning</span>
            </button>

            <button
              onClick={() => handlePresetClick("What is the current wave height and SST in the Lakshadweep sea today?", [73.0, 10.5])}
              className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-left text-[11px] text-zinc-200 transition cursor-pointer"
            >
              <div className="font-bold flex items-center gap-1">
                <Waves className="h-3 w-3 text-sky-400" />
                <span>Lakshadweep SST</span>
              </div>
              <span className="text-[9px] text-zinc-500 block">Weather State</span>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role !== "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-white/10 text-white">
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
                <div className="mt-1.5 text-[9px] text-zinc-500 text-right">{msg.timestamp}</div>
              </div>

              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
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
                {currentThoughts.map((t, idx) => (
                  <p key={idx} className="text-[11px] font-mono text-zinc-400">{t}</p>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-white/10 bg-black p-3">
          {selectedCoordinates && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-white/20 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-white">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-white animate-bounce" />
                <span>Target: <strong>[{selectedCoordinates[1]}°N, {selectedCoordinates[0]}°E]</strong></span>
              </div>
              <button onClick={() => setSelectedCoordinates(null)} className="text-zinc-500 hover:text-rose-400 transition cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={selectedCoordinates ? "Ask about locked coordinate (PFZ, Route, IMBL)..." : "Click map to lock coordinates or type query..."}
              disabled={isStreaming}
              className="flex-1 rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black transition disabled:opacity-40 cursor-pointer shadow-lg shadow-white/10"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Toggle when panel is closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="absolute top-4 left-4 z-30 flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/90 border border-white/20 text-white shadow-2xl backdrop-blur-md transition cursor-pointer hover:bg-zinc-900"
        >
          <PanelLeftOpen className="h-5 w-5" />
          <span className="text-xs font-bold font-mono">TACTICAL PANEL</span>
        </button>
      )}

      {/* ================================================================== */}
      {/* RIGHT: INTERACTIVE 3D DeckGL MAP                                   */}
      {/* ================================================================== */}
      <div className="relative flex-1 h-full w-full bg-black">
        {/* Top Controls Row */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2.5 flex-wrap justify-end">
          {selectedCoordinates && (
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-zinc-950/90 px-3 py-1.5 shadow-xl backdrop-blur-md text-white text-xs font-mono font-semibold">
              <MapPin className="h-4 w-4" />
              <span>{selectedCoordinates[1]}°N, {selectedCoordinates[0]}°E</span>
            </div>
          )}

          {/* Basemap Switcher */}
          <div className="flex rounded-xl border border-white/15 bg-zinc-950/90 p-1 shadow-xl backdrop-blur-md">
            {(["dark", "voyager", "satellite"] as const).map((mode) => {
              const icons = { dark: Navigation, voyager: Compass, satellite: Globe };
              const labels = { dark: "Dark", voyager: "Nautical", satellite: "Satellite" };
              const Icon = icons[mode];
              return (
                <button
                  key={mode}
                  onClick={() => setActiveMapMode(mode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    activeMapMode === mode ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{labels[mode]}</span>
                </button>
              );
            })}
          </div>

          {/* 3D Terrain Toggle */}
          <button
            onClick={() => setEnable3DTerrain(!enable3DTerrain)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold shadow-xl backdrop-blur-md transition cursor-pointer ${
              enable3DTerrain ? "bg-zinc-900 text-white border-white/40" : "bg-zinc-950/90 text-zinc-400 border-white/15 hover:text-white"
            }`}
          >
            <Mountain className="h-3.5 w-3.5" />
            <span>3D {enable3DTerrain ? "ON" : "OFF"}</span>
          </button>

          {/* Perspective Tilt */}
          <button
            onClick={handleTogglePerspective}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-white/15 bg-zinc-950/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Toggle perspective tilt"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetView}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-white/15 bg-zinc-950/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Reset camera to Arabian Sea"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* LAYER CONTROL PANEL — the new component */}
          <LayerControlPanel
            visibility={layerVisibility}
            onToggle={handleLayerToggle}
            isDefenseUser={isDefenseUser}
          />
        </div>

        {/* Bottom-right Dynamic Legend (reflects active layers) */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-zinc-950/90 p-3.5 shadow-2xl backdrop-blur-md text-[11px] text-zinc-300">
          <div className="font-bold text-white flex items-center gap-1.5 mb-0.5">
            <Layers className="h-3.5 w-3.5" />
            <span>Active Layers</span>
          </div>
          {layerVisibility.weather && (
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /><span>Weather / SST</span></div>
          )}
          {layerVisibility.currents && (
            <div className="flex items-center gap-2"><span className="h-1 w-5 rounded bg-cyan-300" /><span>Water Currents</span></div>
          )}
          {layerVisibility.resources && (
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span>Ocean Resources</span></div>
          )}
          {layerVisibility.fishingZones && (
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span>Fishing Zones (PFZ)</span></div>
          )}
          {layerVisibility.transport && (
            <div className="flex items-center gap-2"><span className="h-1 w-5 rounded bg-white" /><span>Transport Route</span></div>
          )}
          {layerVisibility.military && isDefenseUser && (
            <div className="flex items-center gap-2"><span className="h-1 w-5 rounded bg-rose-500" /><span>Military IMBL</span></div>
          )}
          {selectedCoordinates && (
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-zinc-700" /><span>Target Lock</span></div>
          )}
          {!layerVisibility.weather && !layerVisibility.currents && !layerVisibility.resources &&
           !layerVisibility.fishingZones && !layerVisibility.transport && !layerVisibility.military && (
            <span className="text-zinc-500 italic">No layers active</span>
          )}
        </div>

        {/* Defense Mode indicator badge */}
        {isDefenseUser && (
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/80 px-3 py-2 shadow-2xl backdrop-blur-md text-xs font-mono text-rose-300">
            <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />
            <span>Defense Clearance Active — Military Layers Unlocked</span>
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

// ─── Page Wrapper (Suspense for useSearchParams) ──────────────────────────────
export default function OrcaDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-mono">
          <Compass className="h-8 w-8 animate-spin" />
          <span className="ml-3">Loading Project ORCA Tactical Deck...</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
