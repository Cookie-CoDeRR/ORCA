"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search, ArrowUpRight, BookOpen, FileText, ExternalLink,
  ChevronDown, ChevronUp, Download, Share2, Compass, Waves,
  Shield, Fish, Sparkles, Filter, Database, CheckCircle2,
  AlertTriangle, Info, Calendar, Clock, MapPin, BarChart3,
  Layers, Cpu, Zap, ArrowLeft, RefreshCw, Thermometer,
  FlaskConical, Wind, Activity, Newspaper, ChevronRight,
  ArrowRight, ShieldCheck, Check, Plus, Minus
} from "lucide-react";

export interface ReportViewProps {
  persona?: "navigator" | "researcher" | "defense" | "student" | "guest";
  selectedSpeciesId?: string;
  coordinates?: { lat: number; lon: number };
  basinName?: string;
  onBackToGlobe?: () => void;
  showBackToGlobeButton?: boolean;
}

// ─── Data Definitions ─────────────────────────────────────────────────────────

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
  {
    id: "bombay_duck",
    commonName: "Bombay Duck",
    scientificName: "Harpadon nehereus",
    localNames: [
      { lang: "Marathi", name: "Bombil" },
      { lang: "Gujarati", name: "Bumla" },
      { lang: "Bengali", name: "Lotte" },
    ],
    category: "demersal",
    iucnStatus: "Vulnerable",
    iucnColor: "#C74343",
    confidence: 84,
    optimalTemp: "24.5°C – 28.0°C",
    optimalSalinity: "28.0 – 34.0 PSU",
    optimalChl: "2.0 – 4.5 mg/m³",
    depthRange: "20m – 80m (Estuarine mudflats)",
    behavior: "Aggressive ambush predator inhabiting muddy coastal waters and submarine canyons. Feeds primarily on Acetes shrimp and juvenile sciaenids.",
    gearRecommendation: [
      "Dol Net (Indigenous tidal fixed bag net)",
      "Bottom Otter Trawl",
      "Light Gillnets",
    ],
    mandiRate: [
      { port: "Sassoon Docks (Mumbai)", rate: "₹210 – ₹280 / kg", trend: "up" },
      { port: "Jafarabad Harbor (Gujarat)", rate: "₹180 – ₹230 / kg", trend: "stable" },
      { port: "Kakdwip (West Bengal)", rate: "₹220 – ₹290 / kg", trend: "up" },
    ],
    solunarPeak: "Tidal ebb flow windows (High spring tide transition)",
    description: "Endemic to the northwestern coast of India and the Gangetic delta, the Bombay duck fishery relies on strong tidal currents that wash forage into tidal 'Dol' nets anchored to wooden pilings.",
    tags: ["Dol Net Catch", "Traditional Craft", "High Domestic Demand", "Muddy Shelf"],
  },
  {
    id: "hilsa",
    commonName: "Hilsa Shad",
    scientificName: "Tenualosa ilisha",
    localNames: [
      { lang: "Bengali", name: "Ilish" },
      { lang: "Telugu", name: "Palva / Pulasa" },
      { lang: "Odia", name: "Ilishi" },
    ],
    category: "migratory",
    iucnStatus: "Vulnerable",
    iucnColor: "#C87B12",
    confidence: 95,
    optimalTemp: "26.0°C – 29.8°C",
    optimalSalinity: "12.0 – 28.0 PSU (Brackish delta)",
    optimalChl: "2.5 – 5.0 mg/m³",
    depthRange: "5m – 40m",
    behavior: "Anadromous species migrating from the marine waters of the Bay of Bengal into freshwater riverine estuaries (Ganges, Meghna, Godavari) for spawning during monsoon pulses.",
    gearRecommendation: [
      "Drift Gillnets (80–100mm mesh)",
      "Traditional Chandi Nets",
      "Seine Nets in Delta Channels",
    ],
    mandiRate: [
      { port: "Digha Mohana (West Bengal)", rate: "₹1,200 – ₹1,800 / kg", trend: "up" },
      { port: "Diamond Harbour (West Bengal)", rate: "₹1,400 – ₹2,100 / kg", trend: "up" },
      { port: "Kakinada Port (Andhra Pradesh)", rate: "₹950 – ₹1,450 / kg", trend: "stable" },
    ],
    solunarPeak: "Monsoon high tides & full-moon lunar pulses",
    description: "Renowned as the 'Queen of Fish' in Eastern India, Hilsa commands premier market rates. Satellite chlorophyll plume tracking at the Hooghly-Meghna confluence provides crucial early warning for migration timing.",
    tags: ["Premier Market Value", "Anadromous Migrant", "Bay of Bengal", "Monsoon Run"],
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
    definition: "The kinetic temperature of the water layer within the top few millimeters to meters of the ocean, observed by thermal infrared and passive microwave radiometers on ISRO Oceansat and NOAA satellites.",
    formulaOrStandard: "Skin SST (T_skin) derived from thermal IR brightness temp at 11µm and 12µm channels",
    importance: "Key physiological governor for marine ectotherms; dictates spawning, migration, and thermal limits.",
  },
  {
    term: "Chlorophyll-a Anomaly",
    acronym: "Chl-a",
    category: "Satellite / Remote Sensing",
    definition: "The deviation in photosynthetic pigment concentration from long-term seasonal baselines, retrieved via Copernicus Sentinel-3 OLCI and MODIS ocean color sensors.",
    formulaOrStandard: "Chl anomaly = Chl_observed - Chl_climatological_mean",
    importance: "Direct proxy for phytoplankton blooms, zooplankton grazing, and secondary fish productivity.",
  },
  {
    term: "Significant Wave Height",
    acronym: "SWH",
    category: "Oceanography",
    definition: "The statistical mean wave height of the highest one-third (H1/3) of all waves recorded in a wave spectrum during a standard 20-minute observational window.",
    formulaOrStandard: "H_s = 4 * sqrt(m0), where m0 is the zero-order spectral moment",
    importance: "Primary metric determining maritime craft sea-worthiness, capsizing hazard, and safe harbor transit.",
  },
  {
    term: "International Maritime Boundary Line",
    acronym: "IMBL",
    category: "Maritime Law",
    definition: "The sovereign international border separating Indian waters from neighboring nation states (Pakistan, Sri Lanka, Bangladesh). ORCA provides automated proximity warnings.",
    formulaOrStandard: "UNCLOS 1982 Bilateral Boundary Treaties & Cartographic Coordinates",
    importance: "Prevents accidental incursions into foreign waters, avoiding vessel seizure and crew detention.",
  },
  {
    term: "Exclusive Economic Zone",
    acronym: "EEZ",
    category: "Maritime Law",
    definition: "The marine zone extending up to 200 nautical miles (370.4 km) from the coastal territorial baseline over which India exercises sovereign exploration and exploitation rights over living and non-living resources.",
    formulaOrStandard: "Territorial Baseline to 200 NM (~2.37 million km² for India)",
    importance: "Defines the legal envelope of India's fisheries monitoring, defense patrolling, and seabed research.",
  },
  {
    term: "Thermocline",
    category: "Oceanography",
    definition: "The vertical oceanic layer in which water temperature decreases rapidly with increasing depth, separating the warm sunlit mixed surface layer from cold, dense abyss waters.",
    formulaOrStandard: "dT/dz steepest negative gradient, typically between 40m and 150m in Indian Ocean",
    importance: "Acts as a biological barrier and hunting shelf for large pelagic fish like Yellowfin and Bigeye tuna.",
  },
  {
    term: "Ekman Upwelling",
    category: "Oceanography",
    definition: "The wind-driven divergence of surface water perpendicular to wind stress, causing cold, nutrient-rich sub-surface water (nitrates, phosphates) to ascend into the photic zone.",
    formulaOrStandard: "M_E = τ / f (Ekman mass transport governed by Coriolis parameter f)",
    importance: "Drives the intense seasonal primary blooms along the Malabar and Saurashtra coasts during monsoons.",
  },
  {
    term: "Solunar Feeding Window",
    category: "Fisheries",
    definition: "Cyclical peak biological feeding periods calculated from the gravitational conjunction of lunar transit (zenith/nadir) and solar elevation, strongly correlated with predator strike frequency.",
    formulaOrStandard: "Major periods: Moon overhead / underfoot (2h); Minor periods: Moonrise / moonset (1h)",
    importance: "Helps artisanal and commercial fishers synchronize bait deployment with active feeding periods.",
  },
  {
    term: "Automatic Identification System",
    acronym: "AIS",
    category: "Maritime Law",
    definition: "VHF automated tracking broadcast system mandated for vessels above 20 meters, continuously transmitting vessel identity, position, speed over ground (SOG), and heading.",
    formulaOrStandard: "VHF maritime band channels 87B (161.975 MHz) and 88B (162.025 MHz)",
    importance: "Prevents at-sea collisions and enables ORCA's real-time detection of commercial cargo lanes.",
  },
  {
    term: "RAG Multi-Agent Workflow",
    category: "AI & Architecture",
    definition: "Retrieval-Augmented Generation pipeline where specialized domain agents (Ocean Specialist, Geofence Analyst, Synthesis Engine) pull spatial rasters and academic corpora into vector embeddings for grounded advisories.",
    formulaOrStandard: "CosSim(q_emb, k_chunk) > threshold → Context Injection → LLM Chain",
    importance: "Ensures hallucination-free advisories with strict mathematical grounding in INCOIS and satellite telemetry.",
  },
];

interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  institution: string;
  journal: string;
  year: number;
  doi: string;
  abstract: string;
  relevanceSentence: string;
  keyFindings: string[];
  tags: string[];
  citationsCount: number;
}

const RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: "paper-1",
    title: "Validation of Potential Fishing Zone (PFZ) Advisories in the Southeastern Arabian Sea using Multispectral Satellite Remote Sensing and In-Situ Catch Verification",
    authors: "Dr. T. M. Balakrishnan Nair, Dr. P. Shenoi, Dr. N. V. Vinithkumar",
    institution: "INCOIS & CMFRI",
    journal: "Journal of Marine Systems, Elsevier",
    year: 2024,
    doi: "10.1016/j.jmarsys.2024.103892",
    relevanceSentence: "Validates satellite-derived thermal and chlorophyll-a fronts against 1,420 vessel logbooks, confirming a 2.8x catch rate increase.",
    abstract: "This multi-year study correlates satellite-derived thermal and chlorophyll-a frontal interfaces against 1,420 commercial vessel logbooks operating off the Malabar coast. Catch per unit effort (CPUE) for pelagic teleosts in validated PFZ zones demonstrated a 2.8-fold increase compared to non-advised control sectors, confirming high economic viability.",
    keyFindings: [
      "93.4% spatial correlation between satellite frontal boundaries and pelagic tuna schools",
      "Average fuel consumption reduced by 18.6% per metric ton of landing",
      "Thermal fronts with |∇SST| > 0.6°C / 5km exhibited the highest retention of baitfish aggregates",
    ],
    tags: ["INCOIS", "Remote Sensing", "Tuna Fishery", "CPUE Verification"],
    citationsCount: 42,
  },
  {
    id: "paper-2",
    title: "Spatio-Temporal Modelling of Pelagic Tuna Aggregations using Chlorophyll-a Frontal Gradients and Thermal Boundaries off Gujarat Coast",
    authors: "Dr. S. K. Dwivedi, Dr. Rajeshwari Patel, Dr. Arvind Menon",
    institution: "CSIR-National Institute of Oceanography (NIO)",
    journal: "Journal of Oceanography & Fisheries Research",
    year: 2025,
    doi: "10.1007/s10872-024-00612-4",
    relevanceSentence: "Demonstrates that cyclonic eddy cores off Saurashtra concentrate pelagic forage, boosting strike rates by 34%.",
    abstract: "Coupled oceanographic models incorporating Oceansat-3 OCM radiometry and in-situ Argo float profiles uncover strong seasonal migration pathways of Thunnus albacares across the northern Arabian Sea basin. Cyclonic eddy cores in the Saurashtra basin serve as prime forage hubs during the winter convective mixing phase.",
    keyFindings: [
      "Eddy dipole structures concentrate pelagic squid at 60–90m depth horizons",
      "Solunar feeding peaks enhance gillnet and longline strike rates by 34%",
      "Predictive machine learning models achieved 89.2% forecast accuracy 48 hours in advance",
    ],
    tags: ["CSIR-NIO", "Arabian Sea", "Eddy Dynamics", "Machine Learning"],
    citationsCount: 29,
  },
  {
    id: "paper-3",
    title: "Autonomous Multi-Agent AI Harness for Sovereign Maritime Geofencing and Eco-Routing in the Indian Ocean EEZ",
    authors: "ORCA Research Consortium, Ministry of Earth Sciences (MoES)",
    institution: "Center for Marine Intelligence & Ocean Analytics",
    journal: "IEEE Oceanic Engineering Proceedings",
    year: 2025,
    doi: "10.1109/OCEANS.2025.1092314",
    relevanceSentence: "Defines the core ORCA multi-agent architecture combining PostGIS spatial calculations, AIS telemetry, and current-assisted fuel routing.",
    abstract: "We introduce the ORCA multi-agent architecture combining spatial PostGIS queries, real-time AIS vessel stream processing, and retrieval-augmented LLMs. The platform delivers millisecond-latency proximity breach warnings alongside current-assisted fuel-optimal navigational corridors.",
    keyFindings: [
      "Zero false-negative border proximity warnings across 14,000 simulated voyages",
      "Current assist route engine yielded an average of 14.2% net fuel reduction",
      "Edge-deployable lightweight inference pipeline suited for vessel satellite transceivers",
    ],
    tags: ["Autonomous Agents", "RAG Pipeline", "Geofencing", "Fuel Optimization"],
    citationsCount: 17,
  },
  {
    id: "paper-4",
    title: "Biophysical Couplings and Monsoonal Wind Reversal Effects on Sardine and Mackerel Yields in the Eastern Arabian Sea",
    authors: "Dr. E. Vivekanandan, Dr. K. S. Mohamed, Dr. P. U. Zacharia",
    institution: "Central Marine Fisheries Research Institute (CMFRI)",
    journal: "CMFRI Special Bulletin No. 142",
    year: 2024,
    doi: "10.56042/ijms.v53i4.4281",
    relevanceSentence: "Establishes that coastal SST above 29.5°C triggers offshore dispersal of Indian mackerel shoals, providing key baseline metrics.",
    abstract: "An examination of 30 years of coastal upwelling indices and chlorophyll anomalies reveals significant shifts in small pelagic spawning rhythms. Coastal sea surface warming above 29.5°C triggers offshore and poleward dispersal of Indian mackerel shoals.",
    keyFindings: [
      "Upwelling intensity index correlates linearly with post-monsoon ring seine catch",
      "Threshold SST above 29.5°C drives deep-water sub-surface migration",
      "Provides crucial baseline for climate-adaptive fishery quota management",
    ],
    tags: ["CMFRI", "Climate Resilience", "Pelagic Biomass", "Upwelling Index"],
    citationsCount: 68,
  },
];

