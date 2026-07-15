"use client";

/** Top bar: current-user identity + logout. Kept dumb/presentational —
 * `logout-button.tsx` owns the actual `/api/auth/logout` call + redirect. */
import { LogoutButton } from "./logout-button";

export function AdminHeader({ userName, role }: { userName: string; role: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="md:hidden font-serif text-lg font-semibold">Universal Being Admin</div>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right text-sm">
          <p className="font-medium leading-tight">{userName}</p>
          <p className="capitalize leading-tight text-muted-foreground">{role}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
