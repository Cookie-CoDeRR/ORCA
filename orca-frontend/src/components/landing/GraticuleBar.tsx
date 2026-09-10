"use client";

export default function GraticuleBar() {
  const benchmarks = [
    { code: "GEO-0877", location: "Cape Comorin Front", coords: "08°15'N 77°20'E", depth: "85m" },
    { code: "GEO-1274", location: "Mangalore Upwelling Shelf", coords: "12°50'N 74°45'E", depth: "42m" },
    { code: "GEO-2069", location: "Gujarat IMBL Standoff", coords: "20°30'N 69°15'E", depth: "110m" },
    { code: "GEO-1380", location: "Coromandel Chlorophyll Basin", coords: "13°05'N 80°18'E", depth: "340m" },
    { code: "GEO-1192", location: "Andaman Pelagic Trench", coords: "11°40'N 92°45'E", depth: "1,850m" },
  ];

  return (
    <div className="bg-slate-950 text-slate-400 border-y border-slate-800/70 py-2.5 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-[10px] font-mono">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-slate-800 text-slate-500">
          <span className="text-cyan-400">⊕</span>
          <span className="tracking-widest uppercase text-slate-300 font-semibold">
            GEODETIC BENCHMARKS
          </span>
        </div>

        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar text-slate-400">
          {benchmarks.map((b, i) => (
            <div key={b.code} className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500">[{b.code}]</span>
              <span className="text-slate-200 font-medium">{b.location}</span>
              <span className="text-slate-400">({b.coords} · {b.depth})</span>
              {i < benchmarks.length - 1 && <span className="text-slate-800 ml-6 font-sans">|</span>}
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0 pl-4 border-l border-slate-800 text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-pulse" />
          <span>WGS-84 ELLIPSOID</span>
        </div>
      </div>
    </div>
  );
}
