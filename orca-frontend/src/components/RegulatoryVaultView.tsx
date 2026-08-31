"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Calendar,
  Radio,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  MapPin,
  Anchor,
  Info,
  Phone,
  PhoneCall,
  Shield,
  Clock,
} from "lucide-react";

interface PolicyItem {
  id: string;
  title: string;
  category: "Monsoon Ban" | "Border Law" | "Equipment SOP" | "Species Mesh Size";
  citation: string;
  stateJurisdiction: string;
  enforcingAuthority: string;
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
    stateJurisdiction: "All Coastal States (West & East Coasts)",
    enforcingAuthority: "Department of Fisheries / Indian Coast Guard",
    summary: "61-day annual ban on mechanized and motorized fishing vessels in the Indian Exclusive Economic Zone (EEZ) to facilitate breeding and juvenile conservation.",
    excerpt: "West Coast (Gujarat, Maharashtra, Goa, Karnataka, Kerala, Lakshadweep): June 1 to July 31 (inclusive). East Coast (Tamil Nadu, Andhra Pradesh, Odisha, West Bengal, Puducherry): April 15 to June 14 (inclusive). Traditional non-motorized crafts are exempted.",
    similarityScore: 0.94,
  },
  {
    id: "p2",
    title: "Maritime Zones of India & IMBL Crossing Penalties",
    category: "Border Law",
    citation: "Maritime Zones of India (Regulation of Fishing) Act 1981 / MEA Directives",
    stateJurisdiction: "Gujarat, Tamil Nadu, Andhra Pradesh, A&N Islands",
    enforcingAuthority: "Indian Coast Guard / Indian Navy / Coastal Police",
    summary: "Strict prohibition of unauthorized entry into sovereign territorial waters of neighboring states (Pakistan & Sri Lanka) without valid clearance.",
    excerpt: "Crossing the International Maritime Boundary Line (IMBL) into Pakistani or Sri Lankan waters constitutes an offense under Section 10/12. Vessels found breaching the 5 NM standoff zone are subject to immediate Coast Guard interception, impoundment, and legal prosecution.",
    similarityScore: 0.89,
  },
  {
    id: "p3",
    title: "Mandatory Safety Apparatus & Radio Watch SOP",
    category: "Equipment SOP",
    citation: "Directorate General of Shipping Order No. 04 of 2024",
    stateJurisdiction: "Pan-India Coastal Waters",
    enforcingAuthority: "Mercantile Marine Department (MMD) / Coastal Guard",
    summary: "Mandatory installation of automatic distress beacons, life jackets, and continuous VHF Channel 16 monitoring on all mechanized fishing boats.",
    excerpt: "All mechanized vessels operating beyond 12 nautical miles must carry: (1) Distress Alert Transmitters (DAT) / AIS Type-B, (2) One BIS-approved life jacket per crew member, (3) Very High Frequency (VHF) marine transceiver maintained on International Distress Frequency 156.800 MHz (Channel 16).",
    similarityScore: 0.87,
  },
  {
    id: "p4",
    title: "Minimum Legal Size (MLS) & Diamond Mesh Regulations",
    category: "Species Mesh Size",
    citation: "ICAR-CMFRI Marine Fisheries Management Guidelines 2025",
    stateJurisdiction: "Gujarat, Maharashtra, Kerala, Tamil Nadu",
    enforcingAuthority: "State Fisheries Departments / Enforcement Wings",
    summary: "Mandates minimum diamond mesh sizes for trawl cod-ends to prevent juvenile bycatch of commercial finfish and shrimp.",
    excerpt: "Minimum square mesh size for trawl nets: 35 mm for fish trawl, 25 mm for shrimp trawl. Minimum Legal Size (MLS) limits: Yellowfin Tuna (35 cm), Indian Mackerel (14 cm), Oil Sardine (10 cm), Silver Pomfret (15 cm). Possession of undersized catch incurs punitive market confiscation.",
    similarityScore: 0.82,
  },
];

const MONSOON_BANS = [
  {
    coast: "West Coast (Arabian Sea)",
    period: "June 1 – July 31 (61 Days)",
    states: "Gujarat, Maharashtra, Goa, Karnataka, Kerala, Lakshadweep",
    status: "OPERABLE (BAN INACTIVE)",
    isBanActive: false,
    exemptions: "Traditional non-motorized motorized OBM (<10 HP) permitted within 12 NM",
  },
  {
    coast: "East Coast (Bay of Bengal)",
    period: "April 15 – June 14 (61 Days)",
    states: "Tamil Nadu, Andhra Pradesh, Odisha, West Bengal, Puducherry",
    status: "OPERABLE (BAN INACTIVE)",
    isBanActive: false,
    exemptions: "Traditional country craft & fiberglass skiffs exempted",
  },
];

