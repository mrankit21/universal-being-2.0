# Universal Being — Design System (Phase 2)

Locked against the approved Architecture Blueprint. This phase ships reusable
UI only — no pages, no homepage, no trip pages, no booking flow.

## Token reference

All tokens live in `app/globals.css` (`--ub-*` custom properties) and are
exposed as Tailwind utilities via the v4 `@theme inline` block. Never write a
raw hex, px, or ms value in a component — always reach for a token/utility.

| System | Source | Tailwind usage |
|---|---|---|
| Color | `--ub-color-*` → semantic `--primary`, `--background`, etc. | `bg-primary`, `text-ub-brass-500` |
| Typography | `--ub-font-display` / `--ub-font-sans`, `--ub-text-*` | `font-display`, `text-2xl` |
| Spacing | Tailwind default 4px scale + `--ub-space-section-*` | `p-4`, `py-section-md` |
| Radius | `--ub-radius-*` → `--radius` | `rounded-md`, `rounded-ub-full` |
| Shadow | `--ub-shadow-*` | `shadow-ub-sm` … `shadow-ub-xl` |
| Motion | `--ub-duration-*`, `--ub-ease-*` (CSS) / `lib/motion-tokens.ts` (JS) | `duration-ub-base`, `motion-tokens.ease.emphasized` |

Dark mode: toggle the `.dark` class on `<html>`; every semantic variable is
redefined there, components need zero dark-mode-specific code.

## Typography system

- **Display** (`font-display`, Fraunces): trip titles, section headings only.
  Used with restraint — never for body copy or UI chrome.
- **Sans** (`font-sans`, Inter): everything else — nav, buttons, forms, body.
- Scale: `text-xs` (12px) → `text-6xl` (60px), each with a paired line-height
  token. Section headings default to `text-3xl`/`text-4xl`; body copy stays
  at `text-base`/`text-lg`.

## Color tokens

- **Neutral** — warm stone scale (`ub-stone-50…900`) for surfaces and text;
  **ink** (`ub-ink-700…900`) for dark-mode surfaces.
- **Brass** (`ub-brass-300…700`) — primary accent, the brand's signature
  warm gold. Used for primary buttons, active states, ratings.
- **Teal** (`ub-teal-400…600`) — secondary accent, used sparingly (links,
  secondary actions) as contrast against brass.
- **Feedback** — `success`, `warning`, `destructive`, `info`, always via the
  semantic name, never the raw hex.

## Icon guidelines

- Library: `lucide-react` exclusively — no mixed icon sets.
- Default `strokeWidth={1.75}` (matches the brand's refined, non-bold line
  weight); use `2.5` only for small glyphs inside checkboxes/checks where
  legibility at tiny sizes needs it.
- Size via Tailwind `size-*` utilities mapped to text context: `size-3.5`
  next to `text-xs`/`text-sm`, `size-4` next to `text-sm`/`text-base`,
  `size-5`+ for standalone/empty-state icons.
- Icons always inherit `currentColor` — never hardcode an icon fill/stroke
  color; color the wrapping text element instead.
- Every icon-only control has an explicit `aria-label`; decorative icons
  next to text get `aria-hidden="true"`.

## Motion principles (see also Architecture §8)

- Only `transform`/`opacity` animate — no layout-property animation.
- Every `motion`-driven component respects `prefers-reduced-motion` (handled
  globally in `globals.css` for CSS transitions; Framer Motion components
  should check `useReducedMotion()` where they add ambient/looping motion).
- Standard durations: `fast` (150ms) for hover/press feedback, `base`
  (250ms) for most transitions, `slow` (400ms) for image fades/reveals.

## Component inventory (this phase)

**`components/ui`** (shadcn primitives, token-wired): Button, Input,
Textarea, Label, Select, Checkbox, RadioGroup, Switch, Badge, Avatar, Card,
Separator, Skeleton, Dialog, Drawer, Tooltip, Toaster (sonner), Accordion,
Tabs, Pagination, Breadcrumb.

**`components/primitives`** (custom atoms built on `ui/`): Price, Rating,
Tag, Chip, FilterChips, SectionHeading, SearchBox, EmptyState, ErrorState,
UbImage.

**`components/animation`**: CarouselBase — the shared swipe/keyboard/dot
navigation engine that `TripGallery`, mobile itinerary, and testimonials
will all wrap in Phase 3.

## What's intentionally NOT in this phase

- No `TripCard`, `TripHero`, `TripGallery`, etc. (domain components — Phase 3,
  consumes these primitives).
- No `lib/cloudinary/resolve-image.ts` — `UbImage` accepts a plain `src`
  today; the resolver slots in later without changing `UbImage`'s contract.
- No pages, no data fetching, no `ThemeProvider` wiring — tokens are defined,
  but the runtime theme-switching engine (per-trip mood) is Phase 3+.

## Verification notes

This sandbox has no package-registry network access, so `next`, `react`,
`@radix-ui/*`, `framer-motion`, etc. could not be installed to run a real
`next build` or a fully-typed `tsc` pass. What *was* done:

- Manual review of every file against the Architecture Blueprint (naming,
  folder placement, no hardcoded colors/paths/spacing).
- A syntax-level TypeScript pass (`tsc --noEmit`) using stub ambient
  declarations for the untyped external packages, to catch malformed JSX/TS
  — not full type-correctness against real library types.
- Accessibility pass: every interactive primitive has keyboard support,
  visible focus (`:focus-visible` ring from the global token), and
  appropriate ARIA (roles, labels, `aria-current`/`aria-selected` where
  relevant).
- Responsive pass: no fixed pixel widths; touch targets ≥ 36px in the
  smallest chip/button size, drawer/carousel built mobile-first.

Run `pnpm install && pnpm tsc --noEmit && pnpm build` in a networked
environment before merging, as the real gate.
