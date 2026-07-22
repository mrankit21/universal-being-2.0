import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 6D/5N sibling of the Spiti circuit (see spiti.ts) — retraces the
 * route back to Manali instead of continuing on to Tabo/Chitkul/Shimla,
 * cutting two days off the base itinerary.
 */
export const spitiQuickCircuitTrip = buildTrip({
  slug: "spiti-quick-circuit",
  title: "Spiti Quick Circuit",
  destinationSlug: "spiti",
  destinationName: "Spiti Valley",
  themeKey: "winter",
  shortDescription: "A faster 6-day Spiti loop covering Chandratal, Kaza, Key, Kibber, and Langza.",
  fullDescription:
    "Spiti Quick Circuit covers the core of the valley — Chandratal, Kaza, Key Monastery, Kibber, and Langza — and returns to Manali via Kunzum Pass, without the longer Tabo-Chitkul-Shimla leg, for travellers with less time to spare.",
  durationDays: 6,
  durationNights: 5,
  difficulty: "challenging",
  bestSeason: ["May", "June", "July", "August", "September", "October"],
  groupSize: { min: 8, max: 12 },
  pickup: "Manali (meeting point)",
  drop: "Manali (meeting point)",
  circuitGroup: "spiti-circuit",
  destinationRoutes: [
    { id: "spiti-quick-route-1", stops: ["Kaza", "Key Monastery", "Kibber"] },
    { id: "spiti-quick-route-2", stops: ["Manali", "Kaza", "Shimla"], href: "/trips/spiti-valley-expedition" },
  ],
  priceBase: 15999,
  priceDiscounted: 14999,
  bookingAmount: 2500,
  totalSeats: 12,
  availableSeats: 5,
  batchStartDates: ["2027-06-06", "2027-06-20", "2027-07-04", "2027-08-15"],
  inclusions: [
    "5 nights stay (hotels/homestays/camps as per itinerary)",
    "All meals through the trip (breakfast, lunch, dinner)",
    "Travel in shared Tempo Traveller / Innova through the circuit",
    "Inner line permits where required",
    "Trip leader and local driver for the full circuit",
  ],
  exclusions: [
    "Travel to/from the meeting point (Manali)",
    "Personal expenses and shopping",
    "Oxygen cylinder / medical evacuation if required",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Chandratal Lake camping under a clear night sky",
    "Key Monastery and Kibber village",
    "Langza's giant Buddha statue and fossil village",
    "Faster loop back to Manali via Kunzum Pass",
  ],
  itinerary: [
    { day: 1, title: "Manali to Chandratal", description: "Drive from Manali over Kunzum Pass to Chandratal, camping by the lake.", activities: ["Kunzum Pass crossing", "Chandratal Lake walk", "Camp stay"], meals: ["breakfast", "lunch", "dinner"], stay: "Camp near Chandratal" },
    { day: 2, title: "Chandratal to Kaza", description: "Descend into the Spiti valley towards Kaza, the region's largest town.", activities: ["Scenic descent drive", "Kaza market evening"], meals: ["breakfast", "lunch", "dinner"], stay: "Hotel/homestay in Kaza" },
    { day: 3, title: "Key, Kibber, Langza", description: "Full day covering Key Monastery, Kibber village and Langza's Buddha statue and fossil trails.", activities: ["Key Monastery visit", "Kibber village walk", "Langza Buddha statue"], meals: ["breakfast", "lunch", "dinner"], stay: "Hotel/homestay in Kaza" },
    { day: 4, title: "Hikkim, Komic, Local exploration", description: "Visit the world's highest post office at Hikkim and Komic, one of the world's highest motorable villages.", activities: ["Hikkim post office", "Komic monastery"], meals: ["breakfast", "lunch", "dinner"], stay: "Hotel/homestay in Kaza" },
    { day: 5, title: "Kaza to Chandratal (return leg)", description: "Retrace the route back over Kunzum Pass towards Chandratal for a final night under the stars.", activities: ["Kunzum Pass crossing (return)", "Evening at Chandratal"], meals: ["breakfast", "lunch", "dinner"], stay: "Camp near Chandratal" },
    { day: 6, title: "Chandratal to Manali, trip ends", description: "Final descent back into Manali; trip concludes here.", activities: ["Drop at Manali"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "spiti-quick-faq-1", question: "How is this different from the 8-day expedition?", answer: "It skips the Tabo-Nako-Chitkul-Shimla leg and instead loops back to Manali via Kunzum Pass, saving two days." },
    { id: "spiti-quick-faq-2", question: "Is prior high-altitude experience required?", answer: "Not mandatory, but reasonable fitness is expected since several stops are above 4,000m." },
  ],
  mapQuery: "Spiti Valley, Himachal Pradesh, India",
  rating: 4.7,
  reviewCount: 28,
  featured: false,
  galleryCount: 6,
});
