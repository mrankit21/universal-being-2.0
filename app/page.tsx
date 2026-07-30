import type { Metadata } from "next";
import { Fragment } from "react";

import { getResolvedHomepage } from "@/lib/api/home";
import { getResolvedHomepage2 } from "@/lib/api/home2";
import { getSiteSettings } from "@/lib/api/site-settings";
import { getHomepageVisibleDestinations } from "@/lib/api/destinations";
import { HeroSection } from "@/components/home/hero-section";
import { PackageIncludesStrip } from "@/components/home/package-includes-strip";
import { FeaturedTripsSection } from "@/components/home/featured-trips-section";
import { ThemeExplorerSection } from "@/components/home/theme-explorer-section";
import { ValuePropsSection } from "@/components/home/value-props-section";
import { HeroParallax } from "@/components/home/v2/hero-parallax";
import { FloatingQuickLinks } from "@/components/home/v2/floating-quick-links";
import { FeaturedTripsStack } from "@/components/home/v2/featured-trips-stack";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { PromoBannerSection } from "@/components/home/promo-banner-section";
import { CtaSection } from "@/components/home/cta-section";
import { PageFadeIn } from "@/components/animation/page-fade-in";
import { HomeJsonLd } from "@/components/home/home-json-ld";
import type { HomepageSectionKey } from "@/lib/db/models";

export const metadata: Metadata = {
  title: "Universal Being — Curated group trips, themed to the destination",
  description:
    "Small, curated group trips across India. Every trip is themed to its destination — the mood changes, the care behind it doesn't.",
};

/**
 * Homepage — Step 5 base, Step 7.5A–C (cinematic hero, premium sections,
 * motion polish), Step 7.6C-B Part 1 (Homepage CMS + database-first
 * homepage), Homepage 2.0 (version toggle).
 *
 * This is an async Server Component. It first reads Site Settings'
 * `activeHomepageVersion` ("v1" or "v2") — set from Admin Panel → Site
 * Settings → Homepage Version — and renders whichever hero + featured
 * trips layout is selected:
 *
 *   - "v1": `HeroSection` + `PackageIncludesStrip` + `FeaturedTripsSection`,
 *     driven by `getResolvedHomepage()` (Admin Panel → Homepage).
 *   - "v2": `HeroParallax` + `FloatingQuickLinks` + `FeaturedTripsStack`,
 *     driven by `getResolvedHomepage2()` (Admin Panel → Homepage 2.0).
 *
 * Every other section (Theme Explorer, Value Props, Testimonials, Promo
 * Banner, CTA) is shared between both versions and keeps coming from
 * `getResolvedHomepage()` — only the hero + featured-trips content swap.
 * Section order/visibility below `hero`/`featuredTrips` stay admin-
 * controlled exactly as before.
 *
 * RootShell (header/footer/nav/search/sticky CTA) and ThemeProvider are
 * already wired in app/layout.tsx, so this file only supplies the
 * homepage-specific sections that render inside RootShell's <main>.
 */
export default async function HomePage() {
  const [homepage, destinations, siteSettings] = await Promise.all([
    getResolvedHomepage(),
    getHomepageVisibleDestinations(),
    getSiteSettings(),
  ]);

  const isV2 = siteSettings.activeHomepageVersion === "v2";
  const homepage2 = isV2 ? await getResolvedHomepage2() : null;

  const sectionRenderers: Partial<Record<HomepageSectionKey, React.ReactNode>> = {
    hero: homepage.sectionVisibility.hero ? (
      homepage2 ? (
        <Fragment key="hero">
          <HeroParallax {...homepage2.hero} />
          <FloatingQuickLinks items={homepage2.quickLinks} />
        </Fragment>
      ) : (
        <Fragment key="hero">
          <HeroSection slides={homepage.heroSlides} />
          <PackageIncludesStrip />
        </Fragment>
      )
    ) : null,
    featuredTrips: homepage.sectionVisibility.featuredTrips ? (
      homepage2 ? (
        <FeaturedTripsStack key="featuredTrips" trips={homepage2.featuredTrips} />
      ) : (
        <FeaturedTripsSection key="featuredTrips" trips={homepage.featuredTrips} />
      )
    ) : null,
    themeExplorer: homepage.sectionVisibility.themeExplorer ? (
      <ThemeExplorerSection key="themeExplorer" destinations={destinations} />
    ) : null,
    valueProps: homepage.sectionVisibility.valueProps ? (
      <ValuePropsSection key="valueProps" background={homepage.valuePropsSection} />
    ) : null,
    testimonials: homepage.sectionVisibility.testimonials ? (
      <TestimonialsSection
        key="testimonials"
        testimonials={homepage.testimonials}
        background={homepage.testimonialsSection}
      />
    ) : null,
    promoBanner: <PromoBannerSection key="promoBanner" config={homepage.promoBanner} />,
    cta: homepage.sectionVisibility.cta ? <CtaSection key="cta" config={homepage.ctaSection} /> : null,
  };

  return (
    <PageFadeIn>
      <HomeJsonLd />
      {homepage.sectionOrder.map((key) => sectionRenderers[key] ?? null)}
    </PageFadeIn>
  );
}
