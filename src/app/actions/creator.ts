"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCreator } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import {
  AUDIENCE_FUNCTIONS,
  AUDIENCE_SENIORITIES,
  MAX_POST_PRICE,
  MIN_POST_PRICE,
  VERTICALS,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Field length + revalidation constants (BP-CONST-001 — no inline literals).
// ---------------------------------------------------------------------------

const DRAFT_CONTENT_MIN_CHARS = 20;
const DRAFT_CONTENT_MAX_CHARS = 5000;
const HEADLINE_MAX_CHARS = 120;
const BIO_MAX_CHARS = 800;
const LOCATION_MAX_CHARS = 120;
const MAX_VERTICALS_PER_CREATOR = 12;

// Paths that surface booking/profile state and must be refreshed after a write.
const CREATOR_PATHS = [
  "/creator",
  "/creator/deals",
  "/creator/profile",
  "/creator/earnings",
] as const;

/** Discriminated action result — no exceptions leak to the client boundary. */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function revalidateCreatorSurface(bookingId?: string): void {
  for (const path of CREATOR_PATHS) revalidatePath(path);
  if (bookingId) revalidatePath(`/creator/deals/${bookingId}`);
}

// ---------------------------------------------------------------------------
// Zod input schemas (BP-INPUTVAL-001 — validate every external boundary).
// A booking id is a cuid; we constrain it to a safe id shape, never trust it
// for ownership (OWASP-IDOR-001 — ownership is re-checked against the session).
// ---------------------------------------------------------------------------

const bookingIdSchema = z
  .string()
  .min(1, "A booking id is required.")
  .max(64, "Invalid booking id.")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid booking id.");

const submitDraftSchema = z.object({
  bookingId: bookingIdSchema,
  content: z
    .string()
    .trim()
    .min(DRAFT_CONTENT_MIN_CHARS, `Draft must be at least ${DRAFT_CONTENT_MIN_CHARS} characters.`)
    .max(DRAFT_CONTENT_MAX_CHARS, `Draft must be under ${DRAFT_CONTENT_MAX_CHARS} characters.`),
});

// Explicit DTO — only these fields are client-settable (OWASP-MASS-001).
// Follower counts, audience maps, fitScore etc. are system/seeded, never here.
const updateProfileSchema = z.object({
  headline: z.string().trim().min(1, "Headline is required.").max(HEADLINE_MAX_CHARS),
  bio: z.string().trim().min(1, "Bio is required.").max(BIO_MAX_CHARS),
  location: z.string().trim().min(1, "Location is required.").max(LOCATION_MAX_CHARS),
  verticals: z
    .array(z.enum(VERTICALS))
    .max(MAX_VERTICALS_PER_CREATOR, "Too many verticals selected.")
    .default([]),
  pricePerPost: z
    .number({ error: "Enter a valid price." })
    .int("Price must be a whole number of euros.")
    .min(MIN_POST_PRICE, `Minimum price is €${MIN_POST_PRICE}.`)
    .max(MAX_POST_PRICE, `Maximum price is €${MAX_POST_PRICE}.`),
  available: z.boolean(),
});

export type UpdateCreatorProfileInput = z.infer<typeof updateProfileSchema>;

// ---------------------------------------------------------------------------
// Booking state machine (BP-CONST-001) — allowed source states per transition.
// Default-deny: a transition not listed here is rejected.
// ---------------------------------------------------------------------------

const ACCEPT_FROM: readonly BookingStatus[] = ["INVITED"];
const DECLINE_FROM: readonly BookingStatus[] = ["INVITED"];
const SUBMIT_DRAFT_FROM: readonly BookingStatus[] = ["ACCEPTED"];

/**
 * Load a booking and verify it belongs to the authenticated creator.
 * Returns null for both "not found" and "not owned" so callers surface an
 * identical not-found response (OWASP-IDOR-001 — never confirm existence).
 */
async function findOwnedBooking(
  bookingId: string,
  creatorProfileId: string,
): Promise<{ id: string; status: BookingStatus } | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, creatorProfileId },
    select: { id: true, status: true },
  });
  return booking ?? null;
}

