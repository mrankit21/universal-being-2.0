"use client";

/**
 * Feature 3 — Booking Expiry Timer, client-side countdown. Purely a
 * display + `onExpire` callback; the actual expiry (releasing the seat) is
 * always decided server-side (`lib/trip/booking-expiry.ts`) — this
 * component just reflects `reservationExpiresAt` and nudges the caller to
 * re-check with the server once the clock hits zero, since the client
 * clock alone must never be trusted to authorize anything.
 */
import { useEffect, useState } from "react";

export function useCountdown(expiresAt: string | null | undefined) {
  const [msLeft, setMsLeft] = useState<number | null>(() =>
    expiresAt ? new Date(expiresAt).getTime() - Date.now() : null
  );

  useEffect(() => {
    if (!expiresAt) {
      setMsLeft(null);
      return;
    }
    const target = new Date(expiresAt).getTime();
    const tick = () => setMsLeft(target - Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return msLeft;
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface BookingCountdownProps {
  expiresAt: string | null | undefined;
  onExpire?: () => void;
}

export function BookingCountdown({ expiresAt, onExpire }: BookingCountdownProps) {
  const msLeft = useCountdown(expiresAt);

  useEffect(() => {
    if (msLeft !== null && msLeft <= 0) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msLeft !== null && msLeft <= 0]);

  if (msLeft === null) return null;
  const expired = msLeft <= 0;

  return (
    <p className={expired ? "text-sm font-medium text-destructive" : "text-sm font-medium text-amber-700"}>
      {expired ? "Reservation expired" : `Seat reserved — complete payment within ${formatMs(msLeft)}`}
    </p>
  );
}
