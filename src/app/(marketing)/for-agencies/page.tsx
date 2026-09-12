import type { Metadata } from "next";
import { Briefcase, Users, ArrowRight, Check, CalendarClock } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Faq } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For agencies",
  description:
    "Choose the workspace that matches your agency. Run client campaigns as a brand agency, or represent and manage a roster of creators as a creator agency.",
};

const WORKSPACES = [
  {
    id: "brand",
    icon: <Briefcase className="size-6" />,
    kicker: "I manage campaigns for companies",
    title: "Brand agency",
    description:
      "Run creator campaigns on behalf of your clients from a single account, with a clean separation between each brand.",
    features: [
      "One workspace per client",
      "Allocate and track budgets per client",
      "Run and report on campaigns across clients",
      "Keep every brand's data cleanly separated",
    ],
    cta: "Create a brand agency workspace",
  },
  {
    id: "creator",
    icon: <Users className="size-6" />,
    kicker: "I represent and manage creators",
    title: "Creator agency",
    description:
      "Represent a roster of creators, manage their rates and profiles, and field brand deals on their behalf.",
    features: [
      "Import your roster from a CSV",
      "Manage rates and profiles centrally",
      "Field and accept brand deals for your talent",
      "Creators don't need their own logins",
    ],
    cta: "Create a creator agency workspace",
  },
];

const FAQ = [
  {
    question: "Which workspace should I choose?",
    answer:
      "If you run marketing campaigns for client companies, choose a brand agency workspace. If you represent creators and manage their deals and rates, choose a creator agency workspace. You pick when you sign up.",
  },
  {
    question: "How does a brand agency keep clients separate?",
    answer:
      "Each client gets its own workspace with its own budget, campaigns and reporting, so nothing leaks between brands. You switch between them from a single agency login.",
  },
  {
    question: "Do the creators I represent need Naano accounts?",
    answer:
      "No. As a creator agency you import your roster and manage rates and profiles on their behalf — your creators don't need their own logins to be booked by brands.",
  },
  {
    question: "Can I talk to someone before I set this up?",
    answer:
      "Yes. Book a 30-minute agency call and we'll walk you through the workspace that fits how you operate and help you get your first campaigns or roster loaded.",
  },
];

export default function ForAgenciesPage() {
  return (
    <>
      <Hero
        tone="dark"
        badge="For agencies"
        title={
          <>
            Choose the workspace that{" "}
            <span className="text-gradient">matches your agency.</span>
          </>
        }
        subtitle="Whether you run campaigns for brands or represent creators, Naano gives you a workspace built around how you actually operate."
        actions={
          <ButtonLink href="/register?role=agency" variant="white" size="lg">
            Get started
            <ArrowRight className="size-4" />
          </ButtonLink>
        }
      />

      {/* Two workspace cards */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {WORKSPACES.map((ws) => (
              <div
                key={ws.id}
                className="flex flex-col rounded-3xl border border-border bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand-700">
                  {ws.icon}
                </span>
                <p className="mt-6 text-sm font-medium text-muted-foreground">
                  {ws.kicker}
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {ws.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {ws.description}
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {ws.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  href="/register?role=agency"
                  size="lg"
                  className="mt-8 w-full"
                >
                  {ws.cta}
                </ButtonLink>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Book a call band */}
      <section className="bg-muted/30 py-16">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-border bg-white p-10 text-center shadow-sm">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-ink text-white">
              <CalendarClock className="size-6" />
            </span>
            <SectionHeading
              title="Not sure where to start?"
              subtitle="Book a 30-minute agency call and we'll set you up with the right workspace and your first campaigns or roster."
              className="mx-auto"
            />
            <ButtonLink href="/register?role=agency" size="lg">
              Book a 30-minute agency call
              <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Faq items={FAQ} />

      <CtaBand
        title="Bring your agency to Naano"
        subtitle="Set up your workspace in minutes."
        actions={
          <ButtonLink href="/register?role=agency" variant="white" size="lg">
            Get started
            <ArrowRight className="size-4" />
          </ButtonLink>
        }
      />
    </>
  );
}
