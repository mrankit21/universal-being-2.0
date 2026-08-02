/** Single source of truth for the Admin sidebar nav (Architecture §9 —
 * "data-driven, never hardcoded per component"). Each item's `permission`
 * gates visibility via `lib/auth/rbac.ts`, so a manager/editor simply never
 * sees links to screens they can't use. */
import type { Permission } from "@/lib/auth/rbac";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string; // lucide-react icon name, resolved in admin-sidebar.tsx
  permission: Permission;
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", permission: "dashboard:view" },
  { label: "Destinations", href: "/admin/destinations", icon: "MapPin", permission: "destinations:read" },
  { label: "Trips", href: "/admin/trips", icon: "Compass", permission: "trips:read" },
  { label: "Trip 2.0", href: "/admin/trip2", icon: "Sparkles", permission: "trip2:read" },
  { label: "Trip 2.0 Backdrops", href: "/admin/trip2-backdrops", icon: "Layers", permission: "settings:read" },
  { label: "Itinerary", href: "/admin/itinerary", icon: "MapPinned", permission: "trips:read" },

  { label: "Themes", href: "/admin/themes", icon: "Palette", permission: "themes:read" },
  { label: "Homepage", href: "/admin/homepage", icon: "LayoutTemplate", permission: "homepage:read" },
  { label: "Homepage 2.0", href: "/admin/homepage2", icon: "Sparkles", permission: "homepage:read" },
  { label: "Testimonials", href: "/admin/testimonials", icon: "MessageSquareQuote", permission: "homepage:read" },
  { label: "Announcements", href: "/admin/announcements", icon: "Megaphone", permission: "announcements:read" },
  { label: "Media Library", href: "/admin/media", icon: "Image", permission: "media:read" },
  { label: "Bookings", href: "/admin/bookings", icon: "CalendarCheck", permission: "bookings:read" },
  { label: "Coupons", href: "/admin/coupons", icon: "Ticket", permission: "coupons:read" },
  { label: "Refunds", href: "/admin/refunds", icon: "RotateCcw", permission: "refunds:read" },
  { label: "Users", href: "/admin/users", icon: "Users", permission: "users:read" },
  { label: "Site Settings", href: "/admin/settings", icon: "Settings", permission: "settings:read" },
];
