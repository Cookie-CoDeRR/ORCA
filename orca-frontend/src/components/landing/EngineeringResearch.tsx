import Image from "next/image";
import Link from "next/link";

interface ArticleItem {
  category: string;
  source: string;
  title: string;
  summary: string;
  img: string;
  url: string;
}

const FEATURED_ARTICLES: ArticleItem[] = [
  {
    category: "Fuel Optimization",
    source: "JMSE · Peer-Reviewed",
    title: "Eulerian Ocean Current-Assisted Vector Routing",
    summary:
      "Integrating continuous surface drift vectors (u_o, v_o) into vessel navigation algorithms to eliminate adverse hydrodynamic drag and conserve up to 22% fuel.",
    img: "/images/landing/resource-bathymetry.jpg",
    url: "https://www.mdpi.com/2077-1312/10/8/1149",
  },
  {
    category: "Bio-Oceanography",
    source: "CMFRI & INCOIS",
    title: "Thermal-Chlorophyll PFZ Gradient Synthesis",
    summary:
      "Coupling MODIS/OCM-3 chlorophyll-a concentration with AVHRR sea surface temperature isotherms to locate high-probability pelagic aggregation fronts.",
    img: "/images/landing/article-pfz-chlorophyll.jpg",
    url: "https://eprints.cmfri.org.in/9806/",
  },
  {
    category: "Autonomous Systems",
    source: "ISRO EOS-06 Spec",
    title: "Decentralized Agent Mesh for Satellite Telemetry",
    summary:
      "Multi-agent architecture validating orbital scatterometer passes against in-situ moored buoys and coastal AIS radar meshes without single points of failure.",
    img: "/images/landing/article-agent-mesh.jpg",
    url: "https://www.isro.gov.in/EOS_06.html",
  },
];

export default function EngineeringResearch() {
  return (
    <section className="py-20 sm:py-24 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 font-sans">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold text-blue-700">
                Scientific Publications
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Engineering &amp; Mission Research
            </h2>
            <p className="mt-2 text-slate-600 max-w-xl text-sm sm:text-base leading-relaxed font-normal">
              Curated peer-reviewed literature and technical specifications informing ORCA&apos;s computational models.
            </p>
          </div>
          <Link
            href="/research/reports"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors group self-start sm:self-end"
          >
            <span>View all research</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* 3 Featured Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-sans">
          {FEATURED_ARTICLES.map((article) => (
            <article
              key={article.title}
              className="group rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-48 w-full block overflow-hidden bg-slate-900"
                  title={`Open scientific reference: ${article.source}`}
                >
                  <Image
                    src={article.img}
                    alt={article.title}
                    fill
                    quality={80}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-103 transition-transform duration-500 brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] font-medium text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                      {article.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-200 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                      {article.source}
                    </span>
                  </div>
                </a>

                <div className="p-6">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group/title"
                  >
                    <h3 className="text-base font-semibold text-slate-950 group-hover/title:text-blue-700 transition-colors leading-snug">
                      {article.title}
                    </h3>
                  </a>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-normal">
                    {article.summary}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <span>Read paper</span>
                    <span>↗</span>
                  </a>
                  <span className="text-[11px] font-mono text-slate-400">
                    SIH-26176 Reference
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
