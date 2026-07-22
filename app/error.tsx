"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/primitives/error-state";

/**
 * Error Layout — Next.js's `error.tsx` convention. Must be a Client
 * Component (the framework requirement, not a Phase 4 choice) since it
 * receives an error boundary's `reset()` callback. Logs to the console for
 * now; swap in a real error-reporting call once one exists — the
 * component contract (error, reset) won't change.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-6">
      <ErrorState
        title="This page hit a snag"
        description="Something went wrong loading this page. Try again, or head back home."
        onRetry={reset}
        retryLabel="Try again"
        className="w-full"
      />
    </div>
  );
}
