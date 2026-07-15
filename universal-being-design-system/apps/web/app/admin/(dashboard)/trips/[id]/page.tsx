import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import { TripModel } from "@/lib/db/models";
import { TripForm } from "@/components/admin/trip-form";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const trip = await TripModel.findById(id).lean();
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
        <h1 className="text-2xl font-semibold tracking-tight">Edit Trip</h1>
        <p className="text-sm text-muted-foreground">{(trip as { title: string }).title}</p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TripForm tripId={id} initialValue={rest as any} />
    </div>
  );
}
