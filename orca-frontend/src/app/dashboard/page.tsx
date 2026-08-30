"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer } from "@deck.gl/layers";
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
  Sliders,
  Sparkles,
} from "lucide-react";

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || "cb1_2dhp_1_9403bbcac732699b29121f7e";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const TERRAIN_DEM_SOURCE = {
  type: "raster-dem",
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  tileSize: 256,
  encoding: "terrarium",
  maxzoom: 15,
};

function buildMapStyle(mode: "dark" | "voyager" | "satellite", enable3D: boolean, exaggeration: number = 2.0): any {
  const sources: any = {
    "terrain-dem": TERRAIN_DEM_SOURCE,
  };

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
    basemapLayer = {
      id: "carto-dark-tiles",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 20,
    };
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
    basemapLayer = {
      id: "carto-voyager-tiles",
      type: "raster",
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 20,
    };
  } else {
    sources["esri-satellite"] = {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, Maxar, Earthstar Geographics",
    };
    basemapLayer = {
      id: "satellite-tiles",
      type: "raster",
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 19,
    };
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
        "hillshade-highlight-color": mode === "satellite" ? "#ffffff" : "#ffffff",
        "hillshade-accent-color": mode === "satellite" ? "#475569" : "#52525b",
        "hillshade-exaggeration": 0.85,
      },
    });
  }

  const styleObj: any = {
    version: 8,
    sources,
    layers,
  };

  if (enable3D) {
    styleObj.terrain = {
      source: "terrain-dem",
      exaggeration: exaggeration,
    };
  }

  return styleObj;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thoughts?: string[];
  activeTasks?: string[];
  geojson?: any;
  timestamp: string;
}

