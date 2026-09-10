"use client";
import Link from "next/link";

const LINKS = {
  Platform: [
    { label: "3D Globe Dashboard", href: "/dashboard" },
    { label: "Scientific Research",  href: "/research"  },
    { label: "Maritime Defense",    href: "/defense"   },
    { label: "Intelligence Dossier",href: "/report"    },
    { label: "Swarm Topology",      href: "/agents"    },
  ],
  "Scientific Data": [
    { label: "INCOIS PFZ Portal",     href: "https://incois.gov.in"       },
    { label: "IMD Cyclone Tracker",   href: "https://mausam.imd.gov.in"  },
    { label: "ISRO OceanSat-2",       href: "https://www.isro.gov.in"    },
    { label: "Copernicus Marine",     href: "https://marine.copernicus.eu" },
  ],
  Project: [
    { label: "About Mission",   href: "#about"  },
    { label: "SIH 2026",        href: "/research" },
    { label: "GitHub Repository", href: "https://github.com/Cookie-CoDeRR/ORCA" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="3" fill="#1e3a8a" />
                <circle cx="16" cy="16" r="7" stroke="#1e3a8a" strokeWidth="1.5" strokeOpacity="0.7" />
                <circle cx="16" cy="16" r="12" stroke="#1e3a8a" strokeWidth="1" strokeOpacity="0.35" />
                <line x1="16" y1="16" x2="28" y2="5" stroke="#1e3a8a" strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" />
              </svg>
              <span className="text-slate-950 font-bold text-lg tracking-widest">ORCA</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Sovereign Marine Intelligence & Navigation Platform — Smart India Hackathon Problem Statement 26176.
            </p>
            <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 w-fit shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-emerald-800 text-xs font-semibold">Active · India EEZ</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-slate-950 font-bold text-sm mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-slate-600 hover:text-blue-800 text-sm transition-colors font-normal"
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

        {/* Bottom bar */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © 2026 Team ORCA · Smart India Hackathon 2026 · Problem SIH-26176
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
            <a href="https://github.com/Cookie-CoDeRR/ORCA" target="_blank" rel="noopener noreferrer" className="hover:text-blue-800 transition-colors">
              GitHub
            </a>
            <span>·</span>
            <span>Built with Next.js · Three.js · MapLibre</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
