"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import DeckGL from "@deck.gl/react";
import { PolygonLayer, GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import Map from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  Layers,
  MapPin,
  Compass,
  Calendar,
  Search,
  Eye,
  Sliders,
  Maximize2,
  Minimize2,
  Check,
  Info,
  ShieldCheck,
  ArrowRight,
  Fish,
  Thermometer,
  FlaskConical,
  Waves,
  Wind,
  Navigation,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import {
  REGION_PRESETS,
  generateSpatialGrid,
  sampleOceanParameters,
  INCOIS_PFZ_FEATURES,
  MARITIME_BOUNDARIES_GEOJSON,
  MOORED_BUOYS,
  getSSTColor,
  getChlColor,
  getWaveColor,
  OceanObservation,
  SpatialGridCell,
} from "@/lib/spatialLayers";

// Clean Light Scientific Basemap (CARTO Positron)
const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export default function SpatialCanvasPage() {
  // View State (Default to Northeastern Arabian Sea)
  const [viewState, setViewState] = useState({
    longitude: 70.368,
    latitude: 20.902,
    zoom: 6.5,
    pitch: 0,
    bearing: 0,
  });

  // Layer Visibility State
  const [showSST, setShowSST] = useState<boolean>(true);
  const [showChl, setShowChl] = useState<boolean>(false);
  const [showWaves, setShowWaves] = useState<boolean>(false);
  const [showPFZ, setShowPFZ] = useState<boolean>(true);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showBuoys, setShowBuoys] = useState<boolean>(true);

  // Layer Opacity Controls
  const [rasterOpacity, setRasterOpacity] = useState<number>(0.65);

  // Selected Location / Inspector State
  const [selectedLocation, setSelectedLocation] = useState<OceanObservation>(() =>
    sampleOceanParameters(20.902, 70.368)
  );

  // Coordinate Search Input
  const [coordSearch, setCoordSearch] = useState<string>("");
  const [activeRegionId, setActiveRegionId] = useState<string>("arabian_sea");
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Precomputed Spatial Grid Cells
  const gridCells: SpatialGridCell[] = useMemo(() => generateSpatialGrid(), []);

  // Handle Region Jump
  const handleRegionChange = (regionId: string) => {
    setActiveRegionId(regionId);
    const preset = REGION_PRESETS.find((r) => r.id === regionId);
    if (preset) {
      setViewState((prev) => ({
        ...prev,
        longitude: preset.center[0],
        latitude: preset.center[1],
        zoom: preset.zoom,
        transitionDuration: 800,
      }));
      // Sample center
      setSelectedLocation(sampleOceanParameters(preset.center[1], preset.center[0]));
    }
  };

  // Handle Coordinate Search
  const handleCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordSearch.trim()) return;
    const parts = coordSearch.split(/[\s,]+/);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        setViewState((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          zoom: 7.5,
          transitionDuration: 800,
        }));
        setSelectedLocation(sampleOceanParameters(lat, lon));
      }
    }
  };

  // Map Click Handler
  const handleMapClick = useCallback((info: any) => {
    if (info.coordinate) {
      const [lon, lat] = info.coordinate;
      const observation = sampleOceanParameters(lat, lon);
      setSelectedLocation(observation);
    }
  }, []);

  // Deck.gl Layer Pipeline
  const layers = useMemo(() => {
    const list: any[] = [];

    // 1. SST Thermal Grid Layer
    if (showSST) {
      list.push(
        new PolygonLayer({
          id: "sst-raster-layer",
          data: gridCells,
          getPolygon: (d: SpatialGridCell) => d.polygon,
          getFillColor: (d: SpatialGridCell) => getSSTColor(d.sst),
          getLineColor: [255, 255, 255, 20],
          lineWidthMinPixels: 0.5,
          opacity: rasterOpacity,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 80],
        })
      );
    }

    // 2. Chlorophyll-a Biomass Grid Layer
    if (showChl) {
      list.push(
        new PolygonLayer({
          id: "chl-raster-layer",
          data: gridCells,
          getPolygon: (d: SpatialGridCell) => d.polygon,
          getFillColor: (d: SpatialGridCell) => getChlColor(d.chl),
          getLineColor: [255, 255, 255, 20],
          lineWidthMinPixels: 0.5,
          opacity: rasterOpacity * 0.9,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 80],
        })
      );
    }

    // 3. Significant Wave Height Layer
    if (showWaves) {
      list.push(
        new PolygonLayer({
          id: "waves-raster-layer",
          data: gridCells,
          getPolygon: (d: SpatialGridCell) => d.polygon,
          getFillColor: (d: SpatialGridCell) => getWaveColor(d.swh),
          getLineColor: [255, 255, 255, 20],
          lineWidthMinPixels: 0.5,
          opacity: rasterOpacity * 0.85,
          pickable: true,
        })
      );
    }

    // 4. Maritime Boundaries (EEZ & IMBL)
    if (showBoundaries) {
      list.push(
        new GeoJsonLayer({
          id: "maritime-boundaries-layer",
          data: MARITIME_BOUNDARIES_GEOJSON as any,
          filled: false,
          stroked: true,
          lineWidthMinPixels: 2,
          getLineColor: (f: any) =>
            f.properties.type === "IMBL" ? [220, 38, 38, 240] : [31, 78, 140, 200],
          getLineDashArray: (f: any) =>
            f.properties.type === "IMBL" ? [4, 2] : [8, 4],
          dashJustified: true,
          pickable: true,
        })
      );
    }

    // 5. INCOIS PFZ Advisories
    if (showPFZ) {
      list.push(
        new GeoJsonLayer({
          id: "incois-pfz-lines",
          data: INCOIS_PFZ_FEATURES as any,
          filled: false,
          stroked: true,
          lineWidthMinPixels: 3,
          getLineColor: [232, 117, 36, 240], // ORCA Orange
          pickable: true,
          autoHighlight: true,
        })
      );
    }

    // 6. Moored Buoy Stations
    if (showBuoys) {
      list.push(
        new ScatterplotLayer({
          id: "moored-buoys-layer",
          data: MOORED_BUOYS,
          getPosition: (d: any) => d.coordinates,
          getRadius: 7000,
          radiusMinPixels: 5,
          radiusMaxPixels: 10,
          getFillColor: [34, 139, 90, 240], // Green
          getLineColor: [255, 255, 255, 255],
          lineWidthMinPixels: 2,
          stroked: true,
          pickable: true,
        })
      );
    }

    // 7. Selected Coordinate Pin
    list.push(
      new ScatterplotLayer({
        id: "selected-location-pin",
        data: [{ coordinates: [selectedLocation.lon, selectedLocation.lat] }],
        getPosition: (d: any) => d.coordinates,
        getRadius: 8000,
        radiusMinPixels: 7,
        radiusMaxPixels: 14,
        getFillColor: [232, 117, 36, 255], // Orange
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2.5,
        stroked: true,
      })
    );

    return list;
  }, [showSST, showChl, showWaves, showBoundaries, showPFZ, showBuoys, rasterOpacity, gridCells, selectedLocation]);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#F6F8FA] text-[#202124] overflow-hidden font-sans select-none flex flex-col">
      
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TOP CONTROL STRIP                                                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <header className="h-14 shrink-0 bg-white border-b border-[#E1E5EA] px-4 flex items-center justify-between gap-3 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-[#E87524] uppercase tracking-wider">SPATIAL</span>
            <span className="text-[#98A2B3]">/</span>
            <span className="font-bold text-[#202124]">Marine Spatial Canvas</span>
          </div>
          <span className="hidden lg:inline text-xs text-[#667085]">
            2D geospatial analysis workspace
          </span>
        </div>

        {/* Center: Basin Jump & Search */}
        <div className="flex items-center gap-2">
          {/* Region Preset Selector */}
          <select
            value={activeRegionId}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#E1E5EA] bg-[#F6F8FA] text-xs font-medium text-[#202124] outline-none cursor-pointer hover:bg-white shadow-xs"
          >
            {REGION_PRESETS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Coordinate Search */}
          <form onSubmit={handleCoordSubmit} className="hidden sm:flex items-center relative">
            <input
              type="text"
              value={coordSearch}
              onChange={(e) => setCoordSearch(e.target.value)}
              placeholder="Lat, Lon (e.g. 20.9, 70.3)"
              className="w-44 px-2.5 py-1.5 text-xs font-mono rounded-md border border-[#E1E5EA] bg-[#F6F8FA] focus:bg-white focus:border-[#1F4E8C] outline-none shadow-xs"
            />
          </form>

          {/* Observation Cycle Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] font-mono text-[#228B5A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#228B5A]" />
            <span>Cycle: 10 Sep 06:00 IST</span>
          </div>
        </div>

        {/* Panel Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setIsLayerPanelOpen((v) => !v)}
            className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
              isLayerPanelOpen
                ? "bg-[#F0F4FA] text-[#1F4E8C] border-[#CBD5E1] font-semibold"
                : "bg-white text-[#667085] border-[#E1E5EA] hover:bg-[#F6F8FA]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Layers</span>
          </button>

          <button
            onClick={() => setIsInspectorOpen((v) => !v)}
            className={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
              isInspectorOpen
                ? "bg-[#F0F4FA] text-[#1F4E8C] border-[#CBD5E1] font-semibold"
                : "bg-white text-[#667085] border-[#E1E5EA] hover:bg-[#F6F8FA]"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MAIN 2D MAP WORKSPACE (DECK.GL + MAPLIBRE)                            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        
        {/* Deck.GL Canvas */}
        <DeckGL
          viewState={viewState}
          onViewStateChange={(e: any) => setViewState(e.viewState)}
          controller={{ doubleClickZoom: true, dragPan: true, scrollZoom: true }}
          layers={layers}
          onClick={handleMapClick}
          getCursor={({ isHovering }) => (isHovering ? "pointer" : "crosshair")}
          style={{ width: "100%", height: "100%" }}
        >
          <Map
            mapLib={maplibregl}
            mapStyle={BASEMAP_STYLE}
            reuseMaps={true}
            attributionControl={false}
          />
        </DeckGL>

        {/* ─── LEFT LAYER PANEL (COLLAPSIBLE) ─────────────────────────────────── */}
        {isLayerPanelOpen && (
          <div className="absolute top-4 left-4 z-20 w-72 max-h-[calc(100%-2rem)] bg-white/95 backdrop-blur-md rounded-lg border border-[#E1E5EA] shadow-lg flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="p-3.5 border-b border-[#E1E5EA] flex items-center justify-between bg-[#F6F8FA]">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#1F4E8C]" />
                <span className="text-xs font-bold text-[#202124]">Ocean & Marine Layers</span>
              </div>
              <button
                onClick={() => setIsLayerPanelOpen(false)}
                className="text-[#667085] hover:text-[#202124]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
              
              {/* Category: Ocean Conditions */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] font-bold block">
                  OCEAN CONDITIONS
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-[#F6F8FA] cursor-pointer">
                    <span className="flex items-center gap-2 font-medium text-[#202124]">
                      <Thermometer className="h-3.5 w-3.5 text-[#E87524]" />
                      <span>Sea Surface Temperature</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showSST}
                      onChange={(e) => setShowSST(e.target.checked)}
                      className="accent-[#1F4E8C]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-[#F6F8FA] cursor-pointer">
                    <span className="flex items-center gap-2 font-medium text-[#202124]">
                      <FlaskConical className="h-3.5 w-3.5 text-[#10B981]" />
                      <span>Chlorophyll-a Biomass</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showChl}
                      onChange={(e) => setShowChl(e.target.checked)}
                      className="accent-[#1F4E8C]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-[#F6F8FA] cursor-pointer">
                    <span className="flex items-center gap-2 font-medium text-[#202124]">
                      <Waves className="h-3.5 w-3.5 text-[#3B82F6]" />
                      <span>Significant Wave Height</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showWaves}
                      onChange={(e) => setShowWaves(e.target.checked)}
                      className="accent-[#1F4E8C]"
                    />
                  </label>
                </div>
              </div>

              {/* Category: Fisheries */}
              <div className="space-y-2 pt-2 border-t border-[#E1E5EA]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] font-bold block">
                  FISHERIES ADVISORY
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-[#F6F8FA] cursor-pointer">
                    <span className="flex items-center gap-2 font-medium text-[#202124]">
                      <Fish className="h-3.5 w-3.5 text-[#E87524]" />
                      <span>INCOIS Potential Fishing Zones</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showPFZ}
                      onChange={(e) => setShowPFZ(e.target.checked)}
                      className="accent-[#1F4E8C]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-[#F6F8FA] cursor-pointer">
                    <span className="flex items-center gap-2 font-medium text-[#202124]">
                      <span className="h-2 w-2 rounded-full bg-[#228B5A]" />
                      <span>Moored Ocean Buoy Array</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showBuoys}
                      onChange={(e) => setShowBuoys(e.target.checked)}
                      className="accent-[#1F4E8C]"
                    />
                  </label>
                </div>
              </div>

              {/* Category: Boundaries */}
              <div className="space-y-2 pt-2 border-t border-[#E1E5EA]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] font-bold block">
                  MARITIME JURISDICTION
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-[#F6F8FA] cursor-pointer">
                    <span className="flex items-center gap-2 font-medium text-[#202124]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#1F4E8C]" />
                      <span>200 NM EEZ & IMBL Borders</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showBoundaries}
                      onChange={(e) => setShowBoundaries(e.target.checked)}
                      className="accent-[#1F4E8C]"
                    />
                  </label>
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="pt-2 border-t border-[#E1E5EA] space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-[#667085]">
                  <span>Layer Opacity</span>
                  <span className="text-[#202124] font-bold">{Math.round(rasterOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={rasterOpacity}
                  onChange={(e) => setRasterOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#E1E5EA] rounded-lg appearance-none cursor-pointer accent-[#1F4E8C]"
                />
              </div>

              {/* Dynamic Legend */}
              <div className="p-2.5 rounded-md bg-[#FBFBFC] border border-[#E1E5EA] space-y-2 text-[11px]">
                <span className="font-bold text-[#202124] block uppercase text-[10px] font-mono">
                  ACTIVE SCIENTIFIC LEGEND
                </span>
                
                {showSST && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#667085]">
                      <span>SST: 24.0°C</span>
                      <span>28.0°C</span>
                      <span>31.0°C</span>
                    </div>
                    <div className="h-2 w-full rounded bg-gradient-to-r from-blue-600 via-amber-500 to-red-600" />
                  </div>
                )}

                {showChl && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#667085]">
                      <span>Chl-a: 0.1 mg/m³</span>
                      <span>1.2 mg/m³</span>
                      <span>2.5 mg/m³</span>
                    </div>
                    <div className="h-2 w-full rounded bg-gradient-to-r from-emerald-200 via-emerald-500 to-emerald-800" />
                  </div>
                )}

                {showPFZ && (
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#202124]">
                    <span className="h-1 w-6 rounded bg-[#E87524]" />
                    <span>INCOIS PFZ Convergence Front</span>
                  </div>
                )}

                {showBoundaries && (
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#202124]">
                    <span className="h-0.5 w-6 border-b-2 border-dashed border-red-600" />
                    <span>International Maritime Boundary (IMBL)</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ─── RIGHT INSPECTOR PANEL (COLLAPSIBLE) ─────────────────────────────── */}
        {isInspectorOpen && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-white/95 backdrop-blur-md rounded-lg border border-[#E1E5EA] shadow-lg flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="p-3.5 border-b border-[#E1E5EA] flex items-center justify-between bg-[#F6F8FA]">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#E87524]" />
                <span className="text-xs font-bold text-[#202124]">Cell Inspector</span>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-[#667085] hover:text-[#202124]"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Coordinates Readout */}
              <div className="p-3 rounded-md bg-[#F0F4FA] border border-[#CBD5E1] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#667085] block font-semibold">
                  SELECTED COORDINATES
                </span>
                <div className="text-sm font-mono font-bold text-[#1F4E8C] flex items-center justify-between">
                  <span>{selectedLocation.lat.toFixed(3)}°N, {selectedLocation.lon.toFixed(3)}°E</span>
                </div>
                <div className="text-[11px] text-[#202124] font-sans">
                  {selectedLocation.region}
                </div>
              </div>

              {/* Sampled Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] block uppercase">SST (1m)</span>
                  <strong className="text-sm text-[#202124]">{selectedLocation.sst} °C</strong>
                </div>

                <div className="p-2.5 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] block uppercase">Chlorophyll-a</span>
                  <strong className="text-sm text-[#10B981]">{selectedLocation.chlorophyll} mg/m³</strong>
                </div>

                <div className="p-2.5 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] block uppercase">Wave Height</span>
                  <strong className="text-sm text-[#3B82F6]">{selectedLocation.swh} m</strong>
                </div>

                <div className="p-2.5 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] block uppercase">Surface Wind</span>
                  <strong className="text-sm text-[#202124]">{selectedLocation.windSpeed} kt</strong>
                </div>

                <div className="p-2.5 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] block uppercase">Current Drift</span>
                  <strong className="text-sm text-[#202124]">{selectedLocation.currentVelocity} m/s</strong>
                </div>

                <div className="p-2.5 rounded bg-[#F6F8FA] border border-[#E1E5EA]">
                  <span className="text-[10px] text-[#667085] block uppercase">Salinity</span>
                  <strong className="text-sm text-[#202124]">{selectedLocation.salinity} PSU</strong>
                </div>
              </div>

              {/* Maritime Proximity */}
              <div className="p-3 rounded-md bg-[#FBFBFC] border border-[#E1E5EA] space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#667085]">IMBL Standoff:</span>
                  <strong className={`font-mono ${
                    selectedLocation.imblStatus === "Warning" ? "text-red-600" : (selectedLocation.imblStatus === "Caution" ? "text-amber-600" : "text-emerald-600")
                  }`}>
                    {selectedLocation.imblDistanceKm} km ({selectedLocation.imblStatus})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Base Port:</span>
                  <span className="text-[#202124] font-medium truncate max-w-[140px]" title={selectedLocation.nearestPort}>
                    {selectedLocation.nearestPort}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Source Dataset:</span>
                  <span className="text-[#202124] font-medium">{selectedLocation.sourceDataset}</span>
                </div>
              </div>

              {/* Action Button: Send to Copilot / Generate Report */}
              <div className="space-y-1.5 pt-1">
                <Link
                  href={`/dashboard?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}&basin=${activeRegionId}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-sans font-medium text-white bg-[#1F4E8C] hover:bg-[#173F72] transition shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#E87524]" />
                  <span>Send Location to Copilot / Report</span>
                </Link>
                <span className="text-[10px] text-[#667085] text-center block">
                  Click anywhere on map to sample marine telemetry.
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* BOTTOM STATUS BAR                                                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <footer className="h-8 shrink-0 bg-white border-t border-[#E1E5EA] px-4 flex items-center justify-between text-[11px] font-mono text-[#667085] z-20">
        <div className="flex items-center gap-3">
          <span>Center: <strong>{viewState.latitude.toFixed(3)}°N, {viewState.longitude.toFixed(3)}°E</strong></span>
          <span>·</span>
          <span>Zoom: <strong>{viewState.zoom.toFixed(1)}x</strong></span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Layers: <strong>{showSST ? "SST" : ""} {showChl ? "Chlorophyll" : ""} {showPFZ ? "PFZ" : ""}</strong></span>
          <span>·</span>
          <span className="text-[#228B5A]">EPSG:4326 WGS84</span>
        </div>
      </footer>

    </div>
  );
}
