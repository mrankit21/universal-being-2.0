"use client";

import { CalendarCheck, MessageCircle, Phone, Share2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStickyCta } from "@/components/layout/sticky-cta-context";
import type { StickyCtaAction, StickyCtaActionType } from "@/types/layout";

const ACTION_ICON: Record<StickyCtaActionType, LucideIcon> = {
  book: CalendarCheck,
  whatsapp: MessageCircle,
  call: Phone,
  share: Share2,
};

const ACTION_VARIANT: Record<StickyCtaActionType, "primary" | "outline"> = {
  book: "primary",
  whatsapp: "outline",
  call: "outline",
  share: "outline",
};

function handleAction(action: StickyCtaAction) {
  if (action.type === "share") {
    if (action.onClick) return action.onClick();
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href }).catch(() => {
        /* user cancelled — no-op */
      });
    }
    return;
  }
  action.onClick?.();
}

/**
 * StickyCtaBar — "visible only when required": renders null until a page
 * calls `useStickyCta().show([...])`. Phase 4 ships the bar and the
 * mechanism only; trip/booking pages (a later phase) are what actually
 * populate it with real Book Now / WhatsApp / Call / Share actions.
 */
export function StickyCtaBar() {
  const { actions } = useStickyCta();

  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        "ub-glass fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border/60 px-4 py-3",
        "pb-[calc(env(safe-area-inset-bottom)+0.75rem)]",
        // Sits above BottomNav's floating pill on mobile.
        "md:bottom-0"
      )}
      role="region"
      aria-label="Trip actions"
    >
      {actions.map((action) => {
        const Icon = ACTION_ICON[action.type];
        const isLink = Boolean(action.href) && action.type !== "share";
        return (
          <Button
            key={action.type}
            variant={ACTION_VARIANT[action.type]}
            className={cn(
              "flex-1 font-bold",
              ACTION_VARIANT[action.type] === "outline" && "border-2 border-foreground/70 text-foreground"
            )}
            asChild={isLink}
            onClick={isLink ? undefined : () => handleAction(action)}
          >
            {isLink ? (
              <a
                href={action.href}
                target={action.type === "whatsapp" ? "_blank" : undefined}
                rel={action.type === "whatsapp" ? "noopener noreferrer" : undefined}
              >
                <Icon className="size-4" aria-hidden="true" />
                {action.label}
              </a>
            ) : (
              <>
                <Icon className="size-4" aria-hidden="true" />
                {action.label}
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
}
