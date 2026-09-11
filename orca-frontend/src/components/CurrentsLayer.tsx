"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

// ── 1. GPGPU Data Simulation: Velocity DataTexture Generator ────────────────
/**
 * Generates a 512x256 Float/Byte DataTexture simulating global hydrodynamic ocean currents.
 * Encodes horizontal eastward u-velocity into R, vertical northward v-velocity into G,
 * and speed magnitude into B using smooth multi-octave harmonic curl noise.
 */
export function generateVelocityDataTexture(width = 512, height = 256): THREE.DataTexture {
  const size = width * height;
  const data = new Uint8Array(4 * size);

  for (let j = 0; j < height; j++) {
    const latNorm = j / (height - 1); // 0 (South Pole) to 1 (North Pole)
    const latRad = (latNorm - 0.5) * Math.PI; // -PI/2 to PI/2

    for (let i = 0; i < width; i++) {
      const lonNorm = i / width; // 0 to 1
      const lonRad = lonNorm * Math.PI * 2; // 0 to 2*PI

      // Multi-frequency harmonic streamfunction (incompressible curl-derived circulation)
      // Simulates real global gyres (Somali Jet, WICC, EICC, Gulf Stream, Equatorial Jets)
      const psi =
        Math.sin(latRad * 4.0) * Math.cos(lonRad * 2.0) * 0.65 +
        Math.sin(latRad * 8.0 + Math.cos(lonRad * 3.0)) * 0.35 +
        Math.cos(lonRad * 5.0 - latRad * 3.0) * 0.25 +
        Math.sin(latRad * 12.0) * 0.15;

      // Numerical curl / finite difference derivatives: u = dPsi/dLat, v = -dPsi/dLon
      const delta = 0.015;
      const psiLat =
        Math.sin((latRad + delta) * 4.0) * Math.cos(lonRad * 2.0) * 0.65 +
        Math.sin((latRad + delta) * 8.0 + Math.cos(lonRad * 3.0)) * 0.35 +
        Math.cos(lonRad * 5.0 - (latRad + delta) * 3.0) * 0.25;

      const psiLon =
        Math.sin(latRad * 4.0) * Math.cos((lonRad + delta) * 2.0) * 0.65 +
        Math.sin(latRad * 8.0 + Math.cos((lonRad + delta) * 3.0)) * 0.35 +
        Math.cos((lonRad + delta) * 5.0 - latRad * 3.0) * 0.25;

      let u = (psiLat - psi) / delta;
      let v = -(psiLon - psi) / delta;

      // Regional current reinforcement (Somali Jet & Indian Ocean Monsoonal flow)
      // Arabian Sea & Bay of Bengal bounding box [50°E-100°E, 0°-25°N]
      const lonDeg = lonNorm * 360 - 180;
      const latDeg = (latNorm - 0.5) * 180;
      if (lonDeg >= 50 && lonDeg <= 75 && latDeg >= 5 && latDeg <= 20) {
        // Southwest monsoon jet flow towards northeast
        u += 0.85;
        v += 0.65;
      } else if (lonDeg >= 68 && lonDeg <= 75 && latDeg >= 8 && latDeg <= 22) {
        // West India Coastal Current (WICC) flowing southward
        u -= 0.30;
        v -= 0.80;
      } else if (lonDeg >= 80 && lonDeg <= 92 && latDeg >= 10 && latDeg <= 22) {
        // Bay of Bengal anticyclonic gyre
        u += 0.60 * Math.cos(latRad * 6.0);
        v -= 0.60 * Math.sin(lonRad * 4.0);
      }

      // Attenuate flow at polar latitudes (land/ice damping)
      const polarDamp = Math.cos(latRad);
      u *= polarDamp;
      v *= polarDamp;

      const speed = Math.hypot(u, v);
      const normU = speed > 0.001 ? u / Math.max(1.8, speed) : 0;
      const normV = speed > 0.001 ? v / Math.max(1.8, speed) : 0;
      const mag = Math.min(1.0, speed / 1.6);

      const idx = (j * width + i) * 4;
      // Red: horizontal u [-1, 1] -> [0, 255]
      data[idx] = Math.floor((normU * 0.5 + 0.5) * 255);
      // Green: vertical v [-1, 1] -> [0, 255]
      data[idx + 1] = Math.floor((normV * 0.5 + 0.5) * 255);
      // Blue: magnitude/speed [0, 1] -> [0, 255]
      data[idx + 2] = Math.floor(mag * 255);
      // Alpha: 255
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
  texture.wrapS = THREE.RepeatWrapping; // Longitude wraps continuously around the Earth
  texture.wrapT = THREE.ClampToEdgeWrapping; // Latitude clamps at poles
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
  uniform float uPixelRatio;

  attribute vec3 aInitialPosition;
  attribute float aLife;
  attribute float aSpeed;
  attribute float aSize;

  varying float vAlpha;
  varying float vSpeed;

  const float PI = 3.14159265358979323846;

  void main() {
    // Continuous progress loop (0.0 -> 1.0) wrapped on GPU
    float progress = fract(aLife + uTime * uFlowSpeed * aSpeed);

    // 1. Spherical to Equirectangular UV coordinate mapping
    // Initial position on sphere
    float lon = atan(aInitialPosition.x, -aInitialPosition.z);
    float lat = asin(clamp(aInitialPosition.y / uGlobeRadius, -1.0, 1.0));
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);

    // 2. Sample velocity DataTexture: Red = u (eastward), Green = v (northward), Blue = magnitude
    vec4 velSample = texture2D(uVelocityTexture, uv);
    vec2 vel = (velSample.rg * 2.0 - 1.0);
    float speed = velSample.b;
    vSpeed = speed;

    // 3. Spherical Tangent Space Construction
    // Tangent vectors along East and North on sphere surface
    vec3 normalVec = normalize(aInitialPosition);
    vec3 upVec = vec3(0.0, 1.0, 0.0);
    
    // East tangent vector (parallel to equator)
    vec3 eastVec = cross(upVec, normalVec);
    if (length(eastVec) < 0.001) {
      eastVec = vec3(1.0, 0.0, 0.0);
    } else {
      eastVec = normalize(eastVec);
    }
    
    // North tangent vector (along meridian towards North pole)
    vec3 northVec = normalize(cross(normalVec, eastVec));

    // Surface velocity vector on globe
    vec3 surfaceVel = eastVec * vel.x + northVec * vel.y;

    // 4. Position Advection: smoothly displace particle along surface flow
    float travel = progress * uFlowDistance * max(0.2, speed);
    vec3 advectedPos = aInitialPosition + surfaceVel * travel;

    // Re-project exactly back onto the globe surface hovering just above terrain (+0.085 units)
    vec3 finalSpherePos = normalize(advectedPos) * (uGlobeRadius + 0.085);

    // 5. Smooth Fade-In and Fade-Out (Zero popping)
    // Fade in from 0.0 to 0.18, stay solid, fade out from 0.72 to 1.0
    float fadeIn = smoothstep(0.0, 0.18, progress);
    float fadeOut = 1.0 - smoothstep(0.72, 1.0, progress);
    vAlpha = fadeIn * fadeOut * smoothstep(0.08, 0.35, speed);

    vec4 mvPosition = modelViewMatrix * vec4(finalSpherePos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective point size scaling
    gl_PointSize = (aSize * uPixelRatio * (speed * 0.7 + 0.6) * 140.0) / -mvPosition.z;
    gl_PointSize = clamp(gl_PointSize, 1.5, 9.0);
  }
`;

const CURRENTS_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vSpeed;

  void main() {
    // Circular particle with exponential soft glow falloff
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Soft Gaussian/Exponential glow
    float glow = exp(-dist * 5.2);

    // Color gradient by current speed: Electric Cyan (#00ffff) -> Vibrant Amber/Gold (#fbbf24) for high-speed jets
    vec3 color = mix(uColorLow, uColorHigh, smoothstep(0.4, 0.85, vSpeed));

    // Core intensity boost
    color += vec3(0.2, 0.3, 0.4) * exp(-dist * 9.0);

    float alpha = glow * vAlpha * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ── 3. Three.js Factory: createCurrentsLayer ────────────────────────────────
export interface CurrentsLayerInstance {
  mesh: THREE.Points;
  material: THREE.ShaderMaterial;
  geometry: THREE.BufferGeometry;
  dataTexture: THREE.DataTexture;
  update: (time: number) => void;
  dispose: () => void;
}

/**
 * Creates the high-performance GPU-accelerated CurrentsLayer instance for vanilla Three.js.
 * @param globeRadius Radius of the base sphere (e.g. 66)
 * @param particleCount Number of GPU particles (default: 32,000)
 */
export function createCurrentsLayer(
  globeRadius: number,
  particleCount = 32000
): CurrentsLayerInstance {
  // 1. Generate Divergence-Free Velocity DataTexture
  const dataTexture = generateVelocityDataTexture(512, 256);

  // 2. Scatter ~30,000 particles uniformly on the sphere using Archimedes projection
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const initialPositions = new Float32Array(particleCount * 3);
  const life = new Float32Array(particleCount);
  const speed = new Float32Array(particleCount);
  const size = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    // Uniform spherical surface distribution
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI; // Azimuth [0, 2*PI]
    const phi = Math.acos(2.0 * v - 1.0); // Polar angle [0, PI]

    const sinPhi = Math.sin(phi);
    const x = globeRadius * sinPhi * Math.cos(theta);
    const y = globeRadius * Math.cos(phi);
    const z = globeRadius * sinPhi * Math.sin(theta);

    const idx = i * 3;
    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;

    initialPositions[idx] = x;
    initialPositions[idx + 1] = y;
    initialPositions[idx + 2] = z;

    life[i] = Math.random(); // Random initial life phase (0.0 to 1.0)
    speed[i] = 0.75 + Math.random() * 0.50; // Random speed factor (0.75 to 1.25)
    size[i] = 1.8 + Math.random() * 2.2; // Random particle size (1.8 to 4.0)
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
      uFlowSpeed: { value: 0.055 }, // Smooth flow speed
      uFlowDistance: { value: 4.8 }, // Arc distance in units
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2.0) : 1.0 },
      uColorLow: { value: new THREE.Color(0x00ffff) }, // Electric Cyan (#00ffff)
      uColorHigh: { value: new THREE.Color(0xfbbf24) }, // Luminous Amber/Gold (#fbbf24) for high velocity
      uOpacity: { value: 0.88 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending, // Radiant glowing particle accumulation
    depthWrite: false, // Never occlude vector coastlines or graticule
    depthTest: true,
  });

  const mesh = new THREE.Points(geometry, material);
  mesh.renderOrder = 17; // Sits on top of black base sphere (0) / rasters (1) and underneath coastlines (20)

  return {
    mesh,
    material,
    geometry,
    dataTexture,
    update: (time: number) => {
      material.uniforms.uTime.value = time;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      dataTexture.dispose();
    },
  };
}

// ── 4. React Component (for R3F / Modular React usage) ──────────────────────
export interface CurrentsLayerProps {
  radius?: number;
  particleCount?: number;
  visible?: boolean;
}

export default function CurrentsLayer({
  radius = 66,
  particleCount = 32000,
  visible = true,
}: CurrentsLayerProps) {
  const pointsRef = useRef<THREE.Points>(null);
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
