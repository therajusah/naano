"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleAvailability } from "@/app/actions/creator";

/**
 * Available-to-book switch. Optimistically reflects the toggle, then reconciles
 * with the server action result (which owns the actual write + authz).
 */
export function AvailabilityToggle({ available }: { available: boolean }) {
  const [isOn, setIsOn] = useState(available);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);
    const next = !isOn;
    setIsOn(next);
    startTransition(async () => {
      const result = await toggleAvailability();
      if (!result.ok) {
        setIsOn(!next); // revert on failure
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label="Available to book"
          disabled={isPending}
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
            isOn ? "bg-success" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 transform rounded-full bg-white shadow transition-transform",
              isOn ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
          {isOn ? "Available to book" : "Not accepting deals"}
        </span>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
