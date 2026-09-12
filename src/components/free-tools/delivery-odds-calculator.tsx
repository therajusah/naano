"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { DELIVERY_RATES } from "@/lib/constants";
import { formatPercentFromFraction } from "@/lib/utils";
import { deliveryBandForPrice } from "./calc";
import { DashValue, HowItWorks, ToolCta, parseNumericInput } from "./shared";

export function DeliveryOddsCalculator() {
  const [price, setPrice] = useState("350");

  const parsedPrice = parseNumericInput(price);
  const band = deliveryBandForPrice(parsedPrice ?? NaN);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Price per post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Offer price (€)"
            htmlFor="do-price"
            hint="What you plan to pay a creator per sponsored post."
          >
            <Input
              id="do-price"
              type="number"
              min={0}
              inputMode="numeric"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="e.g. 350"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-3">
        <Card className="hero-clouds text-white">
          <CardContent className="p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Expected delivery rate
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="text-5xl font-extrabold tracking-tight">
                {band ? formatPercentFromFraction(band.rate) : <DashValue />}
              </span>
              {band && <Badge variant="ink">{band.label}</Badge>}
            </div>
            <p className="mt-3 text-sm text-white/70">
              {band
                ? "The share of accepted bookings at this price band that end up published, based on Naano Q2-2026 benchmarks."
                : "Enter an offer price to estimate the odds a booking gets published."}
            </p>
          </CardContent>
        </Card>

        <StatCard
          label="Rule of thumb"
          value="Higher offers publish more often"
          hint="Delivery rate rises with price — creators prioritise better-paid collaborations."
        />
      </div>

      <div className="lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery odds by price band</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Price band</th>
                    <th className="pb-2 font-medium">Expected publish rate</th>
                  </tr>
                </thead>
                <tbody>
                  {DELIVERY_RATES.map((row) => {
                    const isActive = band?.label === row.label;
                    return (
                      <tr
                        key={row.label}
                        className={
                          isActive
                            ? "border-b border-border bg-brand/5"
                            : "border-b border-border"
                        }
                      >
                        <td className="py-3 font-medium text-foreground">
                          <span className="flex items-center gap-2">
                            {row.label}
                            {isActive && <Badge variant="brand">Your offer</Badge>}
                          </span>
                        </td>
                        <td className="py-3 text-foreground">
                          {formatPercentFromFraction(row.rate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <Card className="flex items-start gap-3 border-warning/30 bg-warning/5 p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Delivery isn&rsquo;t
            guaranteed.</span>{" "}
            A creator may accept a booking but not publish. Always budget on the number
            of <em>published</em> posts you expect, not the number you book — plan with
            the rate above baked in.
          </p>
        </Card>

        <HowItWorks>
          <p>
            When you invite a creator, they can accept and still not follow through with
            a published post. These benchmarks show, for accepted bookings in each price
            band, what share historically get published.
          </p>
          <p>
            The pattern is consistent: the more you offer, the more likely the post
            actually goes live, because creators prioritise their better-paid
            collaborations. Use this to sanity-check your per-post budget before you
            launch.
          </p>
        </HowItWorks>
        <ToolCta />
      </div>
    </div>
  );
}
