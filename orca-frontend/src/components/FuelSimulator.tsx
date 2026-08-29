"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Fuel, Clock, IndianRupee, TrendingDown, Waves, Wind } from "lucide-react";

export default function FuelSimulator() {
  const [distanceNM, setDistanceNM] = useState<number>(45);
  const [currentSpeedKnots, setCurrentSpeedKnots] = useState<number>(1.4);
  const [vesselSpeedKnots, setVesselSpeedKnots] = useState<number>(12);

  // Physics calculation
  const effectiveSOG = vesselSpeedKnots + currentSpeedKnots * 0.85; // Assist vector
  const standardTimeHours = distanceNM / vesselSpeedKnots;
  const optimizedTimeHours = distanceNM / effectiveSOG;
  const timeSavedHours = Math.max(0, standardTimeHours - optimizedTimeHours);

  // Typical mechanized 15-meter trawler burns ~28 liters/hour
  const burnRateLitersPerHour = 28;
  const standardFuelLiters = standardTimeHours * burnRateLitersPerHour;
  const optimizedFuelLiters = optimizedTimeHours * burnRateLitersPerHour;
  const fuelSavedLiters = Math.max(0, standardFuelLiters - optimizedFuelLiters);
  const fuelSavingsPercent = ((fuelSavedLiters / standardFuelLiters) * 100).toFixed(1);

  // Diesel cost in coastal India ~ ₹92/liter
  const inrSaved = Math.round(fuelSavedLiters * 92);
  const co2AvoidedKg = (fuelSavedLiters * 2.68).toFixed(1); // 2.68 kg CO2 per liter of diesel

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-gradient-to-b from-[#09111e]/90 to-[#040810]/95 border border-slate-800/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Real-Time Hydrodynamic Economics</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-100">
            Fuel-Optimal Vector Routing Simulator
          </h3>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
          <span>Formula: <strong className="text-white">V_ground = V_ship + V_current + K_wind·V_wind</strong></span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Left 6 Columns: Interactive Sliders */}
        <div className="lg:col-span-6 space-y-6">
          {/* Distance Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Voyage Distance:</span>
              <span className="text-cyan-400 font-bold">{distanceNM} Nautical Miles</span>
            </div>
            <input
              type="range"
              min="15"
              max="150"
              step="5"
              value={distanceNM}
              onChange={(e) => setDistanceNM(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>15 NM (Nearshore)</span>
              <span>150 NM (Deep Sea EEZ)</span>
            </div>
          </div>

          {/* Ocean Current Assist Velocity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ocean Current Vector Velocity (uo, vo):</span>
              </span>
              <span className="text-emerald-400 font-bold">{currentSpeedKnots.toFixed(1)} Knots</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={currentSpeedKnots}
              onChange={(e) => setCurrentSpeedKnots(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.2 Knots (Calm Slack)</span>
              <span>3.0 Knots (Strong Monsoon Gyre)</span>
            </div>
          </div>

          {/* Vessel Cruise Speed */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Vessel Design Cruise Speed:</span>
              <span className="text-sky-400 font-bold">{vesselSpeedKnots} Knots</span>
            </div>
            <input
              type="range"
              min="8"
              max="18"
              step="1"
              value={vesselSpeedKnots}
              onChange={(e) => setVesselSpeedKnots(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>8 Knots (Trawler)</span>
              <span>18 Knots (Patrol Craft)</span>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Results Metric Cards */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <motion.div
            key={fuelSavingsPercent}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-950 border border-emerald-500/40 col-span-2 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">Net Fuel Delta Savings</span>
              <Fuel className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-300 mt-2">
              {fuelSavingsPercent}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Conserves <strong>{fuelSavedLiters.toFixed(1)} Liters</strong> of marine diesel on this transit alone.
            </p>
          </motion.div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Time Saved</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
              {(timeSavedHours * 60).toFixed(0)} Mins
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">SOG: {effectiveSOG.toFixed(1)} kts</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Trip Cost Delta</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
              ₹{inrSaved.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct crew savings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
