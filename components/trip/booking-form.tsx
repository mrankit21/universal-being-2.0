"use client";

/**
 * Booking Engine — Book Your Slot / Booking Expiry Timer (Phase 8).
 *
 * A single `useFieldArray` drives the "Automatically generate traveller
 * cards" requirement: changing "Number of Travellers" resizes the array in
 * place, so all previously entered rows survive. Every derived number
 * (offer price, discount, booking amount, remaining amount) is recomputed
 * on every render via `computeBookingPricing` — the exact same pure
 * function the server uses — so the live summary can never say one thing
 * while the API charges another.
 *
 * `POST /api/bookings` now reserves the seat for a limited (config-driven)
 * window and, when Razorpay is configured, returns an order for the "Book
 * Your Slot" amount — this component opens Razorpay Checkout for it and
 * reports success to `POST /api/bookings/[id]/verify-payment`. If the
 * countdown reaches zero before payment completes, the server has already
 * released the seat automatically; the UI just reflects that.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Loader2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import type { Trip } from "@/types/trip";
import { getTripAvailability } from "@/lib/trip/availability";
import { computeBookingPricing } from "@/lib/trip/booking-pricing";
import { bookingCreateSchema, type BookingCreateInput } from "@/lib/validators/booking.schema";
import { getRememberedCoupon, forgetRememberedCoupon } from "@/lib/promo/coupon-storage";
import { Price } from "@/components/primitives/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormField } from "@/components/admin/form-field";
import { BookingCountdown } from "@/components/trip/booking-countdown";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ID_PROOF_TYPES = ["Aadhaar Card", "Passport", "Voter ID", "Driving Licence", "PAN Card"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export interface BookingFormProps {
  trip: Trip;
  initialDepartureId?: string;
  /** Pickup Variant Architecture (2026-07). Optional — when the visitor
   * arrived via a specific pickup city (`TripBookingCard`/`TripPricingTable`
   * pass this through as `?pickup=`), narrows the departure dropdown to
   * just that variant's own batches so a Delhi-pickup batch can't get mixed
   * up with a Jaipur-pickup one. Omitted entirely, this shows every
   * upcoming batch exactly as it always has. */
  pickupVariantId?: string;
}

