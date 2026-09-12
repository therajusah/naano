import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export type FeatureStep = {
  title: string;
  description: string;
  /** Optional icon (lucide component element). */
  icon?: ReactNode;
  /** Optional illustrative content rendered inside the card (e.g. status chips). */
  visual?: ReactNode;
};

type FeatureStepsProps = {
  eyebrow?: string;
  heading?: ReactNode;
  subheading?: ReactNode;
  steps: FeatureStep[];
  /** Show 1..N numbers on each step. */
  numbered?: boolean;
  /** Grid columns at the lg breakpoint. */
  columns?: 2 | 3;
  className?: string;
};

/**
 * A numbered / iconed grid of product steps. Used for the homepage
 * "One platform, from brief to results" and the How it works timeline.
 */
export function FeatureSteps({
  eyebrow,
  heading,
  subheading,
  steps,
  numbered = false,
  columns = 3,
  className,
}: FeatureStepsProps) {
  return (
    <section className={cn("bg-white py-20 sm:py-24", className)}>
      <Container>
        {(heading || eyebrow || subheading) && (
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            subtitle={subheading}
            className="mx-auto mb-14"
          />
        )}
        <ol
          className={cn(
            "grid gap-6",
            columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="group relative flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                {numbered && (
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                    {i + 1}
                  </span>
                )}
                {step.icon && (
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-700">
                    {step.icon}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              {step.visual && <div className="mt-5">{step.visual}</div>}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
