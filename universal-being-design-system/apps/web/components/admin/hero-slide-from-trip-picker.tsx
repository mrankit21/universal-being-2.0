"use client";

/**
 * HeroSlideFromTripPicker — Step 7.6D follow-up. Adding a Hero Slide
 * previously meant starting from a fully blank object (`emptyHeroSlide()`)
 * and retyping heading/subtitle/badges/CTA text by hand, even when a real
 * Trip with all of that content (and a Homepage Hero Image) already
 * exists. This picker fetches the real Trip collection (same
 * `/api/admin/trips` endpoint `TripPickerField` uses) and, on selection,
 * hands back a fully-populated hero slide object — heading, subtitle,
 * badges, both CTA buttons, image, and theme all filled in from the trip.
 * The admin can still edit any field afterward; this only removes the
 * blank-slate retyping step.
 */
import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminTripFull {
  _id: string;
  slug: string;
  title: string;
  destinationName: string;
  status: string;
  themeKey: string;
  shortDescription: string;
  duration: { label: string };
  groupSize: { min: number; max: number };
  rating: number;
  reviewCount: number;
  homepageHeroImage?: { url?: string; alt?: string; isPlaceholder?: boolean; width?: number; height?: number; provider?: string; publicId?: string };
}

const BLANK_IMAGE = { provider: "placeholder", url: "", alt: "", width: 1920, height: 1080, isPlaceholder: true };

/** Builds a hero-slide object (same shape `emptyHeroSlide()` produces) from
 * a real Trip — mirrors the derivation `lib/api/home.ts`'s `tripHeroSlides()`
 * and the admin API route's seeding step both use, so a slide added this
 * way looks identical to one that was auto-seeded. */
export function heroSlideFromTrip(trip: AdminTripFull) {
  return {
    destinationLabel: trip.destinationName,
    image: trip.homepageHeroImage?.url && !trip.homepageHeroImage.isPlaceholder ? trip.homepageHeroImage : { ...BLANK_IMAGE },
    heading: trip.title,
    subtitle: trip.shortDescription,
    badges: [trip.duration?.label, `${trip.groupSize?.min}–${trip.groupSize?.max} people`, `${trip.rating}★ (${trip.reviewCount})`].filter(Boolean),
    ctaLabel: `See ${trip.title}`,
    ctaHref: `/trips/${trip.slug}`,
    secondaryCtaLabel: "Explore all trips",
    secondaryCtaHref: "/trips",
    overlayOpacity: 0.45,
    order: 0,
    enabled: true,
    themeKey: trip.themeKey || "brand",
  };
}

export function HeroSlideFromTripPicker({ onAdd, disabled }: { onAdd: (slide: ReturnType<typeof heroSlideFromTrip>) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<AdminTripFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/trips?${params.toString()}`);
      const json = await res.json();
      if (json.success) setTrips(json.data.trips);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(load, 200);
      return () => clearTimeout(t);
    }
  }, [open, load]);

  function pick(trip: AdminTripFull) {
    onAdd(heroSlideFromTrip(trip));
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add from Existing Trip
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Hero Slide from Trip</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Heading, subtitle, badges, CTA text and image all fill in automatically from the trip you pick — edit anything afterward.
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips by title…" className="pl-8" />
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No trips found.</p>
          ) : (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {trips.map((trip) => (
                <button
                  key={trip._id}
                  type="button"
                  onClick={() => pick(trip)}
                  className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:bg-accent"
                >
                  <span>
                    <span className="font-medium">{trip.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{trip.destinationName} · {trip.status}</span>
                  </span>
                  <Plus className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
