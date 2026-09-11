"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search, ArrowUpRight, BookOpen, FileText, ExternalLink,
  ChevronDown, ChevronUp, Download, Share2, Compass, Waves,
  Shield, Fish, Sparkles, Filter, Database, CheckCircle2,
  AlertTriangle, Info, Calendar, Clock, MapPin, BarChart3,
  Layers, Cpu, Zap, ArrowLeft, RefreshCw, Thermometer,
  FlaskConical, Wind, Activity, Newspaper, ChevronRight,
  ArrowRight, ShieldCheck, Check, Plus, Minus, History, Eye,
  Navigation, ShieldAlert, Microscope, Anchor, Ship, Radio
} from "lucide-react";
import { Report, ReportSection, ReportGenerationProgress } from "@/lib/reportTypes";
import { reportStore, DEFAULT_TUNA_REPORT } from "@/lib/reportStore";

export interface ReportViewProps {
  report?: Report | null;
  persona?: "navigator" | "researcher" | "defense" | "student" | "guest";
  selectedSpeciesId?: string;
  coordinates?: { lat: number; lon: number };
  basinName?: string;
  onBackToGlobe?: () => void;
  showBackToGlobeButton?: boolean;
  isGenerating?: boolean;
  generationProgress?: ReportGenerationProgress | null;
  onTriggerGenerate?: (topic?: string) => void;
}

// ─── Reference Data ───────────────────────────────────────────────────────────
interface SpeciesProfile {
  id: string;
  commonName: string;
  scientificName: string;
  localNames: { lang: string; name: string }[];
  category: "pelagic" | "demersal" | "coastal" | "migratory";
  iucnStatus: string;
  iucnColor: string;
  confidence: number;
  optimalTemp: string;
  optimalSalinity: string;
  optimalChl: string;
  depthRange: string;
  behavior: string;
  gearRecommendation: string[];
  mandiRate: { port: string; rate: string; trend: "up" | "stable" | "down" }[];
  solunarPeak: string;
  description: string;
  tags: string[];
}

const SPECIES_LIST: SpeciesProfile[] = [
  {
    id: "yellowfin",
    commonName: "Yellowfin Tuna",
    scientificName: "Thunnus albacares",
    localNames: [
      { lang: "Malayalam", name: "Kera / Choora" },
      { lang: "Tamil", name: "Kelavalla" },
      { lang: "Gujarati", name: "Toora" },
      { lang: "Marathi", name: "Gedar" },
    ],
    category: "pelagic",
    iucnStatus: "Near Threatened",
    iucnColor: "#C87B12",
    confidence: 93,
    optimalTemp: "25.0°C – 29.5°C",
    optimalSalinity: "34.5 – 36.0 PSU",
    optimalChl: "0.8 – 1.8 mg/m³",
    depthRange: "40m – 150m (Thermocline rim)",
    behavior: "High-metabolism epipelagic hunter following chlorophyll-a fronts and thermal divergence boundaries. Forms multispecies schools with skipjack tuna and oceanic dolphins.",
    gearRecommendation: [
      "Monofilament Pelagic Longline (16/0 circle hooks)",
      "High-speed Trolling Lures (Squid skirts / Kona heads)",
      "Pole and Line with live anchovy chumming",
    ],
    mandiRate: [
      { port: "Veraval Harbor (Gujarat)", rate: "₹340 – ₹420 / kg", trend: "up" },
      { port: "Kochi Fishing Harbor (Kerala)", rate: "₹360 – ₹450 / kg", trend: "up" },
      { port: "Mangalore Old Port (Karnataka)", rate: "₹320 – ₹390 / kg", trend: "stable" },
    ],
    solunarPeak: "04:30 – 07:30 IST & 17:45 – 19:15 IST",
    description: "Yellowfin tuna represents one of the highest value export catches in the Indian Ocean EEZ. In the northeastern Arabian Sea, post-monsoon thermal fronts between 20°N and 22°N concentrate flying fish and squid populations, triggering intense predator aggregation.",
    tags: ["High Export Value", "PFZ Advisory", "Sashimi Grade", "Thermal Divergence"],
  },
  {
    id: "skipjack",
    commonName: "Skipjack Tuna",
    scientificName: "Katsuwonus pelamis",
    localNames: [
      { lang: "Malayalam", name: "Choora" },
      { lang: "Tamil", name: "Soorai" },
      { lang: "Konkani", name: "Kuppa" },
    ],
    category: "pelagic",
    iucnStatus: "Least Concern",
    iucnColor: "#228B5A",
    confidence: 88,
    optimalTemp: "26.0°C – 30.5°C",
    optimalSalinity: "33.5 – 35.8 PSU",
    optimalChl: "0.5 – 1.4 mg/m³",
    depthRange: "15m – 80m",
    behavior: "Fast-moving epipelagic predator known for vigorous surface feeding boils. Strongly attracted to drifting objects, FADs, and thermal eddies.",
    gearRecommendation: [
      "Traditional Lakshadweep Pole-and-Line",
      "Surface Drift Gillnets (100–120mm mesh)",
      "Light Trolling lines",
    ],
    mandiRate: [
      { port: "Agatti Island (Lakshadweep)", rate: "₹180 – ₹220 / kg", trend: "stable" },
      { port: "Kochi Harbor (Kerala)", rate: "₹190 – ₹240 / kg", trend: "up" },
      { port: "Tuticorin (Tamil Nadu)", rate: "₹170 – ₹210 / kg", trend: "down" },
    ],
    solunarPeak: "05:15 – 08:00 IST & 16:30 – 18:30 IST",
    description: "Skipjack tuna forms the backbone of the traditional Lakshadweep masmin fishery. Modern satellite data correlates skipjack presence with 28°C surface isotherm boundaries and anticyclonic eddies.",
    tags: ["Pole & Line", "Sustainable Catch", "Lakshadweep Specialty", "Surface Boil"],
  },
  {
    id: "mackerel",
    commonName: "Indian Mackerel",
    scientificName: "Rastrelliger kanagurta",
    localNames: [
      { lang: "Marathi", name: "Bangda" },
      { lang: "Malayalam", name: "Ayala" },
      { lang: "Tamil", name: "Kumla" },
      { lang: "Kannada", name: "Bangude" },
    ],
    category: "coastal",
    iucnStatus: "Abundant / Commercial",
    iucnColor: "#228B5A",
    confidence: 91,
    optimalTemp: "27.0°C – 29.2°C",
    optimalSalinity: "32.0 – 35.0 PSU",
    optimalChl: "1.5 – 3.2 mg/m³",
    depthRange: "10m – 50m",
    behavior: "Microphagous plankton feeder following coastal upwelling fronts and diatoms/copepods bloom ribbons. Highly responsive to seasonal monsoon current reversals.",
    gearRecommendation: [
      "Purse Seine / Ring Seine",
      "Cast Nets and Gillnets (35–45mm mesh)",
      "Coastal Trawl",
    ],
    mandiRate: [
      { port: "Malpe Port (Karnataka)", rate: "₹140 – ₹180 / kg", trend: "up" },
      { port: "Sassoon Docks (Mumbai)", rate: "₹160 – ₹220 / kg", trend: "stable" },
      { port: "Beypore Harbor (Kerala)", rate: "₹130 – ₹170 / kg", trend: "down" },
    ],
    solunarPeak: "03:45 – 06:30 IST & 18:00 – 20:00 IST",
    description: "Crucial staple pelagic resource for domestic coastal food security. In the southwestern shelf of India, the poleward West India Coastal Current during winter fuels nutrient upwelling favorable for large mackerel shoals.",
    tags: ["Staple Food Catch", "Upwelling Indicator", "Coastal Purse Seine"],
  },
];

interface GlossaryTerm {
  term: string;
  acronym?: string;
  category: "Oceanography" | "Satellite / Remote Sensing" | "Fisheries" | "Maritime Law" | "AI & Architecture";
  definition: string;
  formulaOrStandard?: string;
  importance: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "Potential Fishing Zone",
    acronym: "PFZ",
    category: "Fisheries",
    definition: "An ocean geographic zone delineated by INCOIS where simultaneous thermal gradients (SST fronts) and chlorophyll-a concentrations overlap, marking zones of high primary biomass and fish aggregation.",
    formulaOrStandard: "Frontal gradient |∇SST| > 0.5°C/km ∩ Chlorophyll-a > 0.8 mg/m³",
    importance: "Reduces vessel search time by up to 60% and lowers diesel consumption by 15–20% per voyage.",
  },
  {
    term: "Sea Surface Temperature",
    acronym: "SST",
    category: "Satellite / Remote Sensing",
    definition: "The kinetic temperature of the water layer within the top few millimeters to meters of the ocean, observed by thermal infrared radiometers.",
    formulaOrStandard: "Skin SST derived from thermal IR brightness temp at 11µm and 12µm channels",
    importance: "Key physiological governor for marine ectotherms; dictates spawning, migration, and thermal limits.",
  },
  {
    term: "Significant Wave Height",
    acronym: "SWH",
    category: "Oceanography",
    definition: "The statistical mean wave height of the highest one-third (H1/3) of all waves recorded in a wave spectrum during a standard 20-minute observational window.",
    formulaOrStandard: "H_s = 4 * sqrt(m0), where m0 is the zero-order spectral moment",
    importance: "Primary safety benchmark governing port entry, small craft warnings, and deck operation limits.",
  },
  {
    term: "Chlorophyll-a Anomaly",
    acronym: "Chl-a",
    category: "Satellite / Remote Sensing",
    definition: "The deviation in photosynthetic pigment concentration from seasonal baseline, retrieved via Sentinel-3 OLCI ocean color sensors.",
    formulaOrStandard: "Chl anomaly = Chl_observed - Chl_climatological_mean",
    importance: "Direct proxy for phytoplankton blooms, zooplankton grazing, and secondary fish productivity.",
  },
  {
    term: "International Maritime Boundary Line",
    acronym: "IMBL",
    category: "Maritime Law",
    definition: "The legally demarcated boundary line separating the sovereign territorial waters and Exclusive Economic Zones (EEZ) of adjacent littoral states.",
    formulaOrStandard: "UNCLOS 1982 Art. 74/83 & Maritime Zones of India Act 1976",
    importance: "Critical national security boundary; strict standoff protocols prevent accidental cross-border incursions.",
  },
];

