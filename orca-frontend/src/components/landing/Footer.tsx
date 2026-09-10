import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const FOOTER_GROUPS: Record<string, FooterLink[]> = {
  Platform: [
    { label: "Spatial Canvas", href: "/research/map" },
    { label: "Ocean Data Catalog", href: "/research/data" },
    { label: "AI Copilot", href: "/dashboard" },
    { label: "Synthesis Studio", href: "/research/reports" },
  ],
  Resources: [
    { label: "Scientific Research", href: "/research/reports" },
    { label: "Data Sources & Lineage", href: "/research/data" },
    { label: "INCOIS SAMUDRA Portal", href: "https://incois.gov.in/site/SAMUDRA/index.html", external: true },
    { label: "ISRO Spacecraft Archive", href: "https://www.mosdac.gov.in/", external: true },
  ],
  Project: [
    { label: "About ORCA", href: "/dashboard" },
    { label: "Mission Dossier", href: "/research/reports" },
    { label: "Ministry of Earth Sciences", href: "https://moes.gov.in/", external: true },
    { label: "SIH-26176 Problem Statement", href: "https://www.sih.gov.in/", external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: Agency Brand + Multi-Column Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-white/10 font-sans">
          {/* Left Column (5 cols): Brand & Overview */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative w-10 h-10 rounded-full bg-blue-950 border border-blue-400/40 flex items-center justify-center shadow-md">
                  <div className="absolute inset-1 rounded-full border border-blue-400/20" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <div>
                  <span className="text-white font-semibold text-sm tracking-wide block font-sans">
                    Project ORCA
                  </span>
                  <span className="text-slate-400 font-mono text-[11px] block">
                    SIH-26176 · MoES
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold tracking-tight text-white leading-snug">
                Marine Ecosystem Reasoning with Collaborative Agents
              </h3>

              <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-md font-normal">
                Autonomous marine intelligence platform synthesizing multi-sensor satellite remote sensing, in-situ oceanographic buoys, and cooperative AI agents for India&apos;s waters.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 w-fit text-xs text-slate-300 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sovereign Indian EEZ feeds active</span>
            </div>
          </div>

          {/* Right Columns (7 cols): 3 Link Columns */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 font-sans">
            {Object.entries(FOOTER_GROUPS).map(([section, items]) => (
              <div key={section}>
                <h4 className="text-white font-semibold text-xs mb-4 pb-2 border-b border-white/10">
                  {section}
                </h4>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-slate-400 hover:text-white text-xs sm:text-sm transition-colors font-normal leading-tight block"
                        {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {item.label}
                        {item.external && <span className="ml-1 text-[10px] opacity-70">↗</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Horizontal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-sans font-medium text-slate-300">Project ORCA</span>
            <span>·</span>
            <span>Node: <strong className="text-slate-300 font-normal">INCOIS-ISRO-MoES Grid</strong></span>
            <span>·</span>
            <span>Standard: <strong className="text-slate-300 font-normal">CF-1.8 NetCDF</strong></span>
          </div>
          <div className="text-slate-400 font-sans font-normal">
            Smart India Hackathon 2026 · Ministry of Earth Sciences
          </div>
        </div>
      </div>
    </footer>
  );
}
