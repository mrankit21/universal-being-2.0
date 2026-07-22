"use client";

/**
 * ArrayFieldEditor — the ONE repeater component Architecture §14 calls for:
 * "itinerary days, FAQs, inclusions, exclusions, gallery order, and
 * departure dates all reuse the same ArrayFieldEditor component, configured
 * per field (add/remove/reorder), rather than five bespoke list-editing
 * UIs." Renders whatever `renderItem` gives it per row, plus generic
 * add/remove/move controls — the caller owns the shape of each item.
 */
import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ArrayFieldEditor<T>({
  items,
  onChange,
  renderItem,
  createItem,
  addLabel = "Add item",
  emptyMessage = "Nothing added yet.",
  hideAdd = false,
  draggable = false,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode;
  createItem: () => T;
  addLabel?: string;
  emptyMessage?: string;
  hideAdd?: boolean;
  /** Enables drag-and-drop reordering (in addition to the up/down buttons) — used for galleries per Step 7.6B §2/§3 ("Gallery should support: … Drag & Drop Sorting"). */
  draggable?: boolean;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function updateAt(index: number, patch: Partial<T>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function moveAt(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function moveTo(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        items.map((item, index) => (
          <div
            key={index}
            draggable={draggable}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              if (!draggable) return;
              e.preventDefault();
              setOverIndex(index);
            }}
            onDrop={(e) => {
              if (!draggable) return;
              e.preventDefault();
              if (dragIndex !== null) moveTo(dragIndex, index);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`flex gap-2 rounded-md border p-3 transition-colors ${
              overIndex === index && dragIndex !== null && dragIndex !== index
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            {draggable ? (
              <div className="flex shrink-0 cursor-grab items-start pt-1 text-muted-foreground active:cursor-grabbing">
                <GripVertical className="size-4" />
              </div>
            ) : null}
            <div className="flex-1">{renderItem(item, index, (patch) => updateAt(index, patch))}</div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => moveAt(index, -1)} disabled={index === 0}>
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveAt(index, 1)}
                disabled={index === items.length - 1}
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeAt(index)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, createItem()])} className={hideAdd ? "hidden" : ""}>
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
