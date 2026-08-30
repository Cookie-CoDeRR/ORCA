"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  CloudRain,
  Waves,
  Mountain,
  Fish,
  Navigation,
  ShieldAlert,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Info,
  X,
} from "lucide-react";

export interface LayerVisibility {
  weather: boolean;
  currents: boolean;
  resources: boolean;
  fishingZones: boolean;
  transport: boolean;
  military: boolean;
}

interface LayerDef {
  id: keyof LayerVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;           // dot / swatch color (Tailwind bg-*)
  swatchStyle: "dot" | "line";
  requiresDefense?: boolean;
}

const LAYER_DEFS: LayerDef[] = [
  {
    id: "weather",
    label: "Weather & Atmosphere",
    description: "Sea Surface Temperature (SST) thermal gradient heatmap, significant wave height, and IMD cyclone alert zones.",
    icon: CloudRain,
    color: "bg-sky-400",
    swatchStyle: "dot",
  },
  {
    id: "currents",
    label: "Water Currents & Hydrodynamics",
    description: "Eulerian ocean current vector arrows (uo, vo), mesoscale eddy assist paths, and monsoon gyre drift markers.",
    icon: Waves,
    color: "bg-cyan-300",
    swatchStyle: "line",
  },
  {
    id: "resources",
    label: "Ocean Resources & Bathymetry",
    description: "3D seabed elevation relief, 200m continental shelf break contours, coral reef protected boundaries, and benthic mineral indicators.",
    icon: Mountain,
    color: "bg-amber-400",
    swatchStyle: "dot",
  },
  {
    id: "fishingZones",
    label: "Potential Fishing Zones (PFZ)",
    description: "AI-detected thermal front and chlorophyll-a aggregation zones with species confidence scores and diurnal feeding window timing.",
    icon: Fish,
    color: "bg-emerald-400",
    swatchStyle: "dot",
  },
  {
    id: "transport",
    label: "Transport Routes & Logistics",
    description: "Fuel-optimal continuous A* vector route with waypoint nodes, projected transit time, and coastal harbor clearance SOPs.",
    icon: Navigation,
    color: "bg-white",
    swatchStyle: "line",
  },
  {
    id: "military",
    label: "Military / Defense Overlays",
    description: "RESTRICTED: IMBL sovereign border standoff buffer, no-trawl/EEZ geofence violations, and dark vessel drift intercept vector projections.",
    icon: ShieldAlert,
    color: "bg-rose-500",
    swatchStyle: "line",
    requiresDefense: true,
  },
];

interface LayerControlPanelProps {
  visibility: LayerVisibility;
  onToggle: (id: keyof LayerVisibility) => void;
  isDefenseUser?: boolean;
}

export default function LayerControlPanel({
  visibility,
  onToggle,
  isDefenseUser = false,
}: LayerControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const activeCount = Object.values(visibility).filter(Boolean).length;

  return (
    <div className="relative z-30">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-xl backdrop-blur-md transition-all cursor-pointer text-xs font-semibold ${
          isOpen
            ? "bg-white text-black border-white"
            : "bg-zinc-950/90 text-white border-white/15 hover:border-white/40"
        }`}
        title="Toggle Map Layers"
      >
        <Layers className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Layers</span>
        {activeCount > 0 && (
          <span
            className={`flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold ${
              isOpen ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 w-72 rounded-2xl border border-white/15 bg-zinc-950/98 shadow-2xl backdrop-blur-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-white" />
                <span className="text-xs font-bold text-white">Map Layer Controls</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Layer Rows */}
            <div className="p-2 space-y-1">
              {LAYER_DEFS.map((layer) => {
                const Icon = layer.icon;
                const isOn = visibility[layer.id];
                const isLocked = layer.requiresDefense && !isDefenseUser;

                return (
                  <div
                    key={layer.id}
                    className={`group relative flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      isLocked
                        ? "opacity-50 cursor-not-allowed"
                        : isOn
                        ? "bg-white/8 border border-white/10 cursor-pointer"
                        : "cursor-pointer hover:bg-white/5"
                    }`}
                    onClick={() => !isLocked && onToggle(layer.id)}
                  >
                    {/* Color Swatch */}
                    <div className="shrink-0 flex items-center justify-center w-6">
                      {layer.swatchStyle === "dot" ? (
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${layer.color} ${
                            isOn ? "ring-2 ring-white/20" : "opacity-40"
                          }`}
                        />
                      ) : (
                        <span
                          className={`h-1 w-5 rounded-full ${layer.color} ${
                            isOn ? "opacity-100" : "opacity-30"
                          }`}
                        />
                      )}
                    </div>

                    {/* Icon & Label */}
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isLocked
                          ? "text-zinc-500"
                          : isOn
                          ? "text-white"
                          : "text-zinc-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-semibold truncate ${
                            isLocked ? "text-zinc-500" : isOn ? "text-white" : "text-zinc-400"
                          }`}
                        >
                          {layer.label}
                        </span>
                        {isLocked && (
                          <Lock className="h-2.5 w-2.5 text-rose-400 shrink-0" />
                        )}
                        {layer.requiresDefense && isDefenseUser && (
                          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                            DEFENSE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div
                      className={`shrink-0 relative flex items-center h-5 w-9 rounded-full transition-colors ${
                        isLocked
                          ? "bg-zinc-800"
                          : isOn
                          ? "bg-white"
                          : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`absolute h-3.5 w-3.5 rounded-full shadow transition-all ${
                          isLocked
                            ? "bg-zinc-600 left-[2px]"
                            : isOn
                            ? "bg-black left-[calc(100%-16px)]"
                            : "bg-zinc-400 left-[2px]"
                        }`}
                      />
                    </div>

                    {/* Info Tooltip Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTooltip(tooltip === layer.id ? null : layer.id);
                      }}
                      className="shrink-0 text-zinc-600 hover:text-zinc-300 transition cursor-pointer"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tooltip Info Box */}
            <AnimatePresence>
              {tooltip && (
                <motion.div
                  key={tooltip}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/10 px-4 py-3 text-[11px] text-zinc-300 leading-relaxed bg-black/40"
                >
                  <strong className="text-white text-xs block mb-0.5">
                    {LAYER_DEFS.find((l) => l.id === tooltip)?.label}
                  </strong>
                  {LAYER_DEFS.find((l) => l.id === tooltip)?.description}
                  {LAYER_DEFS.find((l) => l.id === tooltip)?.requiresDefense && !isDefenseUser && (
                    <p className="mt-1.5 text-rose-400 font-semibold">
                      🔒 Requires Defense / Coast Guard authentication.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-white/10 text-[10px] text-zinc-500 font-mono">
              {isDefenseUser
                ? "Defense clearance active — all layers unlocked."
                : "Military layer requires Defense portal login."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
