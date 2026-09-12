import { requireCreator } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatEuros, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/app/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Earnings" };

export default async function CreatorEarningsPage() {
  const { creator } = await requireCreator();

  const payouts = await prisma.payout.findMany({
    where: { booking: { creatorProfileId: creator.id } },
    include: { booking: { include: { campaign: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const paid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const pending = payouts.filter((p) => p.status !== "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Earnings"
        description="Paid within 24h · Keep 100% of what you earn · No invoice, no chasing."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total earned" value={formatEuros(paid)} hint="Paid out" />
        <StatCard label="Pending" value={formatEuros(pending)} hint="Awaiting payout" />
        <StatCard label="Payouts" value={payouts.length} hint="All time" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payouts yet. Complete a live deal to get paid within 24h.
            </p>
          ) : (
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Campaign</th>
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-border/60">
                      <td className="py-3 font-medium">{payout.booking.campaign.name}</td>
                      <td className="py-3 text-muted-foreground">{payout.method}</td>
                      <td className="py-3 text-muted-foreground">
                        {payout.paidAt ? formatDate(payout.paidAt) : "—"}
                      </td>
                      <td className="py-3 text-right font-medium">{formatEuros(payout.amount)}</td>
                      <td className="py-3 text-right">
                        <Badge variant={payout.status === "PAID" ? "success" : "warning"}>
                          {payout.status.toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
