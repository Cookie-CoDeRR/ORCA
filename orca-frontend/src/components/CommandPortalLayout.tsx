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
  Microscope,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export type PortalTab = "tactical" | "agents" | "data-hub" | "regulatory-vault";

export type UserRole = "navigator" | "researcher" | "student" | "defense";

export const USER_ROLES: {
  id: UserRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}[] = [
  { id: "navigator", label: "Navigator & Fishery", icon: Compass, desc: "Pragmatic safety, targeted catch, and fuel savings" },
  { id: "researcher", label: "Marine Scientist", icon: Microscope, desc: "Scientific telemetry, parameters, and bio-optical data" },
  { id: "student", label: "Ocean Learner", icon: GraduationCap, desc: "Educational explanations of ocean phenomena" },
  { id: "defense", label: "Defense Command", icon: ShieldCheck, desc: "Sovereign IMBL security & tactical surveillance" },
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-zinc-900 font-sans">
      {/* ===================================================================== */}
      {/* UNIFIED NAVIGATION SIDEBAR (LEFTMOST ICON RAIL)                       */}
      {/* ===================================================================== */}
      <aside className="relative z-30 flex flex-col items-center justify-between w-16 md:w-20 bg-white border-r border-zinc-200 py-4 select-none shrink-0 shadow-xs">
        {/* Top Brand Logo */}
        <div className="flex flex-col items-center gap-1">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-black shadow-md shadow-blue-500/25 hover:scale-105 transition cursor-pointer"
            title="Project ORCA — Home"
          >
            <Compass className="h-6 w-6" />
          </Link>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 font-bold uppercase mt-1">
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
                    ? "bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className={`text-[9px] font-semibold tracking-tight mt-1 text-center hidden md:block ${isActive ? "text-blue-700" : "text-zinc-500 group-hover:text-zinc-800"}`}>
                  {item.id === "tactical" ? "Command" : item.id === "agents" ? "Agents" : item.id === "data-hub" ? "Data EO" : "Policies"}
                </span>
                {item.badge && (
                  <span className={`absolute -top-1 -right-1 text-[7px] font-mono font-black px-1 rounded-full border ${
                    isActive ? "bg-blue-600 text-white border-blue-600" : "bg-zinc-100 text-zinc-600 border-zinc-200"
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
            className="flex flex-col items-center justify-center w-full py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition cursor-pointer shadow-xs"
            title="Classified Defense Command"
          >
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span className="text-[8px] font-mono font-bold mt-0.5 hidden md:block">DEFENSE</span>
          </Link>

          <div className="flex items-center justify-center h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" title="Sovereign Swarm Live" />
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* MAIN PORTAL BODY (TOP BAR + ACTIVE VIEW CONTENT)                      */}
      {/* ===================================================================== */}
      <div className="relative flex flex-col flex-1 h-full overflow-hidden bg-[#f8fafc]">
        {/* TOP COMMAND BAR (GOVERNMENT OF INDIA & INCOIS OFFICIAL MARITIME PORTAL STYLE) */}
        <header className="relative z-20 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-zinc-200 select-none shadow-xs text-zinc-900">
          {/* Left: Official Government of India & Ministry Branding */}
          <div className="flex items-center gap-3.5">
            {/* National Tri-Color Accent Pill */}
            <div className="hidden lg:flex flex-col h-9 w-1 rounded-full overflow-hidden shrink-0">
              <div className="h-3 bg-[#FF9933]" />
              <div className="h-3 bg-white" />
              <div className="h-3 bg-[#138808]" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-semibold">
                  GOVERNMENT OF INDIA • MINISTRY OF EARTH SCIENCES • INCOIS
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>24x7 OPERATIONAL</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-black tracking-tight text-zinc-900 flex items-center gap-1.5">
                  <span>PROJECT ORCA</span>
                  <span className="text-zinc-300 font-normal">|</span>
                  <span className="text-xs md:text-sm font-semibold text-zinc-600">
                    National Maritime Intelligence & Fisheries Portal
                  </span>
                </h1>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  SIH-26176
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls (Persona, Basin, Language) */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* User Persona / Role Dropdown */}
            <div className="relative">
              {(() => {
                const currentRoleObj = USER_ROLES.find((r) => r.id === userRole);
                const CurrentRoleIcon = currentRoleObj ? currentRoleObj.icon : Compass;
                return (
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition cursor-pointer shadow-xs"
                    title="Change User Persona"
                  >
                    <CurrentRoleIcon className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-mono text-[11px]">
                      {currentRoleObj?.label}
                    </span>
                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                  </button>
                );
              })()}
              <AnimatePresence>
                {roleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-11 w-64 rounded-xl border border-zinc-200 bg-white shadow-2xl p-1.5 z-50 font-sans text-zinc-900"
                  >
                    <div className="px-2.5 py-1.5 text-[9px] font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-100 mb-1 font-semibold">
                      Select Operational Persona
                    </div>
                    {USER_ROLES.map((role) => {
                      const ItemRoleIcon = role.icon;
                      return (
                        <button
                          key={role.id}
                          onClick={() => {
                            onRoleChange(role.id);
                            setRoleMenuOpen(false);
                          }}
                          className={`flex flex-col items-start w-full px-2.5 py-2 rounded-lg text-xs transition cursor-pointer text-left ${
                            userRole === role.id
                              ? "bg-blue-600 text-white font-bold shadow-xs"
                              : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="flex items-center gap-2">
                              <ItemRoleIcon className="h-4 w-4" />
                              <span className="font-semibold">{role.label}</span>
                            </span>
                            {userRole === role.id && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-normal mt-0.5 ${
                              userRole === role.id ? "text-blue-100 font-medium" : "text-zinc-400"
                            }`}
                          >
                            {role.desc}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active Basin Dropdown */}
            <div className="relative">
              <button
                onClick={() => setBasinMenuOpen(!basinMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Globe className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden sm:inline font-mono text-[11px]">
                  {BASINS.find((b) => b.id === activeBasin)?.label || "Arabian Sea"}
                </span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>
              <AnimatePresence>
                {basinMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-11 w-48 rounded-xl border border-zinc-200 bg-white shadow-2xl p-1.5 z-50 font-mono text-zinc-900"
                  >
                    {BASINS.map((basin) => (
                      <button
                        key={basin.id}
                        onClick={() => {
                          onBasinChange(basin.id);
                          setBasinMenuOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                          activeBasin === basin.id
                            ? "bg-blue-600 text-white font-bold shadow-xs"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                      >
                        <span>{basin.label}</span>
                        {activeBasin === basin.id && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        )}
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Languages className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-mono text-[11px]">{selectedLanguage}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-11 w-40 rounded-xl border border-zinc-200 bg-white shadow-2xl p-1.5 z-50 text-zinc-900"
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          onLanguageChange(l.code);
                          setLangMenuOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          selectedLanguage === l.code
                            ? "bg-blue-600 text-white font-bold shadow-xs"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                      >
                        <span>{l.native}</span>
                        <span className={`text-[10px] font-mono ${selectedLanguage === l.code ? "text-blue-200" : "text-zinc-400"}`}>{l.code}</span>
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
