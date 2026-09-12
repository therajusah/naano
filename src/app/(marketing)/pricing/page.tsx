import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Faq } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Fixed per-post pricing with no per-click, per-impression or per-lead costs. Start free on Self-Serve or go done-for-you with a Managed plan. No lock-in.",
};

const REASSURANCE = [
  "Fixed price per post — you always know the cost before you book",
  "No per-click, per-impression, or per-lead costs",
  "Month-to-month billing, no lock-in",
];

const FAQ = [
  {
    question: "What does Self-Serve actually include?",
    answer:
      "Full access to the creator marketplace, AI brief creation, click, company and pipeline tracking, and automatic creator payouts — for €0/mo. You only pay creators their fixed price per post, from €20.",
  },
  {
    question: "What's different about the Managed plan?",
    answer:
      "Managed (€700/mo) is done-for-you. Our team handles campaign strategy and positioning, sources and coordinates creators, writes the briefs, launches the campaign, and reports and optimises — everything in Self-Serve, run for you.",
  },
  {
    question: "Are there any per-click or per-lead fees?",
    answer:
      "No. Pricing is fixed per post. There are no per-click, per-impression or per-lead costs layered on top, so your campaign budget stays predictable.",
  },
  {
    question: "Am I locked into a contract?",
    answer:
      "No. Billing is month-to-month with no lock-in. Upgrade, downgrade or cancel whenever you like.",
  },
  {
    question: "How much do individual posts cost?",
    answer:
      "Each creator sets their own fixed price per post, starting from €20. You see the exact price before you book, so there are never any surprises.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Hero
        tone="dark"
        badge="Pricing"
        title={
          <>
            Fixed per-post pricing.{" "}
            <span className="text-gradient">No hidden fees.</span>
          </>
        }
        subtitle="Start free and pay creators a fixed price per post, or let our team run your campaigns end to end. Month-to-month, no lock-in."
        actions={
          <>
            <ButtonLink href="/register?role=company" variant="white" size="lg">
              Start for free
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink
              href="/how-it-works"
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10"
            >
              See how it works
            </ButtonLink>
          </>
        }
      />

      <PricingCards
        eyebrow="Plans"
        heading="Choose how you want to run campaigns"
        subheading="Fixed per-post pricing. No per-click, per-impression, or per-lead costs."
        note={undefined}
        withSection
      />

      {/* Reassurance strip */}
      <section className="bg-white pb-8">
        <Container>
          <ul className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
            {REASSURANCE.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="size-4 shrink-0 text-accent-600" />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Faq
        heading="Pricing questions"
        subheading="The details behind the plans."
        items={FAQ}
      />

      <CtaBand
        title="Start for free today"
        subtitle="No minimum spend, no lock-in — just fixed-price posts."
        actions={
          <>
            <ButtonLink href="/register?role=company" variant="white" size="lg">
              Start for free
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink
              href="/for-companies"
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10"
            >
              Explore for companies
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
