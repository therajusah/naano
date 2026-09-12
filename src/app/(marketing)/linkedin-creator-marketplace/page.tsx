import type { Metadata } from "next";
import { ArrowRight, Check, X } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Faq } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { formatEuros } from "@/lib/utils";
import { PRICE_BANDS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "LinkedIn Creator Marketplace",
  description:
    "What a LinkedIn creator marketplace is, how Naano works, how it compares to LinkedIn's native Creator Marketplace, and what sponsored LinkedIn posts actually cost.",
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Define your ICP",
    body: "Tell Naano your vertical and ideal buyer. We surface creators whose audiences are actually made of those people, ranked by an audience-match score.",
  },
  {
    step: "2",
    title: "Brief and book",
    body: "Generate a brief with AI, then book creators at a fixed price per post. You review every draft before it goes live.",
  },
  {
    step: "3",
    title: "Publish and track",
    body: "Posts publish from creators' own profiles with tracked links, so you see clicks, leads and pipeline per creator and per post.",
  },
];

const COMPARISON = [
  {
    feature: "Focus",
    naano: "Built specifically for B2B demand generation",
    native: "General-purpose brand/creator matching",
    naanoWins: true,
  },
  {
    feature: "Discovery",
    naano: "By audience fit — function, seniority & vertical",
    native: "Largely by follower count and topic tags",
    naanoWins: true,
  },
  {
    feature: "Briefing",
    naano: "AI-assisted briefs with approval workflow",
    native: "Manual, handled off-platform",
    naanoWins: true,
  },
  {
    feature: "Attribution",
    naano: "Tracked links → clicks, leads & pipeline",
    native: "Native reach & engagement metrics only",
    naanoWins: true,
  },
  {
    feature: "Payments",
    naano: "Fixed price per post, payouts handled for you",
    native: "Negotiated and settled off-platform",
    naanoWins: true,
  },
  {
    feature: "Pricing model",
    naano: "Free to start, fixed per-post cost",
    native: "Tied to LinkedIn's ads ecosystem",
    naanoWins: true,
  },
];

const FAQ = [
  {
    question: "What is a LinkedIn creator marketplace?",
    answer:
      "It's a platform that connects brands with LinkedIn creators for sponsored posts. Instead of running ads from a company page, brands work with individual creators whose audiences already trust them, and the posts publish from those creators' personal profiles.",
  },
  {
    question: "How is Naano different from LinkedIn's native Creator Marketplace?",
    answer:
      "Naano is purpose-built for B2B. It matches on audience fit rather than follower count, generates briefs with AI, attributes clicks and leads back to each creator with tracked links, and handles fixed-price payments for you.",
  },
  {
    question: "How much do sponsored LinkedIn posts cost?",
    answer:
      "Prices scale with a creator's reach. On Naano the median per-post price ranges from around €84 for smaller creators to €720 for the largest, and every price is fixed and shown before you book.",
  },
  {
    question: "Why do posts perform better from personal profiles?",
    answer:
      "LinkedIn concentrates organic reach on individual accounts rather than company pages. A post from a trusted creator's personal profile typically reaches and engages far more of the right audience than the same message from a brand page.",
  },
];

export default function LinkedInCreatorMarketplacePage() {
  return (
    <>
      <Hero
        tone="dark"
        badge="Guide"
        title={
          <>
            The LinkedIn creator marketplace{" "}
            <span className="text-gradient">built for B2B.</span>
          </>
        }
        subtitle="Work with the creators your buyers already follow, brief them in minutes, and measure the pipeline every sponsored post generates."
        actions={
          <>
            <ButtonLink href="/register?role=company" variant="white" size="lg">
              Launch a campaign
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

      {/* What is a LinkedIn creator marketplace */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              align="left"
              eyebrow="Definition"
              title="What is a LinkedIn creator marketplace?"
            />
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                A LinkedIn creator marketplace is a platform that connects brands
                with the creators who already have the attention of their buyers.
                Rather than pushing ads from a company page, brands sponsor posts
                that publish from a creator&rsquo;s personal profile — where
                LinkedIn concentrates the vast majority of organic reach.
              </p>
              <p>
                For B2B teams, the appeal is trust and relevance. The right creator
                doesn&rsquo;t just have a large following; they have the{" "}
                <span className="font-medium text-foreground">
                  right following
                </span>
                — the exact functions, seniorities and verticals you sell to. A
                marketplace makes those creators discoverable, comparable, and
                bookable in one place.
              </p>
              <p>
                Naano takes that idea and builds it around measurable pipeline:
                every collaboration is matched on audience fit, briefed with AI,
                tracked with unique links, and paid at a fixed price you agree up
                front.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* How Naano works */}
      <section className="bg-muted/30 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="How Naano works"
            subtitle="Three steps from an ICP definition to measurable pipeline."
            className="mx-auto mb-14"
          />
          <ol className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.step}
                className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Comparison table */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Comparison"
            title="Naano vs LinkedIn's native Creator Marketplace"
            subtitle="Both connect brands and creators — but they're built for different jobs."
            className="mx-auto mb-12"
          />
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-5 py-4 font-semibold text-foreground">
                    Feature
                  </th>
                  <th className="px-5 py-4 font-semibold text-foreground">
                    Naano
                  </th>
                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    LinkedIn native
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="align-top">
                    <th
                      scope="row"
                      className="px-5 py-4 font-medium text-foreground"
                    >
                      {row.feature}
                    </th>
                    <td className="px-5 py-4">
                      <span className="flex items-start gap-2 text-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-accent-600" />
                        {row.naano}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-start gap-2 text-muted-foreground">
                        <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                        {row.native}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* What sponsored posts cost */}
      <section className="bg-muted/30 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Pricing benchmarks"
            title="What sponsored LinkedIn posts cost"
            subtitle="Fixed per-post prices scale with reach. These are median prices by creator follower band."
            className="mx-auto mb-12"
          />
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-5 py-4 font-semibold text-foreground">
                    Followers
                  </th>
                  <th className="px-5 py-4 text-right font-semibold text-foreground">
                    Median price / post
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PRICE_BANDS.map((band) => (
                  <tr key={band.label}>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {band.label}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums text-foreground">
                      {formatEuros(band.median)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-muted-foreground">
            Every creator sets their own fixed price, shown before you book — with
            no per-click, per-impression or per-lead costs on top.
          </p>
        </Container>
      </section>

      <Faq items={FAQ} />

      <CtaBand
        title="Find the creators your buyers trust"
        subtitle="Launch a B2B creator campaign on Naano in days."
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
