"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { submitDraft } from "@/app/actions/creator";

const DRAFT_MAX_CHARS = 5000;

/**
 * Content submission form shown on an ACCEPTED deal. Submits the creator's
 * draft post; the server action re-validates length, ownership and the
 * ACCEPTED → DRAFT_SUBMITTED transition.
 */
export function DraftSubmissionForm({
  bookingId,
  initialContent = "",
}: {
  bookingId: string;
  initialContent?: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitDraft(bookingId, content);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Your draft post"
        htmlFor="draftContent"
        hint={`Write the LinkedIn post you'll publish. ${content.trim().length}/${DRAFT_MAX_CHARS} characters.`}
        error={error ?? undefined}
      >
        <Textarea
          id="draftContent"
          name="draftContent"
          value={content}
          maxLength={DRAFT_MAX_CHARS}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Hook the reader in the first line, weave in the brief's key messages, and end with the call to action…"
          className="min-h-48"
          required
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
          Submit for approval
        </Button>
        <p className="text-xs text-muted-foreground">
          The brand reviews your draft before it goes live.
        </p>
      </div>
    </form>
  );
}
