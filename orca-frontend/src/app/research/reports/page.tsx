"use client";

import React, { Suspense } from "react";
import ReportView from "@/components/ReportView";

export default function SynthesisStudioPage() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[#f8fafc]">
      <Suspense fallback={<div className="p-8 font-mono text-xs text-blue-600">Loading Synthesis Studio Dossier...</div>}>
        <ReportView
          persona="researcher"
          selectedSpeciesId="yellowfin"
          coordinates={{ lat: 20.75, lon: 70.19 }}
          basinName="Arabian Sea (Northeastern Basin)"
          showBackToGlobeButton={false}
        />
      </Suspense>
    </div>
  );
}
