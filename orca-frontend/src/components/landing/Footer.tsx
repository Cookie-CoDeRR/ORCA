"use client";
import Link from "next/link";

const NAV_COLUMNS = {
  Platform: [
    { label: "3D Globe Dashboard", href: "/dashboard" },
    { label: "Scientific Research", href: "/research" },
    { label: "Maritime Defense", href: "/defense" },
    { label: "Swarm Mesh Topology", href: "/agents" },
    { label: "Intelligence Dossier", href: "/report" },
  ],
  "Sensory Feeds": [
    { label: "INCOIS PFZ Advisory", href: "https://incois.gov.in/MarineFisheries/TextDataHome?mfid=1&request_locale=en" },
    { label: "ISRO EOS-06 Spacecraft", href: "https://www.isro.gov.in/EOS_06.html" },
    { label: "IMD Cyclone Warning", href: "https://mausam.imd.gov.in/imd_latest/contents/cyclone.php" },
    { label: "DGLL National AIS", href: "https://www.dgll.nic.in/" },
    { label: "NIOT Moored Buoys", href: "https://www.niot.res.in/" },
  ],
  "Research & Code": [
    { label: "Peer-Reviewed Studies", href: "/research" },
    { label: "SIH-26176 Dossier", href: "https://www.sih.gov.in/" },
    { label: "GitHub Repository", href: "https://github.com/Cookie-CoDeRR/ORCA" },
    { label: "SAMUDRA App Integration", href: "https://incois.gov.in/site/SAMUDRA/index.html" },
    { label: "MOSDAC Satellite Imagery", href: "https://www.mosdac.gov.in/" },
  ],
  Governance: [
    { label: "Ministry of Earth Sciences", href: "https://moes.gov.in/" },
    { label: "Ministry of Defence", href: "https://mod.gov.in/" },
    { label: "Smart India Hackathon", href: "https://www.sih.gov.in/" },
    { label: "National Disaster Mgmt", href: "https://ndma.gov.in/" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: Agency Brand + Multi-Column Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-white/15">
          {/* Left Column (5 cols): Sovereign Brand & Mission Overview */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              {/* Circular Emblem matching NASA meatball placement */}
              <div className="flex items-center gap-3.5 mb-6">
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 border border-blue-400/30 flex items-center justify-center shadow-lg shadow-blue-950/50">
                  {/* Concentric radar rings */}
                  <div className="absolute inset-1 rounded-full border border-blue-400/20" />
                  <div className="absolute inset-2.5 rounded-full border border-cyan-400/30" />
                  {/* Center core pulse */}
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-300 animate-pulse" />
                  {/* Orbit vector */}
                  <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent rotate-45" />
                </div>
                <div>
                  <span className="text-white font-mono font-bold text-sm tracking-widest block uppercase">
                    PROJECT ORCA
                  </span>
                  <span className="text-slate-400 font-mono text-[10px] tracking-wider block uppercase">
                    SIH-26176 · MoES
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-white leading-snug">
                Oceanic Reconnaissance &amp; Coordinated Analytics
              </h3>

              <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm font-normal">
                India&apos;s sovereign multi-agent marine intelligence platform. Synthesizing satellite oceanography,
                INCOIS moored buoy telemetry, and autonomous vector routing for fishermen and maritime defense.
              </p>

              <div className="mt-6">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  About ORCA&apos;s Mission
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-300 transition-colors group"
                >
                  <span>Launch 3D Tactical Globe</span>
                  <span className="w-6 h-6 rounded-full bg-[#e03a3e] text-white flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Sovereign Active Status Badge */}
            <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 w-fit font-mono text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sovereign Indian EEZ Operations Active</span>
            </div>
          </div>

          {/* Right Columns (8 cols): 4 Link Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(NAV_COLUMNS).map(([section, items]) => (
              <div key={section}>
                <h4 className="text-white font-bold text-xs font-mono uppercase tracking-wider mb-4 pb-2 border-b border-white/10">
                  {section}
                </h4>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-slate-400 hover:text-white text-xs sm:text-sm transition-colors font-normal leading-tight block"
                        {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Horizontal Bar — Exact NASA Format */}
        <div className="pt-8">
          {/* Flat Link List */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 mb-6 font-normal">
            <Link href="/" className="hover:text-white transition-colors">Portal Home</Link>
            <Link href="/research" className="hover:text-white transition-colors">Mission Dossier</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Tactical Globe</Link>
            <Link href="/defense" className="hover:text-white transition-colors">Maritime Security</Link>
            <Link href="/agents" className="hover:text-white transition-colors">Swarm Topology</Link>
            <a href="https://incois.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">INCOIS Data Portal</a>
            <a href="https://www.isro.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">ISRO Spacecraft</a>
            <a href="https://www.sih.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SIH-26176 Terms</a>
            <Link href="/signup" className="hover:text-white transition-colors">Operator Sign In</Link>
          </div>

          {/* NASA-style Metadata Footer Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] font-mono text-slate-500 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Page Last Updated: <strong className="text-slate-400 font-medium">Sep 10, 2026</strong></span>
              <span>·</span>
              <span>System Node: <strong className="text-slate-400 font-medium">ORCA-INCOIS-ISRO Mesh</strong></span>
              <span>·</span>
              <span>Responsible Agency: <strong className="text-slate-400 font-medium">Ministry of Earth Sciences (MoES)</strong></span>
            </div>
            <div className="text-slate-500 shrink-0">
              SIH-26176 · National Sovereign Platform
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
