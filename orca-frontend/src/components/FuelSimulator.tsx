"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Fuel, Clock, IndianRupee, TrendingDown, Waves, Wind, Sparkles } from "lucide-react";

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

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950/80 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-white" />
            <span>Hydrodynamic Economics Engine</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Vector-Assisted Fuel Delta Simulator
          </h3>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300">
          <span>V_ground = <strong className="text-white">V_ship + V_current + K_wind·V_wind</strong></span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Left 6 Columns: Interactive Sliders */}
        <div className="lg:col-span-6 space-y-6">
          {/* Distance Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Voyage Distance:</span>
              <span className="text-white font-bold">{distanceNM} Nautical Miles</span>
            </div>
            <input
              type="range"
              min="15"
              max="150"
              step="5"
              value={distanceNM}
              onChange={(e) => setDistanceNM(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>15 NM (Nearshore)</span>
              <span>150 NM (Deep Sea EEZ)</span>
            </div>
          </div>

          {/* Ocean Current Assist Velocity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-zinc-300" />
                <span>Ocean Current Vector Velocity (uo, vo):</span>
              </span>
              <span className="text-white font-bold">{currentSpeedKnots.toFixed(1)} Knots</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={currentSpeedKnots}
              onChange={(e) => setCurrentSpeedKnots(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0.2 Knots (Calm Slack)</span>
              <span>3.0 Knots (Strong Monsoon Gyre)</span>
            </div>
          </div>

          {/* Vessel Cruise Speed */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Vessel Design Cruise Speed:</span>
              <span className="text-white font-bold">{vesselSpeedKnots} Knots</span>
            </div>
            <input
              type="range"
              min="8"
              max="18"
              step="1"
              value={vesselSpeedKnots}
              onChange={(e) => setVesselSpeedKnots(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>8 Knots (Trawler)</span>
              <span>18 Knots (Patrol Craft)</span>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Results Metric Cards */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <motion.div
            key={fuelSavingsPercent}
            initial={{ scale: 0.96, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-2xl bg-zinc-900 border border-white/20 col-span-2 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">Net Fuel Delta Savings</span>
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div className="text-5xl font-black font-mono text-white mt-2 tracking-tight">
              {fuelSavingsPercent}%
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Conserves <strong className="text-white">{fuelSavedLiters.toFixed(1)} Liters</strong> of marine diesel on this transit alone.
            </p>
          </motion.div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-white" />
              <span>Time Saved</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {(timeSavedHours * 60).toFixed(0)} Mins
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">SOG: {effectiveSOG.toFixed(1)} kts</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
              <IndianRupee className="w-3.5 h-3.5 text-white" />
              <span>Trip Cost Delta</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              ₹{inrSaved.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Direct crew savings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
