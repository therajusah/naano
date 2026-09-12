"use client";

// Recharts area chart for attribution time series (clicks / leads / impressions).
// Client component — recharts needs the DOM. Kept purely presentational: it
// receives already-aggregated points from the server.

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatCompact } from "@/lib/utils";

const BRAND = "#3b6ef6";
const ACCENT = "#16c98d";
const IMPRESSION = "#94a3b8";

export type MetricPoint = {
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  leads: number;
};

type SeriesKey = "impressions" | "clicks" | "leads";

const SERIES_META: Record<SeriesKey, { label: string; color: string }> = {
  impressions: { label: "Impressions", color: IMPRESSION },
  clicks: { label: "Clicks", color: BRAND },
  leads: { label: "Leads", color: ACCENT },
};

function formatAxisDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d");
  } catch {
    return value;
  }
}

export function MetricsAreaChart({
  data,
  series = ["clicks", "leads"],
  height = 260,
}: {
  data: MetricPoint[];
  series?: SeriesKey[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            {series.map((key) => (
              <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_META[key].color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={SERIES_META[key].color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={48}
            allowDecimals={false}
            tickFormatter={(value) => formatCompact(Number(value))}
          />
          <Tooltip
            labelFormatter={(label) => formatAxisDate(String(label))}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          {series.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={SERIES_META[key].label}
              stroke={SERIES_META[key].color}
              strokeWidth={2}
              fill={`url(#fill-${key})`}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
