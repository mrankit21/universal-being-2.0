import type { CrmLeadSource } from "@/lib/crm/constants";

/** Small colour dot per lead source, purely visual — lets the table and
 * board scan by source at a glance without reading the label every time. */
export const SOURCE_DOT: Record<CrmLeadSource, string> = {
  website: "bg-blue-500",
  manual: "bg-slate-400",
  meta: "bg-fuchsia-500",
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
  whatsapp: "bg-green-500",
};
