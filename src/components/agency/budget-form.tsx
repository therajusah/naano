"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateClientBudget } from "@/app/actions/agency";

/** Inline allocate/update-budget control for a single client workspace. */
export function BudgetForm({
  workspaceId,
  currentBudget,
}: {
  workspaceId: string;
  currentBudget: number;
}) {
  const [budget, setBudget] = useState(String(currentBudget));
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const budgetValue = Number(budget);
    startTransition(async () => {
      const result = await updateClientBudget(
        workspaceId,
        Number.isFinite(budgetValue) ? Math.trunc(budgetValue) : Number.NaN,
      );
      setStatus(
        result.ok
          ? { tone: "ok", text: "Saved" }
          : { tone: "error", text: result.error },
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label htmlFor={`budget-${workspaceId}`} className="sr-only">
        Budget in euros
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          €
        </span>
        <Input
          id={`budget-${workspaceId}`}
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          className="h-9 w-32 pl-6 text-sm"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        <Check className="size-4" />
        {isPending ? "Saving…" : "Allocate"}
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
