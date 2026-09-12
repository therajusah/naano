"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { importRosterCsv } from "@/app/actions/agency";

const CSV_PLACEHOLDER = `name,headline,followers,pricePerPost,verticals
Jordan Rivera,B2B SaaS growth advisor,12000,450,B2B SaaS|DevTools
Priya Nair,Fintech operator & angel,8400,320,Fintech`;

type Summary = { tone: "ok" | "error"; text: string };

/** Bulk import managed creators by pasting CSV rows (creator agency). */
export function CsvImportForm() {
  const [csv, setCsv] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSummary(null);
    startTransition(async () => {
      const result = await importRosterCsv(csv);
      if (!result.ok) {
        setSummary({ tone: "error", text: result.error });
        return;
      }
      setSummary({ tone: "ok", text: result.message });
      setCsv("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Paste CSV"
        htmlFor="roster-csv"
        hint="Headers: name, headline, followers, pricePerPost, verticals. Separate verticals with | or ;. Up to 200 rows; invalid rows are skipped."
      >
        <Textarea
          id="roster-csv"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          placeholder={CSV_PLACEHOLDER}
          rows={7}
          className="font-mono text-xs"
          spellCheck={false}
        />
      </Field>
      {summary && (
        <p className={summary.tone === "ok" ? "text-sm text-success" : "text-sm text-danger"}>
          {summary.text}
        </p>
      )}
      <div>
        <Button type="submit" variant="outline" disabled={isPending}>
          <Upload className="size-4" />
          {isPending ? "Importing…" : "Import roster"}
        </Button>
      </div>
    </form>
  );
}
