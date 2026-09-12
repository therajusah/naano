"use client";

// "Book this creator" panel on the media-kit page. Lets the company invite a
// creator onto one of its DRAFT/ACTIVE campaigns at the creator's price. The
// createBooking server action owns all validation + ownership checks.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { formatEuros } from "@/lib/utils";
import { createBooking } from "@/app/actions/bookings";

export type BookableCampaign = { id: string; name: string; status: string };

export function BookCreatorPanel({
  creatorId,
  pricePerPost,
  campaigns,
}: {
  creatorId: string;
  pricePerPost: number;
  campaigns: BookableCampaign[];
}) {
  const router = useRouter();
  const [isBooking, startBooking] = useTransition();
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function onBook() {
    setMessage(null);
    if (!campaignId) {
      setMessage({ tone: "error", text: "Choose a campaign to book onto." });
      return;
    }
    startBooking(async () => {
      const result = await createBooking(campaignId, creatorId);
      if (result.ok) {
        setMessage({ tone: "ok", text: result.message ?? "Creator invited." });
        router.push(`/app/campaigns/${campaignId}`);
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="size-5 text-brand" />
          Book this creator
        </CardTitle>
        <CardDescription>
          Invite them onto a campaign at {formatEuros(pricePerPost)} per post.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            You need a draft or active campaign first.
            <div className="mt-3">
              <ButtonLink href="/app/campaigns/new" variant="brand" size="sm">
                Create a campaign
              </ButtonLink>
            </div>
          </div>
        ) : (
          <>
            <Field label="Campaign" htmlFor="book-campaign">
              <Select
                id="book-campaign"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.status.toLowerCase()})
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Price per post</span>
              <span className="font-semibold">{formatEuros(pricePerPost)}</span>
            </div>
            <Button type="button" onClick={onBook} disabled={isBooking}>
              {isBooking ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending invite…
                </>
              ) : (
                "Send campaign invite"
              )}
            </Button>
          </>
        )}

        {message && (
          <p
            className={
              message.tone === "ok"
                ? "flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
                : "rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            }
          >
            {message.tone === "ok" && <CheckCircle2 className="size-4" />}
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
