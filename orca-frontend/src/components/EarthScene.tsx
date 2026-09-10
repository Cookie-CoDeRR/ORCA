"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// Fixed artistic sun direction: upper-left
const SUN_DIR = new THREE.Vector3(-0.7, 0.5, 0.3).normalize();

// ─── Earth fragment shader ────────────────────────────────────────────────────
// Improvements over v1:
//   • Normal scale bumped to 3.0 for visible surface detail
//   • Specular exponent: 100 → 400 (tight sun glint, not a soft blob)
//   • Limb darkening: pow(dot(N, viewDir), 0.5) attenuates Earth edges naturally
//   • Terminator color: golden/orange tint at the twilight transition line
//   • City lights: reduce scatter into day side with saturated glow

const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv       = uv;
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_FRAG = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uNormalMap;
  uniform sampler2D uSpecularMap;
  uniform vec3      uSunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    // ── Normal mapping via screen-space derivatives ──────────────────────────
    vec3 Q1  = dFdx(vWorldPos);
    vec3 Q2  = dFdy(vWorldPos);
    vec2 st1 = dFdx(vUv);
    vec2 st2 = dFdy(vUv);
    float det = max(st1.x * st2.y - st2.x * st1.y, 1e-7);
    vec3 T    = normalize((Q1 * st2.y - Q2 * st1.y) / det);
    vec3 N0   = normalize(vNormal);
    vec3 B    = normalize(cross(N0, T));
    mat3 TBN  = mat3(T, B, N0);

    vec3 ns = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
    ns.xy  *= 3.0;                               // strong bump — mountains, trenches visible
    vec3 N  = normalize(TBN * ns);

    // ── Lighting vectors ─────────────────────────────────────────────────────
    vec3 sunDir  = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float dotNL  = dot(N, sunDir);
    float dotNV  = max(0.0, dot(N, viewDir));

    // ── Day/Night blend with golden terminator tint ──────────────────────────
    float dayFactor = smoothstep(-0.08, 0.08, dotNL);   // narrow, crisp terminator

    vec3 dayColor   = texture2D(uDayMap,   vUv).rgb;
    vec3 nightColor = texture2D(uNightMap, vUv).rgb;

    // Lambert shading on day side
    float lambert = max(0.0, dotNL);
    vec3 dayLit   = dayColor * (0.03 + 0.97 * lambert);

    // Terminator golden glow — warm tint at the dawn/dusk boundary
    float terminatorBand = smoothstep(0.0, 1.0,
      1.0 - abs(smoothstep(-0.18, 0.18, dotNL) - 0.5) * 2.0);
    vec3 terminatorColor = vec3(1.0, 0.55, 0.15);
    dayLit = mix(dayLit, dayLit * terminatorColor * 1.8, terminatorBand * 0.35);

    // City lights — bright, saturated, night-side only
    vec3 nightLit = nightColor * 2.8;

    vec3 color = mix(nightLit, dayLit, dayFactor);

    // ── Limb darkening (natural vignette on sphere edges) ────────────────────
    float limbDark = pow(dotNV, 0.35);
    color *= mix(0.35, 1.0, limbDark);

    // ── Ocean specular glint — tight Blinn-Phong ──────────────────────────────
    float oceanMask = texture2D(uSpecularMap, vUv).r;
    vec3  H         = normalize(sunDir + viewDir);
    // Exponent 400: very tight glint — just a sharp star on the water, not a blob
    float spec      = pow(max(0.0, dot(N, H)), 400.0) * oceanMask * dayFactor;
    // Slight second lobe for haze around the glint
    float specHaze  = pow(max(0.0, dot(N, H)), 40.0) * oceanMask * dayFactor * 0.04;
    color += vec3(1.0, 0.97, 0.90) * (spec * 1.2 + specHaze);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Atmosphere shader ────────────────────────────────────────────────────────
// Color gradient: deep blue at zenith → cyan toward horizon → subtle orange near terminator