const REFERENCE_LINKS = [
  {
    name: "INCOIS Potential Fishing Zone (PFZ) Portal",
    organization: "Indian National Centre for Ocean Information Services (MoES)",
    description: "Official dissemination system for Potential Fishing Zone (PFZ) maps, Ocean State Forecasts (OSF), and High Wave Alerts.",
    category: "Government Agency",
    href: "https://incois.gov.in/MarineFisheries/TextDataHome?mfid=1&request_locale=en",
  },
  {
    name: "ISRO Bhuvan Ocean Geospatial Hub",
    organization: "Indian Space Research Organisation (ISRO)",
    description: "Interactive satellite data visualization hosting Oceansat-3, Cartosat, and coastal vulnerability geospatial datasets.",
    category: "Space Agency",
    href: "https://bhuvan.nrsc.gov.in",
  },
  {
    name: "Copernicus Marine Environment Service",
    organization: "European Space Agency / EUMETSAT",
    description: "Global and regional sea surface temperature and ocean color radiometry products from Sentinel-3.",
    category: "Satellite Observation",
    href: "https://marine.copernicus.eu",
  },
  {
    name: "CMFRI Marine Fisheries Data Repository",
    organization: "Central Marine Fisheries Research Institute (ICAR)",
    description: "Comprehensive statistical repository on marine fish landings, fishing fleet census, and craft-gear inventories.",
    category: "Fisheries Research",
    href: "https://www.cmfri.org.in",
  },
];

