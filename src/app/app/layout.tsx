import type { ReactNode } from "react";
import { requireCompany } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/app/dashboard-shell";

// Company dashboard chrome. requireCompany() enforces role + profile
// (default-deny, redirects to onboarding if no company profile).
export default async function CompanyAppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireCompany();
  return (
    <DashboardShell user={user} role={user.role}>
      {children}
    </DashboardShell>
  );
}
