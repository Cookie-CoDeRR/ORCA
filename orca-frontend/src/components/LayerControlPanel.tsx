"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Globe,
  Thermometer,
  Fish,
  Wind,
  Mountain,
  ShieldAlert,
  Ship,
  Navigation,
  LayoutGrid,
  Grid,
  ChevronDown,
  Info,
  X,
  Lock,
  Sliders,
  Waves,
} from "lucide-react";

// ─── Types & Definitions ──────────────────────────────────────────────────────

export interface BaseLayerDef {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // Color indicator dot
  rangeText: string;
}

export interface OverlayDef {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiresDefense?: boolean;
}

export const BASE_LAYERS: BaseLayerDef[] = [
  {
    id: "natural_satellite",
    label: "Natural Satellite",
    subtitle: "NASA Blue Marble True-Color Bedrock",
    icon: Globe,
    color: "bg-blue-500",
    rangeText: "Visible Spectrum Bedrock",
  },
  {
    id: "sst_thermal",
    label: "SST Thermal Raster",
    subtitle: "Sea Surface Temp & Coastal Thermal Fronts",
    icon: Thermometer,
    color: "bg-amber-500",
    rangeText: "24.0°C – 32.5°C Envelope",
  },
  {
    id: "chlorophyll_plumes",
    label: "Chlorophyll-a Plumes",
    subtitle: "OceanSat-3 OCM Phytoplankton Bloom Density",
    icon: Fish,
    color: "bg-emerald-500",
    rangeText: "0.08 – 4.80 mg/m³ Upwelling",
  },
  {
    id: "currents_velocity",
    label: "Currents Velocity Heatmap",
    subtitle: "Eulerian Hydrodynamic Velocity Field (uo, vo)",
    icon: Wind,
    color: "bg-sky-500",
    rangeText: "0.15 – 2.05 m/s Somali Jet Drift",
  },
  {
    id: "bathymetric_depth",
    label: "Bathymetric Depth Relief",
    subtitle: "GEBCO Seafloor Topography & Shelf Break",
    icon: Mountain,
    color: "bg-indigo-500",
    rangeText: "0m – 4,500m Abyssal Plain",
  },
];

export const DIRECT_OVERLAYS: OverlayDef[] = [
  {
    id: "pfz_hotspots",
    label: "PFZ Hotspots",
    subtitle: "14 INCOIS Verified Fish Clusters & Confidence",
    icon: Fish,
    color: "bg-amber-400",
  },
  {
    id: "imbl_sovereign",
    label: "IMBL Sovereign Zone",
    subtitle: "Border Standoff & 5nm Safety Buffer",
    icon: ShieldAlert,
    color: "bg-rose-500",
    requiresDefense: true,
  },
  {
    id: "ais_fleet",
    label: "AIS Vessel Fleet",
    subtitle: "Real-Time Fleet AIS & Kinematic Courses",
    icon: Ship,
    color: "bg-sky-400",
  },
  {
    id: "optimal_route",
    label: "Optimal Route Line",
    subtitle: "Hydrodynamic Fuel-Efficient A* Path",
    icon: Navigation,
    color: "bg-blue-600",
  },
  {
    id: "ocean_currents",
    label: "Online Ocean Currents Map",
    subtitle: "Dedicated Hydrodynamic Current & Circulation Service",
    icon: Waves,
    color: "bg-cyan-500",
  },
  {
    id: "tactical_mesh",
    label: "Tactical Mesh (5x5 km)",
    subtitle: "Geodetic Sector Grid with Reticle Lock",
    icon: LayoutGrid,
    color: "bg-zinc-800",
  },
  {
    id: "graticule",
    label: "Global Graticule",
    subtitle: "15° Spherical Lat/Lon Parallels & Meridians",
    icon: Grid,
    color: "bg-slate-400",
  },
];

export interface LayerControlPanelProps {
  /** Mutually exclusive environmental base layer */
  activeBaseLayer?: string;
  onSelectBaseLayer?: (layerId: string) => void;

