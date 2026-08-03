import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getResolvedTrip2, getAllPublishedTrip2Slugs, type ResolvedTrip2 } from "@/lib/api/trip2";
import { getSiteSettings, type ResolvedSiteSettings } from "@/lib/api/site-settings";
import { opacityStepToPercent } from "@/lib/theme/section-backdrop-opacity";

import { TripHeroV2 } from "@/components/trip/v2/trip-hero-v2";
import { TripTitleV2 } from "@/components/trip/v2/trip-title-v2";
import { QuickLinksV2, type QuickLinkV2 } from "@/components/trip/v2/quick-links-v2";
import { SectionBackdropV2 } from "@/components/trip/v2/section-backdrop-v2";
import { GalleryGridV2, type GalleryImageV2 } from "@/components/trip/v2/gallery-grid-v2";
import type { ItineraryDayV2 } from "@/components/trip/v2/itinerary-timeline-v2";
import { InclusionsExclusionsV2 } from "@/components/trip/v2/inclusions-exclusions-v2";
import { PriceV2 } from "@/components/trip/v2/price-v2";
import { PickupVariantsV2, type PickupVariantV2 } from "@/components/trip/v2/pickup-variants-v2";
import { BatchDatesV2, type BatchDateV2 } from "@/components/trip/v2/batch-dates-v2";
import { ThingsToExperienceV2, type ExperienceCardV2 } from "@/components/trip/v2/things-to-experience-v2";
import { DidYouKnowV2, type DidYouKnowCardV2 } from "@/components/trip/v2/did-you-know-v2";
import { LetsPlanYourTripV2 } from "@/components/trip/v2/lets-plan-your-trip-v2";
import { FaqAccordionV2, type FaqV2 } from "@/components/trip/v2/faq-accordion-v2";

const FALLBACK_HERO_IMAGE = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2000&auto=format&fit=crop";
const BACKDROP_A = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600&auto=format&fit=crop";
const BACKDROP_B = "https://images.unsplash.com/photo-1520769669658-f07657f5a307?q=80&w=1600&auto=format&fit=crop";

type Params = { params: Promise<{ slug: string }> };

/**
 * Trip 2.0 — live, backend-connected trip page. Fetches one published
 * `Trip2` document via `getResolvedTrip2()` and renders it through the
 * exact same `components/trip/v2/*` used by the approved `/new-trip`
 * static preview (kept untouched on purpose — see that file's doc
 * comment). Every array field is passed as `undefined` rather than `[]`
 * when the admin hasn't filled it in yet, so an in-progress Trip 2.0 page
 * gracefully falls back to each component's own built-in placeholder
 * content instead of rendering a blank section.
 */
export async function generateStaticParams() {
  const slugs = await getAllPublishedTrip2Slugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getResolvedTrip2(slug);
  if (!trip) return { title: "Trip not found — Universal Being" };
  return {
    title: `${trip.title} — Universal Being`,
    description: trip.shortDescription || undefined,
  };
}

function orUndefined<T>(arr: T[] | undefined): T[] | undefined {
  return arr && arr.length > 0 ? arr : undefined;
}

type ImgLike = { url?: string; alt?: string; isPlaceholder?: boolean } | undefined;

function resolveImage(img: ImgLike, fallbackUrl: string, fallbackAlt: string) {
  if (img?.url && !img.isPlaceholder) return { url: img.url, alt: img.alt || fallbackAlt };
  return { url: fallbackUrl, alt: fallbackAlt };
}

type BackdropLike = { image?: ImgLike; opacity?: number } | undefined;

/** Resolves one `Trip.sectionBackdrops.*` entry: admin-uploaded photo +
 * opacity when set, otherwise the existing hardcoded default photo at
 * the original 88 opacity. */
function resolveBackdrop(backdrop: BackdropLike, fallbackUrl: string, fallbackAlt: string) {
  const img = resolveImage(backdrop?.image, fallbackUrl, fallbackAlt);
  return { ...img, opacity: backdrop?.opacity ?? 88 };
}

type GlobalBackdropEntry = { image?: { url: string; alt: string }; opacityStep: number } | undefined;

/** Resolves one `SiteSettings.trip2SectionBackdrops.*` entry into
 * `SectionBackdropV2` props, or `undefined` when the admin hasn't set a
 * photo for it yet — unlike the per-trip `resolveBackdrop` above, there's
 * no hardcoded fallback photo here, so those 5 sections stay unwrapped
 * (rendering exactly as before this feature) until one is set. Applies
 * identically across every Trip 2.0 page since it comes from the global
 * dashboard, not the trip document. */
