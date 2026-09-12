import { Building2, Sparkles } from "lucide-react";
import { requireAgency } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { formatEuros, formatCompact, formatPercentFromFraction } from "@/lib/utils";
import { PAGE_SIZE_MAX } from "@/lib/constants";
import { AddCreatorForm } from "@/components/agency/add-creator-form";
import { CsvImportForm } from "@/components/agency/csv-import-form";
import { EditRateForm } from "@/components/agency/edit-rate-form";

export default async function AgencyRosterPage() {
  const { agency } = await requireAgency();

  // Type-adaptive: this section is for creator agencies only.
  if (agency.type !== "CREATOR_AGENCY") {
    return (
      <>
        <PageHeader title="Creator roster" description="The creators your agency represents." />
        <WrongTypeNote />
      </>
    );
  }

  const creators = await prisma.creatorProfile.findMany({
    where: { managedByAgencyId: agency.id },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE_MAX,
    select: {
      id: true,
      displayName: true,
      headline: true,
      avatarUrl: true,
      followers: true,
      engagementRate: true,
      pricePerPost: true,
      available: true,
      verticals: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Creator roster"
        description="Manage the creators you represent — all in one place."
      />

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" />
        <p className="text-sm text-brand-700">
          Your creators don&apos;t need individual Naano accounts. You manage their rates,
          availability and bookings on their behalf from here.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add creator</CardTitle>
            </CardHeader>
            <CardContent>
              <AddCreatorForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bulk import (CSV)</CardTitle>
            </CardHeader>
            <CardContent>
              <CsvImportForm />
            </CardContent>
          </Card>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Roster{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({creators.length})
              </span>
            </h2>
          </div>

          {creators.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No creators yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="max-w-prose text-sm text-muted-foreground">
                  Add your first creator above, or paste a CSV to import your whole roster in one
                  go.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {creators.map((creator) => (
                <Card key={creator.id} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex items-start gap-3">
                      <Avatar name={creator.displayName} src={creator.avatarUrl} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-semibold tracking-tight">
                            {creator.displayName}
                          </p>
                          {creator.available ? (
                            <Badge variant="success">Available</Badge>
                          ) : (
                            <Badge variant="outline">Booked</Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {creator.headline}
                        </p>
                      </div>
                    </div>

                    {creator.verticals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {creator.verticals.map((vertical) => (
                          <Badge key={vertical} variant="brand">
                            {vertical}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <dl className="grid grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3 text-center">
                      <div>
                        <dt className="text-xs text-muted-foreground">Followers</dt>
                        <dd className="text-sm font-semibold">
                          {formatCompact(creator.followers)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Engagement</dt>
                        <dd className="text-sm font-semibold">
                          {formatPercentFromFraction(creator.engagementRate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Price / post</dt>
                        <dd className="text-sm font-semibold">
                          {formatEuros(creator.pricePerPost)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto border-t border-border pt-4">
                      <EditRateForm
                        creatorId={creator.id}
                        currentPrice={creator.pricePerPost}
                        currentAvailable={creator.available}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function WrongTypeNote() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5 text-brand" />
          This section is for creator agencies
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="max-w-prose text-sm text-muted-foreground">
          Your agency runs campaigns for brands, so you manage client workspaces rather than a
          creator roster.
        </p>
        <ButtonLink href="/agency/clients">Go to client workspaces</ButtonLink>
      </CardContent>
    </Card>
  );
}
