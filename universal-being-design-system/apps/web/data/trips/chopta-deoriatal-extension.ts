import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 4D/3N sibling of the Chopta circuit (see chopta.ts) — adds a
 * Deoriatal Lake day on top of the base Tungnath + Chandrashila itinerary.
 */
export const choptaDeoriatalExtensionTrip = buildTrip({
  slug: "chopta-deoriatal-extension",
  title: "Chopta + Deoriatal Extension",
  destinationSlug: "chopta",
  destinationName: "Chopta",
  themeKey: "mountain",
  shortDescription: "A 4-day trek combining Tungnath, Chandrashila summit, and the Deoriatal Lake reflection point.",
  fullDescription:
    "Chopta + Deoriatal Extension adds a full day at Deoriatal — the alpine lake famous for its Chaukhamba reflection — on top of the standard Tungnath and Chandrashila circuit, for travellers who have an extra day to spend in the Garhwal Himalayas.",
  durationDays: 4,
  durationNights: 3,
  difficulty: "moderate",
  bestSeason: ["March", "April", "May", "June", "September", "October", "November"],
  groupSize: { min: 10, max: 18 },
  pickup: "Delhi (overnight bus pickup point)",
  drop: "Delhi (overnight bus drop point)",
  circuitGroup: "chopta-circuit",
  destinationRoutes: [
    { id: "chopta-deoriatal-route-1", stops: ["Chopta", "Tungnath", "Chandrashila"], href: "/trips/chopta-tungnath-trek" },
    { id: "chopta-deoriatal-route-2", stops: ["Chopta", "Deoriatal"] },
  ],
  priceBase: 9999,
  priceDiscounted: 8999,
  bookingAmount: 1800,
  totalSeats: 18,
  availableSeats: 10,
  batchStartDates: ["2026-09-18", "2026-10-02", "2026-10-16", "2026-10-30"],
  inclusions: [
    "3 nights stay at Chopta base + camps (as per itinerary)",
    "Breakfast and dinner during the trek",
    "Delhi to Chopta to Delhi travel by shared vehicle",
    "Trek guide and forest permits",
    "Bonfire evening at base camp",
  ],
  exclusions: [
    "Lunch on all days",
    "Personal trekking gear rental",
    "Porter/mule charges (available on request, paid separately)",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Tungnath — the highest Shiva temple in the world",
    "Sunrise summit at Chandrashila",
    "Deoriatal Lake and its Chaukhamba reflection",
    "Rhododendron forest trail",
    "Bonfire and stargazing at base camp",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Chopta", description: "Overnight travel from Delhi towards Chopta base.", activities: ["Overnight shared-vehicle journey"], meals: [] },
    { day: 2, title: "Arrival, trek to Tungnath & Chandrashila", description: "Arrive at Chopta base, rest briefly, then trek up to Tungnath temple and continue to the Chandrashila summit for sunset.", activities: ["Trek to Tungnath temple", "Chandrashila summit push", "Return to base camp"], meals: ["breakfast", "dinner"], stay: "Guesthouse/camp at Chopta" },
    { day: 3, title: "Deoriatal Lake day trek", description: "A moderate day hike to Deoriatal, known for its mirror-like reflection of the Chaukhamba range.", activities: ["Deoriatal Lake trek", "Photography at the reflection point"], meals: ["breakfast", "dinner"], stay: "Guesthouse/camp at Chopta" },
    { day: 4, title: "Chopta to Delhi", description: "Morning at leisure, then begin the return journey to Delhi, arriving late night.", activities: ["Morning leisure time", "Return journey to Delhi"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "chopta-deoriatal-faq-1", question: "How is this different from the base 3-day trek?", answer: "It adds a full extra day at Deoriatal Lake on top of the standard Tungnath and Chandrashila itinerary." },
    { id: "chopta-deoriatal-faq-2", question: "Is the Deoriatal hike difficult?", answer: "It's a moderate day hike, comparable in effort to the Tungnath climb, done as a separate outing from the base camp." },
  ],
  mapQuery: "Chopta, Uttarakhand, India",
  rating: 4.8,
  reviewCount: 22,
  featured: false,
  galleryCount: 6,
});
