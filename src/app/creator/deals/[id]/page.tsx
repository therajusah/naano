import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireCreator } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatCompact, formatEuros, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { BookingStatusBadge } from "@/components/creator/status-badge";
import { DealInviteActions } from "@/components/creator/deal-invite-actions";
import { DraftSubmissionForm } from "@/components/creator/draft-submission-form";

export const metadata = { title: "Deal" };

export default async function CreatorDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { creator } = await requireCreator();

  // Ownership enforced in the query — a deal not owned by this creator is 404.
  const booking = await prisma.booking.findFirst({
    where: { id, creatorProfileId: creator.id },
    include: {
      campaign: {
        include: {
          brief: true,
          company: { select: { companyName: true } },
        },
      },
      metrics: true,
      payout: true,
    },
  });
  if (!booking) notFound();

  const brief = booking.campaign.brief;
  const totals = booking.metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      leads: acc.leads + m.leads,
    }),
    { impressions: 0, clicks: 0, leads: 0 },
  );

  return (
    <>
      <Link
        href="/creator/deals"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to deals
      </Link>

      <PageHeader
        title={booking.campaign.name}
        description={`${booking.campaign.company.companyName} · ${formatEuros(booking.pricePerPost)} per post · ${booking.fitScore}% audience fit`}
        action={<BookingStatusBadge status={booking.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {brief && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign brief</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                <BriefRow label="Angle" value={brief.angle} />
                <BriefRow label="Hook" value={brief.hook} />
                <BriefRow label="Call to action" value={brief.cta} />
                <BriefRow label="Tone of voice" value={brief.toneOfVoice} />
                <div>
                  <p className="mb-1 font-medium">Key messages</p>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {brief.keyMessages.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 font-medium text-success">Do</p>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {brief.doList.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-danger">Don&apos;t</p>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {brief.dontList.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                </div>
                {brief.generatedByAI && (
                  <Badge variant="brand" className="w-fit">✨ AI-assisted brief</Badge>
                )}
              </CardContent>
            </Card>
          )}

          {booking.status === "ACCEPTED" && (
            <Card>
              <CardHeader>
                <CardTitle>Submit your draft</CardTitle>
              </CardHeader>
              <CardContent>
                <DraftSubmissionForm bookingId={booking.id} initialContent={booking.draftContent ?? ""} />
              </CardContent>
            </Card>
          )}

          {booking.draftContent && booking.status !== "ACCEPTED" && (
            <Card>
              <CardHeader>
                <CardTitle>Your submitted post</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{booking.draftContent}</p>
              </CardContent>
            </Card>
          )}

          {["LIVE", "COMPLETED", "PAID"].includes(booking.status) && (
            <Card>
              <CardHeader>
                <CardTitle>Post performance</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Impressions" value={formatCompact(totals.impressions)} />
                <StatCard label="Clicks" value={formatCompact(totals.clicks)} />
                <StatCard label="Leads" value={formatCompact(totals.leads)} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Row label="Fee" value={formatEuros(booking.pricePerPost)} />
              <Row label="Audience fit" value={`${booking.fitScore}%`} />
              {booking.publishedAt && <Row label="Published" value={formatDate(booking.publishedAt)} />}
              {booking.payout && (
                <Row
                  label="Payout"
                  value={`${formatEuros(booking.payout.amount)} · ${booking.payout.status.toLowerCase()}`}
                />
              )}
              {["LIVE", "COMPLETED", "PAID"].includes(booking.status) && (
                <a
                  href={`/t/${booking.trackedSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                >
                  Open tracked link <ExternalLink className="size-3.5" />
                </a>
              )}
            </CardContent>
          </Card>

          {booking.status === "INVITED" && (
            <Card>
              <CardHeader>
                <CardTitle>Respond to invite</CardTitle>
              </CardHeader>
              <CardContent>
                <DealInviteActions bookingId={booking.id} size="default" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function BriefRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 font-medium">{label}</p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
