"use client";

import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * BackToTopButton — footer's closing action, matching the rounded pill
 * "Back to top" pattern from the brand reference. Kept as its own tiny
 * client leaf (same pattern as `NewsletterForm`) so `SiteFooter` itself
 * can stay an async Server Component.
 */
export function BackToTopButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="rounded-full border-white/30 bg-transparent text-foreground hover:bg-white/10"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      Back to top
      <ArrowUp className="size-4" aria-hidden="true" />
    </Button>
  );
}
