"use server";

// Company (brand) campaign mutations.
//
// Every action:
//   - starts with "use server"
//   - resolves the current company from the server session (requireCompany),
//     never from a client-supplied id (OWASP-IDOR-001)
//   - validates input with zod, using explicit DTOs (OWASP-MASS-001 /
//     BP-INPUTVAL-001) — we never spread a request body into a Prisma write
//   - re-fetches the target record scoped to company.id before mutating, and
//     treats "not owned" identically to "not found" (404-style, OWASP-IDOR-001)
//   - enforces the allowed state machine for status changes
//   - revalidates the affected routes

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-helpers";
import { VERTICALS } from "@/lib/constants";
import { briefSchema } from "@/lib/ai/brief-schema";

// --- Result contract (mirrors the codebase's agency/creator actions) --------

export type ActionResult =
  | { ok: true; message?: string; campaignId?: string }
  | { ok: false; error: string };

// --- Domain limits (BP-CONST-001) -------------------------------------------

const CAMPAIGN_NAME_MAX_LEN = 140;
const OBJECTIVE_MAX_LEN = 300;
const ICP_MAX_LEN = 600;
const MIN_BUDGET = 0;
const MAX_BUDGET = 100_000_000; // €100M ceiling — guards typo/overflow abuse
const MIN_TARGET_POSTS = 0;
const MAX_TARGET_POSTS = 1000;
const BRIEF_STRING_MAX_LEN = 600;
const BRIEF_LIST_ITEM_MAX_LEN = 240;
const BRIEF_LIST_MAX_ITEMS = 8;
const BRIEF_PROMPT_MAX_LEN = 4000;

const CAMPAIGNS_LIST_PATH = "/app/campaigns";
const OVERVIEW_PATH = "/app";

const VALID_VERTICALS = new Set<string>(VERTICALS);

/**
 * Allowed campaign status transitions (company-driven lifecycle).
 * DRAFT → ACTIVE → COMPLETED, with ARCHIVED reachable from any non-archived state.
 */
const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

// --- Input schemas (explicit DTOs, strict — unknown fields rejected) --------

const optionalVertical = z
  .string()
  .trim()
  .max(80)
  .optional()
  .refine((value) => value === undefined || value === "" || VALID_VERTICALS.has(value), {
    message: "Unknown vertical",
  });

const briefInputSchema = briefSchema
  .extend({
    angle: z.string().trim().min(1).max(BRIEF_STRING_MAX_LEN),
    hook: z.string().trim().min(1).max(BRIEF_STRING_MAX_LEN),
    cta: z.string().trim().min(1).max(BRIEF_STRING_MAX_LEN),
    audience: z.string().trim().min(1).max(BRIEF_STRING_MAX_LEN),
    toneOfVoice: z.string().trim().min(1).max(BRIEF_STRING_MAX_LEN),
    keyMessages: z
      .array(z.string().trim().min(1).max(BRIEF_LIST_ITEM_MAX_LEN))
      .max(BRIEF_LIST_MAX_ITEMS),
    doList: z
      .array(z.string().trim().min(1).max(BRIEF_LIST_ITEM_MAX_LEN))
      .max(BRIEF_LIST_MAX_ITEMS),
    dontList: z
      .array(z.string().trim().min(1).max(BRIEF_LIST_ITEM_MAX_LEN))
      .max(BRIEF_LIST_MAX_ITEMS),
    proofPoints: z
      .array(z.string().trim().min(1).max(BRIEF_LIST_ITEM_MAX_LEN))
      .max(BRIEF_LIST_MAX_ITEMS),
  })
  .strict();

