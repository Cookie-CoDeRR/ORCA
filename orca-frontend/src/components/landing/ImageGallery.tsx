"use client";
import Image from "next/image";
import Link from "next/link";

const EARTH_SCIENCE_TOPICS = [
  {
    title: "Severe Storms",
    href: "/research",
    src: "/images/landing/nasa-storms.jpg",
    alt: "Astronaut view of massive storm and hurricane eye from International Space Station",
    category: "Atmospheric Science",
    websiteUrl: "https://earthobservatory.nasa.gov/topic/severe-storms",
    websiteName: "nasa.gov",
  },
  {
    title: "Technology and Innovation",
    href: "/agents",
    src: "/images/landing/nasa-tech.jpg",
    alt: "Ocean radar topography and climate satellite orbiting Earth",
    category: "Autonomous Systems",
    websiteUrl: "https://marine.copernicus.eu/",
    websiteName: "copernicus.eu",
  },
  {
    title: "Earth Observatory",
    href: "/research",
    src: "/images/landing/nasa-observatory.jpg",
    alt: "Satellite observation of volcanic caldera and atmospheric plume",
    category: "Remote Sensing",
    websiteUrl: "https://earthobservatory.nasa.gov/",
    websiteName: "nasa.gov",
  },
  {
    title: "Eyes on the Ocean",
    href: "/dashboard",
    src: "/images/landing/nasa-eyes.jpg",
    alt: "Deep space and planetary observation satellite telemetry",
    category: "Real-Time Telemetry",
    websiteUrl: "https://eyes.nasa.gov/apps/earth/",
    websiteName: "nasa.gov",
  },
];

export default function EarthScience() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e03a3e] animate-pulse" />
              <p className="text-[#e03a3e] text-xs font-bold tracking-widest uppercase font-mono">
                OBSERVATIONAL MISSIONS
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-shimmer">
              Earth Science
            </h2>
          </div>
          <Link
            href="/research"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-slate-950 hover:text-[#e03a3e] transition-colors group"
          >
            <span>Discover More</span>
            <span className="w-5 h-5 rounded-full bg-[#e03a3e] text-white flex items-center justify-center text-[10px] group-hover:translate-x-0.5 transition-transform shadow-xs font-bold">
              →
            </span>
          </Link>
        </div>

        {/* 4-Card Vertical Grid (Exact NASA Format with direct links to specific websites) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EARTH_SCIENCE_TOPICS.map((topic, i) => (
            <a
              key={topic.title}
              href={topic.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Visit official ${topic.title} at ${topic.websiteName}`}
              className={`group relative h-[440px] rounded-none sm:rounded-sm overflow-hidden bg-slate-950 block shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in-up stagger-${
                i + 1
              }`}
            >
              {/* Real Background Image */}
              <Image
                src={topic.src}
                alt={topic.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Bottom Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

              {/* Top Source Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                  {topic.category}
                </span>
                <span className="text-[10px] font-mono text-white/80 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  {topic.websiteName} ↗
                </span>
              </div>

              {/* Bottom Title & Red Arrow Button */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest mb-1">
                    OFFICIAL SATELLITE FEED
                  </p>
                  <h3 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-sm group-hover:text-slate-100 transition-colors">
                    {topic.title}
                  </h3>
                </div>
                <span className="w-6 h-6 rounded-full bg-[#e03a3e] text-white flex items-center justify-center text-xs shrink-0 font-bold group-hover:scale-110 group-hover:translate-x-0.5 transition-transform shadow-sm mb-1">
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
