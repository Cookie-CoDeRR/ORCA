"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "About",     href: "#about"     },
  { label: "Mission",   href: "#mission"   },
  { label: "Research",  href: "/research"  },
  { label: "Defense",   href: "/defense"   },
  { label: "Reports",   href: "/report"    },
];

export default function Navbar() {
  const [navTheme, setNavTheme] = useState<"top" | "darkGlass" | "light">("top");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const heroThreshold = window.innerHeight ? window.innerHeight - 80 : 650;
      if (y > heroThreshold) {
        setNavTheme("light");
      } else if (y > 20) {
        setNavTheme("darkGlass");
      } else {
        setNavTheme("top");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const isLight = navTheme === "light";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navTheme === "light"
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs text-slate-900"
          : navTheme === "darkGlass"
          ? "bg-slate-950/85 backdrop-blur-md shadow-lg text-white"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* Sonar ring SVG icon */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="3" fill={isLight ? "#1e3a8a" : "#38bdf8"} />
              <circle cx="16" cy="16" r="7" stroke={isLight ? "#1e3a8a" : "#38bdf8"} strokeWidth="1.5" strokeOpacity="0.7" />
              <circle cx="16" cy="16" r="12" stroke={isLight ? "#1e3a8a" : "#38bdf8"} strokeWidth="1" strokeOpacity="0.35" />
              <line x1="16" y1="16" x2="28" y2="5" stroke={isLight ? "#1e3a8a" : "#38bdf8"} strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" />
            </svg>
            <span className={`font-bold text-xl tracking-widest ${isLight ? "text-slate-950" : "text-white"}`}>
              ORCA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isLight
                    ? "text-slate-700 hover:text-blue-700"
                    : "text-slate-200 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 shadow-sm ${
                isLight
                  ? "bg-blue-900 hover:bg-blue-800 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              Launch Dashboard →
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden p-1 ${isLight ? "text-slate-700 hover:text-slate-950" : "text-slate-200 hover:text-white"}`}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden bg-white rounded-b-xl border-t border-slate-200 p-4 shadow-xl space-y-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block text-slate-800 hover:text-blue-700 text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="block mt-2 px-4 py-2.5 rounded-md bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold text-center shadow-xs"
            >
              Launch Dashboard →
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
