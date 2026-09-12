import type { ReactNode } from "react";
import { requireAgency } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/app/dashboard-shell";

export default async function AgencyAppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAgency();
  return (
    <DashboardShell user={user} role={user.role}>
      {children}
    </DashboardShell>
  );
}
