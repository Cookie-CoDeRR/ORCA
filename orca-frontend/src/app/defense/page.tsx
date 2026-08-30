"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, GeoJsonLayer } from "@deck.gl/layers";
import Map from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ShieldAlert,
  Send,
  Trash2,
  Compass,
  Radio,
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
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle,
  Activity,
  Radar,
  Crosshair,
  Wifi,
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

function buildDefenseMapStyle(): any {
  return {
    version: 8,
    sources: {
      "carto-dark": {
        type: "raster",
        tiles: [
          `https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
          `https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
          `https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
          `https://d.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png?key=${CARTO_API_KEY}`,
        ],
        tileSize: 256,
        attribution: "© CARTO, © OpenStreetMap contributors",
      },
      "terrain-dem": TERRAIN_DEM_SOURCE,
    },
    terrain: {
      source: "terrain-dem",
      exaggeration: 2.2,
    },
    layers: [
      {
        id: "carto-dark-tiles",
        type: "raster",
        source: "carto-dark",
        minzoom: 0,
        maxzoom: 20,
      },
      {
        id: "hillshade-relief",
        type: "hillshade",
        source: "terrain-dem",
        minzoom: 0,
        maxzoom: 18,
        paint: {
          "hillshade-shadow-color": "#050000",
          "hillshade-highlight-color": "#f43f5e",
          "hillshade-accent-color": "#9f1239",
          "hillshade-exaggeration": 0.85,
        },
      },
    ],
  };
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

export default function DefenseDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [threadId, setThreadId] = useState<string>("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentThoughts, setCurrentThoughts] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeGeojson, setActiveGeojson] = useState<any>(null);

  const [viewState, setViewState] = useState({
    longitude: 68.45,
    latitude: 23.25,
    zoom: 6.5,
    pitch: 50,
    bearing: 20,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem("orca_user_role");
    if (role !== "defense") {
      // Allow access for testing, but show security badge
      localStorage.setItem("orca_user_role", "defense");
    }

    const savedThread = localStorage.getItem("orca_defense_thread_id") || uuidv4();
    localStorage.setItem("orca_defense_thread_id", savedThread);
    setThreadId(savedThread);

    setMessages([
      {
        id: "msg_defense_init",
        role: "assistant",
        content: `### 🛡️ PROJECT ORCA — RESTRICTED DEFENSE COMMAND
**Sovereign Coast Guard & Naval Maritime Surveillance Sector.**

- **Active Border Grid:** Sir Creek & Pakistan IMBL Buffer Standoff.
- **Surveillance Nodes:** Electronic AIS + PostGIS Geofence Triggers.
- **Classification:** RESTRICTED / AIR-GAPPED ON-PREMISE.

Click any border coordinate or run tactical intercept simulations below.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThoughts]);

  const handleMapClick = (info: any) => {
    if (info && info.coordinate) {
      const [lon, lat] = info.coordinate;
      setSelectedCoordinates([Number(lon.toFixed(4)), Number(lat.toFixed(4))]);
    }
  };

  const handlePresetClick = (query: string, coords: [number, number]) => {
    setInputMessage(query);
    setSelectedCoordinates(coords);
    setViewState({
      longitude: coords[0],
      latitude: coords[1],
      zoom: 7.5,
      pitch: 55,
      bearing: 25,
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
    setCurrentThoughts(["[DEFENSE NODE] Executing PostGIS border geofence & drift projection..."]);

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
                console.error("SSE Parse Error", parseErr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      // Fallback
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
        accumulatedContent = responsePayload.markdown_advisory || "Tactical advisory compiled.";
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
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: "⚠️ Tactical Backend Connection Error. Confirm backend running on port 8000.",
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
        id: "defense-target-cursor",
        data: [{ position: selectedCoordinates }],
        getPosition: (d: any) => d.position,
        getFillColor: [244, 63, 94, 240], // Crimson Red
        getLineColor: [255, 255, 255, 255],
        getRadius: 14000,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
      })
    );
  }

  if (activeGeojson && activeGeojson.features) {
    layers.push(
      new GeoJsonLayer({
        id: "defense-active-geojson",
        data: activeGeojson,
        pickable: true,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 4,
        getLineColor: (f: any) => [244, 63, 94, 255],
        getFillColor: (f: any) => [244, 63, 94, 140],
        getPointRadius: 10000,
      })
    );
  }

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-rose-400 font-mono">
        <ShieldAlert className="h-8 w-8 animate-spin" />
        <span className="ml-3">Authorizing Classified Defense Deck...</span>
      </div>
    );
  }

  const defenseMapStyle = buildDefenseMapStyle();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-black text-white font-sans">
      {/* ===================================================================== */}
      {/* RETRACTABLE LEFT PANEL: TACTICAL CHAT & SURVEILLANCE FEED             */}
      {/* ===================================================================== */}
      <div
        className={`relative z-20 flex flex-col border-r border-rose-500/30 bg-zinc-950/95 backdrop-blur-2xl transition-all duration-300 ${
          isChatOpen ? "w-full md:w-[420px] lg:w-[460px]" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-500/30 px-4 py-3 bg-rose-950/40">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-black border border-rose-500/40 text-rose-300 hover:text-white transition"
              title="Return to Mission Overview"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-lg shadow-rose-950">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-wide text-rose-300">DEFENSE COMMAND</h1>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/50">
                  CLASSIFIED
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">PostGIS Standoff & Intercept</p>
            </div>
          </div>

          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-lg bg-black border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Collapse Panel for Fullscreen Radar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Defense Tactical Quick Presets */}
        <div className="border-b border-rose-500/20 p-2.5 bg-black/60 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400/90 px-1 flex items-center gap-1.5">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Classified Tactical Scenarios</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() =>
                handlePresetClick(
                  "URGENT: Unidentified vessel drifting near 23.15 N, 68.20 E. Calculate current drift vector and check time to Pakistan IMBL crossing.",
                  [68.20, 23.15]
                )
              }
              className="p-2 rounded-xl border border-rose-500/30 bg-rose-950/30 hover:bg-rose-950/60 text-left text-[11px] text-rose-200 transition cursor-pointer"
            >
              <div className="font-bold flex items-center gap-1">
                <Crosshair className="h-3 w-3 text-rose-400" />
                <span>Sir Creek IMBL</span>
              </div>
              <span className="text-[9px] text-zinc-400 truncate block">Drift Intercept Vector</span>
            </button>

            <button
              onClick={() =>
                handlePresetClick(
                  "Palk Strait Surveillance: Verify distance to Sri Lanka IMBL boundary at 9.28 N, 79.31 E and check No-Trawl Marine Sanctuary compliance.",
                  [79.315, 9.285]
                )
              }
              className="p-2 rounded-xl border border-rose-500/30 bg-rose-950/30 hover:bg-rose-950/60 text-left text-[11px] text-rose-200 transition cursor-pointer"
            >
              <div className="font-bold flex items-center gap-1">
                <Radar className="h-3 w-3 text-rose-400" />
                <span>Palk Strait Alert</span>
              </div>
              <span className="text-[9px] text-zinc-400 truncate block">Sanctuary Standoff</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role !== "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-rose-600 text-white rounded-br-none shadow-md shadow-rose-950/50 font-medium"
                    : "bg-black/90 text-zinc-200 border border-rose-500/30 rounded-bl-none shadow-md"
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
            </div>
          ))}

          {isStreaming && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 text-xs text-rose-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <Radar className="h-3.5 w-3.5 animate-spin" />
                <span>Defense Swarm Intercept Processing...</span>
              </div>
              <div className="space-y-1 pl-4 border-l border-rose-500/30">
                {currentThoughts.map((t, i) => (
                  <p key={i} className="text-[11px] font-mono text-zinc-300">{t}</p>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-rose-500/30 bg-black p-3">
          {selectedCoordinates && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-rose-500/40 bg-rose-950/40 px-2.5 py-1 text-[11px] text-rose-300">
              <div className="flex items-center gap-1.5">
                <Crosshair className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                <span>Target Locked: <strong>[{selectedCoordinates[1]}, {selectedCoordinates[0]}]</strong></span>
              </div>
              <button
                onClick={() => setSelectedCoordinates(null)}
                className="text-zinc-400 hover:text-rose-400 transition cursor-pointer"
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
              placeholder="Enter classified border standoff or vessel tracking query..."
              disabled={isStreaming}
              className="flex-1 rounded-xl border border-rose-500/30 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-40 cursor-pointer shadow-lg shadow-rose-950/40"
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
          className="absolute top-4 left-4 z-30 flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/90 border border-rose-500/40 text-rose-300 hover:text-white shadow-2xl backdrop-blur-md transition cursor-pointer"
          title="Expand Defense Tactical Panel"
        >
          <PanelLeftOpen className="h-5 w-5 text-rose-400" />
          <span className="text-xs font-bold font-mono">TACTICAL BRIEFING</span>
        </button>
      )}

      {/* ===================================================================== */}
      {/* 3D DEFENSE RADAR MAP (FULLSCREEN / RESPONSIVE)                         */}
      {/* ===================================================================== */}
      <div className="relative flex-1 h-full w-full bg-black">
        {/* Floating Top Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-zinc-950/90 px-3.5 py-2 shadow-2xl backdrop-blur-md text-xs font-mono text-rose-300">
            <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
            <span>SOVEREIGN BORDER RADAR</span>
          </div>

          <button
            onClick={() =>
              setViewState({
                longitude: 68.45,
                latitude: 23.25,
                zoom: 6.5,
                pitch: 50,
                bearing: 20,
              })
            }
            className="p-2 rounded-xl border border-white/10 bg-zinc-950/90 text-zinc-400 hover:text-white shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Reset to Pakistan IMBL Sector"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5 rounded-2xl border border-rose-500/30 bg-zinc-950/90 p-3.5 shadow-2xl backdrop-blur-md text-[11px] text-zinc-300">
          <div className="font-bold text-rose-400 flex items-center gap-1.5 mb-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Defense Layer Identifiers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded bg-rose-500"></span>
            <span>IMBL Sovereign Border (Red Standoff)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
            <span>Hostile / Drifting Vessel Intercept Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span>Coast Guard Patrol Anchor</span>
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
            mapStyle={defenseMapStyle}
            reuseMaps={true}
            attributionControl={false}
          />
        </DeckGL>
      </div>
    </div>
  );
}
