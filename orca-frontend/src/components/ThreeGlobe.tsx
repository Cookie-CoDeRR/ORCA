"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Plus, Minus, Compass, RotateCcw, Grid } from "lucide-react";
import { createCurrentsLayer } from "./CurrentsLayer";

export type EnvironmentalRasterType = "none" | "sst" | "chlorophyll" | "currents" | "bathymetry";

export interface VectorOverlayToggles {
  pfz: boolean;
  imbl: boolean;
  ais: boolean;
  route: boolean;
  oceanCurrents: boolean;
  ocean_currents?: boolean;
  currentsFlow?: boolean;
  mesh: boolean;
  graticule: boolean;
}

export interface ThreeGlobeProps {
  className?: string;
  /** If true the globe auto-rotates very slowly when idle. Default: true */
  autoRotate?: boolean;
  /** Globe radius. Default: 66 */
  radius?: number;
  /** Opacity of the whole mount container */
  opacity?: number;
  /** Show Google Maps style zoom and compass controls overlay. Default: true */
  showControls?: boolean;
  /** Optional callback when zoom level changes */
  onZoomChange?: (zoomFactor: number) => void;
  /** Optional target coordinate to center and zoom into */
  targetCoords?: { lat: number; lon: number } | null;
  /** Callback when user double-clicks a location on the globe */
  onLocationSelect?: (coords: { lat: number; lon: number } | null) => void;
  /** Whether the right chat drawer is open (shifts controls out from under drawer) */
  chatOpen?: boolean;
  /** Mutually exclusive environmental base layer */
  activeBaseLayer?: string;
  /** Mutually exclusive environmental color field raster */
  activeRaster?: EnvironmentalRasterType;
  /** Direct map vector & point overlays (Set or Array of overlay IDs) */
  activeOverlays?: Set<string> | string[];
  /** Direct map vector & point overlays */
  vectorLayers?: Partial<VectorOverlayToggles>;
  /** Layer toggles (legacy support) */
  layers?: {
    currents?: boolean;
    pfz?: boolean;
    imbl?: boolean;
    ports?: boolean;
    mesh?: boolean;
    graticule?: boolean;
    atmosphere?: boolean;
  };
}

export function normalizeBaseLayer(layer: string | EnvironmentalRasterType | undefined): EnvironmentalRasterType {
  if (!layer) return "none";
  if (layer === "sst" || layer === "sst_thermal") return "sst";
  if (layer === "chlorophyll" || layer === "chlorophyll_plumes") return "chlorophyll";
  if (layer === "currents" || layer === "currents_velocity") return "currents";
  if (layer === "bathymetry" || layer === "bathymetric_depth") return "bathymetry";
  return "none";
}

export function normalizeOverlays(
  activeOverlays: Set<string> | string[] | undefined,
  vectorLayers: Partial<VectorOverlayToggles> | undefined
): VectorOverlayToggles {
  if (activeOverlays) {
    const set = activeOverlays instanceof Set ? activeOverlays : new Set(activeOverlays);
    return {
      pfz: set.has("pfz") || set.has("pfz_hotspots"),
      imbl: set.has("imbl") || set.has("imbl_sovereign"),
      ais: set.has("ais") || set.has("ais_fleet"),
      route: set.has("route") || set.has("optimal_route"),
      oceanCurrents: set.has("ocean_currents") || set.has("oceanCurrents") || set.has("current_flow") || set.has("currents_flow"),
      ocean_currents: set.has("ocean_currents") || set.has("oceanCurrents") || set.has("current_flow") || set.has("currents_flow"),
      currentsFlow: false,
      mesh: set.has("mesh") || set.has("tactical_mesh") || set.has("5x5_mesh"),
      graticule: set.has("graticule") || set.has("global_graticule"),
    };
  }
  return {
    pfz: vectorLayers?.pfz ?? true,
    imbl: vectorLayers?.imbl ?? true,
    ais: vectorLayers?.ais ?? true,
    route: vectorLayers?.route ?? true,
    oceanCurrents: vectorLayers?.oceanCurrents ?? vectorLayers?.ocean_currents ?? false,
    ocean_currents: vectorLayers?.oceanCurrents ?? vectorLayers?.ocean_currents ?? false,
    currentsFlow: false,
    mesh: vectorLayers?.mesh ?? true,
    graticule: vectorLayers?.graticule ?? false,
  };
}

// ── Geodetic Coordinate Conversion Helpers ─────────────────────────
const latLonToVec3 = (lat: number, lon: number, r: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
};

const vec3ToLatLon = (vec3: THREE.Vector3): { lat: number; lon: number } => {
  const r = vec3.length();
  const phi = Math.acos(Math.min(1, Math.max(-1, vec3.y / r)));
  const lat = 90 - (phi * 180) / Math.PI;
  let degTheta = Math.atan2(vec3.z, -vec3.x) * (180 / Math.PI);
  let lon = degTheta - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lat, lon };
};

const latLonToTile = (lat: number, lon: number, z: number) => {
  const n = Math.pow(2, z);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
  };
};

const tileToBounds = (x: number, y: number, z: number) => {
  const n = Math.pow(2, z);
  const lonMin = (x / n) * 360 - 180;
  const lonMax = ((x + 1) / n) * 360 - 180;
  const latMaxRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const latMinRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
  const latMax = (latMaxRad * 180) / Math.PI;
  const latMin = (latMinRad * 180) / Math.PI;
  return { latMin, latMax, lonMin, lonMax };
};

const createTileGeometry = (
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
  r: number,
  segs: number = 6
) => {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= segs; j++) {
    const v = j / segs;
    const lat = latMax - v * (latMax - latMin);
    const phi = ((90 - lat) * Math.PI) / 180;

    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const lon = lonMin + u * (lonMax - lonMin);
      const theta = ((lon + 180) * Math.PI) / 180;

      const x = -r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      positions.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }

  const rowSize = segs + 1;
  for (let j = 0; j < segs; j++) {
    for (let i = 0; i < segs; i++) {
      const a = j * rowSize + i;
      const b = j * rowSize + (i + 1);
      const c = (j + 1) * rowSize + i;
      const d = (j + 1) * rowSize + (i + 1);

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
};

const getTileZoomLevel = (altitude: number): number => {
  if (altitude > 24) return 0; // base 4K texture is sharp enough for whole hemisphere
  if (altitude > 9.0) return 6; // ~5.6° per tile, covers subcontinent
  if (altitude > 2.8) return 8; // ~1.4° per tile, regional coastline
  if (altitude > 0.8) return 10; // ~0.35° per tile, coastal bay / gulf
  if (altitude > 0.22) return 12; // ~0.088° per tile, coastal harbor & entrance channel
  if (altitude > 0.065) return 14; // ~0.022° per tile, inner harbor / port terminals
  if (altitude > 0.022) return 16; // ~0.0055° per tile (~600m), piers, breakwaters, docks
  return 17; // ~0.0027° per tile (~300m), sub-meter vessel & crane resolution
};

interface TileCacheItem {
  key: string;
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  mat: THREE.MeshBasicMaterial;
  texture: THREE.Texture | null;
  loaded: boolean;
  lastUsed: number;
  z: number;
}

const parseGeoJSONToLineSegments = (geojson: any, r: number): THREE.BufferGeometry => {
  const points: THREE.Vector3[] = [];

  const processRing = (ring: number[][]) => {
    if (!ring || ring.length < 2) return;
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      if (p1 && p2 && p1.length >= 2 && p2.length >= 2) {
        const lon1 = p1[0];
        const lat1 = p1[1];
        const lon2 = p2[0];
        const lat2 = p2[1];
        if (Math.abs(lat1) <= 90 && Math.abs(lon1) <= 180 && Math.abs(lat2) <= 90 && Math.abs(lon2) <= 180) {
          points.push(latLonToVec3(lat1, lon1, r), latLonToVec3(lat2, lon2, r));
        }
      }
    }
  };

  const processGeometry = (geom: any) => {
    if (!geom || !geom.type || !geom.coordinates) return;
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) {
        processRing(ring);
      }
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        for (const ring of poly) {
          processRing(ring);
        }
      }
    } else if (geom.type === "LineString") {
      processRing(geom.coordinates);
    } else if (geom.type === "MultiLineString") {
      for (const line of geom.coordinates) {
        processRing(line);
      }
    }
  };

  if (geojson && geojson.features) {
    for (const feature of geojson.features) {
      if (feature.geometry) {
        processGeometry(feature.geometry);
      }
    }
  }

  return new THREE.BufferGeometry().setFromPoints(points);
};

