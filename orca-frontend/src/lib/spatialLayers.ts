/**
 * Project ORCA — Spatial Canvas Geospatial Layers & Telemetry Engine
 * Provides 2D Deck.GL layers, GeoJSON boundaries, INCOIS PFZ lines, and coordinate sampling.
 */

export interface OceanObservation {
  lat: number;
  lon: number;
  sst: number;
  chlorophyll: number;
  swh: number;
  windSpeed: number;
  windDirection: string;
  currentVelocity: number;
  currentBearing: number;
  salinity: number;
  depth: number;
  region: string;
  sourceDataset: string;
  timestamp: string;
  imblDistanceKm: number;
  imblStatus: "Safe" | "Caution" | "Warning";
  nearestPort: string;
}

export interface RegionPreset {
  id: string;
  name: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
}

export const REGION_PRESETS: RegionPreset[] = [
  { id: "arabian_sea", name: "Arabian Sea (Gujarat / Maharashtra)", center: [70.368, 20.902], zoom: 6.5 },
  { id: "bay_of_bengal", name: "Bay of Bengal (Central Basin)", center: [85.120, 14.280], zoom: 6.0 },
  { id: "lakshadweep", name: "Lakshadweep Sea", center: [72.640, 10.560], zoom: 7.2 },
  { id: "andaman", name: "Andaman & Nicobar Waters", center: [92.720, 11.620], zoom: 6.8 },
];

// ─── COLOR RAMPS ─────────────────────────────────────────────────────────────

export function getSSTColor(val: number): [number, number, number, number] {
  // 24.0°C to 31.0°C
  const t = Math.min(Math.max((val - 24.0) / 7.0, 0), 1);
  if (t < 0.33) {
    // Deep Blue to Cyan
    return [31, 78, 140, 180];
  } else if (t < 0.66) {
    // Amber to Orange
    return [232, 117, 36, 190];
  } else {
    // Coral Red
    return [220, 38, 38, 200];
  }
}

export function getChlColor(val: number): [number, number, number, number] {
  // 0.1 to 2.5 mg/m³
  const t = Math.min(Math.max((val - 0.1) / 2.4, 0), 1);
  if (t < 0.3) return [5, 150, 105, 120];
  if (t < 0.7) return [16, 185, 129, 180];
  return [4, 120, 87, 210];
}

export function getWaveColor(val: number): [number, number, number, number] {
  // 0.5m to 3.5m
  const t = Math.min(Math.max((val - 0.5) / 3.0, 0), 1);
  if (t < 0.35) return [59, 130, 246, 140];
  if (t < 0.7) return [14, 165, 233, 170];
  return [180, 83, 9, 200];
}

// ─── GRID CELLS GENERATOR ────────────────────────────────────────────────────

export interface SpatialGridCell {
  polygon: [number, number][]; // [[lon, lat], ...]
  center: [number, number];
  sst: number;
  chl: number;
  swh: number;
  currentSpeed: number;
  currentAngle: number;
}

export function generateSpatialGrid(): SpatialGridCell[] {
  const cells: SpatialGridCell[] = [];
  // Indian Maritime Domain BBox (Arabian Sea to Bay of Bengal: 66°E to 89°E, 8°N to 23°N)
  const minLon = 67.0;
  const maxLon = 89.0;
  const minLat = 8.0;
  const maxLat = 22.5;
  const step = 0.5; // 0.5 degree scientific cells

  for (let lat = minLat; lat < maxLat; lat += step) {
    for (let lon = minLon; lon < maxLon; lon += step) {
      // Exclude inland sub-continent (peninsular land filter)
      const isLand =
        (lat >= 9.0 && lat <= 22.0 && lon >= 74.5 && lon <= 84.5 && lat > 12.0) ||
        (lat >= 8.5 && lat <= 13.0 && lon >= 76.5 && lon <= 80.0);

      if (isLand) continue;

      // Realistic physical fields
      const distFromEquator = (lat - 8.0) / 14.5;
      const sst = +(27.2 + 2.4 * Math.sin(distFromEquator * Math.PI) + 0.6 * Math.cos(lon * 0.2)).toFixed(2);
      const coastalProximity = (lon <= 73.0 || lon >= 82.0) ? 0.8 : 0.2;
      const chl = +(0.15 + coastalProximity * 1.1 + 0.2 * Math.sin(lat * 0.4)).toFixed(2);
      const swh = +(1.2 + 0.8 * Math.sin(lon * 0.1) + 0.3 * Math.cos(lat * 0.3)).toFixed(2);
      const currentSpeed = +(0.3 + 0.6 * Math.sin((lat + lon) * 0.2)).toFixed(2);
      const currentAngle = (lon * 15 + lat * 10) % 360;

      cells.push({
        polygon: [
          [lon, lat],
          [lon + step, lat],
          [lon + step, lat + step],
          [lon, lat + step],
          [lon, lat],
        ],
        center: [+(lon + step / 2).toFixed(3), +(lat + step / 2).toFixed(3)],
        sst,
        chl,
        swh,
        currentSpeed,
        currentAngle,
      });
    }
  }

  return cells;
}

