"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
} from "lucide-react";

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || "cb1_2dhp_1_9403bbcac732699b29121f7e";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// AWS Open Data Global DEM & Ocean Bathymetry Terrarium Tiles
const TERRAIN_DEM_SOURCE = {
  type: "raster-dem",
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  tileSize: 256,
  encoding: "terrarium",
  maxzoom: 15,
};

// Builder function for Dynamic 3D Terrain & Hillshade Basemap Styles
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
        "hillshade-highlight-color": mode === "satellite" ? "#ffffff" : "#38bdf8",
        "hillshade-accent-color": mode === "satellite" ? "#475569" : "#0284c7",
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

export default function OrcaDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [threadId, setThreadId] = useState<string>("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null); // [lon, lat]
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentThoughts, setCurrentThoughts] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeGeojson, setActiveGeojson] = useState<any>(null);
  
  // Basemap & 3D Terrain State
  const [activeMapMode, setActiveMapMode] = useState<"dark" | "voyager" | "satellite">("dark");
  const [enable3DTerrain, setEnable3DTerrain] = useState<boolean>(true);
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(2.2);

  // Initial 2.5D / 3D ViewState centered over Arabian Sea & Indian EEZ
  const [viewState, setViewState] = useState({
    longitude: 70.368,
    latitude: 20.902,
    zoom: 5.8,
    pitch: 55, // 55° pitch for high-impact 3D terrain elevation
    bearing: 15,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedThread = localStorage.getItem("orca_thread_id") || uuidv4();
    localStorage.setItem("orca_thread_id", savedThread);
    setThreadId(savedThread);

    setMessages([
      {
        id: "msg_welcome",
        role: "assistant",
        content: `### 🐬 Welcome to Project ORCA (SIH26176)
**India's Sovereign Multi-Agent Marine Intelligence & Fuel-Optimal Navigation Engine.**

1. Click anywhere on the **3D Bathymetry & Elevation Radar** to lock a target coordinate.
2. Ask any fishing, boundary risk, monsoon regulation, or fuel routing inquiry below.
3. Watch the local **Qwen 2.5 7B & BGE-M3** multi-agent swarm execute in real time.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThoughts]);

  // Map Click to Lock Target Coordinates
  const handleMapClick = (info: any) => {
    if (info && info.coordinate) {
      const [lon, lat] = info.coordinate;
      setSelectedCoordinates([Number(lon.toFixed(4)), Number(lat.toFixed(4))]);
    }
  };

  // Reset Camera View
  const handleResetView = () => {
    setViewState({
      longitude: 70.368,
      latitude: 20.902,
      zoom: 5.8,
      pitch: enable3DTerrain ? 55 : 0,
      bearing: 15,
    });
  };

  // Toggle 2D Flat vs 3D Perspective Pitch
  const handleTogglePerspective = () => {
    setViewState((prev) => ({
      ...prev,
      pitch: prev.pitch > 20 ? 0 : 55,
      bearing: prev.pitch > 20 ? 0 : 15,
    }));
  };

  // Preset Scenario Inquiries
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

  // Submit Chat Query
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || isStreaming) return;

    // Convert [lon, lat] to [lat, lon] for backend API schema
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

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

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
                      return prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m));
                    } else {
                      return [
                        ...prev,
                        {
                          id: assistantMsgId,
                          role: "assistant",
                          content: accumulatedContent,
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
                console.error("SSE JSON Parse Error", parseErr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("Falling back to standard chat API:", err);
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
        accumulatedContent = responsePayload.markdown_advisory || "Advisory generated successfully.";
        const geojsonPayload = responsePayload.geojson_payload;
        if (geojsonPayload) {
          setActiveGeojson(geojsonPayload);
        }
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

  // ============================================================================
  // DECK.GL LAYERS
  // ============================================================================
  const layers: any[] = [];

  // 1. Target Locked Cursor Glow Layer
  if (selectedCoordinates) {
    layers.push(
      new ScatterplotLayer({
        id: "selected-target-layer",
        data: [{ position: selectedCoordinates }],
        getPosition: (d: any) => d.position,
        getFillColor: [0, 240, 255, 240], // Electric Cyan
        getLineColor: [255, 255, 255, 255],
        getRadius: 16000,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
      })
    );
  }

  // 2. Active AI GeoJSON Layer (PFZ Points, Optimal Routes, Sanctuary Polygons)
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
            return [34, 197, 94, 255]; // Fuel-optimal route green
          }
          return [244, 63, 94, 255]; // Border/Risk red
        },
        getFillColor: (f: any) => {
          if (f.properties?.type === "origin_node") return [56, 189, 248, 255];
          if (f.properties?.target_species) return [16, 185, 129, 220]; // PFZ Green
          return [244, 63, 94, 120];
        },
        getPointRadius: (f: any) => (f.properties?.target_species ? 14000 : 8000),
        pointRadiusMinPixels: 6,
      })
    );
  }

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#060913] text-sky-400 font-mono">
        <Compass className="h-8 w-8 animate-spin" />
        <span className="ml-3">Loading Project ORCA 3D Marine Radar...</span>
      </div>
    );
  }

  // Generate the active MapLibre Style Specification
  const currentMapStyle = buildMapStyle(activeMapMode, enable3DTerrain, terrainExaggeration);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060913] text-slate-100 font-sans">
      {/* ===================================================================== */}
      {/* LEFT PANEL: THE CHAT & MULTI-AGENT ADVISORY INTERFACE (30% Width)     */}
      {/* ===================================================================== */}
      <div className="flex w-full md:w-[380px] lg:w-[440px] flex-col border-r border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-[#0d1424]">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-sky-400 transition"
              title="Return to Mission Overview"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-400 shadow-md shadow-sky-950">
              <Compass className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-wide text-sky-400">PROJECT ORCA</h1>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">SIH26176</span>
              </div>
              <p className="text-[10px] text-slate-400">Multi-Agent Marine Swarm</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider">AIR-GAPPED</span>
          </div>
        </div>

        {/* Preset Query Quick Actions */}
        <div className="border-b border-slate-800/60 p-2.5 bg-[#080d1a] space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
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
              className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/40 px-2.5 py-1.5 text-left text-[11px] text-sky-300 hover:bg-sky-900/60 transition cursor-pointer"
            >
              <Fish className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              <span className="truncate">Veraval Tuna PFZ</span>
            </button>

            <button
              onClick={() =>
                handlePresetClick(
                  "Am I crossing the Sri Lanka IMBL boundary near Rameswaram?",
                  [79.315, 9.285]
                )
              }
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/40 px-2.5 py-1.5 text-left text-[11px] text-rose-300 hover:bg-rose-900/60 transition cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span className="truncate">IMBL Border Alert</span>
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-sky-600 text-white rounded-br-none shadow-md shadow-sky-900/30"
                    : "bg-[#0f172a]/95 text-slate-200 border border-slate-800/90 rounded-bl-none shadow-md"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                ) : (
                  <div className="orca-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                <div className="mt-1.5 text-[9px] text-slate-400/80 text-right">{msg.timestamp}</div>
              </div>

              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-slate-300 text-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Real-time Thought Process Streaming Badge */}
          {isStreaming && (
            <div className="flex flex-col gap-1.5 rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 text-xs text-sky-300">
              <div className="flex items-center gap-2 font-semibold text-sky-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Multi-Agent Thought Stream</span>
              </div>
              <div className="space-y-1 pl-5 border-l border-sky-500/20">
                {currentThoughts.map((t, idx) => (
                  <p key={idx} className="text-[11px] font-mono text-slate-300 leading-tight">
                    {t}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar & Coordinate Badge */}
        <div className="border-t border-slate-800/80 bg-[#0c1220] p-3">
          {/* Target Locked Pill */}
          {selectedCoordinates && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 text-[11px] text-cyan-300 shadow-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-cyan-400 animate-bounce" />
                <span>
                  Target Locked: <strong>[{selectedCoordinates[1]}, {selectedCoordinates[0]}]</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedCoordinates(null)}
                className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
              className="flex-1 rounded-lg border border-slate-700/80 bg-[#050811] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="flex items-center justify-center rounded-lg bg-sky-600 px-3.5 py-2 text-white hover:bg-sky-500 disabled:opacity-40 transition font-medium shadow-md shadow-sky-900/30 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RIGHT PANEL: THE INTERACTIVE DECK.GL 2.5D / 3D MAP (70% Width)        */}
      {/* ===================================================================== */}
      <div className="relative flex-1 h-full w-full bg-[#060913]">
        {/* Floating Top Controls */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0d1424]/90 px-3.5 py-2 shadow-xl backdrop-blur-md">
            <Waves className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-200">
              Indian Ocean 3D Radar
            </span>
          </div>

          {selectedCoordinates && (
            <div className="flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-cyan-950/80 px-3 py-2 shadow-xl backdrop-blur-md text-cyan-300 text-xs font-mono font-semibold">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span>
                {selectedCoordinates[1]}°N, {selectedCoordinates[0]}°E
              </span>
            </div>
          )}

          {/* Style Mode Switcher */}
          <div className="flex rounded-xl border border-slate-800 bg-[#0d1424]/90 p-1 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setActiveMapMode("dark")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeMapMode === "dark" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Navigation className="h-3 w-3" />
              <span>Dark Matter</span>
            </button>
            <button
              onClick={() => setActiveMapMode("voyager")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeMapMode === "voyager" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Compass className="h-3 w-3" />
              <span>Voyager Chart</span>
            </button>
            <button
              onClick={() => setActiveMapMode("satellite")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeMapMode === "satellite" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Satellite</span>
            </button>
          </div>

          {/* 3D Terrain Toggle */}
          <button
            onClick={() => setEnable3DTerrain(!enable3DTerrain)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-[#0d1424]/90 text-[11px] font-semibold shadow-xl backdrop-blur-md transition cursor-pointer ${
              enable3DTerrain ? "text-cyan-300 border-cyan-500/50 bg-cyan-950/60" : "text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle 3D Terrain Elevation"
          >
            <Mountain className="h-3.5 w-3.5 text-cyan-400" />
            <span>3D Terrain {enable3DTerrain ? "ON" : "OFF"}</span>
          </button>

          {/* 2D / 3D Perspective Tilt Switcher */}
          <button
            onClick={handleTogglePerspective}
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-800 bg-[#0d1424]/90 text-slate-400 hover:text-sky-400 shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Toggle 2D Flat / 3D Perspective Tilt"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleResetView}
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-800 bg-[#0d1424]/90 text-slate-400 hover:text-sky-400 shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Legend Card */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5 rounded-xl border border-slate-800 bg-[#0d1424]/90 p-3.5 shadow-2xl backdrop-blur-md text-[11px] text-slate-300">
          <div className="font-bold text-sky-400 flex items-center gap-1.5 mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Map Layers Legend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-950"></span>
            <span>Potential Fishing Zones (PFZ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded bg-emerald-400"></span>
            <span>Fuel-Optimal Current Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded bg-rose-500"></span>
            <span>IMBL Sovereign Border (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-white"></span>
            <span>Target Mesh Lock</span>
          </div>
        </div>

        {/* DeckGL & MapLibre Canvas with 3D Terrain */}
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
