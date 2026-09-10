"use client";

import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import EarthScene from "./EarthScene";

// ─── Dual-layer Starfield ─────────────────────────────────────────────────────
//
// Real astrophotography shows TWO distinct visual phenomena:
//   1. A DENSE HAZE of millions of sub-visible stars creating a continuous
//      luminous background (30 000 tiny, faint, 1 px points)
//   2. A FEW HUNDRED individually visible bright stars (200–800 bright discs
//      with color temperature variation and soft glow)
//
// Single-layer approaches look fake because they either have too many large
// uniform circles (cartoon-y) or too few stars to create the depth effect.

const HAZE_VERT = `
  attribute float aAlpha;
  attribute vec3  aColor;
  varying   float vAlpha;
  varying   vec3  vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    gl_PointSize = 1.0;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const HAZE_FRAG = `
  varying float vAlpha;
  varying vec3  vColor;
  void main() {
    gl_FragColor = vec4(vColor, vAlpha);
  }
`;

const BRIGHT_VERT = `
  attribute float aSize;
  attribute vec3  aColor;
  varying   vec3  vColor;
  void main() {
    vColor = aColor;
    vec4 mv     = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const BRIGHT_FRAG = `
  varying vec3 vColor;
  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float d    = length(uv);
    if (d > 0.5) discard;
    // Soft Gaussian disc — brighter core, smooth falloff
    float core = exp(-d * d * 18.0);
    float halo = exp(-d * d * 5.0) * 0.35;
    float a    = core + halo;
    gl_FragColor = vec4(vColor, a);
  }
`;

function randomSpherePoint(rMin: number, rMax: number) {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const r     = rMin + Math.random() * (rMax - rMin);
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}

function Starfield() {
  const HAZE_N   = 35000;   // dense invisible background — pure depth effect
  const BRIGHT_N =   700;   // individually-visible stars

  const [hazeGeo, hazeMat, brightGeo, brightMat] = useMemo(() => {

    // ── Background haze ──────────────────────────────────────────────────────
    const hPos   = new Float32Array(HAZE_N * 3);
    const hAlpha = new Float32Array(HAZE_N);
    const hCol   = new Float32Array(HAZE_N * 3);

    for (let i = 0; i < HAZE_N; i++) {
      const [x, y, z] = randomSpherePoint(92, 120);
      hPos[i*3] = x; hPos[i*3+1] = y; hPos[i*3+2] = z;

      // Almost all white-blue, tiny alpha — the haze effect
      hAlpha[i] = 0.05 + Math.random() * 0.30;
      const cold = Math.random() > 0.25;
      hCol[i*3]   = cold ? 0.75 + Math.random() * 0.25 : 1.0;
      hCol[i*3+1] = cold ? 0.82 + Math.random() * 0.18 : 0.88;
      hCol[i*3+2] = cold ? 0.95 + Math.random() * 0.05 : 0.72;
    }

    const hGeo = new THREE.BufferGeometry();
    hGeo.setAttribute("position", new THREE.BufferAttribute(hPos,   3));
    hGeo.setAttribute("aAlpha",   new THREE.BufferAttribute(hAlpha, 1));
    hGeo.setAttribute("aColor",   new THREE.BufferAttribute(hCol,   3));

    const hMat = new THREE.ShaderMaterial({
      vertexShader:   HAZE_VERT,
      fragmentShader: HAZE_FRAG,
      transparent:    true,
      depthWrite:     false,
    });

    // ── Bright individual stars ───────────────────────────────────────────────
    const bPos  = new Float32Array(BRIGHT_N * 3);
    const bSize = new Float32Array(BRIGHT_N);
    const bCol  = new Float32Array(BRIGHT_N * 3);

    for (let i = 0; i < BRIGHT_N; i++) {
      const [x, y, z] = randomSpherePoint(92, 120);
      bPos[i*3] = x; bPos[i*3+1] = y; bPos[i*3+2] = z;

      // Power-law size: most are near 1.5 px, very few exceed 4 px
      bSize[i] = Math.pow(Math.random(), 2.2) * 3.8 + 1.3;

      // Stellar classification color temperatures
      const t = Math.random();
      if      (t < 0.04) { bCol[i*3]=0.52; bCol[i*3+1]=0.65; bCol[i*3+2]=1.00; } // O — hot blue
      else if (t < 0.13) { bCol[i*3]=0.78; bCol[i*3+1]=0.88; bCol[i*3+2]=1.00; } // B — blue-white
      else if (t < 0.24) { bCol[i*3]=1.00; bCol[i*3+1]=0.97; bCol[i*3+2]=0.90; } // A/F — white
      else if (t < 0.36) { bCol[i*3]=1.00; bCol[i*3+1]=0.93; bCol[i*3+2]=0.72; } // G — warm yellow
      else if (t < 0.44) { bCol[i*3]=1.00; bCol[i*3+1]=0.65; bCol[i*3+2]=0.40; } // K/M — orange-red
      else               { bCol[i*3]=1.00; bCol[i*3+1]=1.00; bCol[i*3+2]=1.00; } // G — pure white
    }

    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute("position", new THREE.BufferAttribute(bPos,  3));
    bGeo.setAttribute("aSize",    new THREE.BufferAttribute(bSize, 1));
    bGeo.setAttribute("aColor",   new THREE.BufferAttribute(bCol,  3));

    const bMat = new THREE.ShaderMaterial({
      vertexShader:   BRIGHT_VERT,
      fragmentShader: BRIGHT_FRAG,
      transparent:    true,
      depthWrite:     false,
    });

    return [hGeo, hMat, bGeo, bMat];
  }, []);

  return (
    <>
      <points geometry={hazeGeo}   material={hazeMat}   />
      <points geometry={brightGeo} material={brightMat} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Test3DPage() {
  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-black select-none">
      <Canvas
        camera={{ position: [0, 0.2, 4.5], fov: 50 }}
        gl={{
          antialias:           true,
          powerPreference:     "high-performance",
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Starfield />

        {/* Near-zero ambient: deep space is almost pitch black */}
        <ambientLight intensity={0.05} />

        {/* Sun: upper-left — matches uSunDirection in the Earth shader */}
        <directionalLight position={[-7, 5, 3]} intensity={1.5} />

        <Suspense fallback={null}>
          <EarthScene />
        </Suspense>
      </Canvas>
    </main>
  );
}
