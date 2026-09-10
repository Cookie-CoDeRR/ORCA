"use client";

export default function TelemetryBar() {
  const telemetryItems = [
    { label: "ORCA SWARM", status: "SUB-SECOND CONSENSUS OK", dot: "bg-emerald-400" },
    { label: "ISRO EOS-06 (OCM-3)", status: "ORBIT PASS #4,812 ACQUIRING", dot: "bg-sky-400" },
    { label: "INCOIS MOORED BUOYS", status: "180 NODES REPORTING", dot: "bg-emerald-400" },
    { label: "DGLL AIS COASTAL CHAIN", status: "7,516 KM EEZ ACTIVE", dot: "bg-sky-400" },
    { label: "IMBL STANDOFF GEOFENCE", status: "0 ENCROACHMENTS", dot: "bg-emerald-400" },
    { label: "EU-COPERNICUS SST", status: "0.05° ANOMALY RESOLUTION", dot: "bg-sky-400" },
    { label: "SOVEREIGN SYSTEM", status: "SIH-26176 OPERATIONAL", dot: "bg-emerald-400" },
  ];

  return (
    <div className="bg-slate-950 text-slate-300 border-y border-slate-800/80 py-2.5 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Left Indicator Pill */}
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">
            LIVE SENSOR MESH
          </span>
        </div>

        {/* Scrolling or Flex Telemetry Metrics */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar font-mono text-[11px] text-slate-400">
          {telemetryItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
              <span className="text-slate-200 font-semibold">{item.label}:</span>
              <span className="text-slate-400 font-normal">{item.status}</span>
              {idx < telemetryItems.length - 1 && (
                <span className="text-slate-700 ml-6 select-none font-sans">|</span>
              )}
            </div>
          ))}
        </div>

        {/* Right Station Benchmark */}
        <div className="hidden xl:flex items-center gap-3 shrink-0 pl-4 border-l border-slate-800 font-mono text-[10px] text-slate-400">
          <span>UTC+05:30</span>
          <span className="text-slate-700">·</span>
          <span className="text-slate-300 font-semibold">HQ-INCOIS-HYD</span>
        </div>
      </div>
    </div>
  );
}
