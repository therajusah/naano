import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const SLUG_PATTERN = /^[a-zA-Z0-9_-]{6,64}$/;
const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Attribution redirect. Records a click against the booking's post, then
 * forwards to the destination. The destination is stored by us at booking
 * time (not user-supplied here), and its scheme is re-validated before we
 * redirect (SSRF/open-redirect defense in depth — OWASP-SSRF-001).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const booking = await prisma.booking.findUnique({
    where: { trackedSlug: slug },
    select: { id: true, targetUrl: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let destination: URL;
  try {
    destination = new URL(booking.targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
  }
  if (!ALLOWED_SCHEMES.has(destination.protocol)) {
    return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
  }

  // Record the click against today's metric row (idempotent per day+booking).
  try {
    const date = todayUtc();
    await prisma.postMetricDaily.upsert({
      where: { bookingId_date: { bookingId: booking.id, date } },
      create: { bookingId: booking.id, date, clicks: 1 },
      update: { clicks: { increment: 1 } },
    });
  } catch (error) {
    // Never block the redirect on a metrics write failure — log and continue.
    logger.error("attribution.click.write_failed", {
      bookingId: booking.id,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  return NextResponse.redirect(destination.toString(), { status: 302 });
}
