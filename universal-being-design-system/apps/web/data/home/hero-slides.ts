import type { ThemeKey } from "@/types/theme";

/**
 * HeroSlide — homepage-only shape for Step 7.5A's cinematic Hero. Deliberately
 * separate from `HomeTripSummary` (featured-trips.ts): the Hero needs a
 * link target and a short badge list, not price/rating/duration as fields.
 *
 * Content below is drawn straight from real data already in the project —
 * `featuredTrips` (Rajasthan Royals, Himalayan Winter Trail, Monsoon in the
 * Ghats, Goa Beach Reset, Western Ghats Forest Trail) and `data/destinations`
 * (Manali) — so the Hero never invents a destination or trip that doesn't
 * exist elsewhere on the site. Every non-brand theme mood gets exactly one
 * slide.
 */
export interface HeroSlide {
  themeKey: Exclude<ThemeKey, "brand">;
  eyebrow: string;
  heading: string;
  subtitle: string;
  href: string;
  ctaLabel: string;
  badges: string[];
}

export const heroSlides: HeroSlide[] = [
  {
    themeKey: "rajasthan",
    eyebrow: "Rajasthan",
    heading: "Palaces that still glow at dusk",
    subtitle: "Jaipur to Jodhpur to Udaipur — old-city lanes, lake palaces, and a group that feels like it.",
    href: "/trips/rajasthan-royals",
    ctaLabel: "See Rajasthan Royals",
    badges: ["7 days", "12–16 people", "4.8★ (214)"],
  },
  {
    themeKey: "winter",
    eyebrow: "Himalayan Winter",
    heading: "A cold desert of monasteries and sky",
    subtitle: "Manali to Sissu to Kasol — snow passes, mountain evenings, and slow mornings with new friends.",
    href: "/trips/himalayan-winter-trail",
    ctaLabel: "See Himalayan Winter Trail",
    badges: ["6 days", "10–14 people", "4.9★ (168)"],
  },
  {
    themeKey: "beach",
    eyebrow: "Goa",
    heading: "Salt air, slow days, no itinerary panic",
    subtitle: "North Goa to South Goa — beach shacks, sunset swims, and just enough plan to relax into.",
    href: "/trips/goa-beach-reset",
    ctaLabel: "See Goa Beach Reset",
    badges: ["5 days", "12–16 people", "4.7★ (289)"],
  },
  {
    themeKey: "forest",
    eyebrow: "Western Ghats",
    heading: "Pine ridges and quiet valley mornings",
    subtitle: "Coorg to Chikmagalur — misty estates, forest trails, and a pace that finally slows down.",
    href: "/trips/western-ghats-forest-trail",
    ctaLabel: "See Western Ghats Forest Trail",
    badges: ["5 days", "10–14 people", "4.8★ (97)"],
  },
  {
    themeKey: "monsoon",
    eyebrow: "The Ghats, Monsoon",
    heading: "Waterfalls that only run a few weeks a year",
    subtitle: "Lonavala to Mahabaleshwar — green valleys, cloud-wrapped forts, and rain worth chasing.",
    href: "/trips/monsoon-in-the-ghats",
    ctaLabel: "See Monsoon in the Ghats",
    badges: ["4 days", "14–18 people", "4.6★ (132)"],
  },
  {
    themeKey: "mountain",
    eyebrow: "Manali",
    heading: "Snow, orchards, and easy mountain evenings",
    subtitle: "Apple orchards by day, bonfire evenings by night — the Himalayas at an unhurried pace.",
    href: "/destinations/manali",
    ctaLabel: "Explore Manali",
    badges: ["Multiple departures", "Small groups"],
  },
];
