import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 4D/3N sibling of the Manali circuit (see manali.ts) — trims the
 * Atal Tunnel / Sissu day from the base itinerary.
 */
export const manaliQuickTrailTrip = buildTrip({
  slug: "manali-quick-trail",
  title: "Manali Quick Trail",
  destinationSlug: "manali",
  destinationName: "Manali",
  themeKey: "mountain",
  shortDescription: "A fast 4-day Manali trip covering Old Manali and Solang Valley.",
  fullDescription:
    "Manali Quick Trail is the compact version of the Manali Snow Trail — Old Manali cafés, Hidimba Devi Temple, and a full day of snow play at Solang, without the Atal Tunnel/Sissu day trip, for travellers with only four days to spare.",
  durationDays: 4,
  durationNights: 3,
  difficulty: "moderate",
  bestSeason: ["October", "November", "December", "January", "February"],
  groupSize: { min: 10, max: 16 },
  pickup: "Delhi (Volvo pickup point)",
  drop: "Delhi (Volvo drop point)",
  circuitGroup: "manali-circuit",
  destinationRoutes: [
    { id: "manali-quick-route-1", stops: ["Manali", "Solang"] },
    { id: "manali-quick-route-2", stops: ["Manali", "Solang", "Sissu"], href: "/trips/manali-snow-trail" },
  ],
  priceBase: 10999,
  priceDiscounted: 9999,
  bookingAmount: 1800,
  totalSeats: 16,
  availableSeats: 10,
  batchStartDates: ["2026-12-13", "2026-12-20", "2026-12-27", "2027-01-03"],
  inclusions: [
    "3 nights stay on double/triple sharing",
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
    "Evening at Old Manali cafés and Mall Road",
    "Hidimba Devi Temple and Manu Temple",
    "Bonfire and music night with the group",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Manali", description: "Board the evening Volvo from Delhi and travel overnight into the mountains.", activities: ["Overnight Volvo journey", "Group icebreaker on WhatsApp before departure"], meals: [] },
    { day: 2, title: "Arrival, Old Manali", description: "Arrive Manali by morning, check in, rest, then explore Old Manali and the Mall Road in the evening.", activities: ["Hotel check-in", "Hidimba Devi Temple", "Old Manali café walk", "Mall Road evening"], meals: ["breakfast", "dinner"], stay: "Hotel in Manali (or similar)" },
    { day: 3, title: "Solang Valley", description: "Full day at Solang Valley for snow activities (paratrooping, ropeway, snow scooters — all paid at venue) followed by an evening bonfire.", activities: ["Solang Valley snow point", "Optional paid snow activities", "Evening bonfire"], meals: ["breakfast", "dinner"], stay: "Hotel in Manali (or similar)" },
    { day: 4, title: "Manali to Delhi", description: "Checkout by late morning, free time on Mall Road, board the evening Volvo back to Delhi.", activities: ["Free time / last-minute shopping", "Evening Volvo departure"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "manali-quick-faq-1", question: "Does this include the Atal Tunnel / Sissu day trip?", answer: "No — for the Atal Tunnel and Sissu day, see the 5-day Manali Snow Trail instead." },
    { id: "manali-quick-faq-2", question: "Will we see snow?", answer: "Solang Valley typically has snow through December–February. Snowfall in Manali town itself depends on the season." },
  ],
  mapQuery: "Manali, Himachal Pradesh, India",
  rating: 4.5,
  reviewCount: 41,
  featured: false,
  galleryCount: 6,
});
