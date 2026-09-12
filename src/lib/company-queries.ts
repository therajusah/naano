// Read-side helpers for the company (brand) dashboard.
//
// All exported functions require the caller to pass an already-authorized
// `companyId` (sourced from requireCompany() in the page/action). They ONLY
// ever query records scoped to that company id (OWASP-IDOR-001) — nothing here
// trusts a client-supplied id for ownership.
//
// These are pure data-shaping helpers over Prisma reads: they never mutate.

import { prisma } from "@/lib/prisma";
import { computeFitScore, asAudienceMap, type IcpTarget } from "@/lib/fit-score";
import { BOOKING_PIPELINE } from "@/lib/constants";
import type { CreatorProfile } from "@prisma/client";

// --- Tunable constants (BP-CONST-001 — no magic numbers in logic) -----------

/** Days of history rendered in the overview / attribution time-series charts. */
export const METRICS_WINDOW_DAYS = 21;

/**
 * Assumed value of a single captured lead, used purely to render an indicative
 * "attributed pipeline" figure. This is a display proxy, clearly labelled in the
 * UI as an estimate — not a stored monetary amount.
 */
export const ASSUMED_DEAL_VALUE_EUROS = 2500;

/** Booking statuses that count as a "live post" for KPI purposes. */
export const LIVE_BOOKING_STATUSES = ["LIVE", "COMPLETED", "PAID"] as const;

/** How many top-matched creators to preview on the overview page. */
export const TOP_CREATORS_PREVIEW_LIMIT = 5;

/** How many recent campaigns to preview on the overview page. */
export const RECENT_CAMPAIGNS_PREVIEW_LIMIT = 5;

// --- Shared date helpers ----------------------------------------------------

/** Midnight UTC for `date` — matches how PostMetricDaily rows are keyed. */
export function toUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** The inclusive-start UTC day `days` before today (for windowed queries). */
export function windowStartDay(days: number): Date {
  const start = toUtcDay(new Date());
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

/** "YYYY-MM-DD" key for a date, used to bucket a time series map. */
function dayKey(date: Date): string {
  return toUtcDay(date).toISOString().slice(0, 10);
}

// --- Types ------------------------------------------------------------------

export type MetricPoint = {
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  leads: number;
};

export type CompanyKpis = {
  activeCampaigns: number;
  livePosts: number;
  totalClicks: number;
  totalLeads: number;
  totalImpressions: number;
  estimatedPipelineEuros: number;
};

export type RankedCreator = {
  creator: CreatorProfile;
  fitScore: number;
};

export type CampaignPerformanceRow = {
  campaignId: string;
  name: string;
  status: string;
  budget: number;
  postCount: number;
  impressions: number;
  clicks: number;
  leads: number;
  spend: number;
};

// --- ICP + fit ranking ------------------------------------------------------

/** Build the fit-score ICP target from a company profile's stored preferences. */
export function icpTargetForCompany(company: {
  icpFunctions: string[];
  icpSeniorities: string[];
  vertical: string | null;
}): IcpTarget {
  return {
    functions: company.icpFunctions,
    seniorities: company.icpSeniorities,
    vertical: company.vertical,
  };
}

/** The minimal creator shape the fit score needs (a subset of CreatorProfile). */
export type ScorableCreator = {
  audienceByFunction: unknown;
  audienceBySeniority: unknown;
  verticals: string[];
};

/** Score a single creator against a company ICP (deterministic, 0..100). */
export function scoreCreator(target: IcpTarget, creator: ScorableCreator): number {
  return computeFitScore(target, {
    audienceByFunction: asAudienceMap(creator.audienceByFunction),
    audienceBySeniority: asAudienceMap(creator.audienceBySeniority),
    verticals: creator.verticals,
  });
}

/** Attach fit scores to creators and sort highest-first. Does not mutate input. */
export function rankCreatorsByFit(
  target: IcpTarget,
  creators: CreatorProfile[],
): RankedCreator[] {
  return creators
    .map((creator) => ({ creator, fitScore: scoreCreator(target, creator) }))
    .sort((a, b) => b.fitScore - a.fitScore);
}

// --- Metric aggregation -----------------------------------------------------

type RawMetricRow = { date: Date; impressions: number; clicks: number; leads: number };

/**
 * Collapse per-booking daily metric rows into a single dense time series over a
 * fixed trailing window. Days with no data are emitted as zeroes so charts show
 * a continuous axis.
 */
export function buildMetricSeries(
  rows: RawMetricRow[],
  windowDays: number = METRICS_WINDOW_DAYS,
): MetricPoint[] {
  const byDay = new Map<string, MetricPoint>();
  const start = windowStartDay(windowDays);

  for (let offset = 0; offset < windowDays; offset += 1) {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + offset);
    const key = dayKey(day);
    byDay.set(key, { date: key, impressions: 0, clicks: 0, leads: 0 });
  }

  for (const row of rows) {
    const key = dayKey(row.date);
    const point = byDay.get(key);
    if (!point) continue; // outside the window — ignore
    point.impressions += row.impressions;
    point.clicks += row.clicks;
    point.leads += row.leads;
  }

  return Array.from(byDay.values());
}

