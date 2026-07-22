"use client";

/**
 * AdminTable — the ONE generic data-table component (Architecture §7:
 * "AdminTable: one generic data-table component (search/sort/paginate)
 * reused for trips, bookings, and users — driven by column config, not
 * rebuilt per resource"). Columns are pure render functions, so every
 * resource list page configures this once instead of hand-rolling a table.
 */
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
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
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
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
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                <Loader2 className="mx-auto size-5 animate-spin" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-muted/30">
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 align-middle ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