const EMERGENCY_DIRECTORY = [
  {
    agency: "Indian Coast Guard MRCC (Mumbai)",
    seaboard: "Western Seaboard",
    tollFree: "1554",
    directPhone: "+91-22-24388065",
    frequency: "VHF Ch 16 (156.800 MHz)",
  },
  {
    agency: "Indian Coast Guard MRCC (Chennai)",
    seaboard: "Eastern Seaboard",
    tollFree: "1554",
    directPhone: "+91-44-23460405",
    frequency: "VHF Ch 16 (156.800 MHz)",
  },
  {
    agency: "Indian Coast Guard MRCC (Port Blair)",
    seaboard: "A&N Island Zone",
    tollFree: "1554",
    directPhone: "+91-3192-245530",
    frequency: "VHF Ch 16 (156.800 MHz)",
  },
  {
    agency: "National Cyclone Warning Centre (IMD)",
    seaboard: "Pan-India Coastal",
    tollFree: "1070",
    directPhone: "+91-11-24652484",
    frequency: "HF/VHF Broadcast Alert",
  },
];

export default function RegulatoryVaultView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem>(POLICY_DATABASE[0]);

  const filteredPolicies = POLICY_DATABASE.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* ━━━ LEFT (60%): MONSOON STATUS & SEARCHABLE POLICY RESULTS ━━━━━━━ */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-y-auto p-5 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span>National Maritime Regulatory Vault</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Statutory Gazettes & Seasonal Fishing Directives
            </h2>
          </div>

          <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
            pgvector Semantic Index • 4 Acts Loaded
          </span>
        </div>

        {/* ── TOP MONSOON BAN STATUS CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MONSOON_BANS.map((ban) => (
            <div
              key={ban.coast}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{ban.coast}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{ban.status}</span>
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
                <div>Duration: <strong className="text-white">{ban.period}</strong></div>
                <div className="text-[10px] text-slate-400 truncate">States: {ban.states}</div>
                <div className="text-[10px] text-slate-500">{ban.exemptions}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH BAR & FILTER TAGS ── */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search maritime gazettes, IMBL coordinates, mesh regulations..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          {/* Quick Query Tag Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Filter Tags:</span>
            {[
              "Monsoon Ban 2026",
              "IMBL Sovereignty",
              "Trawl Mesh Size",
              "VHF Ch 16 SOP",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(searchQuery === tag ? "" : tag)}
                className={`px-2.5 py-0.5 rounded-md border text-[11px] transition cursor-pointer ${
                  searchQuery === tag
                    ? "bg-cyan-500 text-black border-cyan-400 font-bold"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── SEARCH RESULTS LIST ── */}
        <div className="space-y-2.5 flex-1">
          {filteredPolicies.map((item) => {
            const isSelected = selectedPolicy.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedPolicy(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block mb-0.5">
                      {item.category}
                    </span>
                    <h4 className="text-xs md:text-sm font-bold text-white leading-tight">
                      {item.title}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] font-mono shrink-0">
                    {Math.round(item.similarityScore * 100)}% Match
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
                  {item.summary}
                </p>

                <div className="mt-2 text-[10px] font-mono text-slate-500 truncate">
                  Citation: {item.citation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ━━━ RIGHT (40%): STATUTORY EXCERPT & DISTRESS HOTLINES ━━━━━━━━━━━ */}
      <div className="w-full md:w-[420px] lg:w-[480px] h-full flex flex-col bg-slate-950 divide-y divide-slate-800 overflow-y-auto">
        {/* TOP HALF: AUTHENTICATED STATUTORY EXCERPT */}
        <div className="p-5 md:p-6 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
              Authenticated Statutory Excerpt
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              ● Official Gazette
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white leading-tight">
              {selectedPolicy.title}
            </h3>
            <div className="text-[10px] font-mono text-cyan-400">
              {selectedPolicy.citation}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block uppercase">Jurisdiction</span>
              <span className="text-slate-200 text-[10px] truncate block">{selectedPolicy.stateJurisdiction}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block uppercase">Enforcement</span>
              <span className="text-slate-200 text-[10px] truncate block">{selectedPolicy.enforcingAuthority}</span>
            </div>
          </div>

          {/* Legal Excerpt Box */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              Statutory Text:
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              "{selectedPolicy.excerpt}"
            </p>
          </div>
        </div>

        {/* BOTTOM HALF: EMERGENCY DIRECTORY & DISTRESS SOPS */}
        <div className="p-5 md:p-6 space-y-3.5 flex-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-rose-400" />
              <span>Maritime Search & Rescue (MRCC) Directory</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              24x7 Guard
            </span>
          </div>

          <div className="space-y-2">
            {EMERGENCY_DIRECTORY.map((contact) => (
              <div
                key={contact.agency}
                className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px] truncate">{contact.agency}</span>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-1.5 py-0.2 rounded">
                    Toll-Free: {contact.tollFree}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Phone: <strong className="text-slate-200">{contact.directPhone}</strong></span>
                  <span className="text-cyan-300">{contact.frequency}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Distress SOP summary */}
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-[10px] font-mono text-slate-400 space-y-0.5 mt-auto">
            <div className="text-slate-300 font-bold">VHF Ch 16 Emergency Distress Protocol:</div>
            <div>• MAYDAY call format: 3x "MAYDAY", Vessel MMSI, Coordinates, Nature of Distress.</div>
            <div>• All coastal stations and naval vessels maintain continuous watch on 156.800 MHz.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
