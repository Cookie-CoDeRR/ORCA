"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { isOceanCoordinate } from "../lib/oceanMask";

// ── 1. GPGPU Data Simulation: Velocity DataTexture Generator ────────────────
/**
 * Generates a 512x256 Float/Byte DataTexture simulating global hydrodynamic ocean currents.
 * Land pixels are strictly zeroed out (speed = 0, u = 0, v = 0) so no currents exist on land.
 * Uses continuous Gaussian-blended circulation vectors with zero rectangular discontinuities:
 * - West India Coastal Current (WICC): Southward along the Indian west coast shelf.
 * - Somali Jet: Broad northeastward drift across the Arabian Sea.
 * - Somali Western Boundary Current: Strong northward boundary jet along East Africa.
 * - Equatorial Jet: Rapid eastward flow south of Sri Lanka into Bay of Bengal.
 * - East India Coastal Current (EICC): Northward flow along Bay of Bengal western boundary.
 */
export function generateVelocityDataTexture(width = 512, height = 256): THREE.DataTexture {
  const size = width * height;
  const data = new Uint8Array(4 * size);

  for (let j = 0; j < height; j++) {
    const latNorm = j / (height - 1); // 0 (South Pole, -90°) to 1 (North Pole, +90°)
    const latDeg = latNorm * 180.0 - 90.0;
    const latRad = latDeg * (Math.PI / 180.0);

    for (let i = 0; i < width; i++) {
      const lonNorm = i / width; // 0 (-180°) to 1 (+180°)
      const lonDeg = lonNorm * 360.0 - 180.0;
      const lonRad = lonDeg * (Math.PI / 180.0);

      // Check landmask: if on land, strictly zero out velocity & speed!
      if (!isOceanCoordinate(latDeg, lonDeg)) {
        const idx = (j * width + i) * 4;
        data[idx] = 128;     // u = 0 (encoded as 0.5 * 255)
        data[idx + 1] = 128; // v = 0 (encoded as 0.5 * 255)
        data[idx + 2] = 0;   // speed = 0
        data[idx + 3] = 0;   // oceanMask = 0
        continue;
      }

      // Multi-frequency harmonic streamfunction (incompressible global curl-derived gyres)
      const psi =
        Math.sin(latRad * 4.0) * Math.cos(lonRad * 2.0) * 0.55 +
        Math.sin(latRad * 7.0 + Math.cos(lonRad * 3.0)) * 0.30 +
        Math.cos(lonRad * 4.5 - latRad * 2.5) * 0.20 +
        Math.sin(latRad * 10.0) * 0.12;

      // Numerical curl finite-difference derivatives: u = dPsi/dLat, v = -dPsi/dLon
      const delta = 0.02;
      const psiLat =
        Math.sin((latRad + delta) * 4.0) * Math.cos(lonRad * 2.0) * 0.55 +
        Math.sin((latRad + delta) * 7.0 + Math.cos(lonRad * 3.0)) * 0.30 +
        Math.cos(lonRad * 4.5 - (latRad + delta) * 2.5) * 0.20;

      const psiLon =
        Math.sin(latRad * 4.0) * Math.cos((lonRad + delta) * 2.0) * 0.55 +
        Math.sin(latRad * 7.0 + Math.cos((lonRad + delta) * 3.0)) * 0.30 +
        Math.cos((lonRad + delta) * 4.5 - latRad * 2.5) * 0.20;

      let u = (psiLat - psi) / delta;
      let v = -(psiLon - psi) / delta;

      // Antarctic Circumpolar Current (ACC) eastward flow at Southern Ocean [-65° to -45°]
      if (latDeg >= -65.0 && latDeg <= -45.0) {
        const accWeight = Math.sin(((latDeg - -65.0) / 20.0) * Math.PI);
        u += 1.35 * accWeight;
      }

      // ── Smooth Organic Regional Blending (Zero Hard Rectangular Seams) ──
      // 1. Somali Jet & Central Arabian Sea Basin (Northeastward drift)
      if (lonDeg >= 48.0 && lonDeg <= 70.0 && latDeg >= 3.0 && latDeg <= 20.0) {
        const wLon = Math.sin(((lonDeg - 48.0) / 22.0) * Math.PI);
        const wLat = Math.sin(((latDeg - 3.0) / 17.0) * Math.PI);
        const w = wLon * wLat * 0.82;
        u = u * (1.0 - w) + 0.85 * w;
        v = v * (1.0 - w) + 0.50 * w;
      }

      // 2. West India Coastal Current (WICC) - Southward along Indian shelf
      if (lonDeg >= 67.5 && lonDeg <= 76.5 && latDeg >= 7.5 && latDeg <= 23.5) {
        const wLon = Math.sin(((lonDeg - 67.5) / 9.0) * Math.PI);
        const wLat = Math.sin(((latDeg - 7.5) / 16.0) * Math.PI);
        const w = wLon * wLat * 0.90;
        u = u * (1.0 - w) + 0.05 * w;
        v = v * (1.0 - w) - 1.10 * w;
      }

      // 3. Somali Western Boundary Current & Great Whirl (Northward along East Africa)
      if (lonDeg >= 42.0 && lonDeg <= 53.0 && latDeg >= 0.0 && latDeg <= 13.0) {
        const wLon = Math.sin(((lonDeg - 42.0) / 11.0) * Math.PI);
        const wLat = Math.sin(((latDeg - 0.0) / 13.0) * Math.PI);
        const w = wLon * wLat * 0.85;
        u = u * (1.0 - w) + 0.35 * w;
        v = v * (1.0 - w) + 1.25 * w;
      }

      // 4. Equatorial Southwest Monsoon Current (Eastward south of Sri Lanka)
      if (lonDeg >= 66.0 && lonDeg <= 96.0 && latDeg >= 1.0 && latDeg <= 7.5) {
        const wLon = Math.sin(((lonDeg - 66.0) / 30.0) * Math.PI);
        const wLat = Math.sin(((latDeg - 1.0) / 6.5) * Math.PI);
        const w = wLon * wLat * 0.85;
        u = u * (1.0 - w) + 1.05 * w;
        v = v * (1.0 - w) + 0.05 * w;
      }

      // 5. East India Coastal Current (EICC) (Northward along Bay of Bengal)
      if (lonDeg >= 80.0 && lonDeg <= 88.0 && latDeg >= 9.5 && latDeg <= 22.5) {
        const wLon = Math.sin(((lonDeg - 80.0) / 8.0) * Math.PI);
        const wLat = Math.sin(((latDeg - 9.5) / 13.0) * Math.PI);
        const w = wLon * wLat * 0.85;
        u = u * (1.0 - w) + 0.18 * w;
        v = v * (1.0 - w) + 0.90 * w;
      }

      // Attenuate flow at extreme high latitudes
      const polarDamp = Math.cos(latRad);
      u *= polarDamp;
      v *= polarDamp;

      const speed = Math.hypot(u, v);
      const normU = speed > 0.001 ? u / Math.max(1.6, speed) : 0;
      const normV = speed > 0.001 ? v / Math.max(1.6, speed) : 0;
      const mag = Math.min(1.0, speed / 1.5);

      const idx = (j * width + i) * 4;
      data[idx] = Math.floor((normU * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((normV * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor(mag * 255);
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

// ── 2. GLSL Vertex & Fragment Shaders ───────────────────────────────────────
const CURRENTS_VERTEX_SHADER = /* glsl */ `
  uniform sampler2D uVelocityTexture;
  uniform float uTime;
  uniform float uGlobeRadius;
  uniform float uFlowSpeed;
  uniform float uFlowDistance;
  uniform float uAltitude;
  uniform float uPixelRatio;

  attribute vec3 aInitialPosition;
  attribute float aLife;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aLodThreshold;

  varying float vAlpha;
  varying float vSpeed;
  varying float vFlowAngle;
  varying float vAltFactor;

  const float PI = 3.14159265358979323846;

  void main() {
    // 1. Dynamic Progressive Zoom LOD Scaling:
    // When zoomed out (uAltitude >= 105): altFactor = 1.0 -> visibleRatio = 0.035 (ultra-sparse, low density from space).
    // As user zooms in (uAltitude drops towards 0): altFactor -> 0.0 -> visibleRatio = 1.0 (all particles active in local view).
    float altFactor = clamp((uAltitude - 10.0) / 95.0, 0.0, 1.0);
    float visibleRatio = mix(1.0, 0.035, altFactor);
    vAltFactor = altFactor;

    if (aLodThreshold > visibleRatio) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }

    vec3 normalVec = normalize(aInitialPosition);

    // 2. Exact Geodetic Equirectangular UV mapping matching latLonToVec3:
    float latRad = asin(clamp(normalVec.y, -1.0, 1.0));
    float lonRad = atan(-aInitialPosition.z, aInitialPosition.x);
    vec2 uv = vec2(lonRad / (2.0 * PI) + 0.5, latRad / PI + 0.5);

    // 3. Sample velocity DataTexture: Red = u (east), Green = v (north), Blue = speed
    vec4 velSample = texture2D(uVelocityTexture, uv);
    vec2 vel = (velSample.rg * 2.0 - 1.0);
    float speed = velSample.b;
    vSpeed = speed;

    // Strict Land & Zero-Flow Culling: completely discard vertices on land
    if (speed < 0.04) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }

    // 4. Exact Spherical Surface Tangent Coordinate Frame
    vec3 eastVec = vec3(normalVec.z, 0.0, -normalVec.x);
    if (length(eastVec) < 0.0001) {
      eastVec = vec3(0.0, 0.0, -1.0);
    } else {
      eastVec = normalize(eastVec);
    }
    vec3 northVec = normalize(cross(normalVec, eastVec));

    vec3 surfaceVel = eastVec * vel.x + northVec * vel.y;

    // 5. Position Advection: shorter travel distance when zoomed out so streamlines stay clean and separated
    float travelDistance = uFlowDistance * mix(0.24, 0.90, altFactor);
    float progress = fract(aLife + uTime * uFlowSpeed * aSpeed);
    float travel = progress * travelDistance * max(0.28, speed);
    vec3 advectedPos = aInitialPosition + surfaceVel * travel;

    // Altitude-scaled hover distance: elevated comfortably above globe and rasters to completely eliminate Z-fighting
    float hoverDist = mix(0.08, 0.32, altFactor);
    vec3 finalSpherePos = normalize(advectedPos) * (uGlobeRadius + hoverDist);

    // Linear view-space position
    vec4 viewPos4 = modelViewMatrix * vec4(finalSpherePos, 1.0);
    vec3 viewPos = viewPos4.xyz;

    // 6. Horizon / Silhouette Occlusion Culling:
    // Culls back-facing particles and smoothly fades particles near the horizon to eliminate limb jitter
    vec3 viewNormal = normalize(mat3(modelViewMatrix) * normalVec);
    vec3 toCam = normalize(-viewPos);
    float horizonDot = dot(viewNormal, toCam);
    if (horizonDot < 0.02) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }

    // 7. Jitter-Free View-Space Screen Direction:
    // Uses linear 3D view velocity transformed by modelViewMatrix.
    // +X is screen right, +Y is screen up. Zero NDC cancellation / floating-point truncation jitter!
    vec3 viewVel = mat3(modelViewMatrix) * surfaceVel;
    vFlowAngle = atan(viewVel.y, viewVel.x);

    // 8. Smooth Fade-In, Fade-Out, and Horizon Fade
    float fadeIn = smoothstep(0.0, 0.18, progress);
    float fadeOut = 1.0 - smoothstep(0.72, 1.0, progress);
    float horizonFade = smoothstep(0.02, 0.15, horizonDot);
    vAlpha = fadeIn * fadeOut * smoothstep(0.05, 0.28, speed) * horizonFade;

    vec4 projPos = projectionMatrix * viewPos4;
    gl_Position = projPos;

    // 9. Dynamic Inverted Size Scaling (True Linear Distance from Camera):
    float camDist = max(0.5, -viewPos.z);
    float sizeScale = mix(0.70, 2.10, altFactor);
    float baseSize = aSize * sizeScale * uPixelRatio * (speed * 0.30 + 0.70);
    gl_PointSize = (baseSize * 72.0) / camDist;

    // Zoomed out clamp: [18.0, 28.0] px (bigger than normal size, clearly visible arrows from orbit)
    // Zoomed in clamp:  [8.0, 13.5] px  (sharp, clear, and visible in tactical zoom)
    float minSize = mix(8.0, 18.0, altFactor);
    float maxSize = mix(13.5, 28.0, altFactor);
    gl_PointSize = clamp(gl_PointSize, minSize, maxSize);
  }
`;

const CURRENTS_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vSpeed;
  varying float vFlowAngle;
  varying float vAltFactor;

  void main() {
    // 1. Coordinate frame matching screen-space NDC: +X is Right, +Y is UP
    vec2 pt = vec2(gl_PointCoord.x - 0.5, 0.5 - gl_PointCoord.y);

    // 2. Rotate coordinate so +X is along the flow direction (Arrowhead tip), -X is Tail
    float cosA = cos(vFlowAngle);
    float sinA = sin(vFlowAngle);
    vec2 rotPt = vec2(pt.x * cosA + pt.y * sinA, -pt.x * sinA + pt.y * cosA);

    // 3. Aerodynamic Directional Arrowhead & Streamline Profile (Sleek, Slender Width)
    // rotPt.x in [-0.48, +0.48]: -0.48 is tail, +0.48 is tip
    float s = clamp((rotPt.x + 0.48) / 0.96, 0.0, 1.0);

    // Slender, hydrodynamic arrow profile (dramatically reduced width, narrower head & body)
    float widthScale = mix(0.70, 1.0, vAltFactor);
    float bodyWidth = mix(0.016, 0.038, smoothstep(0.0, 0.65, s)) * widthScale;
    float headWidth = mix(0.135, 0.008, smoothstep(0.68, 1.0, s)) * widthScale;
    float maxWidth = s > 0.68 ? headWidth : bodyWidth;

    float distY = abs(rotPt.y);
    if (distY > maxWidth || rotPt.x < -0.48 || rotPt.x > 0.48) {
      discard;
    }

    // Anti-aliased outer edge
    float edgeAlpha = smoothstep(maxWidth, maxWidth * 0.25, distY);

    // Glowing aerodynamic central spine (sharper, luminous core)
    float spineGlow = exp(-distY * distY * 200.0);

    // Luminous arrowhead tip highlight
    float tipGlow = smoothstep(0.60, 0.98, s);

    float intensity = clamp(edgeAlpha * 0.75 + spineGlow * 0.85 + tipGlow * 0.50, 0.0, 1.0);

    // 4. Vibrant Color: Electric Cyan (#00d4ff) -> Vivid Amber/Gold (#fbbf24) by velocity
    vec3 color = mix(uColorLow, uColorHigh, smoothstep(0.35, 0.85, vSpeed));
    color += vec3(0.18, 0.32, 0.45) * spineGlow;

    float alpha = intensity * vAlpha * uOpacity;
    if (alpha < 0.02) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── 3. Three.js Factory: createCurrentsLayer ────────────────────────────────
export interface CurrentsLayerInstance {
  mesh: THREE.Points;
  material: THREE.ShaderMaterial;
  geometry: THREE.BufferGeometry;
  dataTexture: THREE.DataTexture;
  update: (time: number, altitude?: number) => void;
  dispose: () => void;
}

/**
 * Creates the high-performance GPU-accelerated CurrentsLayer instance.
 * Features:
 * - Slender, hydrodynamic arrow width profile (narrow head & body)
 * - Dynamic zoom LOD scaling:
 *   * Zoomed out: very few particles (only ~3.5% active), larger bold arrows, perfectly uniform.
 *   * Zoomed in: progressive increase in particle numbers (all 36k active), slender delicate arrows.
 * - Zero rectangular boundaries: uses smooth continuous Gaussian dispersion for regional coastal focus.
 */
export function createCurrentsLayer(
  globeRadius: number,
  particleCount = 36000
): CurrentsLayerInstance {
  // 1. Generate Hydrodynamic Velocity DataTexture with smooth blending
  const dataTexture = generateVelocityDataTexture(512, 256);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const initialPositions = new Float32Array(particleCount * 3);
  const life = new Float32Array(particleCount);
  const speed = new Float32Array(particleCount);
  const size = new Float32Array(particleCount);
  const lodThreshold = new Float32Array(particleCount);

  // Helper matching ThreeGlobe latLonToVec3 geodetic coordinate convention
  const geodeticPoint = (latDeg: number, lonDeg: number, r: number): [number, number, number] => {
    const phi = (90.0 - latDeg) * (Math.PI / 180.0);
    const theta = (lonDeg + 180.0) * (Math.PI / 180.0);
    return [
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    ];
  };

  const countGlobal = Math.floor(particleCount * 0.38); // 13,680 uniform global particles
  const countRegional = particleCount - countGlobal;     // 22,320 smooth Gaussian regional particles

  for (let i = 0; i < particleCount; i++) {
    let lat = 0;
    let lon = 0;
    let attempts = 0;

    if (i < countGlobal) {
      // 1. Global Uniform Ocean Sampling (Zero bias, whole planet)
      do {
        lon = Math.random() * 360.0 - 180.0;
        lat = Math.asin(Math.random() * 2.0 - 1.0) * (180.0 / Math.PI);
        attempts++;
      } while (!isOceanCoordinate(lat, lon) && attempts < 40);

      // Global LOD thresholds span [0.0, 0.40] so baseline arrows remain visible at all zoom levels
      lodThreshold[i] = (i / countGlobal) * 0.40;
    } else {
      // 2. Smooth Gaussian Marine Focus (Arabian Sea, Bay of Bengal, Indian Ocean)
      // Continuous 2D Gaussian dispersion with ZERO rectangular boundaries or seams!
      const regionalIdx = i - countGlobal;
      do {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        const z1 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);

        lat = 13.5 + z0 * 12.0;
        lon = 73.5 + z1 * 18.0;
        attempts++;
      } while (!isOceanCoordinate(lat, lon) && attempts < 45);

      // Regional LOD thresholds span [0.045, 1.0]
      // Completely culled when zoomed out in orbit (visibleRatio <= 0.035),
      // then progressively activate as the user zooms into the marine region!
      lodThreshold[i] = 0.045 + (regionalIdx / countRegional) * 0.955;
    }

    const [x, y, z] = geodeticPoint(lat, lon, globeRadius);

    const idx = i * 3;
    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;

    initialPositions[idx] = x;
    initialPositions[idx + 1] = y;
    initialPositions[idx + 2] = z;

    life[i] = Math.random();
    speed[i] = 0.75 + Math.random() * 0.50;
    size[i] = 2.0 + Math.random() * 2.0;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aInitialPosition", new THREE.BufferAttribute(initialPositions, 3));
  geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geometry.setAttribute("aLodThreshold", new THREE.BufferAttribute(lodThreshold, 1));

  // 3. Custom GPGPU ShaderMaterial
  const material = new THREE.ShaderMaterial({
    vertexShader: CURRENTS_VERTEX_SHADER,
    fragmentShader: CURRENTS_FRAGMENT_SHADER,
    uniforms: {
      uVelocityTexture: { value: dataTexture },
      uTime: { value: 0.0 },
      uGlobeRadius: { value: globeRadius },
      uFlowSpeed: { value: 0.024 }, // Calm, graceful hydrodynamic flow
      uFlowDistance: { value: 1.6 }, // Sleek streamline length
      uAltitude: { value: 70.0 }, // Dynamic zoom LOD scaling
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2.0) : 1.0 },
      uColorLow: { value: new THREE.Color(0x00d4ff) }, // Electric Cyan (#00d4ff)
      uColorHigh: { value: new THREE.Color(0xfbbf24) }, // Luminous Golden Amber (#fbbf24)
      uOpacity: { value: 0.85 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -4.0,
  });

  const mesh = new THREE.Points(geometry, material);
  mesh.renderOrder = 17; // On top of base sphere & rasters, beneath vector coastlines (20)

  return {
    mesh,
    material,
    geometry,
    dataTexture,
    update: (time: number, altitude = 70.0) => {
      material.uniforms.uTime.value = time;
      material.uniforms.uAltitude.value = Math.max(0.01, altitude);
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      dataTexture.dispose();
    },
  };
}

// ── 4. React Component (for R3F usage) ───────────────────────────────────────
export interface CurrentsLayerProps {
  radius?: number;
  particleCount?: number;
  visible?: boolean;
}

export default function CurrentsLayer({
  radius = 66,
  particleCount = 56000,
}: CurrentsLayerProps) {
  const layerRef = useRef<CurrentsLayerInstance | null>(null);

  useEffect(() => {
    const layer = createCurrentsLayer(radius, particleCount);
    layerRef.current = layer;

    return () => {
      layer.dispose();
    };
  }, [radius, particleCount]);

  return null;
}
