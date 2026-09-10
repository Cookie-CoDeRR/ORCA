import { Eye, Fish, AlertOctagon, Microscope } from "lucide-react";

export default function WhatOrcaDoes() {
  const capabilities = [
    {
      title: "Ocean Monitoring",
      description: "Continuous real-time ingestion of spaceborne thermal infrared, scatterometer winds, and moored buoy telemetry across India's coastline.",
      icon: Eye,
      tag: "Synoptic",
    },
    {
      title: "Fishing Intelligence",
      description: "High-resolution thermal-chlorophyll frontal intersection mapping for sustainable pelagic harvesting within sovereign EEZ boundaries.",
      icon: Fish,
      tag: "Advisory",
    },
    {
      title: "Marine Hazards",
      description: "Early cyclone intensification detection, high-wave sea-state forecasting, and automated sovereign IMBL geofence standoff alerts.",
      icon: AlertOctagon,
      tag: "Safety",
    },
    {
      title: "Scientific Research",
      description: "Decentralized multi-agent analytical reasoning, open NetCDF-4 schema validation, and academic literature cross-referencing.",
      icon: Microscope,
      tag: "Analysis",
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-[#E1E5EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl pb-10 font-sans">
          <div className="text-xs font-semibold text-[#c25e1a] mb-1">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#202124] tracking-tight">
            What ORCA Does
          </h2>
          <p className="text-sm text-[#667085] mt-2 font-normal leading-relaxed">
            A cohesive autonomous system bridging earth observation data, numerical ocean forecasting, and multi-agent reasoning.
          </p>
        </div>

        {/* Clean 4-Column Minimal Layout (No large cards, crisp thin borders) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
          {capabilities.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="p-6 rounded-lg border border-[#E1E5EA] bg-[#FBFBFC] hover:bg-white hover:border-[#1F4E8C] transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-md bg-[#F0F4FA] text-[#1F4E8C] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-sans font-medium text-[#667085] px-1.5 py-0.5 rounded bg-slate-100">
                    {c.tag}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-[#202124]">
                  {c.title}
                </h3>

                <p className="text-xs text-[#4A5568] leading-relaxed font-normal">
                  {c.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
