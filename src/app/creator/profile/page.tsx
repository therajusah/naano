import { requireCreator } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { asAudienceMap } from "@/lib/fit-score";
import { formatCompact, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress";
import { ProfileForm } from "@/components/creator/profile-form";

export const metadata = { title: "Media kit" };

function AudienceBreakdown({ title, map }: { title: string; map: Record<string, number> }) {
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No audience data yet.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{title}</p>
      {rows.map(([label, fraction]) => (
        <div key={label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{Math.round(fraction * 100)}%</span>
          </div>
          <ProgressBar value={fraction * 100} />
        </div>
      ))}
    </div>
  );
}

export default async function CreatorProfilePage() {
  const { creator: base } = await requireCreator();
  const creator = await prisma.creatorProfile.findUniqueOrThrow({
    where: { id: base.id },
    include: { posts: { orderBy: { postedAt: "desc" }, take: 4 } },
  });

  return (
    <>
      <PageHeader title="Media kit" description="Keep your profile sharp — brands match on audience fit." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit your profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              headline={creator.headline}
              bio={creator.bio}
              location={creator.location}
              verticals={creator.verticals}
              pricePerPost={creator.pricePerPost}
              available={creator.available}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <StatCard label="Followers" value={formatCompact(creator.followers)} />
              <StatCard label="Median reach" value={formatCompact(creator.medianReach)} />
              <StatCard label="Engagement" value={`${creator.engagementRate}%`} />
              <StatCard label="Avg reactions" value={formatCompact(creator.avgReactions)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <AudienceBreakdown title="By function" map={asAudienceMap(creator.audienceByFunction)} />
              <AudienceBreakdown title="By seniority" map={asAudienceMap(creator.audienceBySeniority)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent posts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {creator.posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            creator.posts.map((post) => (
              <div key={post.id} className="rounded-lg border border-border p-4">
                <p className="text-sm">{post.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatCompact(post.reactions)} reactions · {formatCompact(post.comments)} comments ·{" "}
                  {formatDate(post.postedAt)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