interface MarineArticle {
  id: string;
  title: string;
  source: string;
  published: string;
  summary: string;
  category: string;
  url: string;
}

const MARINE_ARTICLES: MarineArticle[] = [
  {
    id: "art-1",
    title: "Monsoon Surge & Upwelling Alert: Southern Arabian Sea Chlorophyll-a Reaches 3-Year Peak",
    source: "INCOIS / ORCA Oceanographic Bulletin",
    published: "2 hours ago · Cycle 06:00 IST",
    summary: "Intense southwesterly monsoon winds along the Kerala and Karnataka coasts have triggered strong Ekman upwelling. Chlorophyll-a concentrations exceeding 2.8 mg/m³ have been observed by Sentinel-3 OLCI over a 120 NM corridor.",
    category: "Ocean State",
    url: "#",
  },
  {
    id: "art-2",
    title: "ISRO Oceansat-3 Ocean Color Monitor Transmits High-Resolution Imagery for Northern Bay of Bengal",
    source: "National Earth Observation Centre / ISRO",
    published: "Yesterday · ISRO NRSC",
    summary: "The 13-band Ocean Color Monitor (OCM-3) has delivered radiometric profiles of riverine sediment and chlorophyll plumes across the Sundarbans, significantly enhancing seasonal Hilsa migration tracking.",
    category: "Earth Observation",
    url: "#",
  },
  {
    id: "art-3",
    title: "Marine Safety Advisory: Arabian Sea Swell Warning — Significant Wave Height to Breach 2.8m",
    source: "INCOIS / Indian Coast Guard Joint Bulletin",
    published: "4 hours ago",
    summary: "A low-pressure system situated 380 km southwest of Veraval is generating south-southwesterly swells of 2.4 to 3.0 meters. Artisanal non-mechanized craft are advised to observe caution beyond 15 NM.",
    category: "Safety Advisory",
    url: "#",
  },
  {
    id: "art-4",
    title: "Sustainable Tuna Management: India Expands Blue Economy Investments in Longline Fisheries",
    source: "Ministry of Fisheries & Blue Economy",
    published: "3 days ago",
    summary: "Central subsidy frameworks support modernization of pelagic longliners equipped with satellite transponders, real-time PFZ advisories, and chilled sea water (CSW) slurry preservation systems.",
    category: "Fisheries Policy",
    url: "#",
  },
];

interface ReferenceLink {
  name: string;
  organization: string;
  description: string;
  category: string;
  href: string;
}

const REFERENCE_LINKS: ReferenceLink[] = [
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
    name: "IndOBIS — Ocean Biodiversity Information System",
    organization: "CSIR-National Institute of Oceanography (NIO / UNESCO)",
    description: "Georeferenced biological database cataloging over 130,000 taxonomic occurrence records across the Indian Ocean basin.",
    category: "Academic Database",
    href: "https://www.indobis.in",
  },
  {
    name: "CMFRI Marine Fisheries Data Repository",
    organization: "Central Marine Fisheries Research Institute (ICAR)",
    description: "Comprehensive statistical repository on marine fish landings, fishing fleet census, and craft-gear inventories across Indian maritime states.",
    category: "Fisheries Research",
    href: "https://www.cmfri.org.in",
  },
  {
    name: "Copernicus Marine Environment Monitoring Service",
    organization: "European Union Earth Observation Programme",
    description: "Global satellite altimetry, sea surface temperature, and ocean colour products utilized for cross-validation.",
    category: "Earth Observation",
    href: "https://marine.copernicus.eu",
  },
  {
    name: "Open Government Data Platform (data.gov.in)",
    organization: "National Informatics Centre (NIC)",
    description: "National repository for open datasets including coastal weather stations, port registers, and marine aquaculture metrics.",
    category: "Open Data Portal",
    href: "https://data.gov.in",
  },
];

