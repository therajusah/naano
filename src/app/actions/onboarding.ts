"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, roleHome } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";

export type OnboardingState = {
  error?: string;
};

const companySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(160),
});

const creatorSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(120),
  headline: z.string().trim().min(1, "Headline is required").max(200),
});

const agencySchema = z.object({
  agencyName: z.string().trim().min(1, "Agency name is required").max(160),
  agencyType: z.enum(["BRAND_AGENCY", "CREATOR_AGENCY"]),
});

/**
 * Complete a missing CompanyProfile for the current user. Role is derived from
 * the server-side session (OWASP-ACLFUNC-001); the client cannot choose it.
 * Refuses if a profile already exists (idempotency + no overwrite).
 */
export async function completeCompanyOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireAuth();
  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    redirect(roleHome(user.role));
  }

  const parsed = companySchema.safeParse({
    companyName: formData.get("companyName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const existing = await prisma.companyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/app");

  try {
    await prisma.companyProfile.create({
      data: { userId: user.id, companyName: parsed.data.companyName },
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logger.error("onboarding.company.failed", { userId: user.id });
    return { error: "We couldn't save your profile. Please try again." };
  }

  logger.info("onboarding.company.created", { userId: user.id });
  redirect("/app");
}

/**
 * Complete a missing CreatorProfile for the current user. Required numeric and
 * Json fields get sensible defaults (empty audience maps).
 */
export async function completeCreatorOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireAuth();
  if (user.role !== "CREATOR" && user.role !== "ADMIN") {
    redirect(roleHome(user.role));
  }

  const parsed = creatorSchema.safeParse({
    displayName: formData.get("displayName"),
    headline: formData.get("headline"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const existing = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/creator");

  try {
    await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        displayName: parsed.data.displayName,
        headline: parsed.data.headline,
        bio: "",
        location: "",
        followers: 0,
        medianReach: 0,
        engagementRate: 0,
        avgReactions: 0,
        avgComments: 0,
        pricePerPost: 100,
        verticals: [],
        audienceByFunction: {} as Prisma.InputJsonValue,
        audienceBySeniority: {} as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logger.error("onboarding.creator.failed", { userId: user.id });
    return { error: "We couldn't save your profile. Please try again." };
  }

  logger.info("onboarding.creator.created", { userId: user.id });
  redirect("/creator");
}

/** Complete a missing AgencyProfile for the current user. */
export async function completeAgencyOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireAuth();
  if (user.role !== "AGENCY" && user.role !== "ADMIN") {
    redirect(roleHome(user.role));
  }

  const parsed = agencySchema.safeParse({
    agencyName: formData.get("agencyName"),
    agencyType: formData.get("agencyType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const existing = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/agency");

  try {
    await prisma.agencyProfile.create({
      data: {
        userId: user.id,
        agencyName: parsed.data.agencyName,
        type: parsed.data.agencyType,
      },
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logger.error("onboarding.agency.failed", { userId: user.id });
    return { error: "We couldn't save your profile. Please try again." };
  }

  logger.info("onboarding.agency.created", { userId: user.id });
  redirect("/agency");
}
