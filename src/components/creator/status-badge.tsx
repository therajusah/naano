import type { BookingStatus } from "@prisma/client";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

// Human labels + tone per booking state (BP-CONST-001 — no scattered strings).
const STATUS_META: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
  INVITED: { label: "New invite", variant: "warning" },
  ACCEPTED: { label: "Accepted", variant: "brand" },
  DECLINED: { label: "Declined", variant: "outline" },
  DRAFT_SUBMITTED: { label: "Draft submitted", variant: "accent" },
  APPROVED: { label: "Approved", variant: "brand" },
  SCHEDULED: { label: "Scheduled", variant: "brand" },
  LIVE: { label: "Live", variant: "success" },
  COMPLETED: { label: "Completed", variant: "success" },
  PAID: { label: "Paid", variant: "success" },
};

export function statusLabel(status: BookingStatus): string {
  return STATUS_META[status].label;
}

/** Coloured pill for a booking's current lifecycle state. */
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
