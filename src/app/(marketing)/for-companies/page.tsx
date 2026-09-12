import type { Metadata } from "next";
import {
  Target,
  Sparkles,
  Tag,
  BarChart3,
  Banknote,
  ArrowRight,
} from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { ValueProps } from "@/components/marketing/value-props";
import { StatStrip } from "@/components/marketing/stat-strip";
import { Testimonial } from "@/components/marketing/testimonial";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Faq } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { MARKETPLACE_STATS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "For companies",
  description:
    "Discover vetted B2B creators by audience fit, brief them with AI, pay a fixed price per post, and attribute every click, lead and euro of pipeline.",
};

const VALUE_PROPS = [
  {
    title: "Discover creators by audience fit",
    description:
      "Book people by who actually follows them — function, seniority and vertical — not by follower count. See an audience-match score for every creator before you invite them.",
    icon: <Target className="size-5" />,
  },
  {
    title: "AI brief creation",
    description:
      "Describe your product and objective and Naano drafts the angle, hook, key messages and do/don't list. Refine it, approve it, and creators take it from there.",
    icon: <Sparkles className="size-5" />,
  },
  {
    title: "Fixed price per post",
    description:
      "Every creator sets a fixed price per post, shown before you book. No per-click, per-impression or per-lead surprises — your budget is predictable from day one.",
    icon: <Tag className="size-5" />,
  },
  {
    title: "Attribution to pipeline",
    description:
      "Tracked links tie every click and lead back to the exact creator and post that drove it, so you can report clicks, leads and pipeline — not just impressions.",
    icon: <BarChart3 className="size-5" />,
  },
  {
    title: "Automatic payouts",
    description:
      "Naano handles invoicing and pays creators for you. No contracts to chase, no transfers to reconcile — collaborations settle automatically once posts go live.",
    icon: <Banknote className="size-5" />,
  },
];

const STATS = [
  { value: MARKETPLACE_STATS.impressions, label: "Impressions generated" },
  { value: MARKETPLACE_STATS.leads, label: "Leads captured" },
  { value: MARKETPLACE_STATS.creators, label: "Vetted B2B creators" },
  { value: MARKETPLACE_STATS.audienceMatch, label: "Average audience match" },
];

const FAQ = [
  {
    question: "How do you make sure a creator reaches my buyers?",
    answer:
      "Every creator's audience is broken down by function, seniority and vertical. We compute an audience-match score against your ICP so you can shortlist people who reach decision-makers in your market — not just people with large followings.",
  },
  {
    question: "What if I don't know what to say in the brief?",
    answer:
      "Start with the AI brief generator. Give it your product, audience and objective and it produces a ready-to-edit brief. You stay in control — nothing is sent to creators until you approve it.",
  },
  {
    question: "How do I know a campaign worked?",
    answer:
      "Each post carries a tracked link. You get clicks per creator and per post, the leads captured from those clicks, and the pipeline they contributed to — all in one dashboard.",
  },
  {
    question: "Is there a minimum spend or contract?",
    answer:
      "No. The Self-Serve plan is free and month-to-month; you only pay creators a fixed price per post. Upgrade to a Managed plan any time if you'd like our team to run campaigns for you.",
  },
];

export default function ForCompaniesPage() {
  return (
    <>
      <Hero
        tone="dark"
        badge="For companies"
        title={
          <>
            Turn creators your buyers trust into{" "}
            <span className="text-gradient">measurable pipeline.</span>
          </>
        }
        subtitle="Discover vetted B2B creators by audience fit, brief them in minutes, and track the clicks, leads and pipeline every post generates."
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
        footnote="Free to start · No minimum spend · Cancel anytime"
      />

      <ValueProps
        eyebrow="Why companies choose Naano"
        heading="Everything you need to run creator campaigns"
        subheading="From discovery to payout, the whole workflow lives in one place — built for B2B teams that answer to a revenue number."
        items={VALUE_PROPS}
      />

      <StatStrip stats={STATS} tone="dark" />

      <Testimonial
        eyebrow="Case study"
        heading="Real teams. Measurable pipeline."
        quote="Naano became one of our fastest acquisition channels. We know exactly what every creator brings."
        authorName="Vincent Josse"
        authorRole="CEO, BlogSEO"
        caseLabel="BlogSEO campaign"
        caseStats={[
          { value: "€5,000", label: "Campaign budget" },
          { value: "~20", label: "Sponsored posts" },
          { value: "1,500+", label: "Qualified leads" },
          { value: "150%", label: "ROAS" },
        ]}
      />

      <PricingCards />

      <Faq items={FAQ} />

      <CtaBand
        title="Launch your first campaign"
        subtitle="Start for free and book vetted creators today."
        actions={
          <>
            <ButtonLink href="/register?role=company" variant="white" size="lg">
              Launch a campaign
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10"
            >
              Book a campaign call
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
