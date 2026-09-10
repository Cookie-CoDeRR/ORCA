"use client";

const STATS = [
  {
    value: "7,516 km",
    category: "COASTAL PERIMETER",
    label: "Sovereign Coastline Monitored",
    sub: "All of India's EEZ perimeter under continuous surveillance",
    icon: (
      <svg className="w-4 h-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12c3-3 6-3 9 0s6 3 9 0" strokeLinecap="round" />
        <path d="M3 17c3-3 6-3 9 0s6 3 9 0" strokeLinecap="round" />
        <path d="M12 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "1.2M+",
    category: "SURFACE TELEMETRY",
    label: "Active Vessels Tracked",
    sub: "Real-time coastal AIS & transponder telemetry mesh",
    icon: (
      <svg className="w-4 h-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 17l1.5-6h13L20 17" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 11V5h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "72 hrs",
    category: "CYCLONE FORECAST",
    label: "Prediction Horizon Window",
    sub: "Ahead of IMD public landfall advisories",
    icon: (
      <svg className="w-4 h-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    ),
  },
  {
    value: "94.3%",
    category: "PFZ GROUND TRUTH",
    label: "Harvest Prediction Precision",
    sub: "Benchmarked against INCOIS landing center catch records",
    icon: (
      <svg className="w-4 h-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export default function StatsBar() {
  return (
    <section className="border-y border-slate-200 bg-slate-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x divide-slate-200">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`lg:px-8 first:pl-0 last:pr-0 text-center lg:text-left group animate-fade-in-up stagger-${
                i + 1
              }`}
            >
              <div className="inline-flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                  {s.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 font-mono">
                  {s.category}
                </span>
              </div>
              <div className="text-4xl font-bold text-slate-950 tracking-tight font-mono group-hover:text-blue-700 transition-colors">
                {s.value}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">{s.label}</div>
              <div className="mt-0.5 text-xs text-slate-500 font-normal">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
