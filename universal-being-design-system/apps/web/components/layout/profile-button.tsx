"use client";

import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

/**
 * ProfileButton — "Profile Button (future ready)" per the Phase 4 brief.
 * Accounts/auth don't exist yet, so this renders now (so the header's
 * final layout is already correct) but stays disabled with a tooltip
 * explaining why, rather than linking to a page that doesn't exist.
 * Swapping in real auth later only touches this one file.
 */
export function ProfileButton() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-disabled="true"
            aria-label="Account — coming soon"
            className="shrink-0 cursor-not-allowed opacity-60"
            onClick={(e) => e.preventDefault()}
          >
            <User className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Accounts are coming soon</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
