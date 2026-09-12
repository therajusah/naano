import Link from "next/link";
import {
  Building2,
  Wallet,
  Megaphone,
  Users,
  Radio,
  BadgeEuro,
  ArrowRight,
} from "lucide-react";
import { requireAgency } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { formatEuros, formatCompact } from "@/lib/utils";

const AGENCY_TYPE_LABEL = {
  BRAND_AGENCY: "Brand agency",
  CREATOR_AGENCY: "Creator agency",
} as const;

const ROSTER_PREVIEW_LIMIT = 6;

export default async function AgencyPortfolioPage() {
  const { agency } = await requireAgency();

  return (
    <>
      <PageHeader
        title={agency.agencyName}
        description="Your portfolio at a glance."
        action={<Badge variant="ink">{AGENCY_TYPE_LABEL[agency.type]}</Badge>}
      />
      {agency.type === "BRAND_AGENCY" ? (
        <BrandPortfolio agencyId={agency.id} workspaceIds={agency.clientWorkspaces.map((w) => w.id)} />
      ) : (
        <CreatorPortfolio agencyId={agency.id} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Brand agency portfolio
// ---------------------------------------------------------------------------

async function BrandPortfolio({
  agencyId,
  workspaceIds,
}: {
  agencyId: string;
  workspaceIds: string[];
}) {
  const workspaces = await prisma.agencyClientWorkspace.findMany({
    where: { agencyProfileId: agencyId },
    include: { _count: { select: { campaigns: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalBudget = workspaces.reduce((sum, workspace) => sum + workspace.budget, 0);
  const totalCampaigns =
    workspaceIds.length > 0
      ? await prisma.campaign.count({
          where: { agencyClientWorkspaceId: { in: workspaceIds } },
        })
      : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Client workspaces"
          value={workspaces.length}
          icon={<Building2 className="size-5" />}
        />
        <StatCard
          label="Allocated budget"
          value={formatEuros(totalBudget)}
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          label="Campaigns across clients"
          value={totalCampaigns}
          icon={<Megaphone className="size-5" />}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Client workspaces</h2>
          <ButtonLink href="/agency/clients" variant="outline" size="sm">
            Manage clients
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>

        {workspaces.length === 0 ? (
          <EmptyState
            title="No client workspaces yet"
            body="Create a workspace for each brand you manage, then allocate budget and launch campaigns."
            href="/agency/clients"
            cta="Create a workspace"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href="/agency/clients"
                className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-brand/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold tracking-tight">{workspace.clientName}</p>
                  <Building2 className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {formatEuros(workspace.budget)}
                </p>
                <p className="text-xs text-muted-foreground">Allocated budget</p>
                <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Megaphone className="size-4" />
                  {workspace._count.campaigns} campaign
                  {workspace._count.campaigns === 1 ? "" : "s"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Creator agency portfolio
// ---------------------------------------------------------------------------

async function CreatorPortfolio({ agencyId }: { agencyId: string }) {
  const [aggregate, previewCreators] = await Promise.all([
    prisma.creatorProfile.aggregate({
      where: { managedByAgencyId: agencyId },
      _count: { _all: true },
      _sum: { followers: true },
      _avg: { pricePerPost: true },
    }),
    prisma.creatorProfile.findMany({
      where: { managedByAgencyId: agencyId },
      orderBy: { followers: "desc" },
      take: ROSTER_PREVIEW_LIMIT,
      select: {
        id: true,
        displayName: true,
        headline: true,
        avatarUrl: true,
        followers: true,
        pricePerPost: true,
        available: true,
      },
    }),
  ]);

  const rosterSize = aggregate._count._all;
  const totalReach = aggregate._sum.followers ?? 0;
  const avgPrice = Math.round(aggregate._avg.pricePerPost ?? 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Roster size" value={rosterSize} icon={<Users className="size-5" />} />
        <StatCard
          label="Total reach"
          value={formatCompact(totalReach)}
          hint="Combined followers across roster"
          icon={<Radio className="size-5" />}
        />
        <StatCard
          label="Avg price / post"
          value={formatEuros(avgPrice)}
          icon={<BadgeEuro className="size-5" />}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Roster preview</h2>
          <ButtonLink href="/agency/roster" variant="outline" size="sm">
            Manage roster
            <ArrowRight className="size-4" />
          </ButtonLink>
        </div>

        {previewCreators.length === 0 ? (
          <EmptyState
            title="Your roster is empty"
            body="Add the creators you represent. They don't need individual Naano accounts — you manage everything here."
            href="/agency/roster"
            cta="Add creators"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewCreators.map((creator) => (
              <Link
                key={creator.id}
                href="/agency/roster"
                className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-brand/40 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={creator.displayName} src={creator.avatarUrl} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight">
                      {creator.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {creator.headline}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCompact(creator.followers)} followers
                  </span>
                  <span className="font-semibold">{formatEuros(creator.pricePerPost)}</span>
                </div>
                <div className="mt-3">
                  {creator.available ? (
                    <Badge variant="success">Available</Badge>
                  ) : (
                    <Badge variant="outline">Booked</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared empty state
// ---------------------------------------------------------------------------

function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="max-w-prose text-sm text-muted-foreground">{body}</p>
        <ButtonLink href={href}>{cta}</ButtonLink>
      </CardContent>
    </Card>
  );
}
