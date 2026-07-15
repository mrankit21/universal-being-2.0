import Link from "next/link";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/primitives/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Not Found Layout — Next.js's `not-found.tsx` convention, rendered for
 * any unmatched route (and by explicit `notFound()` calls in future trip/
 * destination pages, e.g. an unknown trip slug).
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-6">
      <EmptyState
        icon={<Compass aria-hidden="true" />}
        title="We couldn't find that page"
        description="The trip or page you're looking for may have moved or no longer exists."
        action={
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        }
        className="w-full"
      />
    </div>
  );
}
