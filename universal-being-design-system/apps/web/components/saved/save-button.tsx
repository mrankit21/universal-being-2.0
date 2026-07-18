"use client";

import * as React from "react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSaved, type SavedItemType } from "@/components/saved/saved-context";
import { useCustomerAuth } from "@/components/layout/customer-auth-context";

export interface SaveButtonProps {
  itemType: SavedItemType;
  itemSlug: string;
  itemLabel: string;
  className?: string;
}

/**
 * SaveButton — the ❤️ save/unsave control for trip + destination cards.
 * Sits absolutely-positioned in a card's image corner (caller supplies
 * `className` for placement). Logged-out visitors get the login modal
 * instead of a 401 — same pattern as any other "sign in to do X" prompt
 * (see customer-auth-context.tsx's own doc comment).
 */
export function SaveButton({ itemType, itemSlug, itemLabel, className }: SaveButtonProps) {
  const { isSaved, toggle } = useSaved();
  const { open: openAuthModal } = useCustomerAuth();
  const [isPending, setIsPending] = React.useState(false);
  const saved = isSaved(itemType, itemSlug);

  const handleClick = React.useCallback(
    async (e: React.MouseEvent) => {
      // Cards wrap the whole thumbnail in a <Link> — stop the save tap
      // from also navigating to the trip/destination page.
      e.preventDefault();
      e.stopPropagation();
      if (isPending) return;

      setIsPending(true);
      const result = await toggle(itemType, itemSlug);
      setIsPending(false);

      if (result === "login-required") openAuthModal("login");
    },
    [isPending, toggle, itemType, itemSlug, openAuthModal]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${itemLabel} from saved` : `Save ${itemLabel}`}
      className={cn(
        "z-10 flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background disabled:opacity-70",
        className
      )}
    >
      <Heart className={cn("size-4 transition-colors", saved ? "fill-destructive text-destructive" : "text-foreground")} aria-hidden="true" />
    </button>
  );
}
