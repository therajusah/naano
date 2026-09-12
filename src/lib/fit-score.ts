import { FIT_SCORE_WEIGHTS } from "@/lib/constants";

// Deterministic audience-fit score (0..100): how well a creator's audience
// matches a campaign's ICP. Naano's headline "which creators your buyers
// trust" metric — audience composition matters, follower count does not.

export type IcpTarget = {
  functions: string[];
  seniorities: string[];
  vertical?: string | null;
};

export type CreatorAudience = {
  audienceByFunction: Record<string, number>;
  audienceBySeniority: Record<string, number>;
  verticals: string[];
};

/** Coerce a Prisma Json value into a { label: fraction } map defensively. */
export function asAudienceMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const num = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(num)) out[key] = num;
  }
  return out;
}

function coverage(audience: Record<string, number>, targets: string[]): number {
  if (targets.length === 0) return 0.5; // no preference expressed → neutral
  const total = targets.reduce((sum, label) => sum + (audience[label] ?? 0), 0);
  return Math.max(0, Math.min(1, total));
}

function verticalMatch(creatorVerticals: string[], vertical?: string | null): number {
  if (!vertical) return 0.5;
  return creatorVerticals.includes(vertical) ? 1 : 0.25;
}

export function computeFitScore(target: IcpTarget, creator: CreatorAudience): number {
  const functionScore = coverage(creator.audienceByFunction, target.functions);
  const seniorityScore = coverage(creator.audienceBySeniority, target.seniorities);
  const vertical = verticalMatch(creator.verticals, target.vertical);

  const weighted =
    FIT_SCORE_WEIGHTS.functionMatch * functionScore +
    FIT_SCORE_WEIGHTS.seniorityMatch * seniorityScore +
    FIT_SCORE_WEIGHTS.verticalMatch * vertical;

  const raw = weighted * 100;
  const hasSignal = functionScore > 0 || seniorityScore > 0;
  const floored = hasSignal ? Math.max(raw, FIT_SCORE_WEIGHTS.floor) : raw;
  return Math.round(Math.max(0, Math.min(100, floored)));
}
