"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { DialogOverlay } from "@/components/ui/dialog";
import { usePromoPopupTrigger } from "@/hooks/use-promo-popup-trigger";
import { usePopupActiveCoupon } from "@/hooks/use-popup-active-coupon";
import { PromoOfferPopupForm } from "@/components/marketing/promo-offer-popup-form";
import { cn } from "@/lib/utils";

export interface PromoOfferPopupProps {
  heading?: string;
  /** Delay before the popup opens, in ms. Requirement: 10–15s after landing. */
  delayMs?: number;
}

/**
 * PromoOfferPopup — the site-wide promotional popup (reference: attached
 * screenshot). Mounted once in `RootShell`, same pattern as
 * `CustomerAuthModal`/`GlobalSearchModal`: this component owns its own
 * open/close state via `usePromoPopupTrigger` rather than needing a
 * provider, since nothing else in the app needs to open it.
 *
 * The actual on/off switch lives in the admin Coupons page, not here: this
 * component never opens unless `usePopupActiveCoupon` finds a coupon with
 * `showInPopup: true` (see `/api/coupons/popup-active`). Toggling that flag
 * off in the admin panel means this component renders nothing on the very
 * next page load — no code deploy needed to turn the popup off.
 *
 * When the active coupon is scoped to exactly one trip, claiming the offer
 * also navigates the visitor straight to that trip's page (`singleTripSlug`
 * from the API) — the coupon code is already remembered client-side by
 * `PromoOfferPopupForm` at that point, so `BookingForm` on the trip page
 * finds and auto-applies it without the visitor retyping anything. For
 * all-trips or multi-trip coupons there's no single unambiguous
 * destination, so claiming just closes the popup, same as before.
 *
 * Reuses `DialogOverlay` from `components/ui/dialog` (dark semi-transparent
 * background, already animated) but rolls its own `Dialog.Content` instead
 * of the shared `DialogContent` — this popup needs a different shell (a
 * close button that floats over the corner rather than sitting inside the
 * padding, no default max-width) that would have meant adding one-off props
 * to the shared primitive every other modal in the app also uses.
 *
 * Deliberately hidden on `/admin/**` — this is a customer-facing marketing
 * surface, not something an admin editing the site should ever see pop up.
 */
export function PromoOfferPopup({
  heading = "Unlock Your Special Offer",
  delayMs = 12000,
}: PromoOfferPopupProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const { coupon } = usePopupActiveCoupon();
  // `coupon` is `undefined` while the admin's popup-coupon check is still
  // loading and `null` once it's confirmed there isn't one — both disable
  // the timer, so the popup never opens without a coupon to show.
  const { isOpen, close } = usePromoPopupTrigger({ delayMs, disabled: isAdminRoute || !coupon });
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) setOpen(true);
  }, [isOpen]);

  if (isAdminRoute || !coupon) return null;

  const description = coupon.description || "Apply this code at checkout to claim your discount.";

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) close();
  }

  function handleClaimed() {
    if (coupon?.singleTripSlug) {
      handleOpenChange(false);
      router.push(`/trips/${coupon.singleTripSlug}`);
      return;
    }
    handleOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-border bg-card shadow-ub-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-ub-base ease-ub-emphasized"
          )}
        >
          <div className="h-1.5 w-full rounded-t-xl bg-gradient-to-r from-ub-brass-400 via-ub-brass-500 to-ub-teal-500" />

          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              "absolute -right-3 -top-3 inline-flex size-9 items-center justify-center rounded-ub-full",
              "border border-border bg-card text-foreground shadow-ub-md transition-transform duration-ub-fast",
              "hover:scale-105 hover:bg-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>

          <div className="px-6 py-8 sm:px-8">
            <DialogPrimitive.Title asChild>
              <span className="sr-only">{heading}</span>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description asChild>
              <span className="sr-only">{description}</span>
            </DialogPrimitive.Description>

            <PromoOfferPopupForm
              couponCode={coupon.code}
              heading={heading}
              description={description}
              tripNames={coupon.tripNames}
              onClaimed={handleClaimed}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
