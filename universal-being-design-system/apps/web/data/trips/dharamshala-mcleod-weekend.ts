import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 3D/2N sibling of the Dharamshala circuit (see dharamshala.ts) — a
 * trimmed weekend version without the Triund day hike.
 */
export const dharamshalaMcleodWeekendTrip = buildTrip({
  slug: "dharamshala-mcleod-weekend",
  title: "Dharamshala McLeod Weekend",
  destinationSlug: "dharamshala",
  destinationName: "Dharamshala",
  themeKey: "forest",
  shortDescription: "A quick 3-day McLeod Ganj weekend covering monasteries, market lanes, and Bhagsu waterfall.",
  fullDescription:
    "Dharamshala McLeod Weekend is the compact version of the McLeod Ganj Escape — monastery visits, café-hopping, and the short Bhagsu waterfall walk, without the full Triund day hike, for travellers with only one weekend to spare.",
  durationDays: 3,
  durationNights: 2,
  difficulty: "easy",
  bestSeason: ["March", "April", "May", "September", "October", "November"],
  groupSize: { min: 10, max: 16 },
  pickup: "Delhi (overnight bus pickup point)",
  drop: "Delhi (overnight bus drop point)",
  circuitGroup: "dharamshala-circuit",
  destinationRoutes: [
    { id: "dharamshala-weekend-route-1", stops: ["McLeod Ganj", "Bhagsu"] },
    { id: "dharamshala-weekend-route-2", stops: ["McLeod Ganj", "Triund", "Dharamshala"], href: "/trips/dharamshala-mcleodganj-escape" },
  ],
  priceBase: 7499,
  priceDiscounted: 6499,
  bookingAmount: 1200,
  totalSeats: 16,
  availableSeats: 12,
  batchStartDates: ["2026-09-12", "2026-09-26", "2026-10-17", "2026-10-31"],
  inclusions: [
    "2 nights stay in McLeod Ganj",
    "Daily breakfast and dinner",
    "Delhi to Dharamshala to Delhi shared vehicle travel",
    "Local monastery and market walks",
  ],
  exclusions: [
    "Lunch on all days",
    "Café bills and personal shopping",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Namgyal Monastery and Tsuglagkhang complex",
    "Bhagsu waterfall walk",
    "McLeod Ganj café and market evenings",
    "Fits inside a single weekend",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Dharamshala", description: "Overnight journey from Delhi towards McLeod Ganj.", activities: ["Overnight shared-vehicle journey"], meals: [] },
    { day: 2, title: "McLeod Ganj monasteries & Bhagsu", description: "Check in, then explore Namgyal Monastery, the Tsuglagkhang complex, McLeod Ganj market, and the short walk to Bhagsu waterfall.", activities: ["Namgyal Monastery visit", "Market walk", "Bhagsu waterfall walk"], meals: ["breakfast", "dinner"], stay: "Guesthouse in McLeod Ganj" },
    { day: 3, title: "Dharamshala to Delhi", description: "Morning at leisure, then the return journey to Delhi.", activities: ["Morning leisure time", "Return journey to Delhi"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "dharamshala-weekend-faq-1", question: "Does this include the Triund hike?", answer: "No — for the full-day Triund hike, see the 4-day McLeod Ganj Escape instead." },
    { id: "dharamshala-weekend-faq-2", question: "Is this suitable for a Friday-to-Sunday weekend?", answer: "Yes, it's built specifically to fit a single weekend off work from Delhi." },
  ],
  mapQuery: "McLeod Ganj, Dharamshala, Himachal Pradesh, India",
  rating: 4.5,
  reviewCount: 33,
  featured: false,
  galleryCount: 5,
});
