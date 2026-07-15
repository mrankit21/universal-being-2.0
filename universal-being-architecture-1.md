# Universal Being — Platform Architecture Blueprint

Stack: Next.js 15 (App Router) · TypeScript · React 19 · Tailwind CSS v4 · shadcn/ui · Framer Motion · Node.js/Express · MongoDB · Cloudinary · Razorpay · React Hook Form + Zod

Core law: **UI never hardcodes trips, themes, galleries, itineraries, or pricing. Everything renders from data. Adding a trip = adding data, zero UI changes.**

---

## 1. Folder Structure

```
universal-being/
├── apps/
│   ├── web/                          # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   │   ├── page.tsx                    # Home
│   │   │   │   ├── about/page.tsx
│   │   │   │   ├── contact/page.tsx
│   │   │   ├── trips/
│   │   │   │   ├── page.tsx                    # All trips (filterable listing)
│   │   │   │   ├── [category]/page.tsx         # e.g. /trips/rajasthan
│   │   │   │   └── [category]/[slug]/
│   │   │   │       ├── page.tsx                # Single trip detail (fully dynamic)
│   │   │   │       └── itinerary/page.tsx      # Optional deep-link itinerary view
│   │   │   ├── booking/
│   │   │   │   ├── [tripId]/page.tsx           # Booking flow entry
│   │   │   │   ├── [tripId]/details/page.tsx
│   │   │   │   ├── [tripId]/payment/page.tsx
│   │   │   │   └── confirmation/[bookingId]/page.tsx
│   │   │   ├── account/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── bookings/page.tsx
│   │   │   │   └── wishlist/page.tsx
│   │   │   ├── admin/                          # Route-group, gated
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                    # Dashboard
│   │   │   │   ├── trips/page.tsx
│   │   │   │   ├── trips/[id]/edit/page.tsx
│   │   │   │   ├── trips/new/page.tsx
│   │   │   │   ├── bookings/page.tsx
│   │   │   │   ├── themes/page.tsx
│   │   │   │   └── media/page.tsx
│   │   │   ├── api/                            # Next Route Handlers (BFF layer only)
│   │   │   │   ├── revalidate/route.ts
│   │   │   │   └── razorpay/webhook/route.ts
│   │   │   ├── layout.tsx                      # Root layout + ThemeProvider
│   │   │   ├── globals.css
│   │   │   └── not-found.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                             # shadcn primitives (button, dialog, sheet…)
│   │   │   ├── primitives/                     # Custom atoms built on shadcn (Badge, Price, Rating)
│   │   │   ├── layout/                         # Header, Footer, MobileNav, StickyBookingBar
│   │   │   ├── trip/                           # TripCard, TripHero, TripGallery, TripItinerary…
│   │   │   ├── theme/                          # ThemeBackground, ParticleField, SeasonalOverlay
│   │   │   ├── booking/                        # BookingForm, TravelerForm, PaymentSummary
│   │   │   ├── sections/                       # Homepage sections (FeaturedTrips, Testimonials)
│   │   │   ├── animation/                      # RevealOnScroll, ParallaxLayer, SwipeCarousel
│   │   │   └── admin/                          # AdminTable, TripEditor, MediaUploader
│   │   │
│   │   ├── lib/
│   │   │   ├── api/                            # fetch wrappers per resource (trips.ts, bookings.ts)
│   │   │   ├── theme/                          # theme-engine.ts, theme-resolver.ts
│   │   │   ├── razorpay/                       # client + server helpers
│   │   │   ├── cloudinary/                     # upload + transform helpers
│   │   │   ├── validators/                     # zod schemas (shared with backend via types package)
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-theme.ts
│   │   │   ├── use-swipe.ts
│   │   │   ├── use-trip-data.ts
│   │   │   └── use-booking-flow.ts
│   │   │
│   │   ├── types/
│   │   │   ├── trip.ts
│   │   │   ├── theme.ts
│   │   │   ├── booking.ts
│   │   │   └── user.ts
│   │   │
│   │   ├── data/
│   │   │   ├── themes/                         # theme config JSON/TS (rajasthan.ts, winter.ts…)
│   │   │   └── seed/                           # local dev seed data (mirrors DB shape)
│   │   │
│   │   ├── styles/
│   │   │   └── themes.css                      # CSS variable sets per theme
│   │   │
│   │   └── public/
│   │       └── illustrations/                  # static SVG motif sets (camel, snowflake, wave…)
│   │
│   └── server/                       # Node.js/Express backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── trips/            # controller, service, model, routes
│       │   │   ├── themes/
│       │   │   ├── bookings/
│       │   │   ├── payments/         # Razorpay order/verify/webhook
│       │   │   ├── media/            # Cloudinary signed upload
│       │   │   ├── users/
│       │   │   └── admin/
│       │   ├── middleware/           # auth, error-handler, rate-limit
│       │   ├── config/               # db.ts, cloudinary.ts, razorpay.ts
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── types/                        # shared TS types + zod schemas (frontend + backend)
│   └── config/                       # shared eslint/tsconfig/tailwind config
│
└── turbo.json / pnpm-workspace.yaml  # monorepo wiring
```

