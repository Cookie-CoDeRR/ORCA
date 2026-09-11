import { Report, SpeciesProfileData, ResearchItem, DataSourceItem, GlossaryTermItem } from "./reportTypes";

// Baseline benchmark report (Yellowfin Tuna Advisory)
export const DEFAULT_TUNA_REPORT: Report = {
  id: "rep-benchmark-yellowfin-01",
  title: "Yellowfin Tuna Fishing Advisory",
  subtitle: "Northeastern Arabian Sea Pelagic Divergence Assessment",
  topic: "Yellowfin Tuna Fishing Potential & PFZ Mapping",
  reportType: "fisheries_advisory",
  location: "Veraval Offshore Sector",
  region: "Arabian Sea (Northeastern Basin)",
  coordinates: { lat: 20.75, lon: 70.19 },
  cellId: "IN-EEZ-2075-7019",
  createdAt: "10 Sep 2026 · 06:00 IST",
  updatedAt: "10 Sep 2026 · 06:00 IST",
  status: "completed",
  summary: "Favorable oceanographic convergence detected in the northeastern Arabian Sea. Satellite thermal SST fronts (28.4°C) coupled with Sentinel-3 Chlorophyll-a anomalies (1.26 mg/m³) indicate high epipelagic predator biomass within sovereign Indian EEZ waters.",
  telemetry: {
    resolution: "6 km × 5 km",
    sst: "28.4 °C",
    waves: "1.6 m",
    wind: "12 kt WNW",
    imblStatus: "74.2 km SAFE",
    imblColor: "#228B5A",
    chla: "1.26 mg/m³",
    current: "1.2 kt (215° SW)",
    salinity: "35.4 PSU",
    basin: "Arabian Sea",
    refreshRate: "2.0 s",
  },
  sections: [
    {
      id: "sec-advisory",
      order: 1,
      key: "advisory",
      label: "Advisory",
      title: "Habitat Suitability Assessment",
      type: "advisory",
      subtitle: "Fisheries Assessment & Biomass Potential",
      summary: "93% Habitat Suitability Index verified against INCOIS Potential Fishing Zone (PFZ) criteria. High epipelagic prey aggregation along thermal front.",
      data: {
        suitabilityScore: 93,
        suitabilityLabel: "Optimal Feeding Window Active",
        primarySpecies: "Yellowfin Tuna (Thunnus albacares)",
        peakFeedingHours: "04:30 – 07:30 IST & 17:45 – 19:15 IST",
        fuelConservation: "+18.4% via 1.2 kt tailcurrent assist",
        safetyStatus: "Clear · 74.2 km Standoff from IMBL",
        standoffStatus: "Safe Operational Window",
      },
    },
    {
      id: "sec-conditions",
      order: 2,
      key: "conditions",
      label: "Ocean Conditions",
      title: "Observed Oceanographic Parameters",
      type: "conditions",
      subtitle: "Telemetry from Earth Observation Radiometers & In-Situ Buoys",
      summary: "Hydrodynamic state verified through multispectral Sentinel-3 radiometry and Argo float profiles.",
      data: {
        parameters: [
          { label: "Sea Surface Temperature", value: "28.4 °C", source: "Sentinel-3 SLSTR", note: "Optimal thermal envelope", status: "good" },
          { label: "Chlorophyll-a Concentration", value: "1.26 mg/m³", source: "Sentinel-3 OLCI", note: "+18.4% seasonal anomaly", status: "good" },
          { label: "Significant Wave Height", value: "1.6 m", source: "INCOIS Wave Model", note: "Safe operating envelope", status: "good" },
          { label: "Surface Current Velocity", value: "1.2 kt", source: "Hydrodynamic Radar", note: "+14.2% tailcurrent assist", status: "optimal" },
          { label: "Sea Surface Wind", value: "12 kt WNW", source: "Coastal Weather Radar", note: "Moderate breeze (Beaufort 4)", status: "good" },
          { label: "Oceanic Salinity", value: "35.4 PSU", source: "Argo Float #290142", note: "Normal marine baseline", status: "good" },
        ],
      },
    },
    {
      id: "sec-species",
      order: 3,
      key: "species",
      label: "Species Profile",
      title: "Yellowfin Tuna Profile & Local Commercial Dynamics",
      type: "species",
      subtitle: "Biological Traits, IUCN Status & Port Mandi Pricing",
      data: {
        speciesId: "yellowfin",
        commonName: "Yellowfin Tuna",
        scientificName: "Thunnus albacares",
        iucnStatus: "Near Threatened",
        category: "pelagic",
        confidence: 93,
        optimalTemp: "25.0°C – 29.5°C",
        optimalSalinity: "34.5 – 36.0 PSU",
        optimalChl: "0.8 – 1.8 mg/m³",
        depthRange: "40m – 150m (Thermocline rim)",
        mandiRate: [
          { port: "Veraval Harbor (Gujarat)", rate: "₹340 – ₹420 / kg", trend: "up" },
          { port: "Kochi Fishing Harbor (Kerala)", rate: "₹360 – ₹450 / kg", trend: "up" },
          { port: "Mangalore Old Port (Karnataka)", rate: "₹320 – ₹390 / kg", trend: "stable" },
        ],
      },
    },
    {
      id: "sec-habitat",
      order: 4,
      key: "habitat",
      label: "Habitat",
      title: "Oceanographic Habitat Envelope & Bathymetric Fronts",
      type: "habitat",
      subtitle: "Shelf Edge Divergence and Thermocline Strata",
      data: {
        shelfDepth: "85m – 220m continental drop-off",
        thermoclineDepth: "60m – 95m sharp gradient layer",
        chlorophyllRibbon: "Persistent upwelling filaments extending 45 NM offshore",
        preyDensity: "High concentration of flying fish (Exocoetidae) and oceanic squid (Sthenoteuthis oualaniensis)",
      },
    },
    {
      id: "sec-guidance",
      order: 5,
      key: "guidance",
      label: "Fishing Guidance",
      title: "Operational Navigation & Catch Execution Guidelines",
      type: "guidance",
      subtitle: "Gear Specifications, Sovereign IMBL Standoff, and Fuel Efficiency",
      data: {
        gearRecommendations: [
          "Monofilament Pelagic Longline with 16/0 circle hooks to minimize non-target bycatch",
          "High-speed trolling skirts (squid lures / Kona heads) at 6.5–8.0 knots across frontal boundaries",
          "Pole-and-line with live anchovy or sardine chumming along floating current rip-lines",
        ],
        standoffDistance: "74.2 km east of the Pakistan IMBL coordinate baseline",
        fuelStrategy: "Enter transit via 215° bearing to utilize 1.2 kt southwestward surface drift",
      },
    },
    {
      id: "sec-analysis",
      order: 6,
      key: "analysis",
      label: "ORCA Analysis",
      title: "Collaborative Multi-Agent Synthesis Pipeline",
      type: "analysis",
      subtitle: "Step-by-Step Distributed Agent Reasoning Flow",
      data: {
        agentSteps: [
          { step: "01", agent: "Satellite Ingestion Node", desc: "NetCDF raster ingest from Sentinel-3 SLSTR & OLCI missions" },
          { step: "02", agent: "Hydrodynamic Solver", desc: "Frontal gradient calculation: |∇SST| = 0.62°C/km anomaly detected" },
          { step: "03", agent: "Sovereign Compliance Agent", desc: "Geofence audit confirmed coordinate is safely inside Indian EEZ (+74.2 km IMBL buffer)" },
          { step: "04", agent: "Pelagic Biomass Model", desc: "Bayesian probability of Yellowfin aggregation scored at 93% confidence" },
          { step: "05", agent: "Mission Advisory Synthesizer", desc: "Generated fuel-optimized routing and multi-lingual advisory brief" },
        ],
      },
    },
    {
      id: "sec-research",
      order: 7,
      key: "research",
      label: "Research",
      title: "Supporting Oceanographic Literature & Evidence",
      type: "research",
      subtitle: "Peer-Reviewed Publications and INCOIS Validation Studies",
      data: {
        papers: [
          {
            title: "Thermal Front Dynamics and Pelagic Tuna Distribution in the Northeastern Arabian Sea",
            authors: "Nayak, S., Solanki, H. U., & Dwivedi, R. M.",
            journal: "International Journal of Remote Sensing",
            year: 2022,
            doi: "10.1080/01431161.2022.1894521",
            keyFinding: "Frontal gradients exceeding 0.5°C/km correlate with 3.4× higher tuna CPUE (catch per unit effort) compared to ambient waters.",
          },
          {
            title: "Validation of Operational PFZ Advisories along the Indian Coastline",
            authors: "Shenoi, S. S. C., Kumar, T. S., & Francis, P. A.",
            journal: "Current Science (Special Ocean Issue)",
            year: 2023,
            doi: "10.18520/cs/v124/i8/940-951",
            keyFinding: "Long-term validation confirms 78–92% positive correlation between satellite-delineated PFZ polygons and commercial longline catches.",
          },
        ],
      },
    },
    {
      id: "sec-sources",
      order: 8,
      key: "sources",
      label: "Sources",
      title: "Marine Science Glossary & Official Data Repositories",
      type: "sources",
      subtitle: "Standardized Definitions and Primary Government Satellite Feeds",
      data: {
        primaryFeeds: [
          { name: "INCOIS Marine Observation Network", agency: "MoES, Govt. of India", type: "Operational Wave & PFZ Advisory" },
          { name: "ISRO SAC MOSDAC Ocean Portal", agency: "ISRO / DOS", type: "Oceansat-3 Scatterometer & OCM Data" },
          { name: "Copernicus Marine Environment Service", agency: "ESA / EUMETSAT", type: "Sentinel-3 SLSTR SST & OLCI Chlorophyll" },
          { name: "ICAR-CMFRI Marine Fisheries Database", agency: "ICAR / MoFAHD", type: "Trophic Guild & Species Biomass Registry" },
        ],
      },
    },
  ],
  sources: [
    {
      name: "INCOIS PFZ Advisories",
      organization: "Indian National Centre for Ocean Information Services",
      category: "Fisheries Intelligence",
      description: "Daily potential fishing zone delineations derived from satellite SST and ocean color.",
      href: "https://incois.gov.in/portal/pfz.jsp",
    },
    {
      name: "ISRO MOSDAC Satellite Portal",
      organization: "Space Applications Centre, ISRO",
      category: "Space Radiometry",
      description: "High-resolution scatterometer winds and ocean color radiometry for Indian Ocean basins.",
      href: "https://www.mosdac.gov.in",
    },
  ],
};

