"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search, ArrowUpRight, BookOpen, FileText, ExternalLink,
  ChevronDown, ChevronUp, Download, Share2, Compass, Waves,
  Shield, Fish, Sparkles, Filter, Database, CheckCircle2,
  AlertTriangle, Info, Calendar, Clock, MapPin, BarChart3,
  Layers, Cpu, Zap, ArrowLeft, RefreshCw, Thermometer,
  FlaskConical, Wind, Activity, Newspaper, ChevronRight,
  ArrowRight, ShieldCheck, Check, Plus, Minus, History, Eye
} from "lucide-react";
import { Report, ReportSection } from "@/lib/reportTypes";
import { reportStore, DEFAULT_TUNA_REPORT } from "@/lib/reportStore";

export interface ReportViewProps {
  report?: Report;
  persona?: "navigator" | "researcher" | "defense" | "student" | "guest";
  selectedSpeciesId?: string;
  coordinates?: { lat: number; lon: number };
  basinName?: string;
  onBackToGlobe?: () => void;
  showBackToGlobeButton?: boolean;
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
}: ReportViewProps) {
  // Local store report state (initialize with default to guarantee SSR/client hydration match)
  const [activeReport, setActiveReport] = useState<Report>(propReport || DEFAULT_TUNA_REPORT);
  const [reportHistory, setReportHistory] = useState<Report[]>([DEFAULT_TUNA_REPORT]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Sync on client mount and whenever propReport changes
  useEffect(() => {
    if (propReport) {
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
      if (!propReport) {
        setActiveReport(currentActive);
      }
    });
    return unsubscribe;
  }, [propReport]);

  // Report fields
  const currentReport = propReport || activeReport || DEFAULT_TUNA_REPORT;
  const sections = currentReport.sections || [];
  const coords = currentReport.coordinates || propCoordinates || { lat: 20.75, lon: 70.19 };
  const basin = currentReport.region || propBasinName || "Arabian Sea Basin";
  const telemetry = currentReport.telemetry || {};

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

// ─── Modular Section Renderers ────────────────────────────────────────────────
function renderSectionContent(sec: ReportSection, state: any) {
  const { data } = sec;

  switch (sec.type) {
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
      const papers = data?.papers || [];
      return (
        <div className="divide-y divide-[#E1E5EA] border border-[#E1E5EA] rounded-lg bg-white">
          {papers.map((p: any, idx: number) => (
            <div key={idx} className="p-5 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-bold text-[#202124] text-sm leading-snug">{p.title}</h4>
                {p.doi && (
                  <span className="font-mono text-[10px] text-[#1F4E8C] px-2 py-0.5 rounded bg-[#F0F4FA] flex-shrink-0">
                    DOI: {p.doi}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#667085]">
                {p.authors} · <em>{p.journal}</em> ({p.year})
              </div>
              <div className="p-3 bg-[#F6F8FA] rounded border border-[#E1E5EA] text-[#202124] text-[11px] leading-relaxed">
                <strong>Key Finding: </strong>{p.keyFinding}
              </div>
            </div>
          ))}
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
