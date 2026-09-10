import Image from "next/image";
import Link from "next/link";

export default function EarthOceanScience() {
  return (
    <section className="py-20 sm:py-24 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 font-sans">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold text-blue-700">
                Observational Missions
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Earth &amp; Ocean Science
            </h2>
            <p className="mt-2 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed font-normal">
              Synthesizing space-based remote sensing from ISRO and NASA with in-situ mooring networks to monitor thermodynamic and biological ocean dynamics.
            </p>
          </div>
          <Link
            href="/research/reports"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors group self-start sm:self-end"
          >
            <span>Explore science dossier</span>
            <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Editorial Split Grid: 1 Large Feature Story + 2 Stacked Stories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans">
          {/* Main Large Feature Story (7 cols) */}
          <div className="lg:col-span-7 flex flex-col rounded-lg border border-slate-200 overflow-hidden bg-slate-900 text-white group">
            <div className="relative h-72 sm:h-96 w-full overflow-hidden">
              <Image
                src="/images/landing/nasa-storms.jpg"
                alt="Severe tropical storm observation from orbital satellite"
                fill
                quality={82}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover group-hover:scale-103 transition-transform duration-700 brightness-[0.88]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none text-xs">
                <span className="text-[11px] font-medium text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                  Atmospheric Science
                </span>
                <span className="text-[11px] font-mono text-slate-300 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  INSAT-3DR · NASA PO.DAAC
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6">
                <span className="text-xs font-medium text-cyan-400 mb-1.5 block">
                  Featured Investigation
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  Severe Tropical Cyclones &amp; Rapid Marine Warming
                </h3>
              </div>
            </div>

            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between bg-slate-950/90 border-t border-white/10">
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                ORCA cross-references sea surface temperature anomalies, upper-ocean heat content (UOHC), and rapid cyclogenesis indicators across the North Indian Ocean basin to provide 72-hour track and intensity envelopes.
              </p>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Track horizon: <strong className="text-slate-200 font-mono font-medium">72h</strong></span>
                  <span>·</span>
                  <span>Confidence: <strong className="text-slate-200 font-mono font-semibold">94.3%</strong></span>
                </div>
                <Link
                  href="/research/reports"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group/link"
                >
                  <span>Read analysis</span>
                  <span className="group-hover/link:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 2 Stacked Stories (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Story 1: Ocean Colour */}
            <div className="flex-1 flex flex-col sm:flex-row lg:flex-col rounded-lg border border-slate-200 overflow-hidden bg-slate-50 hover:bg-slate-100/70 transition-colors group">
              <div className="relative h-44 sm:h-auto sm:w-48 lg:w-full lg:h-44 shrink-0 bg-slate-900">
                <Image
                  src="/images/landing/article-pfz-chlorophyll.jpg"
                  alt="Chlorophyll concentration map of Indian coastal waters"
                  fill
                  quality={80}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 192px, 42vw"
                  className="object-cover group-hover:scale-103 transition-transform duration-500 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent sm:hidden lg:block" />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-medium text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                    Biogeochemistry
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-950 group-hover:text-blue-700 transition-colors leading-snug">
                    Chlorophyll-a Dynamics &amp; Upwelling Fronts
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 font-normal">
                    Ocean Colour Monitor (OCM-3) radiometric plumes combined with AVHRR thermal fronts to identify pelagic feeding zones.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">ISRO OceanSat-3 · <span className="font-mono font-medium">1.26 mg/m³</span></span>
                  <Link
                    href="/research/data"
                    className="font-semibold text-blue-700 hover:text-blue-900 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Read</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Story 2: Coastal Dynamics */}
            <div className="flex-1 flex flex-col sm:flex-row lg:flex-col rounded-lg border border-slate-200 overflow-hidden bg-slate-50 hover:bg-slate-100/70 transition-colors group">
              <div className="relative h-44 sm:h-auto sm:w-48 lg:w-full lg:h-44 shrink-0 bg-slate-900">
                <Image
                  src="/images/landing/gallery-buoy.jpg"
                  alt="Moored meteorological and oceanographic buoy in the Arabian Sea"
                  fill
                  quality={80}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 192px, 42vw"
                  className="object-cover group-hover:scale-103 transition-transform duration-500 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent sm:hidden lg:block" />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-medium text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                    In-Situ Mooring
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-950 group-hover:text-blue-700 transition-colors leading-snug">
                    Coastal Dynamics &amp; Shelf Wave Telemetry
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 font-normal">
                    National Data Buoy Programme (NIOT/MoES) moored arrays streaming wave spectrum, subsurface current velocity, and salinity profiles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">NIOT Buoy Network · <span className="font-mono font-medium">1.6m Hs</span></span>
                  <Link
                    href="/research/map"
                    className="font-semibold text-blue-700 hover:text-blue-900 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Read</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
