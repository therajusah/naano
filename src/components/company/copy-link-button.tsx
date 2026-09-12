"use client";

// Small "copy tracked link" button used on live bookings. Copies an absolute
// /t/<slug> URL to the clipboard with a brief confirmation.

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const RESET_MS = 1600;

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/t/${slug}` : `/t/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), RESET_MS);
    } catch {
      // Clipboard blocked (e.g. insecure context) — leave state unchanged.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Copy tracked link"
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
