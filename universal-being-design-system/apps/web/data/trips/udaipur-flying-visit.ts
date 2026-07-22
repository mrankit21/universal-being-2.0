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
  durationDays: 2,
  durationNights: 1,
  difficulty: "easy",
  bestSeason: ["October", "November", "December", "January", "February", "March"],
  groupSize: { min: 12, max: 18 },
  pickup: "Udaipur Railway Station / Airport",
  drop: "Udaipur Railway Station / Airport",
  circuitGroup: "udaipur-circuit",
  destinationRoutes: [
    { id: "udaipur-flying-route-1", stops: ["Udaipur"] },
    { id: "udaipur-flying-route-2", stops: ["Udaipur", "Kumbhalgarh"], href: "/trips/udaipur-heritage-walk" },
  ],
  priceBase: 7999,
  priceDiscounted: 6999,
  bookingAmount: 1000,
  totalSeats: 18,
  availableSeats: 14,
  batchStartDates: ["2026-11-14", "2026-11-28", "2026-12-12", "2026-12-26"],
  inclusions: [
    "1 night stay in Udaipur",
    "Breakfast and dinner",
    "City Palace and boat ride on Lake Pichola",
    "All local transfers by shared vehicle",
  ],
  exclusions: [
    "Travel to/from Udaipur",
    "Lunch",
    "Camera fees at monuments (if applicable)",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "City Palace guided walkthrough",
    "Sunset boat ride on Lake Pichola",
    "Jagdish Temple and old-city lanes",
    "Fits inside a single overnight stay",
  ],
  itinerary: [
    { day: 1, title: "Arrival, City Palace & Lake Pichola", description: "Arrive in Udaipur, check in, then cover the City Palace and old-city lanes before an evening boat ride on Lake Pichola and a rooftop dinner.", activities: ["Hotel check-in", "City Palace guided walk", "Jagdish Temple", "Lake Pichola boat ride", "Rooftop dinner"], meals: ["dinner"], stay: "Hotel in Udaipur" },
    { day: 2, title: "Departure", description: "Morning at leisure, then checkout and drop.", activities: ["Morning leisure time", "Checkout and drop"], meals: ["breakfast"] },
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
