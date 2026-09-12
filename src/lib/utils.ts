import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with correct override precedence. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EURO_FORMATTER = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const COMPACT_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "€1,200" — whole-euro currency, used for prices, budgets, payouts. */
export function formatEuros(amount: number): string {
  return EURO_FORMATTER.format(amount);
}

/** "12.4K", "1.2M" — compact counts for followers, impressions, etc. */
export function formatCompact(value: number): string {
  return COMPACT_FORMATTER.format(value);
}

/** "4.2%" — a fraction (0.042) rendered as a percentage string. */
export function formatPercentFromFraction(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** "92%" — an already-scaled 0..100 score rendered as a percent. */
export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

/** "Aug 12, 2026" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Deterministic initials for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
