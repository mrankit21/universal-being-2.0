"use client";

/**
 * "Login another way" modal — Mobile OTP, dev-only Secret Code, and a
 * Google placeholder. Every successful path here ends the same way as the
 * primary email/password form: `router.push(next); router.refresh();`,
 * because every backing route issues an identical session via
 * `issueLoginSession` (see `lib/auth/issue-login-session.ts`).
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Smartphone, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AuthMethods {
  otp: boolean;
  secretCode: boolean;
  google: boolean;
}

export function AlternateLoginModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [methods, setMethods] = useState<AuthMethods | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/auth/methods")
      .then((r) => r.json())
      .then((json) => json.success && setMethods(json.data))
      .catch(() => setMethods({ otp: true, secretCode: false, google: false }));
  }, [open]);

  function completeLogin() {
    onOpenChange(false);
    router.push(searchParams.get("next") || "/admin");
    router.refresh();
  }

  const defaultTab = methods?.otp === false && methods?.secretCode ? "secret" : "otp";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Login another way</DialogTitle>
          <DialogDescription>Alternate sign-in methods for the Universal Being Admin Panel.</DialogDescription>
        </DialogHeader>

        {!methods ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading options…</p>
        ) : (
          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full">
              <TabsTrigger value="otp" className="flex-1 gap-1.5">
                <Smartphone className="size-4" /> Mobile OTP
              </TabsTrigger>
              {methods.secretCode && (
                <TabsTrigger value="secret" className="flex-1 gap-1.5">
                  <KeyRound className="size-4" /> Secret Code
                </TabsTrigger>
              )}
              <TabsTrigger value="google" className="flex-1 gap-1.5">
                <ShieldCheck className="size-4" /> Google
              </TabsTrigger>
            </TabsList>

            <TabsContent value="otp">
              <OtpLoginPanel onSuccess={completeLogin} />
            </TabsContent>

            {methods.secretCode && (
              <TabsContent value="secret">
                <SecretCodeLoginPanel onSuccess={completeLogin} />
              </TabsContent>
            )}

            <TabsContent value="google">
              <GoogleLoginPanel enabled={methods.google} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OtpLoginPanel({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<"mobile" | "code">("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not send code");
        return;
      }
      setDevHint(json.data?.devHint ?? null);
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, code }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Verification failed");
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  if (step === "mobile") {
    return (
      <form onSubmit={requestOtp} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label htmlFor="otp-mobile">Mobile number</Label>
          <Input
            id="otp-mobile"
            type="tel"
            placeholder="+91 98765 43210"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send OTP"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyOtp} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="otp-code">6-digit code</Label>
        <Input
          id="otp-code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {devHint ?? `Sent to ${mobile}.`}{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => setStep("mobile")}>
            Change number
          </button>
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Verifying…" : "Verify & Sign In"}
      </Button>
    </form>
  );
}

function SecretCodeLoginPanel({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/secret-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Login failed");
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        Development only — reads <code>ADMIN_SECRET_CODE</code> from <code>.env.local</code>. Automatically
        unavailable in production.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="secret-code">Admin secret code</Label>
        <Input
          id="secret-code"
          type="password"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}

function GoogleLoginPanel({ enabled }: { enabled: boolean }) {
  return (
    <div className="space-y-3 pt-2">
      <Button type="button" variant="outline" className="w-full" disabled>
        Continue with Google
      </Button>
      <p className="text-xs text-muted-foreground">
        {enabled
          ? "Google sign-in is configured but not yet wired up."
          : "Coming soon — requires a Google OAuth client to be configured."}
      </p>
    </div>
  );
}
