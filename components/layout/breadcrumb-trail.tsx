import * as React from "react";
import { Home } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbTrailItem {
  label: string;
  /** Omit on the final/current item. */
  href?: string;
}

export interface BreadcrumbTrailProps {
  items: BreadcrumbTrailItem[];
  className?: string;
}

/**
 * BreadcrumbTrail — a thin, opinionated wrapper over `components/ui/
 * breadcrumb.tsx`'s compound primitives (Phase 2). Deliberately items-
 * driven rather than auto-derived from the URL: a trip page's most useful
 * trail is "Destinations → Rajasthan → Udaipur Heritage Walk", which only
 * the page itself knows (slugs alone can't produce that), and staying
 * server-rendered here avoids a client-only `usePathname` dependency for
 * something every page will want above the fold.
 */
export function BreadcrumbTrail({ items, className }: BreadcrumbTrailProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" aria-label="Home">
            <Home className="size-3.5" aria-hidden="true" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <React.Fragment key={item.href ?? item.label}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
