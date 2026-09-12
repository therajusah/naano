import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CreatorWorthCalculator } from "@/components/free-tools/creator-worth-calculator";

export const metadata: Metadata = {
  title: "Creator Worth Calculator | Naano Free Tools",
  description:
    "Estimate a fair price per sponsored LinkedIn post based on your follower count, engagement and niche. Free, instant, no sign-up.",
};

export default function CreatorWorthPage() {
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
            title="Creator Worth Calculator"
            subtitle="What should you charge for a sponsored LinkedIn post? Enter your numbers to get a fair suggested price and a realistic range."
          />
        </div>
        <CreatorWorthCalculator />
      </Container>
    </section>
  );
}
