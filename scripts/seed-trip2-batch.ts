/**
 * One-off batch seed — upserts the Trip 2.0 pages built from the raw
 * itineraries shared on 2026-08-02 (Jibhi, Dharamshala, Udaipur, Manali–Kasol)
 * into Trip2Model, matched by `slug`. Idempotent: running it again just
 * re-syncs these same 4 docs, never duplicates them.
 *
 * All 4 are seeded with status "draft" on purpose — nothing goes live until
 * you review + Publish each one from /admin/trip2.
 *
 * Fields the raw text didn't specify (gallery images, thingsToExperience,
 * didYouKnow, faqs, and Manali's batch dates) are filled with reasonable
 * placeholders marked "TODO" in their copy — search this file for "TODO"
 * or just open each trip in /admin/trip2 and look for anything that reads
 * like a placeholder before publishing.
 *
 * Run: npx tsx scripts/seed-trip2-batch.ts
 */
import { Trip2Model } from "../lib/db/models";
import { connect, disconnect } from "./seed-utils";

const trips: Record<string, unknown>[] = [
  // ---------------------------------------------------------------------
  // 1. JIBHI – TIRTHAN VALLEY PREMIUM TOUR
  // ---------------------------------------------------------------------
  {
    slug: "jibhi-tirthan-valley-premium-tour",
    status: "draft",
    title: "Jibhi – Tirthan Valley Premium Tour",
    shortDescription:
      "4 nights of waterfalls, a Himalayan trek to Serolsar Lake, and riverside relaxation in the offbeat valleys of Himachal.",
    location: "Jibhi, Tirthan Valley, Himachal Pradesh",
    durationLabel: "4N / 5D",
    groupSizeLabel: "Every Friday departure", // TODO: replace with an actual group-size figure once you have one
    bookHref: "/trips/jibhi-tirthan-valley-premium-tour/book",
    leadFormDestination: "Jibhi",
    quickLinks: [
      { icon: "MapPin", label: "Location", href: "#location", order: 1 },
      { icon: "Calendar", label: "Batch Dates", href: "#batches", order: 2 },
      { icon: "Hotel", label: "Stay", href: "#stay", order: 3 },
      { icon: "Utensils", label: "Meals", href: "#inclusions", order: 4 },
    ],
    gallery: [], // TODO: upload gallery photos from Media Library
    hotelTiers: [
      {
        stars: 3,
        label: "Premium 3★ Property",
        description: "Comfortable rooms in a well-located property near Jibhi's local market.",
      },
    ],
    itinerary: [
      {
        day: 1,
        title: "Delhi ➜ Jibhi",
        location: "Delhi",
        description:
          "Reporting at 8:30 PM, departure 9:00 PM from Delhi Kashmiri Gate ISBT. Meet your Trip Coordinator and board a Premium Traveller (VIP back seats) for the overnight journey towards Jibhi, with refreshment stops en route.",
      },
      {
        day: 2,
        title: "Jibhi Local Sightseeing",
        location: "Jibhi",
        description:
          "Morning arrival, hotel check-in and freshen up. Visit Jibhi Waterfall, Mini Thailand, take a riverside walk, explore the local market, and go café hopping. Dinner and overnight stay in a Premium 3★ property.",
      },
      {
        day: 3,
        title: "Jalori Pass – Serolsar Lake",
        location: "Jalori Pass, Himachal Pradesh",
        description:
          "After breakfast, drive to Jalori Pass and trek to Serolsar Lake, taking in Himalayan views along the way with a photography session. Return to the hotel for dinner and overnight stay.",
      },
      {
        day: 4,
        title: "Tirthan Valley – Great Himalayan National Park",
        location: "Tirthan Valley, Himachal Pradesh",
        description:
          "Visit Tirthan Valley and the Great Himalayan National Park entry point, with time for riverside relaxation. Optional adventure activities available at own cost. Bonfire and music in the evening, weather permitting.",
      },
      {
        day: 5,
        title: "Check-out ➜ Delhi",
        location: "Delhi",
        description:
          "After breakfast, check out and enjoy free time for local shopping before departing for Delhi. Overnight journey, arriving at Delhi Kashmiri Gate early the next morning with unforgettable memories.",
      },
    ],
    inclusions: [
      "3 Nights Stay in Premium 3★ Property",
      "Breakfast & Dinner",
      "Premium Traveller (VIP Back Seats)",
      "Complete Sightseeing",
      "Trip Coordinator",
      "Toll Tax, Parking & Driver Allowance",
    ],
    exclusions: [
      "Entry Tickets",
      "Trek Guide Charges",
      "Lunch",
      "Personal Expenses",
      "Adventure Activities",
      "Anything Not Mentioned Above",
    ],
    price: { basePrice: 7999, bookingAmount: 1999 },
    pickupVariants: [{ city: "Delhi", note: "Kashmiri Gate ISBT — reporting 8:30 PM, departure 9:00 PM" }],
    // TODO: no exact calendar dates were given, only "Every Friday departure" —
    // these are the next 4 Fridays as placeholders; swap in real dates.
    batchDates: [
      { startDate: "2026-08-07", endDate: "2026-08-11", seatsTotal: 16, seatsAvailable: 16, status: "open" },
      { startDate: "2026-08-14", endDate: "2026-08-18", seatsTotal: 16, seatsAvailable: 16, status: "open" },
      { startDate: "2026-08-21", endDate: "2026-08-25", seatsTotal: 16, seatsAvailable: 16, status: "open" },
      { startDate: "2026-08-28", endDate: "2026-09-01", seatsTotal: 16, seatsAvailable: 16, status: "open" },
    ],
    thingsToExperience: [
      { tag: "Nature", title: "Jibhi Waterfall", description: "A short, scenic walk to one of Jibhi's best-known waterfalls.", href: "#itinerary" },
      { tag: "Trek", title: "Serolsar Lake Trek", description: "A rewarding Himalayan trek from Jalori Pass to the sacred Serolsar Lake.", href: "#itinerary" },
      { tag: "Nature", title: "Great Himalayan National Park", description: "Step into the buffer zone of one of India's most pristine national parks.", href: "#itinerary" },
    ],
    // TODO: placeholder facts — replace with anything specific you know about Jibhi
    didYouKnow: [
      { icon: "Globe2", title: "A Hidden Himalayan Gem", description: "Jibhi remained largely undiscovered by mainstream tourism until recent years, keeping it quiet and offbeat.", href: "#" },
      { icon: "Sparkles", title: "Gateway to Tirthan Valley", description: "Jibhi sits right at the doorstep of Tirthan Valley, one of the last untouched valleys in Himachal.", href: "#" },
    ],
    // TODO: placeholder FAQs — replace/expand based on what travellers actually ask
    faqs: [
      { question: "What is the best time to visit Jibhi?", answer: "March to June and September to December offer the most pleasant weather for sightseeing and trekking." },
      { question: "Is the Serolsar Lake trek difficult?", answer: "It's a moderate trek suitable for most fitness levels, but comfortable trekking shoes are recommended." },
    ],
  },

  // ---------------------------------------------------------------------
  // 2. DHARAMSHALA – MCLEODGANJ STRANGER TRIP
  // ---------------------------------------------------------------------
  {
    slug: "dharamshala-mcleodganj-stranger-trip",
    status: "draft",
    title: "Dharamshala – McLeodganj Stranger Trip",
    shortDescription:
      "Monasteries, waterfalls, and mountain viewpoints across Dharamshala and McLeodganj — a stranger group trip built for solo travellers.",
    location: "Dharamshala & McLeodganj, Himachal Pradesh",
    durationLabel: "4N / 5D",
    groupSizeLabel: "Every Friday departure",
    bookHref: "/trips/dharamshala-mcleodganj-stranger-trip/book",
    leadFormDestination: "Dharamshala",
    quickLinks: [
      { icon: "MapPin", label: "Location", href: "#location", order: 1 },
      { icon: "Calendar", label: "Batch Dates", href: "#batches", order: 2 },
      { icon: "Hotel", label: "Stay", href: "#stay", order: 3 },
      { icon: "Utensils", label: "Meals", href: "#inclusions", order: 4 },
    ],
    gallery: [],
    hotelTiers: [{ stars: 3, label: "Comfortable Stay", description: "2 nights of comfortable accommodation in Dharamshala." }],
    itinerary: [
      {
        day: 0,
        title: "Departure from Delhi",
        location: "Delhi",
        description: "9:00 PM — report at the Delhi pickup point. 9:30 PM — departure for Dharamshala by Tempo Traveller. Overnight journey.",
      },
      {
        day: 1,
        title: "Dharamshala Sightseeing",
        location: "Dharamshala",
        description:
          "8:00 AM arrival and freshen up, followed by breakfast at 9:00 AM and hotel check-in at 10:00 AM. Sightseeing covers the HPCA Cricket Stadium, War Memorial, tea gardens, and the Dharamshala local market. Dinner buffet at 8:00 PM, overnight stay in Dharamshala.",
      },
      {
        day: 2,
        title: "McLeodganj Exploration",
        location: "McLeodganj",
        description:
          "After breakfast, visit the Dalai Lama Temple, Bhagsunag Temple, Bhagsu Waterfall, St. John in the Wilderness Church, Naddi View Point, and Sunset Point, plus McLeodganj market and café hopping. Dinner buffet at 8:00 PM, overnight stay.",
      },
      {
        day: 3,
        title: "Triund / Leisure Day",
        location: "McLeodganj",
        description:
          "Breakfast at 7:30 AM, followed by an optional self-paid Triund trek, or free time to explore cafés, monasteries, shopping streets, and local attractions in McLeodganj. Return journey to Delhi by Tempo Traveller begins at 6:00 PM. Overnight journey.",
      },
      {
        day: 4,
        title: "Arrival in Delhi",
        location: "Delhi",
        description: "Reach Delhi between 7:00–9:00 AM with beautiful memories. Trip ends.",
      },
    ],
    inclusions: [
      "Tempo Traveller (Delhi ↔ Dharamshala ↔ Delhi)",
      "2 Nights Comfortable Stay",
      "2 Breakfasts",
      "2 Dinner Buffets",
      "Trip Captain",
      "Local Sightseeing by Traveller",
      "Group Activities",
    ],
    exclusions: [
      "Entry Tickets",
      "Triund Trek Charges",
      "Lunch",
      "Personal Expenses",
      "Adventure Activities",
      "Anything not mentioned in the inclusions",
    ],
    price: { basePrice: 6000, bookingAmount: 2000 },
    pickupVariants: [{ city: "Delhi", note: "Friday night departure — exact pickup point shared closer to the date" }],
    // TODO: only "Every Friday Night" was given, no exact dates — placeholders below
    batchDates: [
      { startDate: "2026-08-07", endDate: "2026-08-11", seatsTotal: 16, seatsAvailable: 16, status: "open" },
      { startDate: "2026-08-14", endDate: "2026-08-18", seatsTotal: 16, seatsAvailable: 16, status: "open" },
      { startDate: "2026-08-21", endDate: "2026-08-25", seatsTotal: 16, seatsAvailable: 16, status: "open" },
      { startDate: "2026-08-28", endDate: "2026-09-01", seatsTotal: 16, seatsAvailable: 16, status: "open" },
    ],
    thingsToExperience: [
      { tag: "Culture", title: "Dalai Lama Temple", description: "Visit the spiritual heart of the Tibetan community in exile.", href: "#itinerary" },
      { tag: "Nature", title: "Bhagsu Waterfall", description: "A short, popular hike to McLeodganj's most iconic waterfall.", href: "#itinerary" },
      { tag: "Views", title: "Naddi View Point", description: "Panoramic Dhauladhar range views over Naddi village.", href: "#itinerary" },
    ],
    // TODO: placeholder facts
    didYouKnow: [
      { icon: "Globe2", title: "Home of the Dalai Lama", description: "McLeodganj has served as the residence of the 14th Dalai Lama and the Tibetan government-in-exile since 1960.", href: "#" },
      { icon: "Sparkles", title: "Little Lhasa", description: "McLeodganj is often called 'Little Lhasa' for its strong Tibetan culture and cuisine.", href: "#" },
    ],
    faqs: [
      { question: "Is this a stranger/solo-friendly trip?", answer: "Yes, it's designed as a group trip for solo travellers — you'll be grouped with other like-minded travellers." },
      { question: "Is the Triund trek included?", answer: "No, Triund trek charges are excluded and it's entirely optional — you can also just relax in McLeodganj instead." },
    ],
  },

  // ---------------------------------------------------------------------
  // 3. UDAIPUR + MOUNT ABU + KUMBHALGARH ROYAL TRIP
  // ---------------------------------------------------------------------
  {
    slug: "udaipur-mount-abu-kumbhalgarh-royal-trip",
    status: "draft",
    title: "Udaipur + Mount Abu + Kumbhalgarh Royal Trip",
    shortDescription:
      "One trip, three destinations — the City of Lakes, Rajasthan's only hill station, and the world's second-longest fort wall.",
    location: "Udaipur, Mount Abu & Kumbhalgarh, Rajasthan",
    durationLabel: "4N / 5D",
    groupSizeLabel: "Every batch — see dates below",
    bookHref: "/trips/udaipur-mount-abu-kumbhalgarh-royal-trip/book",
    leadFormDestination: "Udaipur",
    quickLinks: [
      { icon: "MapPin", label: "Location", href: "#location", order: 1 },
      { icon: "Calendar", label: "Batch Dates", href: "#batches", order: 2 },
      { icon: "Hotel", label: "Stay", href: "#stay", order: 3 },
      { icon: "Utensils", label: "Meals", href: "#inclusions", order: 4 },
    ],
    gallery: [],
    hotelTiers: [{ stars: 3, label: "Udaipur Hotel Stay", description: "2 nights of comfortable hotel stay in Udaipur." }],
    itinerary: [
      {
        day: 1,
        title: "Delhi ➜ Udaipur",
        location: "Delhi",
        description: "9:00 PM pickup from Delhi. Overnight journey to Udaipur by Volvo 40-seater.",
      },
      {
        day: 2,
        title: "Udaipur Highlights — City of Lakes",
        location: "Udaipur",
        description:
          "Morning arrival and hotel check-in. Sightseeing covers Saheliyon Ki Bari (the royal garden of Mewar queens), the Under the Sun Aquarium (India's first aquarium), the Maharana Pratap Memorial, and Fateh Sagar Lake (boating on own cost). Evening at Fateh Sagar Market, a popular sunset viewpoint with shopping. Dinner and overnight stay in Udaipur.",
      },
      {
        day: 3,
        title: "Mount Abu + Kumbhalgarh Highlights",
        location: "Mount Abu & Kumbhalgarh, Rajasthan",
        description:
          "After breakfast, drive to Mount Abu — Rajasthan's only hill station — to see Nakki Lake (boating/ropeway on own cost), the Dilwara Jain Temple famed for its marble carving, Toad Rock viewpoint, and Mall Road for shopping and street food. Continue to Kumbhalgarh Fort to walk part of its 36 km wall (the world's second-longest after the Great Wall of China) and visit the Neelkanth Mahadev Temple inside the fort. Return to Udaipur for dinner and overnight stay.",
      },
      {
        day: 4,
        title: "Udaipur Royal Highlights + Departure",
        location: "Udaipur",
        description:
          "After breakfast, visit the City Palace (heart of the Mewar kingdom), take a Lake Pichola boat ride with views of Jag Mandir, and see the Jagdish Temple, Gangaur Ghat, Ambrai Ghat, and the Karni Mata Ropeway for city views. Depart for Delhi in the evening by overnight Volvo.",
      },
      {
        day: 5,
        title: "Arrival in Delhi",
        location: "Delhi",
        description: "Morning arrival in Delhi. Trip ends.",
      },
    ],
    inclusions: [
      "Both-side Volvo 40-seater (Delhi ↔ Udaipur)",
      "2 Nights Hotel Stay in Udaipur",
      "2 Breakfasts + 2 Dinners",
      "Complete Sightseeing — Udaipur, Mount Abu & Kumbhalgarh",
      "Pool Party, Rain Dance & Fun Activities",
      "Trip Captain throughout the journey",
    ],
    exclusions: ["Lunch", "Entry Tickets", "Boat Ride", "Ropeway", "5% GST"],
    price: { basePrice: 6999, bookingAmount: 2500 },
    pickupVariants: [{ city: "Delhi", note: "Volvo 40-seater, both-side pickup and drop" }],
    batchDates: [
      { startDate: "2026-08-07", endDate: "2026-08-11", seatsTotal: 40, seatsAvailable: 40, status: "open" },
      { startDate: "2026-08-14", endDate: "2026-08-18", seatsTotal: 40, seatsAvailable: 40, status: "open" },
      { startDate: "2026-08-21", endDate: "2026-08-25", seatsTotal: 40, seatsAvailable: 40, status: "open" },
      { startDate: "2026-08-28", endDate: "2026-09-01", seatsTotal: 40, seatsAvailable: 40, status: "open" },
    ],
    thingsToExperience: [
      { tag: "Heritage", title: "City Palace, Udaipur", description: "Explore the grand seat of the Mewar dynasty overlooking Lake Pichola.", href: "#itinerary" },
      { tag: "Heritage", title: "Kumbhalgarh Fort", description: "Walk along the world's second-longest continuous wall.", href: "#itinerary" },
      { tag: "Nature", title: "Mount Abu", description: "Rajasthan's only hill station, with Nakki Lake and Dilwara's marble temples.", href: "#itinerary" },
    ],
    didYouKnow: [
      { icon: "Globe2", title: "Venice of the East", description: "Udaipur is often nicknamed the 'Venice of the East' for its network of lakes and palaces.", href: "#" },
      { icon: "Sparkles", title: "Second-Longest Wall on Earth", description: "Kumbhalgarh Fort's wall stretches roughly 36 km, second in length only to the Great Wall of China.", href: "#" },
    ],
    faqs: [
      { question: "Is this trip suitable for families?", answer: "Yes, the itinerary is a mix of sightseeing and leisure that works well for both groups and families." },
      { question: "Are boat rides and ropeway tickets included?", answer: "No, boat rides at Fateh Sagar/Pichola and the Mount Abu ropeway are at your own cost." },
    ],
  },

  // ---------------------------------------------------------------------
  // 4. MANALI – KASOL PREMIUM GROUP TOUR
  // (Two copies of this itinerary were shared with identical content — only
  // one Trip 2.0 page was created from it. If you actually meant two
  // different variants, duplicate this doc from /admin/trip2 and adjust.)
  // ---------------------------------------------------------------------
  {
    slug: "manali-kasol-premium-group-tour",
    status: "draft",
    title: "Manali – Kasol Premium Group Tour",
    shortDescription:
      "Temples, waterfalls, Solang Valley, the Atal Tunnel, and a stop in Kasol by the Parvati River — a full Himachal circuit.",
    location: "Manali & Kasol, Himachal Pradesh",
    durationLabel: "4N / 5D",
    groupSizeLabel: "Pickup & Drop: Delhi — Group Tour",
    bookHref: "/trips/manali-kasol-premium-group-tour/book",
    leadFormDestination: "Manali",
    quickLinks: [
      { icon: "MapPin", label: "Location", href: "#location", order: 1 },
      { icon: "Calendar", label: "Batch Dates", href: "#batches", order: 2 },
      { icon: "Hotel", label: "Stay", href: "#stay", order: 3 },
      { icon: "Utensils", label: "Meals", href: "#inclusions", order: 4 },
    ],
    gallery: [],
    hotelTiers: [
      { stars: 3, label: "Manali Stay", description: "2 nights of stay in Manali." },
      { stars: 3, label: "Kasol Stay", description: "1 night of stay in Kasol, by the Parvati River." },
    ],
    itinerary: [
      {
        day: 1,
        title: "Delhi ➜ Manali",
        location: "Delhi",
        description: "7:00 PM pickup from Delhi. Meet the Trip Captain and board the traveller for the overnight journey towards Manali.",
      },
      {
        day: 2,
        title: "Arrival in Manali | Local Sightseeing",
        location: "Manali",
        description:
          "9:00 AM arrival, hotel check-in and breakfast. Visit Hadimba Devi Temple, the Tibetan Monastery, Vashisht Temple, Jogini Waterfall, and Mall Road. Music night and bonfire in the evening, followed by dinner and overnight stay in Manali.",
      },
      {
        day: 3,
        title: "Solang Valley – Atal Tunnel – Sissu",
        location: "Solang Valley & Sissu, Himachal Pradesh",
        description:
          "After breakfast, visit Solang Valley, the Atal Tunnel, and Sissu village (adventure activities optional and chargeable). Return to Manali by evening for music night, bonfire, dinner, and overnight stay.",
      },
      {
        day: 4,
        title: "Manali ➜ Kullu ➜ Manikaran ➜ Kasol",
        location: "Kullu, Manikaran & Kasol, Himachal Pradesh",
        description:
          "After breakfast and check-out, en route visits include the Kullu Shawl Factory, Rudra Mahadev Temple, Manikaran Sahib Gurudwara, and its hot water springs. Reach Kasol by evening to explore the market and Parvati River. Dinner and overnight stay in Kasol.",
      },
      {
        day: 5,
        title: "Kasol ➜ Delhi",
        location: "Kasol",
        description: "After breakfast and check-out, free time for café hopping or shopping in Kasol before the overnight return journey to Delhi begins.",
      },
      {
        day: 6,
        title: "Arrival in Delhi",
        location: "Delhi",
        description: "Reach Delhi in the morning with unforgettable memories. Tour ends.",
      },
    ],
    inclusions: [
      "Pickup & Drop from Delhi",
      "2 Nights Stay in Manali",
      "1 Night Stay in Kasol",
      "3 Breakfasts",
      "3 Dinners",
      "Manali Local Sightseeing",
      "Solang Valley, Atal Tunnel & Sissu Excursion",
      "Kullu, Manikaran & Kasol Sightseeing",
      "Music Night",
      "Bonfire",
      "Trip Captain",
      "All Toll Tax, Parking & Driver Charges",
    ],
    exclusions: ["Adventure Activities", "Lunch", "Personal Expenses", "Entry Tickets (if applicable)", "Anything not mentioned under Inclusions"],
    price: { basePrice: 6999, bookingAmount: 2499 },
    pickupVariants: [{ city: "Delhi", note: "Pickup & drop point shared closer to the departure date" }],
    // TODO: no cadence or exact dates were given for this trip — add real
    // batch dates from /admin/trip2 before publishing.
    batchDates: [],
    thingsToExperience: [
      { tag: "Culture", title: "Hadimba Devi Temple", description: "A centuries-old wooden temple set inside a cedar forest.", href: "#itinerary" },
      { tag: "Adventure", title: "Solang Valley & Atal Tunnel", description: "Scenic valley views and a drive through one of the world's longest highway tunnels.", href: "#itinerary" },
      { tag: "Riverside", title: "Kasol & Parvati River", description: "A laid-back riverside town known for its cafés and Israeli-influenced food scene.", href: "#itinerary" },
    ],
    didYouKnow: [
      { icon: "Globe2", title: "Backpacker Capital of Himachal", description: "Kasol is one of India's most popular backpacker hubs, especially along the Parvati Valley trail.", href: "#" },
      { icon: "Sparkles", title: "Atal Tunnel", description: "The Atal Tunnel is one of the world's longest highway tunnels above 10,000 feet, cutting travel time to Lahaul-Spiti significantly.", href: "#" },
    ],
    faqs: [
      { question: "Is Kasol included in the base package?", answer: "Yes, 1 night in Kasol is included along with 2 nights in Manali." },
      { question: "Are adventure activities at Solang Valley included?", answer: "No, adventure activities are optional and payable directly at the venue." },
    ],
  },
];

async function main() {
  await connect("seed-trip2-batch");

  let created = 0;
  let updated = 0;

  for (const trip of trips) {
    const slug = trip.slug as string;
    const existing = await Trip2Model.findOne({ slug }).lean();
    await Trip2Model.findOneAndUpdate({ slug }, trip, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (existing) updated++;
    else created++;
    console.log(`[seed-trip2-batch] ${existing ? "Updated" : "Created"}: ${slug}`);
  }

  console.log(`\n[seed-trip2-batch] Done — created: ${created}, updated: ${updated}, total: ${trips.length}`);
  await disconnect();
}

main().catch((err) => {
  console.error("[seed-trip2-batch] Failed:", err);
  process.exit(1);
});
