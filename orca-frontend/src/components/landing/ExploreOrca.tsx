import Link from "next/link";

const WORKSPACES = [
  {
    title: "Spatial Canvas",
    href: "/research/map",
    description: "Explore ocean conditions, thermal gradients, and geospatial vector layers.",
    badge: "Geospatial",
  },
  {
    title: "Ocean Data Catalog",
    href: "/research/data",
    description: "Inspect datasets, authoritative sources, NetCDF variables, and provenance.",
    badge: "Registry",
  },
  {
    title: "AI Copilot",
    href: "/dashboard",
    description: "Query ocean intelligence, inspect multi-agent reasoning, and run assessments.",
    badge: "Interactive",
  },
  {
    title: "Synthesis Studio",
    href: "/research/reports",
    description: "View, generate, and export comprehensive scientific and operational bulletins.",
    badge: "Reports",
  },
];

export default function ExploreOrca() {
  return (
    <section className="py-20 sm:py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 font-sans">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold text-blue-700">
              Platform Workspaces
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Explore ORCA
          </h2>
          <p className="mt-2 text-slate-600 max-w-xl text-sm sm:text-base leading-relaxed font-normal">
            Navigate the dedicated operational modules designed for scientists, coastal operators, and fisheries managers.
          </p>
        </div>

        {/* 4 Workspaces Navigation List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
          {WORKSPACES.map((w) => (
            <Link
              key={w.title}
              href={w.href}
              className="group p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-500 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {w.badge}
                  </span>
                  <span className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all text-sm font-semibold">
                    →
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-950 group-hover:text-blue-700 transition-colors">
                  {w.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {w.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-semibold text-blue-700 group-hover:text-blue-900 transition-colors flex items-center gap-1">
                <span>Open workspace</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
