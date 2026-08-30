"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Lock,
  User,
  GraduationCap,
  Microscope,
  Anchor,
  ArrowRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Eye,
  Key,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: "researcher" | "visitor" | "learner" | "defense" | "navigator";
}

export default function AuthModal({ isOpen, onClose, initialRole = "visitor" }: AuthModalProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [email, setEmail] = useState<string>("");
  const [authKey, setAuthKey] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (selectedRole === "defense") {
      setIsVerifying(true);
      setTimeout(() => {
        // Check defense authorization
        const isDefenseEmail =
          email.toLowerCase().endsWith(".gov.in") ||
          email.toLowerCase().endsWith(".mil.in") ||
          email.toLowerCase().includes("coastguard") ||
          email.toLowerCase().includes("navy") ||
          email.toLowerCase().includes("drdo") ||
          authKey.trim().toUpperCase() === "DEFENSE-26176" ||
          authKey.trim().toUpperCase() === "ORCA-RESTRICTED";

        if (isDefenseEmail) {
          localStorage.setItem("orca_user_role", "defense");
          localStorage.setItem("orca_user_email", email || "officer@indiancoastguard.gov.in");
          setIsVerifying(false);
          onClose();
          router.push("/defense");
        } else {
          setIsVerifying(false);
          setErrorMsg("Access Denied: Restricted to authorized Indian Coast Guard / DRDO / Navy credentials or Security Key (e.g. DEFENSE-26176).");
        }
      }, 700);
    } else {
      localStorage.setItem("orca_user_role", selectedRole);
      if (email) localStorage.setItem("orca_user_email", email);
      onClose();
      router.push(`/dashboard?role=${selectedRole}`);
    }
  };

  const roles = [
    {
      id: "visitor",
      title: "Coastal Citizen / Visitor",
      desc: "Beach safety, recreational ocean state, cyclone alerts & marine life",
      icon: User,
      badge: "Open Access",
      badgeColor: "border-white/20 text-zinc-300",
    },
    {
      id: "researcher",
      title: "Marine Researcher",
      desc: "NetCDF raster slicing, SST/Chl-a fronts, thermoclines & carbon flux",
      icon: Microscope,
      badge: "Scientific Portal",
      badgeColor: "border-cyan-500/30 text-cyan-300",
    },
    {
      id: "learner",
      title: "Oceanography Student",
      desc: "Interactive fluid equations, multi-agent AI architecture & biology models",
      icon: GraduationCap,
      badge: "Academic Portal",
      badgeColor: "border-purple-500/30 text-purple-300",
    },
    {
      id: "navigator",
      title: "Commercial Fleet Navigator",
      desc: "Fuel-optimal A* courses, monsoon bans, port clearance SOPs",
      icon: Anchor,
      badge: "Fisheries & Merchant",
      badgeColor: "border-emerald-500/30 text-emerald-300",
    },
    {
      id: "defense",
      title: "Defense & Coast Guard (Restricted)",
      desc: "Classified IMBL standoff radar, dark vessel drift projection & border alerts",
      icon: ShieldAlert,
      badge: "Restricted Clearance",
      badgeColor: "border-rose-500/50 text-rose-400 bg-rose-950/40",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-white/15 p-6 sm:p-8 shadow-2xl overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
            <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>Project ORCA Sovereign Access Control</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Select Mission Profile</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Choose your operational persona to tailor telemetry, algorithms, and security clearance.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Role Selection Grid */}
          <div className="grid sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              const isDef = r.id === "defense";
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRole(r.id);
                    setErrorMsg("");
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isDef ? "sm:col-span-2" : ""
                  } ${
                    isSelected
                      ? isDef
                        ? "bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40"
                        : "bg-white/10 border-white/40 shadow-lg shadow-white/5"
                      : "bg-zinc-900/40 border-white/5 hover:bg-zinc-900/80 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-xl border ${
                        isSelected
                          ? isDef
                            ? "bg-rose-500 text-white border-rose-400"
                            : "bg-white text-black border-white"
                          : "bg-zinc-800 text-zinc-300 border-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{r.title}</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Defense Credentials Inputs (Conditional) */}
          {selectedRole === "defense" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-rose-300">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Classified Authentication Gateway</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-300 block mb-1">Defense Email (.gov.in / .mil.in)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@indiancoastguard.gov.in"
                    className="w-full rounded-xl bg-black border border-white/15 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-300 block mb-1">Security Key / PIN (e.g. DEFENSE-26176)</label>
                  <input
                    type="password"
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    placeholder="Enter clearance key"
                    className="w-full rounded-xl bg-black border border-white/15 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">
              {selectedRole === "defense" ? "Restricted Air-Gapped Security Zone" : "Sovereign Local Execution"}
            </span>

            <button
              type="submit"
              disabled={isVerifying}
              className={`px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-xl flex items-center space-x-2 cursor-pointer ${
                selectedRole === "defense"
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30"
                  : "bg-white hover:bg-zinc-200 text-black shadow-white/10"
              }`}
            >
              <span>{isVerifying ? "Verifying Clearance..." : selectedRole === "defense" ? "Authorize & Enter Defense Deck" : "Launch Mission Profile"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
