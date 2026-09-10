import Image from "next/image";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Radio, CheckCircle2, ChevronRight } from "lucide-react";

export default function FeaturedAlert() {
  const secondaryAlerts = [
    {
      title: "High Wave Activity",
      region: "Saurashtra & Gujarat Coast",
      time: "06:00 IST",
      status: "Advisory Active",
      statusType: "warning",
      detail: "Significant wave heights exceeding 2.4m; small artisanal craft advised caution.",
    },
    {
      title: "Chlorophyll Frontal Anomaly",
      region: "Central Arabian Sea Margin",
      time: "05:30 IST",
      status: "Verified",
      statusType: "success",
      detail: "High phytoplankton gradient (1.85 mg/m³) intersecting 28.2°C thermal boundary.",
    },
    {
      title: "Low Pressure System Developing",
      region: "South-East Bay of Bengal",
      time: "04:00 IST",
      status: "Watch",
      statusType: "info",
      detail: "Deep convection cluster tracked by multi-agent cyclone prediction mesh.",
    },
  ];

  return (
    <section className="py-20 bg-[#F6F8FA] border-b border-[#E1E5EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="pb-8 border-b border-[#E1E5EA] flex flex-col sm:flex-row sm:items-end justify-between gap-4 font-sans">
          <div>
            <div className="text-xs font-semibold text-[#c25e1a] mb-1">
              Marine Operational Intelligence
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#202124] tracking-tight">
              Featured Marine Alert
            </h2>
          </div>
          <Link
            href="/research/reports"
            className="text-xs font-semibold text-[#1F4E8C] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all advisories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Primary Featured Alert Card (Split Layout) */}
        <div className="mt-8 bg-white border border-[#E1E5EA] rounded-xl overflow-hidden shadow-2xs font-sans">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left: Large High-Resolution Satellite Visual */}
            <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] bg-slate-900">
              <Image
                src="/images/landing/news-pfz.jpg"
                alt="Satellite thermal and chlorophyll front detection map over Mangalore Shelf"
                fill
                quality={80}
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-sans">
                  Oceansat-3 OCM-3 &amp; SST Frontal Overlay
                </span>
                <span className="font-mono text-[11px] text-slate-300">Lat 12.86°N · Lon 74.32°E</span>
              </div>
            </div>

            {/* Right: Structured Alert Metadata Panel */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF5EE] text-[#137333]">
                    ● Operational Advisory
                  </span>
                  <span className="text-xs font-mono text-[#667085]">
                    #PFZ-2026-0910
                  </span>
                </div>

                <h3 className="text-2xl font-semibold text-[#202124] leading-tight">
                  High Catch Abundance — Mangalore Shelf Front
                </h3>

                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed font-normal">
                  Persistent thermal-chlorophyll gradient convergence identified 42 NM offshore Mangalore. High probability of pelagic aggregation (Yellowfin Tuna &amp; Mackerel) within sovereign EEZ waters.
                </p>

                {/* Structured Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 py-2 text-xs">
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] block font-medium">Region</span>
                    <strong className="text-[#202124] font-medium">Arabian Sea (Mangalore)</strong>
                  </div>
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] block font-medium">Confidence</span>
                    <strong className="text-[#137333] font-mono font-semibold">94.2% Frontal Match</strong>
                  </div>
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] block font-medium">Observation Time</span>
                    <strong className="text-[#202124] font-mono font-medium">Today · 06:00 IST</strong>
                  </div>
                  <div className="p-2.5 rounded bg-[#FBFBFC] border border-[#E1E5EA]">
                    <span className="text-[10px] text-[#667085] block font-medium">Authority Source</span>
                    <strong className="text-[#1F4E8C] font-mono font-medium">INCOIS PFZ / ISRO</strong>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href="/research/reports"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#1F4E8C] hover:bg-[#183E70] text-white text-xs font-semibold transition"
                >
                  <span>View full advisory &amp; dossier</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Alerts: Compact Scannable Rows Beneath */}
        <div className="mt-6 bg-white border border-[#E1E5EA] rounded-xl overflow-hidden shadow-2xs font-sans">
          <div className="px-5 py-3 bg-[#FBFBFC] border-b border-[#E1E5EA] text-xs font-semibold text-[#202124]">
            Recent secondary advisories and observations
          </div>
          <div className="divide-y divide-[#E1E5EA]">
            {secondaryAlerts.map((alt, idx) => (
              <Link
                key={idx}
                href="/research/reports"
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6F8FA] transition group"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#202124] group-hover:text-[#1F4E8C] transition-colors">
                      {alt.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F0F4FA] text-[#1F4E8C]">
                      {alt.region}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] line-clamp-1 font-normal">
                    {alt.detail}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs">
                  <span className="text-[#667085] font-mono">{alt.time}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      alt.statusType === "warning"
                        ? "bg-[#FEF7E0] text-[#B06000]"
                        : alt.statusType === "success"
                        ? "bg-[#EBF5EE] text-[#137333]"
                        : "bg-[#F0F4FA] text-[#1F4E8C]"
                    }`}
                  >
                    {alt.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#9AA0A6] group-hover:text-[#1F4E8C] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