function resolveGlobalBackdrop(entry: GlobalBackdropEntry): { imageUrl: string; imageAlt: string; opacity: number } | undefined {
  if (!entry?.image?.url) return undefined;
  return { imageUrl: entry.image.url, imageAlt: entry.image.alt || "", opacity: opacityStepToPercent(entry.opacityStep) };
}

/** Wraps `child` in `SectionBackdropV2` when a global backdrop is set for
 * that section, otherwise renders `child` unchanged. */
function maybeWrapWithBackdrop(
  backdrop: { imageUrl: string; imageAlt: string; opacity: number } | undefined,
  child: ReactNode
) {
  if (!backdrop) return child;
  return (
    <SectionBackdropV2 imageUrl={backdrop.imageUrl} imageAlt={backdrop.imageAlt} opacity={backdrop.opacity}>
      {child}
    </SectionBackdropV2>
  );
}

function resolveGlobalTrip2SectionBackdrops(siteSettings: ResolvedSiteSettings) {
  const b = siteSettings.trip2SectionBackdrops;
  return {
    itinerary: resolveGlobalBackdrop(b?.itinerary),
    inclusionsExclusions: resolveGlobalBackdrop(b?.inclusionsExclusions),
    batchDates: resolveGlobalBackdrop(b?.batchDates),
    thingsToExperience: resolveGlobalBackdrop(b?.thingsToExperience),
    didYouKnow: resolveGlobalBackdrop(b?.didYouKnow),
    stillDeciding: resolveGlobalBackdrop(b?.stillDeciding),
  };
}

