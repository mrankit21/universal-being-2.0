import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Trip2Model } from "@/lib/db/models";
import { Trip2Form } from "@/components/admin/trip2-form";

export default async function EditTrip2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const trip = await Trip2Model.findById(id).lean();
  if (!trip) notFound();

  const doc = trip as unknown as Record<string, unknown>;
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  void _id;
  void __v;
  void createdAt;
  void updatedAt;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Trip 2.0 Page</h1>
        <p className="text-sm text-muted-foreground">{(trip as { title?: string }).title || "Untitled"}</p>
      </div>
      <Suspense fallback={null}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Trip2Form tripId={id} initialValue={rest as any} />
      </Suspense>
    </div>
  );
}
