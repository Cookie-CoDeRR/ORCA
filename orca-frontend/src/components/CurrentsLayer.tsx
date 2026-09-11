"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

// ── 1. GPGPU Data Simulation: Velocity DataTexture Generator ────────────────
/**
 * Generates a 512x256 Float/Byte DataTexture simulating global hydrodynamic ocean currents.
 * Encodes horizontal eastward u-velocity into R, vertical northward v-velocity into G,
 * and speed magnitude into B using authentic oceanographic circulation models:
 * - West India Coastal Current (WICC): Southward flow along Gujarat, Maharashtra, Goa, Karnataka, Kerala shelf.
 * - Somali Jet & Central Arabian Sea: Northeastward flow toward Saurashtra.
 * - Somali Western Boundary Current: Strong northward boundary jet along East Africa.
 * - Indian Ocean Monsoon Drift / Equatorial Jet: Fast eastward drift south of Sri Lanka.
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
        u += 1.4;
      }

      // ── Authentic Regional Ocean Circulation: Arabian Sea & Bay of Bengal ──
      // 1. West India Coastal Current (WICC):
      // During Southwest Monsoon, coastal current flows SOUTHWARD along the Indian shelf [67.5°E - 76.5°E, 7.5°N - 23.5°N]
      if (lonDeg >= 67.5 && lonDeg <= 76.5 && latDeg >= 7.5 && latDeg <= 23.5) {
        // Southward along-shore current with slight eastward onshore contour following
        const shelfFactor = Math.sin(((lonDeg - 67.5) / 9.0) * Math.PI);
        u = 0.08 * shelfFactor;
        v = -1.15 * shelfFactor - 0.25;
      }
      // 2. Somali Jet & Central Arabian Sea Basin:
      // Northeastward drift across open Arabian Sea towards Gujarat [48°E - 67.5°E, 4°N - 19°N]
      else if (lonDeg >= 48.0 && lonDeg < 67.5 && latDeg >= 4.0 && latDeg <= 19.0) {
        u = 0.95;
        v = 0.55;
      }
      // 3. Somali Western Boundary Current & Great Whirl:
      // High-velocity northward jet along Horn of Africa [42°E - 52°E, 0°N - 12°N]
      else if (lonDeg >= 42.0 && lonDeg <= 52.0 && latDeg >= 0.0 && latDeg <= 12.0) {
        u = 0.45;
        v = 1.35;
      }
      // 4. Equatorial Southwest Monsoon Current (South of Sri Lanka & Maldives):
      // Rapid eastward flow into Bay of Bengal [66°E - 96°E, 1°N - 7.5°N]
      else if (lonDeg >= 66.0 && lonDeg <= 96.0 && latDeg >= 1.0 && latDeg <= 7.5) {
        u = 1.10;
        v = 0.08;
      }
      // 5. East India Coastal Current (EICC):
      // Northward western boundary flow along Bay of Bengal [80°E - 87.5°E, 9.5°N - 22.5°N]
      else if (lonDeg >= 80.0 && lonDeg <= 87.5 && latDeg >= 9.5 && latDeg <= 22.5) {
        u = 0.22;
        v = 0.95;
      }
      // 6. Central Bay of Bengal Anticyclonic Circulation:
      else if (lonDeg >= 85.0 && lonDeg <= 95.0 && latDeg >= 8.0 && latDeg <= 19.0) {
        const dLon = (lonDeg - 90.0) * 0.15;
        const dLat = (latDeg - 13.5) * 0.15;
        u += -dLat * 1.2;
        v += dLon * 1.2;
      }

      // Attenuate flow at extreme high latitudes (near poles)
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

  varying float vAlpha;
  varying float vSpeed;
  varying float vFlowAngle;

  const float PI = 3.14159265358979323846;

  void main() {
    // 1. Progressive zoom scaling:
    // When zooming in (uAltitude drops from 80 to 0.02), travel span scales down
    // so arrows remain delicate, clear, and perfectly proportioned inside local mesh cells.
    float altRatio = clamp(uAltitude / 65.0, 0.02, 1.0);
    float zoomSpeed = mix(1.35, 1.0, altRatio);
    float progress = fract(aLife + uTime * uFlowSpeed * zoomSpeed * aSpeed);

    vec3 normalVec = normalize(aInitialPosition);

    // 2. Exact Geodetic Equirectangular UV mapping matching latLonToVec3:
    // normalVec.y = sin(latRad), atan(-pos.z, pos.x) = lonRad
    float latRad = asin(clamp(normalVec.y, -1.0, 1.0));
    float lonRad = atan(-aInitialPosition.z, aInitialPosition.x);
    vec2 uv = vec2(lonRad / (2.0 * PI) + 0.5, latRad / PI + 0.5);

    // 3. Sample velocity DataTexture: Red = u (east), Green = v (north), Blue = speed
    vec4 velSample = texture2D(uVelocityTexture, uv);
    vec2 vel = (velSample.rg * 2.0 - 1.0);
    float speed = velSample.b;
    vSpeed = speed;

    // 4. Exact Spherical Surface Tangent Coordinate Frame
    // East vector is along increasing lon: d(pos)/d(lon) = (pos.z, 0, -pos.x)
    vec3 eastVec = vec3(normalVec.z, 0.0, -normalVec.x);
    if (length(eastVec) < 0.0001) {
      eastVec = vec3(0.0, 0.0, -1.0);
    } else {
      eastVec = normalize(eastVec);
    }
    // North vector is along increasing lat towards +Y
    vec3 northVec = normalize(cross(normalVec, eastVec));

    // Surface velocity on 3D sphere
    vec3 surfaceVel = eastVec * vel.x + northVec * vel.y;

    // 5. Position Advection: smoothly advected along the flow streamlines
    float localDistance = uFlowDistance * mix(0.14, 1.0, altRatio);
    float travel = progress * localDistance * max(0.28, speed);
    vec3 advectedPos = aInitialPosition + surfaceVel * travel;

    // Re-project onto globe surface hovering smoothly above terrain (+0.09 units)
    vec3 finalSpherePos = normalize(advectedPos) * (uGlobeRadius + 0.09);

    // 6. Post-Perspective NDC Screen Direction for flawless arrowhead alignment
    vec4 projPos = projectionMatrix * modelViewMatrix * vec4(finalSpherePos, 1.0);
    vec4 projAhead = projectionMatrix * modelViewMatrix * vec4(finalSpherePos + surfaceVel * 0.25, 1.0);
    vec2 screenDir = (projAhead.xy / max(0.001, projAhead.w)) - (projPos.xy / max(0.001, projPos.w));
    vFlowAngle = atan(screenDir.y, screenDir.x);

    // 7. Smooth Fade-In and Fade-Out (Continuous loop without popping)
    float fadeIn = smoothstep(0.0, 0.18, progress);
    float fadeOut = 1.0 - smoothstep(0.72, 1.0, progress);
    vAlpha = fadeIn * fadeOut * smoothstep(0.05, 0.28, speed);

    gl_Position = projPos;

    // 8. Progressive point size: delicate and crisp at small scales, bold at global overview
    float sizeScale = mix(0.68, 1.0, altRatio);
    float baseSize = aSize * sizeScale * uPixelRatio * (speed * 0.40 + 0.80);
    gl_PointSize = (baseSize * 110.0) / max(0.55, -projPos.z);
    gl_PointSize = clamp(gl_PointSize, 5.0, 28.0);
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

  void main() {
    // 1. Coordinate frame matching screen-space NDC: +X is Right, +Y is UP
    vec2 pt = vec2(gl_PointCoord.x - 0.5, 0.5 - gl_PointCoord.y);

    // 2. Rotate coordinate so +X is along the flow direction (Arrowhead tip), -X is Tail
    float cosA = cos(vFlowAngle);
    float sinA = sin(vFlowAngle);
    vec2 rotPt = vec2(pt.x * cosA + pt.y * sinA, -pt.x * sinA + pt.y * cosA);

    // 3. Aerodynamic Directional Arrowhead & Streamline Profile
    // rotPt.x in [-0.48, +0.48]: -0.48 is tail, +0.48 is tip
    float s = clamp((rotPt.x + 0.48) / 0.96, 0.0, 1.0);

    // Boundary width: sleek tapered tail (s: 0.0 - 0.65), arrowhead flare (s: 0.65 - 0.72), pointed tip (s: 1.0)
    float bodyWidth = mix(0.06, 0.14, smoothstep(0.0, 0.65, s));
    float headWidth = mix(0.36, 0.02, smoothstep(0.68, 1.0, s));
    float maxWidth = s > 0.68 ? headWidth : bodyWidth;

    float distY = abs(rotPt.y);
    if (distY > maxWidth || rotPt.x < -0.48 || rotPt.x > 0.48) {
      discard;
    }

    // Anti-aliased outer edge
    float edgeAlpha = smoothstep(maxWidth, maxWidth * 0.35, distY);

    // Glowing aerodynamic central spine
    float spineGlow = exp(-distY * distY * 65.0);

    // Luminous arrowhead tip highlight
    float tipGlow = smoothstep(0.55, 0.98, s);

    float intensity = clamp(edgeAlpha * 0.75 + spineGlow * 0.85 + tipGlow * 0.50, 0.0, 1.0);

    // 4. Vibrant Color: Electric Cyan (#00f0ff) -> Vivid Amber/Gold (#ffd166) by velocity
    vec3 color = mix(uColorLow, uColorHigh, smoothstep(0.32, 0.85, vSpeed));
    color += vec3(0.20, 0.35, 0.45) * spineGlow;

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
 * Features 3-tier particle scattering:
 * - Tier 1: Global oceans (20,000)
 * - Tier 2: Indian Ocean & Arabian Sea basin [45°E - 105°E, -10°S - 28°N] (20,000)
 * - Tier 3: Dense Indian EEZ, shelf, and coastal zone [66°E - 88°E, 6°N - 24°N] (18,000)
 * Total ~58,000 particles guarantees dozens of crisp, active arrows are always visible at any zoom!
 */
