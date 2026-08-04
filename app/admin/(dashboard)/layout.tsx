/**
 * Admin route-group shell (Architecture §7: "Gated route group `app/admin`").
 * `middleware.ts` already redirects unauthenticated requests before this
 * layout ever renders, so `getCurrentUser()` here is only for reading who's
 * logged in to build the sidebar/header — not a second gate.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { permissionsFor } from "@/lib/auth/rbac";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const permissions = permissionsFor(user.role);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar permissions={permissions} />
      <div className="flex flex-1 flex-col">
        <AdminHeader userName={user.name || user.email} role={user.role} permissions={permissions} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
