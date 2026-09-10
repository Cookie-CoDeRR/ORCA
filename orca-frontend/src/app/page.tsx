import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import OceanAtAGlance from "@/components/landing/OceanAtAGlance";
import FeaturedAlert from "@/components/landing/FeaturedAlert";
import WhatOrcaDoes from "@/components/landing/WhatOrcaDoes";
import FeaturedAnalysis from "@/components/landing/FeaturedAnalysis";
import EarthOceanScience from "@/components/landing/EarthOceanScience";
import DataAndResearch from "@/components/landing/DataAndResearch";
import EngineeringResearch from "@/components/landing/EngineeringResearch";
import ExploreOrca from "@/components/landing/ExploreOrca";
import FinalCTA from "@/components/landing/Newsletter";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Sticky navigation */}
      <Navbar />

      {/* 01 — HERO */}
      <Hero />

      {/* 02 — OCEAN AT A GLANCE */}
      <OceanAtAGlance />

      {/* 03 — FEATURED ALERT / OPERATION */}
      <FeaturedAlert />

      {/* 04 — WHAT ORCA DOES */}
      <WhatOrcaDoes />

      {/* 05 — FEATURED ANALYSIS */}
      <FeaturedAnalysis />

      {/* 06 — EARTH & OCEAN SCIENCE */}
      <EarthOceanScience />

      {/* 07 — DATA & RESEARCH */}
      <DataAndResearch />

      {/* 08 — ENGINEERING / MISSION RESEARCH */}
      <EngineeringResearch />

      {/* 09 — EXPLORE ORCA */}
      <ExploreOrca />

      {/* 10 — FINAL CTA & FOOTER */}
      <FinalCTA />
      <Footer />
    </main>
  );
}
