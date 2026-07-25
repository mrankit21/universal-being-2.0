"use client";

import * as React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SearchBox } from "@/components/primitives/search-box";
import { EmptyState } from "@/components/primitives/empty-state";
import { useGlobalSearch } from "@/components/layout/search-context";
import { siteConfig } from "@/data/layout/site-config";

export interface SearchResult {
  id: string;
  title: string;
  href: string;
  description?: string;
}

export type SearchFn = (query: string) => Promise<SearchResult[]> | SearchResult[];

/**
 * Default search — matches the site's own nav locally (instant, no network)
 * and, in parallel, hits `/api/trips/search` so trips/destinations (e.g.
 * "manali") show up as real suggestions. Nav matches are shown first since
 * they resolve synchronously; trip results are appended once the request
 * returns. GlobalSearchModal's contract (query in, SearchResult[] out)
 * never changes, so this can still be swapped via the `search` prop.
 */
const defaultSearch: SearchFn = async (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const navResults: SearchResult[] = siteConfig.primaryNav
    .filter((item) => item.label.toLowerCase().includes(q))
    .map((item) => ({ id: item.href, title: item.label, href: item.href }));

  try {
    const res = await fetch(`/api/trips/search?q=${encodeURIComponent(query.trim())}`);
    const json = await res.json();
    const tripResults: SearchResult[] = json.success ? json.data : [];
    return [...navResults, ...tripResults];
  } catch {
    // Network hiccup — still show whatever nav matches we found locally
    // rather than surfacing an empty state for a working query.
    return navResults;
  }
};

export interface GlobalSearchModalProps {
  search?: SearchFn;
}

export function GlobalSearchModal({ search = defaultSearch }: GlobalSearchModalProps) {
  const { isOpen, close } = useGlobalSearch();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Reset on close so re-opening never shows a stale query.
  React.useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  React.useEffect(() => {
    let cancelled = false;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      const next = await search(query);
      if (!cancelled) {
        setResults(next);
        setIsSearching(false);
      }
    }, 200); // debounce — matches duration-ub-base intent, kept as a raw ms value since this drives a timer, not a CSS transition
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, search]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="top-24 translate-y-0 gap-4 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Find destinations, trips, and pages.</DialogDescription>
        </DialogHeader>

        <SearchBox
          value={query}
          onChange={setQuery}
          autoFocus
          placeholder="Search destinations, trips…"
        />

        <div className="max-h-80 overflow-y-auto">
          {query.trim() && !isSearching && results.length === 0 && (
            <EmptyState
              icon={<Compass aria-hidden="true" />}
              title="No matches"
              description="Try a different destination or trip name."
            />
          )}
          {results.length > 0 && (
            <ul className="flex flex-col gap-1" role="listbox" aria-label="Search results">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.href}
                    onClick={close}
                    className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {r.title}
                    {r.description && (
                      <span className="block text-xs text-muted-foreground">{r.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
