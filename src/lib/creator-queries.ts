import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PerformancePoint } from "@/components/creator/performance-chart";

// Booking states grouped for the creator experience (BP-CONST-001).
export const ACTIVE_DEAL_STATUSES: BookingStatus[] = [
  "ACCEPTED",
  "DRAFT_SUBMITTED",
  "APPROVED",
  "SCHEDULED",
];
export const PUBLISHED_STATUSES: BookingStatus[] = ["LIVE", "COMPLETED", "PAID"];

const PERFORMANCE_WINDOW_DAYS = 21;

/** All of a creator's bookings with the data the dashboard needs. */
export async function getCreatorBookings(creatorProfileId: string) {
  return prisma.booking.findMany({
    where: { creatorProfileId },
    include: {
      campaign: { select: { id: true, name: true, objective: true } },
      metrics: true,
      payout: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export type CreatorBooking = Awaited<ReturnType<typeof getCreatorBookings>>[number];

export type CreatorSummary = {
  invites: number;
  activeDeals: number;
  liveDeals: number;
  totalEarned: number;
  pendingEarnings: number;
  totalImpressions: number;
  totalClicks: number;
  totalLeads: number;
};

export function summarizeCreator(bookings: CreatorBooking[]): CreatorSummary {
  const summary: CreatorSummary = {
    invites: 0,
    activeDeals: 0,
    liveDeals: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLeads: 0,
  };

  for (const booking of bookings) {
    if (booking.status === "INVITED") summary.invites += 1;
    if (ACTIVE_DEAL_STATUSES.includes(booking.status)) summary.activeDeals += 1;
    if (PUBLISHED_STATUSES.includes(booking.status)) summary.liveDeals += 1;

    if (booking.payout?.status === "PAID") summary.totalEarned += booking.payout.amount;
    else if (booking.payout) summary.pendingEarnings += booking.payout.amount;

    for (const metric of booking.metrics) {
      summary.totalImpressions += metric.impressions;
      summary.totalClicks += metric.clicks;
      summary.totalLeads += metric.leads;
    }
  }
  return summary;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Dense last-21-day impressions/clicks series aggregated across all posts. */
export function performanceSeries(bookings: CreatorBooking[]): PerformancePoint[] {
  const totals = new Map<string, { impressions: number; clicks: number }>();
  for (const booking of bookings) {
    for (const metric of booking.metrics) {
      const key = dayKey(metric.date);
      const entry = totals.get(key) ?? { impressions: 0, clicks: 0 };
      entry.impressions += metric.impressions;
      entry.clicks += metric.clicks;
      totals.set(key, entry);
    }
  }
  if (totals.size === 0) return [];

  const series: PerformancePoint[] = [];
  const today = new Date();
  for (let offset = PERFORMANCE_WINDOW_DAYS - 1; offset >= 0; offset--) {
    const day = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset),
    );
    const key = dayKey(day);
    const entry = totals.get(key) ?? { impressions: 0, clicks: 0 };
    series.push({
      date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      impressions: entry.impressions,
      clicks: entry.clicks,
    });
  }
  return series;
}
