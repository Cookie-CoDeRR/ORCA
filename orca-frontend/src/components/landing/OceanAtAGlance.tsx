import Link from "next/link";
import { ArrowUpRight, Activity } from "lucide-react";

export default function OceanAtAGlance() {
  const currentMetrics = [
    {
      label: "Sea Surface Temperature",
      value: "28.4°C",
      sub: "Normal range (+0.3° anomaly)",
      status: "Nominal",
      code: "SST",
    },
    {
      label: "Significant Wave Height",
      value: "1.6 m",
      sub: "Moderate swell · 9s period",
      status: "Advisory",
      code: "SWH",
    },
    {
      label: "Surface Wind Speed",
      value: "12 kts",
      sub: "WNW bearing · Gusts to 18 kts",
      status: "Moderate",
      code: "WND",
    },
    {
      label: "Chlorophyll-a",
      value: "1.26 mg/m³",
      sub: "High coastal primary productivity",
      status: "Enriched",
      code: "CHL",
    },
    {
      label: "Active Marine Alerts",
      value: "2 Active",
      sub: "1 High Wave · 1 Frontal Advisory",
      status: "Monitored",
      code: "ALRT",
    },
    {
      label: "Observation Cycle",
      value: "06:00 IST",
      sub: "INCOIS / ISRO Synoptic Sync",
      status: "Live",
      code: "SYNC",
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-[#E1E5EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E1E5EA]">
          <div>
            <div className="text-xs font-semibold text-[#c25e1a] mb-1 font-sans">
              Live Marine Conditions
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#202124] tracking-tight font-sans">
              Ocean at a Glance
            </h2>
          </div>
          <div className="flex items-center gap-3 font-sans">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-[#EBF5EE] text-[#137333] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse" />
              North Indian Ocean · Synchronized
            </span>
            <Link
              href="/research/map"
              className="text-xs font-semibold text-[#1F4E8C] hover:underline flex items-center gap-1"
            >
              <span>Open Spatial Canvas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Editorial Split: Left Regional Summary | Right 6 Key Metrics */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start font-sans">
          {/* Left Column: Regional Narrative */}
          <div className="lg:col-span-5 space-y-5">
            <h3 className="text-lg font-semibold text-[#202124] leading-snug">
              Moderate southwesterly flow with active biological frontal development along the western continental shelf.
            </h3>
            <p className="text-sm text-[#4A5568] leading-relaxed font-normal">
              Multi-sensor satellite telemetry indicates stable thermal stratification across the central Arabian Sea, with active coastal upwelling supporting elevated phytoplankton concentrations along the Konkan and Malabar margins.
            </p>
            <div className="pt-2">
              <div className="p-4 rounded-lg bg-[#F6F8FA] border border-[#E1E5EA] space-y-2 text-xs">
                <div className="flex justify-between text-[#667085]">
                  <span>Target Basin:</span>
                  <strong className="text-[#202124] font-medium">Arabian Sea &amp; Bay of Bengal</strong>
                </div>
                <div className="flex justify-between text-[#667085]">
                  <span>Primary Sensor Feed:</span>
                  <strong className="text-[#1F4E8C] font-mono font-medium">EOS-06 OCM-3 &amp; SLSTR</strong>
                </div>
                <div className="flex justify-between text-[#667085]">
                  <span>Moored Buoys Active:</span>
                  <strong className="text-[#137333] font-mono font-medium">18 Stations Reporting</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 6 Key Metrics in Clean Scientific Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentMetrics.map((m) => (
              <div
                key={m.label}
                className="p-4 rounded-lg border border-[#E1E5EA] bg-[#FBFBFC] hover:bg-white hover:border-[#1F4E8C]/40 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-[#667085]">
                    {m.code}
                  </span>
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-white border border-[#E1E5EA] text-[#4A5568] font-medium">
                    {m.status}
                  </span>
                </div>
                <div className="text-xl font-semibold font-mono text-[#202124] pt-1">
                  {m.value}
                </div>
                <div className="text-xs font-semibold text-[#202124] line-clamp-1">
                  {m.label}
                </div>
                <p className="text-[11px] text-[#667085] line-clamp-1 font-normal">
                  {m.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
