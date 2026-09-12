import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { BudgetPlannerCalculator } from "@/components/free-tools/budget-planner-calculator";

export const metadata: Metadata = {
  title: "Campaign Budget Planner | Naano Free Tools",
  description:
    "Turn a LinkedIn creator campaign budget into an expected number of published posts, impressions and leads. Free planning tool, no sign-up.",
};

export default function BudgetPlannerPage() {
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
            title="Campaign Budget Planner"
            subtitle="See what your budget actually buys: a realistic number of published posts, plus rough impressions and leads to sanity-check your plan."
          />
        </div>
        <BudgetPlannerCalculator />
      </Container>
    </section>
  );
}
