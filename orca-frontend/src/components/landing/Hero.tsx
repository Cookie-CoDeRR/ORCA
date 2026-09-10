import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen pt-28 pb-20 flex flex-col justify-between overflow-hidden bg-[#070B14]">
      {/* Background Satellite Imagery — Indian Ocean from Orbit */}
      <Image
        src="/images/landing/hero.jpg"
        alt="Indian Ocean from orbit at night with coastal lights"
        fill
        priority
        quality={85}
        className="object-cover object-center scale-105"
        sizes="100vw"
      />

      {/* Dark editorial vignettes: protects readability while showcasing Earth & city lights */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-transparent to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/90 via-[#070B14]/50 to-transparent" />

      {/* Main Headline Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 sm:pt-14 my-auto">
        <div className="max-w-3xl">
          {/* Subtle Project Identifier Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs mb-6 shadow-xs font-sans">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-medium text-slate-200">
              ORCA · Autonomous Marine Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08] drop-shadow-md font-sans">
            Marine Intelligence <br className="hidden sm:inline" />
            for <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-white">India&apos;s Waters</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow-sm font-sans">
            ORCA combines satellite, oceanographic, and scientific data to help understand fisheries, marine conditions, coastal risks, and ocean dynamics across the Indian Ocean basin.
          </p>

          {/* Exactly Two Primary Actions + Secondary Advisory Link */}
          <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 font-sans">
            <Link
              href="/research/data"
              className="px-6 py-3 rounded-lg bg-[#1F4E8C] hover:bg-[#183E70] text-white font-semibold text-sm transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <span>Explore Ocean Data</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all duration-200 border border-white/20 backdrop-blur-sm"
            >
              Ask ORCA
            </Link>

            <Link
              href="/research/reports"
              className="text-xs sm:text-sm font-medium text-sky-300 hover:text-white transition-colors flex items-center gap-1.5 ml-1"
            >
              <span>View latest advisory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Horizontal Statistics Strip (No cards, thin vertical dividers) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-10 pb-4">
        <div className="border-t border-white/15 pt-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-white">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white">
              7,516 km
            </div>
            <div className="text-xs font-normal text-slate-300 font-sans">
              Coastline monitored
            </div>
          </div>

          <div className="space-y-1 border-l-0 md:border-l border-white/15 md:pl-8">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white">
              1.2M+ km²
            </div>
            <div className="text-xs font-normal text-slate-300 font-sans">
              Maritime area (EEZ)
            </div>
          </div>

          <div className="space-y-1 border-l-0 md:border-l border-white/15 md:pl-8">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-sky-300">
              72 hrs
            </div>
            <div className="text-xs font-normal text-slate-300 font-sans">
              Forecast horizon
            </div>
          </div>

          <div className="space-y-1 border-l-0 md:border-l border-white/15 md:pl-8">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-[#10B981]">
              94.3%
            </div>
            <div className="text-xs font-normal text-slate-300 font-sans">
              Data coverage
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
