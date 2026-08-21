"use client";

/**
 * LeadAssigneeSelect — per-lead "Assigned to" dropdown. Doubles as the
 * management UI for the Salesperson list itself: the same panel that
 * lets you assign a lead also lets you type a new name to add, or
 * remove an existing one — there's no separate "Manage salespeople"
 * screen, since the list only ever exists to be picked from here.
 *
 * The dropdown panel is rendered into a portal at `document.body` with
 * `position: fixed` computed from the trigger's own bounding rect,
 * instead of `position: absolute` inside the trigger's own DOM
 * subtree. Reason: this component lives inside a horizontally-
 * scrolling table (CrmLeadsPage's DataTable), and an `absolute` panel
 * gets clipped by that table's own `overflow-x` — it renders, but off
 * to the side or invisible until the table itself is scrolled. A
 * portal + fixed position floats the panel above the whole page,
 * independent of any scroll container it happens to sit inside.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus, Trash2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Salesperson {
  _id: string;
  name: string;
}

export function LeadAssigneeSelect({
  value,
  onAssign,
  salespeople,
  onSalespeopleChange,
  disabled,
}: {
  value?: string;
  onAssign: (name: string | null) => void;
  salespeople: Salesperson[];
  onSalespeopleChange: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Recompute the panel's position every time it opens, and keep it
  // pinned to the trigger while the page scrolls or the window
  // resizes (the panel is fixed-positioned, so it doesn't move with
  // the page on its own).
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = 224; // matches the w-56 panel below
      const left = Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 8);
      setPanelStyle({ top: rect.bottom + 4, left: Math.max(8, left), width: panelWidth });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setNewName("");
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/salespeople", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not add salesperson.");
        return;
      }
      setNewName("");
      onSalespeopleChange();
      onAssign(name);
      setOpen(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(person: Salesperson) {
    setDeletingId(person._id);
    try {
      const res = await fetch(`/api/admin/salespeople/${person._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not remove salesperson.");
        return;
      }
      toast.success(`Removed ${person.name}.`);
      onSalespeopleChange();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 min-w-[9rem] items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      >
        <span className={cn("flex items-center gap-1.5 truncate", !value && "text-muted-foreground")}>
          <User className="size-3 shrink-0" />
          {value ?? "Unassigned"}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && panelStyle
        ? createPortal(
            <div
              ref={panelRef}
              style={{ position: "fixed", top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
              className="z-50 rounded-md border border-border bg-popover shadow-lg"
            >
              <div className="max-h-48 overflow-y-auto p-1">
                <button
                  type="button"
                  onClick={() => {
                    onAssign(null);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
                >
                  <span className="text-muted-foreground">Unassigned</span>
                  {!value ? <Check className="size-3.5 shrink-0" /> : null}
                </button>
                {salespeople.map((p) => (
                  <div key={p._id} className="group flex items-center rounded-sm hover:bg-accent">
                    <button
                      type="button"
                      onClick={() => {
                        onAssign(p.name);
                        setOpen(false);
                      }}
                      className="flex flex-1 items-center justify-between gap-2 px-2 py-1.5 text-left text-xs"
                    >
                      <span className="truncate">{p.name}</span>
                      {value === p.name ? <Check className="size-3.5 shrink-0" /> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p._id}
                      title={`Remove ${p.name}`}
                      className="mr-1 shrink-0 rounded p-1 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
                {salespeople.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">No salespeople yet.</p>
                ) : null}
              </div>
              <div className="flex items-center gap-1 border-t border-border p-1.5">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder="Add salesperson…"
                  className="h-7 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding || !newName.trim()}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