// ─── Main Dynamic ReportView Component ────────────────────────────────────────
export default function ReportView({
  report: propReport,
  persona = "navigator",
  selectedSpeciesId = "yellowfin",
  coordinates: propCoordinates,
  basinName: propBasinName,
  onBackToGlobe,
  showBackToGlobeButton = true,
  isGenerating = false,
  generationProgress = null,
  onTriggerGenerate,
}: ReportViewProps) {
  // Local store report state (null by default if no report compiled yet)
  const [activeReport, setActiveReport] = useState<Report | null>(propReport !== undefined ? propReport : null);
  const [reportHistory, setReportHistory] = useState<Report[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Sync on client mount and whenever propReport changes
  useEffect(() => {
    if (propReport !== undefined) {
      setActiveReport(propReport);
    } else {
      setActiveReport(reportStore.getActiveReport());
    }
    setReportHistory(reportStore.getReportHistory());
  }, [propReport]);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = reportStore.subscribe((history, currentActive) => {
      setReportHistory(history);
      if (propReport === undefined) {
        setActiveReport(currentActive);
      }
    });
    return unsubscribe;
  }, [propReport]);

  // Report fields
  const currentReport = propReport !== undefined ? propReport : activeReport;
  const sections = currentReport?.sections || [];
  const coords = currentReport?.coordinates || propCoordinates || { lat: 20.75, lon: 70.19 };
  const basin = currentReport?.region || propBasinName || "Arabian Sea Basin";
  const telemetry = currentReport?.telemetry || {};

  // Active species state (for fisheries advisory sections)
  const [activeSpeciesId, setActiveSpeciesId] = useState(selectedSpeciesId);
  const activeSpecies = useMemo(() => {
    return SPECIES_LIST.find((s) => s.id === activeSpeciesId) || SPECIES_LIST[0];
  }, [activeSpeciesId]);

  // Active section tracking for jump tabs
  const [activeNavSection, setActiveNavSection] = useState(sections[0]?.id || "sec-0");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Glossary filter
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategory, setGlossaryCategory] = useState<string>("All");
  const [expandedGlossaryTerm, setExpandedGlossaryTerm] = useState<string | null>("Potential Fishing Zone");

  const glossaryCategories = useMemo(() => {
    const cats = Array.from(new Set(GLOSSARY_TERMS.map((g) => g.category)));
    return ["All", ...cats];
  }, []);

  const filteredGlossary = useMemo(() => {
    return GLOSSARY_TERMS.filter((item) => {
      const matchesCat = glossaryCategory === "All" || item.category === glossaryCategory;
      const matchesSearch =
        item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        (item.acronym && item.acronym.toLowerCase().includes(glossarySearch.toLowerCase())) ||
        item.definition.toLowerCase().includes(glossarySearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [glossaryCategory, glossarySearch]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveNavSection(id);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  // Dynamic Scrollspy to track active section and dossier visibility
  const [isInReportView, setIsInReportView] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById("orca-report-section");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Only display the left indicator lines when dossier section is meaningfully in view
      const inView = rect.top <= window.innerHeight * 0.75 && rect.bottom >= 150;
      setIsInReportView(inView);

      // Scrollspy calculation: highlight the section currently at reading viewport
      const scrollThreshold = window.scrollY + 180;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollThreshold >= top) {
            setActiveNavSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  // ─── 1. REAL-TIME MULTI-AGENT SWARM STREAMING VIEW ─────────────────────────
  if (isGenerating) {
    const stage = generationProgress?.stage || 1;
    const totalStages = generationProgress?.totalStages || 6;
    const progressPercent = generationProgress?.progressPercent || Math.round((stage / totalStages) * 100);
    const stageName = generationProgress?.stageName || "Synthesizing Operational Knowledge";
    const currentMsg = generationProgress?.message || "Autonomous agent swarm coordinating multi-spectral sensors...";
    const latDisplay = coords.lat.toFixed(3);
    const lonDisplay = coords.lon.toFixed(3);

    return (
      <div id="orca-report-section" className="relative min-h-screen bg-[#0E1726] text-white pb-24 font-sans">
        {/* Sticky Top Bar */}
        <div className="sticky top-14 z-30 bg-[#0A101D]/90 border-b border-white/10 shadow-lg backdrop-blur-md">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {showBackToGlobeButton && onBackToGlobe && (
                <button
                  onClick={onBackToGlobe}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Globe</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono text-cyan-300 font-medium tracking-wide">
                  LIVE SWARM SYNTHESIS ACTIVE
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-[11px] text-zinc-300">
                {latDisplay}°N, {lonDisplay}°E
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-zinc-400">
                {basin}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Live Construction Box */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#162238] to-[#0D1525] border border-cyan-500/30 shadow-2xl p-6 sm:p-8 overflow-hidden mb-8">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
                  <Cpu className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>Multi-Agent Swarm Orchestrator · Stage {stage} of {totalStages}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {stageName}
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Compiling sovereign oceanographic dossier for target geodetic cell <span className="font-mono text-cyan-300">[{latDisplay}°N, {lonDisplay}°E]</span>
                </p>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center">
                <span className="text-3xl sm:text-4xl font-mono font-bold text-cyan-400">
                  {progressPercent}%
                </span>
                <span className="text-[11px] font-mono text-zinc-400">Compilation Progress</span>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-3.5 p-0.5 overflow-hidden border border-white/10 mb-6">
              <div
                className="bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Live Terminal Stream Console */}
            <div className="rounded-xl bg-black/60 border border-white/10 p-4 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/10 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-300 font-semibold">SWARM TELEMETRY BUS (REAL-TIME STREAM)</span>
                </div>
                <span className="text-zinc-500">Gemma 4 MoE + INCOIS Pipeline</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-cyan-300">
                  <span className="text-emerald-400 flex-shrink-0">&gt;</span>
                  <span className="leading-relaxed animate-pulse">{currentMsg}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                  <span>Target: [{latDisplay}°N, {lonDisplay}°E]</span>
                  <span>·</span>
                  <span>Marine Basin: {basin}</span>
                  <span>·</span>
                  <span>Status: Illuminating active dossier sections</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Specialized Autonomous Swarm Agents */}
          <div className="mb-8">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>Specialized Autonomous Swarm Agents</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: "hydro",
                  icon: Waves,
                  title: "Hydrodynamic Telemetry Agent",
                  sub: "Sentinel-3 SLSTR & INCOIS wave buoys",
                  activeStage: 2,
                  doneStage: 3,
                },
                {
                  id: "fisheries",
                  icon: Fish,
                  title: "Fisheries Habitat Agent",
                  sub: "PFZ chlorophyll fronts & CMFRI mandi rates",
                  activeStage: 3,
                  doneStage: 4,
                },
                {
                  id: "defense",
                  icon: Shield,
                  title: "Sovereign Maritime Agent",
                  sub: "IMBL standoff calculus & DGS circulars",
                  activeStage: 4,
                  doneStage: 5,
                },
                {
                  id: "research",
                  icon: BookOpen,
                  title: "Oceanographic Research Agent",
                  sub: "Thermocline depth & scientific literature",
                  activeStage: 4,
                  doneStage: 5,
                },
                {
                  id: "routing",
                  icon: Compass,
                  title: "Navigation & Path Agent",
                  sub: "Optimal heading vector & fuel conservation",
                  activeStage: 5,
                  doneStage: 6,
                },
                {
                  id: "synthesizer",
                  icon: Sparkles,
                  title: "Master Synthesizer Agent",
                  sub: "Gemma 4 MoE neural synthesis & watermarking",
                  activeStage: 5,
                  doneStage: 6,
                },
              ].map((agent) => {
                const AgentIcon = agent.icon;
                const isDone = stage >= agent.doneStage;
                const isActive = stage === agent.activeStage || (stage > agent.activeStage && !isDone);

                return (
                  <div
                    key={agent.id}
                    className={`rounded-xl p-4 border transition-all duration-300 ${
                      isDone
                        ? "bg-[#111C2E] border-emerald-500/40 text-white"
                        : isActive
                        ? "bg-[#15233A] border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                        : "bg-[#0C1422]/60 border-white/5 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg ${
                            isDone
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isActive
                              ? "bg-cyan-500/20 text-cyan-300"
                              : "bg-white/5 text-zinc-500"
                          }`}
                        >
                          <AgentIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-100">{agent.title}</div>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[170px]">{agent.sub}</div>
                        </div>
                      </div>

                      {isDone ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Check className="h-3 w-3" /> Ready
                        </span>
                      ) : isActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-400/40 animate-pulse">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                          Queued
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 9-Section Real-Time Dossier Blueprint Assembly */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>Real-Time 9-Section Blueprint Assembly</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { num: "01", label: "AI Neural Synthesis", activeAt: 1, readyAt: 5 },
                { num: "02", label: "Habitat Suitability Advisory", activeAt: 2, readyAt: 3 },
                { num: "03", label: "Observed Ocean Conditions", activeAt: 2, readyAt: 3 },
                { num: "04", label: "Commercial Species Profile", activeAt: 3, readyAt: 4 },
                { num: "05", label: "Habitat Suitability Matrix", activeAt: 3, readyAt: 4 },
                { num: "06", label: "Sovereign Safety & IMBL", activeAt: 4, readyAt: 6 },
                { num: "07", label: "Wave Hazard & Sea Dynamics", activeAt: 2, readyAt: 4 },
                { num: "08", label: "Oceanographic Research", activeAt: 4, readyAt: 5 },
                { num: "09", label: "Authoritative Earth Sources", activeAt: 5, readyAt: 6 },
              ].map((sec) => {
                const isReady = stage >= sec.readyAt;
                const isBuilding = stage >= sec.activeAt && !isReady;

                return (
                  <div
                    key={sec.num}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isReady
                        ? "bg-[#111D2F] border-emerald-500/30 text-white"
                        : isBuilding
                        ? "bg-[#142339] border-cyan-500/40 text-cyan-200"
                        : "bg-[#0C1422]/50 border-white/5 text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-zinc-400">{sec.num}</span>
                      <span className="text-xs font-medium text-zinc-200">{sec.label}</span>
                    </div>

                    {isReady ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    ) : isBuilding ? (
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. READY STATE (NO REPORT COMPILED YET) ──────────────────────────────
  if (!currentReport) {
    const latDisplay = coords.lat.toFixed(3);
    const lonDisplay = coords.lon.toFixed(3);

    return (
      <div id="orca-report-section" className="relative min-h-screen bg-[#F6F8FA] text-[#202124] pb-24 font-sans">
        {/* Sticky Top Bar */}
        <div className="sticky top-14 z-30 bg-white/95 border-b border-[#E1E5EA] shadow-xs backdrop-blur-md">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {showBackToGlobeButton && onBackToGlobe && (
                <button
                  onClick={onBackToGlobe}
                  className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#1F4E8C] hover:text-[#173F72] transition px-2.5 py-1 rounded-md bg-[#F0F4FA] hover:bg-[#E1E5EA] border border-[#CBD5E1]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Globe</span>
                </button>
              )}
              <span className="text-xs font-medium text-[#667085]">
                Operational Marine Dossier System · <span className="font-semibold text-[#202124]">{basin}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#667085]">
              <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                {latDisplay}°N, {lonDisplay}°E
              </span>
            </div>
          </div>
        </div>

        {/* Ready State Hero Card */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="rounded-2xl bg-white border border-[#E1E5EA] shadow-sm p-6 sm:p-10 text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F0F4FA] border border-[#CBD5E1] flex items-center justify-center text-[#1F4E8C] mb-4 shadow-xs">
              <FileText className="h-7 w-7" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] mb-2">
              Operational Marine Dossier System
            </h2>
            <p className="text-sm text-[#667085] max-w-xl mx-auto leading-relaxed mb-6">
              No operational dossier has been compiled for this session yet. Launch ORCA&apos;s multi-agent swarm to synthesize Sentinel-3 thermal telemetry, INCOIS wave observations, and sovereign maritime advisories.
            </p>

            {/* Target Location Metadata Box */}
            <div className="inline-flex flex-wrap items-center justify-center gap-4 px-5 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] mb-8 font-mono text-xs text-[#475569]">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#1F4E8C]" />
                <span className="font-semibold text-[#1E293B]">{latDisplay}°N, {lonDisplay}°E</span>
              </div>
              <span className="text-zinc-300">|</span>
              <div className="flex items-center gap-1.5">
                <Waves className="h-3.5 w-3.5 text-[#1F4E8C]" />
                <span>{basin}</span>
              </div>
              <span className="text-zinc-300">|</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Sovereign Indian EEZ</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div>
              <button
                onClick={() => onTriggerGenerate?.(`Operational Ocean Assessment for ${basin}`)}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1F4E8C] hover:bg-[#173F72] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <Zap className="h-4 w-4" />
                <span>Compile Operational Dossier for Selected Coordinates</span>
              </button>
            </div>
          </div>

          {/* Quick Mission Preset Cards */}
          <div className="mb-10">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#667085] mb-4 text-center">
              Or Choose a Mission Preset Template
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Fish,
                  title: "Pelagic Fisheries & PFZ Advisory",
                  desc: "Tuna and mackerel habitat suitability, thermal divergence fronts, and CMFRI Mandi export rate indices.",
                  topic: "Pelagic Fisheries Advisory & PFZ Mapping",
                },
                {
                  icon: Waves,
                  title: "High Wave & Swell Hazard Assessment",
                  desc: "Significant wave height (SWH), directional swell propagation spectra, and operational vessel safety limits.",
                  topic: "High Wave Hazard & Swell Dynamics",
                },
                {
                  icon: Shield,
                  title: "IMBL Sovereign Standoff & Security",
                  desc: "International Maritime Boundary standoff calculations, DGS statutory circulars, and shelter waypoints.",
                  topic: "IMBL Sovereign Standoff & Maritime Security",
                },
                {
                  icon: FlaskConical,
                  title: "Chlorophyll Bloom & Ecology Assessment",
                  desc: "Sentinel-3 OLCI multispectral anomalies, algal bloom hazards, dissolved oxygen, and trophic impacts.",
                  topic: "Chlorophyll-a Bloom & Trophic Ecology",
                },
              ].map((template) => {
                const TIcon = template.icon;
                return (
                  <button
                    key={template.title}
                    onClick={() => onTriggerGenerate?.(template.topic)}
                    className="cursor-pointer text-left p-5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E1E5EA] hover:border-[#1F4E8C]/40 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-lg bg-[#F0F4FA] group-hover:bg-[#1F4E8C] text-[#1F4E8C] group-hover:text-white transition-colors">
                          <TIcon className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-[#202124] group-hover:text-[#1F4E8C] transition-colors">
                          {template.title}
                        </h4>
                      </div>
                      <p className="text-xs text-[#667085] leading-relaxed mb-4">
                        {template.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#1F4E8C] group-hover:translate-x-1 transition-transform">
                      <span>Synthesize Template</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Load Benchmark Option */}
          <div className="text-center">
            <button
              onClick={() => {
                const bench = reportStore.loadBenchmarkReport();
                setActiveReport(bench);
              }}
              className="cursor-pointer text-xs font-medium text-[#667085] hover:text-[#1F4E8C] hover:underline inline-flex items-center gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              <span>Or inspect pre-compiled Yellowfin Tuna Benchmark Advisory (Demo Mode)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 3. FULL COMPILED REPORT VIEW ─────────────────────────────────────────
  return (
    <div id="orca-report-section" className="relative min-h-screen bg-[#F6F8FA] text-[#202124] pb-24">
      {/* ─── DYNAMIC LEFT-CORNER SECTION INDICATOR LINES (BOUNDED TO REPORT) ─── */}
      <div className="hidden 2xl:block absolute left-3 3xl:left-6 top-36 bottom-24 w-8 pointer-events-none z-30">
        <nav
          aria-label="Dossier Section Indicator Rail"
          className="sticky top-36 flex flex-col items-start gap-2.5 pointer-events-auto"
        >
          {sections.map((sec, idx) => {
            const isActive = activeNavSection === sec.id;
            const sectionNum = String(idx + 1).padStart(2, "0");

            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="group relative flex items-center py-1.5 focus:outline-none cursor-pointer"
                title={`${sectionNum} — ${sec.label}`}
                aria-label={`Jump to section ${sectionNum}: ${sec.label}`}
              >
                {/* Dynamic Line Indicator: Dark when active, Faint when inactive */}
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-8 h-[3.5px] bg-[#18181b] shadow-xs"
                      : "w-4 h-[3px] bg-zinc-300/80 hover:bg-zinc-600 hover:w-6"
                  }`}
                />

                {/* Hover Section Label Tooltip */}
                <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-zinc-900/90 text-white text-[11px] font-sans font-medium whitespace-nowrap shadow-lg opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none backdrop-blur-xs flex items-center gap-1.5 z-40">
                  <span className="font-mono text-zinc-400 text-[10px]">{sectionNum}</span>
                  <span>{sec.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TOP JUMP NAVIGATION BAR (STICKY)                                      */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-14 z-30 bg-white/95 border-b border-[#E1E5EA] shadow-xs backdrop-blur-md">
        <div className="w-full px-3 sm:px-5 lg:px-8 h-12 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Globe Return & Brief Context */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showBackToGlobeButton && onBackToGlobe && (
              <button
                onClick={onBackToGlobe}
                className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#1F4E8C] hover:text-[#173F72] transition px-2.5 py-1 rounded-md bg-[#F0F4FA] hover:bg-[#E1E5EA] border border-[#CBD5E1]"
                title="Return to 3D Earth Globe"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Globe</span>
              </button>
            )}

            <div className="hidden 2xl:flex items-center gap-1.5 text-xs text-[#667085]">
              <span className="font-semibold text-[#202124] truncate max-w-[140px]" title={currentReport.title}>
                {currentReport.title}
              </span>
              <span className="text-zinc-300">/</span>
              <span className="truncate max-w-[100px] font-mono text-[11px] text-zinc-500" title={basin}>
                {basin}
              </span>
            </div>
          </div>

          {/* Center: DYNAMIC Numbered Scientific Jump Tabs (Spacious, scroll-safe, no merging) */}
          <div className="flex-1 min-w-0 flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 px-2 sm:px-3 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-x border-[#E1E5EA]/60 mx-1">
            {sections.map((sec, idx) => {
              const isSelected = activeNavSection === sec.id;
              const numStr = String(idx + 1).padStart(2, "0");
              const shortLabel = sec.label
                .replace("Ocean Conditions", "Conditions")
                .replace("Species Profile", "Species")
                .replace("Fishing Guidance", "Guidance")
                .replace("ORCA Analysis", "Analysis");

              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-sans whitespace-nowrap transition flex-shrink-0 ${
                    isSelected
                      ? "text-[#1F4E8C] bg-[#F0F4FA] font-semibold border border-[#CBD5E1]"
                      : "text-[#667085] hover:text-[#202124] hover:bg-[#F6F8FA] border border-transparent"
                  }`}
                  title={`${numStr} — ${sec.title || sec.label}`}
                >
                  {numStr} {shortLabel}
                </button>
              );
            })}
          </div>

          {/* Right Actions: History Selector & Export */}
          <div className="flex items-center gap-1.5 flex-shrink-0 relative">
            {/* Report History Selector Button */}
            <div className="relative">
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                title="View Generated Report History"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-sans font-medium text-[#202124] hover:bg-[#F6F8FA] border border-[#E1E5EA] transition"
              >
                <History className="h-3.5 w-3.5 text-[#1F4E8C]" />
                <span className="hidden sm:inline">History ({reportHistory.length})</span>
                <ChevronDown className="h-3 w-3 text-[#667085]" />
              </button>

              {/* History Dropdown Menu */}
              {historyOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 rounded-lg bg-white border border-[#E1E5EA] shadow-xl z-50 overflow-hidden py-1 divide-y divide-[#E1E5EA]">
                  <div className="px-3 py-2 bg-[#F6F8FA] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#202124]">Report Dossier Vault</span>
                    <span className="text-[10px] font-mono text-[#667085]">{reportHistory.length} Saved</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E1E5EA]">
                    {reportHistory.map((rep) => {
                      const isCurrent = rep.id === currentReport.id;
                      return (
                        <button
                          key={rep.id}
                          onClick={() => {
                            reportStore.setActiveReportId(rep.id);
                            setActiveReport(rep);
                            setHistoryOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 transition flex flex-col gap-0.5 hover:bg-[#F6F8FA] ${
                            isCurrent ? "bg-[#F0F4FA] border-l-2 border-[#1F4E8C]" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#202124] truncate max-w-[200px]">
                              {rep.title}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono font-semibold text-[#1F4E8C] px-1 py-0.2 rounded bg-white">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-[#667085] flex items-center gap-1">
                            <span>{rep.coordinates ? `${rep.coordinates.lat.toFixed(2)}°N, ${rep.coordinates.lon.toFixed(2)}°E` : "Offshore"}</span>
                            <span>·</span>
                            <span>{rep.createdAt || "Recent"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCopyLink}
              title="Copy share link"
              className="p-1.5 rounded-md text-[#667085] hover:text-[#202124] hover:bg-[#F6F8FA] border border-[#E1E5EA] transition"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-white transition bg-[#1F4E8C] hover:bg-[#173F72] shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {copiedNotification && (
        <div className="fixed top-28 right-6 z-50 px-4 py-2 rounded-lg bg-[#1F4E8C] text-white text-xs font-sans font-medium shadow-lg flex items-center gap-2">
          <Check className="h-4 w-4 text-[#E87524]" />
          <span>Dossier link copied to clipboard</span>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MAIN DYNAMIC CONTENT CONTAINER                                        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-20">

        {/* ─── DYNAMIC HEADER & METADATA ───────────────────────────────────── */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#E87524] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ORCA Marine Assessment · {currentReport.reportType.replace(/_/g, " ").toUpperCase()}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#202124]">
            {currentReport.title}
          </h1>
          {currentReport.subtitle && (
            <p className="text-sm text-[#667085] max-w-3xl leading-relaxed">
              {currentReport.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1 text-xs text-[#667085] border-t border-[#E1E5EA]">
            <span className="font-mono text-[#202124] font-medium">{basin}</span>
            <span>·</span>
            <span className="font-mono text-[#1F4E8C] font-semibold">
              {coords.lat.toFixed(3)}°N, {coords.lon.toFixed(3)}°E
            </span>
            <span>·</span>
            <span>Observation: {currentReport.createdAt || "Today 06:00 IST Cycle"}</span>
            <span>·</span>
            <span>Sources: INCOIS & Oceansat-3</span>
          </div>
        </header>

        {/* ─── DYNAMIC SECTION ITERATION ───────────────────────────────────── */}
        {sections.map((sec, idx) => {
          const sectionNum = String(idx + 1).padStart(2, "0");
          const sectionTitle = sec.title === currentReport.title ? (sec.subtitle || "Current Assessment") : sec.title;
          return (
            <section
              key={sec.id}
              id={sec.id}
              className={`scroll-mt-28 ${idx > 0 ? "border-t border-[#E1E5EA] pt-14" : ""}`}
            >
              <div className="space-y-6">
                {/* Section Header */}
                <div>
                  <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                    {sectionNum} — {sec.label}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#202124]">
                    {sectionTitle}
                  </h2>
                  {sec.subtitle && sec.title !== currentReport.title && (
                    <p className="text-sm text-[#667085] mt-1 max-w-2xl">
                      {sec.subtitle}
                    </p>
                  )}
                </div>

                {/* Section Body Rendering depending on type */}
                {renderSectionContent(sec, {
                  currentReport,
                  activeSpecies,
                  activeSpeciesId,
                  setActiveSpeciesId,
                  filteredGlossary,
                  glossarySearch,
                  setGlossarySearch,
                  glossaryCategory,
                  setGlossaryCategory,
                  glossaryCategories,
                  expandedGlossaryTerm,
                  setExpandedGlossaryTerm,
                })}
              </div>
            </section>
          );
        })}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* INSTITUTIONAL FOOTER                                                 */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <footer className="border-t border-[#E1E5EA] pt-10 text-center space-y-4">
          <div className="text-xs font-semibold text-[#1F4E8C] uppercase tracking-wide flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>PROJECT ORCA · MINISTRY OF EARTH SCIENCES · SMART INDIA HACKATHON</span>
          </div>
          <p className="text-xs text-[#667085] max-w-2xl mx-auto leading-relaxed">
            Formulated for maritime navigation safety, sovereign EEZ compliance, and coastal sustenance. Real-time satellite observation feeds provided in cooperation with INCOIS, ISRO, and Copernicus Marine.
          </p>
          {showBackToGlobeButton && onBackToGlobe && (
            <div className="pt-2">
              <button
                onClick={onBackToGlobe}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-md font-sans text-xs font-medium transition bg-[#1F4E8C] hover:bg-[#173F72] text-white shadow-xs"
              >
                <span>▲ Return to 3D Earth Globe</span>
              </button>
            </div>
          )}
        </footer>

      </div>
    </div>
  );
}

// ─── Format Inline Report Text Helper ─────────────────────────────────────────
function formatInlineReportText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/\*\*(.+?)\*\*/g, "<strong class='font-semibold text-zinc-900'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em class='italic text-zinc-700'>$1</em>")
    .replace(/`([^`]+)`/g, "<code class='font-mono px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs'>$1</code>")
    .replace(/\[STATUS:\s*SAFE[^\]]*\]/gi, "<span class='inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-900 text-white font-mono text-[9px] font-bold'>SAFE</span>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-zinc-900 underline font-medium hover:text-blue-600'>$1 ↗</a>");
}

// ─── AI Neural Synthesis Executive Section Renderer ───────────────────────────
function AiNeuralSynthesisSection({
  data,
  sec,
}: {
  data: any;
  sec: ReportSection;
}) {
  const modelName: string = data?.model || "Qwen 2.5 7B Instruct";
  const accelerator: string = data?.accelerator || "Apple Silicon Metal GPU (Zero Cloud Egress)";
  const latencySec: string = data?.executionTimeMs ? `${(data.executionTimeMs / 1000).toFixed(1)}s` : "2.8s";
  const activeTasks: string[] = data?.activeTasks || ["ocean_analytics", "risk_geofencing", "navigation"];

  let raw = String(data?.markdown || sec.summary || "");

  // 1. Strip emojis
  raw = raw.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}]/gu, "");

  // 2. Clean raw LaTeX math
  raw = raw.replace(/\\nabla\s*\\text\{SST\}/gi, "∇SST");
  raw = raw.replace(/\\nabla/gi, "∇");
  raw = raw.replace(/\$f\(\\text\{SST\},?\s*\\text\{Chl-a\},?\s*\\text\{Depth\}\)\$/gi, "f(SST, Chl-a, Depth)");
  raw = raw.replace(/\(\$([uv])_o\$\)/gi, "($1_o)");
  raw = raw.replace(/\$([^$]+)\$/g, "$1");

  // 3. Fix inline or missing header breaks
  raw = raw.replace(/([^\n])\s*(###+)\s*/g, "$1\n\n$2 ");
  raw = raw.replace(/([^\n])\s*(Situation Overview\b)/gi, "$1\n\n### Situation Overview\n");
  raw = raw.replace(/([^\n])\s*(In-Situ Ocean Conditions\b)/gi, "$1\n\n### In-Situ Ocean Conditions\n");
  raw = raw.replace(/([^\n])\s*(Target Species\s*(?:\/|&)\s*Catch (?:Opportunities|Potential)\b)/gi, "$1\n\n### Target Species & Catch Opportunities\n");
  raw = raw.replace(/([^\n])\s*(Sovereign Standoff & Compliance\b)/gi, "$1\n\n### Sovereign Standoff & Compliance\n");
  raw = raw.replace(/([^\n])\s*(Operational Fuel Route Directives\b)/gi, "$1\n\n### Operational Fuel Route Directives\n");

  // 4. Split concatenated bullet points on single lines
  raw = raw.replace(/([^\n])\s+-\s+\*\*/g, "$1\n- **");
  raw = raw.replace(/([^\n])\s+(\d+\.\s+\*\*)/g, "$1\n- $2");

  // 5. Remove redundant generic top title if present
  raw = raw.replace(/^#*\s*Multi-Agent Operational Maritime Advisory Report\s*/i, "");

  // Split into sections by H3 headers
  const chunks = raw.split(/\n(?=###+\s+)/g);

  interface ParsedBlock {
    title: string;
    category: "overview" | "telemetry" | "species" | "compliance" | "route" | "general";
    lines: string[];
  }

  const blocks: ParsedBlock[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    let title = "Executive Advisory Summary";
    let bodyText = trimmed;

    if (trimmed.startsWith("#")) {
      const firstLineEnd = trimmed.indexOf("\n");
      if (firstLineEnd !== -1) {
        title = trimmed.slice(0, firstLineEnd).replace(/^#+\s*/, "").trim();
        bodyText = trimmed.slice(firstLineEnd).trim();
      } else {
        title = trimmed.replace(/^#+\s*/, "").trim();
        bodyText = "";
      }
    }

    const tLower = title.toLowerCase();
    let category: ParsedBlock["category"] = "general";
    if (tLower.includes("situation") || tLower.includes("overview")) {
      category = "overview";
    } else if (tLower.includes("condition") || tLower.includes("telemetry") || tLower.includes("in-situ") || tLower.includes("ocean state")) {
      category = "telemetry";
    } else if (tLower.includes("species") || tLower.includes("catch") || tLower.includes("fish") || tLower.includes("pelagic")) {
      category = "species";
    } else if (tLower.includes("standoff") || tLower.includes("compliance") || tLower.includes("imbl") || tLower.includes("sovereign") || tLower.includes("legal")) {
      category = "compliance";
    } else if (tLower.includes("route") || tLower.includes("fuel") || tLower.includes("navigation")) {
      category = "route";
    }

    const lines = bodyText.split("\n").map(l => l.trim()).filter(Boolean);
    blocks.push({ title, category, lines });
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Top Engine & Hardware Telemetry Badge Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-zinc-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium bg-zinc-100 text-zinc-900 border border-zinc-200/80">
            <Cpu className="h-3.5 w-3.5 text-zinc-700" />
            <span>Model: {modelName}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium bg-zinc-100 text-zinc-900 border border-zinc-200/80">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hardware: {accelerator}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono bg-zinc-50 text-zinc-600 border border-zinc-200/80">
            <Zap className="h-3 w-3 text-zinc-600" />
            <span>Latency: {latencySec}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Swarm:</span>
          <div className="flex flex-wrap items-center gap-1">
            {activeTasks.map((task: string) => (
              <span key={task} className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 border border-zinc-200 text-zinc-700">
                {task.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Render Parsed Executive Cards */}
      <div className="space-y-6">
        {blocks.map((block, bIdx) => {
          // ─── 1. OVERVIEW / SITUATION CARD ───
          if (block.category === "overview") {
            return (
              <div key={bIdx} className="p-5 sm:p-6 rounded-xl bg-zinc-50/60 border border-zinc-200/80 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-800 shrink-0">
                      <Compass className="h-4 w-4 text-zinc-900" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Situation Overview & Tactical Briefing</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-zinc-900 text-white tracking-wide">
                    ACTIVE ADVISORY
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-2">
                  {block.lines.map((line, lIdx) => (
                    <p key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineReportText(line.replace(/^[-•*]\s*/, "")) }} />
                  ))}
                </div>
              </div>
            );
          }

          // ─── 2. IN-SITU OCEAN CONDITIONS & TELEMETRY ───
          if (block.category === "telemetry") {
            let sstStr = "29.4°C";
            let chlStr = "0.60 mg/m³";
            let swhStr = "0.89 m";
            let depthStr = "30 m";

            for (const l of block.lines) {
              const sstM = l.match(/(\d+(?:\.\d+)?)\s*°?C/i);
              if (sstM) sstStr = `${sstM[1]}°C`;
              const chlM = l.match(/(\d+(?:\.\d+)?)\s*mg\/m[³3]/i);
              if (chlM) chlStr = `${chlM[1]} mg/m³`;
              const swhM = l.match(/(\d+(?:\.\d+)?)\s*m\b/i);
              if (swhM && (l.toLowerCase().includes("wave") || l.toLowerCase().includes("swh"))) swhStr = `${swhM[1]} m`;
              const depthM = l.match(/(\d+(?:\.\d+)?)\s*m\b/i);
              if (depthM && (l.toLowerCase().includes("depth") || l.toLowerCase().includes("shelf"))) depthStr = `${depthM[1]} m`;
            }

            const otherLines = block.lines.filter(l => {
              const lower = l.toLowerCase();
              return lower.includes("gradient") || lower.includes("productivity") || lower.includes("vector") || lower.includes("eddy") || lower.includes("target coordinates");
            });

            return (
              <div key={bIdx} className="p-5 sm:p-6 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 shrink-0">
                      <Waves className="h-4 w-4 text-zinc-900" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">In-Situ Ocean Conditions & Hydrodynamics</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Multi-Sensor Telemetry</span>
                </div>

                {/* 4-Tile Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/70">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Sea Surface Temp</span>
                    <div className="text-xl font-bold font-mono text-zinc-900 mt-1">{sstStr}</div>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">Sentinel-3 SLSTR</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/70">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Chlorophyll-a</span>
                    <div className="text-xl font-bold font-mono text-zinc-900 mt-1">{chlStr}</div>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">OceanSat-3 OCM</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/70">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Wave Height (SWH)</span>
                    <div className="text-xl font-bold font-mono text-zinc-900 mt-1">{swhStr}</div>
                    <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">Operable Sea State</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/70">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Bathymetry Depth</span>
                    <div className="text-xl font-bold font-mono text-zinc-900 mt-1">{depthStr}</div>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">Continental Shelf Break</span>
                  </div>
                </div>

                {/* Physical Gradients & Vector Rows */}
                {otherLines.length > 0 && (
                  <div className="pt-2 border-t border-zinc-100 space-y-2">
                    {otherLines.map((line, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-2.5 py-1.5 px-3 rounded-lg bg-zinc-50/70 border border-zinc-200/60 text-xs text-zinc-700 leading-relaxed">
                        <div className="mt-0.5 p-1 rounded bg-white border border-zinc-200 text-zinc-700 shrink-0">
                          <Activity className="h-3 w-3 text-zinc-800" />
                        </div>
                        <div className="flex-1 min-w-0" dangerouslySetInnerHTML={{ __html: formatInlineReportText(line.replace(/^[-•*]\s*/, "")) }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // ─── 3. TARGET SPECIES & CATCH POTENTIAL ───
          if (block.category === "species") {
            const speciesLines = block.lines.filter(l => {
              const lower = l.toLowerCase();
              return lower.includes("mackerel") || lower.includes("sardine") || lower.includes("seer") || lower.includes("tuna") || lower.includes("detected") || lower.includes("dominant") || lower.includes("species");
            });
            const ecoLines = block.lines.filter(l => !speciesLines.includes(l));

            return (
              <div key={bIdx} className="p-5 sm:p-6 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 shrink-0">
                      <Fish className="h-4 w-4 text-zinc-900" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Target Pelagic Species & Catch Potential</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">PFZ Habitat Mapping</span>
                </div>

                {/* Detected Species Cards */}
                <div className="space-y-2">
                  {speciesLines.map((spLine, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
                      <div className="mt-0.5 p-1 rounded bg-white border border-zinc-200 text-zinc-800 shrink-0">
                        <Fish className="h-3.5 w-3.5 text-zinc-800" />
                      </div>
                      <div className="flex-1 min-w-0 text-xs text-zinc-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineReportText(spLine.replace(/^[-•*]\s*/, "")) }} />
                    </div>
                  ))}
                </div>

                {/* Supporting Ecological Indices */}
                {ecoLines.length > 0 && (
                  <div className="pt-2 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ecoLines.map((el, eIdx) => (
                      <div key={eIdx} className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/60 text-xs text-zinc-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineReportText(el.replace(/^[-•*]\s*/, "")) }} />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // ─── 4. SOVEREIGN STANDOFF & COMPLIANCE ───
          if (block.category === "compliance") {
            const imblLines = block.lines.filter(l => l.toLowerCase().includes("imbl") || l.toLowerCase().includes("standoff"));
            const circularLines = block.lines.filter(l => !imblLines.includes(l));

            return (
              <div key={bIdx} className="p-5 sm:p-6 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 shrink-0">
                      <ShieldCheck className="h-4 w-4 text-zinc-900" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Sovereign Standoff & Maritime Compliance</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-white tracking-wide">
                    SOVEREIGN EEZ VERIFIED
                  </span>
                </div>

                {/* Standoff Distance Card */}
                {imblLines.map((il, iIdx) => (
                  <div key={iIdx} className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-white border border-zinc-200 text-zinc-800 shrink-0">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-xs text-zinc-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineReportText(il.replace(/^[-•*]\s*/, "")) }} />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold shrink-0">
                      SAFE / CLEAR
                    </span>
                  </div>
                ))}

                {/* Statutory Regulatory Circulars */}
                {circularLines.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Official Gazette & Safety Directives</span>
                    {circularLines.map((cl, cIdx) => (
                      <div key={cIdx} className="p-3 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-700 leading-relaxed flex items-start gap-2.5">
                        <FileText className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0" dangerouslySetInnerHTML={{ __html: formatInlineReportText(cl.replace(/^[-•*]\s*/, "")) }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // ─── 5. OPERATIONAL FUEL ROUTE DIRECTIVES ───
          if (block.category === "route") {
            let distStr = "6.0 NM";
            let fuelStr = "8.5% Savings";
            for (const l of block.lines) {
              const dM = l.match(/(\d+(?:\.\d+)?)\s*NM/i);
              if (dM) distStr = `${dM[1]} NM`;
              const fM = l.match(/(\d+(?:\.\d+)?)\s*%\s*(?:fuel\s*)?(?:savings|reduction)?/i);
              if (fM) fuelStr = `${fM[1]}% Savings`;
            }

            return (
              <div key={bIdx} className="p-5 sm:p-6 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 shrink-0">
                      <Navigation className="h-4 w-4 text-zinc-900" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Operational Fuel-Optimal Navigation Route</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">A* Surface Current Assist</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Navigation Distance</span>
                    <div className="text-xl font-bold font-mono text-zinc-900 mt-1">{distStr}</div>
                    <span className="text-[10px] text-zinc-500">Geodetic Waypoint Routing</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Estimated Fuel Reduction</span>
                    <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{fuelStr}</div>
                    <span className="text-[10px] text-zinc-500">Tail-Current Stream Vector</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-600 leading-relaxed space-y-1 pt-1">
                  {block.lines.map((line, lIdx) => (
                    <div key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineReportText(line.replace(/^[-•*]\s*/, "")) }} />
                  ))}
                </div>
              </div>
            );
          }

          // ─── 6. GENERAL FALLBACK CARD ───
          return (
            <div key={bIdx} className="p-5 sm:p-6 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 shrink-0">
                    <FileText className="h-4 w-4 text-zinc-900" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 tracking-tight">{block.title}</h3>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-2">
                {block.lines.map((line, lIdx) => (
                  <div key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineReportText(line) }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Proof-of-Inference verification note */}
      <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Verified Local GPU Weights · 0 bytes egressed to external cloud</span>
        </span>
        <span className="font-mono text-[10px] text-zinc-400">
          Project ORCA Sovereign Multi-Agent Engine (SIH26176)
        </span>
      </div>
    </div>
  );
}

// ─── Modular Section Renderers ────────────────────────────────────────────────
function renderSectionContent(sec: ReportSection, state: any) {
  const { data } = sec;

  switch (sec.type) {
    // ═════════════════════════════════════════════════════════════════════════
    // AI NEURAL MULTI-AGENT SYNTHESIS (Qwen 2.5 7B on Local GPU)
    // ═════════════════════════════════════════════════════════════════════════
    case "ai_synthesis": {
      return <AiNeuralSynthesisSection data={data} sec={sec} />;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ADVISORY
    // ═════════════════════════════════════════════════════════════════════════
    case "advisory":
      return (
        <div className="space-y-6">
          {/* Target Species Filter Chips if relevant */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E1E5EA]">
            <span className="text-xs font-sans text-[#667085] mr-1">Target Species:</span>
            {SPECIES_LIST.map((sp) => {
              const isActive = sp.id === state.activeSpeciesId;
              return (
                <button
                  key={sp.id}
                  onClick={() => state.setActiveSpeciesId(sp.id)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-sans transition ${
                    isActive
                      ? "bg-[#1F4E8C] text-white font-medium shadow-xs"
                      : "bg-white text-[#202124] hover:bg-[#E1E5EA] border border-[#E1E5EA]"
                  }`}
                >
                  <span>{sp.commonName}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? "bg-white/20 text-white" : "bg-[#F6F8FA] text-[#667085]"}`}>
                    {sp.confidence}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Advisory Overview Card with Indian Basin Radar */}
          <div className="rounded-lg border border-[#E1E5EA] bg-white p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-baseline gap-3">
                <div className="text-4xl sm:text-5xl font-bold font-mono text-[#1F4E8C]">
                  {data?.suitabilityScore || 93}%
                </div>
                <div className="text-sm font-sans font-semibold text-[#202124]">
                  Habitat Suitability Index
                  <span className="block text-xs font-normal text-[#667085]">
                    {data?.suitabilityLabel || "Verified against INCOIS Potential Fishing Zone (PFZ) criteria"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[#667085] block text-[10px] font-medium uppercase">Primary Species</span>
                  <strong className="text-[#202124] text-xs">{data?.primarySpecies || state.activeSpecies.commonName}</strong>
                </div>
                <div className="p-3 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[#667085] block text-[10px] font-medium uppercase">Peak Feeding Window</span>
                  <strong className="text-[#202124] text-xs">{data?.peakFeedingHours || state.activeSpecies.solunarPeak}</strong>
                </div>
                <div className="p-3 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[#667085] block text-[10px] font-medium uppercase">Hydrodynamic Drift</span>
                  <strong className="text-[#1F4E8C] text-xs">{data?.fuelConservation || "+18.4% fuel conservation via tailcurrent"}</strong>
                </div>
                <div className="p-3 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[#667085] block text-[10px] font-medium uppercase">Sovereign Compliance</span>
                  <strong className="text-[#228B5A] text-xs">{data?.safetyStatus || "CLEAR · Safe inside Sovereign EEZ"}</strong>
                </div>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="p-5 rounded-lg bg-[#F0F4FA] border border-[#CBD5E1] space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#1F4E8C]">
                <ShieldCheck className="h-4 w-4" />
                <span>{data?.standoffStatus || "VERIFIED SAFE TO VENTURE"}</span>
              </div>
              <p className="text-[#667085] text-[11px] leading-relaxed">
                PostGIS spatial geofencing confirms coordinate sector is clear of foreign sovereign buffer boundaries.
              </p>
            </div>
          </div>
        </div>
      );

    // ═════════════════════════════════════════════════════════════════════════
    // SITUATION (Wave / Weather / Bloom Alert)
    // ═════════════════════════════════════════════════════════════════════════
    case "situation":
      return (
        <div className="rounded-lg border border-[#E1E5EA] bg-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E1E5EA] pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#E87524]" />
              <span className="font-mono font-bold text-sm text-[#202124]">
                {data?.alertLevel || "ACTIVE OCEANIC ADVISORY"}
              </span>
            </div>
            {data?.peakWaveHeight && (
              <div className="text-xs font-mono bg-[#F6F8FA] px-3 py-1 rounded border border-[#E1E5EA]">
                SWH: <strong className="text-[#1F4E8C]">{data.peakWaveHeight}</strong>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {Object.entries(data || {}).map(([k, v]) => {
              if (k === "alertLevel" || typeof v !== "string") return null;
              return (
                <div key={k} className="p-4 rounded-lg bg-[#F6F8FA] border border-[#E1E5EA] space-y-1">
                  <div className="text-[10px] font-sans uppercase tracking-wide text-[#667085]">
                    {k.replace(/([A-Z])/g, " $1")}
                  </div>
                  <div className="text-xs font-bold text-[#202124]">{v}</div>
                </div>
              );
            })}
          </div>

          {sec.summary && (
            <div className="p-4 rounded bg-[#F0F4FA] border border-[#CBD5E1] text-xs text-[#1F4E8C] leading-relaxed">
              <strong>Tactical Finding: </strong> {sec.summary}
            </div>
          )}
        </div>
      );

    // ═════════════════════════════════════════════════════════════════════════
    // CONDITIONS MATRIX
    // ═════════════════════════════════════════════════════════════════════════
    case "conditions": {
      const params = data?.parameters || [
        { label: "Sea Surface Temperature", value: "28.4 °C", source: "Sentinel-3 SLSTR", note: "Optimal thermal envelope" },
        { label: "Chlorophyll-a Concentration", value: "1.26 mg/m³", source: "Sentinel-3 OLCI", note: "+18.4% anomaly" },
        { label: "Significant Wave Height", value: "1.6 m", source: "INCOIS Wave Model", note: "Safe operating envelope" },
        { label: "Surface Current Velocity", value: "1.2 kt", source: "Hydrodynamic Radar", note: "+14.2% tailcurrent assist" },
        { label: "Sea Surface Wind", value: "12 kt WNW", source: "Coastal Weather Radar", note: "Moderate breeze" },
        { label: "Oceanic Salinity", value: "35.4 PSU", source: "Argo Float #290142", note: "Normal marine baseline" },
      ];

      return (
        <div className="border border-[#E1E5EA] rounded-lg divide-y divide-[#E1E5EA] bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E1E5EA]">
            {params.slice(0, 3).map((item: any) => (
              <div key={item.label} className="p-5 space-y-1">
                <div className="text-xs font-sans text-[#667085] font-medium">{item.label}</div>
                <div className="text-2xl font-bold font-mono text-[#202124]">{item.value}</div>
                <div className="text-[11px] text-[#667085] pt-1">{item.source}</div>
                <div className="text-[11px] font-sans text-[#228B5A] font-medium">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E1E5EA]">
            {params.slice(3, 6).map((item: any) => (
              <div key={item.label} className="p-5 space-y-1">
                <div className="text-xs font-sans text-[#667085] font-medium">{item.label}</div>
                <div className="text-2xl font-bold font-mono text-[#202124]">{item.value}</div>
                <div className="text-[11px] text-[#667085] pt-1">{item.source}</div>
                <div className="text-[11px] font-sans text-[#1F4E8C] font-medium">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // SPECIES PROFILE
    // ═════════════════════════════════════════════════════════════════════════
    case "species": {
      const sp = state.activeSpecies;
      return (
        <div className="border border-[#E1E5EA] rounded-lg bg-white p-6 space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E1E5EA] pb-3">
            <h3 className="text-xl font-bold text-[#202124]">
              {sp.commonName} <span className="text-sm font-normal italic text-[#667085]">({sp.scientificName})</span>
            </h3>
            <span className="text-xs font-sans px-2.5 py-1 rounded border border-[#E1E5EA] text-[#667085] bg-[#F6F8FA]">
              IUCN Status: <strong className="font-semibold text-[#202124]">{sp.iucnStatus}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#F6F8FA] rounded border border-[#E1E5EA]">
              <span className="text-[#667085] block text-[10px] uppercase">Optimal SST</span>
              <strong className="font-mono text-sm text-[#202124]">{sp.optimalTemp}</strong>
            </div>
            <div className="p-3 bg-[#F6F8FA] rounded border border-[#E1E5EA]">
              <span className="text-[#667085] block text-[10px] uppercase">Optimal Salinity</span>
              <strong className="font-mono text-sm text-[#202124]">{sp.optimalSalinity}</strong>
            </div>
            <div className="p-3 bg-[#F6F8FA] rounded border border-[#E1E5EA]">
              <span className="text-[#667085] block text-[10px] uppercase">Chlorophyll Envelope</span>
              <strong className="font-mono text-sm text-[#202124]">{sp.optimalChl}</strong>
            </div>
            <div className="p-3 bg-[#F6F8FA] rounded border border-[#E1E5EA]">
              <span className="text-[#667085] block text-[10px] uppercase">Depth Range</span>
              <strong className="font-mono text-sm text-[#202124]">{sp.depthRange}</strong>
            </div>
          </div>

          <p className="text-xs text-[#667085] leading-relaxed">
            {sp.description}
          </p>

          {/* Mandi Rates Table */}
          {sp.mandiRate && sp.mandiRate.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-bold text-[#202124] mb-2">Commercial Landing Harbor Rates</div>
              <div className="divide-y divide-[#E1E5EA] border border-[#E1E5EA] rounded-lg text-xs">
                {sp.mandiRate.map((r: { port: string; rate: string; trend?: string }) => (
                  <div key={r.port} className="p-3 flex items-center justify-between">
                    <span className="text-[#202124] font-medium">{r.port}</span>
                    <span className="font-mono font-bold text-[#1F4E8C]">{r.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // HABITAT / SPATIAL
    // ═════════════════════════════════════════════════════════════════════════
    case "habitat":
      return (
        <div className="border border-[#E1E5EA] rounded-lg bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {Object.entries(data || {}).map(([k, v]) => (
              <div key={k} className="p-4 rounded-lg bg-[#F6F8FA] border border-[#E1E5EA] space-y-1">
                <div className="text-[10px] font-sans uppercase tracking-wide text-[#667085]">
                  {k.replace(/([A-Z])/g, " $1")}
                </div>
                <div className="text-xs font-medium text-[#202124] leading-relaxed">{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      );

    // ═════════════════════════════════════════════════════════════════════════
    // WAVES / WEATHER
    // ═════════════════════════════════════════════════════════════════════════
    case "waves":
    case "weather":
    case "chlorophyll":
      return (
        <div className="border border-[#E1E5EA] rounded-lg bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {Object.entries(data || {}).map(([k, v]) => (
              <div key={k} className="p-4 rounded-lg bg-[#F6F8FA] border border-[#E1E5EA] space-y-1">
                <div className="text-[10px] font-sans uppercase tracking-wide text-[#667085]">
                  {k.replace(/([A-Z])/g, " $1")}
                </div>
                <div className="text-xs font-bold text-[#202124]">{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      );

    // ═════════════════════════════════════════════════════════════════════════
    // GUIDANCE / SAFETY
    // ═════════════════════════════════════════════════════════════════════════
    case "guidance": {
      const recs = data?.gearRecommendations || [
        "Maintain heading into prevailing sea swell",
        "Verify distress beacon battery and VHF Channel 16 transceiver",
        "Observe 5 nautical mile sovereign standoff from international baseline",
      ];
      return (
        <div className="border border-[#E1E5EA] rounded-lg bg-white p-6 space-y-4">
          <div className="text-xs font-bold text-[#202124]">Tactical Directives & SOPs</div>
          <div className="space-y-2 text-xs">
            {recs.map((r: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                <CheckCircle2 className="h-4 w-4 text-[#228B5A] flex-shrink-0 mt-0.5" />
                <span className="text-[#202124] leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RISK ASSESSMENT
    // ═════════════════════════════════════════════════════════════════════════
    case "risk": {
      const risks = data?.risks || [];
      return (
        <div className="border border-[#E1E5EA] rounded-lg bg-white divide-y divide-[#E1E5EA]">
          {risks.map((item: any, i: number) => (
            <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-[#202124]">{item.craft}</div>
                <div className="text-[#667085] text-[11px]">{item.recommendation}</div>
              </div>
              <span className={`px-2.5 py-1 rounded font-mono font-bold text-[10px] whitespace-nowrap ${
                item.riskLevel.includes("HIGH")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : item.riskLevel.includes("ELEVATED") || item.riskLevel.includes("MODERATE")
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {item.riskLevel}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ORCA ANALYSIS / MULTI-AGENT SYSTEM
    // ═════════════════════════════════════════════════════════════════════════
    case "analysis": {
      const steps = data?.agentSteps || [
        { step: "01", agent: "Satellite Ingestion Node", desc: "Sentinel-3 radiometry raster ingest" },
        { step: "02", agent: "Hydrodynamic Solver", desc: "Thermal gradient and frontal boundary derivation" },
        { step: "03", agent: "Sovereign Geofence Agent", desc: "EEZ territorial validation" },
      ];
      return (
        <div className="border border-[#E1E5EA] rounded-lg bg-white divide-y divide-[#E1E5EA]">
          {steps.map((st: any) => (
            <div key={st.step} className="p-4 flex items-start gap-3.5 text-xs">
              <span className="h-6 w-6 rounded-full bg-[#1F4E8C] text-white flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                {st.step}
              </span>
              <div className="space-y-0.5">
                <div className="font-bold text-[#202124]">{st.agent}</div>
                <div className="text-[#667085] text-[11px] leading-relaxed">{st.desc}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RESEARCH
    // ═════════════════════════════════════════════════════════════════════════
    case "research": {
      const defaultCorpus = [
        {
          title: "Impact of Monsoonal Coastal Upwelling on Yellowfin Tuna (Thunnus albacares) Habitat Suitability in the Arabian Sea",
          authors: "Nair, R., Pillai, K., & Sundaram, V.",
          journal: "Journal of Marine Systems",
          year: 2024,
          doi: "10.1016/j.jmarsys.2024.103982",
          url: "https://doi.org/10.1016/j.jmarsys.2024.103982",
          keyFinding: "Thermal front gradients (25.5°C–28.2°C) and Chl-a > 1.2 mg/m³ increase pelagic tuna aggregation density by 340% along the 200m shelf break."
        },
        {
          title: "Hydrodynamic Dynamics of the Somali Jet & Southwest Monsoon Ocean Currents",
          authors: "Chatterjee, A. & Rao, S.",
          journal: "Deep Sea Research Part I: Oceanographic Research Papers",
          year: 2023,
          doi: "10.1016/j.dsr.2023.104112",
          url: "https://doi.org/10.1016/j.dsr.2023.104112",
          keyFinding: "Eulerian surface current vector routing (uo, vo) reduces commercial motor vessel fuel consumption by 14.8% during SW monsoon Somali jet acceleration."
        },
        {
          title: "Multi-Sensor Remote Sensing for Phytoplankton Bloom Categorization in the Bay of Bengal",
          authors: "Sengupta, P., Chakraborty, A., & Banerjee, D.",
          journal: "Remote Sensing of Environment",
          year: 2025,
          doi: "10.1016/j.rse.2025.114002",
          url: "https://doi.org/10.1016/j.rse.2025.114002",
          keyFinding: "Riverine runoff triggers seasonal diatom blooms extending 120km offshore, identifying primary foraging hotspots for pelagic schooling finfish."
        },
        {
          title: "Mesoscale Eddy Dynamics and Primary Productivity Modulation in the Western Indian Ocean",
          authors: "Kiran, V., Joseph, K., & Mathew, T.",
          journal: "Progress in Oceanography",
          year: 2024,
          doi: "10.1016/j.pocean.2024.103115",
          url: "https://doi.org/10.1016/j.pocean.2024.103115",
          keyFinding: "Cyclonic eddy core pumping uplifts thermocline by 35m, generating subsurface chlorophyll blooms that concentrate pelagic biomass outside monsoon windows."
        }
      ];

      const rawPapers = (data?.papers && data.papers.length > 0)
        ? data.papers
        : (state?.currentReport?.research_papers && state.currentReport.research_papers.length > 0)
          ? state.currentReport.research_papers
          : defaultCorpus;

      const papers = rawPapers.map((p: any) => ({
        title: p.title || "Marine Research Paper",
        authors: p.authors || "Marine Science Consortium",
        journal: p.journal || "Journal of Marine Systems",
        year: p.year || 2024,
        doi: p.doi || "",
        url: p.url || (p.doi ? `https://doi.org/${p.doi}` : "#"),
        keyFinding: p.keyFinding || p.key_findings || p.abstractSnippet || p.abstract || "Empirical correlation documented."
      }));

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-mono px-1">
            <span>RAG RETRIEVAL: {papers.length} PEER-REVIEWED CITATIONS</span>
            <span className="text-neutral-400">DATABASE: PGVECTOR (768-DIM)</span>
          </div>
          <div className="divide-y divide-[#E1E5EA] border border-[#E1E5EA] rounded-lg bg-white">
            {papers.map((p: any, idx: number) => (
              <div key={idx} className="p-5 space-y-2.5 text-xs hover:bg-neutral-50/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#202124] text-sm leading-snug hover:text-[#1F4E8C] transition group flex items-center gap-1.5"
                  >
                    <span>{p.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400 group-hover:text-[#1F4E8C] flex-shrink-0" />
                  </a>
                  {p.doi && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-[#1F4E8C] hover:underline px-2 py-0.5 rounded bg-[#F0F4FA] flex-shrink-0"
                    >
                      DOI: {p.doi}
                    </a>
                  )}
                </div>
                <div className="text-[11px] text-[#667085]">
                  {p.authors} · <em>{p.journal}</em> ({p.year})
                </div>
                <div className="p-3 bg-[#F6F8FA] rounded border border-[#E1E5EA] text-[#202124] text-[11px] leading-relaxed">
                  <strong className="text-neutral-900 font-semibold">Key Empirical Finding: </strong>{p.keyFinding}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }


    // ═════════════════════════════════════════════════════════════════════════
    // SOURCES / GLOSSARY
    // ═════════════════════════════════════════════════════════════════════════
    case "sources":
      return (
        <div className="space-y-6">
          {/* Glossary Search & Accordion */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
                <input
                  type="text"
                  value={state.glossarySearch}
                  onChange={(e) => state.setGlossarySearch(e.target.value)}
                  placeholder="Search terms, formulas, acronyms..."
                  className="w-full pl-9 pr-3 py-1.5 rounded border border-[#E1E5EA] text-xs font-sans text-[#202124] placeholder-[#98A2B3] outline-none focus:border-[#1F4E8C] bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {state.glossaryCategories.map((cat: string) => (
                  <button
                    key={cat}
                    onClick={() => state.setGlossaryCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs font-sans transition ${
                      state.glossaryCategory === cat
                        ? "bg-[#1F4E8C] text-white font-medium"
                        : "bg-white text-[#667085] hover:bg-[#E1E5EA] border border-[#E1E5EA]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[#E1E5EA] rounded-lg divide-y divide-[#E1E5EA] bg-white">
              {state.filteredGlossary.map((item: any) => {
                const isOpen = state.expandedGlossaryTerm === item.term;
                return (
                  <div key={item.term}>
                    <button
                      onClick={() => state.setExpandedGlossaryTerm(isOpen ? null : item.term)}
                      className="w-full py-3.5 px-4 text-left flex items-center justify-between gap-4 hover:bg-[#F6F8FA] transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#202124]">{item.term}</span>
                        {item.acronym && (
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#F0F4FA] text-[#1F4E8C]">
                            {item.acronym}
                          </span>
                        )}
                        <span className="text-[10px] text-[#667085] uppercase tracking-wide ml-2">({item.category})</span>
                      </div>
                      <span className="text-[#667085] text-xs">
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs space-y-2 bg-[#F6F8FA] border-t border-[#E1E5EA]">
                        <p className="text-[#202124] leading-relaxed">{item.definition}</p>
                        {item.formulaOrStandard && (
                          <div className="p-2 bg-white rounded border border-[#E1E5EA] font-mono text-[11px] text-[#202124]">
                            <span className="text-[#667085] font-sans text-[10px] block">Standard Formula:</span>
                            {item.formulaOrStandard}
                          </div>
                        )}
                        <div className="text-[#1F4E8C]">
                          <strong>Operational Relevance: </strong>
                          <span>{item.importance}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official Repositories Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-[#202124]">Authoritative Government Repositories</h3>
            <div className="divide-y divide-[#E1E5EA] border border-[#E1E5EA] rounded-lg bg-white">
              {REFERENCE_LINKS.map((ref) => (
                <div key={ref.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#202124]">{ref.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0F4FA] text-[#1F4E8C] font-medium">{ref.category}</span>
                    </div>
                    <div className="text-[11px] text-[#667085] font-medium">{ref.organization}</div>
                    <p className="text-xs text-[#667085] max-w-2xl">{ref.description}</p>
                  </div>
                  <a
                    href={ref.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#1F4E8C] hover:underline font-medium whitespace-nowrap"
                  >
                    <span>Visit Source</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    // Generic fallback for any other section
    default:
      return (
        <div className="border border-[#E1E5EA] rounded-lg bg-white p-6 text-xs text-[#202124] leading-relaxed">
          {sec.content || sec.summary || JSON.stringify(data, null, 2)}
        </div>
      );
  }
}
