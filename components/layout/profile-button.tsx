"use client";

import { LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useCustomerAuth } from "@/components/layout/customer-auth-context";

/**
 * ProfileButton — now backed by real customer auth
 * (`CustomerAuthProvider`). Logged out: an icon button that opens the
 * login/signup modal. Logged in: the customer's initial, with a tooltip
 * offering logout — deliberately lightweight (no dropdown menu/account
 * pages yet) since this is the first slice of accounts, not a full
 * account area.
 */
export function ProfileButton() {
  const { customer, isLoading, open, logout } = useCustomerAuth();

  if (isLoading) {
    return <div className="size-10 shrink-0" aria-hidden="true" />;
  }

  if (customer) {
    const initial = customer.name.trim().charAt(0).toUpperCase() || "U";
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Signed in as ${customer.name} — log out`}
              className="shrink-0"
              onClick={() => void logout()}
            >
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initial}</AvatarFallback>
              </Avatar>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-1.5">
            <LogOut className="size-3.5" aria-hidden="true" />
            Log out {customer.name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Log in or sign up"
            className="shrink-0"
            onClick={() => open("login")}
          >
            <User className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Login / Sign Up</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
