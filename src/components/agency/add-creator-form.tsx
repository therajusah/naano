"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { VERTICALS } from "@/lib/constants";
import { addManagedCreator } from "@/app/actions/agency";

/** Add a single managed creator to the roster (creator agency). */
export function AddCreatorForm() {
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [followers, setFollowers] = useState("");
  const [pricePerPost, setPricePerPost] = useState("");
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleVertical(vertical: string) {
    setSelectedVerticals((current) =>
      current.includes(vertical)
        ? current.filter((entry) => entry !== vertical)
        : [...current, vertical],
    );
  }

  function toInteger(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : Number.NaN;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addManagedCreator({
        displayName,
        headline,
        followers: toInteger(followers),
        pricePerPost: toInteger(pricePerPost),
        verticals: selectedVerticals,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDisplayName("");
      setHeadline("");
      setFollowers("");
      setPricePerPost("");
      setSelectedVerticals([]);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Creator name" htmlFor="creator-name" required>
          <Input
            id="creator-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Jordan Rivera"
            maxLength={120}
            required
          />
        </Field>
        <Field label="Headline" htmlFor="creator-headline" required>
          <Input
            id="creator-headline"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder="B2B SaaS growth advisor"
            maxLength={200}
            required
          />
        </Field>
        <Field label="Followers" htmlFor="creator-followers" required>
          <Input
            id="creator-followers"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={followers}
            onChange={(event) => setFollowers(event.target.value)}
            placeholder="12000"
            required
          />
        </Field>
        <Field label="Price per post (€)" htmlFor="creator-price" required hint="Whole euros">
          <Input
            id="creator-price"
            type="number"
            inputMode="numeric"
            min={0}
            step={10}
            value={pricePerPost}
            onChange={(event) => setPricePerPost(event.target.value)}
            placeholder="450"
            required
          />
        </Field>
      </div>

      <Field label="Verticals" hint="Optional — pick the niches this creator covers">
        <div className="flex flex-wrap gap-2">
          {VERTICALS.map((vertical) => {
            const isSelected = selectedVerticals.includes(vertical);
            return (
              <button
                key={vertical}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleVertical(vertical)}
                className={
                  isSelected
                    ? "rounded-full border border-brand bg-brand/10 px-3 py-1 text-xs font-medium text-brand-700"
                    : "rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                }
              >
                {vertical}
              </button>
            );
          })}
        </div>
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div>
        <Button type="submit" disabled={isPending}>
          <UserPlus className="size-4" />
          {isPending ? "Adding…" : "Add creator"}
        </Button>
      </div>
    </form>
  );
}
