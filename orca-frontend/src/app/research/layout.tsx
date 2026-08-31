"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  BarChart2,
  FileText,
  Settings,
  Database,
  Search,
  ArrowLeft,
  Activity,
  Radio,
  Cpu,
  Layers,
} from "lucide-react";

interface ResearchLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  {
    href: "/research/map",
    label: "Spatial Canvas",
    icon: Map,
    badge: "2D/3D",
  },
  {
    href: "/research/data",
    label: "Telemetry Hub",
    icon: BarChart2,
    badge: "NetCDF4",
  },
  {
    href: "/research/reports",
    label: "Synthesis Studio",
    icon: FileText,
    badge: "Scholar LLM",
  },
];

export default function ResearchLayout({ children }: ResearchLayoutProps) {
  const pathname = usePathname();
  const isMapRoute = pathname === "/research/map";

  return (
    <div className="flex h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans select-none">
      {/* ─── LEFT PERSISTENT SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-16 md:w-64 shrink-0 bg-[#0c1220] border-r border-slate-800 flex flex-col justify-between z-30">
        <div>
          {/* Header Brand */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-[#090d16]/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
                🔬
              </div>
              <div className="hidden md:block">
                <div className="font-mono font-bold text-sm text-cyan-300 tracking-wider">
                  ORCA_LAB
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Samudra-Vigyan R&D
                </div>
              </div>
            </div>
            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              CMFRI / INCOIS
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1.5">
            <div className="hidden md:block px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Research Portals
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-950/40 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-cyan-400" : "text-slate-400"
                      }`}
                    />
                    <span className="hidden md:inline">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`hidden md:inline text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-cyan-400/20 text-cyan-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-slate-800 bg-[#090d16]/50 space-y-1">
          <Link
            href="/dashboard?role=researcher"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
            title="Return to Master Dashboard"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="hidden md:inline">Master Dashboard</span>
          </Link>
          <div className="hidden md:flex items-center justify-between px-3 py-1 text-[10px] font-mono text-slate-400">
            <span>Grid Res: 0.083°</span>
            <span className="text-emerald-400">● Live Feed</span>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#090d16]">
        {/* Conditional Top Bar: Hidden on Full-Screen Spatial Map */}
        {!isMapRoute && (
          <header className="h-14 shrink-0 border-b border-slate-800 bg-[#0c1220]/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
            {/* Search Input */}
            <div className="flex items-center gap-3 w-72 md:w-96 bg-[#090d16] border border-slate-800 rounded-xl px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search oceanographic datasets, taxa, NetCDF variables..."
                className="bg-transparent text-xs text-slate-200 placeholder-slate-400 focus:outline-none w-full font-mono"
              />
            </div>

            {/* Live Data Ingestion Indicators */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>NASA GIBS: LIVE</span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Activity className="h-3 w-3" />
                <span>CMEMS OSTIA: SYNCED</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                <Database className="h-3 w-3 text-amber-400" />
                <span>Sentinel-3: 100%</span>
              </div>
            </div>
          </header>
        )}

        {/* Route Page Container */}
        <main className="flex-1 w-full h-full min-h-0 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