/** Move an owned booking from an allowed source state to a target state. */
async function transitionBooking(
  bookingId: string,
  allowedFrom: readonly BookingStatus[],
  nextStatus: BookingStatus,
  extraData: Prisma.BookingUpdateInput = {},
): Promise<ActionResult> {
  const { creator, user } = await requireCreator();

  const booking = await findOwnedBooking(bookingId, creator.id);
  if (!booking) {
    // Access-control failure — logged with context, no sensitive data.
    logger.warn("creator.booking.access_denied", {
      userId: user.id,
      creatorProfileId: creator.id,
      bookingId,
      nextStatus,
    });
    return { ok: false, error: "That deal could not be found." };
  }

  if (!allowedFrom.includes(booking.status)) {
    return {
      ok: false,
      error: `This deal is ${booking.status.toLowerCase().replace(/_/g, " ")} and can no longer be changed that way.`,
    };
  }

  try {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: nextStatus, ...extraData },
    });
  } catch (error) {
    logger.error("creator.booking.transition_failed", {
      userId: user.id,
      bookingId: booking.id,
      nextStatus,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, error: "We couldn't update that deal. Please try again." };
  }

  logger.info("creator.booking.transitioned", {
    userId: user.id,
    creatorProfileId: creator.id,
    bookingId: booking.id,
    fromStatus: booking.status,
    toStatus: nextStatus,
  });

  revalidateCreatorSurface(booking.id);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Public server actions
// ---------------------------------------------------------------------------

/** INVITED → ACCEPTED. */
export async function acceptDeal(bookingId: string): Promise<ActionResult> {
  const parsed = bookingIdSchema.safeParse(bookingId);
  if (!parsed.success) return { ok: false, error: "Invalid deal." };
  return transitionBooking(parsed.data, ACCEPT_FROM, "ACCEPTED");
}

/** INVITED → DECLINED. */
export async function declineDeal(bookingId: string): Promise<ActionResult> {
  const parsed = bookingIdSchema.safeParse(bookingId);
  if (!parsed.success) return { ok: false, error: "Invalid deal." };
  return transitionBooking(parsed.data, DECLINE_FROM, "DECLINED");
}

/** ACCEPTED → DRAFT_SUBMITTED, storing the creator's draft content. */
export async function submitDraft(bookingId: string, content: string): Promise<ActionResult> {
  const parsed = submitDraftSchema.safeParse({ bookingId, content });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid draft." };
  }
  return transitionBooking(parsed.data.bookingId, SUBMIT_DRAFT_FROM, "DRAFT_SUBMITTED", {
    draftContent: parsed.data.content,
  });
}

/**
 * Update the current creator's editable media-kit fields. Ownership is
 * implicit — we only ever write the profile bound to the session user.
 */
export async function updateCreatorProfile(
  input: UpdateCreatorProfileInput,
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your entries." };
  }

  const { creator, user } = await requireCreator();
  const { headline, bio, location, verticals, pricePerPost, available } = parsed.data;

  try {
    // Explicit field list — no request-body spread (OWASP-MASS-001).
    await prisma.creatorProfile.update({
      where: { id: creator.id },
      data: { headline, bio, location, verticals, pricePerPost, available },
    });
  } catch (error) {
    logger.error("creator.profile.update_failed", {
      userId: user.id,
      creatorProfileId: creator.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, error: "We couldn't save your profile. Please try again." };
  }

  logger.info("creator.profile.updated", {
    userId: user.id,
    creatorProfileId: creator.id,
  });

  revalidateCreatorSurface();
  return { ok: true };
}

/** Flip the current creator's available-to-book flag. */
export async function toggleAvailability(): Promise<ActionResult> {
  const { creator, user } = await requireCreator();

  try {
    await prisma.creatorProfile.update({
      where: { id: creator.id },
      data: { available: !creator.available },
    });
  } catch (error) {
    logger.error("creator.availability.toggle_failed", {
      userId: user.id,
      creatorProfileId: creator.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, error: "We couldn't update your availability. Please try again." };
  }

  logger.info("creator.availability.toggled", {
    userId: user.id,
    creatorProfileId: creator.id,
    available: !creator.available,
  });

  revalidateCreatorSurface();
  return { ok: true };
}
