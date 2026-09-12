"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { VERTICALS } from "@/lib/constants";
import { formatCompact, formatEuros } from "@/lib/utils";
import { computeCreatorWorth } from "./calc";
import { DashValue, HowItWorks, ToolCta, parseNumericInput } from "./shared";

export function CreatorWorthCalculator() {
  const [followers, setFollowers] = useState("12000");
  const [avgReactions, setAvgReactions] = useState("180");
  const [avgComments, setAvgComments] = useState("24");
  const [niche, setNiche] = useState<string>(VERTICALS[0]);

  const result = computeCreatorWorth(
    parseNumericInput(followers) ?? NaN,
    parseNumericInput(avgReactions) ?? 0,
    parseNumericInput(avgComments) ?? 0,
    niche,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Your numbers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Followers" htmlFor="cw-followers" hint="Total LinkedIn followers.">
            <Input
              id="cw-followers"
              type="number"
              min={0}
              inputMode="numeric"
              value={followers}
              onChange={(event) => setFollowers(event.target.value)}
              placeholder="e.g. 12000"
            />
          </Field>
          <Field label="Avg. reactions per post" htmlFor="cw-reactions">
            <Input
              id="cw-reactions"
              type="number"
              min={0}
              inputMode="numeric"
              value={avgReactions}
              onChange={(event) => setAvgReactions(event.target.value)}
              placeholder="e.g. 180"
            />
          </Field>
          <Field label="Avg. comments per post" htmlFor="cw-comments">
            <Input
              id="cw-comments"
              type="number"
              min={0}
              inputMode="numeric"
              value={avgComments}
              onChange={(event) => setAvgComments(event.target.value)}
              placeholder="e.g. 24"
            />
          </Field>
          <Field label="Niche" htmlFor="cw-niche" hint="Some B2B niches command a premium.">
            <Select
              id="cw-niche"
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
            >
              {VERTICALS.map((vertical) => (
                <option key={vertical} value={vertical}>
                  {vertical}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-3">
        <Card className="hero-clouds text-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70">
              <Sparkles className="size-4" />
              Suggested price per post
            </div>
            <div className="mt-3 text-5xl font-extrabold tracking-tight">
              {result ? formatEuros(result.suggestedPrice) : <DashValue />}
            </div>
            <p className="mt-3 text-sm text-white/70">
              {result ? (
                <>
                  Typical range{" "}
                  <span className="font-semibold text-white">
                    {formatEuros(result.rangeLow)} – {formatEuros(result.rangeHigh)}
                  </span>{" "}
                  (±20%)
                </>
              ) : (
                "Enter a follower count to see a suggested price."
              )}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Engagement rate"
            value={
              result ? `${result.engagementRatePercent.toFixed(2)}%` : <DashValue />
            }
            hint="(reactions + 2 × comments) ÷ followers"
          />
          <StatCard
            label="Niche multiplier"
            value={result ? `${result.nicheMultiplier.toFixed(2)}×` : <DashValue />}
            hint={niche}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border text-sm">
              <BreakdownRow
                term="Base (€12 / 1K followers, min €100)"
                value={result ? formatEuros(result.base) : <DashValue />}
              />
              <BreakdownRow
                term="Engagement multiplier (capped at 2×)"
                value={
                  result ? (
                    <>
                      {result.engagementMultiplier.toFixed(2)}× &rarr;{" "}
                      {formatEuros(result.engagementAdjusted)}
                    </>
                  ) : (
                    <DashValue />
                  )
                }
              />
              <BreakdownRow
                term="Niche multiplier"
                value={result ? `${result.nicheMultiplier.toFixed(2)}×` : <DashValue />}
              />
              <BreakdownRow
                term="Suggested (rounded to €10, floor €100)"
                value={
                  result ? (
                    <Badge variant="brand">{formatEuros(result.suggestedPrice)}</Badge>
                  ) : (
                    <DashValue />
                  )
                }
              />
            </dl>
            {result && (
              <p className="mt-4 text-xs text-muted-foreground">
                Based on {formatCompact(parseNumericInput(followers) ?? 0)} followers.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <HowItWorks>
          <p>
            We start from a base rate of €12 per 1,000 followers (with a €100 floor),
            then apply an engagement multiplier that rewards creators whose audiences
            actually react and comment. Comments count double because they signal
            deeper attention. The multiplier is capped at 2× so a single viral post
            can&rsquo;t distort your fair rate.
          </p>
          <p>
            Finally we apply a niche multiplier — high-intent B2B categories like SaaS,
            DevTools and AI/ML command a premium because their audiences are more
            valuable to advertisers. This is a guide, not a guarantee: real pricing
            depends on your content quality, audience match and demand.
          </p>
        </HowItWorks>
        <ToolCta
          heading="Are you a brand looking for creators like this?"
          blurb="Browse 3,000+ vetted B2B creators, see transparent pricing, and pay only for published posts."
          label="Find creators"
        />
      </div>
    </div>
  );
}

function BreakdownRow({
  term,
  value,
}: {
  term: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
