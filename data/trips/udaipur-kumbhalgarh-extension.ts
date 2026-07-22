import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 4D/3N sibling of the Udaipur circuit (see udaipur.ts) — adds a
 * Kumbhalgarh Fort day trip on top of the base itinerary.
 */
export const udaipurKumbhalgarhExtensionTrip = buildTrip({
  slug: "udaipur-kumbhalgarh-extension",
  title: "Udaipur + Kumbhalgarh Extension",
  destinationSlug: "udaipur",
  destinationName: "Udaipur",
  themeKey: "rajasthan",
  shortDescription: "A 4-day Udaipur city trip extended with a day trip to Kumbhalgarh Fort.",
  fullDescription:
    "Udaipur + Kumbhalgarh Extension takes the standard Udaipur Heritage Walk and adds a full day trip to Kumbhalgarh Fort — the second-longest fortified wall in the world after the Great Wall of China — for travellers who want more than the city itself.",
  durationDays: 4,
  durationNights: 3,
  difficulty: "easy",
  bestSeason: ["October", "November", "December", "January", "February", "March"],
  groupSize: { min: 12, max: 18 },
  pickup: "Udaipur Railway Station / Airport",
  drop: "Udaipur Railway Station / Airport",
  circuitGroup: "udaipur-circuit",
  destinationRoutes: [
    { id: "udaipur-kumbhalgarh-route-1", stops: ["Udaipur", "Kumbhalgarh"] },
    { id: "udaipur-kumbhalgarh-route-2", stops: ["Udaipur", "Ranakpur", "Mount Abu"] },
  ],
  priceBase: 13999,
  priceDiscounted: 12999,
  bookingAmount: 2000,
  totalSeats: 18,
  availableSeats: 11,
  batchStartDates: ["2026-11-13", "2026-12-04", "2026-12-25", "2027-01-15"],
  inclusions: [
    "3 nights stay in Udaipur",
    "Daily breakfast and dinner",
    "City Palace and boat ride on Lake Pichola",
    "Kumbhalgarh Fort day trip transfers and entry",
    "All local transfers by shared vehicle",
    "Trip leader for the full stay",
  ],
  exclusions: [
    "Travel to/from Udaipur",
    "Lunch on all days",
    "Camera fees at monuments (if applicable)",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Kumbhalgarh Fort and its 36 km fortified wall",
    "City Palace guided walkthrough",
    "Sunset boat ride on Lake Pichola",
    "Jagdish Temple and old-city lanes",
    "Rooftop café evening overlooking the lake",
  ],
  itinerary: [
    { day: 1, title: "Arrival, Lake Pichola", location: "Udaipur", description: "Arrive in Udaipur, check in, then an evening boat ride on Lake Pichola followed by a rooftop dinner.", activities: ["Hotel check-in", "Lake Pichola boat ride", "Rooftop dinner"], meals: ["dinner"], stay: "Hotel in Udaipur" },
    { day: 2, title: "City Palace & old city", location: "Udaipur", description: "Full day covering the City Palace, Jagdish Temple, and the old-city lanes, with time for local shopping.", activities: ["City Palace guided walk", "Jagdish Temple", "Old-city lane walk"], meals: ["breakfast", "dinner"], stay: "Hotel in Udaipur" },
    { day: 3, title: "Kumbhalgarh Fort day trip", location: "Kumbhalgarh", description: "Full day trip to Kumbhalgarh Fort, including the fortified wall and the Badal Mahal palace within it.", activities: ["Kumbhalgarh Fort visit", "Badal Mahal palace", "Fortified wall walk"], meals: ["breakfast", "dinner"], stay: "Hotel in Udaipur" },
    { day: 4, title: "Saheliyon ki Bari, departure", location: "Udaipur", description: "Morning visit to Saheliyon ki Bari gardens, then checkout and drop.", activities: ["Saheliyon ki Bari gardens", "Checkout and drop"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "udaipur-kumbhalgarh-faq-1", question: "How far is Kumbhalgarh from Udaipur?", answer: "It's roughly a 2 hour drive each way, covered as a full day trip with transfers and entry included." },
    { id: "udaipur-kumbhalgarh-faq-2", question: "Is this trip family-friendly?", answer: "It's primarily run as a mixed-group trip for solo/young travellers; families are welcome to check with the team before booking." },
  ],
  mapQuery: "Udaipur, Rajasthan, India",
  rating: 4.7,
  reviewCount: 29,
  featured: false,
  galleryCount: 6,
});
