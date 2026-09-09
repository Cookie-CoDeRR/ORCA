"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Globe, Sparkles } from "lucide-react";
import ReportView from "@/components/ReportView";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const persona = (searchParams.get("persona") as any) || "navigator";
  const species = searchParams.get("species") || "yellowfin";
  const lat = parseFloat(searchParams.get("lat") || "20.75");
  const lon = parseFloat(searchParams.get("lon") || "70.19");
  const basin = searchParams.get("basin") || "Arabian Sea (Northeastern Basin)";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900">
      {/* Top Header Bar */}
      <header
        className="sticky top-0 z-40 h-16 px-4 sm:px-8 flex items-center justify-between border-b border-zinc-200 bg-white/95 backdrop-blur-xl shadow-xs"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-mono font-bold transition-all hover:bg-zinc-100 text-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-600" />
            <span>Interactive 3D Globe</span>
          </Link>

          <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs text-white shadow-xs">
              O
            </div>
            <span className="font-bold tracking-wider text-sm text-zinc-900 hidden md:inline">
              PROJECT <span className="text-blue-600">ORCA</span>
            </span>
          </div>
        </div>

        {/* Center Title */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Sovereign Ocean Intelligence & PFZ Dossier</span>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard?persona=${persona}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Launch Live Globe</span>
          </Link>
        </div>
      </header>

      {/* Main Report View */}
      <main>
        <ReportView
          persona={persona}
          selectedSpeciesId={species}
          coordinates={{ lat, lon }}
          basinName={basin}
          onBackToGlobe={() => router.push(`/dashboard?persona=${persona}`)}
          showBackToGlobeButton={true}
        />
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs text-blue-600">Loading ORCA Intelligence Dossier...</div>}>
      <ReportContent />
    </Suspense>
  );
}
