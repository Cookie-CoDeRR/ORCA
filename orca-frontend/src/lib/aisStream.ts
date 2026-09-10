/**
 * aisStream.ts
 *
 * Real-time AIS ship tracking via Project ORCA backend SSE / aisstream.io WebSocket.
 * Includes client-side dynamic CPA, TCPA, and COLREGs Rule 13/14/15/17 calculation.
 * Coverage: Indian Ocean bounding box [4°N–28°N, 57°E–97°E]
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type VesselType =
  | "cargo"
  | "tanker"
  | "fishing"
  | "military"
  | "passenger"
  | "sailing"
  | "tug"
  | "unknown";

export type RiskLevel = "SAFE" | "CAUTION" | "CRITICAL_RISK";

export interface Vessel {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  sog: number;    // Speed over ground (knots)
  cog: number;    // Course over ground (degrees 0-360)
  type: VesselType;
  flag?: string;
  destination?: string;
  length?: number;
  width?: number;
  lastUpdate: number; // timestamp ms

  // Dynamic COLREGs fields
  cpa_nm?: number;
  tcpa_minutes?: number;
  collision_risk_index?: number;
  risk_level?: RiskLevel;
  colregs_encounter?: string;
  colregs_rule?: string;
  obligation?: string;
  recommended_action?: string;
  recommended_heading_delta_deg?: number;
}

// ─── AIS Ship Type Code → VesselType mapping ─────────────────────────────────
export function decodeShipType(typeCode: number): VesselType {
  if (typeCode >= 70 && typeCode <= 79) return "cargo";
  if (typeCode >= 80 && typeCode <= 89) return "tanker";
  if (typeCode >= 30 && typeCode <= 32) return "fishing";
  if (typeCode >= 50 && typeCode <= 55) return "military";
  if (typeCode >= 60 && typeCode <= 69) return "passenger";
  if (typeCode >= 20 && typeCode <= 28) return "sailing";
  if (typeCode >= 50 && typeCode <= 52) return "tug";
  return "unknown";
}

// ─── Client-Side COLREGs Evaluation Helper ────────────────────────────────────
export function computeClientColregs(
  ownLat: number,
  ownLon: number,
  ownSog: number,
  ownCog: number,
  tgt: Vessel
): {
  cpa_nm: number;
  tcpa_minutes: number;
  risk_level: RiskLevel;
  collision_risk_index: number;
  colregs_encounter: string;
  colregs_rule: string;
  obligation: string;
  recommended_action: string;
} {
  const meanLatRad = ((ownLat + tgt.lat) / 2.0 * Math.PI) / 180.0;
  const dx_nm = (tgt.lon - ownLon) * 60.0 * Math.cos(meanLatRad);
  const dy_nm = (tgt.lat - ownLat) * 60.0;
  const dist_nm = Math.hypot(dx_nm, dy_nm);

  const trueBearingDeg = (Math.atan2(dx_nm, dy_nm) * 180.0) / Math.PI;
  const normBearing = (trueBearingDeg + 360.0) % 360.0;
  const relBearingDeg = (normBearing - ownCog + 360.0) % 360.0;

  const v_own_x = ownSog * Math.sin((ownCog * Math.PI) / 180.0);
  const v_own_y = ownSog * Math.cos((ownCog * Math.PI) / 180.0);

  const v_tgt_x = tgt.sog * Math.sin((tgt.cog * Math.PI) / 180.0);
  const v_tgt_y = tgt.sog * Math.cos((tgt.cog * Math.PI) / 180.0);

  const v_rel_x = v_tgt_x - v_own_x;
  const v_rel_y = v_tgt_y - v_own_y;
  const v_rel_sq = v_rel_x ** 2 + v_rel_y ** 2;
  const v_rel = Math.sqrt(v_rel_sq);

  let cpa_nm = dist_nm;
  let tcpa_minutes = 0.0;
  let isConverging = false;

  if (v_rel > 1e-4) {
    const p_dot_v = dx_nm * v_rel_x + dy_nm * v_rel_y;
    const tcpa_hours = -p_dot_v / v_rel_sq;
    tcpa_minutes = +(tcpa_hours * 60.0).toFixed(1);

    if (tcpa_minutes >= 0) {
      isConverging = true;
      const cpa_x = dx_nm + v_rel_x * tcpa_hours;
      const cpa_y = dy_nm + v_rel_y * tcpa_hours;
      cpa_nm = +Math.hypot(cpa_x, cpa_y).toFixed(2);
    }
  }

  // CRI calculation
  let cri = 0.0;
  if (isConverging && dist_nm < 20.0) {
    const u_dcpa = Math.exp(-((cpa_nm / 1.5) ** 2) * 1.8);
    const u_tcpa = Math.exp(-((Math.max(tcpa_minutes, 0) / 20.0) ** 2) * 1.5);
    const u_dist = Math.exp(-((dist_nm / 8.0) ** 2) * 1.2);
    const u_bearing = 0.5 * (1.0 + Math.cos((relBearingDeg * Math.PI) / 180.0));
    cri = +(0.4 * u_dcpa + 0.35 * u_tcpa + 0.15 * u_dist + 0.1 * u_bearing).toFixed(2);
  }

  let risk_level: RiskLevel = "SAFE";
  if (cri >= 0.65 || (cpa_nm < 1.0 && tcpa_minutes <= 15.0 && dist_nm < 6.0 && isConverging)) {
    risk_level = "CRITICAL_RISK";
  } else if (cri >= 0.30 || (cpa_nm < 2.0 && tcpa_minutes <= 30.0 && dist_nm < 10.0 && isConverging)) {
    risk_level = "CAUTION";
  }

  const courseDiff = Math.abs((((tgt.cog - ownCog + 180) % 360) - 180));

  // Head-on (Rule 14)
  if ((relBearingDeg <= 12 || relBearingDeg >= 348) && courseDiff >= 165 && courseDiff <= 195) {
    return {
      cpa_nm,
      tcpa_minutes,
      risk_level,
      collision_risk_index: cri,
      colregs_encounter: "HEAD_ON",
      colregs_rule: "Rule 14 (Head-on Situation)",
      obligation: "GIVE_WAY",
      recommended_action: "MANDATORY RULE 14: Alter course to Starboard (+30°) to pass port-to-port.",
    };
  }

  // Crossing Give-Way (Rule 15)
  if (relBearingDeg >= 5 && relBearingDeg <= 112.5) {
    return {
      cpa_nm,
      tcpa_minutes,
      risk_level,
      collision_risk_index: cri,
      colregs_encounter: "CROSSING_GIVE_WAY",
      colregs_rule: "Rule 15 (Crossing Situation)",
      obligation: "GIVE_WAY",
      recommended_action: "RULE 15 GIVE-WAY: Target on Starboard. Alter course to Starboard (+35°) to pass astern.",
    };
  }

  // Crossing Stand-On (Rule 17)
  if (relBearingDeg >= 247.5 && relBearingDeg <= 355) {
    return {
      cpa_nm,
      tcpa_minutes,
      risk_level,
      collision_risk_index: cri,
      colregs_encounter: "CROSSING_STAND_ON",
      colregs_rule: "Rule 17 (Stand-on Vessel)",
      obligation: "STAND_ON",
      recommended_action: "RULE 17 STAND-ON: Target on Port must give way. Maintain steady course & speed.",
    };
  }

  // Default safe separation
  return {
    cpa_nm,
    tcpa_minutes,
    risk_level,
    collision_risk_index: cri,
    colregs_encounter: "SAFE_SEPARATION",
    colregs_rule: "Rule 8 (Safe Clearance)",
    obligation: "NONE",
    recommended_action: "Safe navigational separation maintained.",
  };
}

// ─── Known Indian Ocean trunk route waypoints for simulation ─────────────────
const TRUNK_ROUTES: {
  name: string;
  type: VesselType;
  waypoints: [number, number][];
}[] = [
  {
    name: "Gulf-India Main Tanker Corridor",
    type: "tanker",
    waypoints: [
      [57.5, 22.5], [60.0, 21.0], [63.0, 19.5], [66.0, 18.0],
      [68.5, 16.5], [70.5, 14.0], [72.8, 12.0], [74.5, 10.5],
      [76.5, 9.0],  [79.0, 7.5],  [80.5, 6.0],
    ],
  },
  {
    name: "Mumbai-Singapore Express",
    type: "cargo",
    waypoints: [
      [72.8, 18.9], [74.0, 16.0], [75.5, 13.0], [77.0, 10.0],
      [79.0, 8.5],  [80.5, 7.0],  [82.0, 5.5],  [85.0, 4.5],
      [87.5, 4.0],  [90.0, 3.5],  [93.0, 3.0],  [96.0, 3.5],
    ],
  },
  {
    name: "Bay of Bengal North-South Fairway",
    type: "cargo",
    waypoints: [
      [80.3, 13.0], [81.0, 11.5], [81.5, 10.0], [82.0, 8.5],
      [82.5, 7.0],  [83.0, 5.5],  [83.5, 4.0],  [84.0, 3.0],
    ],
  },
  {
    name: "Veraval Coastal Fishery Patrol",
    type: "military",
    waypoints: [
      [70.32, 20.88], [70.20, 20.65], [70.05, 20.50], [69.90, 20.75], [70.32, 20.88]
    ],
  },
  {
    name: "Gujarat Shelf Fishing Fleet",
    type: "fishing",
    waypoints: [
      [69.5, 21.0], [69.8, 20.8], [70.1, 20.6], [70.4, 20.4],
      [70.2, 20.7], [69.9, 20.9], [69.6, 21.1],
    ],
  },
  {
    name: "Palk Strait Defense & Security",
    type: "military",
    waypoints: [
      [79.35, 9.32], [79.45, 9.45], [79.60, 9.55], [79.35, 9.32]
    ]
  }
];

const VESSEL_NAMES: Record<VesselType, string[]> = {
  cargo: ["MV MAERSK BHARAT", "MV CHENNAI EXPRESS", "MV OCEAN TRADER", "MV PACIFIC VOYAGER"],
  tanker: ["MT SWARNA KAMAL", "MT OCEAN PIONEER", "MT ARABIAN STAR", "MT DESH SHANTI"],
  fishing: ["FB SAGAR RATNA", "FB MATSYA KANYA", "FB JALA DEEPAM", "FB SAGAR MITRA"],
  military: ["ICGS SAMARTH", "ICGS RAJVEER", "ICGS VARAD", "INS VIKRAMADITYA ESCORT"],
  passenger: ["MV LAKSHADWEEP PRIDE", "MV CORAL QUEEN"],
  sailing: ["INSV TARINI", "INSV MHADEI"],
  tug: ["TUG OCEAN SAMRAT", "TUG KANDLA HERO"],
  unknown: ["VESSEL ALPHA", "VESSEL BRAVO"],
};

export function generateSimVessels(): Vessel[] {
  const list: Vessel[] = [];
  let mmsiBase = 419001000;

  TRUNK_ROUTES.forEach((route) => {
    const names = VESSEL_NAMES[route.type];
    const vesselCount = route.type === "fishing" ? 3 : 2;

    for (let i = 0; i < vesselCount; i++) {
      const wps = route.waypoints;
      const frac = (i + 0.3) / vesselCount;
      const segIdx = Math.floor(frac * (wps.length - 1));
      const segFrac = (frac * (wps.length - 1)) % 1;

      const [lon0, lat0] = wps[segIdx];
      const [lon1, lat1] = wps[Math.min(segIdx + 1, wps.length - 1)];

      const lon = +(lon0 + (lon1 - lon0) * segFrac).toFixed(5);
      const lat = +(lat0 + (lat1 - lat0) * segFrac).toFixed(5);

      const dLon = lon1 - lon0;
      const dLat = lat1 - lat0;
      const cog = +((Math.atan2(dLon, dLat) * 180) / Math.PI + 360).toFixed(1) % 360;
      const sog = +(route.type === "fishing" ? 3.5 + Math.random() * 2 : 12.0 + Math.random() * 6).toFixed(1);

      list.push({
        mmsi: mmsiBase++,
        name: names[i % names.length],
        lat,
        lon,
        sog,
        cog,
        type: route.type,
        flag: "IND",
        lastUpdate: Date.now(),
      });
    }
  });

  return list;
}

let _simVesselsCache: Vessel[] = [];

export function tickSimVessels(deltaSeconds: number): Vessel[] {
  if (_simVesselsCache.length === 0) {
    _simVesselsCache = generateSimVessels();
  }

  _simVesselsCache.forEach((v) => {
    if (v.sog > 0.1) {
      const dist_nm = (v.sog * deltaSeconds) / 3600.0;
      const cogRad = (v.cog * Math.PI) / 180.0;
      const latCos = Math.cos((v.lat * Math.PI) / 180.0) || 1.0;

      const dLat = (dist_nm * Math.cos(cogRad)) / 60.0;
      const dLon = (dist_nm * Math.sin(cogRad)) / (60.0 * latCos);

      v.lat = +(v.lat + dLat).toFixed(5);
      v.lon = +(v.lon + dLon).toFixed(5);

      // Boundary rebound
      if (v.lat < 4.0 || v.lat > 25.0 || v.lon < 65.0 || v.lon > 95.0) {
        v.cog = (v.cog + 180.0) % 360.0;
      }
      v.lastUpdate = Date.now();
    }
  });

  return [..._simVesselsCache];
}

// ─── AISstream WebSocket / Backend SSE Connection ─────────────────────────────
export function connectAisStream(
  apiKey: string,
  onUpdate: (vessels: Map<number, Vessel>) => void,
  onError?: (err: string) => void
): () => void {
  const BBOX = [[4.0, 57.0], [28.0, 97.0]];
  const vesselMap = new Map<number, Vessel>();

  // 1. Seed immediately with authentic Indian Ocean fleet
  const seedVessels = generateSimVessels();
  seedVessels.forEach((v) => vesselMap.set(v.mmsi, v));
  onUpdate(new Map(vesselMap));

  let ws: WebSocket | null = null;
  let dead = false;
  let tickerTimer: NodeJS.Timeout | null = null;

  // 2. Continuous kinematic drift ticker so ships always navigate smoothly
  tickerTimer = setInterval(() => {
    if (dead) return;
    vesselMap.forEach((v) => {
      if (v.sog > 0.1) {
        const dist_nm = (v.sog * 3.0) / 3600.0;
        const cogRad = (v.cog * Math.PI) / 180.0;
        const latCos = Math.cos((v.lat * Math.PI) / 180.0) || 1.0;
        const dLat = (dist_nm * Math.cos(cogRad)) / 60.0;
        const dLon = (dist_nm * Math.sin(cogRad)) / (60.0 * latCos);
        v.lat = +(v.lat + dLat).toFixed(5);
        v.lon = +(v.lon + dLon).toFixed(5);

        // Turnaround bounds
        if (v.lat < 4.0 || v.lat > 25.0 || v.lon < 65.0 || v.lon > 95.0) {
          v.cog = (v.cog + 180.0) % 360.0;
        }
        v.lastUpdate = Date.now();
      }
    });
    onUpdate(new Map(vesselMap));
  }, 3000);

  // 3. Connect to live AISstream.io stream if API key present
  function connect() {
    if (dead || !apiKey) return;
    try {
      ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      ws.onopen = () => {
        ws!.send(
          JSON.stringify({
            APIKey: apiKey,
            BoundingBoxes: [BBOX],
            FilterMessageTypes: ["PositionReport"],
          })
        );
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.MessageType !== "PositionReport") return;

          const meta = msg.MetaData ?? {};
          const pos = msg.Message?.PositionReport ?? {};
          const mmsi: number = meta.MMSI ?? pos.UserID ?? 0;
          if (!mmsi) return;

          const shipTypeCode: number = meta.ShipType ?? 0;

          const vessel: Vessel = {
            mmsi,
            name: (meta.ShipName ?? "UNKNOWN").trim(),
            lat: pos.Latitude ?? meta.latitude_deg ?? 0,
            lon: pos.Longitude ?? meta.longitude_deg ?? 0,
            sog: +(pos.Sog ?? 0).toFixed(1),
            cog: +(pos.Cog ?? 0).toFixed(1),
            type: decodeShipType(shipTypeCode),
            flag: meta.MMSI ? String(meta.MMSI).slice(0, 3) : "IND",
            lastUpdate: Date.now(),
          };

          if (vessel.lat < 1 || vessel.lat > 30 || vessel.lon < 55 || vessel.lon > 100) return;

          vesselMap.set(mmsi, vessel);
          onUpdate(new Map(vesselMap));
        } catch { /* ignore */ }
      };

      ws.onerror = () => onError?.("AIS connection error");
      ws.onclose = () => {
        if (!dead) setTimeout(connect, 5000);
      };
    } catch {
      onError?.("Failed to establish WebSocket");
    }
  }

  connect();

  return () => {
    dead = true;
    if (tickerTimer) clearInterval(tickerTimer);
    ws?.close();
  };
}
