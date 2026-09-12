import { z } from "zod";
import { AI_BRIEF_PROMPT_MAX_CHARS } from "@/lib/constants";

// Input a company provides to generate a brief. Validated at the API boundary
// (BP-INPUTVAL-001) with strict length caps.
export const briefRequestSchema = z.object({
  productName: z.string().min(2).max(120),
  productDescription: z.string().min(10).max(AI_BRIEF_PROMPT_MAX_CHARS),
  targetAudience: z.string().min(3).max(400),
  objective: z.string().min(3).max(200),
  vertical: z.string().max(80).optional(),
  keyPoints: z.string().max(AI_BRIEF_PROMPT_MAX_CHARS).optional(),
});

export type BriefRequest = z.infer<typeof briefRequestSchema>;

// Structured brief the model must return. Arrays are bounded so the UI stays
// tidy. (For OpenAI structured output, prefer required fields over .optional().)
export const briefSchema = z.object({
  angle: z.string().describe("The strategic content angle the creator should take"),
  hook: z.string().describe("A scroll-stopping opening line for the LinkedIn post"),
  cta: z.string().describe("A single clear call to action"),
  keyMessages: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("3-5 concise key messages to weave in"),
  audience: z.string().describe("A one-line description of who this post targets"),
  toneOfVoice: z.string().describe("The tone the creator should write in"),
  doList: z.array(z.string()).min(2).max(5).describe("Things the creator should do"),
  dontList: z.array(z.string()).min(2).max(5).describe("Things the creator must avoid"),
  proofPoints: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("Credible proof points or stats to reference"),
});

export type GeneratedBrief = z.infer<typeof briefSchema>;
