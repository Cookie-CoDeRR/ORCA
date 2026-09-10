"use client";
import Image from "next/image";
import Link from "next/link";

const METRICS = [
  {
    value: "72 hrs",
    label: "Advance Cyclonic Warning",
    sub: "Ahead of coastal IMD storm advisories",
    icon: (
      <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
        <path d="M12 3V1M10 1h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "3,200+",
    label: "Vessels Safely Rerouted",
    sub: "Autonomous A* current-adjusted corridors",
    icon: (
      <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1" strokeLinecap="round" />
        <path d="M4 17l1.5-6h13L20 17" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 11V5h6v6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="2" x2="12" y2="5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "94.3%",
    label: "Prediction Verification Rate",
    sub: "Benchmarked against INCOIS ocean ground-truth",
    icon: (
      <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="22" y1="12" x2="18" y2="12" strokeLinecap="round" />
        <line x1="6" y1="12" x2="2" y2="12" strokeLinecap="round" />
        <line x1="12" y1="6" x2="12" y2="2" strokeLinecap="round" />
        <line x1="12" y1="22" x2="12" y2="18" strokeLinecap="round" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    value: "47",
    label: "Multi-Spectral Variables",
    sub: "SST, Chlorophyll-a, Salinity, Wind, Depth Gradients",
    icon: (
      <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 18a6 6 0 0 0 6-6c0-3.31-2.69-6-6-6" strokeLinecap="round" />
        <path d="M12 22a10 10 0 0 0 10-10c0-5.52-4.48-10-10-10" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 12L4 20" strokeLinecap="round" />
        <path d="M2 22h4" strokeLinecap="round" />
      </svg>
    ),
  },
];

const CAPABILITIES = [
  "INCOIS OON Moored Buoy Integration",
  "5km × 5km Geodetic Grid Mesh",
  "ISRO OceanSat & INSAT-3DR Telemetry",
  "IMBL Geofence Real-time Shield",
  "Eulerian 15%–22% Fuel Reduction Engine",
  "DGLL Coastal AIS Transponders",
];

export default function FeatureStory() {
  return (
    <section className="relative py-24 overflow-hidden bg-slate-50 border-y border-slate-200">
      {/* Full-bleed real NASA satellite background with light overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/landing/feature-story.jpg"
          alt="NASA satellite capture of cyclone storm over Indian Ocean"
          fill
          className="object-cover object-center opacity-12"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/92 to-slate-50/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text side: 7 columns */}
          <div className="lg:col-span-7">
            {/* Pill badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold tracking-wider uppercase shadow-xs">
                SIH-26176 PROBLEM STATEMENT
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-200/70 text-slate-800 text-xs font-semibold tracking-wider uppercase">
                AUTONOMOUS MULTI-AGENT SWARM
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight font-shimmer leading-tight">
              Predicting Severe Cyclonic Storms Through{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-800">
                Coordinated AI Agents
              </span>
            </h2>

            <p className="mt-6 text-lg text-slate-700 leading-relaxed font-normal">
              When extreme cyclonic disturbances develop over the Bay of Bengal or the Arabian Sea,
              ORCA&apos;s distributed multi-agent mesh tracks 47 atmospheric and oceanographic parameters in real time —
              computing fuel-optimal evacuation vectors and safe harbor waypoints up to 72 hours before coastal landfall.
            </p>

            <p className="mt-4 text-slate-600 leading-relaxed text-base">
              Unlike monolithic numerical models, ORCA&apos;s decentralized agent nodes cross-validate
              INCOIS moored buoy telemetry, ISRO OceanSat satellite chlorophyll feeds, and live AIS vessel kinematics.
              The swarm continuously models the 5km × 5km geodetic grid, triggering proactive IMBL standoff
              warnings and protecting over 12,000 mechanized trawlers simultaneously.
            </p>

            {/* Technical Capability Badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {CAPABILITIES.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {cap}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/bulletin/cyclone-biparjoy-98"
                className="px-6 py-3 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm transition-all shadow-sm inline-flex items-center gap-2"
              >
                <span>Read Full Storm Dossier</span>
                <span>→</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold text-sm transition-all shadow-xs"
              >
                Open 3D Tactical Globe
              </Link>
            </div>
          </div>

          {/* Right Column: 5 columns (Radar Telemetry Preview + Metric Grid) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Live Telemetry Radar Preview Card */}
            <Link
              href="/bulletin/cyclone-biparjoy-98"
              className="group relative h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 block"
            >
              <Image
                src="/images/landing/news-radar.jpg"
                alt="Doppler radar telemetry visualization for cyclonic tracking"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.82]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Dynamic Animated Radar Sweep Beam */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="w-full h-full rounded-full border border-emerald-500/20 animate-pulse-beacon" />
              </div>

              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase border border-white/10 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  IMD Doppler Radar
                </span>
                <span className="text-[10px] font-mono text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  ARB/01/2023 · 21°18&apos;N, 66°42&apos;E
                </span>
              </div>

              <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between">
                <div>
                  <p className="text-white/80 text-[10px] font-bold tracking-widest uppercase font-mono mb-0.5">
                    SWARM CONSENSUS PREVIEW
                  </p>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors drop-shadow-sm">
                    Okha & Porbandar Safe Harbor Corridors
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-blue-300 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-mono">
                  VIEW DOSSIER →
                </span>
              </div>
            </Link>

            {/* Metrics 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {METRICS.map((m, i) => (
                <div
                  key={m.label}
                  className={`rounded-xl bg-white border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between animate-fade-in-up stagger-${
                    i + 1
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mb-3">
                      {m.icon}
                    </div>
                    <div className="text-2xl font-bold text-slate-950 tracking-tight font-mono">
                      {m.value}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                      {m.label}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-normal leading-relaxed line-clamp-2">
                    {m.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
