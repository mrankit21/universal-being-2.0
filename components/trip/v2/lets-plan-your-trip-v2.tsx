"use client";

import * as React from "react";
import { Phone, User, MapPin, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_REGEX = /^[6-9]\d{9}$/;

/**
 * Trip 2.0 UI — "Let's Plan Your Trip", a compact lead-capture section
 * for the person who has scrolled the whole page and is still on the
 * fence about booking. Sits right after "Did You Know" per Ankit's
 * placement request (2026-07): catches them at the natural end-of-page
 * decision point, right before FAQ, with a low-friction way to ask for
 * a callback instead of committing to a full booking.
 *
 * Deliberately kept small — one card, four fields, no illustration or
 * big hero treatment ("jyada bada bhi nahi, na hi jyada bubble") — but
 * with a warm accent background and a gold border so it still stands
 * out against the plain sections around it.
 *
 * Now backend-connected (2026-08): submits to `/api/trip2-leads`, which
 * writes a `Trip2Lead` document. WhatsApp number is stripped to bare
 * digits client-side, same convention as the site-wide promo popup
 * (`components/marketing/promo-offer-popup-form.tsx`). Best-effort by
 * design — a failed request shows a toast and leaves the form open to
 * retry rather than silently pretending it worked.
 */
export function LetsPlanYourTripV2({
  destination,
  tripSlug,
  backgroundImageUrl,
  backgroundImageAlt,
  overlayOpacity = 45,
}: {
  destination?: string;
  tripSlug?: string;
  /** Optional full-bleed backdrop behind the card — e.g. a desert/camel
   * shot. Unset keeps the plain gold-gradient card look. */
  backgroundImageUrl?: string;
  backgroundImageAlt?: string;
  /** 0-100 darkening strength over the photo (black overlay, keeps the
   * white lead-capture card readable). Defaults to 45, the original
   * hardcoded value — matches the 1-7 step admins pick in Admin →
   * Trip 2.0 Backdrops for the "Still Deciding?" section. */
  overlayOpacity?: number;
}) {
  const hasImage = Boolean(backgroundImageUrl);
  const clampedOverlay = Math.min(100, Math.max(0, overlayOpacity));
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  // Editable, not a fixed label — this form is shown site-wide (homepage,
  // any trip page), not just on Spiti Valley, so the person types in
  // whichever trip/destination they're actually asking about. When a
  // specific trip page passes `destination`, it just pre-fills this field
  // (still editable) rather than locking it.
  const [destinationInput, setDestinationInput] = React.useState(destination ?? "");
  const [travelTiming, setTravelTiming] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dateInputRef = React.useRef<HTMLInputElement | null>(null);
  const todayISO = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    el.focus();
    // showPicker() opens the browser's real calendar UI on tap/click;
    // fall back silently on browsers that don't support it (focus alone
    // is enough to open the native picker on most mobile browsers).
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch {
        // ignore — some browsers throw if not called from a direct user gesture
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    if (!WHATSAPP_REGEX.test(whatsapp)) {
      setError("Enter a valid 10-digit WhatsApp number.");
      return;
    }
    if (destinationInput.trim().length < 2) {
      setError("Tell us which trip you're interested in.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trip2-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          whatsappNumber: whatsapp,
          destination: destinationInput.trim(),
          travelTiming: travelTiming.trim() || undefined,
          tripSlug,
          source: "trip2-lets-plan-your-trip",
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Couldn't send that — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const cardContent = (
    <div
      className={cn(
        "relative mx-auto max-w-md overflow-hidden rounded-2xl border",
        hasImage
          ? "border-white/25 bg-white/90 backdrop-blur-sm"
          : "border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-card"
      )}
    >
      <div className="px-5 pb-1.5 pt-5 sm:px-6 sm:pt-6">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Still deciding?</span>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">Let&apos;s Plan Your Trip</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Share a few details and our travel expert will call you back to help you plan.
        </p>
      </div>

      {submitted ? (
        <div className="mx-5 mb-5 mt-3 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success sm:mx-6">
          Thanks! Our travel expert will call you shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5">
              <User className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                name="name"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5">
              <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="shrink-0 text-sm text-muted-foreground">+91</span>
              <input
                type="tel"
                name="whatsapp"
                inputMode="numeric"
                maxLength={10}
                required
                placeholder="WhatsApp number"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5">
              <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                name="destination"
                required
                placeholder="Which trip are you interested in?"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            <label className="relative flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5">
              <button
                type="button"
                onClick={openDatePicker}
                aria-label="Open calendar"
                className="shrink-0 text-muted-foreground"
              >
                <Calendar className="size-4" aria-hidden="true" />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                name="travelTiming"
                min={todayISO}
                aria-label="When are you planning to go?"
                value={travelTiming}
                onChange={(e) => setTravelTiming(e.target.value)}
                onClick={openDatePicker}
                className={cn(
                  "w-full bg-transparent text-sm text-foreground focus:outline-none",
                  "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                  !travelTiming && "text-muted-foreground"
                )}
              />
              {!travelTiming ? (
                <span className="pointer-events-none absolute left-10 text-sm text-muted-foreground">
                  When are you planning to go?
                </span>
              ) : null}
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-0.5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? "Sending…" : "Request a Callback"}
          </button>
        </form>
      )}
    </div>
  );

  if (!hasImage) {
    return (
      <section id="lets-plan-your-trip" className="relative w-full px-4 py-8 sm:px-6 sm:py-10">
        {cardContent}
      </section>
    );
  }

  return (
    <section id="lets-plan-your-trip" className="relative isolate w-full overflow-hidden">
      {/* Plain <img> in normal flow (not absolute/object-cover) — the
       * section's height comes FROM the image at its natural aspect
       * ratio, so a tall backdrop (e.g. a portrait desert/camel shot)
       * renders full-height without any cropping. Ankit (2026-08): "jitni
       * lambi photo hai utna lamba section hona chahiye". */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={backgroundImageUrl} alt={backgroundImageAlt ?? ""} className="block w-full h-auto" loading="lazy" />
      <div className="absolute inset-0 bg-black" style={{ opacity: clampedOverlay / 100 }} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10">{cardContent}</div>
    </section>
  );
}
