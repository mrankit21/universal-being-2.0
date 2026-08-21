/**
 * Lead visibility scoping — Phase 4 ("Sales Team + Assignment").
 *
 * "Sales Executive should primarily see their own assigned leads. Sales
 * Manager should see team performance. Super Admin should see
 * everything." Role -> CRM-tier mapping (see the comment on
 * `ROLE_PERMISSIONS` in lib/auth/rbac.ts):
 *   admin            -> Super Admin   -> sees everything
 *   manager          -> Sales Manager -> sees everything (team-wide)
 *   sales_executive  -> Sales Executive -> own assigned leads only
 *
 * Enforced server-side in every CRM route (not just hidden in the UI) so
 * a Sales Executive can't see someone else's lead by editing query
 * params or guessing a lead's `_id`.
 *
 * Assumption (documented, not silently baked in): a Sales Executive's
 * assigned leads are matched by `CrmLead.assignedTo === session.user.name`
 * — the same free-text Salesperson name already used for assignment
 * throughout the CRM (see CrmLeadModel). There's no separate
 * User<->Salesperson link table yet; give a Sales Executive login the
 * same name as their Salesperson entry for this to work.
 *
 * The match itself is case-/whitespace-insensitive on purpose: the User
 * account name (typed once, at account creation) and the Salesperson
 * name (typed separately, whenever a lead gets assigned) are two
 * independent free-text fields with nothing enforcing they're typed
 * identically — "NIKHIL" the login vs "Nikhil" the assignee is a real
 * mismatch that silently hid every lead from that Sales Executive. A
 * case-insensitive, trimmed comparison closes that gap without needing
 * a real FK-style User<->Salesperson link (still a reasonable follow-up
 * if this ever needs to be stricter).
 */
import type { SessionClaims } from "@/lib/auth/session";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Returns a Mongo filter fragment to AND into any CrmLead query, or
 * `null` when the role has unrestricted visibility. */
export function crmLeadScopeFilter(user: SessionClaims): Record<string, unknown> | null {
  if (user.role === "sales_executive") {
    // Case-insensitive exact match — regex anchored start-to-end so this
    // stays an exact-name match, not a substring search.
    const escaped = normalizeName(user.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return { assignedTo: { $regex: `^${escaped}$`, $options: "i" } };
  }
  return null;
}

/** True if this user is allowed to see/act on a lead currently assigned
 * to `assignedTo` (undefined = unassigned). */
export function canAccessLead(user: SessionClaims, assignedTo?: string): boolean {
  if (user.role !== "sales_executive") return true;
  return !!assignedTo && normalizeName(assignedTo) === normalizeName(user.name);
}
