import { buildTrip } from "./_builder";

/**
 * PLACEHOLDER CONTENT — itinerary, pricing, seats and batch dates below are
 * realistic development placeholders (no real Manali trip data was supplied
 * in the content package). Replace via the Admin Panel's Basic Info,
 * Itinerary, and Pricing & Departures tabs before this trip goes live.
 */
export const manaliTrip = buildTrip({
  slug: "manali-snow-trail",
  title: "Manali Snow Trail",
  destinationSlug: "manali",
  destinationName: "Manali",
  themeKey: "mountain",
  shortDescription: "A 5-day snow-and-mountain escape through Old Manali, Solang and Sissu.",
  fullDescription:
    "Manali Snow Trail is a small-group trip through the Kullu valley — orchards and river views on the drive in, snow play at Solang, a day across the Atal Tunnel into Lahaul, and slow evenings around Old Manali's cafés. Built for travellers who want mountains without a packed checklist.",
  durationDays: 5,
  durationNights: 4,
  difficulty: "moderate",
  bestSeason: ["October", "November", "December", "January", "February"],
  groupSize: { min: 10, max: 16 },
  pickup: "Delhi (Volvo pickup point)",
  drop: "Delhi (Volvo drop point)",
  circuitGroup: "manali-circuit",
  destinationRoutes: [
    { id: "manali-route-1", stops: ["Manali", "Solang", "Sissu"] },
    { id: "manali-route-2", stops: ["Manali", "Kasol", "Tosh"] },
  ],
  priceBase: 12999,
  priceDiscounted: 10999,
  bookingAmount: 2000,
  totalSeats: 16,
  availableSeats: 6,
  batchStartDates: ["2026-12-12", "2026-12-19", "2026-12-26", "2027-01-02"],
  inclusions: [
    "4 nights stay on double/triple sharing",
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
    "Evening at Old Manali cafés and Mall Road",
    "Hidimba Devi Temple and Manu Temple",
    "Bonfire and music night with the group",
  ],
  itinerary: [
    {
      day: 1,
      title: "Delhi to Manali",
      description: "Board the evening Volvo from Delhi and travel overnight into the mountains.",
      activities: ["Overnight Volvo journey", "Group icebreaker on WhatsApp before departure"],
      meals: [],
    },
    {
      day: 2,
      title: "Arrival, Old Manali", location: "Old Manali",
      description: "Arrive Manali by morning, check in, rest, then explore Old Manali and the Mall Road in the evening.",
      activities: ["Hotel check-in", "Hidimba Devi Temple", "Old Manali café walk", "Mall Road evening"],
      meals: ["breakfast", "dinner"],
      stay: "Hotel in Manali (or similar)",
    },
    {
      day: 3,
      title: "Solang Valley", location: "Solang Valley",
      description: "Full day at Solang Valley for snow activities (paratrooping, ropeway, snow scooters — all paid at venue) followed by an evening bonfire.",
      activities: ["Solang Valley snow point", "Optional paid snow activities", "Evening bonfire"],
      meals: ["breakfast", "dinner"],
      stay: "Hotel in Manali (or similar)",
    },
    {
      day: 4,
      title: "Atal Tunnel & Sissu", location: "Sissu",
      description: "Cross the Atal Tunnel into Lahaul valley, visit Sissu and its waterfall, return to Manali by evening.",
      activities: ["Atal Tunnel crossing", "Sissu village and waterfall", "Return drive to Manali"],
      meals: ["breakfast", "dinner"],
      stay: "Hotel in Manali (or similar)",
    },
    {
      day: 5,
      title: "Manali to Delhi",
      description: "Checkout by late morning, free time on Mall Road, board the evening Volvo back to Delhi.",
      activities: ["Free time / last-minute shopping", "Evening Volvo departure"],
      meals: ["breakfast"],
    },
  ],
  faqs: [
    { id: "manali-faq-1", question: "Is this trip suitable for solo travellers?", answer: "Yes — most travellers on this trip come solo and are grouped into shared rooms of the same gender." },
    { id: "manali-faq-2", question: "Will we see snow?", answer: "Solang Valley and Sissu typically have snow through December–February. Snowfall in Manali town itself depends on the season." },
    { id: "manali-faq-3", question: "What should I pack?", answer: "Heavy woollens, thermal wear, gloves, a good pair of trekking/snow shoes, and any personal medication." },
    { id: "manali-faq-4", question: "Is travel insurance included?", answer: "No, travel insurance is not included and can be arranged independently." },
  ],
  mapQuery: "Manali, Himachal Pradesh, India",
  rating: 4.7,
  reviewCount: 86,
  featured: true,
  galleryCount: 8,
});
