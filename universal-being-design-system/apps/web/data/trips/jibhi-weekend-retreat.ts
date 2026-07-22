import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 3D/2N sibling of the Jibhi circuit (see jibhi.ts) — a trimmed
 * weekend version without the optional Serolsar Lake day.
 */
export const jibhiWeekendRetreatTrip = buildTrip({
  slug: "jibhi-weekend-retreat",
  title: "Jibhi Weekend Retreat",
  destinationSlug: "jibhi",
  destinationName: "Jibhi",
  themeKey: "forest",
  shortDescription: "A quick 3-day forest-and-waterfall weekend in the quiet Tirthan valley.",
  fullDescription:
    "Jibhi Weekend Retreat is the compact version of the Jibhi Valley Retreat — the waterfall walk and Chehni Kothi tower visit, without the Serolsar Lake day, for travellers with only one weekend to spare.",
  durationDays: 3,
  durationNights: 2,
  difficulty: "easy",
  bestSeason: ["March", "April", "May", "June", "September", "October", "November", "December"],
  groupSize: { min: 8, max: 14 },
  pickup: "Delhi (overnight bus pickup point)",
  drop: "Delhi (overnight bus drop point)",
  circuitGroup: "jibhi-circuit",
  destinationRoutes: [
    { id: "jibhi-weekend-route-1", stops: ["Jibhi"] },
    { id: "jibhi-weekend-route-2", stops: ["Jibhi", "Jalori Pass", "Serolsar Lake"], href: "/trips/jibhi-valley-retreat" },
  ],
  priceBase: 7999,
  priceDiscounted: 6999,
  bookingAmount: 1200,
  totalSeats: 14,
  availableSeats: 9,
  batchStartDates: ["2026-10-03", "2026-10-17", "2026-11-07", "2026-11-21"],
  inclusions: [
    "2 nights stay in Jibhi (cottage/homestay)",
    "Daily breakfast and dinner",
    "Delhi to Jibhi to Delhi shared vehicle travel",
    "Guided waterfall walk",
  ],
  exclusions: [
    "Lunch on all days",
    "Café bills and personal shopping",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Jibhi waterfall and Chehni Kothi tower walk",
    "Tirthan river-side café time",
    "Fits inside a single weekend",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Jibhi", description: "Overnight journey from Delhi towards Jibhi.", activities: ["Overnight shared-vehicle journey"], meals: [] },
    { day: 2, title: "Jibhi waterfall & Chehni Kothi", description: "Check in, then a gentle walk to Jibhi waterfall and the ancient Chehni Kothi tower, with the afternoon free by the Tirthan river.", activities: ["Jibhi waterfall walk", "Chehni Kothi tower visit", "Tirthan riverside time"], meals: ["breakfast", "dinner"], stay: "Cottage/homestay in Jibhi" },
    { day: 3, title: "Jibhi to Delhi", description: "Morning at leisure, then the return journey to Delhi.", activities: ["Morning leisure time", "Return journey to Delhi"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "jibhi-weekend-faq-1", question: "Does this include the Serolsar Lake hike?", answer: "No — for the Serolsar Lake day hike, see the 4-day Jibhi Valley Retreat instead." },
    { id: "jibhi-weekend-faq-2", question: "Is this good for a first solo trip?", answer: "Yes — the pace is easy and social, which makes it a common first pick for solo travellers even at this shorter length." },
  ],
  mapQuery: "Jibhi, Himachal Pradesh, India",
  rating: 4.6,
  reviewCount: 19,
  featured: false,
  galleryCount: 5,
});
