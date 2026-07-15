"use client";

/** Dashboard module (requirement #1): stats + upcoming batches. Fetches
 * `/api/admin/stats` client-side so it always reflects live DB state without
 * needing a page revalidation strategy. */
import { useEffect, useState } from "react";
import { Compass, CalendarCheck, Star, CalendarClock, IndianRupee, MapPin } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalTrips: number;
  publishedTrips: number;
  draftTrips: number;
  featuredTrips: number;
  totalDestinations: number;
  activeBookings: number;
  pendingBookings: number;
  totalBookings: number;
  upcomingBatches: {
    tripTitle: string;
    tripSlug: string;
    departureId: string;
    startDate: string;
    seatsAvailable: number;
  }[];
  revenue: { collected: number; pending: number; currency: string; enabled: boolean };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStats(json.data);
        else setError(json.error);
      })
      .catch(() => setError("Failed to load dashboard stats."));
  }, []);

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An overview of Universal Being&apos;s trips, bookings, and content.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Trips" value={stats?.totalTrips ?? "—"} icon={Compass} hint={stats ? `${stats.publishedTrips} published · ${stats.draftTrips} draft` : undefined} />
        <StatCard label="Destinations" value={stats?.totalDestinations ?? "—"} icon={MapPin} />
        <StatCard label="Featured Trips" value={stats?.featuredTrips ?? "—"} icon={Star} accent />
        <StatCard label="Active Bookings" value={stats?.activeBookings ?? "—"} icon={CalendarCheck} hint={stats ? `${stats.pendingBookings} pending` : undefined} />
        <StatCard label="Upcoming Batches" value={stats?.upcomingBatches.length ?? "—"} icon={CalendarClock} />
        <StatCard
          label="Revenue Collected"
          value={stats?.revenue.enabled ? `₹${stats.revenue.collected.toLocaleString("en-IN")}` : "—"}
          icon={IndianRupee}
          hint="Enabled once the Payment Gateway phase ships"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : stats.upcomingBatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming departure dates scheduled.</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.upcomingBatches.map((batch) => (
                <div key={batch.departureId} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{batch.tripTitle}</p>
                    <p className="text-xs text-muted-foreground">{batch.startDate}</p>
                  </div>
                  <Badge variant="outline">{batch.seatsAvailable} seats left</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
