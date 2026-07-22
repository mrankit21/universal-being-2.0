import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 10D/9N sibling of the Spiti circuit (see spiti.ts) — adds a
 * Dhankar/Pin Valley day and a buffer day at Chitkul on top of the base
 * 8-day itinerary.
 */
export const spitiChandratalExtendedTrip = buildTrip({
  slug: "spiti-chandratal-extended",
  title: "Spiti + Chandratal Extended",
  destinationSlug: "spiti",
  destinationName: "Spiti Valley",
  themeKey: "winter",
  shortDescription: "A deep-dive 10-day Spiti circuit adding Dhankar Monastery, Pin Valley, and a Chitkul buffer day.",
  fullDescription:
    "Spiti + Chandratal Extended is the full 10-day version of the circuit for travellers who want more than the standard loop: the cliff-top Dhankar Monastery, a detour into Pin Valley, and an extra buffer day at Chitkul, on top of the base Chandratal-Kaza-Tabo-Chitkul-Shimla route.",
  durationDays: 10,
  durationNights: 9,
  difficulty: "challenging",
  bestSeason: ["May", "June", "July", "August", "September", "October"],
  groupSize: { min: 8, max: 12 },
  pickup: "Manali (meeting point) or Shimla",
  drop: "Manali or Shimla",
  circuitGroup: "spiti-circuit",
  destinationRoutes: [
    { id: "spiti-ext-route-1", stops: ["Kaza", "Dhankar", "Pin Valley"] },
    { id: "spiti-ext-route-2", stops: ["Manali", "Kaza", "Shimla"], href: "/trips/spiti-valley-expedition" },
  ],
  priceBase: 24999,
  priceDiscounted: 23999,
  bookingAmount: 3500,
  totalSeats: 12,
  availableSeats: 5,
  batchStartDates: ["2027-06-04", "2027-06-25", "2027-07-16", "2027-08-06"],
  inclusions: [
    "9 nights stay (hotels/homestays/camps as per itinerary)",
    "All meals through the trip (breakfast, lunch, dinner)",
    "Travel in shared Tempo Traveller / Innova through the circuit",
    "Inner line permits where required",
    "Trip leader and local driver for the full circuit",
  ],
  exclusions: [
    "Travel to/from the meeting point (Manali/Shimla)",
    "Personal expenses and shopping",
    "Oxygen cylinder / medical evacuation if required",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Chandratal Lake camping under a clear night sky",
    "Dhankar Monastery on its cliff-edge perch",
    "Pin Valley detour",
    "Key Monastery, Kibber, and Langza's fossil village",
    "Highest post office in the world at Hikkim",
    "Extra buffer day at Chitkul, India's last inhabited village on this route",
  ],
  itinerary: [
    { day: 1, title: "Manali to Chandratal", location: "Chandratal", description: "Drive from Manali over Kunzum Pass to Chandratal, camping by the lake.", activities: ["Kunzum Pass crossing", "Chandratal Lake walk", "Camp stay"], meals: ["breakfast", "lunch", "dinner"], stay: "Camp near Chandratal" },
    { day: 2, title: "Chandratal to Kaza", location: "Kaza", description: "Descend into the Spiti valley towards Kaza, the region's largest town.", activities: ["Scenic descent drive", "Kaza market evening"], meals: ["breakfast", "lunch", "dinner"], stay: "Hotel/homestay in Kaza" },
    { day: 3, title: "Key, Kibber, Langza", location: "Kaza", description: "Full day covering Key Monastery, Kibber village and Langza's Buddha statue and fossil trails.", activities: ["Key Monastery visit", "Kibber village walk", "Langza Buddha statue"], meals: ["breakfast", "lunch", "dinner"], stay: "Hotel/homestay in Kaza" },
    { day: 4, title: "Hikkim, Komic, Local exploration", location: "Kaza", description: "Visit the world's highest post office at Hikkim and Komic, one of the world's highest motorable villages.", activities: ["Hikkim post office", "Komic monastery"], meals: ["breakfast", "lunch", "dinner"], stay: "Hotel/homestay in Kaza" },
    { day: 5, title: "Dhankar Monastery & Pin Valley", location: "Pin Valley", description: "Visit the cliff-top Dhankar Monastery, then a detour into the remote Pin Valley.", activities: ["Dhankar Monastery visit", "Pin Valley detour"], meals: ["breakfast", "lunch", "dinner"], stay: "Hotel/homestay in Kaza" },
    { day: 6, title: "Kaza to Tabo", location: "Tabo", description: "Drive down-valley to Tabo, home to a thousand-year-old monastery.", activities: ["Tabo Monastery visit"], meals: ["breakfast", "lunch", "dinner"], stay: "Homestay in Tabo" },
    { day: 7, title: "Tabo to Chitkul via Nako", location: "Chitkul", description: "Long scenic drive through Nako village towards Chitkul, India's last inhabited village on this route.", activities: ["Nako Lake stop", "Drive to Chitkul"], meals: ["breakfast", "lunch", "dinner"], stay: "Homestay in Chitkul" },
    { day: 8, title: "Chitkul buffer day", location: "Chitkul", description: "A full extra day at Chitkul to explore the village, the Baspa river, and nearby Rakcham at a slower pace.", activities: ["Chitkul village walk", "Baspa river viewpoint", "Rakcham day trip"], meals: ["breakfast", "lunch", "dinner"], stay: "Homestay in Chitkul" },
    { day: 9, title: "Chitkul to Sangla/Shimla road", description: "Begin the return journey towards Shimla.", activities: ["Sangla valley drive"], meals: ["breakfast", "lunch", "dinner"], stay: "Hotel en route" },
    { day: 10, title: "Onward to Shimla, trip ends", description: "Final drive into Shimla; trip concludes here.", activities: ["Drop at Shimla"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "spiti-ext-faq-1", question: "How is this different from the 8-day expedition?", answer: "It adds a Dhankar Monastery and Pin Valley day, plus a full buffer day at Chitkul, on top of the base itinerary." },
    { id: "spiti-ext-faq-2", question: "Is prior high-altitude experience required?", answer: "Not mandatory, but reasonable fitness is expected since several stops are above 4,000m. Disclose any medical conditions before booking." },
    { id: "spiti-ext-faq-3", question: "Will there be network connectivity?", answer: "Network is patchy to non-existent for most of the circuit. Postpaid BSNL/Jio work best in Spiti; expect limited connectivity for several days." },
  ],
  mapQuery: "Spiti Valley, Himachal Pradesh, India",
  rating: 4.9,
  reviewCount: 19,
  featured: false,
  galleryCount: 8,
});