Why a monorepo shape now: you already run two codebases in spirit (Next frontend, Express backend). A `packages/types` shared package kills schema drift between frontend zod validators and backend Mongoose models — one Trip type, everywhere.

---

## 2. Component Architecture

Layered, strictly one-directional dependency (lower layers never import higher ones):

1. **ui/** — raw shadcn primitives, unmodified except theming tokens.
2. **primitives/** — small custom atoms composed from `ui/` (PriceTag, RatingStars, DurationBadge, ThemeChip). No business logic.
3. **trip/** — domain components consuming `Trip` type only, never a hardcoded trip:
   - `TripCard` (grid/list item)
   - `TripHero` (banner + title + theme background slot)
   - `TripGallery` (swipeable, Cloudinary-driven)
   - `TripItinerary` (renders `itinerary[]` — day accordion / swipe-through on mobile)
   - `TripInclusions`, `TripPricingTable`, `TripReviews`, `TripFAQ`
   - `TripHighlights`, `TripMap`
4. **theme/** — purely presentational, driven by active `ThemeConfig`:
   - `ThemeBackground` (gradient/particles/illustration layer)
   - `ParticleField` (generic particle engine, config-driven: snow, gold dust, rain)
   - `SeasonalOverlay` (fog, waves, pine silhouettes — all SVG motif swaps, not separate components)
5. **booking/** — form + payment flow components, all schema-driven via Zod + RHF.
6. **sections/** — homepage/marketing composition blocks built from `trip/` + `theme/` components. This is the ONLY layer allowed to compose multiple domains together.
7. **layout/** — Header, Footer, MobileNav, StickyBookingBar — global chrome.
8. **animation/** — motion wrappers (`RevealOnScroll`, `ParallaxLayer`, `SwipeCarousel`, `StaggerList`) that any layer can use as a wrapper, never contain domain logic themselves.

**Rule:** A component either renders data it receives as props, or it renders global theme/layout state. It never fetches its own trip data (data fetching lives in route Server Components / lib/api). This keeps every trip/theme/booking component 100% reusable and testable in isolation (Storybook-ready later).

---

## 3. Data Architecture

Single source of truth: MongoDB, accessed only through the Express API. Next.js fetches via `lib/api/*` — never talks to MongoDB directly.

**Trip document (core model):**
```
Trip {
  _id, slug, title, category (rajasthan | winter | monsoon | beach | ...),
  themeKey: string            // FK into theme config, not hardcoded per trip
  shortDescription, longDescription,
  heroImage: CloudinaryAsset,
  gallery: CloudinaryAsset[],
  duration: { days, nights },
  difficulty, groupSize: { min, max },
  price: { base, currency, discounts[] },
  itinerary: DayPlan[],        // [{ day, title, description, activities[], meals[], stay }]
  inclusions: string[],
  exclusions: string[],
  highlights: string[],
  departureDates: DateSlot[],  // [{ date, seatsAvailable, priceOverride? }]
  faqs: { q, a }[],
  reviews: ReviewRef[],
  status: draft | published | archived,
  seo: { title, description, ogImage },
  createdAt, updatedAt
}
```

**CloudinaryAsset:** `{ publicId, url, width, height, blurHash }` — never a raw string URL, so the frontend can always request theme-aware transforms (crop, format, quality) on demand.

**Design principle:** the *shape* of Trip is fixed and generic enough to describe a desert trip, a beach trip, or a Himalayan trek without new fields. Category-specific flavor comes entirely from `themeKey`, not from schema branching.

Data flow: MongoDB → Express REST (`/api/trips`, `/api/trips/:slug`) → `lib/api/trips.ts` (typed fetch, cached) → Server Component → props down through component layers. No client-side trip fetching except for admin live-preview.

---

## 4. Theme Architecture

Theme is a **config object**, not a component tree. One `ThemeConfig` per mood (Rajasthan, Winter, Monsoon, Beach, + future ones), stored in `data/themes/*.ts` and mirrored in DB (`Theme` collection) so admins can tune it without a deploy.

```
ThemeConfig {
  key: "rajasthan" | "winter" | "monsoon" | "beach" | ...
  palette: { primary, secondary, accent, background, gradient[] }
  particle: { type: "gold-dust" | "snow" | "rain" | "none", density, speed }
  motifs: { illustrationSet: "camel" | "pine" | "palm" | "hawa-mahal", position[] }
  overlay: { fog: boolean, waves: boolean }
  typographyMood: "warm" | "cool" | "airy"
  darkModeDefault: boolean
}
```

- `ThemeProvider` (root layout) reads the active trip's `themeKey`, resolves the matching `ThemeConfig`, and injects CSS variables (`--color-primary`, `--gradient-bg`, etc.) into `styles/themes.css` scope — no per-component theme conditionals.
- `ParticleField` and `SeasonalOverlay` are the *only* components that read `particle`/`overlay` — everything else just consumes CSS variables and looks correct automatically.
- Homepage theme = theme of the currently featured/hero trip (editorially chosen in admin), falling back to a neutral "brand" theme when no trip is featured.
- Adding a new mood (say "Hill Station") = one new `ThemeConfig` + one illustration set. Zero component changes.

---

## 5. Trip Architecture

- Routing: `/trips/[category]/[slug]` — category is denormalized onto the Trip doc for clean URLs and static generation grouping.
- Rendering strategy: `generateStaticParams` for published trips → ISR (`revalidate` on-demand via `/api/revalidate` webhook triggered by admin publish action). New trip goes live without a redeploy.
- `TripDetailPage` (Server Component) fetches one Trip, resolves its `ThemeConfig`, and passes both down — everything below is presentational.
- Itinerary rendering: `itinerary: DayPlan[]` drives `TripItinerary`, which switches internally between an accordion (desktop) and a swipeable day-by-day carousel (mobile) — same data, two presentations, one component.
- Pricing: computed client-side from `price.base` + active `departureDates[].priceOverride` + selected traveler count — never a separate hardcoded price block per trip.
- Related trips / "you might also like": server-computed by category + tags, not manually curated per page.

---

## 6. Booking Architecture

Flow: `Trip select → Traveler details (RHF+Zod) → Review & addons → Razorpay payment → Confirmation`

- All step forms share one `BookingContext` (React context + `useBookingFlow` hook) holding a single Zod-validated `BookingDraft` object — no step re-fetches or duplicates state.
- Validation: one Zod schema per step, composed into a full `BookingSchema` for final submit; shared with backend via `packages/types` so server-side validation is identical, not re-implemented.
- Payment:
  1. Client calls Express `/api/bookings/:id/order` → creates Razorpay order server-side.
  2. Razorpay Checkout opens client-side with that order.
  3. On success, client sends payment signature to `/api/payments/verify`.
  4. Server verifies signature, marks booking `confirmed`, decrements `departureDates[].seatsAvailable` atomically.
  5. Razorpay webhook (`/api/razorpay/webhook`) is the source of truth of last resort for async/failed events — client-side confirmation is optimistic only.
- Mobile: sticky bottom `StickyBookingBar` (price + "Book Now") persists across scroll on trip detail; booking flow itself is a full-screen step sheet (shadcn `Sheet`/`Drawer`) with swipe-back gesture, not a traditional multi-page checkout.

---

## 7. Admin Architecture

- Gated route group `app/admin`, protected by middleware checking a role claim (JWT from Express auth).
- `TripEditor`: single reusable form (RHF + Zod) that handles both create and edit — no separate "new trip" vs "edit trip" components.
- Media: `MediaUploader` posts directly to Cloudinary via signed upload params issued by Express (`/api/media/sign`) — binary never touches the Node server, keeping it fast and cheap.
- Theme tuning: `admin/themes` lets non-devs adjust palette/particle density per `ThemeConfig` and preview live against a sample trip before publish.
- Publish action triggers ISR revalidation (`/api/revalidate`) for that trip's route — this is how "add data only, no redeploy" is actually guaranteed.
- `AdminTable`: one generic data-table component (search/sort/paginate) reused for trips, bookings, and users — driven by column config, not rebuilt per resource.

---

## 8. Animation Architecture

Principle: **motion communicates state or guides attention — nothing moves without a reason.**

- All motion routed through `components/animation/*` wrappers so effects are swappable and centrally tunable (one place to kill/adjust global motion).
- `RevealOnScroll` — fade/slide-in on viewport entry, used for section-level reveals only (not per individual card, to avoid staggered-clutter fatigue).
- `ParallaxLayer` — subtle depth on hero imagery only (trip hero, homepage hero).
- `SwipeCarousel` — drives gallery, itinerary-mobile, and testimonials; built once on Framer Motion's drag gestures, reused everywhere swiping is needed.
- `ParticleField` — theme-driven ambient motion (snow/gold-dust/rain), capped density, `prefers-reduced-motion` aware, pauses when off-screen (IntersectionObserver) to protect scroll performance.
- Page transitions: minimal, directional (forward = slide left, back = slide right) to reinforce the app-like feel — not full-page fades.
- Explicitly banned: decorative floating shapes with no informational purpose, infinite background loops unrelated to theme, animation on every single list item on scroll.
- Performance rule: transforms/opacity only (GPU-composited), no animating layout properties (width/height/top/left); all particle/parallax effects respect `prefers-reduced-motion` and mobile battery constraints (density auto-reduced on low-end/mobile viewport).

---

## 9. Naming Conventions

- Files: `kebab-case.tsx` (e.g. `trip-gallery.tsx`); component export name in `PascalCase` matching filename intent (`TripGallery`).
- Hooks: `use-*.ts`, exporting `useCamelCase` function.
- Types: singular PascalCase (`Trip`, `ThemeConfig`, `BookingDraft`), collections as `Trip[]`.
- Zod schemas: `xSchema` (e.g. `tripSchema`), inferred type as `TypeOf<typeof tripSchema>` re-exported as `Trip` where relevant to avoid drift.
- API routes (Express): REST-plural, resource-first — `/api/trips`, `/api/trips/:slug`, `/api/bookings/:id/verify`.
- CSS variables: `--ub-color-primary`, `--ub-gradient-hero` (namespaced `ub` = Universal Being, prevents collision with shadcn tokens).
- Theme keys: lowercase-kebab (`rajasthan`, `winter`, `monsoon`, `beach`, `hill-station`).

---

## 10. Best Practices

- Server Components by default; `"use client"` only where interaction/state/motion demands it (galleries, forms, particle fields, booking flow).
- Data fetching lives in route files (`page.tsx`) or `lib/api/*` — components stay pure/presentational, which is what makes them reusable.
- Every trip-shaped UI element takes a `trip: Trip` prop; every theme-shaped element takes a `theme: ThemeConfig` prop — never inline conditionals like `if (category === "rajasthan")` inside components.
- Shared Zod schemas (`packages/types`) eliminate frontend/backend validation drift.
- Images always through Cloudinary transform URLs (responsive `srcset`, `blurHash` placeholder) — never raw `<img>` with static sizes.
- Accessibility: swipeable galleries/itineraries also keyboard- and screen-reader-navigable (not gesture-only).
- Error/loading states: one shared `Skeleton` set and `ErrorBoundary` per domain (trip, booking) rather than ad hoc per page.

---

## 11. Scalability Strategy

- **Content scale:** ISR + on-demand revalidation means thousands of trip pages stay static-fast without redeploys; MongoDB indexes on `slug`, `category`, `status`, `themeKey`.
- **Traffic scale:** static/ISR pages absorb marketing traffic; only booking/payment paths hit the Node API live — natural read/write split.
- **Team scale:** monorepo + shared types package lets frontend and backend evolve without silently breaking each other; admin lets non-engineers (you, later ops hires) add trips without touching code.
- **Theme scale:** new destination moods are additive config, not new component trees — theming cost stays flat as trip catalog grows.
- **Media scale:** Cloudinary handles transform/CDN delivery, so image-heavy galleries don't touch your own bandwidth/storage growth.

---

## 12. Future Expansion Strategy

- Multi-currency / multi-language: `price.currency` and an `i18n` layer are natural next additions since nothing is hardcoded to INR or English today.
- Reviews/UGC: `ReviewRef[]` already isolated so a review-submission module can bolt on without touching Trip schema.
- Group/custom trip requests: can reuse `BookingContext` pattern with a different final-step schema.
- Loyalty/referrals: additive `User` module, doesn't touch Trip/Theme/Booking core.
- Native app: because mobile web is already gesture-driven and component layers are pure/data-in, a React Native (or Capacitor wrapper) reuse of `types/`, `lib/api`, and business logic is realistic later without a rewrite.
- Personalized theme: `themeKey` resolution could later factor in user preference/location instead of only the featured trip — the engine already supports arbitrary resolution logic, only the resolver function changes.

---

## 13. Image Architecture

Principle: **components never know an image's URL, path, or provider — they only know an `ImageAsset` object and a `variant`.**

**Provider-agnostic asset shape** (stored on Trip/Theme/Hotel docs, not inline in code):
```
ImageAsset {
  provider: "cloudinary"      // swappable later without touching UI
  publicId: string
  url: string                 // canonical fallback
  alt: string
  width, height: number
  blurHash: string            // placeholder while loading
  focalPoint?: { x, y }       // for smart-crop control on hero/cover
}
```

**Where images live on the Trip document** — every slot is a typed field, never a bare string:
```
Trip {
  ...
  heroImage: ImageAsset          // top of trip detail, full-bleed
  coverImage: ImageAsset         // used on TripCard / listing grids
  thumbnail: ImageAsset          // small contexts: related trips, search results
  gallery: ImageAsset[]          // TripGallery swipe deck
  seo: {
    ogImage?: ImageAsset         // explicit override; falls back to heroImage if unset
  }
}
```

**Single resolver, single render path:**
- `lib/cloudinary/resolve-image.ts` — pure function: `resolveImage(asset: ImageAsset, variant: ImageVariant): { src, srcSet, blurDataURL }`. This is the *only* place that knows how to build a Cloudinary transform URL (crop, quality, format, dpr). If the provider ever changes, this file is the only thing that changes.
- `ImageVariant` presets defined once (`hero`, `cover`, `thumbnail`, `gallery`, `og`) — each preset is `{ aspectRatio, crop, quality, sizes }`. New use case = new preset, never a new component.
- `<UbImage asset={trip.heroImage} variant="hero" />` — one primitive component (wraps `next/image`) used everywhere an image renders: `TripHero`, `TripCard`, `TripGallery`, admin previews. It calls the resolver internally; the calling component never touches Cloudinary syntax.
- OG image generation: `generateMetadata` on the trip page calls `resolveImage(trip.seo.ogImage ?? trip.heroImage, "og")` — no hardcoded per-page meta image, ever.

**Hard rule enforced by this pattern:** grep the codebase for `res.cloudinary.com` or any raw image path outside `lib/cloudinary/` — if it appears in a component file, that's a violation. `/public` holds only truly static brand assets (logo, theme illustration SVGs) — zero trip imagery lives locally, even in dev (seed data points at real Cloudinary URLs so dev and prod behave identically).

---

## 14. Content Architecture (CMS-Ready)

Principle: **if a field can change per trip, it's a database field with an admin editor — never JSX.**

**Full editable surface**, each mapped to a tab in `TripEditor`:

| Tab | Backing sub-schema | Editor pattern |
|---|---|---|
| Basic Info | title, slug, category, themeKey, description | Standard RHF+Zod form |
| Itinerary | `DayPlan[]` | Generic `ArrayFieldEditor` (repeatable day blocks) |
| Pricing & Departures | `price`, `DepartureDate[]` | `ArrayFieldEditor` + calendar picker for dates/seats |
| Inclusions / Exclusions | `string[]` each | `ArrayFieldEditor` (simple list mode) |
| FAQs | `{ q, a }[]` | `ArrayFieldEditor` (paired-field mode) |
| Hotels / Stay | references into `Hotel` collection | Typeahead picker + "manage hotels" link-out |
| Gallery | `ImageAsset[]` | Drag-reorder grid, uploads via Cloudinary signed URL |
| SEO | title, description, ogImage, canonical | Standard form, live meta preview |

**One repeater, not five:** itinerary days, FAQs, inclusions, exclusions, gallery order, and departure dates all reuse the same `ArrayFieldEditor` component, configured per field (add/remove/reorder), rather than five bespoke list-editing UIs. This is the same "reusable, data-driven" rule from the component architecture applied to the admin side.

**Hotels are their own collection**, not embedded per trip:
```
Hotel { _id, name, location, rating, images: ImageAsset[], amenities[] }
```
`DayPlan.stay` stores a `hotelId` reference — the same hotel (e.g. a Jaisalmer desert camp) can be reused across multiple trip itineraries without duplication, and updating it once updates every itinerary that references it.

**Rich text fields** (long description, day-by-day narrative): stored as sanitized HTML/JSON (e.g. via Tiptap), rendered through a single `<RichText />` component — no scattered `dangerouslySetInnerHTML`, no per-field custom renderers.

**Workflow, not just fields:**
- `status: draft | published | archived` — drafts are editable and previewable (signed preview URL) without being publicly live.
- Publish action → triggers `/api/revalidate` for that trip's static route → live instantly, no redeploy.
- `updatedAt` / `updatedBy` on every document from day one, so a full revision-history feature can be added later without a schema migration.

**End state:** a non-developer can create a brand-new trip — hero image, gallery, full day-by-day itinerary, pricing tiers, departure calendar, hotels, FAQs, SEO — entirely inside `/admin`, hit Publish, and it appears on the live site. No PR, no deploy, no component touched.

---

**Next step (when ready to build):** Phase 1 = `types/` + `lib/api` + `ThemeProvider` + `TripCard`/`TripHero` against seed data, before touching booking or admin. This validates the reusability contract early, cheaply.
