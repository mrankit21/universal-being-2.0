"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Reusable delete/destructive-action confirmation — every "Delete" button
 * across the Admin Panel (trips, destinations, users, media) opens this
 * instead of a bespoke modal.
 *
 * Security fix: a stray tap on the trash icon (easy to do on a phone —
 * the Actions column sits right next to Publish/Unpublish) used to be one
 * more tap away from actually deleting something. Every confirm now
 * requires typing the logged-in admin's own current password, checked
 * against `/api/admin/auth/verify-password` — `onConfirm` never runs
 * until that check passes. Pass `requirePassword={false}` to opt a
 * specific dialog out (none currently do; every existing usage is a
 * delete action). */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  requirePassword = true,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  requirePassword?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPassword("");
    setShowPassword(false);
    setError(null);
  }

  async function handleConfirm() {
    setError(null);
    if (requirePassword && !password) {
      setError("Enter your password to confirm.");
      return;
    }
    setLoading(true);
    try {
      if (requirePassword) {
        const res = await fetch("/api/admin/auth/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.error ?? "Password is incorrect");
          return;
        }
      }
      await onConfirm();
      setOpen(false);
      reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requirePassword && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-dialog-password">Enter your password to confirm</Label>
            <div className="relative">
              <Input
                id="confirm-dialog-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleConfirm();
                }}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
