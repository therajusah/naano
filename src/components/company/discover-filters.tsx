"use client";

// Marketplace filter bar for /app/discover. Reads its initial values from the
// current searchParams and pushes updates back into the URL so the (server)
// page re-queries. All filtering happens server-side; this only drives the URL.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AUDIENCE_FUNCTIONS, AUDIENCE_SENIORITIES, VERTICALS } from "@/lib/constants";

const FILTER_KEYS = [
  "q",
  "vertical",
  "function",
  "seniority",
  "minFollowers",
  "maxPrice",
  "availableOnly",
] as const;

export function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = (key: string) => searchParams.get(key) ?? "";

  const apply = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      // Any filter change resets pagination to page 1.
      params.delete("page");
      startTransition(() => {
        router.push(`/app/discover?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const updates: Record<string, string> = {};
    for (const key of FILTER_KEYS) {
      updates[key] = String(form.get(key) ?? "");
    }
    updates.availableOnly = form.get("availableOnly") ? "1" : "";
    apply(updates);
  };

  const reset = () => {
    startTransition(() => router.push("/app/discover"));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={current("q")}
            placeholder="Search by name or headline…"
            className="pl-9"
            aria-label="Search creators"
          />
        </div>

        <Select name="vertical" defaultValue={current("vertical")} aria-label="Vertical">
          <option value="">All verticals</option>
          {VERTICALS.map((vertical) => (
            <option key={vertical} value={vertical}>
              {vertical}
            </option>
          ))}
        </Select>

        <Select name="function" defaultValue={current("function")} aria-label="Audience function">
          <option value="">Any audience function</option>
          {AUDIENCE_FUNCTIONS.map((fn) => (
            <option key={fn} value={fn}>
              {fn}
            </option>
          ))}
        </Select>

        <Select name="seniority" defaultValue={current("seniority")} aria-label="Audience seniority">
          <option value="">Any seniority</option>
          {AUDIENCE_SENIORITIES.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="minFollowers"
            type="number"
            min={0}
            defaultValue={current("minFollowers")}
            placeholder="Min followers"
            aria-label="Minimum followers"
          />
          <Input
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={current("maxPrice")}
            placeholder="Max €/post"
            aria-label="Maximum price per post"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="availableOnly"
            defaultChecked={current("availableOnly") === "1"}
            className="size-4 rounded border-border text-brand focus:ring-ring"
          />
          Available creators only
        </label>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
          <Button type="submit" variant="brand" size="sm" disabled={isPending}>
            {isPending ? "Filtering…" : "Apply filters"}
          </Button>
        </div>
      </div>
    </form>
  );
}
