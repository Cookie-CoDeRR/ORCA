"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ChevronRight, Fish, ShieldCheck, Waves,
  Radio, Globe, BookOpen, Menu, X, Compass, Microscope,
  GraduationCap, Sparkles
} from "lucide-react";
import ThreeGlobe from "@/components/ThreeGlobe";

// ── Live stat ticker data ─────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "LIVE SST: 28.4°C",
  "Chl-a: 1.26 mg/m³",
  "SWH: 1.6m",
  "AIS: 142 vessels",
  "IMBL Standoff: 74.2km",
  "PFZ Confidence: 94%",
  "Indian EEZ: 2.02M km²",
  "AI Swarm: ONLINE",
];

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setVal(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Stat pill component ───────────────────────────────────────────────────────
function StatPill({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border backdrop-blur-xl"
      style={{
        background: "rgba(4,10,20,0.72)",
        borderColor: `${color}28`,
        boxShadow: `0 2px 16px ${color}18`,
      }}
    >
      <span style={{ color }} className="flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] text-[#7e97b2] font-mono leading-none mb-0.5">{label}</div>
        <div className="text-sm font-mono font-bold text-[#e8eef5] leading-none">{value}</div>
      </div>
      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#06d6a0] animate-pulse flex-shrink-0" />
    </motion.div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickerOffset, setTickerOffset] = useState(0);

  // Marquee ticker animation
  useEffect(() => {
    let frame: number;
    let offset = 0;
    const speed = 0.5;
    const tick = () => {
      offset += speed;
      setTickerOffset(offset);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const tickerText = TICKER_ITEMS.join("   ·   ");
  const fullTicker = `${tickerText}   ·   ${tickerText}`;

  return (
    <div
      className="min-h-screen w-screen overflow-x-hidden select-none"
      style={{ background: "#030712", color: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* ── Globally inject Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
      `}</style>

      {/* ══════════════════════════════════════════
          TOP NAV BAR
      ══════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between border-b"
        style={{
          background: "rgba(3,7,18,0.85)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderColor: "rgba(59,130,246,0.18)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center border bg-[#1e40af]/25 border-[#3b82f6]/40 text-[#38bdf8]"
          >
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div
              className="font-mono font-bold text-base tracking-wider leading-none text-[#f8fafc]"
            >
              ORCA
            </div>
            <div className="text-[10px] text-[#94a3b8] font-mono leading-none mt-0.5 hidden sm:block">
              Sovereign Marine Intelligence & Swarm Platform
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {["About", "Docs", "API", "Data Sources"].map((label) => (
            <button
              key={label}
              className="text-sm text-[#94a3b8] hover:text-[#f8fafc] transition-colors font-medium"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border text-[#38bdf8] border-[#2563eb]/40 bg-[#1e40af]/20"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
            Backend Live
          </div>

          <Link
            href="/signup"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all text-[#38bdf8] border-[#3b82f6]/40 bg-[#1e40af]/20 hover:bg-[#1e40af]/40"
          >
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all bg-[#2563eb] hover:bg-[#1d4ed8] shadow-lg shadow-blue-900/40"
          >
            Launch
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-[#7e97b2] hover:text-[#e8eef5]"
            onClick={() => setMenuOpen((p) => !p)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-16 left-0 right-0 z-40 p-4 space-y-2 border-b md:hidden"
            style={{
              background: "rgba(4,10,20,0.95)",
              backdropFilter: "blur(18px)",
              borderColor: "rgba(59,130,246,0.10)",
            }}
          >
            {["About", "Docs", "API", "Data Sources"].map((label) => (
              <button
                key={label}
                className="w-full text-left text-sm text-[#7e97b2] hover:text-[#e8eef5] py-2 px-3 rounded-lg hover:bg-white/5 transition"
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          HERO — Full-Viewport Globe
      ══════════════════════════════════════════ */}
      <section className="relative h-screen w-screen overflow-hidden pt-16">
        {/* Globe canvas — fills entire hero */}
        <div className="absolute inset-0">
          <ThreeGlobe autoRotate radius={66} className="w-full h-full" />
        </div>

        {/* Subtle radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 40%, rgba(2,5,8,0.85) 100%)",
          }}
        />

        {/* Bottom gradient fade into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #020508)" }}
        />

        {/* ── Hero Text Panel (bottom-left glass card) ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-24 left-6 md:left-12 max-w-sm"
        >
          <div
            className="rounded-2xl p-6 border"
            style={{
              background: "rgba(4,10,20,0.70)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderColor: "rgba(59,130,246,0.18)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 0 40px rgba(59,130,246,0.06)",
            }}
          >
            <div
              className="text-xs font-mono font-bold tracking-widest uppercase mb-3 px-2 py-1 rounded-md w-fit"
              style={{ color: "#38bdf8", background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.20)" }}
            >
              Project ORCA · SIH26176
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold leading-tight mb-2"
              style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}
            >
              India's Sovereign{" "}
              <span style={{ color: "#38bdf8" }}>Marine Intelligence</span>{" "}
              Platform
            </h1>

            <p className="text-sm text-[#7e97b2] leading-relaxed mb-5">
              Real-time AI ocean analytics over the Indian EEZ — built for fishermen, researchers, coast guard & students.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 bg-[#2563eb] hover:bg-[#1d4ed8]"
                style={{
                  boxShadow: "0 0 24px rgba(37,99,235,0.40)",
                }}
              >
                <Sparkles className="h-4 w-4 text-[#38bdf8]" />
                Launch Application
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border transition-all"
                style={{
                  borderColor: "rgba(59,130,246,0.30)",
                  color: "#38bdf8",
                  background: "rgba(59,130,246,0.06)",
                }}
              >
                → Explore as Guest
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#3d5a73] font-mono">
              {["ISRO", "INCOIS", "MOSDAC", "CMFRI", "IndOBIS", "AISStream"].map((src) => (
                <span key={src}>{src}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Live Stat Pills (bottom-right) ── */}
        <div className="absolute bottom-24 right-6 md:right-12 flex flex-col gap-2 max-w-[220px]">
          <StatPill icon={<Radio className="h-4 w-4" />} label="AIS Vessels" value="142 Tracked" color="#06d6a0" />
          <StatPill icon={<Waves className="h-4 w-4" />} label="SST — Arabian Sea" value="28.4°C" color="#38bdf8" />
          <StatPill icon={<Fish className="h-4 w-4" />} label="PFZ Confidence" value="93% — Veraval" color="#ffd166" />
          <StatPill icon={<ShieldCheck className="h-4 w-4" />} label="Nearest IMBL" value="74.2 km SAFE" color="#06d6a0" />
        </div>

        {/* ── Scroll indicator ── */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <div className="text-[10px] text-[#3d5a73] font-mono">SCROLL</div>
          <div className="h-6 w-px" style={{ background: "linear-gradient(to bottom, #38bdf8, transparent)" }} />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          LIVE MARQUEE TICKER
      ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden h-9 border-y"
        style={{
          background: "rgba(59,130,246,0.04)",
          borderColor: "rgba(59,130,246,0.12)",
        }}
      >
        <div
          className="absolute whitespace-nowrap flex items-center h-full text-xs font-mono text-[#7e97b2]"
          style={{ transform: `translateX(-${tickerOffset % (fullTicker.length * 7)}px)` }}
        >
          {fullTicker}&nbsp;&nbsp;&nbsp;{fullTicker}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FEATURE CARDS ROW
      ══════════════════════════════════════════ */}
      <section className="px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div
            className="inline-block text-xs font-mono font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4"
            style={{ color: "#38bdf8", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.20)" }}
          >
            What ORCA Delivers
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}
          >
            One Platform. Every Maritime Need.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: <Waves className="h-6 w-6" />,
              color: "#38bdf8",
              title: "Ocean Intelligence",
              desc: "Real-time SST, chlorophyll-a, current vectors, PFZ AI analysis, and INCOIS satellite feeds — all fused into a single interactive globe.",
              tags: ["SST", "Chl-a", "Currents", "PFZ"],
            },
            {
              icon: <ShieldCheck className="h-6 w-6" />,
              color: "#06d6a0",
              title: "Sovereign Security",
              desc: "IMBL geofencing, live AIS vessel tracking, COLREGs collision risk, and a coast guard tactical command center with SITREP generation.",
              tags: ["IMBL", "AIS", "COLREGs", "SITREP"],
            },
            {
              icon: <Fish className="h-6 w-6" />,
              color: "#ffd166",
              title: "Fisheries Guidance",
              desc: "PFZ predictions, solunar feeding windows, live market prices, fuel-optimal A* routing, and vernacular voice advisories in 6 Indian languages.",
              tags: ["PFZ", "Tidal", "Route", "Market"],
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="rounded-2xl p-6 border group hover:scale-[1.02] transition-transform duration-300"
              style={{
                background: "rgba(7,20,34,0.80)",
                backdropFilter: "blur(16px)",
                borderColor: `${card.color}20`,
                boxShadow: `0 4px 32px rgba(0,0,0,0.6)`,
              }}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 border"
                style={{
                  color: card.color,
                  background: `${card.color}14`,
                  borderColor: `${card.color}28`,
                }}
              >
                {card.icon}
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {card.title}
              </h3>
              <p className="text-sm text-[#7e97b2] leading-relaxed mb-4">{card.desc}</p>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md border"
                    style={{ color: card.color, borderColor: `${card.color}25`, background: `${card.color}0d` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LIVE STATS COUNTER BAR
      ══════════════════════════════════════════ */}
      <section
        className="py-14 border-y"
        style={{ borderColor: "rgba(59,130,246,0.10)", background: "rgba(59,130,246,0.02)" }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 px-6 text-center">
          {[
            { label: "Indian EEZ", value: 2020000, suffix: " km²", color: "#38bdf8" },
            { label: "Vessels Tracked", value: 142, suffix: " Live", color: "#06d6a0" },
            { label: "SST Resolution", value: 9, suffix: " km", color: "#4eaaff" },
            { label: "PFZ Accuracy", value: 93, suffix: "%", color: "#ffd166" },
            { label: "Indian Languages", value: 6, suffix: " Supported", color: "#f0b429" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="text-3xl md:text-4xl font-bold font-mono mb-1"
                style={{ color: stat.color }}
              >
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-[#7e97b2] font-mono">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          USER PERSONA CARDS
      ══════════════════════════════════════════ */}
      <section className="px-6 md:px-12 py-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div
            className="inline-block text-xs font-mono font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4"
            style={{ color: "#4eaaff", background: "rgba(78,170,255,0.08)", border: "1px solid rgba(78,170,255,0.20)" }}
          >
            Built For You
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em" }}
          >
            Choose Your ORCA Persona
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Compass, title: "Navigator", subtitle: "Commercial Fisher", desc: "Optimal routes, daily catch windows, fuel savings & sea safety.", color: "#f59e0b", href: "/signup?role=navigator" },
            { icon: Microscope, title: "Researcher", subtitle: "Marine Scientist", desc: "NetCDF analysis, satellite parameters, dataset export & citations.", color: "#38bdf8", href: "/signup?role=researcher" },
            { icon: ShieldCheck, title: "Defense", subtitle: "Coast Guard", desc: "IMBL enforcement, AIS tracking, COLREGs & tactical SITREPs.", color: "#ef4444", href: "/signup?role=defense" },
            { icon: GraduationCap, title: "Student", subtitle: "Ocean Learner", desc: "Ocean physics, marine biology, guided explanations & quizzes.", color: "#60a5fa", href: "/signup?role=student" },
          ].map((p, i) => {
            const PersonaCardIcon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.09 }}
              >
                <Link
                  href={p.href}
                  className="block h-full rounded-2xl p-5 border group transition-all duration-300 hover:scale-105"
                  style={{
                    background: "rgba(7,20,40,0.85)",
                    borderColor: `${p.color}30`,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/40 w-fit mb-3">
                    <PersonaCardIcon className="h-6 w-6" style={{ color: p.color }} />
                  </div>
                  <div className="font-bold text-base mb-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                    {p.title}
                  </div>
                  <div className="text-[11px] font-mono mb-3" style={{ color: p.color }}>
                    {p.subtitle}
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">{p.desc}</p>
                  <div
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: p.color }}
                  >
                    Get started <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DATA SOURCES STRIP
      ══════════════════════════════════════════ */}
      <section className="py-12 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="text-center mb-8">
          <div className="text-xs text-[#3d5a73] font-mono tracking-widest uppercase">
            Powered By Official Indian & Global Data Sources
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 px-6 text-sm font-mono">
          {[
            ["ISRO / MOSDAC", "#4eaaff"],
            ["INCOIS ERDDAP", "#38bdf8"],
            ["NASA GIBS", "#06d6a0"],
            ["CMFRI", "#ffd166"],
            ["IndOBIS", "#ffd166"],
            ["AISStream.io", "#06d6a0"],
            ["GEBCO 2024", "#7e97b2"],
            ["IMD / INCOIS", "#7e97b2"],
          ].map(([name, color]) => (
            <span key={name} style={{ color }} className="opacity-70 hover:opacity-100 transition-opacity">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="px-6 py-24 text-center relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.07), transparent)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-2xl mx-auto"
        >
          <div
            className="inline-block text-xs font-mono font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6"
            style={{ color: "#38bdf8", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.20)" }}
          >
            Ready to Explore?
          </div>
          <h2
            className="text-3xl md:text-5xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.025em" }}
          >
            India's Ocean, In Your Hands
          </h2>
          <p className="text-base text-[#7e97b2] mb-10 max-w-xl mx-auto leading-relaxed">
            Join fishermen, researchers, and coast guard operators using ORCA to navigate India's maritime domain with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95 bg-[#2563eb] hover:bg-[#1d4ed8]"
              style={{
                boxShadow: "0 0 40px rgba(37,99,235,0.45)",
              }}
            >
              <Sparkles className="h-5 w-5 text-[#38bdf8]" />
              Get Started — Select Your Profile
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border transition-all"
              style={{
                borderColor: "rgba(59,130,246,0.30)",
                color: "#38bdf8",
                background: "rgba(59,130,246,0.06)",
              }}
            >
              → Explore the Globe
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer
        className="border-t py-8 px-6 text-center"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-[#38bdf8]" />
          <span className="font-mono font-bold text-sm text-[#38bdf8]">
            Project ORCA
          </span>
          <span className="text-[10px] text-[#64748b] font-mono">· SIH26176 ·</span>
          <span className="text-[10px] text-[#64748b] font-mono">
            Sovereign Marine Intelligence Platform
          </span>
        </div>
        <p className="text-xs text-[#64748b] font-mono">
          Data for operational advisory purposes only. Always verify with the Indian Coast Guard.
        </p>
      </footer>
    </div>
  );
}
