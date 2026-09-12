import Link from "next/link";
import {
  Megaphone,
  Radio,
  MousePointerClick,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { requireCompany } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { FitScoreRing } from "@/components/ui/fit-score";
import { MetricsAreaChart } from "@/components/company/metrics-area-chart";
import { formatCompact, formatEuros, formatDate } from "@/lib/utils";
import {
  companyKpis,
  companyMetricSeries,
  icpTargetForCompany,
  rankCreatorsByFit,
  ASSUMED_DEAL_VALUE_EUROS,
  TOP_CREATORS_PREVIEW_LIMIT,
  RECENT_CAMPAIGNS_PREVIEW_LIMIT,
  METRICS_WINDOW_DAYS,
} from "@/lib/company-queries";

const CAMPAIGN_STATUS_VARIANT: Record<string, "default" | "brand" | "success" | "outline"> = {
  DRAFT: "outline",
  ACTIVE: "brand",
  COMPLETED: "success",
  ARCHIVED: "default",
};

// Candidate pool for the "top matched creators" preview — score in memory.
const CREATOR_MATCH_POOL = 60;

export default async function CompanyOverviewPage() {
  const { company } = await requireCompany();

  const [kpis, series, recentCampaigns, creatorPool] = await Promise.all([
    companyKpis(company.id),
    companyMetricSeries(company.id),
    prisma.campaign.findMany({
      where: { companyProfileId: company.id },
      orderBy: { createdAt: "desc" },
      take: RECENT_CAMPAIGNS_PREVIEW_LIMIT,
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.creatorProfile.findMany({
      where: { managedByAgencyId: null },
      orderBy: { followers: "desc" },
      take: CREATOR_MATCH_POOL,
    }),
  ]);

  const topMatched = rankCreatorsByFit(icpTargetForCompany(company), creatorPool).slice(
    0,
    TOP_CREATORS_PREVIEW_LIMIT,
  );

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Performance across your campaigns, ${company.companyName}.`}
        action={
          <ButtonLink href="/app/campaigns/new">
            <Sparkles className="size-4" />
            New campaign
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Active campaigns"
          value={kpis.activeCampaigns}
          icon={<Megaphone className="size-5" />}
        />
        <StatCard label="Live posts" value={kpis.livePosts} icon={<Radio className="size-5" />} />
        <StatCard
          label="Total clicks"
          value={formatCompact(kpis.totalClicks)}
          icon={<MousePointerClick className="size-5" />}
        />
        <StatCard
          label="Total leads"
          value={formatCompact(kpis.totalLeads)}
          icon={<Target className="size-5" />}
        />
        <StatCard
          label="Attributed pipeline"
          value={formatEuros(kpis.estimatedPipelineEuros)}
          hint={`Estimate: leads × ${formatEuros(ASSUMED_DEAL_VALUE_EUROS)} assumed deal value`}
          icon={<TrendingUp className="size-5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Clicks &amp; leads</CardTitle>
            <p className="text-sm text-muted-foreground">
              Aggregated across all your booked posts, last {METRICS_WINDOW_DAYS} days.
            </p>
          </CardHeader>
          <CardContent>
            <MetricsAreaChart data={series} series={["clicks", "leads"]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top matched creators</CardTitle>
              <Link
                href="/app/discover"
                className="text-sm font-medium text-brand hover:text-brand-700"
              >
                Discover
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Best fit for your ICP.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topMatched.length === 0 ? (
              <p className="text-sm text-muted-foreground">No creators available yet.</p>
            ) : (
              topMatched.map(({ creator, fitScore }) => (
                <Link
                  key={creator.id}
                  href={`/app/creators/${creator.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <Avatar name={creator.displayName} src={creator.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{creator.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatCompact(creator.followers)} followers
                    </p>
                  </div>
                  <FitScoreRing score={fitScore} size={38} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent campaigns</CardTitle>
              <ButtonLink href="/app/campaigns" variant="outline" size="sm">
                All campaigns
                <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <EmptyOverviewCampaigns />
            ) : (
              <ul className="divide-y divide-border">
                {recentCampaigns.map((campaign) => (
                  <li key={campaign.id}>
                    <Link
                      href={`/app/campaigns/${campaign.id}`}
                      className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {formatDate(campaign.createdAt)} ·{" "}
                          {campaign._count.bookings} booking
                          {campaign._count.bookings === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-muted-foreground sm:inline">
                          {formatEuros(campaign.budget)}
                        </span>
                        <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status] ?? "default"}>
                          {campaign.status.toLowerCase()}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function EmptyOverviewCampaigns() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-muted-foreground">
        No campaigns yet. Launch your first one to start tracking clicks, leads and pipeline.
      </p>
      <ButtonLink href="/app/campaigns/new" variant="brand" size="sm">
        <Sparkles className="size-4" />
        Create your first campaign
      </ButtonLink>
    </div>
  );
}
