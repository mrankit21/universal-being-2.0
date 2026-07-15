import type { Trip } from "@/types/trip";
import { manaliTrip } from "./manali";
import { spitiTrip } from "./spiti";
import { ladakhTrip } from "./ladakh";
import { choptaTrip } from "./chopta";
import { jibhiTrip } from "./jibhi";
import { dharamshalaTrip } from "./dharamshala";
import { udaipurTrip } from "./udaipur";

/**
 * Trip registry — mirrors the pattern already established by
 * `data/themes/index.ts`. Adding a trip means adding one seed file (see
 * `_builder.ts`) and one line here; `lib/api/trips.ts` is the only consumer.
 * When the Admin Panel + database land, this file is deleted and
 * `lib/api/trips.ts` fetches from the API instead — nothing else changes.
 */
export const tripRegistry: Record<string, Trip> = {
  [manaliTrip.slug]: manaliTrip,
  [spitiTrip.slug]: spitiTrip,
  [ladakhTrip.slug]: ladakhTrip,
  [choptaTrip.slug]: choptaTrip,
  [jibhiTrip.slug]: jibhiTrip,
  [dharamshalaTrip.slug]: dharamshalaTrip,
  [udaipurTrip.slug]: udaipurTrip,
};

export const tripSlugs = Object.keys(tripRegistry);
