"use client";

/**
 * AdminTable — the ONE generic data-table component (Architecture §7:
 * "AdminTable: one generic data-table component (search/sort/paginate)
 * reused for trips, bookings, and users — driven by column config, not
 * rebuilt per resource"). Columns are pure render functions, so every
 * resource list page configures this once instead of hand-rolling a table.
 *
 * (2026-08 fix) Below `md` this now renders each row as a stacked card
 * (label: value pairs) instead of a `<table>`. A real HTML table can't
 * reflow onto a narrow phone screen — the old version just grew wider than
 * the viewport and relied on horizontal scroll, which read as the whole
 * admin panel being "cropped"/zoomed on mobile. The desktop table is
 * unchanged (`hidden md:table`); columns can opt out of the mobile card
 * (e.g. a trailing icon-only action column) via `hideLabelOnMobile`.
 */
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Omit this column's label in the mobile card view (value still shows). Useful for icon-only action columns. */
  hideLabelOnMobile?: boolean;
}

export function DataTable<T extends { id?: string; _id?: string }>({
  columns,
  rows,
  loading,
  emptyMessage = "No records yet.",
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border px-4 py-10 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-5 animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border px-4 py-10 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards, one per row */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)} className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              {columns.map((col) => {
                const value = col.cell(row);
                if (value === null || value === undefined) return null;
                return (
                  <div key={col.header} className="flex items-start justify-between gap-3 text-sm">
                    {!col.hideLabelOnMobile && col.header ? (
                      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {col.header}
                      </span>
                    ) : null}
                    <span className="min-w-0 text-right break-words">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className={`px-4 py-3 text-left font-medium text-muted-foreground ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-muted/30">
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 align-middle ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
