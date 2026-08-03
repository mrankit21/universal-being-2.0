import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

import type { Trip2CardSummary } from "@/lib/api/trip2";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop";

/**
 * Trip2Card — listing-card presentation for a `Trip2CardSummary`. Deliberately
 * lighter than the old `TripCard` (no difficulty/rating/price chrome, since
 * Trip 2.0 documents don't carry that shape yet): cover photo, location pin,
 * serif title, short description, and a "View Trip" link through to
 * `/trip2/[slug]` — matching the visual language `FeaturedTripsStack` and
 * `TripHeroV2` already use (rounded-2xl, shadow-ub-lg, ub-teal accents).
 */
export function Trip2Card({ trip }: { trip: Trip2CardSummary }) {
  const hasCover = trip.heroImage?.url && !trip.heroImage.isPlaceholder;
  const imageUrl = hasCover ? trip.heroImage!.url! : FALLBACK_IMAGE;
  const imageAlt = hasCover ? trip.heroImage!.alt || trip.title : trip.title;

  return (
    <Link
      href={`/trip2/${trip.slug}`}
      className="group relative flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-2xl shadow-ub-lg transition-shadow duration-300 hover:shadow-ub-xl"
    >
      <img
        src={imageUrl}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />

      <div className="relative z-10 flex flex-col gap-2 p-5">
        {trip.location && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <MapPin className="size-3.5" aria-hidden="true" />
            {trip.location}
          </span>
        )}
        <h3 className="font-display text-xl font-medium leading-tight text-white">{trip.title}</h3>
        {trip.shortDescription && (
          <p className="line-clamp-2 text-sm text-white/80">{trip.shortDescription}</p>
        )}
        <span className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white">
          View Trip
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
