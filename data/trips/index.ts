import type { Trip } from "@/types/trip";
import { manaliTrip } from "./manali";
import { manaliQuickTrailTrip } from "./manali-quick-trail";
import { manaliKasolExtensionTrip } from "./manali-kasol-extension";
import { spitiTrip } from "./spiti";
import { spitiQuickCircuitTrip } from "./spiti-quick-circuit";
import { spitiChandratalExtendedTrip } from "./spiti-chandratal-extended";
import { ladakhTrip } from "./ladakh";
import { ladakhQuickLoopTrip } from "./ladakh-quick-loop";
import { ladakhExtendedExplorerTrip } from "./ladakh-extended-explorer";
import { choptaTrip } from "./chopta";
import { choptaTungnathDashTrip } from "./chopta-tungnath-dash";
import { choptaDeoriatalExtensionTrip } from "./chopta-deoriatal-extension";
import { jibhiTrip } from "./jibhi";
import { jibhiWeekendRetreatTrip } from "./jibhi-weekend-retreat";
import { jibhiTirthanExtensionTrip } from "./jibhi-tirthan-extension";
import { dharamshalaTrip } from "./dharamshala";
import { dharamshalaMcleodWeekendTrip } from "./dharamshala-mcleod-weekend";
import { dharamshalaBirBillingExtensionTrip } from "./dharamshala-bir-billing-extension";
import { udaipurTrip } from "./udaipur";
import { udaipurFlyingVisitTrip } from "./udaipur-flying-visit";
import { udaipurKumbhalgarhExtensionTrip } from "./udaipur-kumbhalgarh-extension";

/**
 * Trip registry — mirrors the pattern already established by
 * `data/themes/index.ts`. Adding a trip means adding one seed file (see
 * `_builder.ts`) and one line here; `lib/api/trips.ts` is the only consumer.
 * When the Admin Panel + database land, this file is deleted and
 * `lib/api/trips.ts` fetches from the API instead — nothing else changes.
 *
 * Every destination below now has 3 real, independent Trip documents
 * sharing one `circuitGroup` (a short/base/extended duration variant),
 * exactly like the Ladakh circuit — so `TripDurationSelector` renders its
 * "Choose Trip Duration" cards on every trip page, not just Ladakh's.
 */
export const tripRegistry: Record<string, Trip> = {
  [manaliTrip.slug]: manaliTrip,
  [manaliQuickTrailTrip.slug]: manaliQuickTrailTrip,
  [manaliKasolExtensionTrip.slug]: manaliKasolExtensionTrip,

  [spitiTrip.slug]: spitiTrip,
  [spitiQuickCircuitTrip.slug]: spitiQuickCircuitTrip,
  [spitiChandratalExtendedTrip.slug]: spitiChandratalExtendedTrip,

  [ladakhTrip.slug]: ladakhTrip,
  [ladakhQuickLoopTrip.slug]: ladakhQuickLoopTrip,
  [ladakhExtendedExplorerTrip.slug]: ladakhExtendedExplorerTrip,

  [choptaTrip.slug]: choptaTrip,
  [choptaTungnathDashTrip.slug]: choptaTungnathDashTrip,
  [choptaDeoriatalExtensionTrip.slug]: choptaDeoriatalExtensionTrip,

  [jibhiTrip.slug]: jibhiTrip,
  [jibhiWeekendRetreatTrip.slug]: jibhiWeekendRetreatTrip,
  [jibhiTirthanExtensionTrip.slug]: jibhiTirthanExtensionTrip,

  [dharamshalaTrip.slug]: dharamshalaTrip,
  [dharamshalaMcleodWeekendTrip.slug]: dharamshalaMcleodWeekendTrip,
  [dharamshalaBirBillingExtensionTrip.slug]: dharamshalaBirBillingExtensionTrip,

  [udaipurTrip.slug]: udaipurTrip,
  [udaipurFlyingVisitTrip.slug]: udaipurFlyingVisitTrip,
  [udaipurKumbhalgarhExtensionTrip.slug]: udaipurKumbhalgarhExtensionTrip,
};

export const tripSlugs = Object.keys(tripRegistry);
