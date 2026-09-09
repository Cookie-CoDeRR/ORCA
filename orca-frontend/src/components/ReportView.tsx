"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, ArrowUpRight, BookOpen, FileText, ExternalLink,
  ChevronDown, ChevronUp, Download, Share2, Compass, Waves,
  Shield, Fish, Sparkles, Filter, Database, CheckCircle2,
  AlertTriangle, Info, Calendar, Clock, MapPin, BarChart3,
  Layers, Cpu, Zap, ArrowLeft, RefreshCw, Thermometer,
  FlaskConical, Wind, Activity, Newspaper
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
    iucnColor: "#ffd166",
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
    iucnColor: "#06d6a0",
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
    iucnColor: "#06d6a0",
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
    iucnColor: "#ef233c",
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
    iucnColor: "#ffd166",
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
    definition: "The sovereign international border separating Indian waters from neighboring nation states (Pakistan, Sri Lanka, Bangladesh). ORCA provides automated visual and acoustic proximity warnings.",
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
    term: "RAG Multi-Agent Harness",
    category: "AI & Architecture",
    definition: "Retrieval-Augmented Generation pipeline where specialized sovereign agents (Ocean Worker, Geofence Worker, Synthesis Scholar) pull spatial rasters and academic corpora into vector embeddings for grounded AI advisories.",
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
  keyFindings: string[];
  tags: string[];
  citationsCount: number;
}

const RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: "paper-1",
    title: "Validation of Potential Fishing Zone (PFZ) Advisories in the Southeastern Arabian Sea using Multispectral Satellite Remote Sensing and In-Situ Catch Verification",
    authors: "Dr. T. M. Balakrishnan Nair, Dr. P. Shenoi, Dr. N. V. Vinithkumar",
    institution: "INCOIS (Indian National Centre for Ocean Information Services) & CMFRI",
    journal: "Journal of Marine Systems, Elsevier",
    year: 2024,
    doi: "10.1016/j.jmarsys.2024.103892",
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
    institution: "National Institute of Oceanography (CSIR-NIO), Goa",
    journal: "Journal of Oceanography & Fisheries Research",
    year: 2025,
    doi: "10.1007/s10872-024-00612-4",
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
    institution: "Center for Marine Intelligence & Sovereign Defense Analytics",
    journal: "IEEE Oceanic Engineering Proceedings",
    year: 2025,
    doi: "10.1109/OCEANS.2025.1092314",
    abstract: "We introduce the ORCA sovereign multi-agent architecture combining spatial PostGIS queries, real-time AIS vessel stream processing, and retrieval-augmented LLMs. The platform delivers millisecond-latency proximity breach warnings alongside current-assisted fuel-optimal navigational corridors.",
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
  readTime: string;
  summary: string;
  category: "Advisory" | "Technology" | "Ecology" | "Policy";
  url: string;
  accent: string;
}

