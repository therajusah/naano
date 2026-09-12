import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/lib/env";
import { AI_BRIEF_TIMEOUT_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { briefSchema, type BriefRequest, type GeneratedBrief } from "@/lib/ai/brief-schema";

/** Thrown when the OpenAI key is not configured — surfaced as a clear 503. */
export class MissingOpenAIKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured. Add it to .env to enable AI briefs.");
    this.name = "MissingOpenAIKeyError";
  }
}

const SYSTEM_PROMPT = [
  "You are a senior B2B LinkedIn campaign strategist for Naano, a creator marketplace.",
  "You write briefs that vetted creators turn into authentic, high-performing sponsored posts.",
  "Briefs must respect the creator's own voice: give direction, not a script.",
  "The brand owns factual accuracy; the creator owns the expression.",
  "Be specific, concrete, and free of generic marketing fluff.",
].join(" ");

function buildPrompt(input: BriefRequest): string {
  const lines = [
    `Product / company: ${input.productName}`,
    `What it does: ${input.productDescription}`,
    `Target audience (ICP): ${input.targetAudience}`,
    `Campaign objective: ${input.objective}`,
  ];
  if (input.vertical) lines.push(`Vertical: ${input.vertical}`);
  if (input.keyPoints) lines.push(`Extra notes to consider: ${input.keyPoints}`);
  lines.push(
    "Produce a single-post campaign brief a B2B LinkedIn creator can act on immediately.",
  );
  return lines.join("\n");
}

/**
 * Generate a structured campaign brief via OpenAI. Validates the key at the
 * boundary and enforces a hard timeout (BP-RESOURCE-001). Never logs the key.
 */
export async function generateCampaignBrief(input: BriefRequest): Promise<GeneratedBrief> {
  if (!env.OPENAI_API_KEY) throw new MissingOpenAIKeyError();

  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

  try {
    const { object } = await generateObject({
      model: openai(env.OPENAI_BRIEF_MODEL),
      schema: briefSchema,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(input),
      abortSignal: AbortSignal.timeout(AI_BRIEF_TIMEOUT_MS),
    });
    logger.info("ai.brief.generated", {
      model: env.OPENAI_BRIEF_MODEL,
      product: input.productName,
    });
    return object;
  } catch (error) {
    // Wrap with context but never leak credentials (BP-ERR-001).
    logger.error("ai.brief.failed", {
      model: env.OPENAI_BRIEF_MODEL,
      reason: error instanceof Error ? error.message : "unknown",
    });
    throw new Error("Failed to generate campaign brief from the AI provider.");
  }
}
