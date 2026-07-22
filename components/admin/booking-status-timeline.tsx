import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookingStatusEvent {
  status: string;
  note?: string;
  changedAt: string;
  changedBy?: string;
}

/** Booking Status Timeline (Part 8) — renders `Booking.statusHistory` in
 * chronological order. Bookings written before this field existed simply
 * have an empty array, so this quietly renders nothing instead of erroring
 * (backward compatible with the original skeleton). */
export function BookingStatusTimeline({ events }: { events: BookingStatusEvent[] }) {
  if (!events?.length) {
    return <p className="text-sm text-muted-foreground">No status history recorded yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <CheckCircle2 className={cn("size-4", i === events.length - 1 ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
            {i < events.length - 1 ? <div className="mt-1 h-full w-px flex-1 bg-border" /> : null}
          </div>
          <div className="pb-4 text-sm">
            <p className="font-medium capitalize text-foreground">{event.status}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(event.changedAt).toLocaleString("en-IN")}
              {event.changedBy ? ` · ${event.changedBy}` : ""}
            </p>
            {event.note ? <p className="mt-1 text-muted-foreground">{event.note}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
