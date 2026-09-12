"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createClientWorkspace } from "@/app/actions/agency";

/** Inline form to create a new brand-agency client workspace. */
export function NewWorkspaceForm() {
  const [clientName, setClientName] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const budgetValue = Number(budget);
    startTransition(async () => {
      const result = await createClientWorkspace(
        clientName,
        Number.isFinite(budgetValue) ? Math.trunc(budgetValue) : Number.NaN,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setClientName("");
      setBudget("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client name" htmlFor="client-name" required>
          <Input
            id="client-name"
            name="clientName"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Acme Inc."
            maxLength={120}
            required
          />
        </Field>
        <Field label="Budget (€)" htmlFor="client-budget" hint="Whole euros">
          <Input
            id="client-budget"
            name="budget"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            placeholder="10000"
          />
        </Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div>
        <Button type="submit" disabled={isPending}>
          <Plus className="size-4" />
          {isPending ? "Creating…" : "Create workspace"}
        </Button>
      </div>
    </form>
  );
}
