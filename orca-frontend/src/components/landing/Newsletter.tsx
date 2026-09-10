"use client";
import { useState } from "react";
import Link from "next/link";

export default function FinalCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStatus("success");
      setEmail("");
    }
  };

  return (
    <section className="relative py-20 sm:py-24 border-t border-white/10 bg-[#070b14] text-white overflow-hidden">
      {/* Subtle Graticule Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center font-sans">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="font-medium text-slate-300">
            Sovereign Ocean Platform
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          Explore India&apos;s Marine Intelligence
        </h2>
        <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-normal">
          Use ORCA to investigate ocean conditions, satellite data, and collaborative marine assessments across India&apos;s EEZ.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-7 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-900/40 text-center"
          >
            Open ORCA Platform
          </Link>
          <Link
            href="/research/data"
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all text-center"
          >
            Explore Ocean Data
          </Link>
        </div>

        {/* Email Subscription Strip */}
        <div className="mt-14 pt-10 border-t border-white/10 max-w-md mx-auto">
          <p className="text-xs font-semibold text-slate-400 mb-3">
            Receive Marine Intelligence
          </p>

          {status === "success" ? (
            <div className="p-3.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Subscribed to ORCA advisories and marine bulletins.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scientist@agency.res.in"
                className="flex-1 px-3.5 py-2.5 rounded-md bg-white/5 border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-md bg-white text-slate-950 hover:bg-slate-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}
          <p className="mt-3 text-slate-400 text-[11px] font-normal">
            Direct operational advisories · Zero commercial spam
          </p>
        </div>
      </div>
    </section>
  );
}
