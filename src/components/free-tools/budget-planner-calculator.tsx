"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { PRICE_BANDS } from "@/lib/constants";
import { formatCompact, formatEuros, formatPercentFromFraction } from "@/lib/utils";
import { BUDGET_ASSUMPTIONS, computeBudgetPlan, priceBandByLabel } from "./calc";
import { DashValue, HowItWorks, ToolCta, parseNumericInput } from "./shared";

type PricingMode = "band" | "custom";

export function BudgetPlannerCalculator() {
  const [budget, setBudget] = useState("10000");
  const [mode, setMode] = useState<PricingMode>("band");
  const [bandLabel, setBandLabel] = useState<string>(PRICE_BANDS[2].label);
  const [customPrice, setCustomPrice] = useState("300");

  const selectedBand = priceBandByLabel(bandLabel);
  const pricePerPost =
    mode === "band"
      ? selectedBand?.median ?? NaN
      : parseNumericInput(customPrice) ?? NaN;

  const plan = computeBudgetPlan(parseNumericInput(budget) ?? NaN, pricePerPost);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Plan your spend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Total budget (€)" htmlFor="bp-budget">
            <Input
              id="bp-budget"
              type="number"
              min={0}
              inputMode="numeric"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="e.g. 10000"
            />
          </Field>

          <Field
            label="Pricing basis"
            htmlFor="bp-mode"
            hint="Use a follower band's median price, or enter your own."
          >
            <Select
              id="bp-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as PricingMode)}
            >
              <option value="band">By creator follower band</option>
              <option value="custom">My own average price</option>
            </Select>
          </Field>

          {mode === "band" ? (
            <Field
              label="Target follower band"
              htmlFor="bp-band"
              hint={
                selectedBand
                  ? `Median ${formatEuros(selectedBand.median)} per post`
                  : undefined
              }
            >
              <Select
                id="bp-band"
                value={bandLabel}
                onChange={(event) => setBandLabel(event.target.value)}
              >
                {PRICE_BANDS.map((priceBand) => (
                  <option key={priceBand.label} value={priceBand.label}>
                    {priceBand.label} followers — {formatEuros(priceBand.median)}/post
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Average price per post (€)" htmlFor="bp-price">
              <Input
                id="bp-price"
                type="number"
                min={0}
                inputMode="numeric"
                value={customPrice}
                onChange={(event) => setCustomPrice(event.target.value)}
                placeholder="e.g. 300"
              />
            </Field>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-3">
        <Card className="hero-clouds text-white">
          <CardContent className="p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Expected published posts
            </p>
            <div className="mt-3 text-5xl font-extrabold tracking-tight">
              {plan ? Math.round(plan.publishedPosts).toLocaleString() : <DashValue />}
            </div>
            <p className="mt-3 text-sm text-white/70">
              {plan ? (
                <>
                  From ~{Math.round(plan.bookedPosts).toLocaleString()} booked posts at{" "}
                  {formatEuros(plan.medianPrice)} each, with a{" "}
                  {formatPercentFromFraction(plan.deliveryRate)} publish rate.
                </>
              ) : (
                "Enter a budget and price to estimate published posts."
              )}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Est. total impressions"
            value={plan ? formatCompact(plan.totalImpressions) : <DashValue />}
            hint={`~${formatCompact(BUDGET_ASSUMPTIONS.impressionsPerPost)} per published post (est.)`}
          />
          <StatCard
            label="Est. leads range"
            value={
              plan ? (
                `${Math.round(plan.leadsLow).toLocaleString()}–${Math.round(
                  plan.leadsHigh,
                ).toLocaleString()}`
              ) : (
                <DashValue />
              )
            }
            hint={`~${formatPercentFromFraction(
              BUDGET_ASSUMPTIONS.leadRateLow,
              0,
            )}–${formatPercentFromFraction(
              BUDGET_ASSUMPTIONS.leadRateHigh,
              0,
            )} of impressions (rough est.)`}
          />
        </div>
      </div>

      <div className="lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border text-sm">
              <PlanRow
                term="Price per post"
                value={plan ? formatEuros(plan.medianPrice) : <DashValue />}
              />
              <PlanRow
                term="Posts booked (budget ÷ price)"
                value={
                  plan ? Math.round(plan.bookedPosts).toLocaleString() : <DashValue />
                }
              />
              <PlanRow
                term="Publish rate for this price"
                value={plan ? formatPercentFromFraction(plan.deliveryRate) : <DashValue />}
              />
              <PlanRow
                term="Expected published posts"
                value={
                  plan ? (
                    Math.round(plan.publishedPosts).toLocaleString()
                  ) : (
                    <DashValue />
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <HowItWorks>
          <p>
            We divide your budget by the price per post to get the number of posts you
            can book, then multiply by the historical publish rate for that price band —
            because not every booked post gets published. That gives a realistic count of{" "}
            <em>published</em> posts.
          </p>
          <p>
            The leads range is a deliberately rough estimate: we assume roughly{" "}
            {formatCompact(BUDGET_ASSUMPTIONS.impressionsPerPost)} impressions per
            published post and that{" "}
            {formatPercentFromFraction(BUDGET_ASSUMPTIONS.leadRateLow, 0)}–
            {formatPercentFromFraction(BUDGET_ASSUMPTIONS.leadRateHigh, 0)} of those
            convert to leads. Treat it as a directional sanity-check, not a forecast —
            real results depend on your offer, creators and audience match.
          </p>
        </HowItWorks>
        <ToolCta
          heading="Plan and launch your campaign on Naano"
          blurb="Set a budget, pick creators your buyers trust, and track every click and lead in one place."
          label="Start a campaign"
        />
      </div>
    </div>
  );
}

function PlanRow({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
