import Link from "next/link";
import type { Prisma, CreatorProfile } from "@prisma/client";
import { requireCompany } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { FitScoreRing } from "@/components/ui/fit-score";
import { DiscoverFilters } from "@/components/company/discover-filters";
import { formatCompact, formatEuros, formatPercentFromFraction } from "@/lib/utils";
import {
  icpTargetForCompany,
  rankCreatorsByFit,
  type RankedCreator,
} from "@/lib/company-queries";
import { PAGE_SIZE_DEFAULT, AUDIENCE_FUNCTIONS, AUDIENCE_SENIORITIES, VERTICALS } from "@/lib/constants";

// We fit-score + sort in memory (the score is not a DB column), so we bound the
// candidate set we pull for scoring, then page over the ranked result.
const MAX_MATCH_CANDIDATES = 300;

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parsePositiveInt(raw: string, fallback: number): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

/** Build a Prisma where-clause from the validated filter inputs. */
function buildCreatorFilter(filters: {
  q: string;
  vertical: string;
  minFollowers: number;
  maxPrice: number;
  availableOnly: boolean;
}): Prisma.CreatorProfileWhereInput {
  const where: Prisma.CreatorProfileWhereInput = { managedByAgencyId: null };
  if (filters.q) {
    where.OR = [
      { displayName: { contains: filters.q, mode: "insensitive" } },
      { headline: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.vertical && (VERTICALS as readonly string[]).includes(filters.vertical)) {
    where.verticals = { has: filters.vertical };
  }
  if (filters.minFollowers > 0) where.followers = { gte: filters.minFollowers };
  if (filters.maxPrice > 0) where.pricePerPost = { lte: filters.maxPrice };
  if (filters.availableOnly) where.available = true;
  return where;
}

/** Keep only creators whose audience covers the requested function/seniority. */
function applyAudienceFilters(
  ranked: RankedCreator[],
  audienceFunction: string,
  seniority: string,
): RankedCreator[] {
  const wantFunction =
    audienceFunction && (AUDIENCE_FUNCTIONS as readonly string[]).includes(audienceFunction);
  const wantSeniority =
    seniority && (AUDIENCE_SENIORITIES as readonly string[]).includes(seniority);
  if (!wantFunction && !wantSeniority) return ranked;

  return ranked.filter(({ creator }) => {
    const byFunction = creator.audienceByFunction as Record<string, number> | null;
    const bySeniority = creator.audienceBySeniority as Record<string, number> | null;
    const functionOk = !wantFunction || Number(byFunction?.[audienceFunction] ?? 0) > 0;
    const seniorityOk = !wantSeniority || Number(bySeniority?.[seniority] ?? 0) > 0;
    return functionOk && seniorityOk;
  });
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { company } = await requireCompany();
  const sp = await searchParams;

  const filters = {
    q: firstValue(sp.q).trim().slice(0, 120),
    vertical: firstValue(sp.vertical),
    audienceFunction: firstValue(sp.function),
    seniority: firstValue(sp.seniority),
    minFollowers: parsePositiveInt(firstValue(sp.minFollowers), 0),
    maxPrice: parsePositiveInt(firstValue(sp.maxPrice), 0),
    availableOnly: firstValue(sp.availableOnly) === "1",
  };
  const page = Math.max(1, parsePositiveInt(firstValue(sp.page), 1));

  const candidates = await prisma.creatorProfile.findMany({
    where: buildCreatorFilter(filters),
    take: MAX_MATCH_CANDIDATES,
    orderBy: { followers: "desc" },
  });

  const ranked = applyAudienceFilters(
    rankCreatorsByFit(icpTargetForCompany(company), candidates),
    filters.audienceFunction,
    filters.seniority,
  );

  const totalPages = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE_DEFAULT));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE_DEFAULT;
  const pageItems = ranked.slice(start, start + PAGE_SIZE_DEFAULT);

  return (
    <>
      <PageHeader
        title="Discover creators"
        description="Find the creators your buyers already trust — ranked by audience fit to your ICP."
      />

      <DiscoverFilters />

      <p className="mt-4 text-sm text-muted-foreground">
        {ranked.length} creator{ranked.length === 1 ? "" : "s"} match your filters
      </p>

      {pageItems.length === 0 ? (
        <Card className="mt-4 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No creators match these filters. Try widening your search.
          </p>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map(({ creator, fitScore }) => (
            <CreatorCard key={creator.id} creator={creator} fitScore={fitScore} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={safePage} totalPages={totalPages} searchParams={sp} />
      )}
    </>
  );
}

function CreatorCard({ creator, fitScore }: { creator: CreatorProfile; fitScore: number }) {
  return (
    <Link href={`/app/creators/${creator.id}`} className="group block">
      <Card className="h-full p-5 transition-colors group-hover:border-brand/40 group-hover:bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={creator.displayName} src={creator.avatarUrl} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold tracking-tight">{creator.displayName}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{creator.headline}</p>
            </div>
          </div>
          <FitScoreRing score={fitScore} size={46} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {creator.verticals.slice(0, 3).map((vertical) => (
            <Badge key={vertical} variant="brand">
              {vertical}
            </Badge>
          ))}
          {!creator.available && <Badge variant="outline">Unavailable</Badge>}
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
          <div>
            <dt className="text-xs text-muted-foreground">Followers</dt>
            <dd className="text-sm font-semibold">{formatCompact(creator.followers)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Engagement</dt>
            <dd className="text-sm font-semibold">
              {formatPercentFromFraction(creator.engagementRate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Per post</dt>
            <dd className="text-sm font-semibold">{formatEuros(creator.pricePerPost)}</dd>
          </div>
        </dl>
      </Card>
    </Link>
  );
}

function buildPageHref(searchParams: SearchParams, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") continue;
    const single = Array.isArray(value) ? value[0] : value;
    if (single) params.set(key, single);
  }
  params.set("page", String(page));
  return `/app/discover?${params.toString()}`;
}

function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: SearchParams;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {page > 1 ? (
        <ButtonLink href={buildPageHref(searchParams, page - 1)} variant="outline" size="sm">
          Previous
        </ButtonLink>
      ) : (
        <span className="text-sm text-muted-foreground opacity-50">Previous</span>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <ButtonLink href={buildPageHref(searchParams, page + 1)} variant="outline" size="sm">
          Next
        </ButtonLink>
      ) : (
        <span className="text-sm text-muted-foreground opacity-50">Next</span>
      )}
    </div>
  );
}
