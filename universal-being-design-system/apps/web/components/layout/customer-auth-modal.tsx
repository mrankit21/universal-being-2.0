"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCustomerAuth } from "@/components/layout/customer-auth-context";

/**
 * CustomerAuthModal — the site-wide login/signup surface, styled after the
 * reference screenshot: underlined tabs (not the pill-style default
 * TabsList look), "Log into Your Account" / "Create Your Account" heading,
 * stacked email+password fields, a "Forgot Password?" link, and a
 * full-width primary submit button.
 * Colors intentionally use the design system's `--primary` token rather
 * than hardcoding the reference's orange, so it stays in sync with
 * whichever theme is active instead of clashing with it.
 *
 * "Sign in with Google" is deliberately not rendered right now (too much
 * setup for this pass — see `app/api/customer/auth/google/route.ts`). The
 * `GoogleButton`/`GoogleIcon` components below are kept, unused, so wiring
 * it back in later is just adding `<GoogleButton />` back into LoginPane/
 * SignupPane, not rebuilding it.
 */
export function CustomerAuthModal() {
  const { isOpen, openTab, close, setCustomer } = useCustomerAuth();
  const [tab, setTab] = React.useState<"login" | "signup">(openTab);

  React.useEffect(() => {
    if (isOpen) setTab(openTab);
  }, [isOpen, openTab]);

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">{tab === "login" ? "Log in" : "Sign up"}</DialogTitle>
        <DialogDescription className="sr-only">
          Log in or create an account to continue.
        </DialogDescription>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
          <TabsList className="h-auto w-full justify-start gap-8 rounded-none border-b border-border bg-transparent p-0 px-6 pt-6">
            <TabsTrigger
              value="login"
              className={cn(
                "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 text-base font-semibold text-muted-foreground shadow-none",
                "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              )}
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className={cn(
                "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 text-base font-semibold text-muted-foreground shadow-none",
                "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              )}
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="m-0 px-6 pb-6 pt-5">
            <LoginPane
              onSuccess={(c) => {
                setCustomer(c);
                close();
              }}
              onSwitchToSignup={() => setTab("signup")}
            />
          </TabsContent>
          <TabsContent value="signup" className="m-0 px-6 pb-6 pt-5">
            <SignupPane
              onSuccess={(c) => {
                setCustomer(c);
                close();
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface AuthedCustomer {
  id: string;
  name: string;
  email: string;
}

function LoginPane({
  onSuccess,
  onSwitchToSignup,
}: {
  onSuccess: (customer: AuthedCustomer) => void;
  onSwitchToSignup: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Login failed");
        return;
      }
      onSuccess(json.data);
    } finally {
      setLoading(false);
    }
  }

  if (showForgotPassword) {
    return <ForgotPasswordPane onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-foreground">Log into Your Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="sr-only">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password" className="sr-only">
            Password
          </Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
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

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Login & Continue
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <button type="button" onClick={onSwitchToSignup} className="font-medium text-primary hover:underline">
          Create an account
        </button>
      </p>
    </div>
  );
}

function SignupPane({ onSuccess }: { onSuccess: (customer: AuthedCustomer) => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Could not create account");
        return;
      }
      onSuccess(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-foreground">Create Your Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="signup-name" className="sr-only">
            Full name
          </Label>
          <Input
            id="signup-name"
            type="text"
            placeholder="Full name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email" className="sr-only">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-password" className="sr-only">
            Password
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password (min. 8 characters)"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
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

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Sign Up & Continue
        </Button>
      </form>
    </div>
  );
}

function ForgotPasswordPane({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Check Your Email</h2>
        <p className="text-sm text-muted-foreground">
          If an account exists for {email}, we&apos;ve sent a link to reset your password. It expires in 30
          minutes.
        </p>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={onBack}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-foreground">Reset Your Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email" className="sr-only">
            Email
          </Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Send Reset Link
        </Button>
        <button type="button" onClick={onBack} className="w-full text-center text-sm text-muted-foreground hover:underline">
          Back to Login
        </button>
      </form>
    </div>
  );
}

function GoogleButton() {
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick() {
    setError(null);
    const res = await fetch("/api/customer/auth/google", { method: "POST" });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Google sign-in isn't available yet.");
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="lg" className="w-full gap-2" onClick={handleClick}>
        <GoogleIcon className="size-4" />
        Sign in with Google
      </Button>
      {error ? <p className="text-center text-xs text-muted-foreground">{error}</p> : null}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
