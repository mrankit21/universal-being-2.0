"use client";

/** Mobile-only hamburger drawer for the admin nav (AdminSidebar is
 * `hidden md:flex`, so below the md breakpoint this is the only way to
 * reach Trips/Media Library/Bookings/etc — without it the admin panel is
 * unnavigable on a phone). Mirrors `mobile-nav-drawer.tsx`'s pattern but
 * renders `adminNavItems` filtered by the signed-in user's permissions. */
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
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
  type LucideIcon,
} from "lucide-react";

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
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
};

export function AdminMobileNav({ permissions }: { permissions: Permission[] }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const visibleItems = adminNavItems.filter((item) => permissions.includes(item.permission));

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Open admin menu" className="md:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-serif">
            Universal Being
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">Admin</span>
          </DrawerTitle>
          <DrawerDescription>Jump to any section</DrawerDescription>
        </DrawerHeader>

        <nav aria-label="Admin" className="flex flex-col gap-1 overflow-y-auto px-5 pb-2">
          {visibleItems.map((item) => {
            const Icon = ICONS[item.icon];
            const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
              >
                {Icon ? <Icon className="size-4 shrink-0" /> : null}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <DrawerClose asChild>
          <Button variant="outline" className="mx-5 mb-5">
            Close
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
