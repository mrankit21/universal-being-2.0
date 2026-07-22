import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 *
 * The 9D/8N sibling of the Ladakh circuit (see ladakh.ts) — same
 * `circuitGroup: "ladakh-circuit"` but a fully independent Trip: its own
 * extended itinerary (adds Tso Moriri and the Kargil/Zanskar leg on top of
 * the full Leh-Nubra-Pangong loop), its own pricing, and its own batch
 * dates. `TripDurationSelector` on either trip's page links straight
 * across to this one.
 */
export const ladakhExtendedExplorerTrip = buildTrip({
  slug: "ladakh-extended-explorer",
  title: "Ladakh Extended Explorer",
  destinationSlug: "ladakh",
  destinationName: "Ladakh",
  themeKey: "winter",
  shortDescription: "A 9-day deep-dive circuit covering Nubra, Pangong, Tso Moriri, and Zanskar.",
  fullDescription:
    "Ladakh Extended Explorer is the full 9-day version of the circuit for travellers who want more than the standard loop: Nubra Valley, Pangong Lake, the remote Tso Moriri, and the Kargil-Zanskar route, all in one trip. Paced with two acclimatisation days built in, and run as a small group with a dedicated trip leader and driver for the entire route.",
  durationDays: 9,
  durationNights: 8,
  difficulty: "challenging",
  bestSeason: ["June", "July", "August", "September"],
  groupSize: { min: 10, max: 14 },
  pickup: "Leh Airport / Leh city hotel",
  drop: "Leh Airport / Leh city hotel",
  circuitGroup: "ladakh-circuit",
  destinationRoutes: [
    { id: "ladakh-explorer-route-1", stops: ["Leh", "Nubra Valley", "Pangong"], href: "/trips/ladakh-himalayan-circuit" },
    { id: "ladakh-explorer-route-2", stops: ["Leh", "Tso Moriri", "Pangong"] },
    { id: "ladakh-explorer-route-3", stops: ["Leh", "Kargil", "Zanskar"] },
  ],
  priceBase: 30999,
  priceDiscounted: 27999,
  bookingAmount: 4500,
  totalSeats: 14,
  availableSeats: 8,
  batchStartDates: ["2027-06-12", "2027-07-03", "2027-07-24", "2027-08-14"],
  inclusions: [
    "8 nights stay (hotel in Leh, camps in Nubra/Pangong/Tso Moriri)",
    "Daily breakfast and dinner",
    "All transfers and sightseeing by shared Innova/Tempo Traveller",
    "Inner line permits for Nubra, Pangong, and Tso Moriri",
    "Trip leader for the entire circuit",
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
    "Pangong Lake and Tso Moriri overnight camping",
    "Nubra Valley sand dunes and double-humped camels",
    "Khardung La — one of the world's highest motorable passes",
    "Kargil and the Zanskar valley route",
    "Leh Palace and Shanti Stupa at sunset",
  ],
  itinerary: [
    { day: 1, title: "Arrival in Leh", description: "Arrive Leh, check in, and rest through the day for acclimatisation.", activities: ["Airport pickup", "Rest and hydration", "Evening market walk (easy pace)"], meals: ["dinner"], stay: "Hotel in Leh" },
    { day: 2, title: "Leh local sightseeing", description: "Easy sightseeing day around Leh to continue acclimatising.", activities: ["Shanti Stupa", "Leh Palace", "Local market"], meals: ["breakfast", "dinner"], stay: "Hotel in Leh" },
    { day: 3, title: "Leh to Nubra Valley via Khardung La", description: "Cross Khardung La into the Nubra Valley, visiting the sand dunes at Hunder.", activities: ["Khardung La photo stop", "Hunder sand dunes", "Camel ride (optional, paid)"], meals: ["breakfast", "dinner"], stay: "Camp/guesthouse in Nubra" },
    { day: 4, title: "Nubra to Pangong Lake", description: "Drive from Nubra to Pangong via Shyok route, reaching the lake by evening.", activities: ["Shyok river route drive", "Pangong Lake sunset"], meals: ["breakfast", "dinner"], stay: "Camp near Pangong" },
    { day: 5, title: "Pangong to Tso Moriri", description: "Drive along remote high-altitude roads from Pangong to the Tso Moriri wetlands.", activities: ["High-altitude plateau drive", "Tso Moriri lakeside walk"], meals: ["breakfast", "dinner"], stay: "Camp near Tso Moriri" },
    { day: 6, title: "Tso Moriri to Leh via Chumathang", description: "Return route via Chumathang hot springs back into Leh.", activities: ["Chumathang hot springs", "Return to Leh"], meals: ["breakfast", "dinner"], stay: "Hotel in Leh" },
    { day: 7, title: "Leh to Kargil via Lamayuru", description: "Drive west to Kargil, stopping at Lamayuru monastery and the Moonland landscape.", activities: ["Lamayuru Monastery", "Moonland viewpoint"], meals: ["breakfast", "dinner"], stay: "Hotel in Kargil" },
    { day: 8, title: "Kargil to Zanskar valley day trip", description: "Day trip into the Zanskar valley before returning toward Leh.", activities: ["Zanskar valley drive", "Sani Monastery"], meals: ["breakfast", "dinner"], stay: "Hotel in Kargil" },
    { day: 9, title: "Departure from Leh", description: "Drive back to Leh and airport/hotel drop as per flight timing.", activities: ["Return drive to Leh", "Final checkout", "Airport transfer"], meals: ["breakfast"] },
  ],
  faqs: [
    {
      id: "ladakh-explorer-faq-1",
      question: "How is this different from the 7-day circuit?",
      answer:
        "It adds two legs on top of the standard Leh-Nubra-Pangong loop: Tso Moriri and the Kargil-Zanskar route, spread across two extra days.",
    },
    {
      id: "ladakh-explorer-faq-2",
      question: "Is oxygen support available?",
      answer: "Yes, an oxygen cylinder is carried in the support vehicle for the full circuit as a precaution.",
    },
    {
      id: "ladakh-explorer-faq-3",
      question: "Are inner line permits included?",
      answer: "Yes, permits for Nubra, Pangong, and Tso Moriri are all arranged as part of the trip.",
    },
    {
      id: "ladakh-explorer-faq-4",
      question: "What's the network situation?",
      answer:
        "Postpaid connections work in Leh town and Kargil; Nubra, Pangong, and Tso Moriri have limited to no network for most operators.",
    },
  ],
  mapQuery: "Leh, Ladakh, India",
  rating: 4.9,
  reviewCount: 37,
  featured: false,
  galleryCount: 8,
});
