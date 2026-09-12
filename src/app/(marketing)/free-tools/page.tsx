import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Activity,
  PackageCheck,
  PiggyBank,
} from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Free tools for B2B creators & marketers | Naano",
  description:
    "Free calculators for LinkedIn B2B creators and marketers: price your posts, check your engagement rate, estimate delivery odds, and plan a campaign budget.",
};

const TOOLS = [
  {
    href: "/free-tools/creator-worth",
    icon: Calculator,
    title: "Creator Worth Calculator",
    description:
      "Find a fair price per sponsored post based on your followers, engagement and niche.",
    audience: "For creators",
  },
  {
    href: "/free-tools/engagement-rate",
    icon: Activity,
    title: "Engagement Rate Calculator",
    description:
      "Measure your true engagement rate and see how sponsors will read it.",
    audience: "For creators",
  },
  {
    href: "/free-tools/delivery-odds",
    icon: PackageCheck,
    title: "Delivery Odds Estimator",
    description:
      "See how likely a sponsored post is to actually get published at a given price.",
    audience: "For brands",
  },
  {
    href: "/free-tools/budget-planner",
    icon: PiggyBank,
    title: "Campaign Budget Planner",
    description:
      "Turn a budget into an expected number of published posts, impressions and leads.",
    audience: "For brands",
  },
] as const;

export default function FreeToolsPage() {
  return (
    <>
      <Hero
        badge={<>Free tools &middot; No sign-up required</>}
        title={
          <>
            Free tools for B2B <span className="text-gradient">creators & marketers</span>
          </>
        }
        subtitle="Quick, no-nonsense calculators to price your posts, benchmark your engagement, and plan smarter LinkedIn campaigns."
      />

      <section className="bg-white py-20 sm:py-24">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            eyebrow="The toolkit"
            title="Pick a calculator"
            subtitle="Each tool runs instantly in your browser — enter your numbers and see results update live."
          />

          <div className="grid gap-6 sm:grid-cols-2">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="flex h-full flex-col gap-4 p-6 transition-shadow group-hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand-700">
                        <Icon className="size-5" />
                      </span>
                      <Badge variant="outline">{tool.audience}</Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">
                        {tool.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                      Open tool
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Card className="hero-clouds flex flex-col items-start gap-4 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Done crunching numbers?
              </h3>
              <p className="mt-1 max-w-xl text-sm text-white/70">
                Launch a real campaign on Naano — book vetted B2B creators and pay a
                fixed price per published post.
              </p>
            </div>
            <ButtonLink
              href="/register?role=company"
              variant="white"
              size="lg"
              className="shrink-0"
            >
              Get started free
              <ArrowRight />
            </ButtonLink>
          </Card>
        </Container>
      </section>
    </>
  );
}
