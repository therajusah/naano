import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { DeliveryOddsCalculator } from "@/components/free-tools/delivery-odds-calculator";

export const metadata: Metadata = {
  title: "Sponsored Post Delivery Odds Estimator | Naano Free Tools",
  description:
    "Estimate how likely a sponsored LinkedIn post is to actually get published at a given price, using Naano's delivery benchmarks. Free and instant.",
};

export default function DeliveryOddsPage() {
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
            eyebrow="Free tool · For brands"
            title="Sponsored Post Delivery Odds Estimator"
            subtitle="Booking a post isn't the same as it going live. See the expected publish rate for your offer price before you commit budget."
          />
        </div>
        <DeliveryOddsCalculator />
      </Container>
    </section>
  );
}
