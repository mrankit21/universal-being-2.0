import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 2D/1N sibling of the Udaipur circuit (see udaipur.ts) — condenses
 * the City Palace and Lake Pichola visits into a single day.
 */
export const udaipurFlyingVisitTrip = buildTrip({
  slug: "udaipur-flying-visit",
  title: "Udaipur Flying Visit",
  destinationSlug: "udaipur",
  destinationName: "Udaipur",
  themeKey: "rajasthan",
  shortDescription: "A quick 2-day Udaipur trip covering the City Palace and a Lake Pichola sunset boat ride.",
  fullDescription:
    "Udaipur Flying Visit condenses the City Palace, Lake Pichola boat ride, and old-city lanes into a single packed day, for travellers who only have a short weekend or a stopover to spend in the city of lakes.",
  durationDays: 5,
  durationNights: 4,
  difficulty: "easy",
  bestSeason: ["October", "November", "December", "January", "February", "March"],
  groupSize: { min: 12, max: 18 },
  pickup: "Delhi",
  drop: "Delhi",
  circuitGroup: "udaipur-circuit",
  destinationRoutes: [
    { id: "udaipur-flying-route-1", stops: ["Udaipur"] },
    { id: "udaipur-flying-route-2", stops: ["Udaipur", "Kumbhalgarh"], href: "/trips/udaipur-heritage-walk" },
  ],
  priceBase: 6999,
  priceDiscounted: 6999,
  bookingAmount: 2500,
  totalSeats: 18,
  availableSeats: 14,
  batchStartDates: ["2026-08-07", "2026-08-14", "2026-08-21", "2026-08-28"],
  inclusions: [
    "Comfortable hotel stays — 2 nights in Udaipur",
    "2 breakfasts and 2 dinners",
    "Both-side Volvo 40-seater transport",
    "Sightseeing across Udaipur, Mount Abu & Kumbhalgarh Fort",
    "Pool party, rain dance & fun activities",
    "Trip captain throughout the journey",
  ],
  exclusions: [
    "Lunch",
    "Entry tickets",
    "Boat ride",
    "Ropeway",
    "5% GST",
  ],
  highlights: [
    "City Palace guided walkthrough",
    "Sunset boat ride on Lake Pichola",
    "Jagdish Temple and old-city lanes",
    "Fits inside a single overnight stay",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Udaipur", description: "Evening pickup from Delhi and an overnight journey towards Udaipur by Volvo 40-seater.", activities: ["9:00 PM Delhi pickup", "Overnight journey by Volvo 40-seater"], meals: [] },
    { day: 2, title: "Udaipur Highlights — City of Lakes", location: "Udaipur", description: "Arrive in Udaipur by morning, check in, then cover the local sightseeing circuit before an evening at Fateh Sagar Market and dinner at the hotel.", activities: ["Morning arrival & hotel check-in", "Saheliyon Ki Bari", "Under the Sun Aquarium", "Maharana Pratap Memorial", "Fateh Sagar Lake (boating on own)", "Fateh Sagar Market — sunset viewpoint & shopping"], meals: ["dinner"], stay: "Hotel in Udaipur" },
    { day: 3, title: "Mount Abu & Kumbhalgarh Highlights", location: "Mount Abu & Kumbhalgarh", description: "Full day trip to Mount Abu and Kumbhalgarh Fort, returning to Udaipur by evening for dinner at the hotel.", activities: ["Nakki Lake (boating & ropeway on own)", "Dilwara Jain Temple", "Toad Rock", "Mall Road — shopping & street food", "Kumbhalgarh Fort — 36km wall", "Neelkanth Mahadev Temple", "Return to Udaipur"], meals: ["breakfast", "dinner"], stay: "Hotel in Udaipur" },
    { day: 4, title: "Udaipur Royal Highlights & Departure", location: "Udaipur", description: "Cover the royal Udaipur sights through the day, then depart for Delhi in the evening by overnight Volvo.", activities: ["City Palace", "Lake Pichola boat ride — Jag Mandir view", "Jagdish Temple", "Gangaur Ghat & Ambrai Ghat — photo stop", "Karni Mata Ropeway", "Evening departure for Delhi (overnight Volvo)"], meals: ["breakfast"] },
    { day: 5, title: "Arrival Delhi", description: "Arrive in Delhi by morning. Trip ends.", activities: ["Morning arrival in Delhi", "Trip ends"], meals: [] },
  ],
  faqs: [
    { id: "udaipur-flying-faq-1", question: "Is this too rushed to see Udaipur properly?", answer: "It covers the essentials — City Palace and Lake Pichola — in one full day. For a more relaxed pace, see the 3-day Udaipur Heritage Walk." },
    { id: "udaipur-flying-faq-2", question: "Is the boat ride weather-dependent?", answer: "Yes, boat rides on Lake Pichola can be suspended in high winds or heavy rain; an alternative activity is arranged if that happens." },
  ],
  mapQuery: "Udaipur, Rajasthan, India",
  rating: 4.5,
  reviewCount: 36,
  featured: false,
  galleryCount: 5,
});
