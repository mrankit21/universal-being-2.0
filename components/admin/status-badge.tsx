import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  draft: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  archived: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  confirmed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
  completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  "slot-reserved": "bg-amber-100 text-amber-800 hover:bg-amber-100",
  "slot-paid": "bg-sky-100 text-sky-800 hover:bg-sky-100",
  "remaining-payment-pending": "bg-orange-100 text-orange-800 hover:bg-orange-100",
  "remaining-payment-received": "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  expired: "bg-slate-200 text-slate-700 hover:bg-slate-200",
  refunded: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  requested: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  approved: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
  processed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("capitalize", STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700")}>
      {status}
    </Badge>
  );
}
