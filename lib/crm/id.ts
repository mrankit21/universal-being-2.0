/**
 * Generates the short human-facing lead code ("LD-2026-0001"). Reuses the
 * existing atomic `Counter` collection (`lib/db/models/counter.model.ts`)
 * — the same mechanism invoice numbering uses — so concurrent lead
 * creation (e.g. two webhook deliveries at once in later phases) can
 * never collide or skip.
 */
import { nextSequence } from "@/lib/db/models/counter.model";

export async function generateLeadId(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`crm-lead:${year}`);
  return `LD-${year}-${String(seq).padStart(4, "0")}`;
}