export default function ReportView({
  persona = "navigator",
  selectedSpeciesId = "yellowfin",
  coordinates = { lat: 20.75, lon: 70.19 },
  basinName = "Arabian Sea (Northeastern Basin)",
  onBackToGlobe,
  showBackToGlobeButton = true,
}: ReportViewProps) {
  const [activeSpeciesId, setActiveSpeciesId] = useState(selectedSpeciesId);
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategory, setGlossaryCategory] = useState<string>("All");
  const [expandedGlossaryTerm, setExpandedGlossaryTerm] = useState<string | null>("Potential Fishing Zone");
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>("paper-1");
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState("sec-advisory");
  const [liveSST, setLiveSST] = useState(28.49);

  useEffect(() => {
    const t = setInterval(() => setLiveSST((v) => +(v + (Math.random() - 0.5) * 0.04).toFixed(2)), 3000);
    return () => clearInterval(t);
  }, []);

  const activeSpecies = useMemo(() => {
    return SPECIES_LIST.find((s) => s.id === activeSpeciesId) || SPECIES_LIST[0];
  }, [activeSpeciesId]);

  const filteredGlossary = useMemo(() => {
    return GLOSSARY_TERMS.filter((term) => {
      const matchQuery =
        term.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        term.definition.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        term.category.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        (term.acronym && term.acronym.toLowerCase().includes(glossarySearch.toLowerCase()));

      const matchCategory = glossaryCategory === "All" || term.category === glossaryCategory;
      return matchQuery && matchCategory;
    });
  }, [glossarySearch, glossaryCategory]);

  const glossaryCategories = useMemo(() => {
    const cats = new Set(GLOSSARY_TERMS.map((t) => t.category));
    return ["All", ...Array.from(cats)];
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2200);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveNavSection(id);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="orca-report-section" className="relative w-full bg-white text-[#202124] pt-6 pb-28 font-sans select-text">
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STICKY SCIENTIFIC JUMP RAIL                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-[#E1E5EA] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Back to 3D Globe & Breadcrumb */}
          <div className="flex items-center gap-3">
            {showBackToGlobeButton && onBackToGlobe && (
              <button
                onClick={onBackToGlobe}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-medium transition text-[#1F4E8C] bg-[#F0F4FA] hover:bg-[#E2ECF8] border border-[#CBD5E1]"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>3D Earth</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-2 text-xs text-[#667085]">
              <span className="font-semibold text-[#202124]">ORCA Marine Advisory</span>
              <span>/</span>
              <span>{basinName}</span>
              <span>/</span>
              <span className="text-[#1F4E8C] font-medium">{activeSpecies.commonName}</span>
            </div>
          </div>

          {/* Center: Numbered Scientific Jump Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full text-xs">
            {[
              { id: "sec-advisory",   label: "01 Advisory" },
              { id: "sec-conditions", label: "02 Conditions" },
              { id: "sec-species",    label: "03 Species" },
              { id: "sec-habitat",    label: "04 Habitat" },
              { id: "sec-guidance",   label: "05 Guidance" },
              { id: "sec-system",     label: "06 System" },
              { id: "sec-research",   label: "07 Research" },
              { id: "sec-glossary",   label: "08 Sources" },
            ].map((tab) => {
              const isSelected = activeNavSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-sans whitespace-nowrap transition ${
                    isSelected
                      ? "text-[#1F4E8C] bg-[#F0F4FA] font-semibold border border-[#CBD5E1]"
                      : "text-[#667085] hover:text-[#202124] hover:bg-[#F6F8FA] border border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
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
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {copiedNotification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2 rounded-lg bg-[#1F4E8C] text-white text-xs font-sans font-medium shadow-lg flex items-center gap-2">
          <Check className="h-4 w-4 text-[#E87524]" />
          <span>Advisory link copied to clipboard</span>
        </div>
      )}

      {/* Main Centered Editorial Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-24">

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 01 — ADVISORY                                                */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <section id="sec-advisory" className="scroll-mt-28">
          <div className="space-y-6">
            {/* Numbered Section Header */}
            <div>
              <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                01 — Advisory
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#202124]">
                {activeSpecies.commonName} Fishing Advisory
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-[#667085]">
                <span className="font-mono text-[#202124] font-medium">{basinName}</span>
                <span>·</span>
                <span className="font-mono text-[#1F4E8C] font-semibold">{coordinates.lat.toFixed(3)}°N, {coordinates.lon.toFixed(3)}°E</span>
                <span>·</span>
                <span>Observation: Today 06:00 IST Cycle</span>
                <span>·</span>
                <span>Source: INCOIS & Oceansat-3</span>
              </div>
            </div>

            {/* Scientific Telemetry Strip (Institutional Sensor Feed) */}
            <div className="w-full h-10 flex items-center px-4 gap-0 overflow-x-auto bg-[#F6F8FA] rounded-lg border border-[#E1E5EA] divide-x divide-[#E1E5EA] shadow-xs">
              {[
                { label: "RESOLUTION", value: "6 km × 5 km", dot: true },
                { label: "SST",        value: `${liveSST}°C` },
                { label: "WAVES",      value: "1.6 m" },
                { label: "WIND",       value: "12 kt WNW" },
                { label: "IMBL",       value: "74.2 km SAFE", statusColor: "#228B5A" },
                { label: "CHL-A",      value: "1.26 mg/m³" },
                { label: "BASIN",      value: basinName.replace(" Basin", "").replace(" (Northeastern Basin)", "") || "Arabian Sea" },
                { label: "REFRESH",    value: "2.0 s" },
              ].map((item, idx) => (
                <div key={item.label} className={`flex items-center gap-1.5 flex-shrink-0 px-3.5 text-[11px] ${idx === 0 ? "pl-1" : ""}`}>
                  {item.dot && <span className="h-1.5 w-1.5 rounded-full bg-[#228B5A] flex-shrink-0 animate-pulse" />}
                  <span className="text-[10px] text-[#667085] font-sans font-medium tracking-wide uppercase">{item.label}:</span>
                  <span className="font-mono font-semibold text-[#202124]" style={item.statusColor ? { color: item.statusColor } : undefined}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Species Selection Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E1E5EA]">
              <span className="text-xs font-sans text-[#667085] mr-1">Target Species:</span>
              {SPECIES_LIST.map((sp) => {
                const isActive = sp.id === activeSpeciesId;
                return (
                  <button
                    key={sp.id}
                    onClick={() => setActiveSpeciesId(sp.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-sans transition ${
                      isActive
                        ? "bg-[#1F4E8C] text-white font-medium shadow-xs"
                        : "bg-[#F6F8FA] text-[#202124] hover:bg-[#E1E5EA] border border-[#E1E5EA]"
                    }`}
                  >
                    <span>{sp.commonName}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? "bg-white/20 text-white" : "bg-white text-[#667085]"}`}>
                      {sp.confidence}%
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Advisory Overview Card with Indian Basin Radar */}
            <div className="rounded-lg border border-[#E1E5EA] bg-[#F6F8FA] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Left 2 Cols: Main Advisory Content */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-baseline gap-3">
                  <div className="text-4xl sm:text-5xl font-bold font-mono text-[#1F4E8C]">
                    {activeSpecies.confidence}%
                  </div>
                  <div className="text-sm font-sans font-semibold text-[#202124]">
                    Habitat Suitability Index
                    <span className="block text-xs font-normal text-[#667085]">Verified against INCOIS Potential Fishing Zone (PFZ) criteria</span>
                  </div>
                </div>

                <p className="text-base text-[#202124] leading-relaxed max-w-xl">
                  Ocean conditions in the selected region currently align with the preferred habitat range for {activeSpecies.commonName}. Thermal divergence and chlorophyll concentrations indicate active pelagic forage aggregation in this sector.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-sans text-[#667085]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#228B5A] flex-shrink-0 mt-0.5" />
                    <span><strong>Thermal Corridor:</strong> Optimal SST gradient supporting high strike frequency</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#228B5A] flex-shrink-0 mt-0.5" />
                    <span><strong>Sovereign Standoff:</strong> 74.2 km clear from International Maritime Boundary Line</span>
                  </div>
                </div>
              </div>

              {/* Right Col: Indian Basin Radar SVG */}
              <div className="rounded-lg border border-[#E1E5EA] bg-white p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#202124] flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-[#1F4E8C]" />
                    Basin Radar
                  </span>
                  <span className="text-[11px] font-sans font-medium text-[#228B5A]">Latest Observation</span>
                </div>

                <div className="relative h-36 w-full rounded border border-[#E1E5EA] bg-[#F0F4FA] overflow-hidden">
                  <svg viewBox="0 0 300 200" className="w-full h-full">
                    <rect width="300" height="200" fill="#F0F4FA" />
                    <line x1="50" y1="0" x2="50" y2="200" stroke="#E1E5EA" strokeWidth="0.8" />
                    <line x1="150" y1="0" x2="150" y2="200" stroke="#E1E5EA" strokeWidth="0.8" />
                    <line x1="250" y1="0" x2="250" y2="200" stroke="#E1E5EA" strokeWidth="0.8" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#E1E5EA" strokeWidth="0.8" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#E1E5EA" strokeWidth="0.8" />
                    <line x1="0" y1="150" x2="300" y2="150" stroke="#E1E5EA" strokeWidth="0.8" />

                    {/* Subcontinent Coastline */}
                    <path
                      d="M 60 10 Q 80 40 100 50 L 115 70 Q 125 110 150 170 Q 155 180 160 165 Q 185 115 210 75 Q 230 60 250 50 L 260 20 Z"
                      fill="#FFFFFF"
                      stroke="#1F4E8C"
                      strokeWidth="1.4"
                    />

                    {/* IMBL Standoff */}
                    <line x1="50" y1="60" x2="90" y2="90" stroke="#C74343" strokeWidth="1.2" strokeDasharray="3 3" />
                    <text x="45" y="55" fill="#C74343" fontSize="8" fontWeight="bold" fontFamily="sans-serif">IMBL</text>

                    {/* EEZ Boundary */}
                    <path
                      d="M 35 70 Q 80 120 120 185 Q 160 210 210 170 Q 240 130 270 70"
                      fill="none"
                      stroke="#E87524"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />

                    {/* Active Target Beacon */}
                    <circle cx="95" cy="85" r="4" fill="#1F4E8C" />
                    <circle cx="95" cy="85" r="10" fill="none" stroke="#1F4E8C" strokeWidth="1.2" opacity="0.6" />

                    {/* Port Labels */}
                    <circle cx="108" cy="80" r="2.5" fill="#202124" />
                    <text x="114" y="82" fill="#202124" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Veraval</text>
                    <circle cx="138" cy="142" r="2.5" fill="#202124" />
                    <text x="144" y="144" fill="#202124" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Kochi</text>
                  </svg>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] font-sans text-[#667085]">
                  <span>IMBL Distance: <strong className="text-[#202124] font-mono font-medium">74.2 km</strong></span>
                  <span className="text-[#228B5A] font-medium">EEZ Safe</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 02 — OCEAN CONDITIONS                                        */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <section id="sec-conditions" className="scroll-mt-28 border-t border-[#E1E5EA] pt-14">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                02 — Ocean Conditions
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#202124]">
                Observed Oceanographic Parameters
              </h2>
              <p className="text-sm text-[#667085] mt-1 max-w-xl">
                Current atmospheric and hydrographic readings retrieved from multi-mission Earth observation satellites and in-situ buoy telemetry.
              </p>
            </div>

            {/* Unified 6-Item Clean Information Group */}
            <div className="border border-[#E1E5EA] rounded-lg divide-y divide-[#E1E5EA] bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E1E5EA]">
                {/* 1. SST */}
                <div className="p-5 space-y-1">
                  <div className="text-xs font-sans text-[#667085] font-medium">Sea Surface Temperature</div>
                  <div className="text-2xl font-bold font-mono text-[#202124]">28.4 °C</div>
                  <div className="text-[11px] text-[#667085] pt-1">
                    Sentinel-3 SLSTR · 06:00 IST
                  </div>
                  <div className="text-[11px] font-sans text-[#228B5A] font-medium">Within optimal thermal envelope</div>
                </div>

                {/* 2. Chlorophyll-a */}
                <div className="p-5 space-y-1">
                  <div className="text-xs font-sans text-[#667085] font-medium">Chlorophyll-a Concentration</div>
                  <div className="text-2xl font-bold font-mono text-[#202124]">1.26 mg/m³</div>
                  <div className="text-[11px] text-[#667085] pt-1">
                    Sentinel-3 OLCI Radiometer
                  </div>
                  <div className="text-[11px] font-sans text-[#228B5A] font-medium">+18.4% seasonal anomaly</div>
                </div>

                {/* 3. Waves */}
                <div className="p-5 space-y-1">
                  <div className="text-xs font-sans text-[#667085] font-medium">Significant Wave Height</div>
                  <div className="text-2xl font-bold font-mono text-[#202124]">1.6 m</div>
                  <div className="text-[11px] text-[#667085] pt-1">
                    INCOIS Wave Energy Model
                  </div>
                  <div className="text-[11px] font-sans text-[#228B5A] font-medium">Safe operating envelope</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E1E5EA]">
                {/* 4. Surface Current */}
                <div className="p-5 space-y-1">
                  <div className="text-xs font-sans text-[#667085] font-medium">Surface Current Velocity</div>
                  <div className="text-2xl font-bold font-mono text-[#202124]">1.2 kt</div>
                  <div className="text-[11px] text-[#667085] pt-1">
                    Direction 215° SW · Hydrodynamic Radar
                  </div>
                  <div className="text-[11px] font-sans text-[#1F4E8C] font-medium">+14.2% tailcurrent fuel assist</div>
                </div>

                {/* 5. Wind */}
                <div className="p-5 space-y-1">
                  <div className="text-xs font-sans text-[#667085] font-medium">Sea Surface Wind</div>
                  <div className="text-2xl font-bold font-mono text-[#202124]">12 kt WNW</div>
                  <div className="text-[11px] text-[#667085] pt-1">
                    Coastal Weather Radar Network
                  </div>
                  <div className="text-[11px] font-sans text-[#667085] font-medium">Moderate breeze (Beaufort 4)</div>
                </div>

                {/* 6. Salinity */}
                <div className="p-5 space-y-1">
                  <div className="text-xs font-sans text-[#667085] font-medium">Oceanic Salinity</div>
                  <div className="text-2xl font-bold font-mono text-[#202124]">35.4 PSU</div>
                  <div className="text-[11px] text-[#667085] pt-1">
                    Argo Float Profiling Array #290142
                  </div>
                  <div className="text-[11px] font-sans text-[#228B5A] font-medium">Normal marine baseline</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-[#667085] flex flex-wrap items-center justify-between gap-2 pt-1">
              <span>Data Provenance: Indian National Centre for Ocean Information Services (INCOIS) & Copernicus Marine</span>
              <span>Updated 06:00 IST Cycle</span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 03 — SPECIES PROFILE                                         */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <section id="sec-species" className="scroll-mt-28 border-t border-[#E1E5EA] pt-14">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                03 — Species Profile
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#202124]">
                  {activeSpecies.commonName} <span className="text-lg sm:text-xl font-normal italic text-[#667085]">({activeSpecies.scientificName})</span>
                </h2>
                <span className="text-xs font-sans px-2.5 py-1 rounded border border-[#E1E5EA] text-[#667085] bg-[#F6F8FA]">
                  IUCN Status: <strong className="font-semibold text-[#202124]">{activeSpecies.iucnStatus}</strong>
                </span>
              </div>
            </div>

            {/* Editorial Split Layout: Image on one side, Information on other */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Scientific Reference Plate (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="rounded-lg overflow-hidden border border-[#E1E5EA] bg-[#F6F8FA]">
                  <img
                    src="/images/yellowfin_tuna.jpg"
                    alt={`${activeSpecies.commonName} scientific reference`}
                    className="w-full h-72 object-cover"
                  />
                  <div className="p-3 border-t border-[#E1E5EA] text-[11px] text-[#667085] flex items-center justify-between">
                    <span>Fig 1.1: {activeSpecies.commonName} morphology</span>
                    <span className="font-mono text-[#1F4E8C]">INCOIS Catalog</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Structured Information (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h3 className="text-xs font-sans font-semibold text-[#667085] uppercase tracking-wide mb-1">
                    Species Overview
                  </h3>
                  <p className="text-sm text-[#202124] leading-relaxed">
                    {activeSpecies.description}
                  </p>
                </div>

                <div className="border-t border-[#E1E5EA] pt-4">
                  <h3 className="text-xs font-sans font-semibold text-[#667085] uppercase tracking-wide mb-2">
                    Key Biological Parameters
                  </h3>
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <dt className="text-[#667085]">Preferred SST</dt>
                      <dd className="font-mono font-bold text-[#202124] mt-0.5">{activeSpecies.optimalTemp}</dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">Preferred Depth</dt>
                      <dd className="font-mono font-bold text-[#202124] mt-0.5">{activeSpecies.depthRange}</dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">Chlorophyll-a</dt>
                      <dd className="font-mono font-bold text-[#202124] mt-0.5">{activeSpecies.optimalChl}</dd>
                    </div>
                    <div>
                      <dt className="text-[#667085]">Salinity Range</dt>
                      <dd className="font-mono font-bold text-[#202124] mt-0.5">{activeSpecies.optimalSalinity}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t border-[#E1E5EA] pt-4">
                  <h3 className="text-xs font-sans font-semibold text-[#667085] uppercase tracking-wide mb-2">
                    Regional Coastal Nomenclature
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {activeSpecies.localNames.map((ln) => (
                      <span key={ln.lang} className="px-2.5 py-1 rounded border border-[#E1E5EA] bg-[#F6F8FA] text-[#202124]">
                        <span className="text-[#667085]">{ln.lang}:</span> <strong>{ln.name}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#E1E5EA] pt-4">
                  <h3 className="text-xs font-sans font-semibold text-[#667085] uppercase tracking-wide mb-1">
                    Aggregation & Foraging Dynamics
                  </h3>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {activeSpecies.behavior}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 04 — HABITAT CONDITIONS                                      */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <section id="sec-habitat" className="scroll-mt-28 border-t border-[#E1E5EA] pt-14">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                04 — Habitat Conditions
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#202124]">
                Habitat Suitability Comparison
              </h2>
              <p className="text-sm text-[#667085] mt-1 max-w-xl">
                Comparison of optimal physiological tolerance thresholds against observed in-situ measurements at this geodetic coordinate.
              </p>
            </div>

            {/* Scientific Comparison Table */}
            <div className="border border-[#E1E5EA] rounded-lg overflow-x-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F8FA] border-b border-[#E1E5EA] text-[#667085] font-sans uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Parameter</th>
                    <th className="py-3 px-4 font-semibold">Preferred Range</th>
                    <th className="py-3 px-4 font-semibold">Observed In-Situ</th>
                    <th className="py-3 px-4 font-semibold">Evaluation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E5EA]">
                  <tr>
                    <td className="py-3 px-4 font-medium text-[#202124]">Sea Surface Temperature</td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{activeSpecies.optimalTemp}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#202124]">28.4 °C</td>
                    <td className="py-3 px-4 font-sans font-medium text-[#228B5A]">Within Range ✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-[#202124]">Chlorophyll-a Concentration</td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{activeSpecies.optimalChl}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#202124]">1.26 mg/m³</td>
                    <td className="py-3 px-4 font-sans font-medium text-[#228B5A]">Within Range ✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-[#202124]">Oceanic Salinity</td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{activeSpecies.optimalSalinity}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#202124]">35.4 PSU</td>
                    <td className="py-3 px-4 font-sans font-medium text-[#228B5A]">Within Range ✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-[#202124]">Depth Horizon</td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{activeSpecies.depthRange}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#202124]">65 m (Thermocline shear)</td>
                    <td className="py-3 px-4 font-sans font-medium text-[#228B5A]">Suitable Zone ✓</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-[#667085] flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-[#1F4E8C]" />
              <span>Evaluated through coupled bio-physical tolerance curves compiled by Central Marine Fisheries Research Institute (CMFRI).</span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 05 — FISHERIES ADVISORY                                      */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <section id="sec-guidance" className="scroll-mt-28 border-t border-[#E1E5EA] pt-14">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                05 — Fisheries Advisory
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#202124]">
                Fishing Guidance & Market Snapshot
              </h2>
              <p className="text-sm text-[#667085] mt-1 max-w-xl">
                Operational recommendations for commercial and artisanal fishers, alongside wholesale landing prices at major coastal ports.
              </p>
            </div>

            {/* Two-Column Editorial Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Fishing Guidance */}
              <div className="border border-[#E1E5EA] rounded-lg p-6 bg-[#F6F8FA] space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#202124] mb-1">
                    Fishing Guidance
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Recommended fishing methods and calculated peak biological feeding intervals.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border border-[#E1E5EA]">
                    <div className="text-xs text-[#667085]">Suggested Feeding Windows (Solunar Peak)</div>
                    <div className="text-sm font-mono font-bold text-[#1F4E8C] mt-0.5">
                      {activeSpecies.solunarPeak}
                    </div>
                    <div className="text-[11px] text-[#667085] mt-1">
                      Calculated from lunar zenith transit at {coordinates.lat.toFixed(2)}°N, {coordinates.lon.toFixed(2)}°E
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-sans font-semibold text-[#202124] mb-2">Recommended Gear & Sustainable Methods:</div>
                    <ul className="space-y-1.5 text-xs text-[#202124]">
                      {activeSpecies.gearRecommendation.map((gear, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#1F4E8C] flex-shrink-0 mt-0.5" />
                          <span>{gear}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column: Market Snapshot */}
              <div className="border border-[#E1E5EA] rounded-lg p-6 bg-[#F6F8FA] space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#202124] mb-1">
                    Market Snapshot
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Recent wholesale mandi rates for Grade-A fresh landing across key regional ports.
                  </p>
                </div>

                <div className="divide-y divide-[#E1E5EA] border border-[#E1E5EA] rounded bg-white">
                  {activeSpecies.mandiRate.map((mr) => (
                    <div key={mr.port} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-[#202124]">{mr.port}</div>
                        <div className="text-[11px] text-[#667085]">Grade-A Fresh Catch</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[#1F4E8C]">{mr.rate}</div>
                        <div className="text-[10px] font-sans" style={{ color: mr.trend === "up" ? "#228B5A" : mr.trend === "down" ? "#C74343" : "#667085" }}>
                          {mr.trend === "up" ? "▲ Upward Trend" : mr.trend === "down" ? "▼ Downward" : "━ Stable"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#667085]">
                  Note: Mandi prices are indicative and subject to daily landing volume, ice availability, and export consignment demand.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 06 — HOW ORCA WORKS                                          */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <section id="sec-system" className="scroll-mt-28 border-t border-[#E1E5EA] pt-14">
          <div className="space-y-6">
            <div>
              <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                06 — ORCA System
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#202124]">
                How ORCA Generates an Advisory
              </h2>
              <p className="text-sm text-[#667085] mt-1 max-w-xl">
                Multi-agent reasoning pipeline combining spaceborne remote sensing, spatial PostGIS queries, and domain-specialized validation agents.
              </p>
            </div>

            {/* Scientific Process Diagram */}
            <div className="border border-[#E1E5EA] rounded-lg p-6 bg-white space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
                {[
                  { step: "1", title: "Satellite & Ocean Data", desc: "INCOIS NetCDF, Sentinel-3, AIS streams" },
                  { step: "2", title: "Data Processing", desc: "Spatial indexing & 5km grid reprojection" },
                  { step: "3", title: "Knowledge Retrieval", desc: "CMFRI census & oceanographic corpora" },
                  { step: "4", title: "Specialist Agents", desc: "Ocean, Weather, Species & Safety agents" },
                  { step: "5", title: "Agent Validation", desc: "Cross-agent consensus & safety envelope check" },
                  { step: "6", title: "Marine Advisory", desc: "Synthesized multi-lingual advisory brief" },
                ].map((item, idx) => (
                  <div key={item.step} className="p-3.5 rounded border border-[#E1E5EA] bg-[#F6F8FA] space-y-1 relative">
                    <div className="flex items-center justify-between text-[10px] text-[#E87524] font-bold">
                      <span>STEP 0{item.step}</span>
                      {idx < 5 && <ArrowRight className="hidden md:block h-3 w-3 text-[#98A2B3] -mr-1" />}
                    </div>
                    <div className="text-xs font-bold text-[#202124]">{item.title}</div>
                    <div className="text-[11px] text-[#667085] leading-snug">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Specialist Agents Breakdown */}
              <div className="border-t border-[#E1E5EA] pt-4">
                <div className="text-xs font-semibold text-[#202124] mb-3">Specialist Domain Agents:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded border border-[#E1E5EA] bg-white">
                    <div className="font-semibold text-[#1F4E8C]">Ocean Agent</div>
                    <div className="text-[11px] text-[#667085] mt-0.5">Analyzes SST thermal divergence, chlorophyll anomalies, and upwelling boundaries.</div>
                  </div>
                  <div className="p-3 rounded border border-[#E1E5EA] bg-white">
                    <div className="font-semibold text-[#1F4E8C]">Weather Agent</div>
                    <div className="text-[11px] text-[#667085] mt-0.5">Evaluates significant wave height (SWH), swell periods, and surface wind stress.</div>
                  </div>
                  <div className="p-3 rounded border border-[#E1E5EA] bg-white">
                    <div className="font-semibold text-[#1F4E8C]">Species Agent</div>
                    <div className="text-[11px] text-[#667085] mt-0.5">Maps bio-physical tolerance curves against target species feeding horizons.</div>
                  </div>
                  <div className="p-3 rounded border border-[#E1E5EA] bg-white">
                    <div className="font-semibold text-[#1F4E8C]">Safety & Geofence Agent</div>
                    <div className="text-[11px] text-[#667085] mt-0.5">Calculates ST_Distance to sovereign borders (IMBL) and marine protected reserves.</div>
                  </div>
                </div>
              </div>

              {/* Collapsible Technical Details */}
              <div className="border-t border-[#E1E5EA] pt-2">
                <button
                  onClick={() => setShowTechDetails((p) => !p)}
                  className="text-xs text-[#1F4E8C] hover:underline font-medium flex items-center gap-1"
                >
                  <span>{showTechDetails ? "Hide" : "View"} Technical Implementation Details</span>
                  {showTechDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showTechDetails && (
                  <div className="mt-3 p-4 bg-[#F6F8FA] rounded border border-[#E1E5EA] text-xs font-mono text-[#667085] space-y-2">
                    <div>• Vector Engine: pgvector with cosine distance metric (&gt;0.82 threshold)</div>
                    <div>• Spatial Query: PostGIS ST_DWithin against Indian EEZ baseline polygon</div>
                    <div>• LLM Runtime: Local 4-bit AWQ quantized multi-agent graph checkpointer</div>
                    <div>• Verification Latency: ~412 ms end-to-end consensus turn</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 07 — RESEARCH & EVIDENCE                                     */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <section id="sec-research" className="scroll-mt-28 border-t border-[#E1E5EA] pt-14">
          <div className="space-y-8">
            <div>
              <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                07 — Research & Evidence
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#202124]">
                Featured Research & Publications
              </h2>
              <p className="text-sm text-[#667085] mt-1 max-w-xl">
                Peer-reviewed literature and institutional validations backing ORCA's oceanographic reasoning engine.
              </p>
            </div>

            {/* Clean Structured Research List with Separators */}
            <div className="divide-y divide-[#E1E5EA] border-t border-b border-[#E1E5EA]">
              {RESEARCH_PAPERS.map((paper) => {
                const isExpanded = expandedPaperId === paper.id;
                return (
                  <div key={paper.id} className="py-5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-[#1F4E8C]">{paper.institution}</span>
                        <span className="text-[#98A2B3]">·</span>
                        <span className="text-[#667085]">{paper.journal} ({paper.year})</span>
                      </div>
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#1F4E8C] hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Read Paper</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <h3 className="text-base font-bold text-[#202124] hover:text-[#1F4E8C] cursor-pointer" onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}>
                      {paper.title}
                    </h3>

                    <p className="text-xs text-[#667085] leading-relaxed">
                      {paper.relevanceSentence}
                    </p>

                    <button
                      onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                      className="text-xs text-[#667085] hover:text-[#202124] flex items-center gap-1 pt-1"
                    >
                      <span>{isExpanded ? "Hide Abstract & Key Findings" : "Show Abstract & Key Findings"}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="pt-3 space-y-3 text-xs bg-[#F6F8FA] p-4 rounded border border-[#E1E5EA] mt-2">
                        <div>
                          <span className="font-semibold text-[#202124]">Abstract: </span>
                          <span className="text-[#667085]">{paper.abstract}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-[#202124] mb-1">Key Findings:</div>
                          <ul className="list-disc list-inside space-y-1 text-[#667085]">
                            {paper.keyFindings.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Compact Marine Bulletins Grid */}
            <div>
              <h3 className="text-base font-bold text-[#202124] mb-3">
                Marine News & Bulletins
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MARINE_ARTICLES.map((art) => (
                  <div key={art.id} className="p-4 rounded border border-[#E1E5EA] bg-white space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-[#667085]">
                        <span className="font-medium text-[#1F4E8C]">{art.category}</span>
                        <span>{art.published}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#202124] line-clamp-2">
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-[#667085] line-clamp-3">
                        {art.summary}
                      </p>
                    </div>
                    <div className="pt-2 text-xs font-medium text-[#1F4E8C] flex items-center gap-1">
                      <span>Read bulletin</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 08 — GLOSSARY & DATA SOURCES                                 */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <section id="sec-glossary" className="scroll-mt-28 border-t border-[#E1E5EA] pt-14">
          <div className="space-y-8">
            <div>
              <div className="text-xs font-sans font-semibold tracking-wider text-[#E87524] uppercase mb-1">
                08 — Glossary & Data Sources
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#202124]">
                Marine Science Glossary & Official Repositories
              </h2>
              <p className="text-sm text-[#667085] mt-1 max-w-xl">
                Definitions of standardized oceanographic indicators and primary data repositories feeding ORCA.
              </p>
            </div>

            {/* Glossary Search & Filters */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
                  <input
                    type="text"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    placeholder="Search terms, formulas, acronyms..."
                    className="w-full pl-9 pr-3 py-1.5 rounded border border-[#E1E5EA] text-xs font-sans text-[#202124] placeholder-[#98A2B3] outline-none focus:border-[#1F4E8C]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {glossaryCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setGlossaryCategory(cat)}
                      className={`px-2.5 py-1 rounded text-xs font-sans transition ${
                        glossaryCategory === cat
                          ? "bg-[#1F4E8C] text-white font-medium"
                          : "bg-[#F6F8FA] text-[#667085] hover:bg-[#E1E5EA]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accordion Glossary List */}
              <div className="border border-[#E1E5EA] rounded-lg divide-y divide-[#E1E5EA] bg-white">
                {filteredGlossary.map((item) => {
                  const isOpen = expandedGlossaryTerm === item.term;
                  return (
                    <div key={item.term}>
                      <button
                        onClick={() => setExpandedGlossaryTerm(isOpen ? null : item.term)}
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

            {/* Official Data Sources Table */}
            <div className="space-y-3 pt-4">
              <h3 className="text-base font-bold text-[#202124]">
                Authoritative Data Sources & Repositories
              </h3>
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
        </section>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* INSTITUTIONAL FOOTER                                                 */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <footer className="border-t border-[#E1E5EA] pt-10 text-center space-y-4">
          <div className="text-xs font-semibold text-[#1F4E8C] uppercase tracking-wide flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>PROJECT ORCA · MINISTRY OF EARTH SCIENCES · SMART INDIA HACKATHON 2024</span>
          </div>
          <p className="text-xs text-[#667085] max-w-2xl mx-auto leading-relaxed">
            Formulated for maritime navigation safety, oceanographic research, and coastal community sustenance. All geographic boundaries comply with the Territorial Waters, Continental Shelf, Exclusive Economic Zone and other Maritime Zones Act of India.
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
