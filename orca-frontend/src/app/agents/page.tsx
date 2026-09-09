"use client";

import React, { Suspense } from "react";
import AgentTopologyVisualizer from "@/components/AgentTopologyVisualizer";

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-mono text-xs text-blue-600">Loading Swarm Engine...</div>}>
      <AgentTopologyVisualizer />
    </Suspense>
  );
}
