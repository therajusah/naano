import type { UserRole } from "@prisma/client";

export type NavItem = { href: string; label: string; icon: string };

// Sidebar navigation per role. `icon` maps to a lucide icon in SidebarNav.
export const APP_NAV: Record<Exclude<UserRole, "ADMIN">, NavItem[]> = {
  COMPANY: [
    { href: "/app", label: "Overview", icon: "home" },
    { href: "/app/discover", label: "Discover creators", icon: "search" },
    { href: "/app/campaigns", label: "Campaigns", icon: "megaphone" },
    { href: "/app/leads", label: "Leads", icon: "target" },
    { href: "/app/reports", label: "Reports", icon: "barChart" },
  ],
  CREATOR: [
    { href: "/creator", label: "Overview", icon: "home" },
    { href: "/creator/deals", label: "Deals", icon: "inbox" },
    { href: "/creator/profile", label: "Media kit", icon: "user" },
    { href: "/creator/earnings", label: "Earnings", icon: "wallet" },
  ],
  AGENCY: [
    { href: "/agency", label: "Portfolio", icon: "layers" },
    { href: "/agency/clients", label: "Client workspaces", icon: "building" },
    { href: "/agency/roster", label: "Creator roster", icon: "users" },
  ],
};
