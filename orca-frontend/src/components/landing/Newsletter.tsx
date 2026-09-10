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
    <section className="py-20 border-t border-slate-200 bg-gradient-to-b from-white to-blue-50/40">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <svg className="w-6 h-6 text-blue-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-slate-950">Receive Real-Time Ocean Intelligence</h2>
        <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-lg mx-auto">
          Autonomous storm alerts, PFZ coordinates, and cyclone tracking bulletins delivered directly to your operations desk.
        </p>

        {status === "success" ? (
          <div className="mt-8 px-6 py-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm shadow-xs flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
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
              className="flex-1 px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-950 placeholder-slate-400 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 shadow-xs transition-all"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm transition-all whitespace-nowrap shadow-xs"
            >
              Subscribe →
            </button>
          </form>
        )}

        <p className="mt-4 text-slate-500 text-xs font-medium">
          Zero commercial spam. Unsubscribe anytime. SIH 2026 — Project ORCA.
        </p>
      </div>
    </section>
  );
}
