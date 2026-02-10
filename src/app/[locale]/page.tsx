"use client";

import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { ColorDebug } from "@/components/color-debug";

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      <Navigation />
      <main className="space-y-0">
        <HeroSection />
        <FeaturesSection />
        {/* <PricingSection /> */}
        {/* <FAQSection /> */}
      </main>
      <Footer />
      <ColorDebug />
    </div>
  );
}
