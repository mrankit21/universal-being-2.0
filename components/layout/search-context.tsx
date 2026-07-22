"use client";

import * as React from "react";

interface GlobalSearchContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const GlobalSearchContext = React.createContext<GlobalSearchContextValue | null>(null);

/**
 * GlobalSearchProvider — mounted once in RootShell. Owns the keyboard
 * shortcut (⌘K / Ctrl+K) so it works from anywhere on the site, not just
 * while the header is focused, and so GlobalSearchModal only needs to read
 * `isOpen` rather than each page wiring its own listener.
 */
export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((v) => !v), []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isShortcut) {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const value = React.useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);

  return <GlobalSearchContext.Provider value={value}>{children}</GlobalSearchContext.Provider>;
}

export function useGlobalSearch(): GlobalSearchContextValue {
  const ctx = React.useContext(GlobalSearchContext);
  if (!ctx) throw new Error("useGlobalSearch must be used within a GlobalSearchProvider");
  return ctx;
}
