import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { EngagementRateCalculator } from "@/components/free-tools/engagement-rate-calculator";

export const metadata: Metadata = {
  title: "Engagement Rate Calculator | Naano Free Tools",
  description:
    "Calculate your true LinkedIn engagement rate from reactions, comments and followers — and see how sponsors will read it. Free and instant.",
};

export default function EngagementRatePage() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <Link
            href="/free-tools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            All free tools
          </Link>
          <SectionHeading
            align="left"
            eyebrow="Free tool · For creators"
            title="Engagement Rate Calculator"
            subtitle="Reactions and followers only tell half the story. Get your weighted engagement rate and a plain-English read on what it means."
          />
        </div>
        <EngagementRateCalculator />
      </Container>
    </section>
  );
}
