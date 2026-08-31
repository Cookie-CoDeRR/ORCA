"use client";

import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck, Database, Radio, ArrowRight, Cpu, Compass } from "lucide-react";

export default function RootPage() {
  return (
    <div className="min-h-screen w-screen bg-[#070b12] text-slate-100 flex flex-col justify-between font-sans select-none p-6 md:p-12">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-lg shadow-lg shadow-cyan-950/50">
            🐬
          </div>
          <div>
            <div className="font-mono font-bold text-base tracking-wider text-slate-100 flex items-center gap-2">
              PROJECT ORCA <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v2.0 Clean Slate</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Maritime Intelligence & Multi-Agent Swarm Gateway
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Backend APIs: Online</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full text-center py-16 space-y-8">
        <div className="space-y-4">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800/50 px-3 py-1.5 rounded-full">
            UI Architecture Reset Complete
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Ready to Build Your New UI
          </h1>
          <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The previous UI has been cleared. All backend REST APIs, WebSocket feeds, NASA satellite tiles, and agent reasoning pipelines are preserved in <code className="text-cyan-300 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded">ORCA_API_AND_INTEGRATION_REGISTRY.md</code>.
          </p>
        </div>

        {/* System Subsystems Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left font-mono">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs">
              <Cpu className="h-4 w-4" />
              <span>Multi-Agent Swarm</span>
            </div>
            <div className="text-[11px] text-slate-400">4 Worker Nodes + LangGraph Checkpointer</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <Radio className="h-4 w-4" />
              <span>AIS Live Traffic</span>
            </div>
            <div className="text-[11px] text-slate-400">AISStream.io + Dynamic COLREGs Engine</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 text-xs">
              <Database className="h-4 w-4" />
              <span>NASA GIBS Raster</span>
            </div>
            <div className="text-[11px] text-slate-400">WMTS GHRSST L4 Sea Surface Temp</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Sovereign Geofence</span>
            </div>
            <div className="text-[11px] text-slate-400">PostGIS IMBL & Marine Sanctuary Standoff</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20 cursor-pointer font-mono"
          >
            <span>Open Clean Canvas</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center font-mono text-xs text-slate-400 border-t border-slate-800/80 pt-6 max-w-6xl mx-auto w-full">
        Project ORCA • Ready for new UI design and component integration
      </footer>
    </div>
  );
}
