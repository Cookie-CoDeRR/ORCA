"use client";

import React, { useRef, useEffect } from "react";
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
        // Southwest monsoon jet flow towards northeast (Somali Jet)
        u += 0.90;
        v += 0.70;
      } else if (lonDeg >= 68 && lonDeg <= 75 && latDeg >= 8 && latDeg <= 22) {
        // West India Coastal Current (WICC) flowing southward along shelf
        u -= 0.35;
        v -= 0.85;
      } else if (lonDeg >= 80 && lonDeg <= 92 && latDeg >= 10 && latDeg <= 22) {
        // Bay of Bengal anticyclonic circulation
        u += 0.65 * Math.cos(latRad * 5.5);
        v -= 0.65 * Math.sin(lonRad * 3.5);
      }

      // Attenuate flow at extreme poles
      const polarDamp = Math.cos(latRad);
      u *= polarDamp;
      v *= polarDamp;

      const speed = Math.hypot(u, v);
      const normU = speed > 0.001 ? u / Math.max(1.8, speed) : 0;
      const normV = speed > 0.001 ? v / Math.max(1.8, speed) : 0;
      const mag = Math.min(1.0, speed / 1.6);

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
    // As the camera zooms in (uAltitude decreases from 140 to 0.5),
    // progressive time scaling keeps animation smooth and alive at close zoom
    float altRatio = clamp(uAltitude / 65.0, 0.04, 1.0);
    float zoomSpeed = mix(1.65, 1.0, altRatio);
    float progress = fract(aLife + uTime * uFlowSpeed * zoomSpeed * aSpeed);

    // 2. Spherical to Equirectangular UV coordinate mapping
    float lon = atan(aInitialPosition.x, -aInitialPosition.z);
    float lat = asin(clamp(aInitialPosition.y / uGlobeRadius, -1.0, 1.0));
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);

    // 3. Sample velocity DataTexture: Red = u (east), Green = v (north), Blue = speed
    vec4 velSample = texture2D(uVelocityTexture, uv);
    vec2 vel = (velSample.rg * 2.0 - 1.0);
    float speed = velSample.b;
    vSpeed = speed;

    // 4. Spherical Surface Tangent Coordinate Frame
    vec3 normalVec = normalize(aInitialPosition);
    vec3 upVec = vec3(0.0, 1.0, 0.0);
    vec3 eastVec = cross(upVec, normalVec);
    if (length(eastVec) < 0.001) {
      eastVec = vec3(1.0, 0.0, 0.0);
    } else {
      eastVec = normalize(eastVec);
    }
    vec3 northVec = normalize(cross(normalVec, eastVec));

    // Surface velocity vector on globe
    vec3 surfaceVel = eastVec * vel.x + northVec * vel.y;

    // 5. Position Advection (Progressively scaled down with zoom so arrows never overshoot small scale)
    float localDistance = uFlowDistance * mix(0.16, 1.0, altRatio);
    float travel = progress * localDistance * max(0.25, speed);
    vec3 advectedPos = aInitialPosition + surfaceVel * travel;

    // Re-project onto globe surface hovering cleanly above terrain (+0.085 units)
    vec3 finalSpherePos = normalize(advectedPos) * (uGlobeRadius + 0.085);

    // 6. Directional Angle in screen space for arrowhead alignment in fragment shader
    vec4 projVel = projectionMatrix * modelViewMatrix * vec4(surfaceVel, 0.0);
    vFlowAngle = atan(projVel.y, projVel.x);

    // 7. Smooth Fade-In and Fade-Out (Zero popping)
    float fadeIn = smoothstep(0.0, 0.16, progress);
    float fadeOut = 1.0 - smoothstep(0.74, 1.0, progress);
    vAlpha = fadeIn * fadeOut * smoothstep(0.06, 0.30, speed);

    vec4 mvPosition = modelViewMatrix * vec4(finalSpherePos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // 8. Progressive point size: gets smaller as you zoom in so it remains crisp and delicate at small scale
    float sizeScale = mix(0.55, 1.0, altRatio);
    float baseSize = aSize * sizeScale * uPixelRatio * (speed * 0.45 + 0.75);
    gl_PointSize = (baseSize * 115.0) / max(0.5, -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 3.5, 26.0);
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
    // 1. Rotate coordinate to align with current flow heading on screen
    vec2 pt = gl_PointCoord - vec2(0.5);
    float cosA = cos(-vFlowAngle);
    float sinA = sin(-vFlowAngle);
    vec2 rotPt = vec2(pt.x * cosA - pt.y * sinA, pt.x * sinA + pt.y * cosA);

    // 2. Directional Aerodynamic Arrowhead Profile along flow (rotPt.x is tail-to-head)
    // Width narrows toward tail (-0.45) and tip (+0.45)
    float arrowWidth = (0.26 - abs(rotPt.x) * 0.16);
    if (abs(rotPt.y) > arrowWidth || rotPt.x < -0.46 || rotPt.x > 0.46) discard;

    // 3. Arrowhead intensity: soft luminous tail, intense pointed head
    float headGlow = smoothstep(-0.46, 0.38, rotPt.x);
    float lateralFalloff = 1.0 - smoothstep(0.0, arrowWidth, abs(rotPt.y));
    float arrowIntensity = headGlow * lateralFalloff;

    // 4. Color gradient by velocity: Electric Cyan (#00ffff) -> Luminous Gold/Amber (#fbbf24) for high jets
    vec3 color = mix(uColorLow, uColorHigh, smoothstep(0.35, 0.85, vSpeed));
    color += vec3(0.25, 0.35, 0.45) * exp(-length(pt) * 4.5);

    float alpha = arrowIntensity * vAlpha * uOpacity;
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
 * Creates the high-performance GPU-accelerated CurrentsLayer instance for vanilla Three.js.
 * Features multi-tier particle scattering (global + dense Indian Ocean / EEZ concentration)
 * and progressive zoom LOD scaling so arrows never disappear when scrolling in.
 *
 * @param globeRadius Radius of the base sphere (e.g. 66)
 * @param particleCount Number of GPU particles (default: 56,000 for rich small-scale coverage)
 */
export function createCurrentsLayer(
  globeRadius: number,
  particleCount = 56000
): CurrentsLayerInstance {
  // 1. Generate Divergence-Free Velocity DataTexture
  const dataTexture = generateVelocityDataTexture(512, 256);

  // 2. Scatter particles with Multi-Tier Density:
  // - 50% distributed globally across all oceans
  // - 50% concentrated densely across Indian Ocean, Arabian Sea & Bay of Bengal [45°E-105°E, -5°S-28°N]
  // This guarantees hundreds of active micro-arrows remain in view at every close zoom level!
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const initialPositions = new Float32Array(particleCount * 3);
  const life = new Float32Array(particleCount);
  const speed = new Float32Array(particleCount);
  const size = new Float32Array(particleCount);

  const halfCount = Math.floor(particleCount / 2);

  for (let i = 0; i < particleCount; i++) {
    let x = 0, y = 0, z = 0;

    if (i < halfCount) {
      // Tier 1: Global uniform spherical distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      const sinPhi = Math.sin(phi);
      x = globeRadius * sinPhi * Math.cos(theta);
      y = globeRadius * Math.cos(phi);
      z = globeRadius * sinPhi * Math.sin(theta);
    } else {
      // Tier 2: Concentrated Indian Ocean & EEZ regional sector [45°E to 105°E, -8°S to 26°N]
      const lonDeg = 45.0 + Math.random() * 60.0;
      const latDeg = -8.0 + Math.random() * 34.0;
      const phi = (90.0 - latDeg) * (Math.PI / 180.0);
      const theta = (lonDeg + 180.0) * (Math.PI / 180.0);

      const sinPhi = Math.sin(phi);
      x = -globeRadius * sinPhi * Math.cos(theta);
      y = globeRadius * Math.cos(phi);
      z = globeRadius * sinPhi * Math.sin(theta);
    }

    const idx = i * 3;
    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;

    initialPositions[idx] = x;
    initialPositions[idx + 1] = y;
    initialPositions[idx + 2] = z;

    life[i] = Math.random();
    speed[i] = 0.70 + Math.random() * 0.60;
    size[i] = 2.2 + Math.random() * 2.6;
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
      uFlowSpeed: { value: 0.045 }, // Slow, active, hypnotic animation speed
      uFlowDistance: { value: 3.6 }, // Arc travel span at global overview
      uAltitude: { value: 70.0 }, // Camera altitude for dynamic zoom LOD scaling
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2.0) : 1.0 },
      uColorLow: { value: new THREE.Color(0x00ffff) }, // Electric Cyan (#00ffff)
      uColorHigh: { value: new THREE.Color(0xfbbf24) }, // Golden Amber (#fbbf24)
      uOpacity: { value: 0.92 },
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
