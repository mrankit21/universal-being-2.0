import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading Layout — Next.js's `loading.tsx` file convention: automatically
 * wraps the page in a Suspense boundary and renders this while the route
 * segment loads. Skeleton shapes are deliberately generic (a hero band + a
 * card grid) since this fires for any route under the app — a page-
 * specific loading state can still add its own nested `loading.tsx` later
 * without touching this one.
 */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
