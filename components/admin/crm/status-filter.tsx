"use client";

/**
 * Status filter — a single compact "Status ▾" control that expands into
 * the full pipeline list on tap, replacing the old row of ~10 separate
 * pill buttons (New / Contacted / .../ No Response > 2 Days) that ate a
 * lot of vertical space, especially on phone. "No Response > 2 Days" is
 * folded in here as one more selectable row (it isn't a real pipeline
 * status server-side — the parent maps it to the noResponse=true query
 * param — but visually it belongs in this same list, per the design).
 */
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRM_LEAD_STATUSES, CRM_LEAD_STATUS_LABELS, type CrmLeadStatus } from "@/lib/crm/constants";
import { STATUS_DOT, NO_RESPONSE_DOT } from "@/components/admin/crm/status-badge";

export type StatusFilterValue = "all" | CrmLeadStatus | "no_response";

const NO_RESPONSE_LABEL = "No Response > 2 Days";

function labelFor(value: StatusFilterValue): string {
  if (value === "all") return "All Status";
  if (value === "no_response") return NO_RESPONSE_LABEL;
  return CRM_LEAD_STATUS_LABELS[value];
}

export function StatusFilter({
  value,
  onChange,
  noResponseCount,
}: {
  value: StatusFilterValue;
  onChange: (v: StatusFilterValue) => void;
  noResponseCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  function select(v: StatusFilterValue) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full min-w-[168px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors sm:w-auto",
          open ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "hover:bg-accent"
        )}
      >
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <LayoutGrid className="size-4" />
          Status
        </span>
        <span className="flex items-center gap-1 font-medium">
          {value !== "all" ? (
            <span
              className={cn("size-1.5 shrink-0 rounded-full", value === "no_response" ? NO_RESPONSE_DOT : STATUS_DOT[value as CrmLeadStatus])}
            />
          ) : null}
          <span className="max-w-[9rem] truncate">{labelFor(value)}</span>
          {open ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
        </span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-1.5 w-64 overflow-hidden rounded-lg border bg-popover p-1 shadow-lg">
          <button
            type="button"
            onClick={() => select("all")}
            className={cn(
              "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
              value === "all" ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-accent"
            )}
          >
            All Status
            {value === "all" ? <Check className="size-4" /> : null}
          </button>

          <div className="mt-1 max-h-72 overflow-y-auto">
            {CRM_LEAD_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => select(s)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  value === s ? "bg-accent font-medium" : "hover:bg-accent"
                )}
              >
                <span className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[s])} />
                {CRM_LEAD_STATUS_LABELS[s]}
              </button>
            ))}

            <button
              type="button"
              onClick={() => select("no_response")}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-rose-600 transition-colors",
                value === "no_response" ? "bg-rose-50" : "hover:bg-rose-50"
              )}
            >
              <span className={cn("size-2 shrink-0 rounded-full", NO_RESPONSE_DOT)} />
              {NO_RESPONSE_LABEL}
              {noResponseCount ? (
                <span className="ml-auto flex items-center gap-1 text-xs">
                  <AlertTriangle className="size-3.5 shrink-0" />({noResponseCount})
                </span>
              ) : null}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
