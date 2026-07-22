import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 5D/4N sibling of the Jibhi circuit (see jibhi.ts) — adds a Jalori
 * Pass and Serolsar Lake day on top of the base itinerary.
 */
export const jibhiTirthanExtensionTrip = buildTrip({
  slug: "jibhi-tirthan-extension",
  title: "Jibhi + Tirthan Extension",
  destinationSlug: "jibhi",
  destinationName: "Jibhi",
  themeKey: "forest",
  shortDescription: "A 5-day Jibhi retreat extended with Jalori Pass and the Serolsar Lake day hike.",
  fullDescription:
    "Jibhi + Tirthan Extension takes the standard Jibhi Valley Retreat and adds a dedicated day for the Jalori Pass crossing and the Serolsar Lake hike, for travellers who want more time in the Tirthan valley beyond the base itinerary.",
  durationDays: 5,
  durationNights: 4,
  difficulty: "moderate",
  bestSeason: ["March", "April", "May", "June", "September", "October", "November", "December"],
  groupSize: { min: 8, max: 14 },
  pickup: "Delhi (overnight bus pickup point)",
  drop: "Delhi (overnight bus drop point)",
  circuitGroup: "jibhi-circuit",
  destinationRoutes: [
    { id: "jibhi-ext-route-1", stops: ["Jibhi", "Tirthan Valley"], href: "/trips/jibhi-valley-retreat" },
    { id: "jibhi-ext-route-2", stops: ["Jibhi", "Jalori Pass", "Serolsar Lake"] },
  ],
  priceBase: 12499,
  priceDiscounted: 11499,
  bookingAmount: 2000,
  totalSeats: 14,
  availableSeats: 7,
  batchStartDates: ["2026-10-02", "2026-10-23", "2026-11-13", "2026-12-04"],
  inclusions: [
    "4 nights stay in Jibhi (cottage/homestay)",
    "Daily breakfast and dinner",
    "Delhi to Jibhi to Delhi shared vehicle travel",
    "Guided waterfall, forest, and Serolsar Lake walks",
    "Local sightseeing by shared vehicle",
  ],
  exclusions: [
    "Lunch on all days",
    "Café bills and personal shopping",
    "Fishing permit at Tirthan (if opted)",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Serolsar Lake day hike via Jalori Pass",
    "Jibhi waterfall and Chehni Kothi tower walk",
    "Tirthan river-side café time",
    "Great Himalayan National Park buffer zone views",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Jibhi", description: "Overnight journey from Delhi towards Jibhi.", activities: ["Overnight shared-vehicle journey"], meals: [] },
    { day: 2, title: "Arrival, Jibhi waterfall & Chehni Kothi", description: "Check in, then a gentle walk to Jibhi waterfall and the ancient Chehni Kothi tower.", activities: ["Jibhi waterfall walk", "Chehni Kothi tower visit"], meals: ["breakfast", "dinner"], stay: "Cottage/homestay in Jibhi" },
    { day: 3, title: "Jalori Pass & Serolsar Lake", description: "Drive up to Jalori Pass, then a moderate hike through the forest to Serolsar Lake.", activities: ["Jalori Pass drive", "Serolsar Lake hike"], meals: ["breakfast", "dinner"], stay: "Cottage/homestay in Jibhi" },
    { day: 4, title: "Tirthan riverside day", description: "A relaxed day by the Tirthan river and local cafés, with time for optional trout fishing.", activities: ["Tirthan riverside time", "Optional trout fishing"], meals: ["breakfast", "dinner"], stay: "Cottage/homestay in Jibhi" },
    { day: 5, title: "Jibhi to Delhi", description: "Morning at leisure, then the return journey to Delhi.", activities: ["Morning leisure time", "Return journey to Delhi"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "jibhi-ext-faq-1", question: "How difficult is the Serolsar Lake hike?", answer: "It's a moderate 5 km round trip from Jalori Pass through forest trail; manageable for most fitness levels." },
    { id: "jibhi-ext-faq-2", question: "Is trout fishing included?", answer: "No, a fishing permit at Tirthan is optional and arranged separately if requested." },
  ],
  mapQuery: "Jibhi, Himachal Pradesh, India",
  rating: 4.8,
  reviewCount: 21,
  featured: false,
  galleryCount: 6,
});
