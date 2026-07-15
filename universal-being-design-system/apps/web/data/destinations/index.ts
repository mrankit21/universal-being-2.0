import type { Destination } from "@/types/destination";
import { manaliDestination } from "./manali";
import { spitiDestination } from "./spiti";
import { ladakhDestination } from "./ladakh";
import { choptaDestination } from "./chopta";
import { jibhiDestination } from "./jibhi";
import { dharamshalaDestination } from "./dharamshala";
import { udaipurDestination } from "./udaipur";
import { goaDestination } from "./goa";

/** Destination registry — same pattern as `data/trips/index.ts` and
 * `data/themes/index.ts`. `lib/api/destinations.ts` is the only consumer. */
export const destinationRegistry: Record<string, Destination> = {
  [manaliDestination.slug]: manaliDestination,
  [spitiDestination.slug]: spitiDestination,
  [ladakhDestination.slug]: ladakhDestination,
  [choptaDestination.slug]: choptaDestination,
  [jibhiDestination.slug]: jibhiDestination,
  [dharamshalaDestination.slug]: dharamshalaDestination,
  [udaipurDestination.slug]: udaipurDestination,
  [goaDestination.slug]: goaDestination,
};

export const destinationSlugs = Object.keys(destinationRegistry);
