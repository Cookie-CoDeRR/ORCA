import Navbar       from "@/components/landing/Navbar";
import Hero          from "@/components/landing/Hero";
import FeaturedNews  from "@/components/landing/FeaturedNews";
import StatsBar      from "@/components/landing/StatsBar";
import FeatureStory  from "@/components/landing/FeatureStory";
import ImageGallery  from "@/components/landing/ImageGallery";
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

      {/* 2. Stats bar */}
      <StatsBar />

      {/* 3. Featured alerts / news grid */}
      <FeaturedNews />

      {/* 4. Feature story — cyclone agent prediction */}
      <FeatureStory />

      {/* 5. Image gallery strip */}
      <ImageGallery />

      {/* 6. Reference data sources */}
      <ResourceLinks />

      {/* 7. Article grid — deep dives */}
      <ArticleGrid />

      {/* 8. Newsletter CTA */}
      <Newsletter />

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}
