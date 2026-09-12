import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCompany } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/app/dashboard-shell";
import { NewCampaignForm } from "@/components/company/new-campaign-form";

export default async function NewCampaignPage() {
  // Enforce company auth even though the layout already does — defence in depth.
  await requireCompany();

  return (
    <>
      <div className="mb-2">
        <Link
          href="/app/campaigns"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to campaigns
        </Link>
      </div>

      <PageHeader
        title="New campaign"
        description="Set up your campaign and let AI draft a creator-ready brief."
      />

      <NewCampaignForm />
    </>
  );
}
