"use client";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/components/layout/customer-auth-context";

/** Small client island for the logged-out state of `/saved` — a Server
 * Component can't call `useCustomerAuth().open()` itself, so this is
 * isolated here rather than making the whole page a client component. */
export function SavedSignInPrompt() {
  const { open } = useCustomerAuth();

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <Heart className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-muted-foreground">Sign in to see and manage your saved trips and destinations.</p>
      <Button onClick={() => open("login")}>Sign in</Button>
    </div>
  );
}
