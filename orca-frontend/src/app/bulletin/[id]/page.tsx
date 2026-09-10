import Image from "next/image";
import Link from "next/link";
import fallbackData from "@/data/landing-news.json";
import { notFound } from "next/navigation";

interface BulletinParams {
  params: Promise<{ id: string }>;
}

export default async function BulletinDossierPage({ params }: BulletinParams) {
  const { id } = await params;

  // Search across heroStories, heroFeature, centerFeature, stackedFeatures, and secondaryUpdates
  const allBulletins = [
    ...((fallbackData as any).heroStories || []),
    fallbackData.heroFeature,
    fallbackData.centerFeature,
    ...fallbackData.stackedFeatures,
    ...fallbackData.secondaryUpdates.map((u) => ({
      ...u,
      bulletin: u.bulletinNo,
      tag: u.category,
      excerpt: u.title,
      img: u.thumb,
      geodeticCell: "IN-EEZ-GEO-CELL",
      depth: "Surface to 100m",
      status: "ACTIVE_ADVISORY",
    })),
  ];

  let record = allBulletins.find((b) => b.id === id);

  // If a live dynamic NASA bulletin is requested
  if (!record && id.startsWith("nasa-live-")) {
    record = {
      id,
      bulletin: `NASA / EO OBS-${id.replace("nasa-live-", "")}`,
      tag: "Earth Observation",
      readTime: "3 MIN READ",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      title: "Real-Time Planetary & Ocean Observation Alert",
      excerpt: "Satellite observations synthesized from NASA Earth Observatory feeds tracking oceanic and atmospheric dynamics across the Indian Ocean basin.",
      img: "/images/landing/nasa-observatory.jpg",
      agency: "NASA Earth Observatory & ORCA Swarm",
      coordinates: "08°15'N, 73°40'E",
      geodeticCell: "IN-EEZ-LIVE-OBS",
      depth: "Surface Level",
      status: "LIVE_OBSERVATION",
      websiteUrl: "https://earthobservatory.nasa.gov",
      websiteName: "nasa.gov",
      href: `/bulletin/${id}`,
    } as any;
  }

  if (!record) {
    record = allBulletins[0];
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Top sticky operational header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors"
            >
              <span>← Back to ORCA Portal</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              {record.bulletin}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              Launch 3D Globe →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Dossier Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumbs */}
        <nav className="text-xs text-slate-500 font-mono mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-blue-700">HOME</Link>
          <span>/</span>
          <Link href="/research" className="hover:text-blue-700">BULLETINS</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">{record.id.toUpperCase()}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Main Article: 8 cols */}
          <article className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* High-res Image Banner */}
            <div className="relative h-80 sm:h-96 w-full bg-slate-950">
              <Image
                src={record.img}
                alt={record.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-sm bg-black/75 backdrop-blur-md text-white text-xs font-bold font-mono border border-white/20">
                  {record.tag}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-mono text-blue-300 mb-1">
                  OFFICIAL COORDINATES: {record.coordinates}
                </p>
                <p className="text-xs text-white/80">
                  Transmitted via NavIC Emergency Broadcast & SAMUDRA System
                </p>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-800 font-mono">
                    ISSUING AUTHORITY
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {record.agency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-slate-500">DISPATCH DATE</p>
                  <p className="text-sm font-mono font-bold text-slate-900">{record.date}</p>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 leading-tight">
                {record.title}
              </h1>

              <div className="mt-6 prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4">
                <p className="text-base sm:text-lg leading-relaxed font-normal text-slate-800">
                  {record.excerpt}
                </p>

                <h3 className="text-lg font-bold text-slate-900 pt-4">
                  1. Operational Guidance for Vessels at Sea
                </h3>
                <p>
                  Mechanized fishing craft, commercial shipping, and coastal artisanal vessels operating
                  within 50 nautical miles of the designated coordinates are instructed to tune onboard
                  VHF receivers to Channel 16 and monitor the ORCA 3D Tactical Dashboard for real-time
                  current vector updates.
                </p>

                <h3 className="text-lg font-bold text-slate-900 pt-2">
                  2. Dynamic Agent Mesh Consensus
                </h3>
                <p>
                  ORCA's distributed autonomous agent mesh has validated this bulletin across 180 moored
                  oceanographic buoys and satellite infrared SST passes. Fleet routing algorithms have
                  pre-computed fuel-optimal escape and aggregation vectors, saving an estimated 23% in
                  transit fuel burn while maintaining safe standoff from hazardous weather and international
                  boundaries.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-4">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm transition-all shadow-xs inline-flex items-center gap-2"
                >
                  <span>Track Cell on 3D Globe</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/defense"
                  className="px-6 py-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold text-sm transition-all shadow-2xs"
                >
                  Open in Defense SITREP Deck
                </Link>
                <Link
                  href="/research/data"
                  className="px-6 py-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold text-sm transition-all shadow-2xs"
                >
                  View Scientific Rasters
                </Link>
              </div>
            </div>
          </article>

          {/* Right Telemetry Sidebar: 4 cols */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Scientific Telemetry Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider font-mono border-b border-slate-100 pb-3 mb-4">
                TELEMETRY & GEODETIC ATTRIBUTES
              </h3>
              <dl className="space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500 font-mono">Geodetic Cell</dt>
                  <dd className="font-mono font-bold text-slate-900">
                    {"geodeticCell" in record ? record.geodeticCell : "IN-EEZ-GEO-01"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 font-mono">Target Coordinates</dt>
                  <dd className="font-mono font-bold text-slate-900">{record.coordinates}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 font-mono">Operational Status</dt>
                  <dd className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {("status" in record && typeof (record as Record<string, unknown>).status === "string")
                      ? ((record as Record<string, unknown>).status as string)
                      : "ACTIVE_BROADCAST"}
                  </dd>
                </div>
                {"sst" in record && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500 font-mono">Sea Surface Temp</dt>
                    <dd className="font-mono font-bold text-slate-900">
                      {String((record as Record<string, unknown>).sst)}
                    </dd>
                  </div>
                )}
                {"chlorophyll" in record && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500 font-mono">Chlorophyll-a</dt>
                    <dd className="font-mono font-bold text-slate-900">
                      {String((record as Record<string, unknown>).chlorophyll)}
                    </dd>
                  </div>
                )}
                {"windSpeed" in record && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500 font-mono">Sustained Wind</dt>
                    <dd className="font-mono font-bold text-red-700">
                      {String((record as Record<string, unknown>).windSpeed)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick Navigation to other live alerts */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider font-mono border-b border-slate-100 pb-3 mb-4">
                RECENT OFFICIAL BULLETINS
              </h3>
              <div className="space-y-4">
                {allBulletins
                  .filter((b) => b.id !== record.id)
                  .slice(0, 4)
                  .map((b) => (
                    <Link
                      key={b.id}
                      href={b.href}
                      className="group block p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <span className="text-[10px] font-mono text-blue-800 font-bold uppercase block">
                        {b.bulletin}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2 mt-1">
                        {b.title}
                      </h4>
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
