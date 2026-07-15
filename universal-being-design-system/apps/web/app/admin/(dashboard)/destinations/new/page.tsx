import { DestinationForm } from "@/components/admin/destination-form";

export default function NewDestinationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Destination</h1>
        <p className="text-sm text-muted-foreground">Create a new place trips can be grouped under.</p>
      </div>
      <DestinationForm />
    </div>
  );
}
