import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { requireCompany } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatEuros, formatDate } from "@/lib/utils";

const CAMPAIGN_STATUS_VARIANT: Record<string, "default" | "brand" | "success" | "outline"> = {
  DRAFT: "outline",
  ACTIVE: "brand",
  COMPLETED: "success",
  ARCHIVED: "default",
};

const LIVE_STATUSES = ["LIVE", "COMPLETED", "PAID"] as const;

export default async function CampaignsListPage() {
  const { company } = await requireCompany();

  const campaigns = await prisma.campaign.findMany({
    where: { companyProfileId: company.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bookings: true } },
      bookings: { where: { status: { in: [...LIVE_STATUSES] } }, select: { id: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Every campaign you're running with Naano creators."
        action={
          <ButtonLink href="/app/campaigns/new">
            <Plus className="size-4" />
            New campaign
          </ButtonLink>
        }
      />

      {campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No campaigns yet. Create your first campaign to start booking creators.
          </p>
          <div className="mt-4 flex justify-center">
            <ButtonLink href="/app/campaigns/new" variant="brand" size="sm">
              <Plus className="size-4" />
              New campaign
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Campaign</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Budget</th>
                    <th className="px-5 py-3 font-medium">Bookings</th>
                    <th className="px-5 py-3 font-medium">Published</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <Link
                          href={`/app/campaigns/${campaign.id}`}
                          className="font-medium hover:text-brand"
                        >
                          {campaign.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(campaign.createdAt)}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status] ?? "default"}>
                          {campaign.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatEuros(campaign.budget)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {campaign._count.bookings}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {campaign.bookings.length}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/app/campaigns/${campaign.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-700"
                        >
                          Open
                          <ArrowRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
