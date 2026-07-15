import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTripBySlug, getTripSlugs } from "@/lib/api/trips";
import { BookingForm } from "@/components/trip/booking-form";
import { SectionHeading } from "@/components/primitives/section-heading";

interface BookTripPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ departure?: string }>;
}

export async function generateStaticParams() {
  const slugs = await getTripSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BookTripPageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return {};
  return { title: `Book ${trip.title}`, robots: { index: false, follow: false } };
}

/**
 * Booking Engine Foundation, Part 1/6 entry point — a dedicated page
 * (additive, doesn't touch the existing Trip Details page layout) so the
 * booking form and its live summary have room to breathe rather than being
 * squeezed into `TripBookingCard`'s sidebar. Reads the same `getTripBySlug`
 * every other public trip page uses (MongoDB-first with local-seed
 * fallback), so departure batches are always current.
 */
export default async function BookTripPage({ params, searchParams }: BookTripPageProps) {
  const { slug } = await params;
  const { departure } = await searchParams;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeading
        eyebrow={trip.destinationName}
        title={`Book ${trip.title}`}
        className="mb-6"
      />
      <BookingForm trip={trip} initialDepartureId={departure} />
    </div>
  );
}
