"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, Eye, EyeOff, Compass,
  Microscope, ShieldCheck, GraduationCap, Waves, Lock, Globe, Sparkles
} from "lucide-react";
import ThreeGlobe from "@/components/ThreeGlobe";

// ── Types ─────────────────────────────────────────────────────────────────────
type PersonaKey = "navigator" | "researcher" | "defense" | "student" | "guest";

interface PersonaCard {
  key: PersonaKey;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  desc: string;
  color: string;
  agentName: string;
}

// ── Persona Data (NASA & Google Maps Spec) ───────────────────────────────────
const PERSONAS: PersonaCard[] = [
  {
    key: "navigator",
    icon: Compass,
    title: "Fisherman / Navigator",
    subtitle: "ORCA-Fisher · Matsya-Sutradhar",
    desc: "Daily catch planning, fuel-optimal routes, sea condition advisories & live market prices.",
    color: "#f59e0b",
    agentName: "Matsya-Sutradhar",
  },
  {
    key: "researcher",
    icon: Microscope,
    title: "Marine Researcher / Scientist",
    subtitle: "ORCA-Scholar · Samudra-Vigyan",
    desc: "NetCDF analysis, bio-optical parameters, scientific reports, citations & dataset export.",
    color: "#38bdf8",
    agentName: "Samudra-Vigyan",
  },
  {
    key: "defense",
    icon: ShieldCheck,
    title: "Coast Guard / Defense Operator",
    subtitle: "ORCA-Tactical · Sagar-Rakshak",
    desc: "IMBL monitoring, AIS threat assessment, COLREGs compliance & tactical SITREP generation.",
    color: "#ef4444",
    agentName: "Sagar-Rakshak",
  },
  {
    key: "student",
    icon: GraduationCap,
    title: "Student / Ocean Learner",
    subtitle: "ORCA-Student · Jala-Vidya",
    desc: "Ocean physics, marine biology, guided educational explanations & wave mechanics.",
    color: "#60a5fa",
    agentName: "Jala-Vidya",
  },
  {
    key: "guest",
    icon: Waves,
    title: "Guest / Public Visitor",
    subtitle: "No signup required",
    desc: "Freely explore the interactive ocean globe. Basic safety information, no account needed.",
    color: "#94a3b8",
    agentName: "Public Safety",
  },
];

const HARBORS = [
  "Veraval (Gujarat)", "Mumbai (Maharashtra)", "Kochi (Kerala)",
  "Chennai (Tamil Nadu)", "Visakhapatnam (Andhra Pradesh)", "Mangaluru (Karnataka)",
  "Paradip (Odisha)", "Kolkata (West Bengal)", "Port Blair (Andaman)",
  "Tuticorin (Tamil Nadu)", "Goa", "Ratnagiri (Maharashtra)",
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "ml", label: "മലയാളം" },
  { code: "bn", label: "বাংলা" },
];

const SPECIES = ["Yellowfin Tuna", "Indian Mackerel", "Oil Sardine", "Silver Pomfret", "King Fish / Surmai", "Squid"];

