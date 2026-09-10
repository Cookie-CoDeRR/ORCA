import Navbar       from "@/components/landing/Navbar";
import Hero          from "@/components/landing/Hero";
import TelemetryBar  from "@/components/landing/TelemetryBar";
import StatsBar      from "@/components/landing/StatsBar";
import FeaturedNews  from "@/components/landing/FeaturedNews";
import FeatureStory  from "@/components/landing/FeatureStory";
import ImageGallery  from "@/components/landing/ImageGallery";
import GraticuleBar  from "@/components/landing/GraticuleBar";
import ResourceLinks from "@/components/landing/ResourceLinks";
import ArticleGrid   from "@/components/landing/ArticleGrid";
import Newsletter    from "@/components/landing/Newsletter";
import Footer        from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen text-slate-900">
      {/* Sticky navigation */}
      <Navbar />

      {/* 1. Hero — full screen, Indian Ocean from ISS */}
      <Hero />

      {/* 2. Subtle Dark Telemetry Bar */}
      <TelemetryBar />

      {/* 3. Stats bar */}
      <StatsBar />

      {/* 4. Featured alerts / news grid */}
      <FeaturedNews />

      {/* 5. Feature story — cyclone agent prediction */}
      <FeatureStory />

      {/* 6. Image gallery strip (NASA Earth Science style) */}
      <ImageGallery />

      {/* 7. Subtle Dark Geodetic Coordinate Bar */}
      <GraticuleBar />

      {/* 8. Reference data sources */}
      <ResourceLinks />

      {/* 9. Article grid — deep dives & research publications */}
      <ArticleGrid />

      {/* 10. Dark Newsletter CTA */}
      <Newsletter />

      {/* 11. NASA-style Deep Black Footer */}
      <Footer />
    </div>
  );
}
