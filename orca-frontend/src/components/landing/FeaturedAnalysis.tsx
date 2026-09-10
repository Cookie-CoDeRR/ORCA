import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GitBranch, Cpu, ShieldCheck } from "lucide-react";

export default function FeaturedAnalysis() {
  return (
    <section className="py-20 bg-[#F6F8FA] border-b border-[#E1E5EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Tag */}
        <div className="text-xs font-semibold text-[#c25e1a] mb-1 font-sans">
          Research Feature
        </div>

        {/* Editorial Split Layout: Left Text & Findings | Right Visual & Agent Mesh */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center font-sans">
          {/* Left Column: Editorial Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#202124] tracking-tight leading-tight">
              Predicting Severe Cyclonic Storms Through Coordinated AI Agents
            </h2>

            <p className="text-sm text-[#4A5568] leading-relaxed font-normal">
              By deploying a decentralized mesh of specialized agents—meteorological boundary solvers, satellite scatterometer analysts, and sea-surface thermal models—ORCA resolves non-linear cyclonic intensification patterns hours ahead of traditional numerical models.
            </p>

            <div className="p-4 rounded-lg bg-white border border-[#E1E5EA] space-y-2">
              <div className="text-xs font-semibold text-[#202124] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#1F4E8C]" />
                <span>Multi-Agent Consensus Architecture</span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed font-normal">
                Four autonomous engines synthesize pressure anomalies, upper-ocean heat content, and GFS/ECMWF atmospheric vectors into an operational maritime landfall probability cone.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/research/reports"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1F4E8C] hover:bg-[#183E70] text-white text-xs font-semibold transition"
              >
                <span>Read full analysis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Diagram / Storm Track & Multi-Agent Flow */}
          <div className="lg:col-span-6">
            <div className="relative rounded-xl overflow-hidden border border-[#E1E5EA] bg-slate-900 shadow-sm">
              <div className="relative h-72 sm:h-84 w-full">
                <Image
                  src="/images/landing/feature-story.jpg"
                  alt="Multi-agent cyclone prediction trajectory over the Bay of Bengal"
                  fill
                  quality={80}
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Overlaid Agent Node Visualizer */}
                <div className="absolute bottom-4 left-4 right-4 space-y-2 text-[11px] text-white font-sans">
                  <div className="flex items-center justify-between pb-1 border-b border-white/20">
                    <span className="text-sky-300 font-semibold">Consensus Verified (94.3%)</span>
                    <span className="text-slate-300 text-[10px]">Odisha-Andhra Coast</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-1.5 rounded bg-black/50 backdrop-blur-xs border border-white/10">
                      SST Agent: <span className="font-mono text-cyan-300">29.8°C</span> heat engine
                    </div>
                    <div className="p-1.5 rounded bg-black/50 backdrop-blur-xs border border-white/10">
                      Wind Agent: <span className="font-mono text-cyan-300">65 kt</span> shear barrier
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Horizontal Analysis Metrics Strip */}
        <div className="mt-12 pt-8 border-t border-[#E1E5EA] grid grid-cols-2 sm:grid-cols-4 gap-6 text-center font-sans">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-[#1F4E8C]">
              32 hrs
            </div>
            <div className="text-xs font-normal text-[#667085]">
              Advance indication
            </div>
          </div>

          <div className="space-y-1 border-l-0 sm:border-l border-[#E1E5EA] sm:pl-6">
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-[#202124]">
              3.2M
            </div>
            <div className="text-xs font-normal text-[#667085]">
              Ocean observations
            </div>
          </div>

          <div className="space-y-1 border-l-0 sm:border-l border-[#E1E5EA] sm:pl-6">
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-[#137333]">
              94.3%
            </div>
            <div className="text-xs font-normal text-[#667085]">
              Model agreement
            </div>
          </div>

          <div className="space-y-1 border-l-0 sm:border-l border-[#E1E5EA] sm:pl-6">
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-[#E87524]">
              4
            </div>
            <div className="text-xs font-normal text-[#667085]">
              Specialist agents
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
