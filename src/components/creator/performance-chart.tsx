"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_HEIGHT = 260;

export type PerformancePoint = {
  date: string; // pre-formatted label, e.g. "Aug 12"
  impressions: number;
  clicks: number;
};

/**
 * Impressions + clicks over time for a creator's live posts. Data is
 * aggregated server-side; this component only renders the pre-shaped series.
 */
export function PerformanceChart({ data }: { data: PerformancePoint[] }) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
        style={{ height: CHART_HEIGHT }}
      >
        No post performance yet — accept a deal to start tracking.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="impressionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          className="text-xs"
          tick={{ fill: "var(--color-muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          className="text-xs"
          tick={{ fill: "var(--color-muted-foreground)" }}
          tickFormatter={(value) =>
            new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
              Number(value),
            )
          }
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="impressions"
          name="Impressions"
          stroke="var(--color-brand)"
          strokeWidth={2}
          fill="url(#impressionsFill)"
        />
        <Area
          type="monotone"
          dataKey="clicks"
          name="Clicks"
          stroke="var(--color-accent)"
          strokeWidth={2}
          fill="url(#clicksFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
