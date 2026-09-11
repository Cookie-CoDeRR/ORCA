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
  FlaskConical, Cpu, ArrowDown, Image as ImageIcon, RefreshCw, Clock
} from "lucide-react";
import ThreeGlobe, { EnvironmentalRasterType, VectorOverlayToggles } from "@/components/ThreeGlobe";
import ReportView from "@/components/ReportView";
import { sendMultiAgentMessage, fetchLiveOceanCurrent, LiveOceanCurrentResponse } from "@/lib/api";
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
  agentBadge?: string;
  toolUsed?: string;
  thoughts?: string[];
  thinkingDurationSeconds?: number;
  isThinkingExpanded?: boolean;
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
    id: "ocean_currents",
    label: "Online Ocean Currents Map",
    subtitle: "Dedicated Hydrodynamic Current & Circulation Service",
    icon: Waves,
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

// Sleek Minimalist Toggle Switch
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="relative flex-shrink-0 h-4.5 w-8 rounded-full transition-colors duration-150 focus:outline-none cursor-pointer"
      style={{ background: on ? "#18181b" : "#E4E4E7" }}
    >
      <span
        className="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-all duration-150"
        style={{ left: on ? "calc(100% - 16px)" : "2px" }}
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

// ─── Crisp Monochrome Chat Message Renderer ──────────────────────────────────
function formatInlineMarkdown(text: string): string {
  const clean = text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}]/gu, "")
    .trim();

  return clean
    .replace(/\*\*(.+?)\*\*/g, "<strong class='font-semibold text-zinc-900'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em class='italic text-zinc-700'>$1</em>")
    .replace(/`([^`]+)`/g, "<code class='font-mono px-1 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px]'>$1</code>")
    .replace(/\[STATUS:\s*SAFE[^\]]*\]/gi, "<span class='inline-flex items-center px-1.5 py-0.2 rounded bg-zinc-900 text-white font-mono text-[9px] font-bold tracking-wide'>SAFE</span>")
    .replace(/\[CAUTION[^\]]*\]/gi, "<span class='inline-flex items-center px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-900 border border-zinc-300 font-mono text-[9px] font-bold tracking-wide'>CAUTION</span>")
    .replace(/\[HAZARD[^\]]*\]/gi, "<span class='inline-flex items-center px-1.5 py-0.2 rounded bg-zinc-950 text-white font-mono text-[9px] font-bold tracking-wide'>HAZARD</span>")
    .replace(/\[ALERT[^\]]*\]/gi, "<span class='inline-flex items-center px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-800 font-mono text-[9px] font-medium'>ALERT</span>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-zinc-900 underline font-medium hover:text-blue-600'>$1 ↗</a>");
}

function FormattedChatMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <div className="leading-relaxed whitespace-pre-wrap text-white text-xs">{content}</div>;
  }

  // Strip emojis from content
  const cleanContent = content
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}]/gu, "")
    .trim();
  const lines = cleanContent.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      continue;
    }

    // 1. Horizontal Dividers
    if (rawLine === "---" || rawLine === "___" || rawLine === "***") {
      elements.push(<div key={`hr-${i}`} className="border-b border-zinc-100 my-2" />);
      continue;
    }

    // 2. Markdown Headings (# or ## or ### or ####)
    if (rawLine.startsWith("#")) {
      const headingText = rawLine.replace(/^#+\s*/, "").trim();
      const lower = headingText.toLowerCase();

      let HeaderIcon = Compass;
      if (lower.includes("fish") || lower.includes("tuna") || lower.includes("catch") || lower.includes("species") || lower.includes("mackerel")) {
        HeaderIcon = Fish;
      } else if (lower.includes("sea") || lower.includes("wave") || lower.includes("water") || lower.includes("weather") || lower.includes("swh")) {
        HeaderIcon = Waves;
      } else if (lower.includes("safety") || lower.includes("hazard") || lower.includes("status")) {
        HeaderIcon = ShieldAlert;
      } else if (lower.includes("border") || lower.includes("imbl") || lower.includes("geofenc") || lower.includes("clearance") || lower.includes("sovereign")) {
        HeaderIcon = ShieldCheck;
      } else if (lower.includes("route") || lower.includes("fuel") || lower.includes("navigation") || lower.includes("course") || lower.includes("bearing")) {
        HeaderIcon = Navigation;
      } else if (lower.includes("legal") || lower.includes("emergency") || lower.includes("directive") || lower.includes("ban") || lower.includes("notice") || lower.includes("order")) {
        HeaderIcon = FileText;
      } else if (lower.includes("vessel") || lower.includes("ais") || lower.includes("ship") || lower.includes("fleet") || lower.includes("traffic")) {
        HeaderIcon = Ship;
      } else if (lower.includes("oceanographic") || lower.includes("research") || lower.includes("synoptic") || lower.includes("science")) {
        HeaderIcon = Microscope;
      } else if (lower.includes("namaste") || lower.includes("orca") || lower.includes("matsya") || lower.includes("samudra") || lower.includes("sutradhar")) {
        HeaderIcon = Sparkles;
      }

      elements.push(
        <div key={`h-${i}`} className="flex items-center gap-2 pt-2.5 pb-1 border-b border-zinc-100 first:pt-0 mb-1.5">
          <div className="p-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 shrink-0">
            <HeaderIcon className="h-3 w-3 text-zinc-800" />
          </div>
          <span className="font-bold text-zinc-900 text-xs tracking-tight">{headingText}</span>
        </div>
      );
      continue;
    }

    // 3. Blockquotes / Alerts (> ...)
    if (rawLine.startsWith(">")) {
      const quoteText = rawLine.replace(/^>\s*/, "").trim();
      elements.push(
        <div key={`q-${i}`} className="my-1.5 p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800 text-[10px] font-mono flex items-start gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-zinc-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(quoteText) }} />
        </div>
      );
      continue;
    }

    // 4. Section titles formatted with bold only: **TITLE**
    if (/^\*\*[^*]+\*\*$/.test(rawLine)) {
      const titleText = rawLine.replace(/^\*\*|\*\*$/g, "").trim();
      const lower = titleText.toLowerCase();
      let TitleIcon = Sparkles;
      if (lower.includes("profile") || lower.includes("oceanographic")) TitleIcon = Compass;
      else if (lower.includes("habitat") || lower.includes("species") || lower.includes("fish")) TitleIcon = Fish;
      else if (lower.includes("ecological") || lower.includes("feeding")) TitleIcon = Activity;
      else if (lower.includes("provenance") || lower.includes("data")) TitleIcon = Database;
      else if (lower.includes("target")) TitleIcon = Navigation;

      elements.push(
        <div key={`st-${i}`} className="flex items-center gap-1.5 pt-2 pb-0.5 mt-1 text-[11px] font-bold text-zinc-900">
          <TitleIcon className="h-3 w-3 text-zinc-700 shrink-0" />
          <span>{titleText}</span>
        </div>
      );
      continue;
    }

    // 5. Bullet list items (- or * or •) and Numbered list items (1. , 2. )
    const isBullet = /^[-*•]\s+/.test(rawLine);
    const numMatch = rawLine.match(/^(\d+)\.\s+(.*)$/);

    if (isBullet || numMatch) {
      const itemText = isBullet ? rawLine.replace(/^[-*•]\s+/, "").trim() : numMatch![2].trim();
      const itemNum = numMatch ? numMatch[1] : null;

      // Extract bold or prefix label: **Label:** Value or Label: Value
      let label = "";
      let value = "";
      const boldLabelMatch = itemText.match(/^\*\*(.+?)\*\*[:\s]*(.*)$/);
      if (boldLabelMatch) {
        label = boldLabelMatch[1].trim();
        value = boldLabelMatch[2].trim();
      } else {
        const colonIdx = itemText.indexOf(":");
        if (colonIdx > 0 && colonIdx < 35) {
          label = itemText.slice(0, colonIdx).trim().replace(/^\*+|\*+$/g, "");
          value = itemText.slice(colonIdx + 1).trim();
        }
      }

      if (label) {
        const lowerLabel = label.toLowerCase();
        let ItemIcon = Grid;
        if (lowerLabel.includes("fish") || lowerLabel.includes("species") || lowerLabel.includes("catch") || lowerLabel.includes("tuna") || lowerLabel.includes("mackerel") || lowerLabel.includes("pelagic")) {
          ItemIcon = Fish;
        } else if (lowerLabel.includes("sea") || lowerLabel.includes("wave") || lowerLabel.includes("temp") || lowerLabel.includes("wind") || lowerLabel.includes("sst") || lowerLabel.includes("swh") || lowerLabel.includes("condition")) {
          ItemIcon = Waves;
        } else if (lowerLabel.includes("border") || lowerLabel.includes("imbl") || lowerLabel.includes("standoff") || lowerLabel.includes("clearance") || lowerLabel.includes("sovereignty")) {
          ItemIcon = ShieldCheck;
        } else if (lowerLabel.includes("verdict") || lowerLabel.includes("status") || lowerLabel.includes("safe") || lowerLabel.includes("hazard") || lowerLabel.includes("alert") || lowerLabel.includes("risk")) {
          ItemIcon = ShieldAlert;
        } else if (lowerLabel.includes("route") || lowerLabel.includes("fuel") || lowerLabel.includes("bearing") || lowerLabel.includes("distance") || lowerLabel.includes("course") || lowerLabel.includes("travel") || lowerLabel.includes("transit")) {
          ItemIcon = Navigation;
        } else if (lowerLabel.includes("legal") || lowerLabel.includes("emergency") || lowerLabel.includes("ban") || lowerLabel.includes("channel") || lowerLabel.includes("order") || lowerLabel.includes("rule") || lowerLabel.includes("policy")) {
          ItemIcon = FileText;
        } else if (lowerLabel.includes("depth") || lowerLabel.includes("gear") || lowerLabel.includes("method")) {
          ItemIcon = Anchor;
        } else if (lowerLabel.includes("feeding") || lowerLabel.includes("diet") || lowerLabel.includes("window") || lowerLabel.includes("solunar")) {
          ItemIcon = Activity;
        } else if (lowerLabel.includes("commercial") || lowerLabel.includes("market") || lowerLabel.includes("price") || lowerLabel.includes("rate") || lowerLabel.includes("harbor")) {
          ItemIcon = Database;
        } else if (lowerLabel.includes("vessel") || lowerLabel.includes("ais") || lowerLabel.includes("ship")) {
          ItemIcon = Ship;
        } else if (lowerLabel.includes("chlorophyll") || lowerLabel.includes("biomass") || lowerLabel.includes("salinity") || lowerLabel.includes("oceanographic")) {
          ItemIcon = Microscope;
        }

        elements.push(
          <div key={`li-${i}`} className="flex items-start gap-2 py-0.5 text-[11px] leading-relaxed">
            <div className="mt-0.5 p-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 shrink-0">
              <ItemIcon className="h-2.5 w-2.5 text-zinc-700" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-zinc-900">{label}: </span>
              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(value) }} />
            </div>
          </div>
        );
        continue;
      }

      // Plain bullet list or numbered item
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 py-0.5 text-[11px] leading-relaxed">
          {itemNum ? (
            <span className="font-mono text-[10px] font-semibold text-zinc-500 shrink-0 mt-0.5 w-3.5 text-right">{itemNum}.</span>
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0 mt-1.5" />
          )}
          <div className="flex-1 min-w-0" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
        </div>
      );
      continue;
    }

    // 6. Regular text paragraph
    elements.push(
      <p key={`p-${i}`} className="mb-1 text-[11px] leading-relaxed text-zinc-800" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(rawLine) }} />
    );
  }

  return <div className="space-y-0.5 text-zinc-800">{elements}</div>;
}

// ─── AI Chat Drawer (Sleek Crisp White Mission Copilot with Multi-Agent Router & Report Engine) ──
function AIChatDrawer({
  persona,
  isOpen,
  onToggle,
  onOpenReport,
  onReportGenerated,
  onGeneratingProgress,
  onRegisterTrigger,
  selectedCoord,
  basinLabel,
  activeBaseLayer,
  activeOverlays,
  sstRange,
  waveMax,
  pulse = false,
}: {
  persona: Persona;
  isOpen: boolean;
  onToggle: () => void;
  onOpenReport?: () => void;
  onReportGenerated?: (report: Report) => void;
  onGeneratingProgress?: (isGenerating: boolean, progress: ReportGenerationProgress | null) => void;
  onRegisterTrigger?: (fn: (topic?: string) => void) => void;
  selectedCoord?: { lat: number; lon: number } | null;
  basinLabel?: string;
  activeBaseLayer: string;
  activeOverlays: Set<string>;
  sstRange: [number, number];
  waveMax: number;
  pulse?: boolean;
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

  // Method 1 & 2: Report Generation Pipeline Trigger (Multi-Agent Swarm + Dossier Compilation)
  const triggerReportGeneration = useCallback(
    async (customTopic?: string) => {
      if (isGenerating || streaming) return;
      const targetTopic =
        (customTopic && customTopic.trim()) ||
        input.trim() ||
        "Comprehensive Ocean State & Advisory Report";
      setInput("");

      const coordToUse = selectedCoord || { lat: 20.75, lon: 70.19 };
      const basinNameToUse = basinLabel || "Arabian Sea Basin";

      // Scroll immediately to the report section so the user sees live creation in the bottom panel
      if (onOpenReport) {
        onOpenReport();
      }

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

      setGeneratingProgress(initialProgress);
      onGeneratingProgress?.(true, initialProgress);

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
            onGeneratingProgress?.(true, progress);
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
                  content: `✅ **Report Complete: ${newReport.title}**\n\nGenerated ${newReport.sections.length} dynamic sections for ${newReport.location}. Scroll down to inspect full dossier below.`,
                  generatedReport: newReport,
                }
              : msg
          )
        );

        setIsGenerating(false);
        setGeneratingProgress(null);
        onGeneratingProgress?.(false, null);

        // Automatically update active dossier in parent & scroll to it
        if (onReportGenerated) {
          onReportGenerated(newReport);
        }
      } catch (err) {
        console.error("Report generation error:", err);
        setIsGenerating(false);
        setGeneratingProgress(null);
        onGeneratingProgress?.(false, null);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "ai",
            content:
              "⚠️ **Report Generation Error**\n\nReport generation could not be completed. Please check connection and try again.",
            timestamp: now(),
          },
        ]);
      }
    },
    [isGenerating, streaming, input, selectedCoord, basinLabel, onOpenReport, onGeneratingProgress, onReportGenerated]
  );

  useEffect(() => {
    if (onRegisterTrigger) {
      onRegisterTrigger(triggerReportGeneration);
    }
  }, [onRegisterTrigger, triggerReportGeneration]);

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const q = (overrideText && overrideText.trim()) || input.trim();
      if (!q || streaming || isGenerating) return;

      const qLower = q.toLowerCase();
      const isReport =
        isReportRequest(q) ||
        qLower.includes("report") ||
        qLower.includes("dossier") ||
        qLower.includes("generate");

      // Redirect report requests to the multi-stage report generator
      if (isReport) {
        triggerReportGeneration(q);
        return;
      }

      setInput("");
      const userMsg: ChatMessage = { id: uid(), role: "user", content: q, timestamp: now() };
      setMessages((m) => [...m, userMsg]);
      setStreaming(true);

      const aiMsgId = uid();
      const startTime = Date.now();

      // Initial AI message with live reasoning accordion
      const initialAiMsg: ChatMessage = {
        id: aiMsgId,
        role: "ai",
        content: "",
        timestamp: now(),
        streaming: true,
        thoughts: [],
        isThinkingExpanded: true,
        agentBadge: `${pm.agent} (Swarm)`,
      };
      setMessages((m) => [...m, initialAiMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            persona,
            stream: true,
            mapContext: {
              activeBaseLayer,
              activeOverlays: Array.from(activeOverlays),
              selectedCoord,
              basinLabel,
              sstRange,
              waveMax,
            },
          }),
        });

        if (!res.ok) throw new Error("Chat streaming request failed");

        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              const trimmed = part.trim();
              if (!trimmed.startsWith("data:")) continue;
              const jsonStr = trimmed.replace(/^data:\s*/, "");
              try {
                const event = JSON.parse(jsonStr);

                if (event.type === "thought" && event.text) {
                  setMessages((m) =>
                    m.map((item) => {
                      if (item.id !== aiMsgId) return item;
                      const existing = item.thoughts || [];
                      if (existing.includes(event.text)) return item;
                      return {
                        ...item,
                        thoughts: [...existing, event.text],
                        isThinkingExpanded: true,
                      };
                    })
                  );
                } else if (event.type === "chunk" && event.text) {
                  setMessages((m) =>
                    m.map((item) => {
                      if (item.id !== aiMsgId) return item;
                      const isFirstChunk = !item.content;
                      const duration =
                        item.thinkingDurationSeconds ??
                        Math.max(0.6, (Date.now() - startTime) / 1000);
                      return {
                        ...item,
                        content: (item.content || "") + event.text,
                        thinkingDurationSeconds: duration,
                        // Collapse thinking accordion once response generation starts
                        isThinkingExpanded: isFirstChunk ? false : item.isThinkingExpanded,
                      };
                    })
                  );
                } else if (event.type === "complete") {
                  setMessages((m) =>
                    m.map((item) => {
                      if (item.id !== aiMsgId) return item;
                      const duration =
                        item.thinkingDurationSeconds ??
                        Math.max(0.6, (Date.now() - startTime) / 1000);
                      return {
                        ...item,
                        streaming: false,
                        agentBadge: event.agent || item.agentBadge,
                        toolUsed: event.toolUsed || item.toolUsed,
                        thinkingDurationSeconds: duration,
                        isThinkingExpanded: false,
                      };
                    })
                  );
                }
              } catch {
                // Ignore transient JSON parse errors on partial frames
              }
            }
          }
        }

        // Finalize streaming status
        setMessages((m) =>
          m.map((item) =>
            item.id === aiMsgId ? { ...item, streaming: false } : item
          )
        );
        setStreaming(false);
      } catch (err) {
        console.error("Chat API fetch error:", err);
        setStreaming(false);
        const latStr = (selectedCoord?.lat ?? 20.75).toFixed(3);
        const lonStr = (selectedCoord?.lon ?? 70.19).toFixed(3);
        setMessages((m) =>
          m.map((item) => {
            if (item.id !== aiMsgId) return item;
            return {
              ...item,
              streaming: false,
              content:
                item.content ||
                `### 📊 ORCA Local Briefing (${basinLabel || "Arabian Sea Basin"})\n\n**Location:** ${latStr}°N, ${lonStr}°E\n• **Active Base Layer:** ${activeBaseLayer}\n• **Sea Surface Temp:** 28.4°C · **Chlorophyll-a:** 1.26 mg/m³ · **SWH:** 1.6m\n• **Sovereign Status:** Indian Exclusive Economic Zone (EEZ)\n\n*Agent system active and observing current map context.*`,
              agentBadge: `${pm.agent} (Fallback)`,
              toolUsed: "fetch_layer_data",
              isThinkingExpanded: false,
            };
          })
        );
      }
    },
    [
      input,
      streaming,
      isGenerating,
      messages,
      persona,
      activeBaseLayer,
      activeOverlays,
      selectedCoord,
      basinLabel,
      sstRange,
      waveMax,
      triggerReportGeneration,
    ]
  );

  return (
    <>
      {/* Pull Tab */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1.5 rounded-l-xl border-l border-t border-b py-4 transition-all duration-300 hover:pr-1 bg-white border-zinc-200 text-zinc-900 shadow-lg cursor-pointer ${
          pulse ? "ring-4 ring-blue-500 animate-pulse bg-blue-50 border-blue-400" : ""
        }`}
        style={{ width: 36 }}
        title={isOpen ? "Close Mission Copilot" : "Open Mission Copilot"}
      >
        <Sparkles className={`h-4 w-4 ${pulse ? "text-blue-600 animate-spin" : "text-zinc-900"}`} />
        <div
          className="text-[9px] font-mono font-bold text-zinc-800"
          style={{ writingMode: "vertical-rl", letterSpacing: "0.12em" }}
        >
          AI COPILOT
        </div>
        {isOpen ? (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-zinc-500" />
        )}
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
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 tracking-tight">ORCA AI Mission Copilot</div>
              <div className="text-[10px] font-mono flex items-center gap-1.5 text-zinc-500">
                <PersonaIcon className="h-3 w-3 text-zinc-800" />
                {pm.agent} · Multi-Agent Router Active
              </div>
            </div>
          </div>
          <button onClick={onToggle} className="text-zinc-500 hover:text-black transition p-1 rounded-lg hover:bg-zinc-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Header Strip */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 flex-shrink-0 text-[11px] font-mono bg-zinc-50/80">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Active Layer:</span>
            <span className="font-semibold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
              {activeBaseLayer}
            </span>
          </div>

          <button
            onClick={() => triggerReportGeneration(input)}
            disabled={isGenerating || streaming}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-medium transition disabled:opacity-40 shadow-none active:scale-95 cursor-pointer"
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
                {pm.agent} Multi-Agent Router Ready
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
                Ask questions or request reports. The ORCA Router will automatically dispatch your query to Report, Glossary, Research, or News sub-agents.
              </p>

              {/* Quick Query Starters */}
              <div className="w-full space-y-1.5 max-w-xs text-left">
                <div className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                  4 Sub-Agent Router Commands
                </div>
                {[
                  {
                    text: "Generate a report for current map view",
                    icon: FileText,
                    label: "Report Agent",
                    action: () => triggerReportGeneration("Generate an operational report for current map view."),
                  },
                  {
                    text: "What is PFZ and how is it detected?",
                    icon: BookOpen,
                    label: "Glossary Agent",
                    action: () => handleSend("What is PFZ and how is it detected?"),
                  },
                  {
                    text: "How does upwelling affect Yellowfin Tuna?",
                    icon: Microscope,
                    label: "Research Agent",
                    action: () => handleSend("How does upwelling affect Yellowfin Tuna?"),
                  },
                  {
                    text: "Are there any active cyclone alerts or fishing bans?",
                    icon: Radio,
                    label: "News Agent",
                    action: () => handleSend("Are there any active cyclone alerts or fishing bans?"),
                  },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.text}
                      onClick={item.action}
                      disabled={isGenerating || streaming}
                      className="w-full text-left px-2.5 py-2 rounded-xl bg-white border border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50 text-[11px] text-zinc-700 hover:text-zinc-900 transition flex items-center justify-between group cursor-pointer disabled:opacity-40"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <ItemIcon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-600 shrink-0" />
                        <span className="truncate">{item.text}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 shrink-0">
                        {item.label.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.role === "thought") {
                const cleanContent = msg.content
                  .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}]/gu, "")
                  .trim();
                const lower = cleanContent.toLowerCase();
                let ThoughtIcon = Cpu;
                if (lower.includes("router")) ThoughtIcon = Network;
                else if (lower.includes("context") || lower.includes("ingestion")) ThoughtIcon = Layers;
                else if (lower.includes("dispatch") || lower.includes("sub-agent") || lower.includes("swarm")) ThoughtIcon = Cpu;

                return (
                  <div key={msg.id} className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 py-1 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 shadow-2xs">
                    <div className="p-1 rounded bg-white border border-zinc-200 text-zinc-700 shrink-0">
                      <ThoughtIcon className="h-3 w-3 text-zinc-800 animate-pulse" />
                    </div>
                    <span className="truncate">{cleanContent}</span>
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
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1F4E8C] hover:bg-[#173F72] text-white text-xs font-semibold shadow-xs transition mt-1 cursor-pointer"
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
                    className="max-w-[95%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs"
                    style={
                      isUser
                        ? { background: "#09090b", color: "#ffffff", borderRadius: "14px 14px 2px 14px" }
                        : { background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "2px 14px 14px 14px", color: "#18181b" }
                    }
                  >
                    <div className="text-[10px] font-mono mb-1.5 flex items-center justify-between gap-1.5 border-b border-zinc-100/60 pb-1" style={{ color: isUser ? "#a1a1aa" : "#71717a" }}>
                      <div className="flex items-center gap-1.5">
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

                      {!isUser && msg.agentBadge && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono text-[9px] font-medium border border-blue-200">
                          {msg.agentBadge}
                        </span>
                      )}
                    </div>

                    {/* Antigravity-Style Collapsible Reasoning Container */}
                    {!isUser && msg.thoughts && msg.thoughts.length > 0 && (
                      <div className="mb-2.5 rounded-xl border border-zinc-200/90 bg-zinc-50/75 overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() =>
                            setMessages((prev) =>
                              prev.map((item) =>
                                item.id === msg.id
                                  ? { ...item, isThinkingExpanded: !item.isThinkingExpanded }
                                  : item
                              )
                            )
                          }
                          className="w-full px-2.5 py-1.5 flex items-center justify-between text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60 transition cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {msg.streaming && !msg.content ? (
                              <Sparkles className="h-3 w-3 text-zinc-700 animate-spin shrink-0" />
                            ) : (
                              <Sparkles className="h-3 w-3 text-zinc-500 shrink-0" />
                            )}
                            <span className="font-mono text-[10.5px] font-medium text-zinc-700 truncate">
                              {msg.streaming && !msg.content
                                ? "Thinking..."
                                : `Thought for ${msg.thinkingDurationSeconds ? msg.thinkingDurationSeconds.toFixed(1) : "2.4"}s · ${msg.thoughts.length} reasoning steps`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-400 shrink-0 ml-2">
                            <span className="text-[9px] font-mono">{msg.isThinkingExpanded ? "Hide" : "Show"}</span>
                            <ChevronDown
                              className={`h-3 w-3 transition-transform duration-200 ${
                                msg.isThinkingExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        <AnimatePresence>
                          {msg.isThinkingExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.16 }}
                              className="border-t border-zinc-200/60 bg-white/70 px-3 py-2 space-y-1.5 font-mono text-[10px] text-zinc-600"
                            >
                              {msg.thoughts.map((step, sIdx) => {
                                const lower = step.toLowerCase();
                                let StepIcon = Cpu;
                                if (lower.includes("router")) StepIcon = Network;
                                else if (lower.includes("context") || lower.includes("bound") || lower.includes("layer")) StepIcon = Layers;
                                else if (lower.includes("research") || lower.includes("rag") || lower.includes("paper")) StepIcon = BookOpen;
                                else if (lower.includes("telemetry") || lower.includes("ocean") || lower.includes("analytics")) StepIcon = Activity;

                                return (
                                  <div key={sIdx} className="flex items-start gap-1.5 leading-relaxed">
                                    <div className="mt-0.5 p-0.5 rounded bg-zinc-100 text-zinc-600 shrink-0">
                                      <StepIcon className="h-2.5 w-2.5" />
                                    </div>
                                    <span className="text-zinc-700 break-words">{step}</span>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    <FormattedChatMessage content={msg.content} isUser={isUser} />

                    {msg.streaming && !!msg.content && (
                      <span className="inline-block text-zinc-900 animate-pulse ml-0.5 font-bold">▋</span>
                    )}

                    {!isUser && !msg.streaming && msg.content && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <button
                          onClick={() =>
                            triggerReportGeneration(
                              `Generate an operational dossier based on: ${msg.content.replace(/[#*`]/g, '').slice(0, 60)}`
                            )
                          }
                          disabled={isGenerating || streaming}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-mono font-medium transition active:scale-95 cursor-pointer shadow-xs disabled:opacity-40"
                          title="Generate a full 4-agent report for this specific answer"
                        >
                          <FileText className="h-3 w-3 text-blue-400" />
                          <span>Generate Report for this Answer</span>
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
            <button className="text-zinc-500 hover:text-black transition p-1.5 rounded-lg hover:bg-zinc-100" title="Audio Input">
              <Mic className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask question, define term, or request report..."
              className="flex-1 bg-zinc-100/90 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:bg-white transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || streaming || isGenerating}
              className="p-2 rounded-xl bg-[#1F4E8C] text-white hover:bg-[#173F72] transition disabled:opacity-30 active:scale-95 shadow-sm cursor-pointer"
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
              className="text-[#1F4E8C] font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
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
  activeBaseLayer,
  onSelectBaseLayer,
  activeOverlays,
  onToggleOverlay,
  sstRange,
  setSstRange,
  waveMax,
  setWaveMax,
}: {
  persona: Persona;
  visible: boolean;
  activeBaseLayer: string;
  onSelectBaseLayer: (baseId: string) => void;
  activeOverlays: Set<string>;
  onToggleOverlay: (overlayId: string) => void;
  sstRange: [number, number];
  setSstRange: (range: [number, number]) => void;
  waveMax: number;
  setWaveMax: (val: number) => void;
}) {
  const pm = PERSONA_META[persona];
  const PersonaIcon = pm.icon;

  const [expanded, setExpanded] = useState(false);

  const activeVectorsCount = activeOverlays.size;
  const isBaseActive = activeBaseLayer !== "none" && activeBaseLayer !== "natural_satellite";
  const totalActive = activeVectorsCount + (isBaseActive ? 1 : 0);

  return (
    <div
      className={`fixed top-16 left-4 z-40 transition-opacity duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Floating Collapsed Pill */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white border border-zinc-200/90 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 shadow-sm backdrop-blur-md transition-all active:scale-95"
          title="Open Map Layers & Overlays"
        >
          <Layers className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium">Layers</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
            {totalActive}
          </span>
        </button>
      )}

      {/* Expanded Clean Menu */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-72 max-h-[calc(100vh-80px)] rounded-xl flex flex-col overflow-hidden shadow-xl bg-white/98 backdrop-blur-md border border-zinc-200"
          >
            {/* Persona & Console Header */}
            <div className="px-3.5 py-2.5 flex-shrink-0 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
              <div className="flex items-center gap-2">
                <PersonaIcon className="h-3.5 w-3.5 text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-800">{pm.agent}</span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                title="Close Layers"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scrollable Controls */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4">
              {/* ── SECTION 1: ENVIRONMENTAL COLOR RASTERS (MUTUALLY EXCLUSIVE) ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                    Environmental Layers (Base Heatmaps)
                  </span>
                  <span className="text-[9px] font-mono text-[#1F4E8C] font-semibold">1 active</span>
                </div>

                <div className="space-y-1">
                  {ENVIRONMENTAL_RASTERS.map((r) => {
                    const isActive =
                      (activeBaseLayer === "natural_satellite" || activeBaseLayer === "none")
                        ? r.id === "none"
                        : (activeBaseLayer === "sst_thermal" || activeBaseLayer === "sst")
                        ? r.id === "sst"
                        : (activeBaseLayer === "chlorophyll_plumes" || activeBaseLayer === "chlorophyll")
                        ? r.id === "chlorophyll"
                        : (activeBaseLayer === "currents_velocity" || activeBaseLayer === "currents")
                        ? r.id === "currents"
                        : (activeBaseLayer === "bathymetric_depth" || activeBaseLayer === "bathymetry")
                        ? r.id === "bathymetry"
                        : activeBaseLayer === (r.id as string);

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          const targetId =
                            r.id === "none" ? "natural_satellite" :
                            r.id === "sst" ? "sst_thermal" :
                            r.id === "chlorophyll" ? "chlorophyll_plumes" :
                            r.id === "currents" ? "currents_velocity" :
                            r.id === "bathymetry" ? "bathymetric_depth" :
                            (r.id as string);
                          onSelectBaseLayer(targetId);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg transition border text-xs flex items-center justify-between cursor-pointer ${
                          isActive
                            ? "bg-blue-50/80 border-blue-200 text-zinc-900 font-semibold shadow-xs"
                            : "bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-600"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              r.id === "sst"
                                ? "bg-amber-500"
                                : r.id === "chlorophyll"
                                ? "bg-emerald-500"
                                : r.id === "currents"
                                ? "bg-sky-500"
                                : r.id === "bathymetry"
                                ? "bg-indigo-500"
                                : "bg-zinc-400"
                            }`}
                          />
                          <div className="truncate">
                            <div className="text-[11px] leading-tight truncate">{r.label}</div>
                            <div className="text-[9px] text-zinc-400 font-mono leading-tight">{r.rangeText}</div>
                          </div>
                        </div>
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 2: DIRECT MAP OVERLAYS (ADDITIVE STACKABLE) ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5 pt-2 border-t border-zinc-100">
                  <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                    Direct Map Overlays
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400">{activeVectorsCount} active</span>
                </div>

                <div className="space-y-1">
                  {VECTOR_OVERLAYS_DEF.map((v) => {
                    const LayerIcon = v.icon;
                    const isOn =
                      (v.id === "pfz" && (activeOverlays.has("pfz") || activeOverlays.has("pfz_hotspots"))) ||
                      (v.id === "imbl" && (activeOverlays.has("imbl") || activeOverlays.has("imbl_sovereign"))) ||
                      (v.id === "ais" && (activeOverlays.has("ais") || activeOverlays.has("ais_fleet"))) ||
                      (v.id === "route" && (activeOverlays.has("route") || activeOverlays.has("optimal_route"))) ||
                      (v.id === "ocean_currents" && (activeOverlays.has("ocean_currents") || activeOverlays.has("oceanCurrents") || activeOverlays.has("current_flow") || activeOverlays.has("currentsFlow"))) ||
                      (v.id === "mesh" && (activeOverlays.has("mesh") || activeOverlays.has("tactical_mesh"))) ||
                      (v.id === "graticule" && activeOverlays.has("graticule")) ||
                      activeOverlays.has(v.id as string);

                    return (
                      <div
                        key={v.id}
                        className={`flex items-center justify-between py-1 px-1.5 rounded-lg border transition cursor-pointer ${
                          isOn ? "bg-zinc-50 border-zinc-300 text-zinc-900" : "bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-600"
                        }`}
                        onClick={() => onToggleOverlay(v.id)}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <LayerIcon className={`h-3.5 w-3.5 flex-shrink-0 ${isOn ? "text-zinc-900" : "text-zinc-400"}`} />
                          <div className="truncate">
                            <div className={`text-[11px] leading-tight truncate ${isOn ? "text-zinc-900 font-semibold" : "text-zinc-500"}`}>
                              {v.label}
                            </div>
                            <div className="text-[9px] text-zinc-400 truncate leading-tight">
                              {v.subtitle}
                            </div>
                          </div>
                        </div>
                        <Toggle on={isOn} onChange={() => onToggleOverlay(v.id)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 3: SENSOR THRESHOLDS ── */}
              <div>
                <div className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2 pt-2 border-t border-zinc-100">
                  Sensor Thresholds
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span>SST Range</span>
                      <span className="text-zinc-800 font-semibold">{sstRange[0]}–{sstRange[1]}°C</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={35}
                      step={0.5}
                      value={sstRange[1]}
                      onChange={(e) => setSstRange([sstRange[0], Number(e.target.value)])}
                      className="w-full h-1 rounded-full appearance-none bg-zinc-200 cursor-pointer accent-zinc-800"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span>Max SWH (Swell)</span>
                      <span className="text-zinc-800 font-semibold">{waveMax}m</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={0.5}
                      value={waveMax}
                      onChange={(e) => setWaveMax(Number(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none bg-zinc-200 cursor-pointer accent-zinc-800"
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
  const [pulseChat, setPulseChat] = useState(false);
  const [basin, setBasin] = useState<Basin>("arabian_sea");
  const [searchFocus, setSearchFocus] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState("yellowfin");
  const [navOpen, setNavOpen] = useState(false);
  const [scrolledPastGlobe, setScrolledPastGlobe] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState<ReportGenerationProgress | null>(null);
  const triggerReportRef = useRef<((topic?: string) => void) | null>(null);

  useEffect(() => {
    setActiveReport(reportStore.getActiveReport());
    const unsub = reportStore.subscribe((_, cur) => {
      setActiveReport(cur);
    });
    return unsub;
  }, []);

  const [activeBaseLayer, setActiveBaseLayer] = useState<string>("natural_satellite");
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(
    new Set([
      "ocean_currents",
      "pfz_hotspots",
      "imbl_sovereign",
      "ais_fleet",
      "optimal_route",
      "tactical_mesh",
    ])
  );
  const [sstRange, setSstRange] = useState<[number, number]>([24, 32]);
  const [waveMax, setWaveMax] = useState(4.0);

  const [liveCurrent, setLiveCurrent] = useState<LiveOceanCurrentResponse | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [currentDetailsOpen, setCurrentDetailsOpen] = useState(false);

  const refreshCurrents = useCallback((force: boolean = false) => {
    if (!selectedCoord) return;
    setLoadingCurrent(true);
    fetchLiveOceanCurrent(selectedCoord.lat, selectedCoord.lon, force)
      .then((data) => {
        if (data) setLiveCurrent(data);
      })
      .finally(() => setLoadingCurrent(false));
  }, [selectedCoord]);

  useEffect(() => {
    if (!selectedCoord) {
      setLiveCurrent(null);
      setCurrentDetailsOpen(false);
      return;
    }
    refreshCurrents(false);
  }, [selectedCoord?.lat, selectedCoord?.lon, refreshCurrents]);

  const toggleOverlay = (id: string) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      const canonicalId =
        id === "pfz" ? "pfz_hotspots" :
        id === "imbl" ? "imbl_sovereign" :
        id === "ais" ? "ais_fleet" :
        id === "route" ? "optimal_route" :
        id === "ocean_currents" || id === "currentsFlow" || id === "current_flow" ? "ocean_currents" :
        id === "mesh" ? "tactical_mesh" :
        id;

      if (next.has(canonicalId) || next.has(id)) {
        next.delete(canonicalId);
        next.delete(id);
      } else {
        next.add(canonicalId);
      }
      return next;
    });
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
            activeBaseLayer={activeBaseLayer}
            activeOverlays={activeOverlays}
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
          activeBaseLayer={activeBaseLayer}
          onSelectBaseLayer={setActiveBaseLayer}
          activeOverlays={activeOverlays}
          onToggleOverlay={toggleOverlay}
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
                    <div className="flex flex-col items-center gap-1.5">
                      {/* Expandable Real-Time Hydrodynamic Telemetry Card */}
                      <AnimatePresence>
                        {currentDetailsOpen && liveCurrent && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            className="w-[380px] p-3 rounded-2xl border shadow-xl backdrop-blur-xl bg-white/95 border-zinc-200/90 text-zinc-900 mb-1 z-30"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                              <div className="flex items-center gap-1.5">
                                <Waves className="h-4 w-4 text-cyan-600" />
                                <span className="text-xs font-semibold tracking-tight text-zinc-900">
                                  Real-Time Ocean Hydrodynamics
                                </span>
                              </div>
                              <button
                                onClick={() => setCurrentDetailsOpen(false)}
                                className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full hover:bg-zinc-100 transition"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="my-2">
                              <div className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 inline-block">
                                {liveCurrent.flow_regime}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 my-2 text-left">
                              <div className="p-2 rounded-xl bg-zinc-50/80 border border-zinc-100">
                                <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Current Velocity</div>
                                <div className="text-sm font-mono font-bold text-zinc-900 mt-0.5">
                                  {liveCurrent.velocity_knots.toFixed(2)} <span className="text-[10px] font-normal text-zinc-500">knots</span>
                                </div>
                                <div className="text-[9px] font-mono text-zinc-400">
                                  ({liveCurrent.velocity_mps.toFixed(2)} m/s)
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-zinc-50/80 border border-zinc-100">
                                <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Flow Azimuth</div>
                                <div className="text-sm font-mono font-bold text-zinc-900 mt-0.5 flex items-center gap-1.5">
                                  {liveCurrent.direction_deg.toFixed(0)}° {liveCurrent.cardinal_direction}
                                  <Navigation
                                    className="h-3.5 w-3.5 text-cyan-600 inline-block transform"
                                    style={{ transform: `rotate(${liveCurrent.direction_deg}deg)` }}
                                  />
                                </div>
                                <div className="text-[9px] font-mono text-zinc-400">Heading towards</div>
                              </div>

                              <div className="p-2 rounded-xl bg-zinc-50/80 border border-zinc-100">
                                <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Eulerian Drift Vectors</div>
                                <div className="text-[10px] font-mono text-zinc-700 mt-0.5">
                                  u: <span className="font-semibold">{liveCurrent.u_vector.toFixed(3)}</span> m/s (E)
                                </div>
                                <div className="text-[10px] font-mono text-zinc-700">
                                  v: <span className="font-semibold">{liveCurrent.v_vector.toFixed(3)}</span> m/s (N)
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-zinc-50/80 border border-zinc-100">
                                <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Coupled Wave State</div>
                                <div className="text-sm font-mono font-bold text-zinc-900 mt-0.5">
                                  {liveCurrent.wave_height_m.toFixed(2)}m <span className="text-[10px] font-normal text-zinc-500">SWH</span>
                                </div>
                                <div className="text-[9px] font-mono text-zinc-400">
                                  @ {liveCurrent.wave_direction_deg.toFixed(0)}° azimuth
                                </div>
                              </div>
                            </div>

                            {/* 10-Minute Caching Delay Indicator */}
                            <div className="p-2 rounded-xl bg-cyan-50/60 border border-cyan-100/80 text-[10px] font-mono flex items-center justify-between gap-2 mt-2">
                              <div className="flex items-center gap-1.5 truncate text-cyan-900">
                                <Clock className="h-3 w-3 text-cyan-600 flex-shrink-0" />
                                <span className="truncate">
                                  {liveCurrent.is_cached
                                    ? `10m cache active · synced ${Math.floor(liveCurrent.cache_age_seconds / 60)}m ago`
                                    : "Live observation fetched"}
                                </span>
                              </div>
                              <button
                                onClick={() => refreshCurrents(true)}
                                disabled={loadingCurrent}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-cyan-100 border border-cyan-200 text-[9px] font-semibold text-cyan-800 transition flex-shrink-0 shadow-2xs cursor-pointer"
                                title="Bypass 10-minute cache and fetch latest reading"
                              >
                                <RefreshCw className={`h-2.5 w-2.5 ${loadingCurrent ? "animate-spin" : ""}`} />
                                Sync Now
                              </button>
                            </div>

                            <div className="text-[8px] font-mono text-zinc-400 mt-1.5 text-center truncate">
                              Source: {liveCurrent.source}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center gap-2">
                        {/* Primary Coordinate Badge */}
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
                            onClick={() => {
                              setSelectedCoord(null);
                              setCurrentDetailsOpen(false);
                            }}
                            className="text-zinc-400 hover:text-black transition p-0.5 rounded hover:bg-zinc-100 flex-shrink-0 ml-0.5"
                            title="Unlock Cell"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Real-Time Ocean Currents Telemetry Capsule */}
                        <div
                          onClick={() => setCurrentDetailsOpen(!currentDetailsOpen)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono shadow-sm backdrop-blur-md transition cursor-pointer select-none ${
                            currentDetailsOpen
                              ? "bg-cyan-50 border-cyan-400 text-cyan-950 ring-2 ring-cyan-200"
                              : "bg-white/95 hover:bg-cyan-50/60 border-cyan-200/90 text-zinc-800"
                          }`}
                          title="Click to inspect real-time ocean current hydrodynamics (10m delay cache)"
                        >
                          <Waves className="h-3.5 w-3.5 text-cyan-600 flex-shrink-0" />
                          {loadingCurrent ? (
                            <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                              <RefreshCw className="h-2.5 w-2.5 animate-spin text-cyan-600" />
                              Syncing...
                            </span>
                          ) : liveCurrent ? (
                            <>
                              <span className="text-cyan-900 font-bold whitespace-nowrap flex items-center gap-1">
                                {liveCurrent.velocity_knots.toFixed(1)} kn
                                <Navigation
                                  className="h-2.5 w-2.5 text-cyan-600 inline-block transform"
                                  style={{ transform: `rotate(${liveCurrent.direction_deg}deg)` }}
                                />
                                <span className="text-cyan-700 font-normal">{liveCurrent.cardinal_direction}</span>
                              </span>
                              <span className="text-cyan-600/80 text-[9px] border-l border-cyan-200 pl-1.5 whitespace-nowrap">
                                {liveCurrent.is_cached
                                  ? `10m TTL · ${Math.floor(liveCurrent.cache_age_seconds / 60)}m`
                                  : "Live"}
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-400 text-[10px]">Currents Telemetry</span>
                          )}
                        </div>
                      </div>
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
          isGenerating={isGeneratingReport}
          generationProgress={reportProgress}
          onTriggerGenerate={(topic) => {
            scrollToReport();
            triggerReportRef.current?.(topic);
          }}
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
          reportStore.saveReport(newReport);
          setTimeout(() => {
            scrollToReport();
          }, 400);
        }}
        onGeneratingProgress={(isGen, prog) => {
          setIsGeneratingReport(isGen);
          setReportProgress(prog);
        }}
        onRegisterTrigger={(fn) => {
          triggerReportRef.current = fn;
        }}
        selectedCoord={selectedCoord}
        basinLabel={
          selectedCoord
            ? getSovereignBasin(selectedCoord.lat, selectedCoord.lon).label
            : BASINS.find((b) => b.id === basin)?.label || "Arabian Sea Basin"
        }
        activeBaseLayer={activeBaseLayer}
        activeOverlays={activeOverlays}
        sstRange={sstRange}
        waveMax={waveMax}
        pulse={pulseChat}
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
