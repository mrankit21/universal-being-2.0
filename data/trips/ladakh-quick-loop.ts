import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 *
 * The 4D/3N sibling of the Ladakh circuit (see ladakh.ts) — same
 * `circuitGroup: "ladakh-circuit"` but a fully independent Trip: its own
 * itinerary (Leh + Nubra only, no Pangong/Chang La), its own pricing, and
 * its own batch dates. `TripDurationSelector` on either trip's page links
 * straight across to this one.
 */
export const ladakhQuickLoopTrip = buildTrip({
  slug: "ladakh-quick-loop",
  title: "Ladakh Quick Loop",
  destinationSlug: "ladakh",
  destinationName: "Ladakh",
  themeKey: "winter",
  shortDescription: "A fast 4-day Leh and Nubra Valley loop for short breaks.",
  fullDescription:
    "Ladakh Quick Loop is the fastest way to see Leh town and the Nubra Valley sand dunes without needing a full week off. Built with acclimatisation in mind despite the short length — one full rest day in Leh before crossing Khardung La — and run as a small group with a dedicated trip leader and driver.",
  durationDays: 4,
  durationNights: 3,
  difficulty: "moderate",
  bestSeason: ["June", "July", "August", "September"],
  groupSize: { min: 10, max: 14 },
  pickup: "Leh Airport / Leh city hotel",
  drop: "Leh Airport / Leh city hotel",
  circuitGroup: "ladakh-circuit",
  destinationRoutes: [
    { id: "ladakh-qloop-route-1", stops: ["Leh", "Nubra Valley"] },
    { id: "ladakh-qloop-route-2", stops: ["Leh", "Pangong"], href: "/trips/ladakh-himalayan-circuit" },
  ],
  priceBase: 14999,
  priceDiscounted: 12999,
  bookingAmount: 2500,
  totalSeats: 14,
  availableSeats: 11,
  batchStartDates: ["2027-06-08", "2027-06-22", "2027-07-06", "2027-07-20", "2027-08-03"],
  inclusions: [
    "3 nights stay (hotel in Leh, camp in Nubra)",
    "Daily breakfast and dinner",
    "All transfers and sightseeing by shared Innova/Tempo Traveller",
    "Inner line permit for Nubra Valley",
    "Trip leader for the entire loop",
    "Oxygen cylinder carried in the support vehicle",
  ],
  exclusions: [
    "Flights or train to/from Leh",
    "Lunch on all days",
    "Bike/scooter rental (if opted independently)",
    "Personal expenses and shopping",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Nubra Valley sand dunes and double-humped camels",
    "Khardung La — one of the world's highest motorable passes",
    "Leh Palace and Shanti Stupa at sunset",
    "Compact 4-day format, ideal for a long weekend",
  ],
  itinerary: [
    {
      day: 1,
      title: "Arrival in Leh",
      description: "Arrive Leh, check in, and rest through the day for acclimatisation.",
      activities: ["Airport pickup", "Rest and hydration", "Evening market walk (easy pace)"],
      meals: ["dinner"],
      stay: "Hotel in Leh",
    },
    {
      day: 2,
      title: "Leh local sightseeing",
      description: "Easy sightseeing day around Leh to continue acclimatising before the pass crossing.",
      activities: ["Shanti Stupa", "Leh Palace", "Local market"],
      meals: ["breakfast", "dinner"],
      stay: "Hotel in Leh",
    },
    {
      day: 3,
      title: "Leh to Nubra Valley via Khardung La",
      description: "Cross Khardung La into the Nubra Valley, visiting the sand dunes at Hunder, then return to Leh.",
      activities: ["Khardung La photo stop", "Hunder sand dunes", "Camel ride (optional, paid)"],
      meals: ["breakfast", "dinner"],
      stay: "Camp/guesthouse in Nubra",
    },
    {
      day: 4,
      title: "Departure from Leh",
      description: "Drive back from Nubra to Leh and onward to the airport/hotel as per flight timing.",
      activities: ["Return drive to Leh", "Airport transfer"],
      meals: ["breakfast"],
    },
  ],
  faqs: [
    {
      id: "ladakh-qloop-faq-1",
      question: "Is 4 days enough to acclimatise safely?",
      answer:
        "Yes — the itinerary keeps a full rest day in Leh before crossing Khardung La, which is the standard acclimatisation buffer for a short trip.",
    },
    {
      id: "ladakh-qloop-faq-2",
      question: "Does this loop include Pangong Lake?",
      answer:
        "No — this is the Leh + Nubra loop only. For Pangong as well, see the 7-day Ladakh Himalayan Circuit.",
    },
    {
      id: "ladakh-qloop-faq-3",
      question: "Is oxygen support available?",
      answer: "Yes, an oxygen cylinder is carried in the support vehicle for the full loop as a precaution.",
    },
  ],
  mapQuery: "Leh, Ladakh, India",
  rating: 4.6,
  reviewCount: 54,
  featured: false,
  galleryCount: 6,
});
