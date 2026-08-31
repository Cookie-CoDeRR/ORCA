"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Radio, Cpu, Layers, Fish, ShieldAlert, Sparkles } from "lucide-react";

export default function CleanDashboardPage() {
  return (
    <div className="h-screen w-screen bg-[#090d16] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Minimal Clean Header */}
      <header className="h-14 border-b border-slate-800 bg-[#0c1220] px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4 text-cyan-400" />
            <span>Home</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="font-mono font-bold text-sm text-cyan-300">
            ORCA_CANVAS
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Clean Canvas Ready
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <Link
            href="/research/map"
            className="text-slate-400 hover:text-cyan-300 transition"
          >
            Researcher Portal →
          </Link>
        </div>
      </header>

      {/* Canvas Area Placeholder */}
      <main className="flex-1 flex items-center justify-center p-8 bg-[#070b12] relative">
        <div className="max-w-md w-full border border-slate-800 rounded-2xl p-8 bg-[#0c1220]/80 backdrop-blur-xl text-center space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto text-xl">
            🎨
          </div>
          <h2 className="text-lg font-bold font-mono text-white">Clean Canvas Ready</h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Old UI layers, graphs, and bloated sidebars have been removed. Ready to implement the new layout and components per your instructions.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-500">
            All API contracts preserved in <code className="text-cyan-400">ORCA_API_AND_INTEGRATION_REGISTRY.md</code>
          </div>
        </div>
      </main>
    </div>
  );
}
