/**
 * Project ORCA (SIH26176) — Sovereign Backend Client
 * Connects Next.js Frontend to FastAPI Backend at http://localhost:8000
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export interface LiveOceanCurrentResponse {
  coordinates: [number, number];
  velocity_mps: number;
  velocity_knots: number;
  direction_deg: number;
  cardinal_direction: string;
  flow_regime: string;
  u_vector: number;
  v_vector: number;
  wave_height_m: number;
  wave_direction_deg: number;
  observation_time: string;
  cached_at: string;
  cache_age_seconds: number;
  next_sync_seconds: number;
  is_live: boolean;
  is_cached?: boolean;
  is_cached_fallback?: boolean;
  warning?: string;
  source: string;
}

export interface OceanTelemetryResponse {
  coordinates: [number, number];
  telemetry: {
    sst_celsius: number;
    chlorophyll_mg_m3: number;
    significant_wave_height_m: number;
  };
  currents?: LiveOceanCurrentResponse;
  pfz_clusters_count: number;
  pfz_geojson_features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: {
      target_species: string;
      confidence_score: number;
      sst_thermal_front: string;
      chlorophyll_front: string;
      distance_km: number;
    };
  }>;
}

export interface GeofenceRiskResponse {
  coordinates: [number, number];
  is_safe: boolean;
  imbl_check: {
    nearest_boundary: string;
    boundary_type: string;
    distance_km: number;
    threshold_km: number;
    is_near_border: boolean;
    alert_level: "GREEN" | "YELLOW" | "RED";
  };
  mpa_check: {
    in_protected_area: boolean;
    sanctuary_name: string | null;
  };
  cyclone_check: {
    active_cyclone_alert: boolean;
    warning_signal: string;
    surface_pressure_hpa: number;
    max_wind_gust_knots: number;
    safe_to_navigate: boolean;
  };
}

export interface LiveVesselsResponse {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: {
      mmsi: number;
      name: string;
      ship_type: number;
      ship_category: string;
      sog_knots: number;
      cog_deg: number;
      heading: number;
      destination: string;
      flag: string;
      risk_level: string;
    };
  }>;
  metadata: {
    count: number;
    is_live_stream: boolean;
    is_synthetic_fallback: boolean;
  };
}

/**
 * Fetch real-time ocean telemetry & PFZ clusters
 */
export async function fetchOceanTelemetry(
  lat: number,
  lon: number
): Promise<OceanTelemetryResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/ocean/telemetry?lat=${lat}&lon=${lon}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend ocean telemetry unreachable, using fallback:", err);
    return null;
  }
}

/**
 * Fetch real-time tracked ocean currents with 10-minute cache delay
 */
export async function fetchLiveOceanCurrent(
  lat: number,
  lon: number,
  force: boolean = false
): Promise<LiveOceanCurrentResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/ocean/currents/live?lat=${lat}&lon=${lon}${force ? "&force=true" : ""}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend live currents unreachable, using client approximation:", err);
    return null;
  }
}

/**
 * Fetch real-time PostGIS IMBL and EEZ geofence proximity
 */
export async function fetchGeofenceRisk(
  lat: number,
  lon: number
): Promise<GeofenceRiskResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/risk/geofence?lat=${lat}&lon=${lon}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend geofence unreachable, using fallback:", err);
    return null;
  }
}

/**
 * Fetch live AIS vessel traffic
 */
export async function fetchLiveVessels(): Promise<LiveVesselsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/traffic/vessels`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend traffic unreachable, using fallback:", err);
    return null;
  }
}

/**
 * Multi-Agent Chat invocation with Server-Sent Events (SSE) or REST fallback
 */
export async function sendMultiAgentMessage({
  message,
  persona = "navigator",
  threadId = "user-session-1",
  coordinates,
  basin = "arabian_sea",
  formatMode = "conversational",
}: {
  message: string;
  persona: string;
  threadId?: string;
  coordinates?: { lat: number; lon: number };
  basin?: string;
  formatMode?: string;
}): Promise<{ text: string; thoughts: string[]; geojson?: any } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        thread_id: threadId,
        user_role: persona,
        format_mode: formatMode,
        active_basin: basin,
        target_coordinates: coordinates ? [coordinates.lat, coordinates.lon] : null,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      text: data.response?.markdown_advisory || data.response?.text || "",
      thoughts: data.execution_steps?.map((s: any) => `${s.agent}: ${s.action}`) || [],
      geojson: data.response?.geojson_payload,
    };
  } catch (err) {
    console.warn("Backend chat unavailable, using simulated response:", err);
    return null;
  }
}
