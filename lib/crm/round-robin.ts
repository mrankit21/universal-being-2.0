/**
 * Round-robin auto-assignment — Phase 4 ("Auto Assignment", "Round Robin
 * assignment"). Cycles through the existing `Salesperson` list (the same
 * admin-managed name list already used for manual assignment) using the
 * atomic `Counter` collection, so concurrent lead creation can never
 * assign two leads to the same "next" person by a race condition — the
 * same guarantee `generateLeadId()` gets from the same mechanism.
 *
 * Order is alphabetical by name (stable across calls without needing to
 * store an explicit rotation order on the Salesperson collection).
 */
import { SalespersonModel } from "@/lib/db/models/salesperson.model";
import { nextSequence } from "@/lib/db/models/counter.model";

/** Returns the next salesperson name to assign, or `null` if there are
 * no salespeople configured yet (nothing to round-robin over). */
export async function nextRoundRobinAssignee(): Promise<string | null> {
  const people = await SalespersonModel.find().sort({ name: 1 }).lean();
  if (people.length === 0) return null;

  const seq = await nextSequence("crm-round-robin");
  const index = (seq - 1) % people.length; // nextSequence starts at 1
  return people[index].name;
}
