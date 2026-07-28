"use client";

import * as React from "react";
import { Check, Copy, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const WHATSAPP_REGEX = /^[6-9]\d{9}$/;

export interface PromoOfferPopupFormProps {
  couponCode: string;
  heading: string;
  description: string;
  /** Resolved trip titles when the coupon is trip-scoped; empty = valid on
   * every trip, so no line is shown at all in that case. */
  tripNames: string[];
  onClaimed: () => void;
}

/**
 * The coupon reveal + two-field lead form inside the promo popup. Split out
 * from `PromoOfferPopup` (the trigger/dialog shell) so the shell can be
 * reused for a different offer/body later without touching this form, and
 * so this form is unit-testable without mounting a Dialog.
 */
export function PromoOfferPopupForm({ couponCode, heading, description, tripNames, onClaimed }: PromoOfferPopupFormProps) {
  const [copied, setCopied] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [whatsappNumber, setWhatsappNumber] = React.useState("");
  const [errors, setErrors] = React.useState<{ fullName?: string; whatsappNumber?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      toast.success("Coupon Copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the code — please copy it manually.");
    }
  }

  function validate() {
    const nextErrors: typeof errors = {};
    if (fullName.trim().length < 2) nextErrors.fullName = "Enter your full name";
    if (!WHATSAPP_REGEX.test(whatsappNumber)) nextErrors.whatsappNumber = "Enter a valid 10-digit WhatsApp number";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/promo-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), whatsappNumber, couponCode, source: "promo-popup" }),
      });
      const json = await res.json();
      if (!json.success) {
        setSubmitError(json.error ?? "Something went wrong — please try again.");
        return;
      }
      toast.success("You're in! Your code is ready to use.");
      onClaimed();
    } catch {
      setSubmitError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-ub-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Limited-Time Offer
        </span>
        <h2 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{heading}</h2>
      </div>

      <div className="rounded-lg border-2 border-dashed border-ub-brass-400/60 bg-ub-brass-300/10 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-lg font-bold tracking-[0.2em] text-ub-brass-600">{couponCode}</span>
          <Button type="button" variant="outline" size="sm" onClick={handleCopyCode} className="shrink-0 gap-1.5">
            {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
            {copied ? "Copied" : "Copy Code"}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Use this code at checkout — limited time</p>
      </div>

      {tripNames.length > 0 ? (
        <p className="flex items-start justify-center gap-1.5 text-center text-sm text-secondary">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Valid on: <span className="font-medium">{tripNames.join(", ")}</span>
          </span>
        </p>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">{description}</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="promo-popup-name" className="sr-only">
            Full Name
          </Label>
          <Input
            id="promo-popup-name"
            placeholder="Your Full Name"
            autoComplete="name"
            required
            invalid={!!errors.fullName}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          {errors.fullName ? <p className="text-sm text-destructive">{errors.fullName}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promo-popup-whatsapp" className="sr-only">
            WhatsApp Number
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="promo-popup-whatsapp"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit WhatsApp Number"
              autoComplete="tel-national"
              required
              invalid={!!errors.whatsappNumber}
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={cn("pl-11")}
            />
          </div>
          {errors.whatsappNumber ? <p className="text-sm text-destructive">{errors.whatsappNumber}</p> : null}
        </div>

        {submitError ? <p className="text-center text-sm text-destructive">{submitError}</p> : null}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Continue &amp; Get Offer
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll only use these details to share your offer — no spam.
        </p>
      </form>
    </div>
  );
}
