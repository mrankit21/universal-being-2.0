import { Suspense } from "react";
import { TripForm } from "@/components/admin/trip-form";

export default function NewTripPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Trip</h1>
        <p className="text-sm text-muted-foreground">Create a new bookable trip.</p>
      </div>
      <Suspense fallback={null}>
        <TripForm />
      </Suspense>
    </div>
  );
}

