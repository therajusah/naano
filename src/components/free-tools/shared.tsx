// Small presentational helpers shared across the four calculator UIs.
// Client-safe (no server-only imports) so calculator components can reuse them.

import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const COMPANY_REGISTER_HREF = "/register?role=company";

/**
 * Parse a numeric text input into a number, or null when the field is empty or
 * not a valid number. Keeps NaN out of the calculators (BP-NULL-001).
 */
export function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Rendered when an output can't be computed yet (empty / invalid input). */
export function DashValue() {
  return <span className="text-muted-foreground">&mdash;</span>;
}

type HowItWorksProps = {
  title?: string;
  children: React.ReactNode;
};

/** "How this works" explainer block used at the foot of every calculator. */
export function HowItWorks({ title = "How this works", children }: HowItWorksProps) {
  return (
    <Card className="bg-muted/40 p-6">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </Card>
  );
}

type ToolCtaProps = {
  heading?: string;
  blurb?: string;
  label?: string;
};

/** Conversion CTA linking companies to registration. */
export function ToolCta({
  heading = "Ready to book creators your buyers trust?",
  blurb = "Launch a campaign on Naano and pay a fixed price per published post — no retainer, no minimum spend.",
  label = "Get started free",
}: ToolCtaProps) {
  return (
    <Card className="hero-clouds flex flex-col items-start gap-4 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-xl font-bold tracking-tight">{heading}</h3>
        <p className="mt-1 max-w-xl text-sm text-white/70">{blurb}</p>
      </div>
      <ButtonLink href={COMPANY_REGISTER_HREF} variant="white" size="lg" className="shrink-0">
        {label}
        <ArrowRight />
      </ButtonLink>
    </Card>
  );
}