// ── Glass Input ───────────────────────────────────────────────────────────────
function GlassInput({
  label, type = "text", value, onChange, placeholder, required,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="block text-xs font-mono text-zinc-600 mb-1.5 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-2.5 rounded-xl text-xs font-mono text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-blue-500 shadow-xs"
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step Indicator Dots ───────────────────────────────────────────────────────
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === step ? 24 : 8,
            background: i <= step ? "#2563eb" : "#e2e8f0",
          }}
        />
      ))}
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as PersonaKey) || "navigator";

  const [step, setStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>(initialRole);
  const [direction, setDirection] = useState(1);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [harbor, setHarbor] = useState("");
  const [license, setLicense] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(["Yellowfin Tuna"]);
  const [fishingRange, setFishingRange] = useState<"near" | "offshore" | "deep">("offshore");
  const [institution, setInstitution] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [rank, setRank] = useState("");
  const [unit, setUnit] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("en");

  // Auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedOperator, setAgreedOperator] = useState(false);
  const [loading, setLoading] = useState(false);

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleLaunch = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (selectedPersona === "defense") {
      router.push("/defense");
    } else {
      router.push(`/dashboard?persona=${selectedPersona}`);
    }
  };

  const cardVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const persona = PERSONAS.find((p) => p.key === selectedPersona);
  const CurrentPersonaIcon = persona ? persona.icon : Compass;

  return (
    <div
      className="min-h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden p-4 select-none bg-[#f8fafc]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Globe Background with Zoomable Controls Hidden */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <ThreeGlobe autoRotate radius={66} className="w-full h-full" showControls={false} />
      </div>

      {/* Subtle Light Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 85% 85% at 50% 50%, rgba(248,250,252,0.6) 25%, rgba(241,245,249,0.95) 100%)" }}
      />

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono text-zinc-600 hover:text-blue-600 transition z-10 p-2 rounded-xl bg-white/90 border border-zinc-200 backdrop-blur-md shadow-xs"
      >
        <ArrowLeft className="h-4 w-4 text-blue-600" />
        Return to Portal
      </Link>

      {/* Step Card Container */}
      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ── STEP 0: Persona Selection ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl p-6 md:p-8 border shadow-xl"
              style={{
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(24px)",
                borderColor: "#e2e8f0",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 mb-1">STEP 1 OF 3</div>
                  <h2 className="text-xl font-bold text-zinc-900">Choose Your Role</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Customizes satellite layers, advisories & AI models</p>
                </div>
                <StepDots step={0} total={3} />
              </div>

              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {PERSONAS.map((p) => {
                  const isSelected = selectedPersona === p.key;
                  const CardIcon = p.icon;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setSelectedPersona(p.key)}
                      className="w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 group shadow-xs"
                      style={{
                        background: isSelected ? "rgba(239, 246, 255, 0.95)" : "#ffffff",
                        borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                        boxShadow: isSelected ? "0 4px 14px rgba(37, 99, 235, 0.15)" : "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        className="p-2 rounded-xl flex items-center justify-center border flex-shrink-0"
                        style={{
                          background: `${p.color}15`,
                          borderColor: `${p.color}35`,
                        }}
                      >
                        <CardIcon className="h-5 w-5" style={{ color: p.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-zinc-900">{p.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold" style={{ background: `${p.color}18`, color: p.color }}>
                            {p.agentName}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{p.desc}</p>
                      </div>
                      <div
                        className="h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-1"
                        style={{
                          borderColor: isSelected ? "#2563eb" : "#cbd5e1",
                          background: isSelected ? "#2563eb" : "#ffffff",
                        }}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <Link
                  href="/dashboard?persona=guest"
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-900 transition"
                >
                  Skip and explore as Guest →
                </Link>
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Role-specific Profile ── */}
          {step === 1 && persona && (
            <motion.div
              key="step1"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl p-6 md:p-8 border shadow-xl"
              style={{
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(24px)",
                borderColor: "#e2e8f0",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 mb-1">STEP 2 OF 3</div>
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    <CurrentPersonaIcon className="h-5 w-5" style={{ color: persona.color }} />
                    Complete Profile
                  </h2>
                  <div className="text-xs font-mono mt-1 font-semibold" style={{ color: persona.color }}>
                    {persona.agentName} — Domain Settings
                  </div>
                </div>
                <StepDots step={1} total={3} />
              </div>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                <GlassInput label="Full Name" value={fullName} onChange={setFullName} placeholder="e.g. Ramesh Patel" required />
                <GlassInput label="Contact Mobile" type="tel" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />

                {/* Navigator Specific */}
                {selectedPersona === "navigator" && (
                  <>
                    <div>
                      <label className="block text-xs font-mono text-zinc-600 mb-1.5 font-medium">Home Harbor</label>
                      <select
                        value={harbor}
                        onChange={(e) => setHarbor(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none bg-white text-zinc-900 border border-zinc-300 shadow-xs focus:border-blue-500"
                      >
                        <option value="">Select Indian coastal harbor...</option>
                        {HARBORS.map((h) => <option key={h} value={h} className="bg-white text-zinc-900">{h}</option>)}
                      </select>
                    </div>
                    <GlassInput label="Vessel License No." value={license} onChange={setLicense} placeholder="GJ-11-MM-4029" />
                    <div>
                      <label className="block text-xs font-mono text-zinc-600 mb-2 font-medium">Target Species (up to 3)</label>
                      <div className="flex flex-wrap gap-2">
                        {SPECIES.map((s) => {
                          const active = selectedSpecies.includes(s);
                          return (
                            <button
                              key={s}
                              onClick={() => setSelectedSpecies(active ? selectedSpecies.filter((x) => x !== s) : selectedSpecies.length < 3 ? [...selectedSpecies, s] : selectedSpecies)}
                              className="text-xs px-3 py-1 rounded-full border transition-all"
                              style={{
                                background: active ? "rgba(245, 158, 11, 0.15)" : "#ffffff",
                                borderColor: active ? "#f59e0b" : "#e2e8f0",
                                color: active ? "#b45309" : "#64748b",
                                fontWeight: active ? 600 : 400,
                              }}
                            >
                              {active && <Check className="h-3 w-3 inline mr-1" />}{s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-zinc-600 mb-2 font-medium">Operating Standoff Distance</label>
                      <div className="flex gap-2">
                        {(["near", "offshore", "deep"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setFishingRange(r)}
                            className="flex-1 text-xs py-2 rounded-xl border transition-all text-center shadow-xs"
                            style={{
                              background: fishingRange === r ? "rgba(37, 99, 235, 0.12)" : "#ffffff",
                              borderColor: fishingRange === r ? "#2563eb" : "#e2e8f0",
                              color: fishingRange === r ? "#1d4ed8" : "#64748b",
                              fontWeight: fishingRange === r ? 600 : 400,
                            }}
                          >
                            {r === "near" ? "Coastal (<12 NM)" : r === "offshore" ? "Offshore (12–100 NM)" : "Deep Sea (>100 NM)"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Researcher Specific */}
                {selectedPersona === "researcher" && (
                  <>
                    <GlassInput label="Institution / University" value={institution} onChange={setInstitution} placeholder="ICAR-CMFRI, INCOIS, IIT" />
                    <GlassInput label="Specialization / Domain" value={specialization} onChange={setSpecialization} placeholder="Physical Oceanography, Remote Sensing..." />
                    <GlassInput label="Operating State" value={state} onChange={setState} placeholder="Kerala / Goa / Tamil Nadu" />
                  </>
                )}

                {/* Defense Specific */}
                {selectedPersona === "defense" && (
                  <>
                    <GlassInput label="Military / Tactical Rank" value={rank} onChange={setRank} placeholder="Commander, Inspector, MCP..." />
                    <GlassInput label="Station / Coastal Unit" value={unit} onChange={setUnit} placeholder="ICG District HQ 1 (Porbandar)..." />
                    <GlassInput label="Jurisdiction State" value={state} onChange={setState} placeholder="Gujarat / Maharashtra" />
                  </>
                )}

                {/* Student Specific */}
                {selectedPersona === "student" && (
                  <>
                    <GlassInput label="Educational Institution" value={institution} onChange={setInstitution} placeholder="University / College" />
                    <GlassInput label="Degree / Course" value={specialization} onChange={setSpecialization} placeholder="B.Sc. Marine Biology, Ocean Engg..." />
                  </>
                )}

                {/* Language Preference */}
                <div>
                  <label className="block text-xs font-mono text-zinc-600 mb-2 font-medium">Advisory Language</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => setLanguage(l.code)}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shadow-xs"
                        style={{
                          background: language === l.code ? "rgba(37, 99, 235, 0.12)" : "#ffffff",
                          borderColor: language === l.code ? "#2563eb" : "#e2e8f0",
                          color: language === l.code ? "#1d4ed8" : "#64748b",
                          fontWeight: language === l.code ? 600 : 400,
                        }}
                      >
                        <span className="text-[10px] font-mono px-1 rounded bg-blue-100 text-blue-700 font-semibold">
                          {l.code.toUpperCase()}
                        </span>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 border border-zinc-200 bg-white hover:bg-zinc-50 transition shadow-xs"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Account Creation ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl p-6 md:p-8 border shadow-xl"
              style={{
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(24px)",
                borderColor: "#e2e8f0",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 mb-1">STEP 3 OF 3</div>
                  <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    Secure Account
                  </h2>
                </div>
                <StepDots step={2} total={3} />
              </div>

              <div className="space-y-4">
                <GlassInput label="Official Email Address" type="email" value={email} onChange={setEmail} placeholder="operator@orca.gov.in" required />
                <GlassInput label="Access Passphrase" type="password" value={password} onChange={setPassword} placeholder="••••••••••••" required />
                <GlassInput label="Confirm Passphrase" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••••••" required />

                {/* Agreements */}
                <div className="space-y-3 pt-2">
                  {[
                    {
                      checked: agreedTerms,
                      onChange: setAgreedTerms,
                      label: "I accept the sovereign terms of use and maritime safety protocols",
                    },
                    {
                      checked: agreedOperator,
                      onChange: setAgreedOperator,
                      label: "I confirm authorization for Indian EEZ telemetry & navigation data access",
                    },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => item.onChange(!item.checked)}
                      className="w-full flex items-start gap-3 text-left"
                    >
                      <div
                        className="h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        style={{
                          background: item.checked ? "#2563eb" : "#ffffff",
                          borderColor: item.checked ? "#2563eb" : "#cbd5e1",
                        }}
                      >
                        {item.checked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-xs text-zinc-600 leading-relaxed">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 border border-zinc-200 bg-white hover:bg-zinc-50 transition shadow-xs"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={!email || !password || !confirm || !agreedTerms || password !== confirm || loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" /> Launch Platform <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing account prompt */}
        <p className="text-center text-xs text-zinc-500 mt-6 font-mono">
          Already verified?{" "}
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">
            Access Dashboard →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <SignupContent />
    </Suspense>
  );
}