// ─── INCOIS PFZ ADVISORY LINES & POINTS ───────────────────────────────────────

export const INCOIS_PFZ_FEATURES = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {
        id: "PFZ-GUJ-VERAVAL",
        sector: "Veraval Offshore (Gujarat)",
        bearing: "225° SW",
        distanceKm: 34.5,
        targetSpecies: "Yellowfin Tuna & Ribbonfish",
        suitabilityScore: 93,
        sst: "28.3 °C",
        chl: "1.42 mg/m³",
        status: "High Convergence",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [69.85, 20.45],
          [70.15, 20.65],
          [70.40, 20.80],
          [70.75, 20.95],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: {
        id: "PFZ-GUJ-PORBANDAR",
        sector: "Porbandar Shelf Front",
        bearing: "240° WSW",
        distanceKm: 42.0,
        targetSpecies: "Skipjack Tuna & Pomfret",
        suitabilityScore: 88,
        sst: "27.9 °C",
        chl: "1.25 mg/m³",
        status: "Active Plume Edge",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [68.90, 21.20],
          [69.25, 21.45],
          [69.60, 21.65],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: {
        id: "PFZ-KOK-MANGALORE",
        sector: "Mangalore–Malpe Offshore",
        bearing: "260° W",
        distanceKm: 28.0,
        targetSpecies: "Indian Mackerel & Sardine",
        suitabilityScore: 85,
        sst: "28.8 °C",
        chl: "1.65 mg/m³",
        status: "Upwelling Front",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [74.20, 12.80],
          [74.45, 13.10],
          [74.60, 13.40],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: {
        id: "PFZ-KER-KOCHI",
        sector: "Kochi Marine Trench",
        bearing: "235° SW",
        distanceKm: 31.0,
        targetSpecies: "Yellowfin Tuna & Cephalopods",
        suitabilityScore: 91,
        sst: "28.5 °C",
        chl: "1.50 mg/m³",
        status: "Thermal Gradient Active",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [75.60, 9.60],
          [75.85, 9.85],
          [76.05, 10.10],
        ],
      },
    },
  ],
};

// ─── MARITIME BOUNDARIES (EEZ & IMBL) ─────────────────────────────────────────

export const MARITIME_BOUNDARIES_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    // 200 NM Indian EEZ Representative Polyline
    {
      type: "Feature" as const,
      properties: {
        name: "Indian Exclusive Economic Zone (200 NM)",
        type: "EEZ",
        authority: "UNCLOS / Govt. of India",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [66.5, 22.8],
          [65.5, 20.0],
          [66.0, 15.0],
          [68.5, 10.0],
          [72.0, 6.5],
          [77.5, 5.5],
          [82.0, 8.5],
          [86.5, 13.0],
          [89.5, 18.0],
          [88.5, 21.5],
        ],
      },
    },
    // India-Sri Lanka IMBL (1974/1976 Pacts)
    {
      type: "Feature" as const,
      properties: {
        name: "India–Sri Lanka International Maritime Boundary Line",
        type: "IMBL",
        authority: "Bilateral Treaty 1974/1976",
        bufferKm: 10.0,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [79.52, 9.10],
          [79.67, 9.25],
          [79.80, 9.50],
          [80.05, 9.85],
          [80.35, 10.08],
        ],
      },
    },
    // India-Pakistan Sir Creek Maritime Limit
    {
      type: "Feature" as const,
      properties: {
        name: "India–Pakistan Notional Boundary (Sir Creek Sector)",
        type: "IMBL",
        authority: "Survey of India / NHO",
        bufferKm: 15.0,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [68.16, 23.63],
          [67.80, 23.35],
          [67.30, 22.95],
          [66.80, 22.50],
        ],
      },
    },
  ],
};

// ─── MOORED BUOY NETWORK NODES ────────────────────────────────────────────────

