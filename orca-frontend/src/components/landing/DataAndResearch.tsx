import Link from "next/link";

const PROVIDERS = [
  { name: "INCOIS", org: "Ministry of Earth Sciences", role: "Primary Ocean State & PFZ" },
  { name: "ISRO MOSDAC", org: "Space Applications Centre", role: "OceanSat-3 & INSAT Imagery" },
  { name: "Copernicus Marine", org: "Mercator Ocean Int.", role: "Global Hydrodynamic Forecasts" },
  { name: "NASA PO.DAAC", org: "Physical Oceanography DAAC", role: "MUR SST & Microwave Telemetry" },
  { name: "DGLL NAIS", org: "National AIS Authority", role: "Coastal AIS Mesh & Kinematics" },
];

export default function DataAndResearch() {
  return (
    <section className="py-20 sm:py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 font-sans">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold text-blue-700">
              Foundational Architecture
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Data &amp; Research
          </h2>
          <p className="mt-2 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed font-normal">
            A dual architecture connecting verified satellite observations with peer-reviewed oceanographic and algorithmic research.
          </p>
        </div>

        {/* Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-14 font-sans">
          {/* Left Column: Ocean Data Catalog */}
          <div className="bg-white rounded-lg border border-slate-200 p-7 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-medium text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  Observational Catalog
                </span>
                <span className="text-xs font-mono text-slate-500">CF-1.8 Compliant</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-950 tracking-tight">
                Ocean Data Catalog
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed font-normal">
                Access curated marine observations, numerical model reanalyses, and real-time sensor streams across the North Indian Ocean, normalized to international standards.
              </p>

              {/* Clean attribute list */}
              <div className="mt-6 space-y-3 pt-6 border-t border-slate-100 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-normal">Datasets registered</span>
                  <span className="font-mono font-medium text-slate-900">12 Curated Feeds</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-normal">Integrated providers</span>
                  <span className="font-mono font-medium text-slate-900">5 Sovereign &amp; Global</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-normal">Physical variables</span>
                  <span className="text-slate-900 font-medium">SST, Currents, Waves, Chl-a</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-normal">Standard format</span>
                  <span className="font-mono text-xs text-slate-800">NetCDF-4 · GeoTIFF · GeoJSON</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600 font-normal">Pipeline ingestion</span>
                  <span className="text-emerald-700 font-medium">Active · Sub-Hourly Ingest</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/research/data"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors shadow-xs"
              >
                <span>Explore ocean data catalog</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Scientific Research */}
          <div className="bg-white rounded-lg border border-slate-200 p-7 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  Literature &amp; Methodology
                </span>
                <span className="text-xs font-mono text-slate-500">Peer-Reviewed Foundations</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-950 tracking-tight">
                Scientific Research
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed font-normal">
                Algorithmic foundations grounding ORCA&apos;s multi-agent synthesis, from hydrodynamic vector drift calculations to thermal-chlorophyll potential fishing zone models.
              </p>

              {/* Clean attribute list */}
              <div className="mt-6 space-y-3 pt-6 border-t border-slate-100 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-normal">Peer-reviewed papers</span>
                  <span className="text-slate-900 font-medium">JMSE, CMFRI, ISRO</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-normal">Technical reports</span>
                  <span className="text-slate-900 font-medium">Cyclone Tracking, AIS Density</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-normal">Core oceanography</span>
                  <span className="text-slate-900 font-medium">ROMS Currents, SWAN Waves</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-normal">Remote sensing focus</span>
                  <span className="text-slate-900 font-medium">OCM-3 Radiometry, Altimetry</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600 font-normal">Fisheries science</span>
                  <span className="text-slate-900 font-medium">PFZ Validation, Pelagic Biomass</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href="/research/reports"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-md border border-slate-300 hover:border-slate-400 bg-white text-slate-900 text-sm font-semibold transition-colors shadow-xs"
              >
                <span>Explore scientific research</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Compact Provider Row */}
        <div className="pt-8 border-t border-slate-200 font-sans">
          <p className="text-xs font-semibold text-slate-600 mb-4">
            Authoritative Data Sources &amp; Space Agencies
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {PROVIDERS.map((p) => (
              <div
                key={p.name}
                className="py-3 px-3.5 bg-white rounded-md border border-slate-200/80 shadow-2xs"
              >
                <div className="font-semibold text-xs text-slate-900">{p.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate font-normal">{p.org}</div>
                <div className="text-[11px] text-blue-700 mt-1 truncate font-medium">{p.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
