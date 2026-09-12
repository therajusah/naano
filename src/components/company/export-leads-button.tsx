"use client";

// Client-side CSV export for the leads table. Builds a CSV from the already-
// rendered rows (passed as serializable props) and triggers a download. No
// server round-trip and no extra data — it can only export what the page shows.

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LeadRow = {
  name: string;
  title: string;
  company: string;
  creatorName: string;
  campaignName: string;
  capturedAt: string; // ISO string
};

const CSV_HEADERS = [
  "Name",
  "Title",
  "Company",
  "Source creator",
  "Campaign",
  "Captured at",
] as const;

/** RFC-4180 style field escaping — wrap in quotes and double any inner quotes. */
function escapeCsvField(value: string): string {
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

function buildCsv(rows: LeadRow[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.name,
        row.title,
        row.company,
        row.creatorName,
        row.campaignName,
        row.capturedAt,
      ]
        .map((field) => escapeCsvField(field ?? ""))
        .join(","),
    );
  }
  return lines.join("\r\n");
}

export function ExportLeadsButton({ rows }: { rows: LeadRow[] }) {
  function download() {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `naano-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={download}
      disabled={rows.length === 0}
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