export interface OceanBuoyStation {
  id: string;
  name: string;
  coordinates: [number, number]; // [lon, lat]
  sst: number;
  swh: number;
  windSpeed: number;
  battery: number;
  lastUplink: string;
}

export const MOORED_BUOYS: OceanBuoyStation[] = [
  { id: "SW02", name: "SW02 — Northeastern Arabian Sea", coordinates: [70.19, 20.75], sst: 28.4, swh: 1.6, windSpeed: 12.4, battery: 13.8, lastUplink: "12 mins ago" },
  { id: "BD08", name: "BD08 — Central Bay of Bengal", coordinates: [84.18, 13.52], sst: 29.2, swh: 1.4, windSpeed: 10.2, battery: 13.9, lastUplink: "18 mins ago" },
  { id: "SW04", name: "SW04 — Lakshadweep Channel", coordinates: [72.85, 10.12], sst: 29.4, swh: 1.5, windSpeed: 11.2, battery: 13.7, lastUplink: "7 mins ago" },
  { id: "CB02", name: "CB02 — Malabar Coastal Station", coordinates: [75.50, 11.25], sst: 28.7, swh: 1.8, windSpeed: 14.1, battery: 13.6, lastUplink: "4 mins ago" },
];

// ─── COORDINATE SAMPLING ENGINE ───────────────────────────────────────────────

export function sampleOceanParameters(lat: number, lon: number): OceanObservation {
  // Region Detection
  let region = "Arabian Sea (Open Offshore)";
  let nearestPort = "Veraval Harbor (Gujarat)";
  let imblDistanceKm = 74.2;

  if (lon >= 80.0) {
    region = "Bay of Bengal";
    nearestPort = "Visakhapatnam Old Port (Andhra Pradesh)";
    imblDistanceKm = 120.5;
  } else if (lat <= 12.0 && lon <= 75.0) {
    region = "Lakshadweep Sea";
    nearestPort = "Kavaratti Port";
    imblDistanceKm = 160.0;
  } else if (lon >= 90.0) {
    region = "Andaman & Nicobar Waters";
    nearestPort = "Port Blair Harbor";
    imblDistanceKm = 85.0;
  }

  // India-Pakistan Proximity
  if (lat >= 22.0 && lon <= 69.5) {
    imblDistanceKm = Math.max(18.5, +(40 - (lat - 22.0) * 15 - (69.5 - lon) * 10).toFixed(1));
    nearestPort = "Porbandar Harbor";
  }

  // India-Sri Lanka Proximity
  if (lat >= 8.5 && lat <= 10.5 && lon >= 78.5 && lon <= 80.5) {
    imblDistanceKm = Math.max(8.2, +(35 - Math.abs(lon - 79.5) * 20).toFixed(1));
    nearestPort = "Rameswaram Jetty (Tamil Nadu)";
  }

  const imblStatus = imblDistanceKm < 15 ? "Warning" : (imblDistanceKm < 40 ? "Caution" : "Safe");

  // Physics Formulae based on coordinates
  const latFactor = (lat - 8.0) / 15.0;
  const sst = +(27.8 + 2.0 * Math.sin(latFactor * Math.PI) + 0.3 * Math.cos(lon * 0.15)).toFixed(2);
  const coastalBoost = (lon <= 72.5 || lon >= 82.5) ? 0.9 : 0.15;
  const chlorophyll = +(0.18 + coastalBoost + 0.25 * Math.sin(lat * 0.3)).toFixed(2);
  const swh = +(1.3 + 0.6 * Math.sin(lon * 0.1) + 0.2 * Math.cos(lat * 0.2)).toFixed(2);
  const windSpeed = +(10.5 + 4.5 * Math.sin((lat + lon) * 0.15)).toFixed(1);
  const currentVelocity = +(0.4 + 0.5 * Math.sin((lat - lon) * 0.2)).toFixed(2);
  const currentBearing = Math.round((lon * 20 + lat * 15) % 360);
  const salinity = +(35.2 + 0.8 * Math.sin(lon * 0.1)).toFixed(1);
  const depth = (lon <= 72.0 || lon >= 83.0) ? 65 : 1850;

  return {
    lat: +lat.toFixed(3),
    lon: +lon.toFixed(3),
    sst,
    chlorophyll,
    swh,
    windSpeed,
    windDirection: "WNW",
    currentVelocity,
    currentBearing,
    salinity,
    depth,
    region,
    sourceDataset: "INCOIS / CMEMS OSTIA Blended Analysis",
    timestamp: "10 Sep 2026 · 06:00 IST",
    imblDistanceKm,
    imblStatus,
    nearestPort,
  };
}
