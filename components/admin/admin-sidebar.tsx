"use client";

/** Admin shell sidebar — filters `adminNavItems` down to what the current
 * user's role can see (requirement #10, role-based permissions surfaced in
 * the UI, not just enforced server-side). */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  MapPinned,
  Compass,
  Palette,
  LayoutTemplate,
  MessageSquareQuote,
  Megaphone,
  Image as ImageIcon,
  CalendarCheck,
  Users,
  Settings,
  Ticket,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNavItems } from "./admin-nav-config";
import type { Permission } from "@/lib/auth/rbac";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  MapPin,
  MapPinned,
  Compass,
  Palette,
  LayoutTemplate,
  MessageSquareQuote,
  Megaphone,
  Image: ImageIcon,
  CalendarCheck,
  Users,
  Settings,
  Ticket,
  RotateCcw,
  Sparkles,
};

export function AdminSidebar({ permissions }: { permissions: Permission[] }) {
  const pathname = usePathname();
  const visibleItems = adminNavItems.filter((item) => permissions.includes(item.permission));

  return (
    <nav className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/admin" className="font-serif text-lg font-semibold tracking-tight">
          Universal Being
          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            Admin
          </span>
        </Link>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {Icon ? <Icon className="size-4 shrink-0" /> : null}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
