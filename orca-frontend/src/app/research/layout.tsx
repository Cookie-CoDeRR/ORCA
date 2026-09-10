"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  BarChart3,
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
  },
  {
    href: "/research/data",
    label: "Ocean Data Catalog",
    icon: BarChart3,
  },
  {
    href: "/research/reports",
    label: "Synthesis Studio",
    icon: FileText,
  },
];

export default function ResearchLayout({ children }: ResearchLayoutProps) {
  const pathname = usePathname();
  const isMapRoute = pathname === "/research/map";

  return (
    <div className="flex h-screen w-screen bg-[#F6F8FA] text-[#202124] overflow-hidden font-sans select-none">
      {/* ─── LEFT PERSISTENT SIDEBAR (Clean Scientific Light Theme) ─────────── */}
      <aside className="w-16 md:w-64 shrink-0 bg-white border-r border-[#E1E5EA] flex flex-col justify-between z-30 shadow-xs">
        <div>
          {/* Header Brand — Links to Dashboard */}
          <Link
            href="/dashboard"
            className="h-14 flex items-center justify-center md:justify-start px-4 md:px-5 border-b border-[#E1E5EA] bg-white hover:bg-[#F6F8FA] transition group cursor-pointer"
            title="Return to ORCA Dashboard"
          >
            <div className="flex items-center gap-2.5">
              {/* ORCA Brand Logo Badge */}
              <div className="h-8 w-8 rounded-lg bg-[#1F4E8C] flex items-center justify-center text-white shadow-xs group-hover:bg-[#163866] transition shrink-0">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="3.5" fill="#ffffff" />
                  <circle cx="16" cy="16" r="7.5" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.85" />
                  <circle cx="16" cy="16" r="12" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.45" />
                  <line x1="16" y1="16" x2="28" y2="5" stroke="#E87524" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-2xl text-[#202124] tracking-wider group-hover:text-[#1F4E8C] transition">
                  ORCA
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-[#E87524] mb-0.5" />
              </div>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <div className="hidden md:block px-2 py-1 text-[10px] font-sans uppercase tracking-wider text-[#667085] font-semibold mb-1">
              Research Portals
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#F0F4FA] text-[#1F4E8C] font-semibold border border-[#CBD5E1] shadow-xs"
                      : "text-[#667085] hover:text-[#202124] hover:bg-[#F6F8FA] border border-transparent"
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-[#1F4E8C]" : "text-[#667085]"
                      }`}
                    />
                    <span className="hidden md:inline">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-[#E1E5EA] bg-white space-y-1">
          <Link
            href="/dashboard?role=researcher"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-sans text-[#667085] hover:text-[#1F4E8C] hover:bg-[#F0F4FA] transition border border-transparent hover:border-[#CBD5E1]"
            title="Return to Master 3D Globe"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-[#1F4E8C]" />
            <span className="hidden md:inline font-medium">Interactive 3D Globe</span>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F6F8FA]">
        {/* Conditional Top Bar: Hidden on Full-Screen Spatial Map */}
        {!isMapRoute && (
          <header className="h-14 shrink-0 border-b border-[#E1E5EA] bg-white/95 backdrop-blur-md px-6 flex items-center justify-between z-20">
            {/* Search Input */}
            <div className="flex items-center gap-2.5 w-72 md:w-96 bg-[#F6F8FA] hover:bg-[#F1F5F9] border border-[#E1E5EA] focus-within:border-[#1F4E8C] focus-within:bg-white rounded-lg px-3 py-1.5 transition">
              <Search className="h-3.5 w-3.5 text-[#98A2B3] shrink-0" />
              <input
                type="text"
                placeholder="Search oceanographic datasets, NetCDF variables..."
                className="bg-transparent text-xs text-[#202124] placeholder-[#98A2B3] focus:outline-none w-full font-sans"
              />
            </div>

            {/* Header Status / Navigation */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] font-mono font-medium text-[#228B5A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#228B5A]" />
                <span>Store: Available</span>
              </div>

              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-sans font-medium text-[#1F4E8C] bg-[#F0F4FA] hover:bg-[#E1E5EA] border border-[#CBD5E1] transition"
              >
                <span>3D Globe</span>
              </Link>
            </div>
          </header>
        )}

        {/* Route Page Container */}
        <main className="flex-1 w-full h-full min-h-0 overflow-y-auto relative bg-[#F6F8FA]">
          {children}
        </main>
      </div>
    </div>
  );
}
