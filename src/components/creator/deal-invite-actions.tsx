"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptDeal, declineDeal } from "@/app/actions/creator";

/**
 * Accept / Decline controls for an INVITED booking. Ownership + the state
 * transition are enforced server-side in the action; these buttons are only a
 * convenience and never the authorization boundary (OWASP-ACLFUNC-001).
 */
export function DealInviteActions({
  bookingId,
  size = "sm",
}: {
  bookingId: string;
  size?: "sm" | "default";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"accept" | "decline" | null>(null);

  function run(action: "accept" | "decline") {
    setError(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = action === "accept" ? await acceptDeal(bookingId) : await declineDeal(bookingId);
      if (!result.ok) {
        setError(result.error);
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="default"
          size={size}
          disabled={isPending}
          onClick={() => run("accept")}
        >
          {isPending && pendingAction === "accept" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Check />
          )}
          Accept
        </Button>
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={isPending}
          onClick={() => run("decline")}
        >
          {isPending && pendingAction === "decline" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <X />
          )}
          Decline
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
