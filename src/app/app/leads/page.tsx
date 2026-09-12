import Link from "next/link";
import { requireCompany } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ExportLeadsButton, type LeadRow } from "@/components/company/export-leads-button";
import { formatDate } from "@/lib/utils";
import { PAGE_SIZE_DEFAULT } from "@/lib/constants";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { company } = await requireCompany();
  const sp = await searchParams;
  const pageRaw = Number(firstValue(sp.page));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  // All leads are scoped through the booking → campaign → company chain (IDOR-safe).
  const where = { booking: { campaign: { companyProfileId: company.id } } };

  const [totalLeads, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { capturedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE_DEFAULT,
      take: PAGE_SIZE_DEFAULT,
      include: {
        booking: {
          include: {
            creator: { select: { displayName: true } },
            campaign: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalLeads / PAGE_SIZE_DEFAULT));

  const exportRows: LeadRow[] = leads.map((lead) => ({
    name: lead.name,
    title: lead.title,
    company: lead.company,
    creatorName: lead.booking.creator.displayName,
    campaignName: lead.booking.campaign.name,
    capturedAt: lead.capturedAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${totalLeads} identifiable lead${totalLeads === 1 ? "" : "s"} across your campaigns.`}
        action={<ExportLeadsButton rows={exportRows} />}
      />

      {totalLeads === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No leads captured yet. Leads appear here as your booked posts drive engagement.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Source creator</th>
                    <th className="px-5 py-3 font-medium">Campaign</th>
                    <th className="px-5 py-3 font-medium">Captured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3 font-medium">{lead.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{lead.title}</td>
                      <td className="px-5 py-3 text-muted-foreground">{lead.company}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {lead.booking.creator.displayName}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/app/campaigns/${lead.booking.campaign.id}`}
                          className="text-brand hover:text-brand-700"
                        >
                          {lead.booking.campaign.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(lead.capturedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {page > 1 ? (
            <ButtonLink href={`/app/leads?page=${page - 1}`} variant="outline" size="sm">
              Previous
            </ButtonLink>
          ) : (
            <span className="text-sm text-muted-foreground opacity-50">Previous</span>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <ButtonLink href={`/app/leads?page=${page + 1}`} variant="outline" size="sm">
              Next
            </ButtonLink>
          ) : (
            <span className="text-sm text-muted-foreground opacity-50">Next</span>
          )}
        </div>
      )}
    </>
  );
}
