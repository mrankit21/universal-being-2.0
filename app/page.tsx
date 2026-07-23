import type { Metadata } from "next";
import { Fragment } from "react";

import { getResolvedHomepage } from "@/lib/api/home";
import { getHomepageVisibleDestinations } from "@/lib/api/destinations";
import { HeroSection } from "@/components/home/hero-section";
import { PackageIncludesStrip } from "@/components/home/package-includes-strip";
import { ThemeExplorerSection } from "@/components/home/theme-explorer-section";
import { FeaturedTripsSection } from "@/components/home/featured-trips-section";
import { ValuePropsSection } from "@/components/home/value-props-section";
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
 * homepage).
 *
 * This is now an async Server Component: `getResolvedHomepage()` is the
 * ONE call that reads the Homepage singleton from MongoDB (admin-editable
 * via Homepage Management), resolves Featured Trips/Testimonials against
 * their real collections, and falls back to `data/home/*.ts` for any
 * section the database doesn't have content for yet. Every section below
 * is now a pure prop-driven component — none of them fetch their own data
 * or import static data files directly anymore (see each component's own
 * doc comment). Section order and per-section visibility are both admin-
 * controlled and applied here, in one place, so adding/reordering a
 * section is a Homepage Management save, never a code change.
 *
 * RootShell (header/footer/nav/search/sticky CTA) and ThemeProvider are
 * already wired in app/layout.tsx, so this file only supplies the
 * homepage-specific sections that render inside RootShell's <main>.
 *
 * Auth, MongoDB, the Admin Panel, APIs, the booking flow, Middleware, and
 * the Theme Engine were not touched by this phase.
 */
export default async function HomePage() {
  const [homepage, destinations] = await Promise.all([
    getResolvedHomepage(),
    getHomepageVisibleDestinations(),
  ]);

  const sectionRenderers: Partial<Record<HomepageSectionKey, React.ReactNode>> = {
    hero: homepage.sectionVisibility.hero ? (
      <Fragment key="hero">
        <HeroSection slides={homepage.heroSlides} />
        <PackageIncludesStrip />
      </Fragment>
    ) : null,
    featuredTrips: homepage.sectionVisibility.featuredTrips ? (
      <FeaturedTripsSection key="featuredTrips" trips={homepage.featuredTrips} />
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