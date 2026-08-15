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
 * exact same name as their Salesperson entry for this to work. A real
 * FK-style link is a reasonable follow-up if names ever drift out of
 * sync, but isn't needed for Phase 4's scope.
 */
import type { SessionClaims } from "@/lib/auth/session";

/** Returns a Mongo filter fragment to AND into any CrmLead query, or
 * `null` when the role has unrestricted visibility. */
export function crmLeadScopeFilter(user: SessionClaims): Record<string, unknown> | null {
  if (user.role === "sales_executive") {
    return { assignedTo: user.name };
  }
  return null;
}

/** True if this user is allowed to see/act on a lead currently assigned
 * to `assignedTo` (undefined = unassigned). */
export function canAccessLead(user: SessionClaims, assignedTo?: string): boolean {
  if (user.role !== "sales_executive") return true;
  return assignedTo === user.name;
}
