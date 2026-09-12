import { Building2, Megaphone, Users } from "lucide-react";
import type { CampaignStatus } from "@prisma/client";
import { requireAgency } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatEuros } from "@/lib/utils";
import { NewWorkspaceForm } from "@/components/agency/new-workspace-form";
import { BudgetForm } from "@/components/agency/budget-form";

const CAMPAIGN_STATUS_VARIANT: Record<
  CampaignStatus,
  "brand" | "success" | "default" | "outline"
> = {
  DRAFT: "outline",
  ACTIVE: "success",
  COMPLETED: "brand",
  ARCHIVED: "default",
};

export default async function AgencyClientsPage() {
  const { agency } = await requireAgency();

  // Type-adaptive: this section is for brand agencies only.
  if (agency.type !== "BRAND_AGENCY") {
    return (
      <>
        <PageHeader title="Client workspaces" description="Manage the brands you run campaigns for." />
        <WrongTypeNote
          title="This section is for brand agencies"
          body="Your agency represents creators, so you manage a roster rather than client workspaces."
          href="/agency/roster"
          cta="Go to your roster"
        />
      </>
    );
  }

  const workspaces = await prisma.agencyClientWorkspace.findMany({
    where: { agencyProfileId: agency.id },
    orderBy: { createdAt: "desc" },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, status: true, budget: true },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Client workspaces"
        description="A dedicated workspace, budget and campaign list for each brand you manage."
      />

      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>New client workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <NewWorkspaceForm />
          </CardContent>
        </Card>

        {workspaces.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No client workspaces yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="max-w-prose text-sm text-muted-foreground">
                Create your first workspace above. Each one holds a client&apos;s budget and the
                campaigns you run on their behalf.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {workspaces.map((workspace) => (
              <Card key={workspace.id}>
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Building2 className="size-5" />
                      </span>
                      <div>
                        <CardTitle>{workspace.clientName}</CardTitle>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {workspace.campaigns.length} campaign
                          {workspace.campaigns.length === 1 ? "" : "s"} ·{" "}
                          {formatEuros(workspace.budget)} allocated
                        </p>
                      </div>
                    </div>
                    <BudgetForm workspaceId={workspace.id} currentBudget={workspace.budget} />
                  </div>
                </CardHeader>
                <CardContent>
                  {workspace.campaigns.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      <Megaphone className="size-4" />
                      No campaigns in this workspace yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {workspace.campaigns.map((campaign) => (
                        <li
                          key={campaign.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <Megaphone className="size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{campaign.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {formatEuros(campaign.budget)}
                            </span>
                            <Badge variant={CAMPAIGN_STATUS_VARIANT[campaign.status]}>
                              {campaign.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function WrongTypeNote({
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
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5 text-brand" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="max-w-prose text-sm text-muted-foreground">{body}</p>
        <ButtonLink href={href}>{cta}</ButtonLink>
      </CardContent>
    </Card>
  );
}
