import Link from "next/link";

import type { FooterColumn } from "@/types/layout";

export interface FooterNavProps {
  columns: FooterColumn[];
}

/**
 * FooterNav — one `<nav>` landmark per column (title as the accessible
 * name), entirely data-driven. Add/rename/reorder a footer section by
 * editing `siteConfig.footerColumns` only.
 */
export function FooterNav({ columns }: FooterNavProps) {
  return (
    <>
      {columns.map((column) => (
        <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
          <h3 className="text-sm font-bold tracking-wide text-foreground">{column.title}</h3>
          <ul className="flex flex-col gap-2">
            {column.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </>
  );
}