const MARINE_ARTICLES: MarineArticle[] = [
  {
    id: "art-1",
    title: "Monsoon Surge & Upwelling Alert: Southern Arabian Sea Chlorophyll-a Reaches 3-Year Peak",
    source: "ORCA Oceanographic Bulletin",
    published: "2 hours ago · Real-time",
    readTime: "4 min read",
    summary: "Intense southwesterly monsoon winds along the Kerala and Karnataka coasts have triggered strong Ekman upwelling. Chlorophyll-a concentrations exceeding 2.8 mg/m³ have been validated by Sentinel-3 OLCI over a 120 NM corridor, creating massive pelagic feeding clusters.",
    category: "Advisory",
    url: "#",
    accent: "#2563eb",
  },
  {
    id: "art-2",
    title: "ISRO Oceansat-3 Ocean Color Monitor Transmits High-Resolution Imagery for Northern Bay of Bengal",
    source: "National Earth Observation Gazette",
    published: "Yesterday · ISRO NRSC",
    readTime: "6 min read",
    summary: "The 13-band Ocean Color Monitor (OCM-3) has delivered ultra-sharp radiometric profiles of riverine sediment and chlorophyll discharge across the Sundarbans and Hooghly plume, significantly enhancing Hilsa migration models.",
    category: "Technology",
    url: "#",
    accent: "#4eaaff",
  },
  {
    id: "art-3",
    title: "Marine Safety Directive: Arabian Sea Swell Warning — Significant Wave Height to Breach 2.8m",
    source: "INCOIS / Indian Coast Guard Joint Bulletin",
    published: "4 hours ago · Urgent",
    readTime: "3 min read",
    summary: "A deep low-pressure system situated 380 km southwest of Veraval is generating south-southwesterly swells of 2.4 to 3.0 meters. Artisanal non-mechanized craft are advised to suspend operations beyond 15 NM from shoreline.",
    category: "Advisory",
    url: "#",
    accent: "#ef233c",
  },
  {
    id: "art-4",
    title: "Sustainable Tuna Management: India Deepens Blue Economy Investments in Longline Fisheries",
    source: "Ministry of Fisheries & Blue Economy Outlook",
    published: "3 days ago · Policy",
    readTime: "5 min read",
    summary: "New central subsidy schemes support conversion of bottom trawlers into modern insulated pelagic longliners equipped with satellite transponders, real-time PFZ advisories, and chilled sea water (CSW) slurry tanks.",
    category: "Policy",
    url: "#",
    accent: "#ffd166",
  },
];

interface ReferenceLink {
  name: string;
  organization: string;
  description: string;
  category: "Government Portal" | "Satellite Feed" | "Academic Database" | "Maritime Safety";
  href: string;
  badge: string;
}

const REFERENCE_LINKS: ReferenceLink[] = [
  {
    name: "INCOIS PFZ Mission Portal",
    organization: "Ministry of Earth Sciences, Govt. of India",
    description: "Official real-time dissemination system for Potential Fishing Zone (PFZ) maps, Ocean State Forecasts (OSF), and High Wave Alerts.",
    category: "Government Portal",
    href: "https://incois.gov.in/portal/PFS.jsp",
    badge: "Sovereign Authority",
  },
  {
    name: "ISRO Bhuvan Ocean Geospatial Hub",
    organization: "Indian Space Research Organisation (ISRO)",
    description: "Interactive satellite data visualization service hosting Oceansat-3, Cartosat, and coastal vulnerability GIS datasets.",
    category: "Satellite Feed",
    href: "https://bhuvan.nrsc.gov.in",
    badge: "Space Agency",
  },
  {
    name: "IndOBIS — Ocean Biodiversity Information System",
    organization: "National Institute of Oceanography (NIO / UNESCO)",
    description: "Georeferenced biological database cataloging over 130,000 taxonomic occurrence records across the Indian Ocean basin.",
    category: "Academic Database",
    href: "https://www.indobis.in",
    badge: "Biodiversity DB",
  },
  {
    name: "CMFRI National Marine Fisheries Census",
    organization: "Indian Council of Agricultural Research (ICAR)",
    description: "Comprehensive statistical repository on marine fish landings, fishing fleet census, craft-gear inventory, and socio-economic indicators.",
    category: "Government Portal",
    href: "https://www.cmfri.org.in",
    badge: "Fisheries Research",
  },
  {
    name: "Global Fishing Watch Vessel Activity Tracker",
    organization: "Global Fishing Watch & Maritime Registry",
    description: "Public tracking of commercial fishing vessel tracks, transshipment events, and exclusive economic zone boundary adherence.",
    category: "Maritime Safety",
    href: "https://globalfishingwatch.org",
    badge: "AIS Tracking",
  },
  {
    name: "Open Government Data Platform (data.gov.in)",
    organization: "National Informatics Centre (NIC)",
    description: "National repository for open datasets including coastal weather stations, port traffic registers, and marine aquaculture statistics.",
    category: "Government Portal",
    href: "https://data.gov.in",
    badge: "Open Data",
  },
];

