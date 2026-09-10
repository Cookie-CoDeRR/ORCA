"use client";
import Image from "next/image";

interface ResearchArticle {
  tag: string;
  badge: string;
  title: string;
  excerpt: string;
  img: string;
  paperUrl: string;
  paperSource: string;
  publicationType: string;
  cta: string;
}

const ARTICLES: ResearchArticle[] = [
  {
    tag: "Fuel Efficiency",
    badge: "VECTOR OPTIMIZATION",
    title: "How ORCA's Vector Routing Conserves 15%–22% Fuel (₹4.2L / Season)",
    excerpt:
      "Continuous Eulerian ocean current-assisted trajectory (u_o, v_o) calculates drift vectors to conserve diesel and eliminate adverse drag across geodetic grids.",
    img: "/images/landing/resource-bathymetry.jpg",
    paperUrl: "https://www.mdpi.com/2077-1312/10/8/1149",
    paperSource: "JMSE · Open Access",
    publicationType: "Peer-Reviewed Journal",
    cta: "Read Research Paper",
  },
  {
    tag: "Bio-Oceanography",
    badge: "PFZ SATELLITE SYNTHESIS",
    title: "The Physics of Potential Fishing Zones: 11 Variables Synthesized",
    excerpt:
      "Sea surface temperature gradients, chlorophyll-a plumes, and thermocline depth mapped directly into 5km × 5km geodetic cells from OCM and AVHRR sensors.",
    img: "/images/landing/article-pfz-chlorophyll.jpg",
    paperUrl: "https://eprints.cmfri.org.in/9806/",
    paperSource: "CMFRI · INCOIS Research",
    publicationType: "Peer-Reviewed Publication",
    cta: "Read PFZ Validation Paper",
  },
  {
    tag: "Swarm Intelligence",
    badge: "SATELLITE & AGENT MESH",
    title: "Autonomous 6-Agent Swarm: Sub-Second Consensus Architecture",
    excerpt:
      "Decentralized multi-agent coordination cross-validating ISRO OceanSat satellite telemetry, PostGIS bathymetry, and AIS kinematics to eliminate single points of failure.",
    img: "/images/landing/article-agent-mesh.jpg",
    paperUrl: "https://www.isro.gov.in/EOS_06.html",
    paperSource: "ISRO · EOS-06 Mission",
    publicationType: "Official Spacecraft Spec",
    cta: "Read ISRO Mission Paper",
  },
  {
    tag: "AIS & Telemetry",
    badge: "COASTAL RADAR HUD",
    title: "Real-Time AIS Vessel Monitoring Across 7,516 km Coastline",
    excerpt:
      "Every commercial and registered mechanized craft broadcasting in India's EEZ rendered with sub-second kinematic telemetry across the national AIS network.",
    img: "/images/landing/article-ais-traffic.jpg",
    paperUrl: "https://www.dgll.nic.in/",
    paperSource: "DGLL · National AIS",
    publicationType: "National AIS Authority",
    cta: "Read NAIS Technical Spec",
  },
  {
    tag: "Maritime Defense",
    badge: "IMBL STANDOFF GEOFENCE",
    title: "IMBL Standoff Shields, 1554 SAR Directives & Dark Vessel Detection",
    excerpt:
      "Proactive audio-visual alarms alert fishermen before accidental border violations, while behavioral heuristics flag AIS spoofing and border proximity.",
    img: "/images/landing/article-imbl-geofence.jpg",
    paperUrl: "https://mod.gov.in/",
    paperSource: "MoD · Maritime Defense",
    publicationType: "Sovereign Defense Directive",
    cta: "Read Defense Directives",
  },
  {
    tag: "SIH-26176",
    badge: "SOVEREIGN SYSTEM",
    title: "Smart India Hackathon 2026: Sovereign Engineering Deep Dive",
    excerpt:
      "From national problem statement SIH-26176 to a full-stack, edge-resilient maritime intelligence infrastructure for the Ministry of Earth Sciences.",
    img: "/images/landing/article-sih-command.jpg",
    paperUrl: "https://www.sih.gov.in/",
    paperSource: "MoES · SIH-26176",
    publicationType: "Problem Dossier",
    cta: "Read Problem Statement",
  },
];

export default function ArticleGrid() {
  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-blue-800 text-xs font-bold tracking-widest uppercase font-mono">
                Peer-Reviewed Literature & Technical Publications
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-shimmer">
              Engineering & Mission Research
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded border border-slate-200">
            PROBLEM STATEMENT SIH-26176
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ARTICLES.map((a, i) => (
            <div
              key={a.title}
              className={`group rounded-xl bg-white border border-slate-200 hover:border-blue-400 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between animate-fade-in-up stagger-${
                i + 1
              }`}
            >
              <div>
                {/* Visual Header Image Banner - Directly opens the specific research paper */}
                <a
                  href={a.paperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open scientific research paper: ${a.paperSource}`}
                  className="group/img relative h-48 w-full block overflow-hidden bg-slate-900 cursor-pointer"
                >
                  <Image
                    src={a.img}
                    alt={a.title}
                    fill
                    unoptimized={typeof a.img === "string" && (a.img.startsWith("/api/") || a.img.includes("?"))}
                    className="object-cover group-hover/img:scale-105 transition-transform duration-700 brightness-[0.88]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Clean minimal top pills */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase border border-white/10 font-mono">
                      {a.tag}
                    </span>
                    <span className="text-[10px] font-mono text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded border border-white/15 flex items-center gap-1 group-hover/img:bg-blue-600 group-hover/img:border-blue-400 transition-colors">
                      <span>{a.paperSource}</span>
                      <span className="text-xs leading-none">↗</span>
                    </span>
                  </div>
                </a>

                {/* Content Block - Clicking title also opens the specific research paper */}
                <div className="p-6">
                  <a
                    href={a.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group/title"
                  >
                    <h3 className="text-slate-950 font-bold text-lg leading-snug group-hover/title:text-blue-700 transition-colors line-clamp-2">
                      {a.title}
                    </h3>
                  </a>
                  <p className="mt-3 text-slate-600 text-sm leading-relaxed line-clamp-3 font-normal">
                    {a.excerpt}
                  </p>
                </div>
              </div>

              {/* Card Footer Link - Dedicated external link button to research paper */}
              <div className="px-6 pb-6 pt-2">
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-blue-800 text-xs font-bold">
                  <a
                    href={a.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-blue-950 transition-colors group/cta"
                  >
                    <span>{a.cta}</span>
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs group-hover/cta:bg-blue-600 group-hover/cta:text-white group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-all">
                      ↗
                    </span>
                  </a>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">
                    {a.publicationType}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
