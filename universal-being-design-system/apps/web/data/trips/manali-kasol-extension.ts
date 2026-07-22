import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 6D/5N sibling of the Manali circuit (see manali.ts) — adds a
 * Kasol/Tosh day on top of the base itinerary.
 */
export const manaliKasolExtensionTrip = buildTrip({
  slug: "manali-kasol-extension",
  title: "Manali + Kasol Extension",
  destinationSlug: "manali",
  destinationName: "Manali",
  themeKey: "mountain",
  shortDescription: "A 6-day Manali snow trip extended with a day in Kasol and Tosh, in the Parvati valley.",
  fullDescription:
    "Manali + Kasol Extension takes the standard Manali Snow Trail and adds a full day trip into the Parvati valley — the cafés of Kasol and the quiet lanes of Tosh — for travellers who want both snow and valley time in one trip.",
  durationDays: 6,
  durationNights: 5,
  difficulty: "moderate",
  bestSeason: ["October", "November", "December", "January", "February"],
  groupSize: { min: 10, max: 16 },
  pickup: "Delhi (Volvo pickup point)",
  drop: "Delhi (Volvo drop point)",
  circuitGroup: "manali-circuit",
  destinationRoutes: [
    { id: "manali-kasol-route-1", stops: ["Manali", "Solang", "Sissu"], href: "/trips/manali-snow-trail" },
    { id: "manali-kasol-route-2", stops: ["Manali", "Kasol", "Tosh"] },
  ],
  priceBase: 16999,
  priceDiscounted: 15999,
  bookingAmount: 2500,
  totalSeats: 16,
  availableSeats: 7,
  batchStartDates: ["2026-12-11", "2026-12-18", "2026-12-25", "2027-01-01"],
  inclusions: [
    "5 nights stay on double/triple sharing",
    "Delhi–Manali–Delhi Volvo travel",
    "All local sightseeing by private vehicle",
    "Daily breakfast and dinner",
    "Trip leader for the entire trip",
    "Bonfire evening in Old Manali",
  ],
  exclusions: [
    "Lunch on all days",
    "Snow activities at Solang (paid at venue)",
    "Personal expenses and shopping",
    "Anything not mentioned in inclusions",
    "5% GST",
  ],
  highlights: [
    "Snow play session at Solang Valley",
    "Day trip across Atal Tunnel to Sissu, Lahaul",
    "Kasol and Tosh, Parvati valley",
    "Hidimba Devi Temple and Manu Temple",
    "Bonfire and music night with the group",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Manali", description: "Board the evening Volvo from Delhi and travel overnight into the mountains.", activities: ["Overnight Volvo journey", "Group icebreaker on WhatsApp before departure"], meals: [] },
    { day: 2, title: "Arrival, Old Manali", description: "Arrive Manali by morning, check in, rest, then explore Old Manali and the Mall Road in the evening.", activities: ["Hotel check-in", "Hidimba Devi Temple", "Old Manali café walk", "Mall Road evening"], meals: ["breakfast", "dinner"], stay: "Hotel in Manali (or similar)" },
    { day: 3, title: "Solang Valley", description: "Full day at Solang Valley for snow activities (paratrooping, ropeway, snow scooters — all paid at venue) followed by an evening bonfire.", activities: ["Solang Valley snow point", "Optional paid snow activities", "Evening bonfire"], meals: ["breakfast", "dinner"], stay: "Hotel in Manali (or similar)" },
    { day: 4, title: "Atal Tunnel & Sissu", description: "Cross the Atal Tunnel into Lahaul valley, visit Sissu and its waterfall, return to Manali by evening.", activities: ["Atal Tunnel crossing", "Sissu village and waterfall", "Return drive to Manali"], meals: ["breakfast", "dinner"], stay: "Hotel in Manali (or similar)" },
    { day: 5, title: "Kasol & Tosh day trip", description: "Full day trip into the Parvati valley, exploring Kasol's cafés and the quiet lanes of Tosh village.", activities: ["Kasol café walk", "Tosh village visit"], meals: ["breakfast", "dinner"], stay: "Hotel in Manali (or similar)" },
    { day: 6, title: "Manali to Delhi", description: "Checkout by late morning, free time on Mall Road, board the evening Volvo back to Delhi.", activities: ["Free time / last-minute shopping", "Evening Volvo departure"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "manali-kasol-faq-1", question: "How far is Kasol from Manali?", answer: "It's roughly a 2.5-3 hour drive each way, covered as a full day trip with transfers included." },
    { id: "manali-kasol-faq-2", question: "Is this trip suitable for solo travellers?", answer: "Yes — most travellers on this trip come solo and are grouped into shared rooms of the same gender." },
  ],
  mapQuery: "Manali, Himachal Pradesh, India",
  rating: 4.8,
  reviewCount: 34,
  featured: false,
  galleryCount: 8,
});
