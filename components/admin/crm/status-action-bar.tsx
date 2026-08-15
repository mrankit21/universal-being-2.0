"use client";

/**
 * StatusActionBar — Phase 2 ("Sales Pipeline + One-Click Actions"). One
 * button per pipeline stage; clicking a button PATCHes the status
 * directly — no dropdown, no form, no confirmation dialog for the
 * common case. "Close Lead" is the one exception that needs a second
 * piece of info (the lost reason), so it expands inline into reason
 * chips instead of opening a modal — still one click per decision.
 *
 * The buttons don't have to be clicked in order: a salesperson can jump
 * straight from "New" to "Booked" if that's what happened on the call.
 * The current status is just highlighted, not gated.
 */
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CRM_PIPELINE_STATUSES, CRM_LEAD_STATUS_LABELS, CRM_LOST_REASONS, type CrmLeadStatus } from "@/lib/crm/constants";

export function StatusActionBar({
  status,
  disabled,
  onSetStatus,
  onClose,
}: {
  status: CrmLeadStatus;
  disabled?: boolean;
  onSetStatus: (status: Exclude<CrmLeadStatus, "lost">) => void;
  onClose: (lostReason: string) => void;
}) {
  const [closing, setClosing] = useState(false);

  if (closing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Why is this lead lost?</p>
          <button type="button" onClick={() => setClosing(false)} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CRM_LOST_REASONS.map((reason) => (
            <Button
              key={reason}
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                onClose(reason);
                setClosing(false);
              }}
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              {reason}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CRM_PIPELINE_STATUSES.map((s) => {
        const active = s === status;
        return (
          <Button
            key={s}
            size="sm"
            variant={active ? "primary" : "outline"}
            disabled={disabled}
            onClick={() => onSetStatus(s)}
            className={cn("gap-1.5", active && "pointer-events-none")}
          >
            {active ? <Check className="size-3.5" /> : null}
            {CRM_LEAD_STATUS_LABELS[s]}
          </Button>
        );
      })}
      <Button
        size="sm"
        variant={status === "lost" ? "primary" : "outline"}
        disabled={disabled}
        onClick={() => (status === "lost" ? undefined : setClosing(true))}
        className={cn(
          "gap-1.5",
          status === "lost" ? "bg-rose-600 hover:bg-rose-600" : "border-rose-200 text-rose-700 hover:bg-rose-50"
        )}
      >
        <X className="size-3.5" /> {status === "lost" ? "Closed" : "Close Lead"}
      </Button>
    </div>
  );
}
