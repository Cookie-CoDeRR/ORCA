"use client";
import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setStatus("success"); setEmail(""); }
  };

  return (
    <section className="relative py-20 border-t border-white/10 bg-[#070b14] text-white overflow-hidden">
      {/* Subtle Graticule Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        {/* Subtle Top Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wider uppercase text-[10px]">OPERATIONAL BULLETIN SUBSCRIPTION</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Receive Real-Time Ocean Intelligence</h2>
        <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-lg mx-auto font-normal">
          Autonomous storm alerts, PFZ coordinates, and cyclone tracking bulletins delivered directly to your operations desk.
        </p>

        {status === "success" ? (
          <div className="mt-8 px-6 py-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold text-sm shadow-xs flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>You are subscribed to ORCA operational bulletins. First advisory dispatching.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@agency.gov.in"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder-slate-400 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner transition-all"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all whitespace-nowrap shadow-sm shadow-blue-900/40 cursor-pointer"
            >
              Subscribe →
            </button>
          </form>
        )}

        <p className="mt-4 text-slate-500 text-xs font-mono">
          Zero commercial spam. Unsubscribe anytime. SIH 2026 — Project ORCA.
        </p>
      </div>
    </section>
  );
}
