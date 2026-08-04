"use client";

/** Top bar: mobile menu trigger + current-user identity + logout. Kept
 * mostly presentational — `logout-button.tsx` owns the actual
 * `/api/auth/logout` call + redirect, `admin-mobile-nav.tsx` owns the
 * drawer's own open state. */
import { AdminMobileNav } from "./admin-mobile-nav";
import { LogoutButton } from "./logout-button";
import type { Permission } from "@/lib/auth/rbac";

export function AdminHeader({
  userName,
  role,
  permissions,
}: {
  userName: string;
  role: string;
  permissions: Permission[];
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        <AdminMobileNav permissions={permissions} />
        <div className="font-serif text-lg font-semibold md:hidden">Universal Being Admin</div>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div className="hidden text-right text-sm sm:block">
          <p className="font-medium leading-tight">{userName}</p>
          <p className="capitalize leading-tight text-muted-foreground">{role}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
