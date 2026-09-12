import Link from "next/link";
import { requireCreator } from "@/lib/auth-helpers";
import {
  getCreatorBookings,
  ACTIVE_DEAL_STATUSES,
  PUBLISHED_STATUSES,
  type CreatorBooking,
} from "@/lib/creator-queries";
import { formatEuros } from "@/lib/utils";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { BookingStatusBadge } from "@/components/creator/status-badge";
import { DealInviteActions } from "@/components/creator/deal-invite-actions";

export const metadata = { title: "Deals" };

function DealCard({ booking }: { booking: CreatorBooking }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={booking.campaign.name} size={44} />
          <div>
            <Link href={`/creator/deals/${booking.id}`} className="font-medium hover:underline">
              {booking.campaign.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {formatEuros(booking.pricePerPost)} · {booking.fitScore}% audience fit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <BookingStatusBadge status={booking.status} />
          {booking.status === "INVITED" && <DealInviteActions bookingId={booking.id} />}
        </div>
      </CardContent>
    </Card>
  );
}

function DealSection({ title, deals }: { title: string; deals: CreatorBooking[] }) {
  if (deals.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">
        {title} <span className="text-muted-foreground">({deals.length})</span>
      </h2>
      <div className="grid gap-3">
        {deals.map((deal) => (
          <DealCard key={deal.id} booking={deal} />
        ))}
      </div>
    </section>
  );
}

export default async function CreatorDealsPage() {
  const { creator } = await requireCreator();
  const bookings = await getCreatorBookings(creator.id);

  const invites = bookings.filter((b) => b.status === "INVITED");
  const inProgress = bookings.filter((b) => ACTIVE_DEAL_STATUSES.includes(b.status));
  const live = bookings.filter((b) => PUBLISHED_STATUSES.includes(b.status));

  const hasAny = invites.length + inProgress.length + live.length > 0;

  return (
    <>
      <PageHeader title="Deals" description="Brand collaborations, from invite to paid." />
      {!hasAny ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No deals yet. Stay available and keep your media kit sharp — brands discover you by
            audience fit, not follower count.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          <DealSection title="New invites" deals={invites} />
          <DealSection title="In progress" deals={inProgress} />
          <DealSection title="Live & paid" deals={live} />
        </div>
      )}
    </>
  );
}
