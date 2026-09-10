"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import defaultNews from "@/data/landing-news.json";

function SmartLink({ href, children, className, ...props }: any) {
  const isExternal = typeof href === "string" && (href.startsWith("http://") || href.startsWith("https://"));
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href || "/"} className={className} {...props}>
      {children}
    </Link>
  );
}

export default function FeaturedNews() {
  const [data, setData] = useState(defaultNews);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const stories =
    (data as any).heroStories && (data as any).heroStories.length > 0
      ? (data as any).heroStories
      : [data.heroFeature];

  // Auto-cycle through news stories and their images every 5 seconds
  useEffect(() => {
    if (isPaused || stories.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % stories.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, stories.length]);

  // Periodic background check to fetch fresh news and remote images from news engine
  useEffect(() => {
    const fetchFreshNews = () => {
      fetch("/api/news")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json && (json.heroStories || json.heroFeature)) {
            setData(json);
          }
        })
        .catch(() => {
          // Gracefully keep current state
        });
    };

    fetchFreshNews();
    const pollInterval = setInterval(fetchFreshNews, 45000);
    return () => clearInterval(pollInterval);
  }, []);

  const currentStory = stories[currentSlide] || stories[0];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % stories.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + stories.length) % stories.length);

  const { centerFeature, stackedFeatures, secondaryUpdates } = data;

  return (
    <section id="mission" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <p className="text-blue-700 text-xs font-bold tracking-widest uppercase font-mono">
              OFFICIAL SENSORY BULLETINS & OPERATIONS
            </p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-shimmer">
            Featured Alerts & Operations
          </h2>
        </div>
        <Link
          href="/research"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-blue-700 transition-colors group self-start sm:self-auto"
        >
          <span>View All Official Bulletins</span>
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>
      </div>

      {/* 2. Upper Grid (The Bento Box): 3 Columns on Desktop (50% / 25% / 25%) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Column 1 (Left - 50% width / lg:col-span-2): Cycling Hero Card */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="lg:col-span-2 group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 block min-h-[420px] lg:h-[480px] animate-fade-in-up stagger-1"
        >
          <SmartLink href={currentStory.href} className="block w-full h-full">
            {/* Stacked Images for Smooth Crossfade Cycling */}
            {stories.map((story: any, idx: number) => (
              <div
                key={story.id || idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  idx === currentSlide ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"
                }`}
              >
                <Image
                  src={story.img}
                  alt={story.title}
                  fill
                  unoptimized={typeof story.img === "string" && (story.img.startsWith("/api/") || story.img.includes("?"))}
                  priority={idx === 0}
                  className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.88]"
                />
              </div>
            ))}

            {/* Subtle dark gradient overlay for typography readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent z-10 pointer-events-none" />

            {/* Clean minimal top pills: 1 category on left, bulletin ID & cycle controls on right */}
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-20">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/60 backdrop-blur-md text-white text-xs font-bold tracking-wider uppercase border border-white/10 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {currentStory.tag}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                  {currentStory.bulletin}
                </span>

                {/* Subtle Cycle Controls */}
                {stories.length > 1 && (
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-white text-xs font-mono">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        prevSlide();
                      }}
                      aria-label="Previous story"
                      className="w-4 h-4 flex items-center justify-center hover:text-sky-300 transition-colors cursor-pointer text-sm leading-none"
                    >
                      ‹
                    </button>
                    <span className="text-[10px] text-white/80 font-bold px-1">
                      {currentSlide + 1}/{stories.length}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        nextSlide();
                      }}
                      aria-label="Next story"
                      className="w-4 h-4 flex items-center justify-center hover:text-sky-300 transition-colors cursor-pointer text-sm leading-none"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20">
              <p className="text-white/80 text-[11px] font-bold tracking-widest uppercase font-mono mb-2">
                {currentStory.readTime} · {currentStory.date}
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight group-hover:text-blue-300 transition-colors drop-shadow-sm">
                {currentStory.title}
              </h3>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-2 max-w-xl font-normal">
                {currentStory.excerpt}
              </p>

              {/* Progress dots indicating slide progression */}
              {stories.length > 1 && (
                <div className="mt-4 flex items-center gap-2">
                  {stories.map((_: any, dotIdx: number) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentSlide(dotIdx);
                      }}
                      aria-label={`Jump to slide ${dotIdx + 1}`}
                      className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                        dotIdx === currentSlide
                          ? "w-8 bg-sky-400"
                          : "w-2.5 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </SmartLink>
        </div>

        {/* Column 2 (Center - 25% width / lg:col-span-1): Tall Portrait Card */}
        <SmartLink
          href={centerFeature.href}
          className="lg:col-span-1 group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 block min-h-[420px] lg:h-[480px] animate-fade-in-up stagger-2"
        >
          <Image
            src={centerFeature.img}
            alt={centerFeature.title}
            fill
            unoptimized={typeof centerFeature.img === "string" && (centerFeature.img.startsWith("/api/") || centerFeature.img.includes("?"))}
            className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.85]"
          />
          {/* Subtle dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Clean minimal top pills */}
          <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/60 backdrop-blur-md text-white text-xs font-bold tracking-wider uppercase border border-white/10 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {centerFeature.tag}
            </span>
            <span className="text-xs font-mono text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
              {centerFeature.bulletin}
            </span>
          </div>

          {/* Bottom text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-white/80 text-[10px] font-bold tracking-widest uppercase font-mono mb-2">
              {centerFeature.readTime} · {centerFeature.date}
            </p>
            <h3 className="text-xl font-bold text-white leading-snug group-hover:text-blue-300 transition-colors drop-shadow-sm">
              {centerFeature.title}
            </h3>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3 font-normal">
              {centerFeature.excerpt}
            </p>
          </div>
        </SmartLink>

        {/* Column 3 (Right - 25% width / lg:col-span-1): Two Smaller Stacked Cards */}
        <div className="lg:col-span-1 md:col-span-2 flex flex-col gap-6 lg:h-[480px]">
          {stackedFeatures.map((card, i) => (
            <SmartLink
              key={card.id}
              href={card.href}
              className={`flex-1 group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 block min-h-[200px] animate-fade-in-up stagger-${
                i + 3
              }`}
            >
              <Image
                src={card.img}
                alt={card.title}
                fill
                unoptimized={typeof card.img === "string" && (card.img.startsWith("/api/") || card.img.includes("?"))}
                className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.80]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

              {/* Clean minimal top pills */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[11px] font-bold tracking-wider uppercase border border-white/10 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  {card.tag}
                </span>
                <span className="text-[11px] font-mono text-white/80 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  {card.bulletin}
                </span>
              </div>

              {/* Bottom text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white/80 text-[10px] font-bold tracking-widest uppercase font-mono mb-1">
                  {card.readTime}
                </p>
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug group-hover:text-blue-300 transition-colors line-clamp-2 drop-shadow-sm">
                  {card.title}
                </h3>
              </div>
            </SmartLink>
          ))}
        </div>
      </div>

      {/* 3. Lower Row (Secondary Updates): 4 Distinct Operational Updates */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {secondaryUpdates.map((item) => (
            <SmartLink
              key={item.id}
              href={item.href}
              className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors duration-200 border border-transparent hover:border-slate-200"
            >
              {/* Left circular thumbnail */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-xs bg-slate-100">
                <Image
                  src={item.thumb}
                  alt={item.title}
                  fill
                  unoptimized={typeof item.thumb === "string" && (item.thumb.startsWith("/api/") || item.thumb.includes("?"))}
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Right text block */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">
                    {item.readTime}
                  </span>
                  <span className="text-[8px] font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                    {item.bulletinNo}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-950 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2 mt-0.5">
                  {item.title}
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1 mt-1 font-mono">
                  {item.category}
                </p>
              </div>
            </SmartLink>
          ))}
        </div>
      </div>
    </section>
  );
}
