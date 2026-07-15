"use client";

/**
 * TestimonialPickerField — replaces raw "paste a testimonial ID" entry with
 * a real picker against `/api/admin/testimonials`, same dialog pattern as
 * `TripPickerField`/`ImageAssetField`. Order is drag-and-drop via
 * `ArrayFieldEditor`.
 */
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrayFieldEditor } from "@/components/admin/array-field-editor";

interface AdminTestimonial {
  _id: string;
  authorName: string;
  quote: string;
  published: boolean;
}

export function TestimonialPickerField({
  ids,
  onChange,
}: {
  ids: string[];
  onChange: (next: string[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pickerOpen) return;
    setLoading(true);
    fetch("/api/admin/testimonials")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTestimonials(json.data);
      })
      .finally(() => setLoading(false));
  }, [pickerOpen]);

  const byId = new Map(testimonials.map((t) => [t._id, t]));
  const chosen = new Set(ids);

  return (
    <div className="space-y-3">
      <ArrayFieldEditor<string>
        items={ids}
        onChange={onChange}
        draggable
        createItem={() => ""}
        hideAdd
        emptyMessage="No testimonials chosen yet. Add some from the picker below."
        renderItem={(id) => {
          const t = byId.get(id);
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{t?.authorName ?? id}</p>
              {t ? <p className="truncate text-xs text-muted-foreground">“{t.quote}”</p> : null}
            </div>
          );
        }}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
        <Plus className="size-4" />
        Choose Testimonials
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Testimonials</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No testimonials yet — add some from the Testimonials page first.
            </p>
          ) : (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {testimonials.map((t) => {
                const isChosen = chosen.has(t._id);
                return (
                  <button
                    key={t._id}
                    type="button"
                    disabled={isChosen}
                    onClick={() => onChange([...ids, t._id])}
                    className="flex w-full flex-col items-start rounded-md border border-border p-3 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="font-medium">{t.authorName}{t.published ? "" : " (unpublished)"}</span>
                    <span className="truncate text-xs text-muted-foreground">“{t.quote}”</span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
