import Link from "next/link";
import { Eye, MousePointerClick, Target, Wallet, Megaphone } from "lucide-react";
import { requireCompany } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { MetricsAreaChart } from "@/components/company/metrics-area-chart";
import { formatCompact, formatEuros } from "@/lib/utils";
import {
  companyMetricSeries,
  campaignPerformanceRows,
  METRICS_WINDOW_DAYS,
} from "@/lib/company-queries";

const CAMPAIGN_STATUS_VARIANT: Record<string, "default" | "brand" | "success" | "outline"> = {
  DRAFT: "outline",
  ACTIVE: "brand",
  COMPLETED: "success",
  ARCHIVED: "default",
};

export default async function ReportsPage() {
  const { company } = await requireCompany();

  const [series, rows] = await Promise.all([
    companyMetricSeries(company.id),
    campaignPerformanceRows(company.id),
  ]);

  const totals = rows.reduce(
    (acc, row) => ({
      posts: acc.posts + row.postCount,
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      leads: acc.leads + row.leads,
      spend: acc.spend + row.spend,
    }),
    { posts: 0, impressions: 0, clicks: 0, leads: 0, spend: 0 },
  );

  return (
    <>
      <PageHeader
        title="Reports"
        description="Aggregate performance across every campaign."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Campaigns" value={rows.length} icon={<Megaphone className="size-5" />} />
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
          label="Committed spend"
          value={formatEuros(totals.spend)}
          icon={<Wallet className="size-5" />}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Performance trend</CardTitle>
          <p className="text-sm text-muted-foreground">
            Clicks &amp; leads across all campaigns, last {METRICS_WINDOW_DAYS} days.
          </p>
        </CardHeader>
        <CardContent>
          <MetricsAreaChart data={series} series={["clicks", "leads"]} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>By campaign</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No campaigns yet. Create one to start seeing performance here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Campaign</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Posts</th>
                    <th className="px-5 py-3 font-medium">Impressions</th>
                    <th className="px-5 py-3 font-medium">Clicks</th>
                    <th className="px-5 py-3 font-medium">Leads</th>
                    <th className="px-5 py-3 font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.campaignId} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <Link
                          href={`/app/campaigns/${row.campaignId}`}
                          className="font-medium hover:text-brand"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={CAMPAIGN_STATUS_VARIANT[row.status] ?? "default"}>
                          {row.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{row.postCount}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatCompact(row.impressions)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatCompact(row.clicks)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatCompact(row.leads)}
                      </td>
                      <td className="px-5 py-3 font-medium">{formatEuros(row.spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
