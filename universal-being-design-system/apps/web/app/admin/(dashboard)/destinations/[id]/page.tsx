import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DestinationModel } from "@/lib/db/models";
import { DestinationForm } from "@/components/admin/destination-form";

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const destination = await DestinationModel.findById(id).lean();
  if (!destination) notFound();

  const doc = destination as unknown as Record<string, unknown>;
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  void _id;
  void __v;
  void createdAt;
  void updatedAt;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Destination</h1>
        <p className="text-sm text-muted-foreground">{(destination as { name: string }).name}</p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <DestinationForm destinationId={id} initialValue={rest as any} />
    </div>
  );
}
