import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { briefRequestSchema } from "@/lib/ai/brief-schema";
import { generateCampaignBrief, MissingOpenAIKeyError } from "@/lib/ai/generate-brief";
import { logger } from "@/lib/logger";

// Node runtime — the AI SDK + provider are not Edge-safe here.
export const runtime = "nodejs";

const AI_RATE_LIMIT = 10; // requests
const AI_RATE_WINDOW_MS = 60_000; // per minute per user

export async function POST(request: Request) {
  // 1. Authn/authz: only brands/agencies can generate briefs (default-deny).
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["COMPANY", "AGENCY", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Rate limit the expensive endpoint (OWASP-RATELIMIT-001).
  const limit = checkRateLimit(`ai-brief:${user.id}`, AI_RATE_LIMIT, AI_RATE_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // 3. Validate input (BP-INPUTVAL-001, strips unknown fields).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = briefRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // 4. Generate.
  try {
    const brief = await generateCampaignBrief(parsed.data);
    return NextResponse.json({ brief });
  } catch (error) {
    if (error instanceof MissingOpenAIKeyError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    logger.error("api.ai.brief.error", {
      userId: user.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Failed to generate brief." }, { status: 502 });
  }
}