const STORAGE_KEY = "orca_report_history_v2";
const ACTIVE_REPORT_KEY = "orca_active_report_id_v2";

type StoreListener = (reports: Report[], activeReport: Report | null) => void;
const listeners: Set<StoreListener> = new Set();

function emitChange(reports: Report[], activeReport: Report | null) {
  listeners.forEach((listener) => {
    try {
      listener(reports, activeReport);
    } catch (err) {
      console.error("Error in report store listener:", err);
    }
  });
}

export const reportStore = {
  getReportHistory(): Report[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  },

  getActiveReport(): Report | null {
    if (typeof window === "undefined") return null;
    try {
      const activeId = localStorage.getItem(ACTIVE_REPORT_KEY);
      const history = this.getReportHistory();
      if (activeId && history.length > 0) {
        const found = history.find((r) => r.id === activeId);
        if (found) return found;
      }
      return history.length > 0 ? history[0] : null;
    } catch {
      return null;
    }
  },

  setActiveReportId(id: string): Report | null {
    const history = this.getReportHistory();
    const target = history.find((r) => r.id === id) || null;
    if (typeof window !== "undefined") {
      try {
        if (target) {
          localStorage.setItem(ACTIVE_REPORT_KEY, target.id);
        } else {
          localStorage.removeItem(ACTIVE_REPORT_KEY);
        }
      } catch {}
    }
    emitChange(history, target);
    return target;
  },

  loadBenchmarkReport(): Report {
    this.saveReport(DEFAULT_TUNA_REPORT);
    return DEFAULT_TUNA_REPORT;
  },

  saveReport(report: Report): void {
    if (typeof window === "undefined") return;
    try {
      const history = this.getReportHistory();
      const existingIndex = history.findIndex((r) => r.id === report.id);
      let newHistory: Report[];
      if (existingIndex >= 0) {
        newHistory = [...history];
        newHistory[existingIndex] = report;
      } else {
        // prepend new report
        newHistory = [report, ...history];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      localStorage.setItem(ACTIVE_REPORT_KEY, report.id);
      emitChange(newHistory, report);
    } catch (err) {
      console.error("Failed to save report:", err);
    }
  },

  deleteReport(id: string): void {
    if (typeof window === "undefined") return;
    try {
      const history = this.getReportHistory().filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      const active = history.length > 0 ? history[0] : null;
      if (active) {
        localStorage.setItem(ACTIVE_REPORT_KEY, active.id);
      } else {
        localStorage.removeItem(ACTIVE_REPORT_KEY);
      }
      emitChange(history, active);
    } catch {}
  },

  subscribe(listener: StoreListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

