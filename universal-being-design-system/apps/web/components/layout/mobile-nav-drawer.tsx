"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/layout/site-config";
import { NavLink } from "@/components/layout/nav-link";
import { ThemeModeToggle } from "@/components/layout/theme-mode-toggle";
import { useCustomerAuth } from "@/components/layout/customer-auth-context";

/**
 * MobileNavDrawer — swipe-to-dismiss bottom sheet (vaul, per ui/drawer.tsx's
 * own rationale: "inherits native swipe-to-dismiss gestures"). Self-
 * contained: owns its own open state via Drawer's uncontrolled mode, so
 * MobileHeader just renders the trigger with no state to manage.
 */
export function MobileNavDrawer() {
  const [open, setOpen] = React.useState(false);
  const { customer, isLoading, open: openAuth, logout } = useCustomerAuth();

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="flex items-center justify-between pb-2">
          <div>
            <DrawerTitle className="font-display">{siteConfig.brandName}</DrawerTitle>
            <DrawerDescription>{siteConfig.tagline}</DrawerDescription>
          </div>
          <ThemeModeToggle />
        </DrawerHeader>

        {!isLoading && (
          <div className="px-5 pb-2">
            {customer ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm text-foreground">
                  Signed in as <span className="font-medium">{customer.name}</span>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => void logout()}>
                  Log out
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  openAuth("login");
                }}
              >
                Login / Sign Up
              </Button>
            )}
          </div>
        )}

        <nav aria-label="Primary" className="flex flex-col gap-1 px-5 pb-6">
          {siteConfig.primaryNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              showIcon
              onNavigate={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base hover:bg-accent"
              activeClassName="bg-accent"
            />
          ))}
        </nav>

        <DrawerClose asChild>
          <Button variant="outline" className="mx-5 mb-5">
            Close
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
