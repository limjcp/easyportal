import { useEffect, useMemo, useState } from "react";
import { marketingRepository } from "../../data/supabase/marketingRepository";
import { homePageContent } from "../data/pageContent/home";
import type {
  MarketingPageBlock,
} from "../data/pageContent/types";
import { SITE_HIGHLIGHT_METRICS } from "../data/siteContent";
import { MARKETING_HOME_FEATURE_LINKS } from "../navigation";
import { ContactSection } from "../components/home/ContactSection";
import { ExploreSection } from "../components/home/ExploreSection";
import { PartnerLogosSection } from "../components/home/PartnerLogosSection";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { HeroSection } from "../components/home/HeroSection";
import { QuoteSection } from "../components/home/QuoteSection";
import { HistoryTimelineSection } from "../components/home/HistoryTimelineSection";
import { StudioSection } from "../components/home/StudioSection";
import { TestimonialsSection } from "../components/home/TestimonialsSection";
import type { CompanyMasterReportStats } from "../../resident/data/types";

type HomePageProps = {
  onNavigate: (path: string) => void;
};

const FEATURE_IMAGES = [
  { imageUrl: "", imageAlt: "Condo community lifestyle" },
  { imageUrl: "/images/building-card.jpg", imageAlt: "Condominium building" },
  {
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
    imageAlt: "Modern condominium exterior",
  },
  { imageUrl: "/images/condo-courtyard.svg", imageAlt: "Condo courtyard" },
];

const QUOTE_IMAGE = {
  imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80",
  imageAlt: "Condominium architecture detail",
};

function getBlock<T extends MarketingPageBlock["kind"]>(kind: T) {
  return homePageContent.blocks.find((block) => block.kind === kind);
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [stats, setStats] = useState<CompanyMasterReportStats | null>(null);

  useEffect(() => {
    marketingRepository
      .getPublicMarketingStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const heroBlock = getBlock("hero");
  const featureBlock = getBlock("feature-grid");
  const testimonialBlock = getBlock("testimonial-grid");
  const ctaBlock = getBlock("cta-band");

  const featureItems = useMemo(() => {
    if (!featureBlock || featureBlock.kind !== "feature-grid") {
      return [];
    }

    return featureBlock.items.map((item, index) => ({
      ...item,
      imageUrl: index === 0 && heroBlock?.kind === "hero" && heroBlock.imageUrl
        ? heroBlock.imageUrl
        : FEATURE_IMAGES[index]?.imageUrl ?? FEATURE_IMAGES[1].imageUrl,
      imageAlt: FEATURE_IMAGES[index]?.imageAlt ?? item.title,
    }));
  }, [featureBlock, heroBlock]);

  const liveMetrics = useMemo(
    () => [
      { label: "Communities", value: stats?.communities ?? null },
      { label: "Owners", value: stats?.owners ?? null },
      { label: "Activated Users", value: stats?.activatedUsers ?? null },
    ],
    [stats]
  );

  if (!heroBlock || heroBlock.kind !== "hero") {
    return null;
  }

  const featuredTestimonial =
    testimonialBlock?.kind === "testimonial-grid" ? testimonialBlock.items[0] : null;

  return (
    <>
      <HeroSection
        eyebrow={heroBlock.eyebrow}
        title={heroBlock.title}
        subtitle={heroBlock.subtitle}
        imageUrl={heroBlock.imageUrl}
        imageAlt={heroBlock.imageAlt}
        actions={heroBlock.actions}
        onNavigate={onNavigate}
      />

      {featureBlock?.kind === "feature-grid" && (
        <FeaturesSection title={featureBlock.title} subtitle={featureBlock.subtitle} items={featureItems} />
      )}

      {featuredTestimonial && (
        <QuoteSection testimonial={featuredTestimonial} imageUrl={QUOTE_IMAGE.imageUrl} imageAlt={QUOTE_IMAGE.imageAlt} />
      )}

      <HistoryTimelineSection />

      <StudioSection
        pageTitle={homePageContent.pageTitle}
        pageIntro={homePageContent.pageIntro}
        liveMetrics={liveMetrics}
        highlightMetrics={SITE_HIGHLIGHT_METRICS}
      />

      {testimonialBlock?.kind === "testimonial-grid" && (
        <TestimonialsSection
          title={testimonialBlock.title}
          subtitle={testimonialBlock.subtitle}
          items={testimonialBlock.items}
        />
      )}

      <ExploreSection items={MARKETING_HOME_FEATURE_LINKS} onNavigate={onNavigate} />

      <PartnerLogosSection onNavigate={onNavigate} />

      {ctaBlock?.kind === "cta-band" && (
        <ContactSection
          title={ctaBlock.title}
          text={ctaBlock.text}
          action={ctaBlock.action}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
}
