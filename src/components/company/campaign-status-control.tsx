"use client";

// Campaign status advance control on the campaign detail header.
// Shows the current status and the next allowed action(s) as buttons wired to
// the updateCampaignStatus server action.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CampaignStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateCampaignStatus } from "@/app/actions/campaigns";

// Mirrors the server-side transition table (source of truth is the action).
const NEXT_ACTIONS: Partial<Record<CampaignStatus, { label: string; to: CampaignStatus }[]>> = {
  DRAFT: [{ label: "Activate campaign", to: "ACTIVE" }],
  ACTIVE: [{ label: "Mark completed", to: "COMPLETED" }],
};

export function CampaignStatusControl({
  campaignId,
  status,
}: {
  campaignId: string;
  status: CampaignStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const actions = NEXT_ACTIONS[status] ?? [];

  function advance(to: CampaignStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateCampaignStatus(campaignId, to);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.to}
            type="button"
            variant="brand"
            size="sm"
            onClick={() => advance(action.to)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : action.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
