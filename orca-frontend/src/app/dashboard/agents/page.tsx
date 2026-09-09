"use client";

import React, { Suspense } from "react";
import AgentTopologyVisualizer from "@/components/AgentTopologyVisualizer";

export default function DashboardAgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-mono text-xs text-blue-600">Initializing ORCA Swarm Topology...</div>}>
      <AgentTopologyVisualizer />
    </Suspense>
  );
}
