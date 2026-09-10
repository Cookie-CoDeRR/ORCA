"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Floating, Auto-Hiding Overlay Scrollbar.
 * 
 * - Native browser scrollbars and gutters are hidden via CSS.
 * - This floating scrollbar thumb is 100% invisible when idle.
 * - When scrolling, it smoothly fades in at the exact scroll position.
 * - 800ms after scrolling stops, it smoothly fades out.
 */
export default function ScrollbarAutoHider() {
  const [isScrolling, setIsScrolling] = useState(false);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(40);
  const [isOverDark, setIsOverDark] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const updateScrollMetrics = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollHeight <= clientHeight) {
        setThumbHeight(0);
        return;
      }

      // Calculate proportional thumb height (min 36px, max 160px)
      const ratio = clientHeight / scrollHeight;
      const height = Math.max(36, Math.min(160, clientHeight * ratio));
      setThumbHeight(height);

      // Calculate thumb top position with 6px margins
      const maxScroll = scrollHeight - clientHeight;
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      const trackSpace = clientHeight - height - 12; // 6px padding top & bottom
      const top = 6 + scrollProgress * trackSpace;
      setThumbTop(top);

      // Contrast color based on hero section vs lower light sections
      setIsOverDark(scrollY < (clientHeight - 80));

      // Trigger visibility
      setIsScrolling(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 800);
    };

    window.addEventListener("scroll", updateScrollMetrics, { passive: true });
    window.addEventListener("resize", updateScrollMetrics, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollMetrics);
      window.removeEventListener("resize", updateScrollMetrics);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (thumbHeight === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-1 bottom-0 w-1.5 pointer-events-none z-50 select-none"
    >
      <div
        className={`w-full rounded-full transition-opacity duration-300 ${
          isOverDark
            ? "bg-white/60 shadow-xs"
            : "bg-slate-900/50 shadow-xs"
        }`}
        style={{
          height: `${thumbHeight}px`,
          transform: `translateY(${thumbTop}px)`,
          opacity: isScrolling ? 1 : 0,
        }}
      />
    </div>
  );
}
