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
  Globe2,
  ChevronRight,
  Fish,
  Activity,
  Waves,
  Zap,
  Server,
  Anchor,
  Navigation,
  Eye,
  Sparkles,
  MapPin,
  CheckCircle2,
  TrendingDown,
  FileText,
} from "lucide-react";
import ThreeGlobe from "@/components/ThreeGlobe";
import AgentSwarmVisualizer from "@/components/AgentSwarmVisualizer";
import FuelSimulator from "@/components/FuelSimulator";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#00f0ff", "#38bdf8", "#34d399", "#a855f7"],
    });
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden font-sans">
      {/* Background Decorative Gradients & Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/15 via-blue-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[35%] right-[-5%] w-[600px] h-[600px] bg-emerald-500/10 blur-[160px] rounded-full" />
        <div className="absolute top-[65%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ===================================================================== */}
      {/* 1. TOP NAVIGATION BAR                                                 */}
      {/* ===================================================================== */}
      <nav className="relative z-50 border-b border-slate-800/80 bg-[#060913]/85 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-[1px] flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#09111e] rounded-[11px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-wider text-slate-100">PROJECT ORCA</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SIH26176
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">Sovereign Marine Intelligence</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">
              Subsystems
            </a>
            <a href="#swarm" className="hover:text-cyan-400 transition-colors">
              Agent Swarm
            </a>
            <a href="#simulator" className="hover:text-cyan-400 transition-colors">
              Fuel Economics
            </a>
            <a href="#sovereignty" className="hover:text-cyan-400 transition-colors">
              Air-Gapped Security
            </a>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AIR-GAPPED 100%</span>
            </div>

            <Link
              href="/dashboard"
              onClick={triggerConfetti}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Launch Tactical Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION WITH 3D WEBGL GLOBE                                  */}
      {/* ===================================================================== */}
      <section className="relative z-10 pt-12 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left 7 Columns: Hero Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 text-left space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-inner">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Autonomous Multi-Agent Spatial Intelligence for Coastal Security</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.12]">
              Deterministic Marine Operations. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                Air-Gapped Sovereign AI.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-sans">
              Project ORCA transforms raw oceanographic rasters (SST, Chlorophyll-a, ocean current vectors) into instant maritime advisories, fuel-optimal A* courses, and automated border geofencing — running 100% locally on edge hardware.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                onClick={triggerConfetti}
                className="px-7 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all group cursor-pointer"
              >
                <span>Enter 2.5D / 3D Radar Deck</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <a
                href="#swarm"
                className="px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Inspect Agent Swarm</span>
              </a>
            </div>

            {/* Micro Feature Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Cloud Egress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>&lt;480ms Swarm Latency</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Sub-Meter PostGIS Precision</span>
              </div>
            </div>
          </motion.div>

          {/* Right 5 Columns: 3D Hologram Radar Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            <div className="relative w-full aspect-square max-w-[480px]">
              {/* Floating Badge Above 3D Globe */}
              <div className="absolute top-2 left-2 z-20 px-3 py-1.5 rounded-xl bg-[#09111e]/90 border border-slate-700 backdrop-blur-md text-[11px] font-mono text-cyan-300 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Indian Ocean Radar: ACTIVE</span>
              </div>

              {/* Three.js Interactive 3D Canvas */}
              <ThreeGlobe />
            </div>
          </motion.div>
        </div>

        {/* Quick Telemetry Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono uppercase">
              <Activity className="w-3.5 h-3.5" />
              <span>Fuel Optimization</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1">15% – 22%</p>
            <p className="text-[11px] text-slate-400">Continuous current eddy riding</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>Data Privacy</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1">100% Air-Gapped</p>
            <p className="text-[11px] text-slate-400">Local Qwen 2.5 7B & BGE-M3</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono uppercase">
              <Fish className="w-3.5 h-3.5" />
              <span>PFZ Precision</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1">0.083° Grid</p>
            <p className="text-[11px] text-slate-400">SST + Chl-a front correlation</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>IMBL Standoff</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1">Sub-Meter</p>
            <p className="text-[11px] text-slate-400">Deterministic PostGIS checks</p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. MULTI-AGENT SWARM ARCHITECTURE SECTION                             */}
      {/* ===================================================================== */}
      <section id="swarm" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3 uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous Coordination Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">
            6 Specialized Agents. Zero External Dependencies.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-3">
            Click on any agent node below to inspect its deterministic math formulation, input telemetry, and sub-millisecond execution benchmark.
          </p>
        </div>

        <AgentSwarmVisualizer />
      </section>

      {/* ===================================================================== */}
      {/* 4. REAL-TIME FUEL ECONOMICS SIMULATOR SECTION                         */}
      {/* ===================================================================== */}
      <section id="simulator" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3 uppercase tracking-wider">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Dynamic Vector Physics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">
            Simulate Vessel Fuel & Transit Delta
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-3">
            Adjust the sliders below to calculate live fuel savings, transit time reduction, and cost delta achieved by riding assisting ocean current vectors.
          </p>
        </div>

        <FuelSimulator />
      </section>

      {/* ===================================================================== */}
      {/* 5. OPERATIONAL SUBSYSTEMS (BENTO GRID)                                */}
      {/* ===================================================================== */}
      <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-cyan-400">Core Subsystems</h2>
          <p className="text-3xl sm:text-4xl font-bold text-slate-100 mt-2">
            Engineered for Coastal Defense & Commercial Fleets
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/80 to-[#0c1424]/80 border border-slate-800 hover:border-cyan-500/40 transition-all group shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">2.5D & 3D Bathymetry Radar</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed font-sans">
              GPU-accelerated deck.gl and MapLibre layers rendering 3D underwater contours, dynamic current vectors, and multi-variable fishing hotspots with 60fps responsiveness.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/80 to-[#0c1424]/80 border border-slate-800 hover:border-emerald-500/40 transition-all group shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Dynamic A* Vector Pathing</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed font-sans">
              Calculates navigation routes by factoring in eastward/northward current velocities (uo, vo) and wind drag, delivering real-time fuel delta analytics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/80 to-[#0c1424]/80 border border-slate-800 hover:border-purple-500/40 transition-all group shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Sovereign Geofencing & RAG</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed font-sans">
              PostGIS triggers instant buffer distance alerts to the International Maritime Boundary Line (IMBL) and Marine Protected Areas, backed by pgvector policy RAG.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. SOVEREIGNTY & AIR-GAPPED SECURITY                                  */}
      {/* ===================================================================== */}
      <section id="sovereignty" className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-slate-950 via-[#07111e] to-slate-950 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Lock className="w-3.5 h-3.5" />
              <span>DEFENSE & MARITIME COMPLIANCE</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-100">
              Complete Air-Gapped Sovereign Deployment
            </h3>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-sans">
              All multi-agent reasoning, vector search, and oceanographic calculations run strictly on-premise without relying on external commercial APIs (no OpenAI, no Anthropic egress). Meets Indian Navy and Coast Guard cyber-security protocols.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                onClick={triggerConfetti}
                className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-cyan-500/20 flex items-center space-x-2 cursor-pointer"
              >
                <span>Open Tactical Mission Deck</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. FOOTER                                                             */}
      {/* ===================================================================== */}
      <footer className="relative z-10 border-t border-slate-800/80 py-10 px-6 bg-[#04080e] text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>© 2026 Project ORCA — Marine Intelligence Platform (SIH26176)</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>ISRO / INCOIS / Coast Guard Operational Alignment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
