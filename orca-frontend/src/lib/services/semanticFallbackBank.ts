/**
 * Semantic Category Fallback Bank for Project ORCA (SIH-26176)
 *
 * Provides guaranteed, high-resolution sovereign marine intelligence imagery
 * when an external news publisher's image link fails, expires, or blocks hotlinking.
 */

export const SEMANTIC_FALLBACK_MAP: Record<string, string> = {
  FISHERIES: "/images/landing/gallery-kerala-boat.jpg",
  PFZ: "/images/landing/news-tuna-pelagic.jpg",
  TUNA: "/images/landing/news-tuna-pelagic.jpg",
  HARVEST: "/images/landing/news-pfz-fleet.jpg",
  CYCLONE: "/images/landing/news-cyclone.jpg",
  STORM: "/images/landing/resource-cyclone-warning.jpg",
  WEATHER: "/images/landing/resource-cyclone-warning.jpg",
  COAST_GUARD: "/images/landing/gallery-icg.jpg",
  DEFENSE: "/images/landing/gallery-icg.jpg",
  IMBL: "/images/landing/article-imbl-geofence.jpg",
  GEOFENCE: "/images/landing/article-imbl-geofence.jpg",
  BUOY: "/images/landing/gallery-buoy.jpg",
  NIOT: "/images/landing/gallery-buoy.jpg",
  MOES: "/images/landing/gallery-buoy.jpg",
  BATHYMETRY: "/images/landing/resource-bathymetry.jpg",
  FUEL: "/images/landing/resource-bathymetry.jpg",
  DRIFT: "/images/landing/resource-bathymetry.jpg",
  CHLOROPHYLL: "/images/landing/article-pfz-chlorophyll.jpg",
  EARTH_OBSERVATION: "/images/landing/article-pfz-chlorophyll.jpg",
  AGENT: "/images/landing/article-agent-mesh.jpg",
  SWARM: "/images/landing/article-agent-mesh.jpg",
  AIS: "/images/landing/article-ais-traffic.jpg",
  TRAFFIC: "/images/landing/article-ais-traffic.jpg",
  VESSEL: "/images/landing/article-ais-traffic.jpg",
  RESEARCH: "/images/landing/resource-marine-research.jpg",
  COMMAND: "/images/landing/article-sih-command.jpg",
  SIH: "/images/landing/article-sih-command.jpg",
  DEFAULT: "/images/landing/hero.jpg",
};

/**
 * Returns a guaranteed fallback image URL based on keyword/tag analysis
 */
export function getSemanticFallbackImage(categoryOrKeyword?: string): string {
  if (!categoryOrKeyword) return SEMANTIC_FALLBACK_MAP.DEFAULT;

  const normalized = categoryOrKeyword.toUpperCase().replace(/[^A-Z0-9_]/g, "_");

  for (const [key, fallbackPath] of Object.entries(SEMANTIC_FALLBACK_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return fallbackPath;
    }
  }

  // Keyword heuristic matching
  if (normalized.includes("FISH") || normalized.includes("BOAT") || normalized.includes("CATCH")) {
    return SEMANTIC_FALLBACK_MAP.FISHERIES;
  }
  if (normalized.includes("CYCLONE") || normalized.includes("HURRICANE") || normalized.includes("WIND")) {
    return SEMANTIC_FALLBACK_MAP.CYCLONE;
  }
  if (normalized.includes("GUARD") || normalized.includes("NAVY") || normalized.includes("SECURITY")) {
    return SEMANTIC_FALLBACK_MAP.DEFENSE;
  }
  if (normalized.includes("RADAR") || normalized.includes("BUOY") || normalized.includes("SENSOR")) {
    return SEMANTIC_FALLBACK_MAP.BUOY;
  }
  if (normalized.includes("SATELLITE") || normalized.includes("NASA") || normalized.includes("OBSERV")) {
    return SEMANTIC_FALLBACK_MAP.EARTH_OBSERVATION;
  }

  return SEMANTIC_FALLBACK_MAP.DEFAULT;
}