  /** Additively stackable vector overlays (Set or Array of overlay IDs) */
  activeOverlays?: Set<string> | string[];
  onToggleOverlay?: (overlayId: string) => void;

  /** Global Sensor Threshold Filters */
  sstRange?: [number, number];
  onSstRangeChange?: (range: [number, number]) => void;
  waveMax?: number;
  onWaveMaxChange?: (val: number) => void;

  /** User Defense clearance */
  isDefenseUser?: boolean;

  /** Legacy toggle callbacks for backwards compatibility */
  visibility?: Record<string, boolean>;
  onToggle?: (id: string) => void;
}

export default function LayerControlPanel({
  activeBaseLayer = "natural_satellite",
  onSelectBaseLayer,
  activeOverlays = new Set([
    "pfz_hotspots",
    "imbl_sovereign",
    "ais_fleet",
    "optimal_route",
    "tactical_mesh",
  ]),
  onToggleOverlay,
  sstRange = [24, 32],
  onSstRangeChange,
  waveMax = 4.0,
  onWaveMaxChange,
  isDefenseUser = true,
  visibility,
  onToggle,
}: LayerControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  // Convert activeOverlays to a Set for O(1) checks
  const overlaySet = React.useMemo(() => {
    if (activeOverlays instanceof Set) return activeOverlays;
    if (Array.isArray(activeOverlays)) return new Set(activeOverlays);
    return new Set<string>();
  }, [activeOverlays]);

  // Normalize base layer string
  const currentBase = React.useMemo(() => {
    if (activeBaseLayer === "none" || activeBaseLayer === "natural_satellite") return "natural_satellite";
    if (activeBaseLayer === "sst") return "sst_thermal";
    if (activeBaseLayer === "chlorophyll") return "chlorophyll_plumes";
    if (activeBaseLayer === "currents") return "currents_velocity";
    if (activeBaseLayer === "bathymetry") return "bathymetric_depth";
    return activeBaseLayer;
  }, [activeBaseLayer]);

  const handleBaseClick = (id: string) => {
    if (onSelectBaseLayer) {
      onSelectBaseLayer(id);
    } else if (onToggle) {
      onToggle(id);
    }
  };

  const handleOverlayToggle = (id: string) => {
    if (onToggleOverlay) {
      onToggleOverlay(id);
    } else if (onToggle) {
      onToggle(id);
    }
  };

  const activeOverlayCount = overlaySet.size;
  const isBaseActive = currentBase !== "natural_satellite";
  const totalActive = activeOverlayCount + (isBaseActive ? 1 : 0);

  return (
    <div className="relative z-30">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border shadow-sm transition-all cursor-pointer text-xs font-semibold ${
          isOpen
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50"
        }`}
        title="Toggle Map Layers & Overlays"
      >
        <Layers className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="hidden sm:inline">Layers Control</span>
        {totalActive > 0 && (
          <span
            className={`flex items-center justify-center h-4.5 w-4.5 rounded-full text-[10px] font-mono font-bold ${
              isOpen ? "bg-white text-zinc-900" : "bg-blue-600 text-white"
            }`}
          >
            {totalActive}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Control Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 sm:left-auto sm:right-0 top-12 w-80 max-h-[75vh] rounded-2xl border border-zinc-200 bg-white shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col z-40"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 shrink-0 bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-zinc-900">Tactical Layer Controls</div>
                  <div className="text-[9px] font-mono text-zinc-500">Mutually Exclusive Base & Additive Vector Overlays</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 transition cursor-pointer p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Layer Stack */}
            <div className="p-3 space-y-4 overflow-y-auto flex-1">
              
              {/* ── SECTION 1: ENVIRONMENTAL LAYERS (MUTUALLY EXCLUSIVE RADIO LOGIC) ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    1. Environmental Base Layers (Mutually Exclusive)
                  </span>
                  <span className="text-[9px] font-mono text-blue-600 font-semibold">1 Active</span>
                </div>

                <div className="space-y-1">
                  {BASE_LAYERS.map((base) => {
                    const Icon = base.icon;
                    const isSelected = currentBase === base.id;

                    return (
                      <button
                        key={base.id}
                        type="button"
                        onClick={() => handleBaseClick(base.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/80 border-blue-200 text-zinc-900 shadow-xs"
                            : "bg-white hover:bg-zinc-50 border-zinc-200/80 text-zinc-600"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {/* Radio Button Circle Indicator */}
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-zinc-300 bg-white group-hover:border-zinc-400"
                            }`}
                          >
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-semibold truncate ${isSelected ? "text-zinc-900" : "text-zinc-700"}`}>
                                {base.label}
                              </span>
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${base.color}`} />
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono truncate leading-tight">
                              {base.subtitle}
                            </div>
                          </div>
                        </div>

                        {/* Range Badge */}
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 shrink-0 border border-zinc-200">
                          {base.rangeText.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 2: DIRECT MAP OVERLAYS (ADDITIVELY STACKABLE TOGGLE LOGIC) ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1 pt-2 border-t border-zinc-100">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    2. Direct Map Overlays (Additive Stackable)
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 font-semibold">{activeOverlayCount} Active</span>
                </div>

                <div className="space-y-1">
                  {DIRECT_OVERLAYS.map((overlay) => {
                    const Icon = overlay.icon;
                    const isToggled = overlaySet.has(overlay.id);
                    const isLocked = overlay.requiresDefense && !isDefenseUser;

                    return (
                      <div
                        key={overlay.id}
                        onClick={() => !isLocked && handleOverlayToggle(overlay.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                          isLocked
                            ? "opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50"
                            : isToggled
                            ? "bg-zinc-50 border-zinc-300 text-zinc-900 cursor-pointer"
                            : "bg-white hover:bg-zinc-50/70 border-zinc-200/70 text-zinc-600 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <Icon className={`h-4 w-4 shrink-0 ${isToggled ? "text-zinc-900" : "text-zinc-400"}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-medium truncate ${isToggled ? "text-zinc-900 font-semibold" : "text-zinc-700"}`}>
                                {overlay.label}
                              </span>
                              {isLocked && <Lock className="h-3 w-3 text-rose-500 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate leading-tight font-mono">
                              {overlay.subtitle}
                            </div>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) handleOverlayToggle(overlay.id);
                          }}
                          className={`relative h-4.5 w-8 rounded-full transition-colors duration-150 shrink-0 cursor-pointer ${
                            isToggled ? "bg-zinc-900" : "bg-zinc-200"
                          }`}
                        >
                          <span
                            className="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-all duration-150"
                            style={{ left: isToggled ? "calc(100% - 16px)" : "2px" }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 3: SENSOR THRESHOLDS (GLOBAL MODIFIER SLIDERS) ── */}
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="h-3 w-3 text-zinc-500" /> 3. Sensor Thresholds (Global Filters)
                  </span>
                </div>

                <div className="space-y-3 bg-zinc-50/70 p-2.5 rounded-xl border border-zinc-200/80">
                  {/* SST Range Slider */}
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span>SST Filter Range</span>
                      <span className="text-zinc-900 font-bold">{sstRange[0]}°C – {sstRange[1]}°C</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={35}
                      step={0.5}
                      value={sstRange[1]}
                      onChange={(e) => onSstRangeChange && onSstRangeChange([sstRange[0], Number(e.target.value)])}
                      className="w-full h-1.5 rounded-full appearance-none bg-zinc-200 cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Wave Max SWH Slider */}
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span>Max SWH (Swell Cap)</span>
                      <span className="text-zinc-900 font-bold">{waveMax}m</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={0.5}
                      value={waveMax}
                      onChange={(e) => onWaveMaxChange && onWaveMaxChange(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none bg-zinc-200 cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-zinc-100 text-[10px] text-zinc-400 font-mono bg-zinc-50/60 flex items-center justify-between">
              <span>ORCA Layer Engine v2.4</span>
              <span className="text-emerald-600 font-semibold">100% Real-Time WebGL</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
