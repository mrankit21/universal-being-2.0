import type { CrmLeadStatus } from "@/lib/crm/constants";

/** Small colour dot per pipeline status, purely visual — mirrors
 * SOURCE_DOT (source-badge.tsx) so status and source scan the same way
 * across the status filter dropdown, the board, and the table. Order and
 * hues follow the pipeline left-to-right (blue -> green), with `lost`
 * breaking the pattern in red as the terminal exit. */
export const STATUS_DOT: Record<CrmLeadStatus, string> = {
  new: "bg-blue-500",
  contacted: "bg-sky-400",
  interested: "bg-violet-500",
  itinerary_sent: "bg-orange-500",
  quotation_sent: "bg-pink-500",
  payment_pending: "bg-amber-400",
  booked: "bg-green-500",
  trip_completed: "bg-teal-500",
  lost: "bg-red-500",
};

/** Dot for the synthetic "No Response > 2 Days" filter option, which
 * isn't a real pipeline status — kept separate from STATUS_DOT so that
 * map can stay a clean `Record<CrmLeadStatus, string>`. */
export const NO_RESPONSE_DOT = "bg-slate-300";
