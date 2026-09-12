"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateManagedCreator } from "@/app/actions/agency";

/** Inline edit of a managed creator's rate + availability. */
export function EditRateForm({
  creatorId,
  currentPrice,
  currentAvailable,
}: {
  creatorId: string;
  currentPrice: number;
  currentAvailable: boolean;
}) {
  const [price, setPrice] = useState(String(currentPrice));
  const [available, setAvailable] = useState(currentAvailable);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const priceValue = Number(price);
    startTransition(async () => {
      const result = await updateManagedCreator(creatorId, {
        pricePerPost: Number.isFinite(priceValue) ? Math.trunc(priceValue) : Number.NaN,
        available,
      });
      setStatus(
        result.ok
          ? { tone: "ok", text: "Saved" }
          : { tone: "error", text: result.error },
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          €
        </span>
        <label htmlFor={`rate-${creatorId}`} className="sr-only">
          Price per post in euros
        </label>
        <Input
          id={`rate-${creatorId}`}
          type="number"
          inputMode="numeric"
          min={0}
          step={10}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="h-9 w-28 pl-6 text-sm"
        />
      </div>
      <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={available}
          onChange={(event) => setAvailable(event.target.checked)}
          className="size-4 rounded border-border accent-brand"
        />
        Available
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        <Check className="size-4" />
        {isPending ? "Saving…" : "Save"}
      </Button>
      {status && (
        <span
          className={
            status.tone === "ok" ? "text-xs text-success" : "text-xs text-danger"
          }
        >
          {status.text}
        </span>
      )}
    </form>
  );
}
