import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 2D/1N sibling of the Chopta circuit (see chopta.ts) — same
 * `circuitGroup: "chopta-circuit"` but a fully independent Trip: a
 * faster weekend-only itinerary (Tungnath only, no Chandrashila summit
 * push or Deoriatal), its own pricing, and its own batch dates.
 */
export const choptaTungnathDashTrip = buildTrip({
  slug: "chopta-tungnath-dash",
  title: "Chopta Tungnath Dash",
  destinationSlug: "chopta",
  destinationName: "Chopta",
  themeKey: "mountain",
  shortDescription: "A fast 2-day weekend dash to Tungnath, the world's highest Shiva temple.",
  fullDescription:
    "Chopta Tungnath Dash is the fastest way to do the Tungnath trek in a single weekend — no Chandrashila summit push, no extra days, just the temple trek and back. Built for travellers who can only spare one weekend off work.",
  durationDays: 2,
  durationNights: 1,
  difficulty: "moderate",
  bestSeason: ["March", "April", "May", "June", "September", "October", "November"],
  groupSize: { min: 10, max: 18 },
  pickup: "Delhi (overnight bus pickup point)",
  drop: "Delhi (overnight bus drop point)",
  circuitGroup: "chopta-circuit",
  destinationRoutes: [
    { id: "chopta-dash-route-1", stops: ["Chopta", "Tungnath"] },
    { id: "chopta-dash-route-2", stops: ["Chopta", "Tungnath", "Chandrashila"], href: "/trips/chopta-tungnath-trek" },
  ],
  priceBase: 5999,
  priceDiscounted: 4999,
  bookingAmount: 1000,
  totalSeats: 18,
  availableSeats: 13,
  batchStartDates: ["2026-09-19", "2026-09-26", "2026-10-10", "2026-10-24"],
  inclusions: [
    "1 night stay at Chopta base",
    "Breakfast and dinner during the trek",
    "Delhi to Chopta to Delhi travel by shared vehicle",
    "Trek guide and forest permits",
  ],
  exclusions: [
    "Lunch on all days",
    "Personal trekking gear rental",
    "Porter/mule charges (available on request, paid separately)",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Tungnath — the highest Shiva temple in the world",
    "Rhododendron forest trail",
    "Compact single-weekend format",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Chopta, Tungnath trek", location: "Tungnath", description: "Overnight travel from Delhi, arrive at Chopta base early morning, then trek up to Tungnath temple and back the same day.", activities: ["Overnight shared-vehicle journey", "Trek to Tungnath temple", "Return to base camp"], meals: ["dinner"], stay: "Guesthouse/camp at Chopta" },
    { day: 2, title: "Chopta to Delhi", description: "Morning at leisure, then begin the return journey to Delhi, arriving late night.", activities: ["Morning leisure time", "Return journey to Delhi"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "chopta-dash-faq-1", question: "Does this include the Chandrashila summit?", answer: "No — this is the faster Tungnath-only version. For the summit push, see the 3-day Chopta Tungnath Trek." },
    { id: "chopta-dash-faq-2", question: "Is one weekend really enough?", answer: "Yes, this itinerary is built specifically to fit inside a Friday night to Sunday night weekend from Delhi." },
  ],
  mapQuery: "Chopta, Uttarakhand, India",
  rating: 4.4,
  reviewCount: 29,
  featured: false,
  galleryCount: 5,
});
