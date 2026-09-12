import type { ReactNode } from "react";
import { requireCreator } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/app/dashboard-shell";

export default async function CreatorAppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireCreator();
  return (
    <DashboardShell user={user} role={user.role}>
      {children}
    </DashboardShell>
  );
}
