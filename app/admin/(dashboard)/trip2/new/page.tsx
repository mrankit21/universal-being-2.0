import { Suspense } from "react";
import { Trip2Form } from "@/components/admin/trip2-form";

export default function NewTrip2Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Trip 2.0 Page</h1>
        <p className="text-sm text-muted-foreground">Create a new trip page using the Trip 2.0 design.</p>
      </div>
      <Suspense fallback={null}>
        <Trip2Form />
      </Suspense>
    </div>
  );
}
