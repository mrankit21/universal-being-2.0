import { buildTrip } from "./_builder";

/** PLACEHOLDER CONTENT — see manali.ts header note; same applies here.
 * The 5D/4N sibling of the Dharamshala circuit (see dharamshala.ts) — adds
 * a Bir Billing day trip on top of the base McLeod Ganj + Triund itinerary.
 */
export const dharamshalaBirBillingExtensionTrip = buildTrip({
  slug: "dharamshala-bir-billing-extension",
  title: "Dharamshala + Bir Billing Extension",
  destinationSlug: "dharamshala",
  destinationName: "Dharamshala",
  themeKey: "forest",
  shortDescription: "A 5-day McLeod Ganj and Triund trip extended with a day at Bir Billing, India's paragliding capital.",
  fullDescription:
    "Dharamshala + Bir Billing Extension takes the standard McLeod Ganj Escape and adds a full day trip to Bir Billing, where paragliding over the Kangra valley is available at the traveller's own pace and expense, for those who want more than a monastery-and-café trip.",
  durationDays: 5,
  durationNights: 4,
  difficulty: "moderate",
  bestSeason: ["March", "April", "May", "September", "October", "November"],
  groupSize: { min: 10, max: 16 },
  pickup: "Delhi (overnight bus pickup point)",
  drop: "Delhi (overnight bus drop point)",
  circuitGroup: "dharamshala-circuit",
  destinationRoutes: [
    { id: "dharamshala-bir-route-1", stops: ["McLeod Ganj", "Triund", "Dharamshala"], href: "/trips/dharamshala-mcleodganj-escape" },
    { id: "dharamshala-bir-route-2", stops: ["McLeod Ganj", "Bir Billing"] },
  ],
  priceBase: 11999,
  priceDiscounted: 10999,
  bookingAmount: 2000,
  totalSeats: 16,
  availableSeats: 9,
  batchStartDates: ["2026-09-11", "2026-10-02", "2026-10-23", "2026-11-13"],
  inclusions: [
    "4 nights stay in McLeod Ganj",
    "Daily breakfast and dinner",
    "Delhi to Dharamshala to Delhi shared vehicle travel",
    "Guided Triund day hike",
    "Bir Billing day trip transfers",
    "Local monastery and market walks",
  ],
  exclusions: [
    "Lunch on all days",
    "Café bills and personal shopping",
    "Paragliding charges at Bir Billing (paid at venue)",
    "Triund camping gear (if opting to stay overnight)",
    "Anything not mentioned in inclusions",
  ],
  highlights: [
    "Triund ridge day hike with Dhauladhar views",
    "Bir Billing — India's paragliding capital",
    "Namgyal Monastery and Tsuglagkhang complex",
    "Bhagsu waterfall walk",
    "McLeod Ganj café and market evenings",
  ],
  itinerary: [
    { day: 1, title: "Delhi to Dharamshala", description: "Overnight journey from Delhi towards McLeod Ganj.", activities: ["Overnight shared-vehicle journey"], meals: [] },
    { day: 2, title: "Arrival, McLeod Ganj monasteries", description: "Check in, then explore Namgyal Monastery, the Tsuglagkhang complex and McLeod Ganj market.", activities: ["Namgyal Monastery visit", "Market walk"], meals: ["breakfast", "dinner"], stay: "Guesthouse in McLeod Ganj" },
    { day: 3, title: "Triund day hike", description: "Full-day hike up to Triund for Dhauladhar views, returning to McLeod Ganj by evening.", activities: ["Triund ridge trek", "Bhagsu waterfall (time permitting)"], meals: ["breakfast", "dinner"], stay: "Guesthouse in McLeod Ganj" },
    { day: 4, title: "Bir Billing day trip", description: "Full day trip to Bir Billing, with paragliding available at the traveller's own pace and expense.", activities: ["Bir Billing viewpoint", "Optional paragliding (paid at venue)"], meals: ["breakfast", "dinner"], stay: "Guesthouse in McLeod Ganj" },
    { day: 5, title: "Dharamshala to Delhi", description: "Morning at leisure, then the return journey to Delhi.", activities: ["Morning leisure time", "Return journey to Delhi"], meals: ["breakfast"] },
  ],
  faqs: [
    { id: "dharamshala-bir-faq-1", question: "Is paragliding included in the price?", answer: "No, paragliding at Bir Billing is optional and paid directly at the venue." },
    { id: "dharamshala-bir-faq-2", question: "How far is Bir Billing from McLeod Ganj?", answer: "It's roughly a 2.5 hour drive each way, covered as a full day trip with transfers included." },
  ],
  mapQuery: "McLeod Ganj, Dharamshala, Himachal Pradesh, India",
  rating: 4.7,
  reviewCount: 26,
  featured: false,
  galleryCount: 6,
});
