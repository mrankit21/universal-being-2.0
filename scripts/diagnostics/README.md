# Diagnostics — health-check scripts for Universal Being v2

Read-only scripts. None of these write anything to MongoDB — safe to run
anytime, as often as you want.

Run all of them from the project root (`universal-being-v2-main`).

---

## 1. Something looks wrong / missing on the site — start here

```
npx tsx scripts/diagnostics/check-itineraries.ts
```

Lists every Trip and how many itinerary days it has in the database vs
in the static backup files. Flags anything that's empty when it
shouldn't be.

## 2. Check OTHER fields too (not just itinerary)

```
npx tsx scripts/diagnostics/check-trip-fields.ts
```

Same idea as #1, but checks shortDescription, fullDescription,
highlights, inclusions, and exclusions. Run this whenever #1 finds a
problem — the same save action that wipes itinerary can wipe these too.

## 3. Deep-dive on specific trip(s)

```
npx tsx scripts/diagnostics/check-trip-detail.ts <slug1> <slug2> ...
```

Example:

```
npx tsx scripts/diagnostics/check-trip-detail.ts udaipur-heritage-walk manali-snow-trail
```

Shows full itinerary content, `updatedAt` (when it was last saved), and
`updatedBy` (which admin account saved it) — this is what tells you
WHEN something broke, so you can match it to what you were doing in the
Admin Panel around that time.

Run with no arguments and it defaults to checking the Udaipur circuit.

## 4. Check for duplicate Circuit Parents

```
npx tsx scripts/diagnostics/check-circuit-parents.ts
```

Flags any Circuit Group where more than one Trip is flagged as parent
— this is what caused Udaipur/Ladakh cover images to randomly
disappear on 25-26 Jul 2026. Run this if any parent/cover image looks
wrong on the site.

---

## What "empty/missing" means when you see it

If a script flags something as empty, it's almost always because a
save was made in the Admin Panel from a tab/section whose data hadn't
loaded yet, or had gone stale in the browser. As of **26 July 2026**,
this is fixed for the **Trips** and **Destinations** editors — saving
now only sends the fields you actually changed, so one section can no
longer wipe another. If a NEW instance of this ever shows up in a
different part of the Admin Panel (Testimonials, Announcements,
Homepage, Themes), that section likely still has the old
whole-document-overwrite behavior and needs the same fix applied.

## If a script does find a real problem

Don't panic — nothing is deleted, it's sitting fine in
`data/trips/*.ts` (or the relevant static file) as a backup. Screenshot
or copy the script's output and bring it to Claude with the context of
what you were doing right before you noticed — the `updatedAt`/
`updatedBy` fields from script #3 usually pin down the exact save that
caused it.
