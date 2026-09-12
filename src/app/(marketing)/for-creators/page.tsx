import type { Metadata } from "next";
import {
  IdCard,
  Inbox,
  Wallet,
  BarChart3,
  Send,
  ArrowRight,
  Check,
} from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { ValueProps } from "@/components/marketing/value-props";
import { Faq } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For creators",
  description:
    "Get paid to post on LinkedIn. Choose deals from B2B brands you know, post in your own voice, and get paid within 24h. Free to join, no exclusivity.",
};

const TRUST_ITEMS = ["Free to join", "No exclusivity", "Paid within 24h"];

const FEATURES = [
  {
    title: "A media kit that sells for you",
    description:
      "Your reach, engagement and audience breakdown, always up to date. Brands see exactly who they're reaching before they invite you — no back-and-forth.",
    icon: <IdCard className="size-5" />,
  },
  {
    title: "Opportunities in one inbox",
    description:
      "Every deal from B2B brands lands in one place. Review the brief and the fixed price, then accept the ones that fit your voice and audience.",
    icon: <Inbox className="size-5" />,
  },
  {
    title: "Payments built in",
    description:
      "Set your own fixed price per post. Get paid by SEPA within 24h of a post going live, and keep 100% of what you charge — Naano bills the brand, not you.",
    icon: <Wallet className="size-5" />,
    footer: (
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium text-accent-600">
          SEPA payouts
        </span>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium text-accent-600">
          Within 24h
        </span>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium text-accent-600">
          Keep 100%
        </span>
      </div>
    ),
  },
  {
    title: "Track your performance",
    description:
      "See the reach, clicks and leads each post drives. Prove your value with real numbers and command better rates over time.",
    icon: <BarChart3 className="size-5" />,
  },
  {
    title: "Easy delivery",
    description:
      "Draft in your own voice, submit for a quick approval, and schedule. No email threads, no invoicing, no chasing — just post and get paid.",
    icon: <Send className="size-5" />,
  },
];

const FAQ = [
  {
    question: "Does it cost anything to join?",
    answer:
      "No. Joining Naano is completely free for creators. You only ever get paid — there are no listing fees or subscriptions.",
  },
  {
    question: "Do I have to work exclusively with Naano?",
    answer:
      "Never. There's no exclusivity. Keep doing your own brand deals; Naano simply brings you additional, well-matched B2B opportunities.",
  },
  {
    question: "When and how do I get paid?",
    answer:
      "You set a fixed price per post. Once your post goes live and is confirmed, you're paid by SEPA transfer within 24 hours — and you keep 100% of your rate.",
  },
  {
    question: "Do I have to accept every deal?",
    answer:
      "No. You review each brief and its price and only accept the ones that fit your audience and voice. Posts always publish from your own account, in your own words.",
  },
];

export default function ForCreatorsPage() {
  return (
    <>
      <Hero
        tone="dark"
        badge="For creators"
        title={
          <>
            Get paid to post on{" "}
            <span className="text-gradient">LinkedIn.</span>
          </>
        }
        subtitle="Choose deals from B2B brands you know, post in your own voice, and get paid within 24h."
        actions={
          <>
            <ButtonLink href="/register?role=creator" variant="white" size="lg">
              Start earning
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

      {/* Trust bar */}
      <section className="border-b border-border bg-white py-6">
        <Container>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <Check className="size-4 text-accent-600" />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <ValueProps
        eyebrow="Why creators join"
        heading="Everything you need to earn from your audience"
        subheading="Set your price, keep your voice, and let Naano handle the briefs, the tracking and the payments."
        items={FEATURES}
      />

      <Faq items={FAQ} />

      <CtaBand
        title="Start earning from your LinkedIn"
        subtitle="Free to join, no exclusivity, paid within 24h."
        actions={
          <ButtonLink href="/register?role=creator" variant="white" size="lg">
            Start earning
            <ArrowRight className="size-4" />
          </ButtonLink>
        }
      />
    </>
  );
}
