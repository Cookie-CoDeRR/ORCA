"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  Calendar,
  PhoneCall,
  Radio,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MapPin,
  Anchor,
  Info,
} from "lucide-react";

interface PolicyItem {
  id: string;
  title: string;
  category: "Monsoon Ban" | "Border Law" | "Equipment SOP" | "Species Mesh Size";
  citation: string;
  summary: string;
  excerpt: string;
  similarityScore: number;
}

const POLICY_DATABASE: PolicyItem[] = [
  {
    id: "p1",
    title: "Uniform Seasonal Monsoon Fishing Ban 2026",
    category: "Monsoon Ban",
    citation: "Dept of Fisheries Gazette Notification F.No. 31013/2026-FY",
    summary: "61-day annual ban on mechanized and motorized fishing vessels in the Indian Exclusive Economic Zone (EEZ) to facilitate breeding and juvenile conservation.",
    excerpt: "West Coast (Gujarat, Maharashtra, Goa, Karnataka, Kerala, Lakshadweep): June 1 to July 31 (inclusive). East Coast (Tamil Nadu, Andhra Pradesh, Odisha, West Bengal, Puducherry): April 15 to June 14 (inclusive). Traditional non-motorized crafts are exempted.",
    similarityScore: 0.94,
  },
  {
    id: "p2",
    title: "Maritime Zones of India & IMBL Crossing Penalties",
    category: "Border Law",
    citation: "Maritime Zones of India (Regulation of Fishing) Act 1981 / MEA Directives",
    summary: "Strict prohibition of unauthorized entry into sovereign territorial waters of neighboring states (Pakistan & Sri Lanka) without valid clearance.",
    excerpt: "Crossing the International Maritime Boundary Line (IMBL) into Pakistani or Sri Lankan waters constitutes an offense under Section 10/12. Vessels found breaching the 5 NM standoff zone are subject to immediate Coast Guard interception, impoundment, and legal prosecution.",
    similarityScore: 0.89,
  },
  {
    id: "p3",
    title: "Mandatory Safety Apparatus & Radio Watch SOP",
    category: "Equipment SOP",
    citation: "Directorate General of Shipping Order No. 04 of 2024",
    summary: "Mandatory installation of automatic distress beacons, life jackets, and continuous VHF Channel 16 monitoring on all mechanized fishing boats.",
    excerpt: "All mechanized vessels operating beyond 12 nautical miles must carry: (1) Distress Alert Transmitters (DAT) / AIS Type-B, (2) One BIS-approved life jacket per crew member, (3) Very High Frequency (VHF) marine transceiver maintained on International Distress Frequency 156.800 MHz (Channel 16).",
    similarityScore: 0.87,
  },
  {
    id: "p4",
    title: "Minimum Legal Size (MLS) & Diamond Mesh Regulations",
    category: "Species Mesh Size",
    citation: "ICAR-CMFRI Marine Fisheries Management Guidelines 2025",
    summary: "Mandates minimum diamond mesh sizes for trawl cod-ends to prevent juvenile bycatch of commercial finfish and shrimp.",
    excerpt: "Minimum square mesh size for trawl nets: 35 mm for fish trawl, 25 mm for shrimp trawl. Minimum Legal Size (MLS) limits: Yellowfin Tuna (35 cm), Indian Mackerel (14 cm), Oil Sardine (10 cm), Silver Pomfret (15 cm). Possession of undersized catch incurs punitive market confiscation.",
    similarityScore: 0.82,
  },
];

const MONSOON_BANS = [
  { coast: "West Coast", period: "June 1 – July 31", duration: "61 Days", states: "Gujarat, Maharashtra, Goa, Karnataka, Kerala, Lakshadweep", activeNow: false },
  { coast: "East Coast", period: "April 15 – June 14", duration: "61 Days", states: "Tamil Nadu, Andhra Pradesh, Odisha, West Bengal, Puducherry", activeNow: false },
];

