"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Layers,
  Network,
  Database,
  BookOpen,
  ShieldAlert,
  Radio,
  Sliders,
  Globe,
  Languages,
  ChevronDown,
  Sparkles,
  Info,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export type PortalTab = "tactical" | "agents" | "data-hub" | "regulatory-vault";

export type UserRole = "navigator" | "researcher" | "student" | "defense";

export const USER_ROLES: { id: UserRole; label: string; icon: string; desc: string }[] = [
  { id: "navigator", label: "Navigator & Fishery", icon: "🧭", desc: "Pragmatic safety, targeted catch, and fuel savings" },
  { id: "researcher", label: "Marine Scientist", icon: "🔬", desc: "Scientific telemetry, parameters, and bio-optical data" },
  { id: "student", label: "Ocean Learner", icon: "🎓", desc: "Educational explanations of ocean phenomena" },
  { id: "defense", label: "Defense Command", icon: "🛡️", desc: "Sovereign IMBL security & tactical surveillance" },
];

interface CommandPortalLayoutProps {
  currentTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  activeBasin: string;
  onBasinChange: (basin: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  children: React.ReactNode;
}

const BASINS = [
  { id: "arabian_sea", label: "Arabian Sea (AS)", coords: [70.368, 20.902] },
  { id: "bay_of_bengal", label: "Bay of Bengal (BoB)", coords: [83.2, 17.7] },
  { id: "lakshadweep", label: "Lakshadweep Sea", coords: [72.8, 10.5] },
  { id: "andaman", label: "Andaman & Nicobar", coords: [93.0, 11.5] },
];

const LANGUAGES = [
  { code: "EN", label: "English", native: "English" },
  { code: "HI", label: "Hindi", native: "हिन्दी" },
  { code: "GU", label: "Gujarati", native: "ગુજરાતી" },
  { code: "TA", label: "Tamil", native: "தமிழ்" },
  { code: "ML", label: "Malayalam", native: "മലയാളം" },
  { code: "TE", label: "Telugu", native: "తెలుగు" },
  { code: "BN", label: "Bengali", native: "বাংলা" },
];

export default function CommandPortalLayout({
  currentTab,
  onTabChange,
  activeBasin,
  onBasinChange,
  selectedLanguage,
  onLanguageChange,
  userRole,
  onRoleChange,
  children,
}: CommandPortalLayoutProps) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [basinMenuOpen, setBasinMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems: { id: PortalTab; label: string; icon: any; badge?: string }[] = [
    { id: "tactical", label: "Tactical Command", icon: Compass },
    { id: "agents", label: "Agent Swarm Mesh", icon: Network, badge: "6 AGENTS" },
    { id: "data-hub", label: "Data Hub (EO)", icon: Database, badge: "LIVE" },
    { id: "regulatory-vault", label: "Regulatory Vault", icon: BookOpen, badge: "RAG" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans">
      {/* ===================================================================== */}
      {/* UNIFIED NAVIGATION SIDEBAR (LEFTMOST ICON RAIL)                       */}
      {/* ===================================================================== */}
      <aside className="relative z-30 flex flex-col items-center justify-between w-16 md:w-20 bg-zinc-950 border-r border-white/10 py-4 select-none shrink-0">
        {/* Top Brand Logo */}
        <div className="flex flex-col items-center gap-1">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black font-black shadow-lg shadow-white/10 hover:scale-105 transition cursor-pointer"
            title="Project ORCA — Home"
          >
            <Compass className="h-6 w-6" />
          </Link>
          <span className="text-[9px] font-mono tracking-widest text-zinc-400 font-bold uppercase mt-1">
            ORCA
          </span>
        </div>

        {/* Primary View Navigation */}
        <nav className="flex flex-col items-center gap-3 my-auto w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`group relative flex flex-col items-center justify-center w-full py-2.5 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-black shadow-xl shadow-white/15"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className={`text-[9px] font-semibold tracking-tight mt-1 text-center hidden md:block ${isActive ? "text-black" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                  {item.id === "tactical" ? "Command" : item.id === "agents" ? "Agents" : item.id === "data-hub" ? "Data EO" : "Policies"}
                </span>
                {item.badge && (
                  <span className={`absolute -top-1 -right-1 text-[7px] font-mono font-black px-1 rounded-full border ${
                    isActive ? "bg-black text-white border-black" : "bg-zinc-800 text-zinc-300 border-white/20"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Defense Gateway / Status */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          <Link
            href="/defense"
            className="flex flex-col items-center justify-center w-full py-2 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 hover:text-white transition cursor-pointer"
            title="Classified Defense Command"
          >
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span className="text-[8px] font-mono font-bold mt-0.5 hidden md:block">DEFENSE</span>
          </Link>

          <div className="flex items-center justify-center h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" title="Sovereign Swarm Live" />
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* MAIN PORTAL BODY (TOP BAR + ACTIVE VIEW CONTENT)                      */}
      {/* ===================================================================== */}
      <div className="relative flex flex-col flex-1 h-full overflow-hidden bg-black">
        {/* TOP COMMAND BAR */}
        <header className="relative z-20 flex items-center justify-between h-14 px-4 md:px-6 bg-zinc-950/95 border-b border-white/10 backdrop-blur-xl">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>PROJECT ORCA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-300 border border-white/15">
                  SIH26176
                </span>
              </h2>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AIR-GAPPED SOVEREIGN SWARM</span>
            </div>
          </div>

          {/* Right Controls (Persona, Basin, Language, View Info) */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* User Persona / Role Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <span>{USER_ROLES.find((r) => r.id === userRole)?.icon}</span>
                <span className="hidden sm:inline font-mono text-[11px]">{USER_ROLES.find((r) => r.id === userRole)?.label}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>
              <AnimatePresence>
                {roleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-10 w-56 rounded-xl border border-white/15 bg-zinc-950 shadow-2xl p-1.5 z-50"
                  >
                    <div className="px-2 py-1 text-[9px] font-mono text-zinc-400 uppercase tracking-widest border-b border-white/10 mb-1">
                      Select User Persona
                    </div>
                    {USER_ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          onRoleChange(role.id);
                          setRoleMenuOpen(false);
                        }}
                        className={`flex flex-col items-start w-full px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left ${
                          userRole === role.id ? "bg-white text-black font-bold" : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-1.5">
                            <span>{role.icon}</span>
                            <span>{role.label}</span>
                          </span>
                          {userRole === role.id && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                        </div>
                        <span className={`text-[9px] font-normal mt-0.5 ${userRole === role.id ? "text-zinc-800" : "text-zinc-400"}`}>
                          {role.desc}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active Basin Dropdown */}
            <div className="relative">
              <button
                onClick={() => setBasinMenuOpen(!basinMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-zinc-900/80 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">{BASINS.find((b) => b.id === activeBasin)?.label || "Arabian Sea"}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>
              <AnimatePresence>
                {basinMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-10 w-48 rounded-xl border border-white/15 bg-zinc-950 shadow-2xl p-1.5 z-50"
                  >
                    {BASINS.map((basin) => (
                      <button
                        key={basin.id}
                        onClick={() => {
                          onBasinChange(basin.id);
                          setBasinMenuOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                          activeBasin === basin.id ? "bg-white text-black font-bold" : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <span>{basin.label}</span>
                        {activeBasin === basin.id && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-zinc-900/80 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                <Languages className="h-3.5 w-3.5 text-amber-400" />
                <span>{selectedLanguage}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-10 w-40 rounded-xl border border-white/15 bg-zinc-950 shadow-2xl p-1.5 z-50"
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          onLanguageChange(l.code);
                          setLangMenuOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          selectedLanguage === l.code ? "bg-white text-black font-bold" : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <span>{l.native}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{l.code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ACTIVE PORTAL TAB VIEW */}
        <main className="relative flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