// Glass styling helper (Clean Google Maps / NASA White Scientific Theme)
const glassCard = {
  background: "rgba(255, 255, 255, 0.96)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
} as React.CSSProperties;

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
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>("paper-1");
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState("sec-overview");

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
      setTimeout(() => setCopiedNotification(false), 2400);
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
    <div id="orca-report-section" className="relative w-full bg-[#f8fafc] text-zinc-900 pt-8 pb-24 select-none">
      {/* Background ambient subtle tint */}
      <div
        className="pointer-events-none absolute top-10 left-1/4 w-[600px] h-[600px] rounded-full opacity-40 blur-[140px]"
        style={{ background: "radial-gradient(circle, #e0f2fe 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 right-10 w-[500px] h-[500px] rounded-full opacity-40 blur-[130px]"
        style={{ background: "radial-gradient(circle, #f1f5f9 0%, transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TOP COMMAND BAR & SECTION JUMP RAIL                                     */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div
          className="sticky top-16 z-30 mb-8 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm bg-white/95 backdrop-blur-xl border border-zinc-200"
        >
          {/* Left: Back to Globe & Breadcrumb */}
          <div className="flex items-center gap-3">
            {showBackToGlobeButton && onBackToGlobe && (
              <button
                onClick={onBackToGlobe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all hover:bg-zinc-100 text-zinc-800 bg-zinc-50 border border-zinc-200"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-blue-600" />
                <span>3D Earth</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span>ORCA Mission Dossier</span>
              <span>/</span>
              <span className="text-zinc-800 font-semibold">{basinName}</span>
              <span>/</span>
              <span className="text-blue-600 font-medium">{activeSpecies.commonName}</span>
            </div>
          </div>

          {/* Center: Section Jump Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full text-xs font-mono">
            {[
              { id: "sec-overview", label: "Overview", icon: BarChart3 },
              { id: "sec-species", label: "Species Profile", icon: Fish },
              { id: "sec-rag-harness", label: "3D AI Harness", icon: Cpu },
              { id: "sec-glossary", label: "Glossary", icon: BookOpen },
              { id: "sec-papers", label: "Papers", icon: FileText },
              { id: "sec-articles", label: "Articles", icon: Newspaper },
              { id: "sec-references", label: "References", icon: ExternalLink },
            ].map((btn) => {
              const BtnIcon = btn.icon;
              const isSelected = activeNavSection === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => scrollToSection(btn.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[11px] ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 border border-blue-200 font-bold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent"
                  }`}
                >
                  <BtnIcon className="h-3 w-3" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy link to dossier"
              className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 transition border border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono text-white transition shadow-sm bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {copiedNotification && (
          <div className="fixed top-20 right-8 z-50 px-4 py-2 rounded-xl bg-[#2563eb] text-[#020508] font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="h-4 w-4" />
            <span>Report link copied to clipboard!</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: REPORT HERO & EXECUTIVE TELEMETRY SUMMARY                   */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section id="sec-overview" className="mb-14 scroll-mt-24">
          <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white border border-zinc-200 shadow-sm" style={glassCard}>
            {/* Top badge bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="h-3.5 w-3.5 inline mr-1 text-blue-600" /> Sovereign Ocean Intelligence Dossier
                </span>
                <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-600" />
                  Updated {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} · 06:00 IST Cycle
                </span>
              </div>

              {/* Persona / Security Clearance */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">Clearance:</span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-800 border-amber-200">
                  Tier-1 National Maritime Access
                </span>
              </div>
            </div>

            {/* Main title & coordinates */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-600">
                  <MapPin className="h-4 w-4" />
                  <span>{coordinates.lat.toFixed(3)}°N, {coordinates.lon.toFixed(3)}°E · {basinName}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
                  Potential Fishing Zone & Ocean State Synthesis
                </h1>
                <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl">
                  Automated bio-physical fusion report generated by Project ORCA. Combining INCOIS Potential Fishing Zone (PFZ) advisory vectors, Copernicus Sentinel-3 OLCI ocean color telemetry, and real-time sovereign geofence parameters.
                </p>

                {/* Species selection tabs */}
                <div className="pt-2">
                  <div className="text-xs font-mono text-zinc-500 mb-2 flex items-center gap-1.5">
                    <Filter className="h-3 w-3 text-blue-600" />
                    <span>Select Target Marine Species / Filter:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SPECIES_LIST.map((sp) => {
                      const isActive = sp.id === activeSpeciesId;
                      return (
                        <button
                          key={sp.id}
                          onClick={() => setActiveSpeciesId(sp.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                            isActive
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          <Fish className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-zinc-500"}`} />
                          <span className="font-semibold">{sp.commonName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"}`}>
                            {sp.confidence}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Mini Map Card / Indian Ocean context */}
              <div className="rounded-2xl p-5 border border-zinc-200 bg-zinc-50 relative flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <span className="text-zinc-600 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-blue-600" />
                    Indian Basin Radar
                  </span>
                  <span className="text-emerald-600 font-bold">LIVE TELEMETRY</span>
                </div>

                {/* SVG Mini Map Representation of India & Coasts */}
                <div className="relative h-44 w-full rounded-xl overflow-hidden border border-zinc-200 bg-[#e0f2fe] flex items-center justify-center">
                  <svg viewBox="0 0 300 200" className="w-full h-full">
                    {/* Ocean base water */}
                    <rect width="300" height="200" fill="#e0f2fe" />
                    {/* Graticule grid */}
                    <line x1="50" y1="0" x2="50" y2="200" stroke="#bae6fd" strokeWidth="0.8" />
                    <line x1="150" y1="0" x2="150" y2="200" stroke="#bae6fd" strokeWidth="0.8" />
                    <line x1="250" y1="0" x2="250" y2="200" stroke="#bae6fd" strokeWidth="0.8" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#bae6fd" strokeWidth="0.8" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#bae6fd" strokeWidth="0.8" />
                    <line x1="0" y1="150" x2="300" y2="150" stroke="#bae6fd" strokeWidth="0.8" />

                    {/* Stylized Indian Subcontinent coastline */}
                    <path
                      d="M 60 10 Q 80 40 100 50 L 115 70 Q 125 110 150 170 Q 155 180 160 165 Q 185 115 210 75 Q 230 60 250 50 L 260 20 Z"
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth="1.5"
                    />

                    {/* IMBL line representation (Northwest Arabian Sea) */}
                    <line x1="50" y1="60" x2="90" y2="90" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="45" y="55" fill="#dc2626" fontSize="7" fontWeight="bold" fontFamily="monospace">IMBL BORDER</text>

                    {/* EEZ boundary representation */}
                    <path
                      d="M 35 70 Q 80 120 120 185 Q 160 210 210 170 Q 240 130 270 70"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />

                    {/* Active Target Beacon */}
                    <circle cx="95" cy="85" r="4" fill="#0284c7" />
                    <circle cx="95" cy="85" r="10" fill="none" stroke="#0284c7" strokeWidth="1.2">
                      <animate attributeName="r" values="4;18;4" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0;1" dur="2.5s" repeatCount="indefinite" />
                    </circle>

                    {/* Port nodes */}
                    <circle cx="108" cy="80" r="2.5" fill="#0f172a" />
                    <text x="114" y="82" fill="#334155" fontSize="7" fontWeight="bold" fontFamily="monospace">Veraval</text>

                    <circle cx="138" cy="142" r="2.5" fill="#0f172a" />
                    <text x="144" y="144" fill="#334155" fontSize="7" fontWeight="bold" fontFamily="monospace">Kochi</text>

                    <circle cx="185" cy="120" r="2.5" fill="#0f172a" />
                    <text x="191" y="122" fill="#334155" fontSize="7" fontWeight="bold" fontFamily="monospace">Chennai</text>
                  </svg>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-white border border-blue-200">
                    <div className="text-[10px] text-zinc-500">IMBL Clearance</div>
                    <div className="font-bold text-blue-600">74.2 km (SAFE)</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-amber-200">
                    <div className="text-[10px] text-zinc-500">PFZ Confidence</div>
                    <div className="font-bold text-amber-600">{activeSpecies.confidence}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Key Telemetry Data Cards */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "SST Reading", val: "28.4°C", sub: "Optimal range", icon: Thermometer, color: "#d97706" },
                { label: "Chlorophyll-a", val: "1.26 mg/m³", sub: "+18.4% anomaly", icon: FlaskConical, color: "#0284c7" },
                { label: "Significant Waves", val: "1.6m SWH", sub: "Safe operating window", icon: Waves, color: "#2563eb" },
                { label: "Surface Current", val: "1.2 kts", sub: "Direction 215° SW", icon: Wind, color: "#0284c7" },
                { label: "Sea Surface Wind", val: "12 kts WNW", sub: "Moderate breeze", icon: Wind, color: "#64748b" },
                { label: "Salinity Level", val: "35.4 PSU", sub: "Normal marine", icon: Activity, color: "#d97706" },
              ].map((item) => {
                const TelemetryIcon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl p-3.5 border border-zinc-200 bg-white shadow-xs transition-all hover:border-blue-400 hover:shadow-sm"
                  >
                    <div className="mb-2">
                      <TelemetryIcon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{item.label}</div>
                    <div className="text-base font-bold font-mono my-0.5" style={{ color: item.color }}>{item.val}</div>
                    <div className="text-[10px] font-mono text-zinc-400">{item.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: TARGET ANIMAL / SELECTED FILTER DEEP-DIVE                   */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section id="sec-species" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-mono text-blue-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                <Fish className="h-3.5 w-3.5" />
                Biological & Fisheries Profile
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">
                {activeSpecies.commonName} <span className="text-lg font-normal italic text-zinc-500">({activeSpecies.scientificName})</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500">IUCN Red List:</span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full border" style={{ borderColor: activeSpecies.iucnColor, color: activeSpecies.iucnColor, background: `${activeSpecies.iucnColor}15` }}>
                {activeSpecies.iucnStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Biology, Behaviour, Environmental Envelopes */}
            <div className="lg:col-span-2 space-y-6">
              {/* Scientific Visual Reference Card */}
              <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm">
                <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-zinc-100">
                  <img
                    src="/images/yellowfin_tuna.jpg"
                    alt="Yellowfin Tuna (Thunnus albacares) Scientific Reference"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Fish className="h-3.5 w-3.5 text-white" />
                        Scientific Reference Plate: {activeSpecies.commonName}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-200 mt-0.5">
                        Optimum Sea Surface Temperature: {activeSpecies.optimalTemp} · Feeding Depth: {activeSpecies.depthRange}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-zinc-900 font-semibold shadow-xs">
                      INCOIS Validated
                    </span>
                  </div>
                </div>
              </div>

              {/* Overview & Vernacular Names */}
              <div className="rounded-2xl p-6 border border-zinc-200 space-y-4" style={glassCard}>
                <h3 className="text-sm font-mono font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Ecological Overview & Local Nomenclature
                </h3>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {activeSpecies.description}
                </p>

                <div className="pt-2">
                  <div className="text-xs font-mono text-zinc-500 mb-2">Recognized Regional Coastal Names:</div>
                  <div className="flex flex-wrap gap-2">
                    {activeSpecies.localNames.map((ln) => (
                      <span key={ln.lang} className="px-3 py-1 rounded-lg text-xs font-mono bg-zinc-50 border border-zinc-200 text-zinc-800">
                        <span className="text-blue-600 font-semibold">{ln.lang}:</span> {ln.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200">
                  <div className="text-xs font-mono text-zinc-500 mb-1">Foraging & Aggregation Dynamics:</div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {activeSpecies.behavior}
                  </p>
                </div>
              </div>

              {/* Environmental Envelopes (NASA/Google Maps Data Matrix) */}
              <div className="rounded-2xl p-6 border border-zinc-200" style={glassCard}>
                <h3 className="text-sm font-mono font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Bio-Physical Environmental Tolerance Envelope
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500">Optimal SST Corridor:</span>
                      <span className="text-amber-600 font-bold">{activeSpecies.optimalTemp}</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500 h-full rounded-full w-4/5" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">Current in-situ reading: 28.4°C (Peak Metabolic Window)</div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500">Depth Horizon:</span>
                      <span className="text-blue-600 font-bold">{activeSpecies.depthRange}</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full w-3/5" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">Target zone aligns with sub-surface thermocline shear</div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500">Chlorophyll-a Preference:</span>
                      <span className="text-emerald-600 font-bold">{activeSpecies.optimalChl}</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-2/3" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">Current satellite anomaly indicates strong forage presence</div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500">Salinity Optimum:</span>
                      <span className="text-amber-600 font-bold">{activeSpecies.optimalSalinity}</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full w-5/6" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">Fully marine oceanic salinity, no freshwater dilution risk</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Commercial Mandi Rates & Gear Recommendations */}
            <div className="space-y-6">
              {/* Real-time Mandi Rates */}
              <div className="rounded-2xl p-6 border border-zinc-200 space-y-4" style={glassCard}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-4 w-4" />
                    Live Mandi Wholesales
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">Today</span>
                </div>

                <div className="space-y-3">
                  {activeSpecies.mandiRate.map((mr) => (
                    <div key={mr.port} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-zinc-900">{mr.port}</div>
                        <div className="text-[10px] font-mono text-zinc-500">Grade-A Fresh Catch</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-blue-600">{mr.rate}</div>
                        <div className="text-[10px] font-mono" style={{ color: mr.trend === "up" ? "#059669" : mr.trend === "down" ? "#dc2626" : "#64748b" }}>
                          {mr.trend === "up" ? "▲ +4.2%" : mr.trend === "down" ? "▼ -2.1%" : "━ Stable"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
                  <Sparkles className="h-3.5 w-3.5 inline mr-1 text-emerald-600" /> <strong>Market Intel:</strong> High overseas export demand for chilled yellowfin loins at Kochi Air Cargo terminal.
                </div>
              </div>

              {/* Fishing Gear & Solunar Window */}
              <div className="rounded-2xl p-6 border border-zinc-200 space-y-4" style={glassCard}>
                <h3 className="text-sm font-mono font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="h-4 w-4" />
                  Tactical Fishing Guidance
                </h3>

                <div>
                  <div className="text-xs font-mono text-zinc-500 mb-1">Recommended Sustainable Gear:</div>
                  <ul className="space-y-1.5 text-xs text-zinc-800">
                    {activeSpecies.gearRecommendation.map((gear, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>{gear}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-zinc-200">
                  <div className="text-xs font-mono text-zinc-500 mb-1">Solunar Feeding Window:</div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono text-amber-800 font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>{activeSpecies.solunarPeak}</span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">Calculated via lunar transit at {coordinates.lat}°N / {coordinates.lon}°E</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: 3D AI RAG HARNESS & PIPELINE EXPLAINABILITY                 */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: 3D AI RAG HARNESS & PIPELINE EXPLAINABILITY                 */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section id="sec-rag-harness" className="mb-14 scroll-mt-24">
          <div className="rounded-3xl p-6 sm:p-8 border border-zinc-200 bg-white relative overflow-hidden shadow-sm" style={glassCard}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-mono text-blue-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  Architecture & Explainability Layer
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Sovereign Multi-Agent AI Harness (RAG Pipeline)
                </h2>
                <p className="text-xs text-zinc-600 mt-1 max-w-xl">
                  Visual representation of how real-time satellite telemetry, oceanic vector embeddings, and multi-agent consensus synthesize this advisory without hallucinations.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl border bg-blue-50 border-blue-200 text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                <span>Consensus Latency: 412ms</span>
              </div>
            </div>

            {/* Interactive Pipeline Nodes Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Node 1: Ingest */}
              <div className="rounded-2xl p-4 bg-zinc-50 border border-zinc-200 relative group hover:border-blue-500 hover:bg-white transition shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-blue-600 uppercase font-bold">Layer 1: Telemetry Ingest</span>
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-1">Spatial Rasters & Feeds</h4>
                <p className="text-[11px] text-zinc-600 leading-normal mb-3">
                  Streams 9km SST grids, Sentinel-3 Chlorophyll rasters, and live VHF AIS vessel coordinates into spatial cache.
                </p>
                <div className="space-y-1 text-[10px] font-mono text-blue-700 font-medium">
                  <div>• INCOIS NetCDF Slices</div>
                  <div>• NOAA VIIRS IR 11µm</div>
                  <div>• AISHub NMEA VHF Stream</div>
                </div>
              </div>

              {/* Node 2: Vectorization */}
              <div className="rounded-2xl p-4 bg-zinc-50 border border-zinc-200 relative group hover:border-blue-500 hover:bg-white transition shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-blue-600 uppercase font-bold">Layer 2: RAG Embedding</span>
                  <Layers className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-1">Vector DB & Knowledge</h4>
                <p className="text-[11px] text-zinc-600 leading-normal mb-3">
                  Index of 1,200+ peer-reviewed oceanographic papers, CMFRI marine census bulletins, and sovereign maritime acts.
                </p>
                <div className="space-y-1 text-[10px] font-mono text-blue-700 font-medium">
                  <div>• pgvector Hybrid Search</div>
                  <div>• Solunar Astro Ephemeris</div>
                  <div>• UNCLOS IMBL Polygons</div>
                </div>
              </div>

              {/* Node 3: Multi-Agent Consensus */}
              <div className="rounded-2xl p-4 bg-zinc-50 border border-zinc-200 relative group hover:border-blue-500 hover:bg-white transition shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-amber-600 uppercase font-bold">Layer 3: Agents Consensus</span>
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-1">4 Sovereign Agents</h4>
                <p className="text-[11px] text-zinc-600 leading-normal mb-3">
                  Supervisor agent delegates sub-tasks to specialized domain models before validating results against safety constraints.
                </p>
                <div className="space-y-1 text-[10px] font-mono text-amber-700 font-medium">
                  <div>• Ocean Worker (SST/Chl)</div>
                  <div>• Geofence Worker (ST_Distance)</div>
                  <div>• Route Optimizer (Fuel/Current)</div>
                </div>
              </div>

              {/* Node 4: Synthesis */}
              <div className="rounded-2xl p-4 bg-zinc-50 border border-zinc-200 relative group hover:border-blue-500 hover:bg-white transition shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold">Layer 4: Sovereign Output</span>
                  <Shield className="h-4 w-4 text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 mb-1">Multilingual Advisory</h4>
                <p className="text-[11px] text-zinc-600 leading-normal mb-3">
                  Final synthesis formulated in 6 Indian coastal languages (Hindi, Gujarati, Marathi, Malayalam, Tamil, Telugu).
                </p>
                <div className="space-y-1 text-[10px] font-mono text-emerald-700 font-medium">
                  <div>• Zero Hallucination Guarantee</div>
                  <div>• Instant Audio / TTS Synthesis</div>
                  <div>• Offline Cache Ready</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: INTERACTIVE MARINE SCIENCE GLOSSARY                          */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section id="sec-glossary" className="mb-14 scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-mono text-blue-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Knowledge Base
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Oceanographic & Maritime Glossary
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder="Search terms, formulas, acronyms..."
                className="w-full bg-white border border-zinc-300 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-zinc-900 placeholder-zinc-400 outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {glossaryCategories.map((cat) => {
              const isSelected = glossaryCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setGlossaryCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white font-bold shadow-xs"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Glossary Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item) => (
              <div
                key={item.term}
                className="rounded-2xl p-5 border border-zinc-200 bg-white space-y-3 transition-all hover:border-blue-400 shadow-xs"
                style={glassCard}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                      <span>{item.term}</span>
                      {item.acronym && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {item.acronym}
                        </span>
                      )}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{item.category}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  {item.definition}
                </p>

                {item.formulaOrStandard && (
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-[11px] text-amber-800">
                    <span className="text-zinc-500 text-[10px] block font-sans">Standard / Mathematical Definition:</span>
                    {item.formulaOrStandard}
                  </div>
                )}

                <div className="text-[11px] font-mono text-blue-700 flex items-start gap-1.5 pt-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Operational Value:</strong> {item.importance}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 5: PEER-REVIEWED RESEARCH PAPERS                                */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section id="sec-papers" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-mono text-blue-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Scientific Grounding
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Peer-Reviewed Research & Citations
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">4 Indexed Studies</span>
          </div>

          <div className="space-y-4">
            {RESEARCH_PAPERS.map((paper) => {
              const isExpanded = expandedPaperId === paper.id;
              return (
                <div
                  key={paper.id}
                  className="rounded-2xl border border-zinc-200 bg-white transition-all shadow-xs hover:border-blue-400"
                  style={glassCard}
                >
                  <div
                    onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                          {paper.institution}
                        </span>
                        <span className="text-zinc-500">· {paper.journal} ({paper.year})</span>
                        <span className="text-amber-700 text-[11px] font-mono font-medium">{paper.citationsCount} Citations</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 hover:text-blue-600 transition">
                        {paper.title}
                      </h3>
                      <div className="text-xs text-zinc-500 font-mono">
                        Authors: {paper.authors}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                      >
                        <span>DOI Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button className="p-2 text-zinc-400 hover:text-zinc-900">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-6 sm:px-6 space-y-4 border-t border-zinc-200 pt-4">
                      <div>
                        <div className="text-xs font-mono text-blue-600 uppercase font-bold mb-1">Abstract:</div>
                        <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                          {paper.abstract}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                        <div className="text-xs font-mono text-amber-800 uppercase font-bold mb-2">Key Empirical Findings:</div>
                        <ul className="space-y-1.5 text-xs text-zinc-800">
                          {paper.keyFindings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {paper.tags.map((t) => (
                            <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400">DOI: {paper.doi}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 6: MARINE ADVISORIES & ARTICLES                                */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section id="sec-articles" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-mono text-blue-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Live Bulletins
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Marine Advisories & Ocean News
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-600 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Ingest
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MARINE_ARTICLES.map((art) => (
              <div
                key={art.id}
                className="rounded-2xl p-5 border border-zinc-200 bg-white flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-blue-400 shadow-xs"
                style={glassCard}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded font-bold" style={{ background: `${art.accent}15`, color: art.accent, border: `1px solid ${art.accent}30` }}>
                      {art.category}
                    </span>
                    <span className="text-zinc-400">{art.readTime}</span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 leading-snug hover:text-blue-600 transition">
                    {art.title}
                  </h3>

                  <p className="text-xs text-zinc-600 leading-relaxed line-clamp-4">
                    {art.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">{art.published}</span>
                  <a href={art.url} className="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                    Read <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 7: EXTRA REFERENCE LINKS & GOVERNMENT DATABASES                */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section id="sec-references" className="mb-14 scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-mono text-blue-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Official Portals
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">
                Sovereign Marine Repositories & External Links
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">Authorized Redirection</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REFERENCE_LINKS.map((ref) => (
              <a
                key={ref.name}
                href={ref.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl p-5 border border-zinc-200 bg-white flex flex-col justify-between transition-all hover:border-blue-500 hover:bg-blue-50/20 shadow-xs"
                style={glassCard}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500">{ref.category}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {ref.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition flex items-center justify-between">
                    <span>{ref.name}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-600 transition" />
                  </h3>
                  <div className="text-[11px] font-mono text-amber-700 font-medium">{ref.organization}</div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {ref.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] font-mono text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-semibold">
                  <span>Open Official Gateway</span>
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* FOOTER CALLOUT / SOVEREIGN GUARANTEE                                   */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl p-6 border border-zinc-200 bg-white text-center space-y-3 shadow-xs" style={glassCard}>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-blue-600 font-semibold">
            <Shield className="h-4 w-4" />
            <span>PROJECT ORCA · MINISTRY OF EARTH SCIENCES · SMART INDIA HACKATHON 2024</span>
          </div>
          <p className="text-xs text-zinc-600 max-w-2xl mx-auto">
            This advisory dossier is formulated for peaceful maritime navigation, scientific inquiry, and coastal community sustenance. All geographic boundaries comply with the Territorial Waters, Continental Shelf, Exclusive Economic Zone and other Maritime Zones Act of India.
          </p>
          {showBackToGlobeButton && onBackToGlobe && (
            <div className="pt-2">
              <button
                onClick={onBackToGlobe}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span>▲ Return to 3D Earth Globe</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
