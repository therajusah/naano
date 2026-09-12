"use client";

// Booking pipeline kanban for the campaign detail page. Columns follow
// BOOKING_PIPELINE; each card shows the creator + fit + price and the
// company-driven status-advance action(s). Bookings are received as a plain
// serializable DTO from the server; mutations go through updateBookingStatus.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";
import { Loader2, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FitScoreRing } from "@/components/ui/fit-score";
import { CopyLinkButton } from "@/components/company/copy-link-button";
import { formatEuros } from "@/lib/utils";
import { BOOKING_PIPELINE } from "@/lib/constants";
import { updateBookingStatus } from "@/app/actions/bookings";

export type PipelineBooking = {
  id: string;
  status: BookingStatus;
  creatorName: string;
  creatorAvatar: string | null;
  pricePerPost: number;
  fitScore: number;
  trackedSlug: string;
};

// Company-driven next-step per status (mirrors the server transition table).
const NEXT_STEP: Partial<Record<BookingStatus, { label: string; to: BookingStatus }>> = {
  DRAFT_SUBMITTED: { label: "Approve draft", to: "APPROVED" },
  APPROVED: { label: "Mark scheduled", to: "SCHEDULED" },
  SCHEDULED: { label: "Mark live", to: "LIVE" },
  LIVE: { label: "Mark paid", to: "PAID" },
  COMPLETED: { label: "Mark paid", to: "PAID" },
};

const COLUMN_LABEL: Record<string, string> = {
  INVITED: "Invited",
  ACCEPTED: "Accepted",
  DRAFT_SUBMITTED: "Draft submitted",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  PAID: "Paid",
};

// A DECLINED booking sits outside the forward pipeline; surface it under INVITED.
function columnFor(status: BookingStatus): (typeof BOOKING_PIPELINE)[number] {
  if (status === "DECLINED") return "INVITED";
  if (status === "COMPLETED") return "LIVE";
  if ((BOOKING_PIPELINE as readonly string[]).includes(status)) {
    return status as (typeof BOOKING_PIPELINE)[number];
  }
  return "INVITED";
}

export function BookingPipeline({ bookings }: { bookings: PipelineBooking[] }) {
  const grouped = new Map<string, PipelineBooking[]>();
  for (const column of BOOKING_PIPELINE) grouped.set(column, []);
  for (const booking of bookings) {
    grouped.get(columnFor(booking.status))?.push(booking);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {BOOKING_PIPELINE.map((column) => {
        const items = grouped.get(column) ?? [];
        return (
          <div key={column} className="w-64 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {COLUMN_LABEL[column]}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="flex min-h-24 flex-col gap-2 rounded-xl border border-border bg-muted/30 p-2">
              {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">Empty</p>
              ) : (
                items.map((booking) => (
                  <PipelineCard key={booking.id} booking={booking} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PipelineCard({ booking }: { booking: PipelineBooking }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const step = NEXT_STEP[booking.status];
  const isLive = booking.status === "LIVE" || booking.status === "COMPLETED";

  function advance(to: BookingStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatus(booking.id, to);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <Avatar name={booking.creatorName} src={booking.creatorAvatar} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{booking.creatorName}</p>
          <p className="text-xs text-muted-foreground">{formatEuros(booking.pricePerPost)}</p>
        </div>
        <FitScoreRing score={booking.fitScore} size={34} />
      </div>

      {booking.status === "DECLINED" && (
        <div className="mt-2">
          <Badge variant="danger">Declined</Badge>
        </div>
      )}

      {isLive && (
        <div className="mt-2">
          <CopyLinkButton slug={booking.trackedSlug} />
        </div>
      )}

      {step && (
        <button
          type="button"
          onClick={() => advance(step.to)}
          disabled={isPending}
          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md bg-brand px-2 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              {step.label}
              <ArrowRight className="size-3.5" />
            </>
          )}
        </button>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
