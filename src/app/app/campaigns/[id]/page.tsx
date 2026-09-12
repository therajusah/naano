import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  Users,
  MousePointerClick,
  Eye,
  Wallet,
} from "lucide-react";
import type { Booking, PostMetricDaily } from "@prisma/client";
import { requireCompany } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { FitScoreRing } from "@/components/ui/fit-score";
import { CampaignStatusControl } from "@/components/company/campaign-status-control";
import {
  BookingPipeline,
  type PipelineBooking,
} from "@/components/company/booking-pipeline";
import { MetricsAreaChart } from "@/components/company/metrics-area-chart";
import { formatEuros, formatCompact, formatDate } from "@/lib/utils";
import { campaignMetricSeries, METRICS_WINDOW_DAYS } from "@/lib/company-queries";

const CAMPAIGN_STATUS_VARIANT: Record<string, "default" | "brand" | "success" | "outline"> = {
  DRAFT: "outline",
  ACTIVE: "brand",
  COMPLETED: "success",
  ARCHIVED: "default",
};

type BookingWithRelations = Booking & {
  creator: { displayName: string; avatarUrl: string | null };
  metrics: Pick<PostMetricDaily, "impressions" | "clicks" | "leads">[];
  payout: { amount: number; status: string } | null;
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { company } = await requireCompany();
  const { id } = await params;

  // Ownership check (OWASP-IDOR-001): scope by companyProfileId — not owned = 404.
  const campaign = await prisma.campaign.findFirst({
    where: { id, companyProfileId: company.id },
    include: {
      brief: true,
      bookings: {
        orderBy: { createdAt: "asc" },
        include: {
          creator: { select: { displayName: true, avatarUrl: true } },
          metrics: { select: { impressions: true, clicks: true, leads: true } },
          payout: { select: { amount: true, status: true } },
        },
      },
    },
  });
  if (!campaign) notFound();

  const bookings = campaign.bookings as BookingWithRelations[];
  const series = await campaignMetricSeries(company.id, campaign.id);

  const totals = aggregateBookingTotals(bookings);
  const payouts = aggregatePayouts(bookings);

  const leads = await prisma.lead.findMany({
    where: { booking: { campaignId: campaign.id } },
    orderBy: { capturedAt: "desc" },
    include: { booking: { include: { creator: { select: { displayName: true } } } } },
  });

  const pipelineBookings: PipelineBooking[] = bookings.map((booking) => ({
    id: booking.id,
    status: booking.status,
    creatorName: booking.creator.displayName,
    creatorAvatar: booking.creator.avatarUrl,
    pricePerPost: booking.pricePerPost,
    fitScore: booking.fitScore,
    trackedSlug: booking.trackedSlug,
  }));

  return (
    <>
      <div className="mb-2">
        <Link
          href="/app/campaigns"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to campaigns
        </Link>
      </div>

      <PageHeader
        title={campaign.name}
        description={campaign.objective ?? "No objective set."}
        action={<CampaignStatusControl campaignId={campaign.id} status={campaign.status} />}
      />

      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status] ?? "default"}>
          {campaign.status.toLowerCase()}
        </Badge>
        {campaign.vertical && <Badge variant="outline">{campaign.vertical}</Badge>}
        <span className="text-sm text-muted-foreground">Budget {formatEuros(campaign.budget)}</span>
        <span className="text-sm text-muted-foreground">
          Target {campaign.targetPostCount} post{campaign.targetPostCount === 1 ? "" : "s"}
        </span>
        {campaign.startDate && (
          <span className="text-sm text-muted-foreground">
            {formatDate(campaign.startDate)}
            {campaign.endDate ? ` – ${formatDate(campaign.endDate)}` : ""}
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Bookings" value={bookings.length} icon={<Users className="size-5" />} />
        <StatCard
          label="Impressions"
          value={formatCompact(totals.impressions)}
          icon={<Eye className="size-5" />}
        />
        <StatCard
          label="Clicks"
          value={formatCompact(totals.clicks)}
          icon={<MousePointerClick className="size-5" />}
        />
        <StatCard
          label="Leads"
          value={formatCompact(totals.leads)}
          icon={<Target className="size-5" />}
        />
        <StatCard
          label="Paid out"
          value={formatEuros(payouts.paid)}
          hint={`${formatEuros(payouts.pending)} pending`}
          icon={<Wallet className="size-5" />}
        />
      </div>

      {/* Brief */}
      {campaign.brief && <BriefCard brief={campaign.brief} />}

      {/* Pipeline kanban */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Booking pipeline</h2>
        {bookings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No creators booked yet.{" "}
              <Link href="/app/discover" className="font-medium text-brand hover:text-brand-700">
                Discover creators
              </Link>{" "}
              to invite them onto this campaign.
            </p>
          </Card>
        ) : (
          <BookingPipeline bookings={pipelineBookings} />
        )}
      </section>

      {/* Attribution dashboard */}
      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Impressions, clicks &amp; leads over the last {METRICS_WINDOW_DAYS} days.
            </p>
          </CardHeader>
          <CardContent>
            <MetricsAreaChart data={series} series={["impressions", "clicks", "leads"]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-semibold text-success">{formatEuros(payouts.paid)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-semibold text-warning">{formatEuros(payouts.pending)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Committed spend</span>
              <span className="font-semibold">{formatEuros(payouts.paid + payouts.pending)}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Per-creator performance table */}
      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Creator performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bookings.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No bookings to report yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Creator</th>
                      <th className="px-5 py-3 font-medium">Fit</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Impressions</th>
                      <th className="px-5 py-3 font-medium">Clicks</th>
                      <th className="px-5 py-3 font-medium">Leads</th>
                      <th className="px-5 py-3 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map((booking) => {
                      const perBooking = sumMetricRows(booking.metrics);
                      return (
                        <tr key={booking.id}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={booking.creator.displayName}
                                src={booking.creator.avatarUrl}
                                size={28}
                              />
                              <span className="font-medium">{booking.creator.displayName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <FitScoreRing score={booking.fitScore} size={34} />
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs text-muted-foreground">
                              {booking.status.toLowerCase().replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {formatCompact(perBooking.impressions)}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {formatCompact(perBooking.clicks)}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {formatCompact(perBooking.leads)}
                          </td>
                          <td className="px-5 py-3 font-medium">
                            {formatEuros(booking.pricePerPost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Leads */}
      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads ({leads.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leads.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No identifiable leads captured yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Title</th>
                      <th className="px-5 py-3 font-medium">Company</th>
                      <th className="px-5 py-3 font-medium">Source creator</th>
                      <th className="px-5 py-3 font-medium">Captured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-5 py-3 font-medium">{lead.name}</td>
                        <td className="px-5 py-3 text-muted-foreground">{lead.title}</td>
                        <td className="px-5 py-3 text-muted-foreground">{lead.company}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {lead.booking.creator.displayName}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatDate(lead.capturedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

// --- Local aggregation helpers ----------------------------------------------

function sumMetricRows(rows: { impressions: number; clicks: number; leads: number }[]) {
  return rows.reduce(
    (acc, row) => ({
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      leads: acc.leads + row.leads,
    }),
    { impressions: 0, clicks: 0, leads: 0 },
  );
}

function aggregateBookingTotals(bookings: BookingWithRelations[]) {
  return bookings.reduce(
    (acc, booking) => {
      const perBooking = sumMetricRows(booking.metrics);
      return {
        impressions: acc.impressions + perBooking.impressions,
        clicks: acc.clicks + perBooking.clicks,
        leads: acc.leads + perBooking.leads,
      };
    },
    { impressions: 0, clicks: 0, leads: 0 },
  );
}

function aggregatePayouts(bookings: BookingWithRelations[]) {
  let paid = 0;
  let pending = 0;
  for (const booking of bookings) {
    if (!booking.payout) continue;
    if (booking.payout.status === "PAID") paid += booking.payout.amount;
    else pending += booking.payout.amount;
  }
  return { paid, pending };
}

// --- Brief display ----------------------------------------------------------

function BriefCard({
  brief,
}: {
  brief: {
    angle: string;
    hook: string;
    cta: string;
    audience: string;
    toneOfVoice: string;
    keyMessages: string[];
    doList: string[];
    dontList: string[];
    proofPoints: string[];
    generatedByAI: boolean;
  };
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Campaign brief</CardTitle>
          {brief.generatedByAI && <Badge variant="brand">AI-drafted</Badge>}
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <BriefText label="Angle" value={brief.angle} />
        <BriefText label="Hook" value={brief.hook} />
        <BriefText label="Call to action" value={brief.cta} />
        <BriefText label="Audience" value={brief.audience} />
        <BriefText label="Tone of voice" value={brief.toneOfVoice} />
        <BriefList label="Key messages" items={brief.keyMessages} />
        <BriefList label="Do" items={brief.doList} />
        <BriefList label="Don't" items={brief.dontList} />
        <BriefList label="Proof points" items={brief.proofPoints} />
      </CardContent>
    </Card>
  );
}

function BriefText({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function BriefList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <ul className="mt-1 flex list-inside list-disc flex-col gap-1 text-sm">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
