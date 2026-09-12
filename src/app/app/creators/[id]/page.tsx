import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ArrowLeft, Heart, MessageCircle } from "lucide-react";
import { requireCompany } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { FitScoreRing } from "@/components/ui/fit-score";
import {
  BookCreatorPanel,
  type BookableCampaign,
} from "@/components/company/book-creator-panel";
import {
  formatCompact,
  formatEuros,
  formatPercentFromFraction,
  formatDate,
} from "@/lib/utils";
import { asAudienceMap } from "@/lib/fit-score";
import { icpTargetForCompany, scoreCreator } from "@/lib/company-queries";

const RECENT_POSTS_LIMIT = 6;

/** Sort an audience map into descending { label, fraction } rows. */
function audienceRows(value: unknown): { label: string; fraction: number }[] {
  return Object.entries(asAudienceMap(value))
    .map(([label, fraction]) => ({ label, fraction }))
    .sort((a, b) => b.fraction - a.fraction);
}

export default async function CreatorMediaKitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { company } = await requireCompany();
  const { id } = await params;

  const creator = await prisma.creatorProfile.findUnique({
    where: { id },
    include: {
      posts: { orderBy: { postedAt: "desc" }, take: RECENT_POSTS_LIMIT },
    },
  });
  if (!creator) notFound();

  const fitScore = scoreCreator(icpTargetForCompany(company), creator);

  const bookableCampaigns = await prisma.campaign.findMany({
    where: { companyProfileId: company.id, status: { in: ["DRAFT", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, status: true },
  });

  const functionRows = audienceRows(creator.audienceByFunction);
  const seniorityRows = audienceRows(creator.audienceBySeniority);

  return (
    <>
      <div className="mb-2">
        <Link
          href="/app/discover"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to discover
        </Link>
      </div>

      <PageHeader title="Media kit" description="Audience, performance and booking." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Header card */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar name={creator.displayName} src={creator.avatarUrl} size={64} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">{creator.displayName}</h2>
                    {creator.available ? (
                      <Badge variant="success">Available</Badge>
                    ) : (
                      <Badge variant="outline">Unavailable</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{creator.headline}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {creator.location}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {creator.verticals.map((vertical) => (
                      <Badge key={vertical} variant="brand">
                        {vertical}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <FitScoreRing score={fitScore} size={64} />
                <p className="text-sm font-semibold">{formatEuros(creator.pricePerPost)}/post</p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Followers" value={formatCompact(creator.followers)} />
            <StatCard label="Median reach" value={formatCompact(creator.medianReach)} />
            <StatCard
              label="Engagement"
              value={formatPercentFromFraction(creator.engagementRate)}
            />
            <StatCard
              label="Avg reactions"
              value={formatCompact(creator.avgReactions)}
              hint={`${formatCompact(creator.avgComments)} avg comments`}
            />
          </div>

          {/* Audience breakdown */}
          <div className="grid gap-6 sm:grid-cols-2">
            <AudienceCard title="Audience by function" rows={functionRows} />
            <AudienceCard title="Audience by seniority" rows={seniorityRows} />
          </div>

          {/* Recent posts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent posts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {creator.posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No posts on file yet.</p>
              ) : (
                creator.posts.map((post) => (
                  <div key={post.id} className="rounded-lg border border-border p-4">
                    <p className="whitespace-pre-line text-sm">{post.content}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="size-3.5" />
                        {formatCompact(post.reactions)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="size-3.5" />
                        {formatCompact(post.comments)}
                      </span>
                      <span>{formatDate(post.postedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Bio */}
          {creator.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{creator.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking panel */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <BookCreatorPanel
            creatorId={creator.id}
            pricePerPost={creator.pricePerPost}
            campaigns={bookableCampaigns as BookableCampaign[]}
          />
        </div>
      </div>
    </>
  );
}

function AudienceCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; fraction: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audience data.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{row.label}</span>
                <span className="text-muted-foreground">
                  {formatPercentFromFraction(row.fraction)}
                </span>
              </div>
              <ProgressBar value={row.fraction * 100} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
