"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface NewsletterFormProps {
  /** Real subscribe endpoint plugs in here later; contract stays (email) => Promise<void>. */
  onSubscribe?: (email: string) => Promise<void>;
}

type Status = "idle" | "submitting" | "success" | "error";

/**
 * NewsletterForm — the footer's email capture. No backend exists yet, so
 * `onSubscribe` defaults to a resolved promise; wiring the real API later
 * only means passing a prop, the form UI/validation doesn't change.
 */
export function NewsletterForm({ onSubscribe }: NewsletterFormProps) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    try {
      await (onSubscribe ? onSubscribe(email) : Promise.resolve());
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Label htmlFor="newsletter-email" className="text-sm font-semibold text-white drop-shadow-sm">
        Get trip drops in your inbox
      </Label>
      <div className="flex gap-2">
        <Input
          id="newsletter-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="max-w-xs rounded-full border-white/30 bg-white/10 text-white shadow-lg backdrop-blur-md placeholder:text-white/70 focus-visible:ring-white/60 focus-visible:ring-offset-0"
        />
        <Button
          type="submit"
          size="icon"
          disabled={status === "submitting"}
          aria-label="Subscribe"
          className="shrink-0 rounded-full border border-white/30 bg-white/10 text-white shadow-lg backdrop-blur-md hover:bg-white/20 focus-visible:ring-white/60 focus-visible:ring-offset-0"
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <p role="status" aria-live="polite" className="min-h-[1rem] text-xs text-white/80 drop-shadow-sm">
        {status === "success" && "You're subscribed."}
        {status === "error" && "Something went wrong — try again."}
      </p>
    </form>
  );
}
