"use client";
import Image from "next/image";
import Link from "next/link";

const CAPABILITIES = [
  { value: "Agent Swarm", label: "6-Engine Consensus", sub: "Decentralized LangGraph mesh" },
  { value: "72 hrs", label: "Cyclone Horizon", sub: "Autonomous harbor routing" },
  { value: "15%–22%", label: "Fuel Saved", sub: "Vector A* current drift solver" },
  { value: "Border Shield", label: "Zero IMBL Crossings", sub: "Audio-visual standoff geofence" },
];

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[680px] flex items-center overflow-hidden">
      {/* Background image — Indian Ocean from space */}
      <Image
        src="/images/landing/hero.jpg"
        alt="Indian Ocean from space at night"
        fill
        priority
        className="object-cover object-center scale-105"
        sizes="100vw"
      />

      {/* Overlays: dark on top for readability, smoothly fading to pure white at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          {/* Clean status indicator pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-900 text-xs font-bold tracking-wider uppercase font-mono">
              Live — 7,516 km EEZ Under Watch
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight drop-shadow-md">
            Sovereign{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-200">
              Marine Intelligence
            </span>{" "}
            for India&apos;s Waters
          </h1>

          <p className="mt-6 text-lg text-slate-100 max-w-xl leading-relaxed drop-shadow-sm font-normal">
            Real-time AI agent mesh monitoring India&apos;s 7,516 km coastline — fisheries safety,
            cyclone prediction, vector fuel conservation, and maritime defense.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-xl shadow-blue-950/40"
            >
              Explore Dashboard →
            </Link>
            <Link
              href="#mission"
              className="px-6 py-3 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-semibold text-sm transition-all duration-200 shadow-sm border border-slate-200/80 backdrop-blur-sm"
            >
              Mission Overview
            </Link>
          </div>

          {/* Platform Capability Highlights */}
          <div className="mt-12 flex flex-wrap gap-4">
            {CAPABILITIES.map((s, i) => (
              <div
                key={s.label}
                className={`bg-white/95 backdrop-blur-md border border-white/80 px-4 py-2.5 rounded-lg shadow-sm animate-fade-in-up stagger-${
                  i + 1
                }`}
              >
                <div className="text-xl font-bold text-slate-950 font-mono">{s.value}</div>
                <div className="text-xs text-slate-800 font-bold mt-0.5">{s.label}</div>
                <div className="text-[10px] text-slate-500 font-mono">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-70">
        <span className="text-slate-800 text-xs font-semibold tracking-widest">SCROLL</span>
        <svg className="animate-bounce w-4 h-4 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
