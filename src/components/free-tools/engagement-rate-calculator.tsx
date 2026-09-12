"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { engagementQuality, engagementRateFraction, type EngagementQuality } from "./calc";
import { DashValue, HowItWorks, ToolCta, parseNumericInput } from "./shared";

const QUALITY_COPY: Record<
  EngagementQuality,
  { label: string; variant: "warning" | "success" | "brand"; blurb: string }
> = {
  low: {
    label: "Below average",
    variant: "warning",
    blurb:
      "Under 1% is on the low side for B2B LinkedIn. Consider posting more conversational, opinionated content and replying to every comment.",
  },
  solid: {
    label: "Solid",
    variant: "brand",
    blurb:
      "1–3% is a healthy, sponsor-ready engagement rate for B2B LinkedIn. Brands look for exactly this range.",
  },
  excellent: {
    label: "Excellent",
    variant: "success",
    blurb:
      "Above 3% is excellent — your audience is highly engaged, which makes your posts especially valuable to advertisers.",
  },
};

export function EngagementRateCalculator() {
  const [followers, setFollowers] = useState("12000");
  const [avgReactions, setAvgReactions] = useState("180");
  const [avgComments, setAvgComments] = useState("24");

  const fraction = engagementRateFraction(
    parseNumericInput(followers) ?? NaN,
    parseNumericInput(avgReactions) ?? 0,
    parseNumericInput(avgComments) ?? 0,
  );
  const percent = fraction === null ? null : fraction * 100;
  const quality = percent === null ? null : QUALITY_COPY[engagementQuality(percent)];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Your numbers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Followers" htmlFor="er-followers">
            <Input
              id="er-followers"
              type="number"
              min={0}
              inputMode="numeric"
              value={followers}
              onChange={(event) => setFollowers(event.target.value)}
              placeholder="e.g. 12000"
            />
          </Field>
          <Field label="Avg. reactions per post" htmlFor="er-reactions">
            <Input
              id="er-reactions"
              type="number"
              min={0}
              inputMode="numeric"
              value={avgReactions}
              onChange={(event) => setAvgReactions(event.target.value)}
              placeholder="e.g. 180"
            />
          </Field>
          <Field label="Avg. comments per post" htmlFor="er-comments">
            <Input
              id="er-comments"
              type="number"
              min={0}
              inputMode="numeric"
              value={avgComments}
              onChange={(event) => setAvgComments(event.target.value)}
              placeholder="e.g. 24"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-3">
        <Card className="hero-clouds text-white">
          <CardContent className="p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Engagement rate
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="text-5xl font-extrabold tracking-tight">
                {percent === null ? <DashValue /> : `${percent.toFixed(2)}%`}
              </span>
              {quality && <Badge variant={quality.variant}>{quality.label}</Badge>}
            </div>
            <p className="mt-3 text-sm text-white/70">
              {quality
                ? quality.blurb
                : "Enter a follower count to calculate your engagement rate."}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Weighted interactions"
            value={
              percent === null
                ? <DashValue />
                : (
                    (parseNumericInput(avgReactions) ?? 0) +
                    2 * (parseNumericInput(avgComments) ?? 0)
                  ).toLocaleString()
            }
            hint="reactions + 2 × comments"
          />
          <StatCard
            label="Under 1%" value="Low" hint="Room to grow"
          />
          <StatCard label="Over 3%" value="Excellent" hint="Highly engaged" />
        </div>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <HowItWorks>
          <p>
            Engagement rate = (reactions + 2 × comments) ÷ followers, shown as a
            percentage. We weight comments twice as heavily as reactions because a
            comment takes more effort and signals a more attentive audience — exactly
            what sponsors pay for.
          </p>
          <p>
            As a rough guide for B2B LinkedIn: under 1% is below average, 1–3% is a
            solid sponsor-ready range, and above 3% is excellent. Engagement rate
            naturally trends lower as follower count grows, so compare yourself to
            creators of a similar size.
          </p>
        </HowItWorks>
        <ToolCta />
      </div>
    </div>
  );
}
