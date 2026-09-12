import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Sparkles, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm, type RegisterRole } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create your account — Naano",
};

// Map the URL query param to a validated internal role. Anything else falls
// back to the role-selection screen (never trust the raw query string).
const ROLE_BY_QUERY: Record<string, RegisterRole> = {
  company: "COMPANY",
  creator: "CREATOR",
  agency: "AGENCY",
};

const ROLE_META: Record<RegisterRole, { title: string; description: string }> = {
  COMPANY: {
    title: "Create your brand account",
    description: "Find creators your buyers trust and launch campaigns in days.",
  },
  CREATOR: {
    title: "Create your creator account",
    description: "Get discovered by B2B brands and get paid per post.",
  },
  AGENCY: {
    title: "Create your agency account",
    description: "Run campaigns for brands or manage a roster of creators.",
  },
};

const ROLE_CARDS = [
  {
    query: "company",
    title: "I'm a brand",
    blurb: "I want to hire creators and run campaigns.",
    icon: Building2,
  },
  {
    query: "creator",
    title: "I'm a creator",
    blurb: "I want to get booked by B2B brands.",
    icon: Sparkles,
  },
  {
    query: "agency",
    title: "I'm an agency",
    blurb: "I manage brands or a roster of creators.",
    icon: Users,
  },
] as const;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { role: roleParam } = await searchParams;
  const role = roleParam ? ROLE_BY_QUERY[roleParam] : undefined;

  // --- Step 1: role selection ---
  if (!role) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            First, who are you here as?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One platform. Two sides.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {ROLE_CARDS.map(({ query, title, blurb, icon: Icon }) => (
            <Link
              key={query}
              href={`/register?role=${query}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-white p-4 text-left shadow-sm transition-colors hover:border-brand hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-brand">
                <Icon className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">{title}</span>
                <span className="text-sm text-muted-foreground">{blurb}</span>
              </span>
            </Link>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // --- Step 2: registration form for the chosen role ---
  const meta = ROLE_META[role];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{meta.title}</CardTitle>
        <CardDescription>{meta.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm role={role} />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Free to start. No credit card required.
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/register" className="text-brand hover:underline">
            ← Choose a different account type
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
