/**
 * Role-based access control matrix (requirement #10/#11). Three roles:
 *   - admin:   full access, including User Management and Site Settings.
 *   - manager: everything except User Management (can't create/edit admins).
 *   - editor:  content-only — trips, destinations, homepage, media,
 *              announcements. No settings, users, or booking status changes.
 *
 * `can()` is the single choke point every API route and admin page calls —
 * new permissions get added here once, not re-implemented per route.
 */
import type { AdminRole } from "@/lib/db/models/user.model";

export type Permission =
  | "dashboard:view"
  | "trips:read"
  | "trips:write"
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
  | "refunds:write";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  admin: [
    "dashboard:view",
    "trips:read",
    "trips:write",
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
  ],
  manager: [
    "dashboard:view",
    "trips:read",
    "trips:write",
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
  ],
  editor: [
    "dashboard:view",
    "trips:read",
    "trips:write",
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
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