export function BookingForm({ trip, initialDepartureId, pickupVariantId }: BookingFormProps) {
  const router = useRouter();
  const { upcomingDepartures } = getTripAvailability(trip);
  const bookableDepartures = upcomingDepartures
    .filter((d) => d.status === "open" || d.status === "filling-fast")
    .filter((d) => !pickupVariantId || d.pickupVariantId === pickupVariantId);

  const defaultDepartureId =
    (initialDepartureId && bookableDepartures.some((d) => d.id === initialDepartureId)
      ? initialDepartureId
      : bookableDepartures[0]?.id) ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [payingNow, setPayingNow] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    totalAmount: number;
    bookingAmountDue: number;
    remainingAmount: number;
    currency: string;
    reservationExpiresAt: string | null;
    razorpayOrder: { id: string; amount: number; currency: string; keyId: string } | null;
    paymentComplete: boolean;
    expired: boolean;
  } | null>(null);

  function openRazorpayCheckout() {
    if (!confirmation?.razorpayOrder || !window.Razorpay) return;
    const order = confirmation.razorpayOrder;
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: trip.title,
      description: "Book Your Slot",
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setPayingNow(true);
        try {
          const res = await fetch(`/api/bookings/${confirmation.id}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const json = await res.json();
          if (!json.success) {
            toast.error(json.error ?? "Payment verification failed.");
            router.push(`/bookings/${confirmation.id}/failed`);
            return;
          }
          toast.success("Payment received — your slot is confirmed!");
          setConfirmation((prev) => (prev ? { ...prev, paymentComplete: true } : prev));
          router.push(`/bookings/${confirmation.id}/success`);
        } finally {
          setPayingNow(false);
        }
      },
      modal: { ondismiss: () => setPayingNow(false) },
    });
    rzp.open();
  }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BookingCreateInput>({
    resolver: zodResolver(bookingCreateSchema),
    defaultValues: {
      tripId: trip.id,
      tripSlug: trip.slug,
      departureDateId: defaultDepartureId,
      pickupVariantId: pickupVariantId,
      sharingType: "quad",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerCity: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      specialRequests: "",
      travelers: [{ fullName: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "travelers" });

  const departureDateId = watch("departureDateId");
  const travelers = watch("travelers");
  const customerEmail = watch("customerEmail");
  const sharingType = watch("sharingType") || "quad";
  const selectedDeparture = bookableDepartures.find((d) => d.id === departureDateId) ?? null;

  const pricing = useMemo(
    () => computeBookingPricing(trip, selectedDeparture, travelers?.length || 1, sharingType),
    [trip, selectedDeparture, travelers?.length, sharingType]
  );

  // Room Sharing markup (2026-07). Only worth showing the picker at all
  // when the trip actually has a markup configured for at least one of
  // Double/Triple — a trip with no `sharingTypeMarkup` just books at the
  // Quad (base) price exactly as before, no new UI in the way.
  const sharingMarkup = trip.price.sharingTypeMarkup;
  const hasSharingOptions = Boolean(sharingMarkup?.double || sharingMarkup?.triple);

  // --- Coupon: manual "Have a coupon code?" field + auto-prefill from a
  // code the visitor copied out of the promo popup earlier
  // (`lib/promo/coupon-storage.ts`). Auto-fill only ever fills the input;
  // it never applies a discount without a round-trip to
  // `/api/coupons/validate`, and that round-trip only fires once a valid
  // email is present (the endpoint requires one for per-user-limit checks).
  const [couponInput, setCouponInput] = useState("");
  const [couponAutoFilled, setCouponAutoFilled] = useState(false);
  const [couponStatus, setCouponStatus] = useState<"idle" | "checking" | "applied" | "error">("idle");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const autoApplyAttempted = useRef(false);

  useEffect(() => {
    const remembered = getRememberedCoupon();
    if (remembered) {
      setCouponInput(remembered);
      setCouponAutoFilled(true);
    }
  }, []);

  async function applyCoupon(rawCode: string, opts: { silent?: boolean } = {}) {
    const code = rawCode.trim();
    if (!code) return;
    const email = getValues("customerEmail");
    if (!email || !EMAIL_REGEX.test(email)) {
      if (!opts.silent) toast.error("Enter your email above first, then apply the coupon.");
      return;
    }
    setCouponStatus("checking");
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          tripId: trip.id,
          customerEmail: email,
          amount: pricing.bookingAmountDue,
        }),
      });
      const json = await res.json();
      if (!json.success || !json.data.valid) {
        setCouponStatus("error");
        setCouponError(json.data?.reason ?? json.error ?? "This coupon isn't valid.");
        setValue("couponCode", undefined);
        return;
      }
      setCouponStatus("applied");
      setAppliedCode(json.data.code ?? code.toUpperCase());
      setAppliedDiscount(json.data.discountAmount ?? 0);
      setValue("couponCode", json.data.code ?? code);
      if (!opts.silent) toast.success("Coupon applied!");
    } catch {
      setCouponStatus("error");
      setCouponError("Couldn't check this coupon right now — please try again.");
    }
  }

  function removeCoupon() {
    setCouponStatus("idle");
    setCouponError(null);
    setAppliedDiscount(0);
    setAppliedCode(null);
    setCouponInput("");
    setCouponAutoFilled(false);
    setValue("couponCode", undefined);
    forgetRememberedCoupon();
  }

  // Fires once: the moment a prefilled code is present *and* the customer
  // has typed a valid email, try it silently — "auto-prefill, user just
  // confirms" rather than making them retype the code they already copied.
  // A failure here just leaves the field editable with the error shown; it
  // never blocks the booking.
  useEffect(() => {
    if (autoApplyAttempted.current) return;
    if (!couponAutoFilled || !couponInput) return;
    if (!customerEmail || !EMAIL_REGEX.test(customerEmail)) return;
    autoApplyAttempted.current = true;
    applyCoupon(couponInput, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerEmail, couponAutoFilled, couponInput]);

  const effectiveCouponDiscount = couponStatus === "applied" ? appliedDiscount : 0;
  const displayBookingAmountDue = Math.max(0, pricing.bookingAmountDue - effectiveCouponDiscount);
  const displayRemainingAmount = Math.max(0, pricing.totalAmount - effectiveCouponDiscount - displayBookingAmountDue);

  const maxSeats = selectedDeparture?.seatsAvailable ?? trip.availableSeats ?? 1;

  function setTravellerCount(count: number) {
    const next = Math.max(1, Math.min(maxSeats || 1, count));
    if (next > fields.length) {
      for (let i = fields.length; i < next; i++) append({ fullName: "" });
    } else if (next < fields.length) {
      for (let i = fields.length - 1; i >= next; i--) remove(i);
    }
  }

  async function onSubmit(data: BookingCreateInput) {
    if (!selectedDeparture) {
      toast.error("Please select a departure batch.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Could not submit booking. Please try again.");
        if (res.status === 409) router.refresh();
        return;
      }
      if (data.couponCode) forgetRememberedCoupon();
      setConfirmation({
        id: json.data.id,
        totalAmount: json.data.totalAmount,
        bookingAmountDue: json.data.bookingAmountDue,
        remainingAmount: json.data.remainingAmount,
        currency: json.data.currency,
        reservationExpiresAt: json.data.reservationExpiresAt ?? null,
        razorpayOrder: json.data.razorpayOrder ?? null,
        paymentComplete: false,
        expired: false,
      });
    } catch {
      toast.error("Something went wrong submitting your booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              {confirmation.paymentComplete ? "Slot booked 🎉" : "Seat reserved"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {confirmation.paymentComplete ? (
              <div className="text-muted-foreground">
                Your Book Your Slot payment for <span className="font-medium text-foreground">{trip.title}</span>{" "}
                is <Badge variant="success">Confirmed</Badge>. The remaining balance is payable as{" "}
                <span className="font-medium text-foreground">Cash During Trip</span> (travelling bus / tour start).
              </div>
            ) : confirmation.expired ? (
              <p className="text-destructive">
                Your reservation window expired before payment was completed, so the seat was released
                automatically. Please submit the booking again to reserve a seat.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Your seat for <span className="font-medium text-foreground">{trip.title}</span> is temporarily
                reserved. Complete the Book Your Slot payment before the timer runs out to keep it.
              </p>
            )}

            {!confirmation.expired ? (
              <BookingCountdown
                expiresAt={confirmation.paymentComplete ? null : confirmation.reservationExpiresAt}
                onExpire={() => setConfirmation((prev) => (prev && !prev.paymentComplete ? { ...prev, expired: true } : prev))}
              />
            ) : null}

            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p>
                Reference ID: <span className="font-mono text-foreground">{confirmation.id}</span>
              </p>
              <p>Total amount: {formatMoney(confirmation.totalAmount, confirmation.currency)}</p>
              <p>Book Your Slot amount: {formatMoney(confirmation.bookingAmountDue, confirmation.currency)}</p>
              <p>Remaining amount (Cash During Trip): {formatMoney(confirmation.remainingAmount, confirmation.currency)}</p>
            </div>

            {!confirmation.paymentComplete && !confirmation.expired ? (
              confirmation.razorpayOrder ? (
                <Button className="w-full" onClick={openRazorpayCheckout} disabled={payingNow}>
                  {payingNow ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  Pay {formatMoney(confirmation.bookingAmountDue, confirmation.currency)} to confirm your slot
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Online payment isn&apos;t configured yet — our team will reach out on the phone number and email
                  you provided to collect the Book Your Slot amount before the reservation expires.
                </p>
              )
            ) : null}
          </CardContent>
        </Card>
      </>
    );
  }

  if (bookableDepartures.length === 0) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          There are no open batches to book right now for {trip.title}. Please check back soon or contact us on
          WhatsApp for the next available dates.
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Choose your departure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Departure batch" error={errors.departureDateId?.message}>
              <Controller
                control={control}
                name="departureDateId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookableDepartures.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {formatDate(d.startDate)} – {formatDate(d.endDate)} · {d.seatsAvailable} seats left
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            {selectedDeparture ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatDate(selectedDeparture.startDate)} – {formatDate(selectedDeparture.endDate)} ·{" "}
                {selectedDeparture.seatsAvailable} of {selectedDeparture.seatsTotal} seats available
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Your details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" error={errors.customerName?.message} className="sm:col-span-2">
              <Input {...register("customerName")} placeholder="Full name" />
            </FormField>
            <FormField label="Email" error={errors.customerEmail?.message}>
              <Input type="email" {...register("customerEmail")} placeholder="you@example.com" />
            </FormField>
            <FormField label="Phone number" error={errors.customerPhone?.message}>
              <Input {...register("customerPhone")} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Gender" error={errors.customerGender?.message}>
              <Controller
                control={control}
                name="customerGender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Age" error={errors.customerAge?.message}>
              <Input
                type="number"
                min={1}
                {...register("customerAge", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                placeholder="Age"
              />
            </FormField>
            <FormField label="City" error={errors.customerCity?.message} className="sm:col-span-2">
              <Input {...register("customerCity")} placeholder="Your city" />
            </FormField>
            <FormField label="Emergency contact name" error={errors.emergencyContactName?.message}>
              <Input {...register("emergencyContactName")} placeholder="Contact name" />
            </FormField>
            <FormField label="Emergency contact phone" error={errors.emergencyContactPhone?.message}>
              <Input {...register("emergencyContactPhone")} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Special requests" className="sm:col-span-2">
              <Textarea rows={3} {...register("specialRequests")} placeholder="Dietary needs, accessibility, anything else we should know" />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="font-display text-base">Travellers</CardTitle>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
              <Input
                type="number"
                min={1}
                max={maxSeats}
                value={fields.length}
                onChange={(e) => setTravellerCount(Number(e.target.value) || 1)}
                className="w-20"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.travelers?.message ? (
              <p className="text-xs text-destructive">{errors.travelers.message}</p>
            ) : null}
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-border p-4">
                <p className="mb-3 text-sm font-medium text-foreground">Traveller {index + 1}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="Full name"
                    error={errors.travelers?.[index]?.fullName?.message}
                    className="sm:col-span-2"
                  >
                    <Input {...register(`travelers.${index}.fullName` as const)} placeholder="Traveller full name" />
                  </FormField>
                  <FormField label="Age" error={errors.travelers?.[index]?.age?.message}>
                    <Input
                      type="number"
                      min={1}
                      {...register(`travelers.${index}.age` as const, {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      })}
                      placeholder="Age"
                    />
                  </FormField>
                  <FormField label="Gender">
                    <Controller
                      control={control}
                      name={`travelers.${index}.gender` as const}
                      render={({ field: f }) => (
                        <Select value={f.value ?? ""} onValueChange={f.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <FormField label="Government ID type">
                    <Controller
                      control={control}
                      name={`travelers.${index}.idProofType` as const}
                      render={({ field: f }) => (
                        <Select value={f.value ?? ""} onValueChange={f.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ID_PROOF_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <FormField label="Government ID number">
                    <Input {...register(`travelers.${index}.idProofNumber` as const)} placeholder="ID number" />
                  </FormField>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Booking summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium text-foreground">{trip.title}</p>
            {selectedDeparture ? (
              <p className="text-muted-foreground">
                {formatDate(selectedDeparture.startDate)} – {formatDate(selectedDeparture.endDate)}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              Travellers: <span className="font-medium text-foreground">{pricing.travellers}</span>
            </p>

            {hasSharingOptions ? (
              <div className="space-y-2 border-t border-border pt-3">
                <label htmlFor="booking-sharing-type" className="text-sm font-medium text-foreground">
                  Room Sharing
                </label>
                <Controller
                  control={control}
                  name="sharingType"
                  render={({ field: f }) => (
                    <Select value={f.value ?? "quad"} onValueChange={f.onChange}>
                      <SelectTrigger id="booking-sharing-type">
                        <SelectValue placeholder="Select room sharing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quad">Quad Sharing</SelectItem>
                        {sharingMarkup?.double ? (
                          <SelectItem value="double">
                            Double Sharing (+{formatMoney(sharingMarkup.double, pricing.currency)}/person)
                          </SelectItem>
                        ) : null}
                        {sharingMarkup?.triple ? (
                          <SelectItem value="triple">
                            Triple Sharing (+{formatMoney(sharingMarkup.triple, pricing.currency)}/person)
                          </SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            <div className="flex items-baseline justify-between gap-2 border-t border-border pt-3">
              <span className="text-muted-foreground">Price / person</span>
              <Price amount={pricing.offerPrice} originalAmount={pricing.originalPrice ?? undefined} size="sm" />
            </div>
            {pricing.sharingTypeMarkupPerPerson > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {pricing.sharingType === "double" ? "Double" : "Triple"} sharing charge
                </span>
                <span className="font-medium text-foreground">
                  +{formatMoney(pricing.sharingTypeMarkupPerPerson * pricing.travellers, pricing.currency)}
                </span>
              </div>
            ) : null}
            {pricing.discountAmount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-emerald-600">
                  -{formatMoney(pricing.discountAmount, pricing.currency)}
                </span>
              </div>
            ) : null}

            <div className="space-y-2 border-t border-border pt-3">
              <label htmlFor="booking-coupon-code" className="text-sm font-medium text-foreground">
                Have a coupon code?
              </label>
              <div className="flex gap-2">
                <Input
                  id="booking-coupon-code"
                  placeholder="Enter coupon code"
                  value={couponInput}
                  disabled={couponStatus === "applied"}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponAutoFilled(false);
                    if (couponStatus !== "idle") {
                      setCouponStatus("idle");
                      setCouponError(null);
                    }
                  }}
                  className="flex-1"
                />
                {couponStatus === "applied" ? (
                  <Button type="button" variant="outline" size="sm" onClick={removeCoupon}>
                    Remove
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={couponStatus === "checking" || !couponInput.trim()}
                    onClick={() => applyCoupon(couponInput)}
                  >
                    {couponStatus === "checking" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : "Apply"}
                  </Button>
                )}
              </div>
              {couponAutoFilled && couponStatus !== "applied" ? (
                <p className="flex items-center gap-1 text-xs text-secondary">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Filled in from the offer you copied earlier — enter your email above, then Apply.
                </p>
              ) : null}
              {couponStatus === "applied" && appliedCode ? (
                <p className="text-xs font-medium text-emerald-600">
                  “{appliedCode}” applied — you&apos;re saving {formatMoney(appliedDiscount, pricing.currency)}.
                </p>
              ) : null}
              {couponStatus === "error" && couponError ? (
                <p className="text-xs text-destructive">{couponError}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Total amount</span>
              <span className="font-semibold text-foreground">{formatMoney(pricing.totalAmount, pricing.currency)}</span>
            </div>
            {effectiveCouponDiscount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Coupon discount</span>
                <span className="font-medium text-emerald-600">-{formatMoney(effectiveCouponDiscount, pricing.currency)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Book Your Slot amount (due now)</span>
              <span className="font-medium text-foreground">{formatMoney(displayBookingAmountDue, pricing.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining amount (Cash During Trip)</span>
              <span className="font-medium text-foreground">{formatMoney(displayRemainingAmount, pricing.currency)}</span>
            </div>
            {selectedDeparture ? (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Seats available</span>
                <span className="font-medium text-foreground">{selectedDeparture.seatsAvailable}</span>
              </div>
            ) : null}

            <input type="hidden" {...register("tripId")} />
            <input type="hidden" {...register("tripSlug")} />
            <input type="hidden" {...register("couponCode")} />
            <Button type="submit" className="w-full" disabled={submitting || !selectedDeparture}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Book Now
            </Button>
            <p className="text-xs text-muted-foreground">
              This reserves your seat for a limited time so you can complete the Book Your Slot payment. If payment
              isn&apos;t completed in time, the reservation expires automatically and the seat is released.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}