import type { UserRole } from "@prisma/client";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { APP_NAV } from "@/components/app/nav-items";
import { signOutAction } from "@/app/actions/session";
import type { SessionUser } from "@/lib/auth-helpers";

const ROLE_LABEL: Record<string, string> = {
  COMPANY: "Company",
  CREATOR: "Creator",
  AGENCY: "Agency",
  ADMIN: "Admin",
};

/** Persistent app chrome: sidebar (desktop) / top nav (mobile) + user footer. */
export function DashboardShell({
  user,
  role,
  children,
}: {
  user: SessionUser;
  role: UserRole;
  children: React.ReactNode;
}) {
  const navRole = role === "ADMIN" ? "COMPANY" : role;
  const items = APP_NAV[navRole];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 lg:flex-row">
      <aside className="flex flex-col gap-4 border-b border-border bg-white p-4 lg:h-screen lg:w-64 lg:shrink-0 lg:gap-6 lg:border-b-0 lg:border-r lg:p-5 lg:sticky lg:top-0">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {ROLE_LABEL[role]}
          </span>
        </div>

        <div className="lg:flex-1">
          <SidebarNav items={items} />
        </div>

        <div className="hidden items-center gap-3 border-t border-border pt-4 lg:flex">
          <Avatar name={user.name} src={user.image} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

/** Standard page header inside the dashboard main area. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
