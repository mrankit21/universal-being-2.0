"use client";

import * as React from "react";

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
}

interface CustomerAuthContextValue {
  customer: CustomerSummary | null;
  /** True until the initial `/api/customer/auth/me` check resolves, so
   * the header can avoid flashing "logged out" UI for an already-logged-in
   * visitor on first paint. */
  isLoading: boolean;
  isOpen: boolean;
  /** Which tab the modal should open on. */
  openTab: "login" | "signup";
  open: (tab?: "login" | "signup") => void;
  close: () => void;
  setCustomer: (customer: CustomerSummary | null) => void;
  logout: () => Promise<void>;
}

const CustomerAuthContext = React.createContext<CustomerAuthContextValue | null>(null);

/**
 * CustomerAuthProvider — mounted once in RootShell, same pattern as
 * GlobalSearchProvider/StickyCtaProvider. Owns both "who is logged in"
 * (fetched once on mount from `/api/customer/auth/me`) and "is the
 * login/signup modal open right now", so any component — the header's
 * ProfileButton, a "sign in to book" prompt on a trip page, etc. — can
 * trigger the same modal via `useCustomerAuth().open()` without prop
 * drilling.
 */
export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = React.useState<CustomerSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const [openTab, setOpenTab] = React.useState<"login" | "signup">("login");

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/customer/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.success) setCustomer(json.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const open = React.useCallback((tab: "login" | "signup" = "login") => {
    setOpenTab(tab);
    setIsOpen(true);
  }, []);
  const close = React.useCallback(() => setIsOpen(false), []);

  const logout = React.useCallback(async () => {
    await fetch("/api/customer/auth/logout", { method: "POST" });
    setCustomer(null);
  }, []);

  const value = React.useMemo(
    () => ({ customer, isLoading, isOpen, openTab, open, close, setCustomer, logout }),
    [customer, isLoading, isOpen, openTab, open, close, logout]
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = React.useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  return ctx;
}