export function createCurrentsLayer(
  globeRadius: number,
  particleCount = 58000
): CurrentsLayerInstance {
  // 1. Generate Hydrodynamic Velocity DataTexture
  const dataTexture = generateVelocityDataTexture(512, 256);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const initialPositions = new Float32Array(particleCount * 3);
  const life = new Float32Array(particleCount);
  const speed = new Float32Array(particleCount);
  const size = new Float32Array(particleCount);

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

  const countTier1 = Math.floor(particleCount * 0.35); // Global
  const countTier2 = Math.floor(particleCount * 0.35); // Indian Ocean Basin
  const countTier3 = particleCount - countTier1 - countTier2; // Dense Indian Shelf & EEZ

  for (let i = 0; i < particleCount; i++) {
    let lat = 0;
    let lon = 0;

    if (i < countTier1) {
      // Tier 1: Uniform global spherical sampling
      lon = Math.random() * 360.0 - 180.0;
      lat = Math.asin(Math.random() * 2.0 - 1.0) * (180.0 / Math.PI);
    } else if (i < countTier1 + countTier2) {
      // Tier 2: Indian Ocean / Arabian Sea / Bay of Bengal basin [45°E - 105°E, -12°S - 27°N]
      lon = 45.0 + Math.random() * 60.0;
      lat = -12.0 + Math.random() * 39.0;
    } else {
      // Tier 3: High-density Indian EEZ, shelf, and coastal waters [66°E - 88°E, 6°N - 24°N]
      lon = 66.0 + Math.random() * 22.0;
      lat = 6.0 + Math.random() * 18.0;
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
    size[i] = 2.4 + Math.random() * 2.4;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aInitialPosition", new THREE.BufferAttribute(initialPositions, 3));
  geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

  // 3. Custom GPGPU ShaderMaterial
  const material = new THREE.ShaderMaterial({
    vertexShader: CURRENTS_VERTEX_SHADER,
    fragmentShader: CURRENTS_FRAGMENT_SHADER,
    uniforms: {
      uVelocityTexture: { value: dataTexture },
      uTime: { value: 0.0 },
      uGlobeRadius: { value: globeRadius },
      uFlowSpeed: { value: 0.040 }, // Active, hypnotic hydrodynamic flow
      uFlowDistance: { value: 3.4 }, // Arc travel span at global overview
      uAltitude: { value: 70.0 }, // Dynamic zoom LOD scaling
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2.0) : 1.0 },
      uColorLow: { value: new THREE.Color(0x00f0ff) }, // Electric Cyan (#00f0ff)
      uColorHigh: { value: new THREE.Color(0xffd166) }, // Luminous Golden Amber (#ffd166)
      uOpacity: { value: 0.95 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
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
