"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VERTICALS, MIN_POST_PRICE, MAX_POST_PRICE } from "@/lib/constants";
import { updateCreatorProfile, type UpdateCreatorProfileInput } from "@/app/actions/creator";

type ProfileFormProps = {
  headline: string;
  bio: string;
  location: string;
  verticals: string[];
  pricePerPost: number;
  available: boolean;
};

/** Editable media-kit fields. The server action owns validation + the write. */
export function ProfileForm(initial: ProfileFormProps) {
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [verticals, setVerticals] = useState<string[]>(initial.verticals);
  const [pricePerPost, setPricePerPost] = useState(String(initial.pricePerPost));
  const [available, setAvailable] = useState(initial.available);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleVertical(vertical: string) {
    setVerticals((current) =>
      current.includes(vertical)
        ? current.filter((v) => v !== vertical)
        : [...current, vertical],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateCreatorProfile({
        headline,
        bio,
        location,
        verticals: verticals as UpdateCreatorProfileInput["verticals"],
        pricePerPost: Number(pricePerPost),
        available,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Headline" htmlFor="headline" required>
        <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} required />
      </Field>
      <Field label="Bio" htmlFor="bio" required>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location" htmlFor="location" required>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </Field>
        <Field label="Price per post (€)" htmlFor="price" hint={`Between €${MIN_POST_PRICE} and €${MAX_POST_PRICE}.`} required>
          <Input
            id="price"
            type="number"
            min={MIN_POST_PRICE}
            max={MAX_POST_PRICE}
            value={pricePerPost}
            onChange={(e) => setPricePerPost(e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Verticals" hint="Pick the topics your audience trusts you on.">
        <div className="flex flex-wrap gap-2">
          {VERTICALS.map((vertical) => {
            const active = verticals.includes(vertical);
            return (
              <button
                key={vertical}
                type="button"
                onClick={() => toggleVertical(vertical)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-brand bg-brand/10 text-brand-700"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {vertical}
              </button>
            );
          })}
        </div>
      </Field>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Available to book
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Save changes
        </Button>
        {saved && <span className="text-sm text-success">Saved ✓</span>}
        {error && <span role="alert" className="text-sm text-danger">{error}</span>}
      </div>
    </form>
  );
}
