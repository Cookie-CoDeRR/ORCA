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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-2xl overflow-hidden text-zinc-900"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-600 uppercase tracking-widest mb-1.5 font-semibold">
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Project ORCA Sovereign Access Control</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">Select Mission Profile</h3>
          <p className="text-xs text-zinc-500 mt-1">
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
                        ? "bg-rose-50 border-rose-500 shadow-sm"
                        : "bg-blue-50/80 border-blue-600 shadow-sm"
                      : "bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-xl border ${
                        isSelected
                          ? isDef
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-blue-600 text-white border-blue-600"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      isDef 
                        ? "border-rose-200 text-rose-700 bg-rose-50" 
                        : isSelected 
                          ? "border-blue-200 text-blue-700 bg-blue-50" 
                          : "border-zinc-200 text-zinc-600 bg-zinc-50"
                    }`}>
                      {r.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 tracking-tight">{r.title}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{r.desc}</p>
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
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-rose-800 font-semibold">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Classified Authentication Gateway</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-700 block mb-1 font-medium">Defense Email (.gov.in / .mil.in)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@indiancoastguard.gov.in"
                    className="w-full rounded-xl bg-white border border-zinc-300 px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-rose-500 focus:outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-700 block mb-1 font-medium">Security Key / PIN (e.g. DEFENSE-26176)</label>
                  <input
                    type="password"
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                    placeholder="Enter clearance key"
                    className="w-full rounded-xl bg-white border border-zinc-300 px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-rose-500 focus:outline-none shadow-xs"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
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
              className={`px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center space-x-2 cursor-pointer ${
                selectedRole === "defense"
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
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