function sanitizeLlmContent(text: string): string {
  if (!text) return "";
  // Remove unwanted triple asterisks and clean formatting
  return text.replace(/\*\*\*/g, "**").trim();
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "visitor";

  const [mounted, setMounted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [threadId, setThreadId] = useState<string>("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentThoughts, setCurrentThoughts] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeGeojson, setActiveGeojson] = useState<any>(null);

  // Basemap & 3D Terrain State
  const [activeMapMode, setActiveMapMode] = useState<"dark" | "voyager" | "satellite">("dark");
  const [enable3DTerrain, setEnable3DTerrain] = useState<boolean>(true);
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(2.2);

  // Initial 3D ViewState centered over Arabian Sea
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

    let greetingRole = "Mission Operator";
    if (roleParam === "researcher") greetingRole = "Marine Researcher";
    if (roleParam === "learner") greetingRole = "Oceanography Student";
    if (roleParam === "navigator") greetingRole = "Fleet Navigator";

    setMessages([
      {
        id: "msg_welcome",
        role: "assistant",
        content: `### 🐬 Welcome, ${greetingRole} — Project ORCA (SIH26176)
**India's Sovereign Multi-Agent Marine Intelligence & Navigation Platform.**

- Click anywhere on the **3D Elevation & Bathymetry Radar** to lock target coordinates.
- Multi-scale telemetry active: **SST, Wave Spectrum, Chlorophyll Fronts, A* Vector Pathing & IMBL Geofencing**.
- Local **Qwen 2.5 7B & BGE-M3** swarm running 100% on-premise.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [roleParam]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThoughts]);

  const handleMapClick = (info: any) => {
    if (info && info.coordinate) {
      const [lon, lat] = info.coordinate;
      setSelectedCoordinates([Number(lon.toFixed(4)), Number(lat.toFixed(4))]);
    }
  };

  const handleResetView = () => {
    setViewState({
      longitude: 70.368,
      latitude: 20.902,
      zoom: 5.8,
      pitch: enable3DTerrain ? 55 : 0,
      bearing: 15,
    });
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
    setViewState({
      longitude: coords[0],
      latitude: coords[1],
      zoom: 7.2,
      pitch: 55,
      bearing: 20,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || isStreaming) return;

    const targetCoords = selectedCoordinates
      ? [selectedCoordinates[1], selectedCoordinates[0]]
      : null;

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
        body: JSON.stringify({
          message: query,
          thread_id: threadId,
          target_coordinates: targetCoords,
        }),
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
                    if (existing) {
                      return prev.map((m) => (m.id === assistantMsgId ? { ...m, content: sanitizeLlmContent(accumulatedContent) } : m));
                    } else {
                      return [
                        ...prev,
                        {
                          id: assistantMsgId,
                          role: "assistant",
                          content: sanitizeLlmContent(accumulatedContent),
                          timestamp: new Date().toLocaleTimeString(),
                        },
                      ];
                    }
                  });
                } else if (data.type === "complete") {
                  if (data.geojson) {
                    setActiveGeojson(data.geojson);
                  }
                }
              } catch (parseErr) {
                console.error("SSE Parse Error", parseErr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/agent/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: query,
            thread_id: threadId,
            target_coordinates: targetCoords,
          }),
        });
        const data = await res.json();
        const responsePayload = data.response || {};
        accumulatedContent = sanitizeLlmContent(responsePayload.markdown_advisory || "Advisory generated successfully.");
        const geojsonPayload = responsePayload.geojson_payload;
        if (geojsonPayload) setActiveGeojson(geojsonPayload);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: accumulatedContent,
            geojson: geojsonPayload,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } catch (fallbackErr: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: `⚠️ Error connecting to Project ORCA backend at ${API_BASE}. Make sure the FastAPI server is running.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } finally {
      setIsStreaming(false);
      setCurrentThoughts([]);
    }
  };

  const layers: any[] = [];

  if (selectedCoordinates) {
    layers.push(
      new ScatterplotLayer({
        id: "selected-target-layer",
        data: [{ position: selectedCoordinates }],
        getPosition: (d: any) => d.position,
        getFillColor: [255, 255, 255, 240], // Pure White Indicator
        getLineColor: [255, 255, 255, 255],
        getRadius: 16000,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
      })
    );
  }

  if (activeGeojson && activeGeojson.features) {
    layers.push(
      new GeoJsonLayer({
        id: "active-orca-geojson-layer",
        data: activeGeojson,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: true,
        lineWidthMinPixels: 4,
        getLineColor: (f: any) => {
          if (f.geometry?.type === "LineString") {
            return [255, 255, 255, 255]; // High-contrast White / Cyan route
          }
          return [244, 63, 94, 255]; // Border Red
        },
        getFillColor: (f: any) => {
          if (f.properties?.type === "origin_node") return [255, 255, 255, 255];
          if (f.properties?.target_species) return [52, 211, 153, 220]; // PFZ Green
          return [244, 63, 94, 120];
        },
        getPointRadius: (f: any) => (f.properties?.target_species ? 14000 : 8000),
        pointRadiusMinPixels: 6,
      })
    );
  }

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white font-mono">
        <Compass className="h-8 w-8 animate-spin" />
        <span className="ml-3">Loading Project ORCA 3D Marine Radar...</span>
      </div>
    );
  }

  const currentMapStyle = buildMapStyle(activeMapMode, enable3DTerrain, terrainExaggeration);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-black text-white font-sans">
      {/* ===================================================================== */}
      {/* RETRACTABLE LEFT PANEL: CHAT & MULTI-AGENT ADVISORY INTERFACE        */}
      {/* ===================================================================== */}
      <div
        className={`relative z-20 flex flex-col border-r border-white/10 bg-zinc-950/95 backdrop-blur-2xl transition-all duration-300 ${
          isChatOpen ? "w-full md:w-[400px] lg:w-[450px]" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        {/* Top Header */}
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
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Multi-Agent Marine Swarm</p>
            </div>
          </div>

          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-lg bg-black border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Collapse Panel for Fullscreen 3D View"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Preset Query Quick Actions */}
        <div className="border-b border-white/10 p-2.5 bg-black/60 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
            ⚡ Quick Tactical Scenarios
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() =>
                handlePresetClick(
                  "Can 4 mechanized boats fish 30km off Veraval for Tuna?",
                  [70.368, 20.902]
                )
              }
              className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-left text-[11px] text-zinc-200 transition cursor-pointer"
            >
              <div className="font-bold flex items-center gap-1">
                <Fish className="h-3 w-3 text-white" />
                <span>Veraval Tuna</span>
              </div>
              <span className="text-[9px] text-zinc-500 truncate block">PFZ Thermal Front</span>
            </button>

            <button
              onClick={() =>
                handlePresetClick(
                  "Am I crossing the Sri Lanka IMBL boundary near Rameswaram?",
                  [79.315, 9.285]
                )
              }
              className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-left text-[11px] text-zinc-200 transition cursor-pointer"
            >
              <div className="font-bold flex items-center gap-1">
                <Shield className="h-3 w-3 text-rose-400" />
                <span>IMBL Alert</span>
              </div>
              <span className="text-[9px] text-zinc-500 truncate block">Border Standoff</span>
            </button>
          </div>
        </div>

        {/* Chat Message History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role !== "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-white/10 text-white text-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white text-black rounded-br-none font-medium shadow-md shadow-white/10"
                    : "bg-zinc-900/90 text-zinc-200 border border-white/10 rounded-bl-none shadow-md"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="orca-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                <div className="mt-1.5 text-[9px] text-zinc-500 text-right">{msg.timestamp}</div>
              </div>

              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 text-xs">
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
                  <p key={idx} className="text-[11px] font-mono text-zinc-400">
                    {t}
                  </p>
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
                <span>Target Locked: <strong>[{selectedCoordinates[1]}, {selectedCoordinates[0]}]</strong></span>
              </div>
              <button
                onClick={() => setSelectedCoordinates(null)}
                className="text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                title="Clear locked coordinate"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                selectedCoordinates
                  ? "Ask about locked coordinate (PFZ, Fuel route, IMBL)..."
                  : "Click on map to lock coordinates or type query..."
              }
              disabled={isStreaming}
              className="flex-1 rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black transition disabled:opacity-40 font-medium cursor-pointer shadow-lg shadow-white/10"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Toggle when Left Panel is Closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="absolute top-4 left-4 z-30 flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/90 border border-white/20 text-white shadow-2xl backdrop-blur-md transition cursor-pointer hover:bg-zinc-900"
          title="Expand Tactical Advisory Panel"
        >
          <PanelLeftOpen className="h-5 w-5" />
          <span className="text-xs font-bold font-mono">TACTICAL PANEL</span>
        </button>
      )}

      {/* ===================================================================== */}
      {/* 3D RADAR MAP CANVAS (FULLSCREEN / RESPONSIVE)                          */}
      {/* ===================================================================== */}
      <div className="relative flex-1 h-full w-full bg-black">
        {/* Floating Top Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2.5">
          {selectedCoordinates && (
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-zinc-950/90 px-3 py-1.5 shadow-xl backdrop-blur-md text-white text-xs font-mono font-semibold">
              <MapPin className="h-4 w-4" />
              <span>{selectedCoordinates[1]}°N, {selectedCoordinates[0]}°E</span>
            </div>
          )}

          {/* Style Mode Switcher */}
          <div className="flex rounded-xl border border-white/15 bg-zinc-950/90 p-1 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setActiveMapMode("dark")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeMapMode === "dark" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Navigation className="h-3 w-3" />
              <span>Dark Matter</span>
            </button>
            <button
              onClick={() => setActiveMapMode("voyager")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeMapMode === "voyager" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Compass className="h-3 w-3" />
              <span>Voyager</span>
            </button>
            <button
              onClick={() => setActiveMapMode("satellite")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeMapMode === "satellite" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Satellite</span>
            </button>
          </div>

          {/* 3D Terrain Toggle */}
          <button
            onClick={() => setEnable3DTerrain(!enable3DTerrain)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-zinc-950/90 text-[11px] font-semibold shadow-xl backdrop-blur-md transition cursor-pointer ${
              enable3DTerrain ? "text-white border-white/40 bg-zinc-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Mountain className="h-3.5 w-3.5" />
            <span>3D Terrain {enable3DTerrain ? "ON" : "OFF"}</span>
          </button>

          {/* 2D / 3D Perspective Tilt Switcher */}
          <button
            onClick={handleTogglePerspective}
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-white/15 bg-zinc-950/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Toggle 2D Flat / 3D Perspective Tilt"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleResetView}
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-white/15 bg-zinc-950/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-zinc-950/90 p-3.5 shadow-2xl backdrop-blur-md text-[11px] text-zinc-300">
          <div className="font-bold text-white flex items-center gap-1.5 mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Map Layers Legend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950"></span>
            <span>Potential Fishing Zones (PFZ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded bg-white"></span>
            <span>Fuel-Optimal Current Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded bg-rose-500"></span>
            <span>IMBL Sovereign Border (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-zinc-700"></span>
            <span>Target Mesh Lock</span>
          </div>
        </div>

        <DeckGL
          viewState={viewState}
          onViewStateChange={(e: any) => setViewState(e.viewState)}
          controller={true}
          layers={layers}
          onClick={handleMapClick}
          getCursor={({ isHovering }) => (isHovering ? "pointer" : "crosshair")}
          style={{ width: "100%", height: "100%" }}
        >
          <Map
            mapLib={maplibregl}
            mapStyle={currentMapStyle}
            reuseMaps={true}
            attributionControl={false}
            terrain={
              enable3DTerrain
                ? { source: "terrain-dem", exaggeration: terrainExaggeration }
                : undefined
            }
          />
        </DeckGL>
      </div>
    </div>
  );
}

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