function mapQuickLinks(trip: ResolvedTrip2): QuickLinkV2[] | undefined {
  return orUndefined(
    [...(trip.quickLinks ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((l, i) => ({ id: `${i}-${l.label}`, icon: l.icon, label: l.label, href: l.href }))
  );
}

function mapGallery(trip: ResolvedTrip2): GalleryImageV2[] | undefined {
  return orUndefined(
    [...(trip.gallery ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((g, i) => {
        const img = resolveImage(g.image as ImgLike, FALLBACK_HERO_IMAGE, trip.title);
        return { id: String(i), imageUrl: img.url, imageAlt: img.alt, caption: g.caption || undefined };
      })
  );
}

function mapItinerary(trip: ResolvedTrip2): ItineraryDayV2[] | undefined {
  return orUndefined(
    trip.itinerary?.map((d) => {
      const img = resolveImage(d.image as ImgLike, FALLBACK_HERO_IMAGE, d.title);
      return { day: d.day, title: d.title, location: d.location, imageUrl: img.url, imageAlt: img.alt, description: d.description };
    })
  );
}

function mapPickupVariants(trip: ResolvedTrip2): PickupVariantV2[] | undefined {
  return orUndefined(
    trip.pickupVariants?.map((v, i) => ({
      id: `${i}-${v.city}`,
      city: v.city,
      note: v.note || undefined,
      route: orUndefined(v.route),
      itinerary: orUndefined(
        v.itinerary?.map((d) => {
          const img = resolveImage(d.image as ImgLike, FALLBACK_HERO_IMAGE, d.title);
          return { day: d.day, title: d.title, location: d.location, imageUrl: img.url, imageAlt: img.alt, description: d.description };
        })
      ),
    }))
  );
}

function mapHeroImages(trip: ResolvedTrip2): { imageUrl: string; imageAlt: string }[] | undefined {
  return orUndefined(
    (trip.heroImages ?? [])
      .map((img) => resolveImage(img as ImgLike, "", trip.title))
      .filter((img) => img.url)
      .map((img) => ({ imageUrl: img.url, imageAlt: img.alt }))
  );
}

function mapBatchDates(trip: ResolvedTrip2): BatchDateV2[] | undefined {
  return orUndefined(
    trip.batchDates?.map((b, i) => ({
      id: String(i),
      startDate: b.startDate,
      endDate: b.endDate,
      seatsAvailable: b.seatsAvailable,
      seatsTotal: b.seatsTotal,
      status: b.status,
    }))
  );
}

function mapExperiences(trip: ResolvedTrip2): ExperienceCardV2[] | undefined {
  return orUndefined(
    trip.thingsToExperience?.map((e, i) => {
      const img = resolveImage(e.image as ImgLike, FALLBACK_HERO_IMAGE, e.title);
      return { id: String(i), tag: e.tag, title: e.title, description: e.description, href: e.href, imageUrl: img.url, imageAlt: img.alt };
    })
  );
}

function mapFacts(trip: ResolvedTrip2): DidYouKnowCardV2[] | undefined {
  return orUndefined(trip.didYouKnow?.map((f, i) => ({ id: String(i), icon: f.icon, title: f.title, description: f.description, href: f.href })));
}

function mapFaqs(trip: ResolvedTrip2): FaqV2[] | undefined {
  return orUndefined(trip.faqs?.map((f, i) => ({ id: String(i), question: f.question, answer: f.answer })));
}

export default async function Trip2Page({ params }: Params) {
  const { slug } = await params;
  const [trip, siteSettings] = await Promise.all([getResolvedTrip2(slug), getSiteSettings()]);
  if (!trip) notFound();

  const heroImage = resolveImage(trip.heroImage as ImgLike, FALLBACK_HERO_IMAGE, trip.title);
  const bookHref = trip.bookHref?.trim() || `/trip2/${trip.slug}#price`;
  const hasPrice = trip.price && (trip.price.basePrice > 0 || trip.price.bookingAmount > 0);
  const quickLinksBackdrop = resolveBackdrop(
    trip.sectionBackdrops?.quickLinks as BackdropLike,
    BACKDROP_A,
    "Mountain landscape"
  );
  const priceBackdrop = resolveBackdrop(
    trip.sectionBackdrops?.price as BackdropLike,
    BACKDROP_B,
    "Himalayan monastery on a hillside"
  );

  // Global (site-wide, Admin → Trip 2.0 Backdrops) backdrops — same photo
  // behind this section on every trip. `undefined` when unset, so the
  // section renders unwrapped exactly as before this feature existed.
  const globalBackdrops = resolveGlobalTrip2SectionBackdrops(siteSettings);

  return (
    <main className="bg-background">
      <TripHeroV2
        bookHref={bookHref}
        imageUrl={heroImage.url}
        imageAlt={heroImage.alt}
        images={mapHeroImages(trip)}
        eyebrow={trip.location || undefined}
        heading={trip.title || "Untitled Trip"}
      />
      <TripTitleV2
        title={trip.title || "Untitled Trip"}
        description={trip.shortDescription || ""}
        location={trip.location || undefined}
        duration={trip.durationLabel || undefined}
        groupSize={trip.groupSizeLabel || undefined}
      />
      <SectionBackdropV2 imageUrl={quickLinksBackdrop.url} imageAlt={quickLinksBackdrop.alt} opacity={quickLinksBackdrop.opacity}>
        <QuickLinksV2 links={mapQuickLinks(trip)} />
      </SectionBackdropV2>
      <GalleryGridV2 images={mapGallery(trip)} />
      <PickupVariantsV2
        variants={mapPickupVariants(trip)}
        defaultItinerary={mapItinerary(trip)}
        backdrop={globalBackdrops.itinerary}
      />
      {maybeWrapWithBackdrop(
        globalBackdrops.inclusionsExclusions,
        <InclusionsExclusionsV2 inclusions={orUndefined(trip.inclusions)} exclusions={orUndefined(trip.exclusions)} />
      )}
      <SectionBackdropV2 imageUrl={priceBackdrop.url} imageAlt={priceBackdrop.alt} opacity={priceBackdrop.opacity}>
        {hasPrice ? (
          <PriceV2
            basePrice={trip.price.basePrice}
            discountedPrice={trip.price.discountedPrice || undefined}
            bookingAmount={trip.price.bookingAmount}
            bookHref={bookHref}
          />
        ) : null}
      </SectionBackdropV2>
      {maybeWrapWithBackdrop(globalBackdrops.batchDates, <BatchDatesV2 batches={mapBatchDates(trip)} bookHref={bookHref} />)}
      {maybeWrapWithBackdrop(globalBackdrops.thingsToExperience, <ThingsToExperienceV2 items={mapExperiences(trip)} />)}
      {maybeWrapWithBackdrop(globalBackdrops.didYouKnow, <DidYouKnowV2 facts={mapFacts(trip)} />)}
      <LetsPlanYourTripV2
        destination={trip.leadFormDestination || trip.title}
        tripSlug={trip.slug}
        backgroundImageUrl={globalBackdrops.stillDeciding?.imageUrl}
        backgroundImageAlt={globalBackdrops.stillDeciding?.imageAlt}
        overlayOpacity={globalBackdrops.stillDeciding?.opacity}
      />
      <FaqAccordionV2 faqs={mapFaqs(trip)} />
    </main>
  );
}