import Link from "next/link";
import { Eye, MousePointerClick, Users, Wallet } from "lucide-react";
import { requireCreator } from "@/lib/auth-helpers";
import {
  getCreatorBookings,
  summarizeCreator,
  performanceSeries,
} from "@/lib/creator-queries";
import { formatCompact, formatEuros } from "@/lib/utils";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { AvailabilityToggle } from "@/components/creator/availability-toggle";
import { DealInviteActions } from "@/components/creator/deal-invite-actions";
import { PerformanceChart } from "@/components/creator/performance-chart";

export const metadata = { title: "Creator overview" };

export default async function CreatorOverviewPage() {
  const { creator } = await requireCreator();
  const bookings = await getCreatorBookings(creator.id);
  const summary = summarizeCreator(bookings);
  const series = performanceSeries(bookings);
  const invites = bookings.filter((b) => b.status === "INVITED");

  return (
    <>
      <PageHeader
        title={`Hi, ${creator.displayName.split(" ")[0]}`}
        description="Your deals, performance and earnings at a glance."
        action={<AvailabilityToggle available={creator.available} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total earned" value={formatEuros(summary.totalEarned)} hint="Paid out to date" icon={<Wallet className="size-4" />} />
        <StatCard label="Active deals" value={summary.activeDeals} hint={`${summary.invites} new invite${summary.invites === 1 ? "" : "s"}`} />
        <StatCard label="Total impressions" value={formatCompact(summary.totalImpressions)} icon={<Eye className="size-4" />} />
        <StatCard label="Clicks / leads" value={`${formatCompact(summary.totalClicks)} / ${formatCompact(summary.totalLeads)}`} icon={<MousePointerClick className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Post performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your rate card</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatEuros(creator.pricePerPost)}</span>
              <span className="text-sm text-muted-foreground">/ post</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCompact(creator.followers)} followers · {creator.engagementRate}% engagement
            </p>
            <Link href="/creator/profile" className="text-sm font-medium text-brand hover:underline">
              Edit media kit →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">New invites</h2>
        {invites.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No new invites right now. Keep your profile fresh and available to get discovered.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {invites.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={invite.campaign.name} size={40} />
                    <div>
                      <Link href={`/creator/deals/${invite.id}`} className="font-medium hover:underline">
                        {invite.campaign.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatEuros(invite.pricePerPost)} · {invite.fitScore}% audience fit
                      </p>
                    </div>
                  </div>
                  <DealInviteActions bookingId={invite.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
