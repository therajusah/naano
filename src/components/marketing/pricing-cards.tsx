import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/constants";

type PricingCardsProps = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  /** Small reassurance line under the heading (e.g. no lock-in). */
  note?: string;
  /** When true, render inside a full section wrapper with heading. */
  withSection?: boolean;
  className?: string;
};

/** Where each plan's CTA should point. */
const PLAN_HREF: Record<string, string> = {
  SELF_SERVE: "/register?role=company",
  MANAGED: "/register?role=company&plan=managed",
};

/** The two Naano pricing tiers rendered from PRICING_PLANS. */
export function PricingCards({
  eyebrow = "Pricing",
  heading = "Simple, fixed pricing",
  subheading = "Fixed per-post pricing. No per-click, per-impression, or per-lead costs.",
  note = "Month-to-month billing, no lock-in.",
  withSection = true,
  className,
}: PricingCardsProps) {
  const grid = (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      {PRICING_PLANS.map((plan) => {
        const featured = plan.featured;
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-3xl border p-8 shadow-sm transition-shadow",
              featured
                ? "border-transparent bg-navy text-white shadow-md ring-1 ring-navy"
                : "border-border bg-white text-foreground hover:shadow-md",
            )}
          >
            {featured && (
              <span className="absolute -top-3 left-8">
                <Badge variant="accent" className="bg-accent text-white">
                  Most popular
                </Badge>
              </span>
            )}

            <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
            <p
              className={cn(
                "mt-1 text-sm",
                featured ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {plan.blurb}
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">
                {plan.price}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  featured ? "text-white/60" : "text-muted-foreground",
                )}
              >
                {plan.cadence}
              </span>
            </div>

            <ul className="mt-7 flex flex-1 flex-col gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      featured ? "text-accent" : "text-brand",
                    )}
                  />
                  <span className={featured ? "text-white/90" : "text-foreground"}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <ButtonLink
              href={PLAN_HREF[plan.id] ?? "/register?role=company"}
              variant={featured ? "white" : "default"}
              size="lg"
              className="mt-8 w-full"
            >
              {plan.cta}
            </ButtonLink>
          </div>
        );
      })}
    </div>
  );

  if (!withSection) return grid;

  return (
    <section className={cn("bg-white py-20 sm:py-24", className)}>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          subtitle={subheading}
          className="mx-auto mb-12"
        />
        {grid}
        {note && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {note}{" "}
            <Link href="/pricing" className="font-medium text-brand hover:underline">
              See full pricing
            </Link>
          </p>
        )}
      </Container>
    </section>
  );
}
