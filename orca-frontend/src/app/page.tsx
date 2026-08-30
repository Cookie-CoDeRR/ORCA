"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  Compass,
  Cpu,
  Layers,
  Radio,
  ArrowRight,
  Lock,
  ChevronRight,
  Fish,
  Activity,
  Waves,
  Zap,
  CheckCircle2,
  TrendingDown,
  Terminal,
  Globe2,
  Sparkles,
  Sliders,
  Users,
  ShieldAlert,
} from "lucide-react";
import ThreeGlobe from "@/components/ThreeGlobe";
import AgentSwarmVisualizer from "@/components/AgentSwarmVisualizer";
import FuelSimulator from "@/components/FuelSimulator";
import PersonaExplorer from "@/components/PersonaExplorer";
import ParameterMatrix from "@/components/ParameterMatrix";
import AuthModal from "@/components/AuthModal";

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authInitialRole, setAuthInitialRole] = useState<"researcher" | "visitor" | "learner" | "defense" | "navigator">("visitor");

  const openAuthWithRole = (role: "researcher" | "visitor" | "learner" | "defense" | "navigator") => {
    setAuthInitialRole(role);
    setIsAuthOpen(true);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#ffffff", "#d4d4d8", "#71717a", "#a1a1aa"],
    });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden font-sans space-stars relative">
      {/* Auth & Role Gate Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialRole={authInitialRole}
      />

      {/* Deep Space Background Cosmic Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1100px] h-[500px] bg-gradient-to-b from-white/[0.07] via-zinc-500/[0.03] to-transparent blur-[160px] rounded-full" />
        <div className="absolute top-[35%] right-[-5%] w-[600px] h-[600px] bg-white/[0.04] blur-[180px] rounded-full" />
        <div className="absolute top-[65%] left-[-5%] w-[500px] h-[500px] bg-zinc-400/[0.03] blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ===================================================================== */}
      {/* 1. TOP NAVIGATION BAR                                                 */}
      {/* ===================================================================== */}
      <nav className="relative z-40 border-b border-white/10 bg-black/80 backdrop-blur-2xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-wider text-white">ORCA</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
                  SIH26176
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono tracking-tight">Sovereign Marine Intelligence</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-7 text-xs font-semibold text-zinc-300">
            <a href="#personas" className="hover:text-white transition-colors">
              Personas
            </a>
            <a href="#parameters" className="hover:text-white transition-colors">
              Parameters
            </a>
            <a href="#swarm" className="hover:text-white transition-colors">
              Agent Swarm
            </a>
            <a href="#simulator" className="hover:text-white transition-colors">
              Fuel Simulator
            </a>
            <a href="#sovereignty" className="hover:text-white transition-colors">
              Defense Gate
            </a>
          </div>

          <div className="flex items-center space-x-3">
            {/* Defense Restricted Button */}
            <button
              onClick={() => openAuthWithRole("defense")}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono hover:bg-rose-900/60 transition cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>DEFENSE LOGIN</span>
            </button>

            <button
              onClick={() => openAuthWithRole("visitor")}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-white/10 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Access Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION WITH 3D WEBGL GLOBE                                  */}
      {/* ===================================================================== */}
      <section className="relative z-10 pt-14 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left 7 Columns: Hero Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 text-left space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-white/15 text-zinc-200 text-xs font-mono shadow-inner">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Autonomous Multi-Agent Spatial Intelligence for Coastal Security</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Deterministic Marine Operations. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Air-Gapped Sovereign AI.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed font-sans">
              Project ORCA fuses 6 core parameter pillars — weather, sea currents, marine biology, ocean resources, transport logistics, and defense geofencing — running 100% locally on edge hardware.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => {
                  triggerConfetti();
                  openAuthWithRole("visitor");
                }}
                className="px-7 py-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm tracking-wide shadow-2xl shadow-white/20 flex items-center justify-center space-x-2 transition-all group cursor-pointer"
              >
                <span>Enter 2.5D / 3D Radar Deck</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => openAuthWithRole("defense")}
                className="px-6 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-rose-500/30 text-rose-300 hover:text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Defense & Coast Guard Gateway</span>
              </button>
            </div>

            {/* Micro Feature Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Zero Cloud Egress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>&lt;480ms Swarm Latency</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sub-Meter PostGIS Precision</span>
              </div>
            </div>
          </motion.div>

          {/* Right 5 Columns: 3D Hologram Space Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <div className="relative w-full aspect-square max-w-[480px]">
              {/* Floating Badge */}
              <div className="absolute top-2 left-2 z-20 px-3 py-1.5 rounded-xl bg-black/90 border border-white/20 backdrop-blur-md text-[11px] font-mono text-white flex items-center gap-2 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Indian Ocean Radar: ACTIVE</span>
              </div>

              <ThreeGlobe />
            </div>
          </motion.div>
        </div>

        {/* Quick Telemetry Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono uppercase">
              <Activity className="w-3.5 h-3.5 text-white" />
              <span>Fuel Optimization</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5">15% – 22%</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Continuous current eddy riding</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono uppercase">
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>Data Privacy</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5">100% Air-Gapped</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Local Qwen 2.5 7B & BGE-M3</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono uppercase">
              <Fish className="w-3.5 h-3.5 text-white" />
              <span>PFZ Precision</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5">0.083° Grid</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">SST + Chl-a front correlation</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>IMBL Standoff</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5">Sub-Meter</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Deterministic PostGIS checks</p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. TARGETED PERSONAS SECTION (Researcher / Citizen / Learner / etc.) */}
      {/* ===================================================================== */}
      <section id="personas" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <PersonaExplorer onOpenAuth={openAuthWithRole} />
      </section>

      {/* ===================================================================== */}
      {/* 4. 6 CORE PARAMETER PILLARS MATRIX                                   */}
      {/* ===================================================================== */}
      <section id="parameters" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <ParameterMatrix />
      </section>

      {/* ===================================================================== */}
      {/* 5. MULTI-AGENT SWARM ARCHITECTURE SECTION                             */}
      {/* ===================================================================== */}
      <section id="swarm" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/15 text-zinc-300 text-xs font-mono mb-3 uppercase tracking-widest">
            <Cpu className="w-3.5 h-3.5 text-white" />
            <span>Autonomous Coordination Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            6 Specialized Agents. Zero External Dependencies.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mt-3">
            Click on any agent node below to inspect its deterministic math formulation, input telemetry, and sub-millisecond execution benchmark.
          </p>
        </div>

        <AgentSwarmVisualizer />
      </section>

      {/* ===================================================================== */}
      {/* 6. REAL-TIME FUEL ECONOMICS SIMULATOR SECTION                         */}
      {/* ===================================================================== */}
      <section id="simulator" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/15 text-zinc-300 text-xs font-mono mb-3 uppercase tracking-widest">
            <TrendingDown className="w-3.5 h-3.5 text-white" />
            <span>Dynamic Vector Physics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Simulate Vessel Fuel & Transit Delta
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mt-3">
            Adjust the sliders below to calculate live fuel savings, transit time reduction, and cost delta achieved by riding assisting ocean current vectors.
          </p>
        </div>

        <FuelSimulator />
      </section>

      {/* ===================================================================== */}
      {/* 7. DEFENSE & AIR-GAPPED SECURITY SECTION                              */}
      {/* ===================================================================== */}
      <section id="sovereignty" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-white/10">
        <div className="p-8 md:p-12 rounded-3xl bg-zinc-950 border border-rose-500/30 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>DEFENSE & COAST GUARD CLASSIFIED PORTAL</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Classified Standoff Radar & Dark Target Intercept
            </h3>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans">
              Indian Coast Guard and Naval officers can authenticate using authorized government credentials (<code className="text-white">.gov.in</code> / <code className="text-white">.mil.in</code>) or Security Clearance Keys to unlock live hostile drift vectors, border standoff tracking, and electronic surveillance overlays.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => openAuthWithRole("defense")}
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider uppercase transition shadow-xl shadow-rose-950/40 flex items-center space-x-2 cursor-pointer"
              >
                <span>Login to Defense Command Deck</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. FOOTER                                                             */}
      {/* ===================================================================== */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-6 bg-black text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-zinc-400">
            <Compass className="w-4 h-4 text-white" />
            <span>© 2026 Project ORCA — Marine Intelligence Platform (SIH26176)</span>
          </div>
          <div className="flex items-center space-x-4 text-zinc-400">
            <span>ISRO / INCOIS / Coast Guard Operational Alignment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