const EMERGENCY_CONTACTS = [
  { name: "Indian Coast Guard MRCC (Mumbai - West Coast)", freq: "VHF Ch 16 (156.800 MHz)", phone: "+91-22-24388065", tollFree: "1554", zone: "Western Seaboard" },
  { name: "Indian Coast Guard MRCC (Chennai - East Coast)", freq: "VHF Ch 16 (156.800 MHz)", phone: "+91-44-23460405", tollFree: "1554", zone: "Eastern Seaboard" },
  { name: "Indian Coast Guard MRCC (Port Blair - Andaman)", freq: "VHF Ch 16 (156.800 MHz)", phone: "+91-3192-245530", tollFree: "1554", zone: "A&N Islands" },
  { name: "National Cyclone Warning Centre (IMD New Delhi)", freq: "HF/VHF Broadcast", phone: "+91-11-24652484", tollFree: "1070", zone: "Pan-India" },
];

export default function RegulatoryVaultView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem>(POLICY_DATABASE[0]);

  const filteredPolicies = POLICY_DATABASE.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-black text-white">
      {/* LEFT: POLICY SEARCH & MONSOON BAN MATRIX */}
      <div className="flex-1 flex flex-col h-full border-r border-white/10 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Fleet Safety & Regulatory Vault</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Sovereign Maritime Law & Fisheries Policy RAG
            </h3>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/15 bg-zinc-900 text-xs font-mono text-zinc-300">
            <span>BGE-M3 · pgvector HNSW</span>
          </div>
        </div>

        {/* Monsoon Trawl Ban Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-400" />
              <span>Uniform Seasonal Monsoon Fishing Ban Schedule (61 Days)</span>
            </span>
            <span className="text-emerald-400 font-semibold">Bans Currently Inactive</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MONSOON_BANS.map((b) => (
              <div key={b.coast} className="p-4 rounded-2xl border border-white/10 bg-zinc-950/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{b.coast}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    OPERABLE
                  </span>
                </div>
                <div className="text-sm font-bold text-white">{b.period} ({b.duration})</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{b.states}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Search Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search maritime circulars, IMBL laws, mesh regulations, VHF distress SOPs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-950 border border-white/15 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              "Penalty for crossing Sri Lanka IMBL",
              "Mandatory VHF Channel 16 watch",
              "Minimum mesh size for trawls",
              "Exemptions for non-motorized crafts",
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => setSearchQuery(chip)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-white/10 text-[10px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Policy Results List */}
        <div className="space-y-2">
          {filteredPolicies.map((policy) => {
            const isSelected = selectedPolicy.id === policy.id;
            return (
              <div
                key={policy.id}
                onClick={() => setSelectedPolicy(policy)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 border-white shadow-lg shadow-white/10"
                    : "bg-zinc-950/70 border-white/15 hover:border-white/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{policy.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15">
                        {policy.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">{policy.citation}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {(policy.similarityScore * 100).toFixed(0)}% MATCH
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-zinc-300 leading-relaxed">{policy.summary}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: POLICY EXCERPT & EMERGENCY DIRECTORY */}
      <div className="w-full md:w-[420px] lg:w-[460px] h-full flex flex-col bg-zinc-950 p-6 overflow-y-auto space-y-6">
        {/* Full Selected Policy Excerpt */}
        <div className="space-y-3 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 font-bold">Authenticated Statutory Excerpt</span>
            <span className="text-[10px] font-mono text-emerald-400">pgvector Retrieved</span>
          </div>

          <h4 className="text-sm font-bold text-white">{selectedPolicy.title}</h4>
          <p className="text-[10px] font-mono text-zinc-400">{selectedPolicy.citation}</p>

          <div className="p-4 rounded-xl border border-white/10 bg-black text-xs text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
            {selectedPolicy.excerpt}
          </div>
        </div>

        {/* Emergency Search & Coast Guard Rescue Directory */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            <span>Emergency Distress & MRCC Directory</span>
          </div>

          <div className="space-y-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <div key={c.name} className="p-3 rounded-xl border border-white/10 bg-black space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  <span className="text-[10px] font-mono font-bold text-rose-400">Toll-Free: {c.tollFree}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>{c.freq}</span>
                  <span>{c.phone}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/30 text-[11px] text-rose-200 leading-relaxed font-mono">
            <strong>Standard VHF 16 Protocol:</strong> In distress, transmit "MAYDAY, MAYDAY, MAYDAY" followed by vessel name, GPS coordinates, crew count, and nature of emergency on 156.800 MHz.
          </div>
        </div>
      </div>
    </div>
  );
}
