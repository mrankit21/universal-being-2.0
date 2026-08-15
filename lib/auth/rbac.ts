/**
 * Role-based access control matrix (requirement #10/#11). Four roles:
 *   - admin:            full access, including User Management and Site
 *                        Settings. Maps to the roadmap's "Super Admin"
 *                        for CRM purposes — sees every lead.
 *   - manager:           everything except User Management. Maps to the
 *                        roadmap's "Sales Manager" for CRM purposes —
 *                        also sees every lead (team performance).
 *   - editor:            content-only — trips, destinations, homepage,
 *                        media, announcements. No settings, users,
 *                        booking status changes, or CRM access.
 *   - sales_executive:   the roadmap's "Sales Executive" — CRM-only
 *                        access (dashboard + leads), nothing else. Lead
 *                        visibility is scoped to "their own assigned
 *                        leads only" at the query layer, not here — see
 *                        `lib/crm/scope.ts`. This role intentionally
 *                        does NOT get trips/destinations/bookings/etc.
 *                        so a sales hire can't touch site content.
 *
 * `can()` is the single choke point every API route and admin page calls —
 * new permissions get added here once, not re-implemented per route.
 */
import type { AdminRole } from "@/lib/db/models/user.model";

export type Permission =
  | "dashboard:view"
  | "trips:read"
  | "trips:write"
  | "trip2:read"
  | "trip2:write"
  | "destinations:read"
  | "destinations:write"
  | "themes:read"
  | "themes:write"
  | "homepage:read"
  | "homepage:write"
  | "announcements:read"
  | "announcements:write"
  | "media:read"
  | "media:write"
  | "settings:read"
  | "settings:write"
  | "bookings:read"
  | "bookings:write"
  | "users:read"
  | "users:write"
  | "coupons:read"
  | "coupons:write"
  | "refunds:read"
  | "refunds:write"
  | "leads:read"
  | "leads:write";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  admin: [
    "dashboard:view",
    "trips:read",
    "trips:write",
    "trip2:read",
    "trip2:write",
    "destinations:read",
    "destinations:write",
    "themes:read",
    "themes:write",
    "homepage:read",
    "homepage:write",
    "announcements:read",
    "announcements:write",
    "media:read",
    "media:write",
    "settings:read",
    "settings:write",
    "bookings:read",
    "bookings:write",
    "users:read",
    "users:write",
    "coupons:read",
    "coupons:write",
    "refunds:read",
    "refunds:write",
    "leads:read",
    "leads:write",
  ],
  manager: [
    "dashboard:view",
    "trips:read",
    "trips:write",
    "trip2:read",
    "trip2:write",
    "destinations:read",
    "destinations:write",
    "themes:read",
    "themes:write",
    "homepage:read",
    "homepage:write",
    "announcements:read",
    "announcements:write",
    "media:read",
    "media:write",
    "settings:read",
    "bookings:read",
    "bookings:write",
    "coupons:read",
    "coupons:write",
    "refunds:read",
    "refunds:write",
    "leads:read",
    "leads:write",
  ],
  editor: [
    "dashboard:view",
    "trips:read",
    "trips:write",
    "trip2:read",
    "trip2:write",
    "destinations:read",
    "destinations:write",
    "homepage:read",
    "homepage:write",
    "announcements:read",
    "announcements:write",
    "media:read",
    "media:write",
    "bookings:read",
    "coupons:read",
  ],
  sales_executive: ["dashboard:view", "leads:read", "leads:write"],
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
