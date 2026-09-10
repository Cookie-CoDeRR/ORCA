export type Persona = "navigator" | "researcher" | "defense" | "student" | "guest";

export type ReportType =
  | "fisheries_advisory"
  | "wave_hazard"
  | "chlorophyll_bloom"
  | "marine_weather"
  | "ocean_state"
  | "cyclone_assessment"
  | "coastal_ecosystem";

export type SectionType =
  | "advisory"
  | "situation"
  | "conditions"
  | "species"
  | "habitat"
  | "waves"
  | "chlorophyll"
  | "weather"
  | "guidance"
  | "risk"
  | "analysis"
  | "research"
  | "sources"
  | "generic";

export interface ReportTelemetry {
  resolution?: string;
  sst?: string;
  waves?: string;
  wind?: string;
  imblStatus?: string;
  imblColor?: string;
  chla?: string;
  current?: string;
  salinity?: string;
  basin?: string;
  refreshRate?: string;
}

export interface SpeciesProfileData {
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
  mandiRate?: { port: string; rate: string; trend: "up" | "stable" | "down" }[];
  solunarPeak?: string;
  description: string;
  tags: string[];
}

export interface ResearchItem {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  keyFinding: string;
  confidenceScore: number;
  relevanceTag: string;
}

export interface DataSourceItem {
  name: string;
  organization: string;
  category: string;
  description: string;
  href: string;
}

export interface GlossaryTermItem {
  term: string;
  acronym?: string;
  category: string;
  definition: string;
  formulaOrStandard?: string;
  importance: string;
}

export interface ReportSection {
  id: string;
  order: number;
  key: string;
  label: string; // e.g. "Advisory", "Ocean Conditions", "Wave Analysis", etc.
  title: string;
  type: SectionType;
  subtitle?: string;
  summary?: string;
  content?: string;
  data?: any; // flexible payload depending on section type
  sources?: string[];
}

export interface Report {
  id: string;
  title: string;
  subtitle?: string;
  topic: string;
  reportType: ReportType;
  location: string;
  region: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  cellId?: string;
  createdAt: string;
  updatedAt: string;
  status: "completed" | "generating" | "failed";
  summary: string;
  telemetry: ReportTelemetry;
  sections: ReportSection[];
  sources: DataSourceItem[];
  metadata?: {
    persona?: Persona;
    queryIntent?: string;
    generationTimeMs?: number;
    sensorCycle?: string;
    satelliteBands?: string[];
    [key: string]: any;
  };
}

export interface ReportGenerationProgress {
  stage: number;
  totalStages: number;
  stageName: string;
  message: string;
  progressPercent: number;
}