export default function ThreeGlobe({
  className = "",
  autoRotate = true,
  radius = 66,
  opacity = 1,
  showControls = true,
  onZoomChange,
  targetCoords = null,
  onLocationSelect,
  chatOpen = false,
  activeBaseLayer,
  activeRaster = "none",
  activeOverlays,
  vectorLayers,
  layers,
}: ThreeGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const compassNeedleRef = useRef<SVGSVGElement>(null);
  const compassTooltipRef = useRef<HTMLSpanElement>(null);
  const zoomBadgeRef = useRef<HTMLDivElement>(null);

  const zoomInRef = useRef<() => void>(() => {});
  const zoomOutRef = useRef<() => void>(() => {});
  const resetRef = useRef<() => void>(() => {});
  const toggleGridRef = useRef<() => void>(() => {});

  const [gridActive, setGridActive] = useState(true);

  // Normalize inputs to standard engine format
  const effectiveBaseLayer = activeBaseLayer || activeRaster || "natural_satellite";
  const effectiveRaster = normalizeBaseLayer(effectiveBaseLayer);
  const effectiveVectorOverlays = normalizeOverlays(activeOverlays, vectorLayers);

  // Sync prop changes via refs so Three.js NEVER re-mounts or jitters
  const activeRasterRef = useRef(effectiveRaster);
  const vectorLayersRef = useRef(effectiveVectorOverlays);
  const updateLayersRef = useRef<() => void>(() => {});

  useEffect(() => {
    activeRasterRef.current = effectiveRaster;
    vectorLayersRef.current = effectiveVectorOverlays;
    updateLayersRef.current();
  }, [effectiveRaster, effectiveVectorOverlays]);

  // Sync prop changes via refs so Three.js NEVER re-mounts or jitters
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const onZoomChangeRef = useRef(onZoomChange);
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const isLockedRef = useRef(false);
  const targetCoordsRef = useRef(targetCoords);
  const updateTargetRef = useRef<(lat: number, lon: number, customAltitude?: number) => void>(() => {});

  useEffect(() => {
    targetCoordsRef.current = targetCoords;
    if (targetCoords) {
      isLockedRef.current = true;
      autoRotateRef.current = false;
      updateTargetRef.current(targetCoords.lat, targetCoords.lon);
    } else {
      isLockedRef.current = false;
      autoRotateRef.current = autoRotate;
    }
  }, [targetCoords?.lat, targetCoords?.lon, autoRotate]);

  // Master Setup Effect: Runs strictly ONCE on mount
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 600;

    // ── 1. Scene & Camera (Deep Close-Up Tactical Zoom: altitude 0.025 to 139) ──
    const scene = new THREE.Scene();
    // Near clipping plane 0.008 prevents clipping down to 8mm above surface
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.008, 2000);

    const MIN_DIST = radius + 0.025; // Altitude ~0.025 (ultra-deep harbor berth & pier zoom, >1400x zoom)
    const MAX_DIST = 320;           // High orbit view
    const DEFAULT_DIST = 205;       // Standard India regional overview

    let targetCamDist = DEFAULT_DIST;
    camera.position.z = DEFAULT_DIST;

    // ── 2. Renderer (Monochrome / Neutral Transparent) ─────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    // ── 3. Lighting (Sunlight + Ambient space light) ────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(220, 140, 260);
    scene.add(sunLight);

    const backRimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backRimLight.position.set(-200, -100, -200);
    scene.add(backRimLight);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // ── 4. OFFICIAL PHOTOREALISTIC SATELLITE IMAGERY BEDROCK ──
    const textureLoader = new THREE.TextureLoader();
    
    // Load unified ArcGIS World Imagery bedrock texture so high-orbit & close-up use the EXACT SAME skin
    const earthDayMap = textureLoader.load("/textures/world_imagery_base.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      earthMat.needsUpdate = true;
    });

    const earthSpecularMap = textureLoader.load("/textures/earth_specular.jpg");

    // Earth Sphere with Photorealistic Satellite Imagery & Specular Ocean Reflection
    const earthGeo = new THREE.SphereGeometry(radius, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthDayMap,
      specularMap: earthSpecularMap,
      specular: new THREE.Color(0x181818),
      shininess: 10,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // ── 4a. Dynamic High-Resolution Satellite Tile Group (ArcGIS World Imagery) ──
    const tiledSatelliteGroup = new THREE.Group();
    tiledSatelliteGroup.renderOrder = 1;
    globeGroup.add(tiledSatelliteGroup);

    const tileCache = new Map<string, TileCacheItem>();
    const tileLoader = new THREE.TextureLoader();
    tileLoader.setCrossOrigin("anonymous");

    // ── 4b. Environmental Color Raster Layer (Mutually Exclusive & Cached) ──
    // Continuous colour field rasters: SST Thermal, Chlorophyll-a, Ocean Currents velocity, Bathymetry relief.
    // Strictly ONE raster mode active at a time so colors never mix or muddy each other.
    const textureMapCache: Record<string, THREE.Texture> = {
      sst: textureLoader.load("/textures/sst_raster.png"),
      chlorophyll: textureLoader.load("/textures/chlorophyll_raster.png"),
      currents: textureLoader.load("/textures/currents_raster.png"),
      bathymetry: textureLoader.load("/textures/bathymetry_raster.png"),
    };

    Object.values(textureMapCache).forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    });

    const sstTexture = textureMapCache.sst;
    const chlTexture = textureMapCache.chlorophyll;
    const currentsRasterTexture = textureMapCache.currents;
    const bathyTexture = textureMapCache.bathymetry;

    const rasterGeo = new THREE.SphereGeometry(radius + 0.015, 64, 64);
    const rasterMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const rasterMesh = new THREE.Mesh(rasterGeo, rasterMat);
    rasterMesh.renderOrder = 10;
    rasterMesh.visible = false;
    globeGroup.add(rasterMesh);

    // ── 5. Atmospheric Rayleigh Scatter Rim Glow ──────────────────
    const atmoGeo = new THREE.SphereGeometry(radius * 1.12, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
          gl_FragColor = vec4(glowColor, intensity * 0.28);
        }
      `,
    });
    globeGroup.add(new THREE.Mesh(atmoGeo, atmoMat));



    // ── 7. PROGRESSIVE MULTI-TIER COORDINATE GRIDS (Google Maps Style) ─
    // As you zoom in, more grids form continuously:
    // Level 1: Global 10° Graticule
    // Level 2: Regional 2° Grid (Arabian Sea / Bay of Bengal)
    // Level 3: Sub-regional 0.5° (~55km) Grid
    // Level 4: Tactical Sector 0.1° (~11km) Grid
    // Level 5: 6km × 5km Tactical Mesh across active sector
    // Level 6: Target Cell Reticle
    const gridMeshGroup = new THREE.Group();
    globeGroup.add(gridMeshGroup);

    // Level 1: Global Major Graticule (10° Parallels & Meridians)
    const majorPoints: THREE.Vector3[] = [];
    for (let lat = -80; lat <= 80; lat += 10) {
      for (let lon = -180; lon < 180; lon += 5) {
        majorPoints.push(latLonToVec3(lat, lon, radius + 0.08), latLonToVec3(lat, lon + 5, radius + 0.08));
      }
    }
    for (let lon = -180; lon < 180; lon += 10) {
      for (let lat = -80; lat < 80; lat += 5) {
        majorPoints.push(latLonToVec3(lat, lon, radius + 0.08), latLonToVec3(lat + 5, lon, radius + 0.08));
      }
    }
    const majorGeo = new THREE.BufferGeometry().setFromPoints(majorPoints);
    const majorMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const majorMesh = new THREE.LineSegments(majorGeo, majorMat);
    gridMeshGroup.add(majorMesh);

    // Level 2: Regional Subdivided Grid (2° Parallels & Meridians across Indian Ocean basin)
    const medPoints: THREE.Vector3[] = [];
    for (let lat = -15; lat <= 30; lat += 2) {
      for (let lon = 50; lon < 102; lon += 2) {
        medPoints.push(latLonToVec3(lat, lon, radius + 0.10), latLonToVec3(lat, lon + 2, radius + 0.10));
      }
    }
    for (let lon = 50; lon <= 102; lon += 2) {
      for (let lat = -15; lat < 30; lat += 2) {
        medPoints.push(latLonToVec3(lat, lon, radius + 0.10), latLonToVec3(lat + 2, lon, radius + 0.10));
      }
    }
    const medGeo = new THREE.BufferGeometry().setFromPoints(medPoints);
    const medMat = new THREE.LineBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const medMesh = new THREE.LineSegments(medGeo, medMat);
    gridMeshGroup.add(medMesh);

    // Dynamic Progressive Grids (Levels 3, 4, 5)
    // Level 3: 0.5° Sub-Regional Grid (~55km) across Extended Indian Ocean Basin
    const subRegionalMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    const subPoints: THREE.Vector3[] = [];
    for (let lat = -12.0; lat <= 34.0001; lat += 0.5) {
      for (let lon = 42.0; lon < 108.0; lon += 4.0) {
        const nextLon = Math.min(108.0, lon + 4.0);
        subPoints.push(latLonToVec3(lat, lon, radius + 0.12), latLonToVec3(lat, nextLon, radius + 0.12));
      }
    }
    for (let lon = 42.0; lon <= 108.0001; lon += 0.5) {
      for (let lat = -12.0; lat < 34.0; lat += 4.0) {
        const nextLat = Math.min(34.0, lat + 4.0);
        subPoints.push(latLonToVec3(lat, lon, radius + 0.12), latLonToVec3(nextLat, lon, radius + 0.12));
      }
    }
    const subGeo = new THREE.BufferGeometry().setFromPoints(subPoints);
    const subRegionalMesh = new THREE.LineSegments(subGeo, subRegionalMat);
    gridMeshGroup.add(subRegionalMesh);

    // Level 4: Continuous 6km (Lon) × 5km (Lat) Tactical Mesh across Maritime Theater
    // Seamlessly covers -3.0° to 27.0°N and 56.0° to 98.0°E (4.2M sq km)
    // Eliminates all localized rectangular box edges anywhere in Indian Waters
    const fineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    const dLat = 0.18; // ~20.0 km tactical sector grid
    const dLon = 0.20; // ~22.0 km tactical sector grid
    const finePoints: THREE.Vector3[] = [];

    for (let lat = -3.0; lat <= 27.0001; lat += dLat) {
      for (let lon = 56.0; lon < 98.0; lon += 4.0) {
        const nextLon = Math.min(98.0, lon + 4.0);
        finePoints.push(latLonToVec3(lat, lon, radius + 0.15), latLonToVec3(lat, nextLon, radius + 0.15));
      }
    }
    for (let lon = 56.0; lon <= 98.0001; lon += dLon) {
      for (let lat = -3.0; lat < 27.0; lat += 4.0) {
        const nextLat = Math.min(27.0, lat + 4.0);
        finePoints.push(latLonToVec3(lat, lon, radius + 0.15), latLonToVec3(nextLat, lon, radius + 0.15));
      }
    }
    const fineGeo = new THREE.BufferGeometry().setFromPoints(finePoints);
    const fineGridMesh = new THREE.LineSegments(fineGeo, fineMat);
    gridMeshGroup.add(fineGridMesh);

    // Dynamic Remote Grid Fallback (for any clicks outside the pre-rendered Indian Ocean theater)
    let remoteGridMesh: THREE.LineSegments | null = null;
    const updateRemoteGrid = (cLat: number, cLon: number) => {
      // If within pre-rendered theater, no additional mesh needed
      if (cLat >= -2.5 && cLat <= 26.5 && cLon >= 56.5 && cLon <= 97.5) {
        if (remoteGridMesh) {
          gridMeshGroup.remove(remoteGridMesh);
          remoteGridMesh.geometry.dispose();
          remoteGridMesh = null;
        }
        return;
      }
      if (remoteGridMesh) {
        gridMeshGroup.remove(remoteGridMesh);
        remoteGridMesh.geometry.dispose();
        remoteGridMesh = null;
      }
      const spanLat = 10.0;
      const spanLon = 10.0;
      const minLat = Math.floor((cLat - spanLat) / dLat) * dLat;
      const maxLat = Math.ceil((cLat + spanLat) / dLat) * dLat;
      const minLon = Math.floor((cLon - spanLon) / dLon) * dLon;
      const maxLon = Math.ceil((cLon + spanLon) / dLon) * dLon;

      const pts: THREE.Vector3[] = [];
      for (let lat = minLat; lat <= maxLat + 0.0001; lat += dLat) {
        for (let lon = minLon; lon < maxLon; lon += 4.0) {
          const nextLon = Math.min(maxLon, lon + 4.0);
          pts.push(latLonToVec3(lat, lon, radius + 0.15), latLonToVec3(lat, nextLon, radius + 0.15));
        }
      }
      for (let lon = minLon; lon <= maxLon + 0.0001; lon += dLon) {
        for (let lat = minLat; lat < maxLat; lat += 4.0) {
          const nextLat = Math.min(maxLat, lat + 4.0);
          pts.push(latLonToVec3(lat, lon, radius + 0.15), latLonToVec3(nextLat, lon, radius + 0.15));
        }
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      remoteGridMesh = new THREE.LineSegments(geo, fineMat);
      gridMeshGroup.add(remoteGridMesh);
    };

    // ── Level 5: Active Target 6km x 5km Highlighted Bounding Box Reticle
    let targetBoxMesh: THREE.LineSegments | null = null;
    const boxMat = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      linewidth: 2,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    const createTargetBox = (lat: number, lon: number) => {
      if (targetBoxMesh) {
        gridMeshGroup.remove(targetBoxMesh);
        targetBoxMesh.geometry.dispose();
        targetBoxMesh = null;
      }

      // Snap to the exact geodetic cell enclosing lat, lon
      const cellMinLat = Math.floor(lat / dLat) * dLat;
      const cellMaxLat = cellMinLat + dLat;
      const cellMinLon = Math.floor(lon / dLon) * dLon;
      const cellMaxLon = cellMinLon + dLon;
      const cellMidLat = (cellMinLat + cellMaxLat) / 2;
      const cellMidLon = (cellMinLon + cellMaxLon) / 2;

      const p1 = latLonToVec3(cellMinLat, cellMinLon, radius + 0.22);
      const p2 = latLonToVec3(cellMinLat, cellMaxLon, radius + 0.22);
      const p3 = latLonToVec3(cellMaxLat, cellMaxLon, radius + 0.22);
      const p4 = latLonToVec3(cellMaxLat, cellMinLat, radius + 0.22);

      const boxPoints = [
        p1, p2,
        p2, p3,
        p3, p4,
        p4, p1,
        // Precision center reticle ticks
        latLonToVec3(cellMinLat, cellMidLon, radius + 0.22),
        latLonToVec3(cellMinLat + dLat * 0.35, cellMidLon, radius + 0.22),
        latLonToVec3(cellMaxLat, cellMidLon, radius + 0.22),
        latLonToVec3(cellMaxLat - dLat * 0.35, cellMidLon, radius + 0.22),
        latLonToVec3(cellMidLat, cellMinLon, radius + 0.22),
        latLonToVec3(cellMidLat, cellMinLon + dLon * 0.35, radius + 0.22),
        latLonToVec3(cellMidLat, cellMaxLon, radius + 0.22),
        latLonToVec3(cellMidLat, cellMaxLon - dLon * 0.35, radius + 0.22),
      ];

      const boxGeo = new THREE.BufferGeometry().setFromPoints(boxPoints);
      targetBoxMesh = new THREE.LineSegments(boxGeo, boxMat);
      gridMeshGroup.add(targetBoxMesh);
    };

    // ── 8. DIRECT MAP VECTOR OVERLAYS (Can be combined simultaneously) ──
    // Point, line, and polyline layers that render cleanly on top of ANY raster or satellite bedrock

    // ── 8a. IMBL Sovereign Zone & 5nm Standoff Safety Buffer ───────────────
    const imblGroup = new THREE.Group();
    globeGroup.add(imblGroup);

    const EEZ_COORDS = [
      [23.5, 68.0], [22.0, 67.5], [20.0, 68.5], [18.0, 70.0],
      [15.0, 71.5], [12.0, 73.0], [9.0, 75.0], [7.0, 77.5],
      [6.0, 79.0], [7.5, 81.5], [10.0, 82.0], [13.0, 83.5],
      [16.0, 85.0], [19.0, 87.0], [21.0, 89.0],
    ];
    const eezPoints = EEZ_COORDS.map(([lat, lon]) => latLonToVec3(lat, lon, radius + 0.25));
    const eezGeo = new THREE.BufferGeometry().setFromPoints(eezPoints);
    const eezMat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 1.8,
      gapSize: 1.2,
      transparent: true,
      opacity: 0.85,
    });
    const eezLine = new THREE.Line(eezGeo, eezMat);
    eezLine.computeLineDistances();
    imblGroup.add(eezLine);

    // 5nm Standoff Buffer line (red dashed line offset seaward)
    const bufferPoints = EEZ_COORDS.map(([lat, lon]) => latLonToVec3(lat, lon - 0.25, radius + 0.26));
    const bufferGeo = new THREE.BufferGeometry().setFromPoints(bufferPoints);
    const bufferMat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 1.4,
      gapSize: 1.0,
      transparent: true,
      opacity: 0.90,
    });
    const bufferLine = new THREE.Line(bufferGeo, bufferMat);
    bufferLine.computeLineDistances();
    imblGroup.add(bufferLine);

    // ── 8b. PFZ Hotspots & Beacons (Potential Fishing Zones) ───────────────
    const pfzGroup = new THREE.Group();
    globeGroup.add(pfzGroup);

    interface PulseRing {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      phase: number;
    }
    const pulseRings: PulseRing[] = [];

    const PFZ_HOTSPOTS = [
      { name: "Veraval Swell Front", lat: 20.75, lon: 70.19, color: 0xf59e0b },
      { name: "Mumbai Shelf Deep", lat: 18.88, lon: 71.29, color: 0x10b981 },
      { name: "Konkan Upwelling", lat: 16.12, lon: 72.85, color: 0x10b981 },
      { name: "Goa Continental Drop", lat: 14.80, lon: 73.50, color: 0xf59e0b },
      { name: "Mangalore Thermal Edge", lat: 12.85, lon: 74.20, color: 0x10b981 },
      { name: "Kochi Bank Upwelling", lat: 9.93, lon: 75.80, color: 0xf59e0b },
      { name: "Wadge Bank Sanctuary", lat: 7.60, lon: 77.20, color: 0xef4444 },
      { name: "Gulf of Mannar Plume", lat: 8.80, lon: 78.80, color: 0x10b981 },
      { name: "Chennai Pelagic Loop", lat: 13.08, lon: 80.80, color: 0xf59e0b },
      { name: "Godavari Delta Shelf", lat: 16.50, lon: 82.60, color: 0x10b981 },
      { name: "Visakhapatnam Deep Front", lat: 17.68, lon: 83.80, color: 0xf59e0b },
      { name: "Paradip Bengal Front", lat: 20.10, lon: 87.20, color: 0x10b981 },
      { name: "Lakshadweep Coral Ridge", lat: 10.56, lon: 72.64, color: 0xef4444 },
      { name: "Andaman Trench Basin", lat: 11.62, lon: 92.72, color: 0xf59e0b },
    ];

    const beaconCoreGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const ringGeo = new THREE.RingGeometry(0.08, 0.28, 32);

    PFZ_HOTSPOTS.forEach((loc, idx) => {
      const pos = latLonToVec3(loc.lat, loc.lon, radius + 0.18);
      const normal = pos.clone().normalize();

      // Core Beacon marker
      const bMat = new THREE.MeshBasicMaterial({ color: loc.color, depthWrite: false });
      const bMesh = new THREE.Mesh(beaconCoreGeo, bMat);
      bMesh.position.copy(pos);
      pfzGroup.add(bMesh);

      // Vertical pin stalk
      const stalkPts = [latLonToVec3(loc.lat, loc.lon, radius), pos];
      const stalkGeo = new THREE.BufferGeometry().setFromPoints(stalkPts);
      const stalkMat = new THREE.LineBasicMaterial({ color: loc.color, transparent: true, opacity: 0.7 });
      pfzGroup.add(new THREE.Line(stalkGeo, stalkMat));

      // Concentric pulsing ring
      const rMat = new THREE.MeshBasicMaterial({
        color: loc.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const rMesh = new THREE.Mesh(ringGeo, rMat);
      rMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.02)));
      rMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      pfzGroup.add(rMesh);

      pulseRings.push({
        mesh: rMesh,
        mat: rMat,
        phase: (idx / PFZ_HOTSPOTS.length) * Math.PI * 2,
      });
    });

    // ── 8c. AIS Vessel Fleet Vectors ──────────────────────────────────────
    const aisGroup = new THREE.Group();
    globeGroup.add(aisGroup);

    const AIS_VESSELS = [
      { lat: 19.12, lon: 71.40, hdg: 215, type: "trawler" },
      { lat: 18.60, lon: 70.80, hdg: 190, type: "cargo" },
      { lat: 20.40, lon: 69.80, hdg: 130, type: "tanker" },
      { lat: 15.20, lon: 72.90, hdg: 165, type: "trawler" },
      { lat: 10.15, lon: 75.30, hdg: 340, type: "cargo" },
      { lat: 8.10,  lon: 76.80, hdg: 110, type: "container" },
      { lat: 6.80,  lon: 79.20, hdg: 270, type: "tanker" },
      { lat: 12.60, lon: 81.20, hdg: 45,  type: "trawler" },
      { lat: 14.50, lon: 82.80, hdg: 30,  type: "cargo" },
      { lat: 18.20, lon: 85.00, hdg: 200, type: "tanker" },
      { lat: 21.10, lon: 88.40, hdg: 180, type: "trawler" },
      { lat: 9.20,  lon: 73.10, hdg: 310, type: "patrol" },
      { lat: 22.20, lon: 68.10, hdg: 150, type: "trawler" },
      { lat: 11.40, lon: 91.80, hdg: 60,  type: "cargo" },
    ];

    AIS_VESSELS.forEach((v) => {
      const pos = latLonToVec3(v.lat, v.lon, radius + 0.18);
      const normal = pos.clone().normalize();

      const coneGeo = new THREE.ConeGeometry(0.24, 0.58, 3);
      const coneMat = new THREE.MeshBasicMaterial({
        color: v.type === "patrol" ? 0xef4444 : v.type === "trawler" ? 0x22c55e : 0x38bdf8,
        depthWrite: false,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.copy(pos);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      aisGroup.add(cone);

      const headingRad = (v.hdg * Math.PI) / 180;
      const dLat = Math.cos(headingRad) * 0.55;
      const dLon = Math.sin(headingRad) * 0.55;
      const endPos = latLonToVec3(v.lat + dLat, v.lon + dLon, radius + 0.18);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([pos, endPos]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      });
      aisGroup.add(new THREE.Line(lineGeo, lineMat));
    });

    // ── 8d. Optimal Hydrodynamic Navigation Route ─────────────────────────
    const routeGroup = new THREE.Group();
    globeGroup.add(routeGroup);

    const ROUTE_NODES = [
      [20.902, 70.368], // Veraval Commercial Harbor
      [20.865, 70.320],
      [20.820, 70.260],
      [20.750, 70.190], // Prime PFZ Hotspot
    ];
    const rPts = ROUTE_NODES.map(([lat, lon]) => latLonToVec3(lat, lon, radius + 0.26));
    const rGeo = new THREE.BufferGeometry().setFromPoints(rPts);
    const rMat = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      linewidth: 2,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    routeGroup.add(new THREE.Line(rGeo, rMat));

    ROUTE_NODES.forEach(([lat, lon], i) => {
      const pt = latLonToVec3(lat, lon, radius + 0.27);
      const wpGeo = new THREE.SphereGeometry(i === 0 || i === ROUTE_NODES.length - 1 ? 0.32 : 0.20, 12, 12);
      const wpMat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0x22c55e : 0x2563eb, depthWrite: false });
      const wp = new THREE.Mesh(wpGeo, wpMat);
      wp.position.copy(pt);
      routeGroup.add(wp);
    });

    // ── 8f. Computed Vector Coastlines & Country Boundaries via GeoJSON ──
    const geojsonGroup = new THREE.Group();
    geojsonGroup.renderOrder = 20; // Renders ABOVE base black sphere (Layer 0) and marine rasters (Layer 1)
    globeGroup.add(geojsonGroup);

    const coastlineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8, // Sharp tactical Cyan / Slate border
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    fetch("/data/world_coastlines.geojson")
      .then((res) => res.json())
      .then((data) => {
        const coastlineGeo = parseGeoJSONToLineSegments(data, radius + 0.025);
        const coastlineMesh = new THREE.LineSegments(coastlineGeo, coastlineMat);
        coastlineMesh.renderOrder = 20;
        geojsonGroup.add(coastlineMesh);
      })
      .catch((err) => {
        console.warn("Failed to load world coastlines GeoJSON:", err);
      });

    // ── 8g. Programmatic Spherical Coordinate Graticule (Lat/Lon Grid) ──
    const graticulePoints: THREE.Vector3[] = [];
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lon = -180; lon < 180; lon += 5) {
        graticulePoints.push(
          latLonToVec3(lat, lon, radius + 0.022),
          latLonToVec3(lat, lon + 5, radius + 0.022)
        );
      }
    }
    for (let lon = -180; lon < 180; lon += 15) {
      for (let lat = -80; lat < 80; lat += 5) {
        graticulePoints.push(
          latLonToVec3(lat, lon, radius + 0.022),
          latLonToVec3(lat + 5, lon, radius + 0.022)
        );
      }
    }
    const graticuleGeo = new THREE.BufferGeometry().setFromPoints(graticulePoints);
    const graticuleMat = new THREE.LineBasicMaterial({
      color: 0x475569, // Subtle tactical Slate-600
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const graticuleMesh = new THREE.LineSegments(graticuleGeo, graticuleMat);
    graticuleMesh.renderOrder = 15;
    globeGroup.add(graticuleMesh);

    // ── 8h. GPU-Accelerated Hydrodynamic Ocean Current Flow Field (GPGPU Shaders) ──
    const currentsLayer = createCurrentsLayer(radius, 56000);
    globeGroup.add(currentsLayer.mesh);

    let lastTileUpdate = 0;

    const updateTiledSatellite = (force = false) => {
      const raster = activeRasterRef.current;
      if (raster && raster !== "none" && raster !== "currents") {
        tiledSatelliteGroup.visible = false;
        return;
      }
      const now = performance.now();
      if (!force && now - lastTileUpdate < 150) return;
      lastTileUpdate = now;

      const altitude = Math.max(0.015, camera.position.z - radius);
      const z = getTileZoomLevel(altitude);

      if (z === 0) {
        tiledSatelliteGroup.visible = false;
        return;
      }

      tiledSatelliteGroup.visible = true;

      // Authentic ESRI World Imagery - crystal clear photorealistic satellite bedrock (NEVER pale white bathymetry)
      const servicePrefix = "sat";
      const tileServiceBase = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

      // Surface coordinate facing the camera
      const facingVec = new THREE.Vector3(0, 0, radius).applyQuaternion(
        globeGroup.quaternion.clone().invert()
      );
      const { lat: centerLat, lon: centerLon } = vec3ToLatLon(facingVec);

      const n = Math.pow(2, z);
      const centerTile = latLonToTile(centerLat, centerLon, z);
      // span 2 creates a 5x5 tile cluster (25 tiles) which covers 2.5x viewport FOV with minimal GPU payload
      const span = 2;

      const requiredKeys = new Set<string>();

      for (let dy = -span; dy <= span; dy++) {
        const y = centerTile.y + dy;
        if (y < 0 || y >= n) continue;

        for (let dx = -span; dx <= span; dx++) {
          const x = (centerTile.x + dx + n) % n;
          const key = `${servicePrefix}_${z}_${x}_${y}`;
          requiredKeys.add(key);

          const existing = tileCache.get(key);
          if (existing) {
            existing.lastUsed = Date.now();
            if (existing.loaded) {
              existing.mesh.visible = true;
            }
          } else {
            const { latMin, latMax, lonMin, lonMax } = tileToBounds(x, y, z);
            const geo = createTileGeometry(latMin, latMax, lonMin, lonMax, radius + 0.002, 6);
            const url = `${tileServiceBase}/${z}/${y}/${x}`;

            const mat = new THREE.MeshBasicMaterial({
              side: THREE.FrontSide,
              polygonOffset: true,
              polygonOffsetFactor: -1,
              polygonOffsetUnits: -1,
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false; // strictly false until texture is downloaded
            tiledSatelliteGroup.add(mesh);

            const item: TileCacheItem = {
              key,
              mesh,
              geo,
              mat,
              texture: null,
              loaded: false,
              lastUsed: Date.now(),
              z,
            };
            tileCache.set(key, item);

            tileLoader.load(
              url,
              (t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                t.minFilter = THREE.LinearMipmapLinearFilter;
                t.magFilter = THREE.LinearFilter;
                t.generateMipmaps = true;
                mat.map = t;
                mat.needsUpdate = true;
                item.loaded = true;
                item.texture = t;
                if (requiredKeys.has(key)) {
                  mesh.visible = true;
                }
              },
              undefined,
              () => {
                // If fetch fails or rate limited, keep mesh hidden so base 4K imagery shows cleanly
                item.loaded = false;
                mesh.visible = false;
              }
            );
          }
        }
      }

      // Hide tiles from mismatched zoom tiers or other service
      for (const [k, item] of tileCache.entries()) {
        if (!k.startsWith(servicePrefix) || (!requiredKeys.has(k) && item.z !== z)) {
          item.mesh.visible = false;
        }
      }

      // Memory safeguard: LRU pruning when cache exceeds 80 tiles
      if (tileCache.size > 80) {
        const entries = Array.from(tileCache.entries()).sort(
          (a, b) => a[1].lastUsed - b[1].lastUsed
        );
        const toRemove = entries.slice(0, entries.length - 50);
        for (const [k, item] of toRemove) {
          if (!requiredKeys.has(k)) {
            tiledSatelliteGroup.remove(item.mesh);
            item.geo.dispose();
            if (item.texture) item.texture.dispose();
            item.mat.dispose();
            tileCache.delete(k);
          }
        }
      }
    };

    // ── 9b. DYNAMIC LAYER SYNC CALLBACK (Data Mode & Satellite Mode Swapping) ─────
    updateLayersRef.current = () => {
      const raster = activeRasterRef.current;
      const isDataMode = Boolean(raster && raster !== "none");
      const targetTexture = isDataMode ? textureMapCache[raster] : null;

      if (isDataMode) {
        if (raster === "currents") {
          // Dedicated Ocean Current Data Mode:
          // Display the authentic Eulerian hydrodynamic currents velocity field
          // and keep online ocean tiles active for high-resolution current bathymetry
          rasterMat.map = targetTexture;
          rasterMat.opacity = 0.88;
          rasterMat.needsUpdate = true;
          rasterMesh.visible = true;
          tiledSatelliteGroup.visible = true;
          updateTiledSatellite(true);
        } else {
          // Pure color field data rasters (SST, Chlorophyll, Bathymetry)
          if (earthMat.map !== null) {
            earthMat.map = null;
            earthMat.specularMap = null;
            earthMat.color.setHex(0x050505); // Pitch black landmasses
            earthMat.needsUpdate = true;
          }

          // Turn off satellite tiles completely so they never protrude or Z-fight
          tiledSatelliteGroup.visible = false;

          // Show data raster directly over black bedrock
          if (rasterMat.map !== targetTexture) {
            rasterMat.map = targetTexture;
            rasterMat.needsUpdate = true;
          }
          rasterMat.opacity = 0.95;
          rasterMesh.visible = true;
        }
      } else {
        // SATELLITE / OCEAN CURRENT MODE
        if (earthMat.map !== earthDayMap) {
          earthMat.map = earthDayMap;
          earthMat.specularMap = earthSpecularMap;
          earthMat.color.setHex(0xffffff);
          earthMat.needsUpdate = true;
        }

        rasterMesh.visible = false;
        updateTiledSatellite(true);
      }

      // 2. Direct Map Vector & Point Overlays (INDEPENDENT MULTI-SELECT)
      const vl = vectorLayersRef.current;
      if (vl) {
        pfzGroup.visible = vl.pfz !== false;
        imblGroup.visible = vl.imbl !== false;
        aisGroup.visible = vl.ais !== false;
        routeGroup.visible = vl.route !== false;
        gridMeshGroup.visible = vl.mesh !== false || vl.graticule !== false;
        currentsLayer.mesh.visible = Boolean(vl.oceanCurrents || vl.currentsFlow);
      }
    };

    // Initial layer sync
    updateLayersRef.current();

    // ── 10. Initial Orientation: Focused on India / Arabian Sea ─────
    const DEFAULT_ROT_X = (19.0 * Math.PI) / 180;
    const DEFAULT_ROT_Y = -((71.0 + 90.0) * Math.PI) / 180;
    globeGroup.rotation.x = DEFAULT_ROT_X;
    globeGroup.rotation.y = DEFAULT_ROT_Y;

    let targetRotY = DEFAULT_ROT_Y;
    let targetRotX = DEFAULT_ROT_X;

    // External target coordinate setter: smooth centering and comfortable regional zoom
    updateTargetRef.current = (lat: number, lon: number, customAltitude?: number) => {
      targetRotX = (lat * Math.PI) / 180;
      const desiredRotY = -((lon + 90.0) * Math.PI) / 180;
      let diff = (desiredRotY - globeGroup.rotation.y) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      targetRotY = globeGroup.rotation.y + diff;
      
      // Moderate regional altitude (~42 units above sphere, ~3.3x zoom from overview)
      // Provides clear, wide regional context of the marine sector instead of plunging down to 0.95!
      const altitude = customAltitude !== undefined ? customAltitude : 42.0;
      targetCamDist = radius + altitude;

      createTargetBox(lat, lon);
      updateRemoteGrid(lat, lon);
      updateTiledSatellite(true);
    };

    if (targetCoordsRef.current) {
      updateTargetRef.current(targetCoordsRef.current.lat, targetCoordsRef.current.lon);
    }

    // ── 11. Smooth Adaptive Zoom & Control Handlers ─────────────────
    const applyZoom = (delta: number) => {
      const currentAltitude = Math.max(0.015, targetCamDist - radius);
      if (delta > 0) {
        // Quick zoom out: multiplies altitude by 1.65 + guaranteed minimum jump
        const newAltitude = Math.max(currentAltitude * 1.65, currentAltitude + 7.5);
        targetCamDist = Math.min(MAX_DIST, radius + newAltitude);
      } else {
        // Quick zoom in: contracts altitude down to 0.025 (deep harbor berth / pier level)
        const newAltitude = Math.max(0.025, currentAltitude * 0.55);
        targetCamDist = Math.max(MIN_DIST, radius + newAltitude);
      }
      updateTiledSatellite(true);
    };

    zoomInRef.current = () => applyZoom(-1);
    zoomOutRef.current = () => applyZoom(1);
    resetRef.current = () => {
      isLockedRef.current = false;
      targetRotX = DEFAULT_ROT_X;
      const desiredRotY = DEFAULT_ROT_Y;
      let diff = (desiredRotY - globeGroup.rotation.y) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      targetRotY = globeGroup.rotation.y + diff;
      targetCamDist = DEFAULT_DIST;
      if (targetBoxMesh) {
        gridMeshGroup.remove(targetBoxMesh);
        targetBoxMesh.geometry.dispose();
        targetBoxMesh = null;
      }
      if (remoteGridMesh) {
        gridMeshGroup.remove(remoteGridMesh);
        remoteGridMesh.geometry.dispose();
        remoteGridMesh = null;
      }
      if (onLocationSelectRef.current) {
        onLocationSelectRef.current(null);
      }
      updateTiledSatellite(true);
    };
    toggleGridRef.current = () => {
      gridMeshGroup.visible = !gridMeshGroup.visible;
      setGridActive(gridMeshGroup.visible);
    };

    // ── 12. Mouse & Touch Interactions ──────────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let touchDistanceStart = 0;

    // Fast, responsive, exponential scroll-to-zoom (escapes close zoom in 3-4 ticks)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentAltitude = Math.max(0.015, targetCamDist - radius);
      const isZoomingOut = e.deltaY > 0;

      if (isZoomingOut) {
        // Fast, decisive zoom out: each scroll tick multiplies altitude by ~1.55
        // with guaranteed minimum boost of 1.6 so you escape close zoom in 3-4 ticks!
        const magnitude = Math.min(3.5, Math.max(1.0, Math.abs(e.deltaY) / 30));
        const outFactor = Math.pow(1.55, magnitude);
        const minBoost = 1.6 * magnitude;
        const newAltitude = Math.max(currentAltitude * outFactor, currentAltitude + minBoost);
        targetCamDist = Math.min(MAX_DIST, radius + newAltitude);
      } else {
        // Fast zoom in: smooth geometric contraction down to 0.025 altitude
        const magnitude = Math.min(3.5, Math.max(1.0, Math.abs(e.deltaY) / 30));
        const inFactor = Math.pow(0.65, magnitude);
        const newAltitude = Math.max(0.025, currentAltitude * inFactor);
        targetCamDist = Math.max(MIN_DIST, radius + newAltitude);
      }
      updateTiledSatellite();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
      updateTiledSatellite(true);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const altitude = Math.max(0.08, camera.position.z - radius);
      const viewportHeight = mount.clientHeight || 700;

      // Exact 1:1 ground-to-screen pixel tracking:
      // Visible ground height at sphere tangent plane is 2 * altitude * tan(fov/2) ≈ 0.74 * altitude
      // Arc angle per screen pixel is (0.74 * altitude) / (viewportHeight * radius)
      // This reduces drag speed by over 100x when zoomed in, locking the map firmly under the cursor!
      const radPerPx = Math.max(0.000010, Math.min(0.0032, (0.74 * altitude) / (viewportHeight * radius)));

      const dx = (e.clientX - prevMouseX) * radPerPx;
      const dy = (e.clientY - prevMouseY) * radPerPx;
      targetRotY += dx;
      targetRotX = Math.max(-1.25, Math.min(1.25, targetRotX + dy));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onDblClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObject(earthMesh, false);

      if (intersects.length > 0) {
        const hitWorld = intersects[0].point;
        const hitLocal = earthMesh.worldToLocal(hitWorld.clone());
        const { lat, lon } = vec3ToLatLon(hitLocal);

        isLockedRef.current = true;
        autoRotateRef.current = false;

        // Moderate regional zoom instead of plunging to 0.95:
        // If currently at overview or high altitude (>55), zoom to 42.0 altitude.
        // If already closer, gently zoom in by 30% with a floor of 22.0.
        const currentAltitude = Math.max(0.1, targetCamDist - radius);
        const targetAltitude = currentAltitude > 55 ? 42.0 : Math.max(22.0, currentAltitude * 0.70);
        updateTargetRef.current(lat, lon, targetAltitude);

        if (onLocationSelectRef.current) {
          onLocationSelectRef.current({
            lat: Number(lat.toFixed(3)),
            lon: Number(lon.toFixed(3)),
          });
        }
      } else {
        applyZoom(-1);
      }
    };

    let lastTouchTime = 0;
    let lastTouchPos = { x: 0, y: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const now = Date.now();
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const timeDiff = now - lastTouchTime;
        const distDiff = Math.hypot(touchX - lastTouchPos.x, touchY - lastTouchPos.y);

        if (timeDiff < 350 && distDiff < 35) {
          // Double-tap detected on touch screen!
          const rect = renderer.domElement.getBoundingClientRect();
          mouseVec.x = ((touchX - rect.left) / rect.width) * 2 - 1;
          mouseVec.y = -((touchY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouseVec, camera);
          const intersects = raycaster.intersectObject(earthMesh, false);

          if (intersects.length > 0) {
            const hitWorld = intersects[0].point;
            const hitLocal = earthMesh.worldToLocal(hitWorld.clone());
            const { lat, lon } = vec3ToLatLon(hitLocal);

            isLockedRef.current = true;
            autoRotateRef.current = false;

            const currentAltitude = Math.max(0.1, targetCamDist - radius);
            const targetAltitude = currentAltitude > 55 ? 42.0 : Math.max(22.0, currentAltitude * 0.70);
            updateTargetRef.current(lat, lon, targetAltitude);

            if (onLocationSelectRef.current) {
              onLocationSelectRef.current({
                lat: Number(lat.toFixed(3)),
                lon: Number(lon.toFixed(3)),
              });
            }
          }
          lastTouchTime = 0;
          return;
        }

        lastTouchTime = now;
        lastTouchPos = { x: touchX, y: touchY };
        isDragging = true;
        prevMouseX = touchX;
        prevMouseY = touchY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistanceStart = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const altitude = Math.max(0.08, camera.position.z - radius);
        const viewportHeight = mount.clientHeight || 700;
        const radPerPx = Math.max(0.000010, Math.min(0.0032, (0.74 * altitude) / (viewportHeight * radius)));

        const dx = (e.touches[0].clientX - prevMouseX) * radPerPx;
        const dy = (e.touches[0].clientY - prevMouseY) * radPerPx;
        targetRotY += dx;
        targetRotX = Math.max(-1.25, Math.min(1.25, targetRotX + dy));
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2 && touchDistanceStart > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        applyZoom((touchDistanceStart - currentDist) * 0.5);
        touchDistanceStart = currentDist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      touchDistanceStart = 0;
      updateTiledSatellite(true);
    };

    mount.addEventListener("wheel", onWheel, { passive: false });
    mount.addEventListener("mousedown", onMouseDown);
    mount.addEventListener("dblclick", onDblClick);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    mount.addEventListener("touchstart", onTouchStart, { passive: true });
    mount.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // ── 13. Animation Loop ──────────────────────────────────────────
    let animId: number;
    let frameCount = 0;
    let lastReportedZoom = 1.0;
    let lastScreenRadiusPx = -1;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      frameCount++;
      const t = performance.now() * 0.001;

      // Smooth camera zoom interpolation
      camera.position.z += (targetCamDist - camera.position.z) * 0.09;

      // Real-time zero-lag dynamic Earth screen radius for CSS Depth of Field tracking
      const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
      const screenH = mount.clientHeight || window.innerHeight;
      const screenRadiusPx = Math.round((radius / (camera.position.z * tanHalfFov)) * (screenH / 2));
      if (Math.abs(screenRadiusPx - lastScreenRadiusPx) >= 2) {
        lastScreenRadiusPx = screenRadiusPx;
        document.documentElement.style.setProperty("--earth-r", `${screenRadiusPx}px`);
      }

      const altitude = Math.max(0.025, camera.position.z - radius);

      // Refresh detailed satellite tiles seamlessly during camera translation / zoom
      if (frameCount % 10 === 0) {
        updateTiledSatellite();
      }

      // Update zoom readout badge directly in DOM (no React re-renders)
      const zoomX = Math.round((DEFAULT_DIST - radius) / Math.max(0.025, altitude));
      if (Math.abs(zoomX - lastReportedZoom) >= 1) {
        lastReportedZoom = zoomX;
        if (zoomBadgeRef.current) {
          const gridText =
            altitude > 45
              ? "10° Global"
              : altitude > 18
              ? "2° Regional (~220km)"
              : altitude > 6.5
              ? "0.5° (~55km)"
              : altitude > 1.2
              ? "6km × 5km Tactical Mesh"
              : altitude > 0.25
              ? "1km Coastal Sector"
              : "50m Harbor Pier";
          zoomBadgeRef.current.textContent = `${zoomX}x · ${gridText}`;
        }
        if (onZoomChangeRef.current) onZoomChangeRef.current(zoomX);
      }

      // Smooth globe rotation (gentle auto-rotation ONLY when idle and no target locked)
      if (autoRotateRef.current && !isLockedRef.current && !targetCoordsRef.current && !isDragging) {
        targetRotY += 0.0007;
      }
      globeGroup.rotation.y += (targetRotY - globeGroup.rotation.y) * 0.08;
      globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.08;

      // Animate PFZ beacon pulsing rings (tactical radar beacon pulse)
      pulseRings.forEach((pr) => {
        const s = 1.0 + 0.30 * (0.5 + 0.5 * Math.sin(t * 2.8 + pr.phase));
        pr.mesh.scale.set(s, s, s);
        pr.mat.opacity = Math.max(0.20, 0.80 - 0.50 * (s - 1.0));
      });

      // Advance GPU hydrodynamic ocean currents animation (GPGPU Shaders with Progressive Zoom LOD)
      if (currentsLayer.mesh.visible) {
        currentsLayer.update(t, altitude);
      }

      // Direct DOM update for Compass needle and tooltip
      const headingDeg = Math.round((-globeGroup.rotation.y * 180 / Math.PI) % 360);
      const normalizedHeading = headingDeg < 0 ? headingDeg + 360 : headingDeg;
      if (compassNeedleRef.current) {
        compassNeedleRef.current.style.transform = `rotate(${normalizedHeading}deg)`;
      }
      if (compassTooltipRef.current) {
        compassTooltipRef.current.textContent = `${normalizedHeading}° N`;
      }

      // ── Progressive Google Maps style grid LOD fading (Strictly Single Grid) ──
      // Level 1: Major 10° global graticule
      majorMat.opacity = THREE.MathUtils.lerp(0.02, 0.18, Math.min(1, altitude / 70));
      majorMesh.visible = majorMat.opacity > 0.005;

      // Level 2: Regional 2° graticule
      const medAlpha = altitude > 80 ? 0 : altitude > 25 ? (80 - altitude) / 55 : Math.max(0, (altitude - 12) / 13);
      medMat.opacity = medAlpha * 0.22;
      medMesh.visible = medMat.opacity > 0.005;

      // Level 3: 0.5° Sub-Regional Grid (~55km)
      const subAlpha = altitude > 25 ? 0 : altitude > 12 ? (25 - altitude) / 13 : Math.max(0, (altitude - 5.5) / 6.5);
      subRegionalMat.opacity = subAlpha * 0.30;
      subRegionalMesh.visible = subRegionalMat.opacity > 0.005;

      // Level 4: Tactical Mesh
      const fineAlpha = altitude > 6.5 ? 0 : Math.min(1.0, (6.5 - altitude) / 2.5);
      fineMat.opacity = fineAlpha * 0.70;
      fineGridMesh.visible = fineMat.opacity > 0.005;

      renderer.render(scene, camera);
    };

    animate();

    // ── 14. Resize Handler ─────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchend", onTouchEnd);
      mount.removeEventListener("wheel", onWheel);
      mount.removeEventListener("mousedown", onMouseDown);
      mount.removeEventListener("dblclick", onDblClick);
      mount.removeEventListener("touchstart", onTouchStart);
      mount.removeEventListener("touchmove", onTouchMove);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      earthDayMap.dispose();
      earthSpecularMap.dispose();
      sstTexture.dispose();
      chlTexture.dispose();
      currentsRasterTexture.dispose();
      bathyTexture.dispose();
      for (const [, item] of tileCache.entries()) {
        tiledSatelliteGroup.remove(item.mesh);
        item.geo.dispose();
        if (item.texture) item.texture.dispose();
        item.mat.dispose();
      }
      tileCache.clear();
      currentsLayer.dispose();
    };
  }, [radius]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden ${className}`} style={{ opacity }}>
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* ── Google Maps & NASA Style Floating Controls (Crisp White Theme) ── */}
      {showControls && (
        <div
          className={`absolute bottom-10 z-20 flex flex-col items-center gap-2 transition-all duration-300 ${
            chatOpen ? "right-[436px]" : "right-6"
          }`}
        >
          {/* Compass / Recenter Button */}
          <button
            onClick={() => resetRef.current()}
            title="Reset to North & India Center"
            className="group relative h-10 w-10 rounded-full flex items-center justify-center bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-400 text-zinc-900 shadow-lg shadow-black/10 transition-all backdrop-blur-md active:scale-95"
          >
            <Compass
              ref={compassNeedleRef}
              className="h-5 w-5 text-zinc-900 transition-transform duration-75 group-hover:scale-110"
            />
            <span
              ref={compassTooltipRef}
              className="absolute -left-16 bg-white/95 text-[10px] font-mono text-zinc-800 px-2 py-0.5 rounded border border-zinc-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            >
              0° N
            </span>
          </button>

          {/* Progressive Geodetic Grid Mesh Toggle */}
          <button
            onClick={() => toggleGridRef.current()}
            title={gridActive ? "Hide Geodetic Coordinate Grids" : "Show Geodetic Coordinate Grids"}
            className={`h-9 w-9 rounded-xl flex items-center justify-center border shadow-lg shadow-black/10 transition-all backdrop-blur-md active:scale-95 ${
              gridActive
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-200 hover:text-black hover:border-zinc-400"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>

          {/* Zoom Level Indicator Badge */}
          <div
            ref={zoomBadgeRef}
            className="px-2.5 py-0.5 rounded-full bg-white/95 border border-zinc-200 text-[10px] font-mono font-bold text-zinc-800 shadow-sm backdrop-blur-md whitespace-nowrap"
          >
            1x · 10° Global
          </div>

          {/* Google Maps Stacked Zoom Cluster */}
          <div className="flex flex-col rounded-xl overflow-hidden bg-white border border-zinc-200 shadow-lg shadow-black/10 divide-y divide-zinc-200">
            <button
              onClick={() => zoomInRef.current()}
              title="Zoom In (+)"
              className="h-9 w-9 flex items-center justify-center text-zinc-700 hover:text-black hover:bg-zinc-100 transition-all active:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => zoomOutRef.current()}
              title="Zoom Out (−)"
              className="h-9 w-9 flex items-center justify-center text-zinc-700 hover:text-black hover:bg-zinc-100 transition-all active:bg-zinc-200"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          {/* Recenter India Quick Button */}
          <button
            onClick={() => resetRef.current()}
            title="Recenter India EEZ"
            className="h-8 w-8 rounded-lg flex items-center justify-center bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-black shadow-sm transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
