"use server";

// Company (brand) booking mutations — the creator ↔ campaign relationship.
//
// Booking pipeline (schema BookingStatus): INVITED, ACCEPTED, DECLINED,
// DRAFT_SUBMITTED, APPROVED, SCHEDULED, LIVE, COMPLETED, PAID.
//
// The company DRIVES a specific subset of these transitions. Creator-side
// transitions (accept/decline an invite, submit a draft) are intentionally NOT
// exposed here — the company cannot accept on a creator's behalf. See
// COMPANY_BOOKING_TRANSITIONS below for the exact allowed moves.
//
// Every action re-resolves the company from the session and verifies that the
// booking's campaign is owned by that company before mutating (OWASP-IDOR-001).

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-helpers";
import { scoreCreator, icpTargetForCompany } from "@/lib/company-queries";

export type ActionResult =
  | { ok: true; message?: string; bookingId?: string }
  | { ok: false; error: string };

// --- Constants (BP-CONST-001) -----------------------------------------------

const TRACKED_SLUG_BYTES = 12; // 96 bits of entropy → ~16 url-safe chars
const PLACEHOLDER_TARGET_URL = "https://naano.com"; // fallback when company has no website

const CAMPAIGNS_LIST_PATH = "/app/campaigns";
const OVERVIEW_PATH = "/app";
const REPORTS_PATH = "/app/reports";

// Bookable campaign states — you can only invite creators onto a live-ish campaign.
const BOOKABLE_CAMPAIGN_STATUSES = new Set<string>(["DRAFT", "ACTIVE"]);

/**
 * Company-driven booking transitions. The KEY is the current status; the VALUE
 * is the set of statuses the COMPANY is permitted to move it to.
 *
 *   DRAFT_SUBMITTED → APPROVED   (approve the creator's submitted draft)
 *   APPROVED        → SCHEDULED  (lock in a publish slot)
 *   SCHEDULED       → LIVE       (mark the post as published)
 *   LIVE            → COMPLETED  (post run finished)
 *   LIVE|COMPLETED  → PAID       (release the creator payout)
 *
 * Everything else (INVITED→ACCEPTED, ACCEPTED→DRAFT_SUBMITTED, *→DECLINED) is a
 * creator-side move and is rejected here by default-deny.
 */
const COMPANY_BOOKING_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  DRAFT_SUBMITTED: ["APPROVED"],
  APPROVED: ["SCHEDULED"],
  SCHEDULED: ["LIVE"],
  LIVE: ["COMPLETED", "PAID"],
  COMPLETED: ["PAID"],
};

// --- Input schemas ----------------------------------------------------------

const createBookingSchema = z
  .object({
    campaignId: z.string().trim().min(1, "Campaign is required"),
    creatorId: z.string().trim().min(1, "Creator is required"),
  })
  .strict();

const updateBookingStatusSchema = z
  .object({
    bookingId: z.string().trim().min(1, "Booking id is required"),
    nextStatus: z.enum([
      "INVITED",
      "ACCEPTED",
      "DECLINED",
      "DRAFT_SUBMITTED",
      "APPROVED",
      "SCHEDULED",
      "LIVE",
      "COMPLETED",
      "PAID",
    ]),
  })
  .strict();

// --- Helpers ----------------------------------------------------------------

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

/** Cryptographically-secure, URL-safe slug for the /t/[slug] tracked link. */
function generateTrackedSlug(): string {
  return randomBytes(TRACKED_SLUG_BYTES)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 22);
}

/**
 * Build a valid, https attribution destination from the company website (or a
 * safe placeholder), decorated with UTM params. Uses typed URL construction —
 * never string concatenation (OWASP-XSS-001 URL-context guidance).
 */
function buildTargetUrl(companyWebsite: string | null, campaignId: string): string {
  let base: URL;
  try {
    base = new URL(companyWebsite ?? PLACEHOLDER_TARGET_URL);
    if (base.protocol !== "https:" && base.protocol !== "http:") {
      base = new URL(PLACEHOLDER_TARGET_URL);
    }
  } catch {
    base = new URL(PLACEHOLDER_TARGET_URL);
  }
  base.searchParams.set("utm_source", "naano");
  base.searchParams.set("utm_medium", "creator");
  base.searchParams.set("utm_campaign", campaignId);
  return base.toString();
}

// --- Actions ----------------------------------------------------------------

/**
 * Book a creator onto one of the company's campaigns. Validates campaign
 * ownership + bookable state, snapshots the fit score and price, and creates an
 * INVITED booking with a tracked link. Idempotent on the unique
 * (campaignId, creatorId) constraint — a re-book is reported gracefully.
 */