const ATMOS_VERT = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOS_FRAG = /* glsl */ `
  uniform vec3 uSunDirection;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3  viewDir = normalize(cameraPosition - vWorldPos);
    vec3  N       = normalize(vWorldNormal);
    vec3  sunDir  = normalize(uSunDirection);

    float rim       = 1.0 - abs(dot(N, viewDir));       // 0 at center, 1 at limb
    float intensity = pow(rim, 4.5);

    // Day bias: brighter where the sun hits
    float sunAngle  = dot(N, sunDir);
    float dayBias   = 0.4 + 0.6 * smoothstep(-0.5, 0.5, sunAngle);
    intensity      *= dayBias * 1.15;

    // Color: blue core → cyan at horizon → warm orange tint near terminator
    float terminatorRim = smoothstep(-0.4, 0.3, sunAngle);
    vec3  blueAtm   = mix(vec3(0.15, 0.45, 1.00), vec3(0.35, 0.72, 1.00), rim);
    vec3  warmAtm   = mix(blueAtm, vec3(0.9, 0.45, 0.1), (1.0 - terminatorRim) * 0.45);
    vec3  atmColor  = mix(warmAtm, blueAtm, terminatorRim);

    gl_FragColor = vec4(atmColor * intensity, intensity * 0.9);
  }
`;

// ─── Cloud shader — lit properly by scene light, not additive ────────────────
// The cloud sphere uses MeshStandardMaterial so it responds to the scene
// directional light and shows realistic shadowing on the night side.

const RADIUS = 2.5;

export default function EarthScene() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Upgrade: use 8K normal + 8K clouds for far more surface/cloud detail
  const [dayMap, nightMap, normalMap, specularMap, cloudsMap] = useTexture([
    "/textures/8k_earth_daymap.jpg",
    "/textures/8k_earth_nightmap.jpg",
    "/textures/8k_earth_normal_map.jpg",   // 8K for visible mountain bump detail
    "/textures/8k_earth_specular_map.jpg",
    "/textures/8k_earth_clouds.jpg",       // 8K for defined cloud systems
  ]);

  [dayMap, nightMap, cloudsMap].forEach((t) => {
    t.anisotropy = 16;
    t.colorSpace = THREE.SRGBColorSpace;
  });
  // Normal & specular: linear (data) maps
  normalMap.colorSpace   = THREE.LinearSRGBColorSpace;
  specularMap.colorSpace = THREE.LinearSRGBColorSpace;
  normalMap.anisotropy   = 16;
  specularMap.anisotropy = 16;

  const earthMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uDayMap:       { value: dayMap },
          uNightMap:     { value: nightMap },
          uNormalMap:    { value: normalMap },
          uSpecularMap:  { value: specularMap },
          uSunDirection: { value: SUN_DIR },
        },
        vertexShader:   EARTH_VERT,
        fragmentShader: EARTH_FRAG,
      }),
    [dayMap, nightMap, normalMap, specularMap]
  );

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms:       { uSunDirection: { value: SUN_DIR } },
        vertexShader:   ATMOS_VERT,
        fragmentShader: ATMOS_FRAG,
        side:           THREE.FrontSide,
        blending:       THREE.AdditiveBlending,
        transparent:    true,
        depthWrite:     false,
      }),
    []
  );

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.04;
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.055;
  });

  return (
    <group position={[1.0, -0.65, 0]} rotation={[0.15, 0.4, 0.05]}>

      {/* Earth surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[RADIUS, 128, 128]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>

      {/* Cloud layer — MeshStandardMaterial so clouds are dark on night side */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[RADIUS * 1.010, 96, 96]} />
        <meshStandardMaterial
          map={cloudsMap}
          alphaMap={cloudsMap}
          transparent
          opacity={0.65}
          depthWrite={false}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Atmospheric limb glow */}
      <mesh>
        <sphereGeometry args={[RADIUS * 1.030, 96, 96]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>

    </group>
  );
}
