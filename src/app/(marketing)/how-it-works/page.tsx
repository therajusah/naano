import type { Metadata } from "next";
import {
  Users,
  PenLine,
  Send,
  CreditCard,
  LineChart,
  ArrowRight,
} from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { FeatureSteps } from "@/components/marketing/feature-steps";
import { StatStrip } from "@/components/marketing/stat-strip";
import { Faq } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import { ButtonLink } from "@/components/ui/button";
import { MARKETPLACE_STATS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Match, brief, publish, pay and track — see how Naano takes a B2B creator campaign from an ICP to measurable pipeline in five steps.",
};

const STEPS = [
  {
    title: "Match",
    description:
      "Define your vertical and ICP; Naano surfaces vetted creators whose audience contains your buyers.",
    icon: <Users className="size-5" />,
  },
  {
    title: "Brief",
    description:
      "You share the campaign brief; creators write in their own voice and you review before anything goes live.",
    icon: <PenLine className="size-5" />,
  },
  {
    title: "Publish",
    description:
      "Posts go live from creators' personal accounts, where LinkedIn concentrates organic reach.",
    icon: <Send className="size-5" />,
  },
  {
    title: "Pay",
    description:
      "Each creator sets a fixed price per post, shown before booking. Naano handles the payment.",
    icon: <CreditCard className="size-5" />,
  },
  {
    title: "Track",
    description:
      "Every post carries tracked links, so you see clicks per creator and per post.",
    icon: <LineChart className="size-5" />,
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
    question: "How long does it take to launch a campaign?",
    answer:
      "Most teams go from signing up to a live brief in a single afternoon. Shortlisting creators and getting drafts approved typically takes a few days, so first posts can be live within a week.",
  },
  {
    question: "Who writes the posts?",
    answer:
      "Creators do. You provide the brief — angle, key messages, do's and don'ts — and each creator writes in their own authentic voice. You review and approve every draft before it publishes.",
  },
  {
    question: "How is performance attributed to each creator?",
    answer:
      "Every booking gets a unique tracked link. Clicks are recorded per creator and per post, and any leads captured from those clicks roll up into your campaign reporting.",
  },
  {
    question: "What does a post cost?",
    answer:
      "Each creator sets a fixed price per post, shown before you book. There are no per-click, per-impression or per-lead fees on top — you always know the cost up front.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Hero
        tone="dark"
        badge="From brief to pipeline"
        title={
          <>
            How Naano works, <span className="text-gradient">step by step.</span>
          </>
        }
        subtitle="Five steps take a campaign from an ICP definition to measurable pipeline — without spreadsheets, agencies or guesswork."
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
              See pricing
            </ButtonLink>
          </>
        }
      />

      <FeatureSteps steps={STEPS} numbered columns={3} />

      <StatStrip stats={STATS} tone="dark" />

      <Faq items={FAQ} />

      <CtaBand
        title="Ready to run your first campaign?"
        subtitle="Match with vetted creators and launch in days."
        actions={
          <ButtonLink href="/register?role=company" variant="white" size="lg">
            Launch a campaign
            <ArrowRight className="size-4" />
          </ButtonLink>
        }
      />
    </>
  );
}
