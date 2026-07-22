"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  MapPin,
  Heart,
  User,
  Info,
  Phone,
  MessageCircle,
  Shield,
  FileText,
  Mail,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavIconKey, NavItem } from "@/types/layout";

/** Static icon registry — the ONLY place a NavIconKey maps to a component.
 * Nav config data supplies the key; nothing else needs to know lucide-react
 * exists. Mirrors the MOTIF_ASSET registry in components/theme/decorative-motif.tsx. */
const NAV_ICON: Record<NavIconKey, LucideIcon> = {
  home: Home,
  compass: Compass,
  "map-pin": MapPin,
  heart: Heart,
  user: User,
  info: Info,
  phone: Phone,
  "message-circle": MessageCircle,
  shield: Shield,
  "file-text": FileText,
  mail: Mail,
};

export function resolveNavIcon(key?: NavIconKey): LucideIcon | null {
  return key ? NAV_ICON[key] ?? null : null;
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface NavLinkProps {
  item: NavItem;
  className?: string;
  activeClassName?: string;
  /** Renders the icon above/beside the label — used by bottom nav & drawer. */
  showIcon?: boolean;
  iconClassName?: string;
  onNavigate?: () => void;
}

/**
 * NavLink — single reusable primary-nav item with an active-link
 * indicator (`aria-current="page"` + themeable underline/pill). Used by
 * DesktopHeader, MobileNavDrawer, and BottomNav so "active" logic never
 * gets reimplemented three different ways.
 */
export function NavLink({
  item,
  className,
  activeClassName,
  showIcon = false,
  iconClassName,
  onNavigate,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = showIcon ? resolveNavIcon(item.icon) : null;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "relative inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-ub-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className,
        active && activeClassName
      )}
    >
      {Icon && <Icon className={cn("size-5", iconClassName)} aria-hidden="true" />}
      <span>{item.label}</span>
      {active && (
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-primary"
        />
      )}
    </Link>
  );
}
