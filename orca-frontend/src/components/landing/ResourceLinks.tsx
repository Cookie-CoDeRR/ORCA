"use client";
import Image from "next/image";

const RESOURCES = [
  {
    category: "Sovereign Marine Research",
    bannerImg: "/images/landing/resource-marine-research.jpg",
    badge: "INCOIS & MoES",
    items: [
      {
        name: "INCOIS Potential Fishing Zones (PFZ)",
        href: "https://incois.gov.in/MarineFisheries/TextDataHome?mfid=1&request_locale=en",
        desc: "Thermal-chlorophyll satellite overlays and daily potential fishing zone advisory GIS maps.",
        tag: "INCOIS",
      },
      {
        name: "MoES Ocean Observations (NIOT)",
        href: "https://www.niot.res.in/",
        desc: "Moored meteorological buoy telemetry, Argo profiling floats, and coastal current radars.",
        tag: "NIOT",
      },
      {
        name: "SAMUDRA Fisher Advisory Portal",
        href: "https://incois.gov.in/site/SAMUDRA/index.html",
        desc: "Smart Access for Marine Users through Ocean Data and Resources Advice.",
        tag: "MoES",
      },
      {
        name: "ICAR-CMFRI Marine Fisheries Data",
        href: "https://www.cmfri.org.in/",
        desc: "Stock health assessments, species abundance models, and catch composition statistics.",
        tag: "CMFRI",
      },
    ],
  },
  {
    category: "Atmospheric & Cyclone Warning",
    bannerImg: "/images/landing/resource-cyclone-warning.jpg",
    badge: "IMD & RSMC",
    items: [
      {
        name: "IMD Cyclone Warning Division",
        href: "https://mausam.imd.gov.in/imd_latest/contents/cyclone.php",
        desc: "Regional Specialized Meteorological Centre (RSMC) tropical cyclone advisories and cone forecasts.",
        tag: "IMD",
      },
      {
        name: "IMD Doppler Weather Radar Network",
        href: "https://mausam.imd.gov.in/imd_latest/contents/radar.php",
        desc: "Coastal Doppler radar reflectivity and velocity scans at Veraval, Kochi, Chennai, and Paradip.",
        tag: "IMD DWR",
      },
      {
        name: "INSAT-3D / 3DR Satellite Imagery",
        href: "https://www.mosdac.gov.in/",
        desc: "Geostationary infrared, visible, and water vapor channels updated every 15 minutes.",
        tag: "MOSDAC",
      },
      {
        name: "National Disaster Management (NDMA)",
        href: "https://ndma.gov.in/",
        desc: "National cyclone risk mitigation protocols and coastal evacuation guidelines.",
        tag: "NDMA",
      },
    ],
  },
  {
    category: "Defense, Hydrography & SAR",
    bannerImg: "/images/landing/resource-defense-harbor.jpg",
    badge: "ICG & INHO",
    items: [
      {
        name: "Ministry of Defence — Maritime Security & SAR",
        href: "https://mod.gov.in/",
        desc: "Maritime Rescue Coordination Centres (MRCC) and Coastal Security Directives under Indian EEZ jurisdiction.",
        tag: "MoD / ICG",
      },
      {
        name: "Indian Naval Hydrographic Dept (INHO)",
        href: "https://www.hydrobharat.gov.in/",
        desc: "Official Electronic Navigational Charts (ENC) and Notices to Mariners for Indian EEZ.",
        tag: "INHO",
      },
      {
        name: "DG Shipping & DGLL AIS Mesh",
        href: "https://www.dgll.nic.in/",
        desc: "National coastal automatic identification system receiver chain and vessel traffic services.",
        tag: "DGLL",
      },
      {
        name: "GEBCO Gridded Bathymetry Data",
        href: "https://www.gebco.net/data_and_products/gridded_bathymetry_data/",
        desc: "General Bathymetric Chart of the Oceans — global 15 arc-second seafloor elevation models.",
        tag: "GEBCO",
      },
    ],
  },
];

export default function ResourceLinks() {
  return (
    <section id="research" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-blue-800 text-xs font-bold tracking-widest uppercase font-mono">
                Authoritative Government Portals
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-shimmer">
              Sovereign Data & Research Directory
            </h2>
            <p className="mt-2 text-slate-600 max-w-xl text-sm leading-relaxed">
              ORCA directly cross-references live telemetry from sovereign Indian research institutes and international oceanographic observation satellites.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RESOURCES.map((col, i) => (
            <div
              key={col.category}
              className={`bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col animate-fade-in-up stagger-${
                i + 1
              }`}
            >
              {/* Category Image Header */}
              <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                <Image
                  src={col.bannerImg}
                  alt={col.category}
                  fill
                  className="object-cover brightness-[0.80] hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                    {col.badge}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-bold text-white tracking-tight drop-shadow-sm">
                    {col.category}
                  </h3>
                </div>
              </div>

              {/* Items List */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <ul className="space-y-4">
                  {col.items.map((item) => (
                    <li key={item.name} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-slate-900 font-bold text-xs group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                            {item.name}
                          </div>
                          <span className="text-[8px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                            {item.tag}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-1 leading-relaxed line-clamp-2">
                          {item.desc}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