export async function createBooking(
  campaignId: string,
  creatorId: string,
): Promise<ActionResult> {
  const { company } = await requireCompany();

  const parsed = createBookingSchema.safeParse({ campaignId, creatorId });
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  // Ownership + state check (OWASP-IDOR-001): the campaign must belong to us.
  const campaign = await prisma.campaign.findFirst({
    where: { id: parsed.data.campaignId, companyProfileId: company.id },
    select: { id: true, status: true },
  });
  if (!campaign) {
    return { ok: false, error: "Campaign not found" };
  }
  if (!BOOKABLE_CAMPAIGN_STATUSES.has(campaign.status)) {
    return {
      ok: false,
      error: "You can only book creators onto draft or active campaigns",
    };
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: { id: parsed.data.creatorId },
    select: {
      id: true,
      pricePerPost: true,
      verticals: true,
      audienceByFunction: true,
      audienceBySeniority: true,
    },
  });
  if (!creator) {
    return { ok: false, error: "Creator not found" };
  }

  // Already booked? The unique (campaignId, creatorId) index is the source of
  // truth; check first for a friendly message, and treat a race as success.
  const existing = await prisma.booking.findUnique({
    where: {
      campaignId_creatorProfileId: {
        campaignId: campaign.id,
        creatorProfileId: creator.id,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, bookingId: existing.id, message: "Creator is already booked on this campaign" };
  }

  const fitScore = scoreCreator(icpTargetForCompany(company), {
    audienceByFunction: creator.audienceByFunction,
    audienceBySeniority: creator.audienceBySeniority,
    verticals: creator.verticals,
  });

  try {
    const booking = await prisma.booking.create({
      data: {
        campaignId: campaign.id,
        creatorProfileId: creator.id,
        status: "INVITED",
        pricePerPost: creator.pricePerPost,
        fitScore,
        trackedSlug: generateTrackedSlug(),
        targetUrl: buildTargetUrl(company.website, campaign.id),
      },
      select: { id: true },
    });

    revalidatePath(`${CAMPAIGNS_LIST_PATH}/${campaign.id}`);
    revalidatePath(CAMPAIGNS_LIST_PATH);
    revalidatePath(OVERVIEW_PATH);
    return { ok: true, bookingId: booking.id, message: "Creator invited to the campaign" };
  } catch {
    // Unique-constraint race (BP-IDEM-001): another request booked concurrently.
    return { ok: true, message: "Creator is already booked on this campaign" };
  }
}

/**
 * Advance a booking along the company-driven pipeline. Verifies the booking's
 * campaign is owned by the current company (404-style on miss) and enforces the
 * allowed transition table. Reaching PAID also settles the creator payout.
 */
export async function updateBookingStatus(
  bookingId: string,
  nextStatus: BookingStatus,
): Promise<ActionResult> {
  const { company } = await requireCompany();

  const parsed = updateBookingStatusSchema.safeParse({ bookingId, nextStatus });
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  // Ownership check across the campaign relation (OWASP-IDOR-001).
  const booking = await prisma.booking.findFirst({
    where: {
      id: parsed.data.bookingId,
      campaign: { companyProfileId: company.id },
    },
    select: { id: true, status: true, campaignId: true, pricePerPost: true },
  });
  if (!booking) {
    return { ok: false, error: "Booking not found" };
  }

  const allowed = COMPANY_BOOKING_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(parsed.data.nextStatus)) {
    return {
      ok: false,
      error: `Cannot move a ${booking.status.toLowerCase().replace(/_/g, " ")} booking to ${parsed.data.nextStatus.toLowerCase().replace(/_/g, " ")}`,
    };
  }

  await applyBookingTransition(booking, parsed.data.nextStatus);

  revalidatePath(`${CAMPAIGNS_LIST_PATH}/${booking.campaignId}`);
  revalidatePath(CAMPAIGNS_LIST_PATH);
  revalidatePath(REPORTS_PATH);
  revalidatePath(OVERVIEW_PATH);
  return {
    ok: true,
    message: `Booking moved to ${parsed.data.nextStatus.toLowerCase().replace(/_/g, " ")}`,
  };
}

/**
 * Persist a validated booking transition and its side effects:
 *   - SCHEDULED stamps scheduledAt
 *   - LIVE stamps publishedAt
 *   - PAID upserts a PAID payout for the booking (idempotent, BP-IDEM-001)
 */
async function applyBookingTransition(
  booking: { id: string; pricePerPost: number },
  nextStatus: BookingStatus,
): Promise<void> {
  const now = new Date();
  const data: {
    status: BookingStatus;
    scheduledAt?: Date;
    publishedAt?: Date;
  } = { status: nextStatus };

  if (nextStatus === "SCHEDULED") data.scheduledAt = now;
  if (nextStatus === "LIVE") data.publishedAt = now;

  if (nextStatus === "PAID") {
    await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data }),
      prisma.payout.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          amount: booking.pricePerPost,
          status: "PAID",
          paidAt: now,
        },
        update: { status: "PAID", paidAt: now, amount: booking.pricePerPost },
      }),
    ]);
    return;
  }

  await prisma.booking.update({ where: { id: booking.id }, data });
}