const createCampaignSchema = z
  .object({
    name: z.string().trim().min(1, "Campaign name is required").max(CAMPAIGN_NAME_MAX_LEN),
    objective: z.string().trim().max(OBJECTIVE_MAX_LEN).optional(),
    vertical: optionalVertical,
    budget: z
      .number()
      .int("Budget must be a whole number of euros")
      .min(MIN_BUDGET, "Budget cannot be negative")
      .max(MAX_BUDGET, "Budget exceeds the allowed maximum"),
    targetPostCount: z
      .number()
      .int("Target posts must be a whole number")
      .min(MIN_TARGET_POSTS, "Target posts cannot be negative")
      .max(MAX_TARGET_POSTS, "Target posts exceeds the allowed maximum"),
    icp: z.string().trim().max(ICP_MAX_LEN).optional(),
    brief: briefInputSchema.optional(),
    briefGeneratedByAI: z.boolean().optional(),
    briefPrompt: z.string().trim().max(BRIEF_PROMPT_MAX_LEN).optional(),
  })
  .strict();

const updateStatusSchema = z
  .object({
    campaignId: z.string().trim().min(1, "Campaign id is required"),
    nextStatus: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]),
  })
  .strict();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

// --- Helpers ----------------------------------------------------------------

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

/** Explicit DTO for the nested Brief create — never spread client input. */
function briefCreateData(
  brief: z.infer<typeof briefInputSchema>,
  generatedByAI: boolean,
  prompt?: string,
) {
  return {
    angle: brief.angle,
    hook: brief.hook,
    cta: brief.cta,
    keyMessages: brief.keyMessages,
    audience: brief.audience,
    toneOfVoice: brief.toneOfVoice,
    doList: brief.doList,
    dontList: brief.dontList,
    proofPoints: brief.proofPoints,
    generatedByAI,
    prompt: prompt && prompt.length > 0 ? prompt : null,
  };
}

// --- Actions ----------------------------------------------------------------

/**
 * Create a campaign (optionally with a brief) owned by the current company.
 * Returns the new campaign id so the caller can redirect to its detail page.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<ActionResult> {
  const { company } = await requireCompany();

  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }
  const data = parsed.data;

  const campaign = await prisma.campaign.create({
    data: {
      companyProfileId: company.id, // ownership fixed server-side, not from client
      name: data.name,
      status: "DRAFT",
      objective: data.objective && data.objective.length > 0 ? data.objective : null,
      vertical: data.vertical && data.vertical.length > 0 ? data.vertical : null,
      budget: data.budget,
      targetPostCount: data.targetPostCount,
      icp: data.icp && data.icp.length > 0 ? data.icp : null,
      ...(data.brief
        ? {
            brief: {
              create: briefCreateData(
                data.brief,
                data.briefGeneratedByAI ?? false,
                data.briefPrompt,
              ),
            },
          }
        : {}),
    },
    select: { id: true },
  });

  revalidatePath(CAMPAIGNS_LIST_PATH);
  revalidatePath(OVERVIEW_PATH);
  return { ok: true, campaignId: campaign.id, message: "Campaign created" };
}

/**
 * Advance a campaign's status along the allowed lifecycle. Verifies ownership
 * (404-style on miss) and rejects illegal transitions.
 */
export async function updateCampaignStatus(
  campaignId: string,
  nextStatus: CampaignStatus,
): Promise<ActionResult> {
  const { company } = await requireCompany();

  const parsed = updateStatusSchema.safeParse({ campaignId, nextStatus });
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  // Ownership check at the data layer (OWASP-IDOR-001).
  const campaign = await prisma.campaign.findFirst({
    where: { id: parsed.data.campaignId, companyProfileId: company.id },
    select: { id: true, status: true },
  });
  if (!campaign) {
    return { ok: false, error: "Campaign not found" };
  }

  const allowed = CAMPAIGN_TRANSITIONS[campaign.status];
  if (!allowed.includes(parsed.data.nextStatus)) {
    return {
      ok: false,
      error: `Cannot move a ${campaign.status.toLowerCase()} campaign to ${parsed.data.nextStatus.toLowerCase()}`,
    };
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: parsed.data.nextStatus },
  });

  revalidatePath(`${CAMPAIGNS_LIST_PATH}/${campaign.id}`);
  revalidatePath(CAMPAIGNS_LIST_PATH);
  revalidatePath(OVERVIEW_PATH);
  return { ok: true, message: `Campaign moved to ${parsed.data.nextStatus.toLowerCase()}` };
}