/** Sum a metric series into window totals. */
export function sumMetrics(points: MetricPoint[]): {
  impressions: number;
  clicks: number;
  leads: number;
} {
  return points.reduce(
    (acc, point) => ({
      impressions: acc.impressions + point.impressions,
      clicks: acc.clicks + point.clicks,
      leads: acc.leads + point.leads,
    }),
    { impressions: 0, clicks: 0, leads: 0 },
  );
}

// --- Company-scoped aggregate reads -----------------------------------------

/**
 * The trailing-window metric series aggregated across every booking of every
 * campaign owned by `companyId`. Returns dense zero-filled points.
 */
export async function companyMetricSeries(
  companyId: string,
  windowDays: number = METRICS_WINDOW_DAYS,
): Promise<MetricPoint[]> {
  const rows = await prisma.postMetricDaily.findMany({
    where: {
      date: { gte: windowStartDay(windowDays) },
      booking: { campaign: { companyProfileId: companyId } },
    },
    select: { date: true, impressions: true, clicks: true, leads: true },
  });
  return buildMetricSeries(rows, windowDays);
}

/**
 * The trailing-window metric series for a single campaign. The caller MUST have
 * already verified the campaign belongs to the current company; we still scope
 * the query defensively through the campaign's company id.
 */
export async function campaignMetricSeries(
  companyId: string,
  campaignId: string,
  windowDays: number = METRICS_WINDOW_DAYS,
): Promise<MetricPoint[]> {
  const rows = await prisma.postMetricDaily.findMany({
    where: {
      date: { gte: windowStartDay(windowDays) },
      booking: { campaignId, campaign: { companyProfileId: companyId } },
    },
    select: { date: true, impressions: true, clicks: true, leads: true },
  });
  return buildMetricSeries(rows, windowDays);
}

/** Headline KPIs for the overview page — all scoped to `companyId`. */
export async function companyKpis(companyId: string): Promise<CompanyKpis> {
  const [activeCampaigns, livePosts, metricTotals, totalLeads] = await Promise.all([
    prisma.campaign.count({
      where: { companyProfileId: companyId, status: "ACTIVE" },
    }),
    prisma.booking.count({
      where: {
        campaign: { companyProfileId: companyId },
        status: { in: [...LIVE_BOOKING_STATUSES] },
      },
    }),
    prisma.postMetricDaily.aggregate({
      where: { booking: { campaign: { companyProfileId: companyId } } },
      _sum: { clicks: true, leads: true, impressions: true },
    }),
    prisma.lead.count({
      where: { booking: { campaign: { companyProfileId: companyId } } },
    }),
  ]);

  return {
    activeCampaigns,
    livePosts,
    totalClicks: metricTotals._sum.clicks ?? 0,
    totalLeads,
    totalImpressions: metricTotals._sum.impressions ?? 0,
    estimatedPipelineEuros: totalLeads * ASSUMED_DEAL_VALUE_EUROS,
  };
}

/**
 * Per-campaign performance rollup for the reports page. One row per campaign
 * owned by `companyId`, with lifetime (not windowed) metric sums and booked spend.
 */
export async function campaignPerformanceRows(
  companyId: string,
): Promise<CampaignPerformanceRow[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { companyProfileId: companyId },
    orderBy: { createdAt: "desc" },
    include: {
      bookings: {
        select: {
          pricePerPost: true,
          status: true,
          metrics: { select: { impressions: true, clicks: true, leads: true } },
        },
      },
    },
  });

  return campaigns.map((campaign) => {
    let impressions = 0;
    let clicks = 0;
    let leads = 0;
    let spend = 0;
    for (const booking of campaign.bookings) {
      if (isSpendCounted(booking.status)) spend += booking.pricePerPost;
      for (const metric of booking.metrics) {
        impressions += metric.impressions;
        clicks += metric.clicks;
        leads += metric.leads;
      }
    }
    return {
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      postCount: campaign.bookings.length,
      impressions,
      clicks,
      leads,
      spend,
    };
  });
}

/**
 * A booking's price counts as committed spend once the creator is locked in
 * (APPROVED onward). Earlier stages are still speculative.
 */
function isSpendCounted(status: string): boolean {
  const committedIndex = BOOKING_PIPELINE.indexOf(
    "APPROVED" as (typeof BOOKING_PIPELINE)[number],
  );
  const statusIndex = BOOKING_PIPELINE.indexOf(status as (typeof BOOKING_PIPELINE)[number]);
  return statusIndex >= committedIndex && committedIndex >= 0;
}
