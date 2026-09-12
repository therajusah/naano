"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Megaphone,
  Target,
  BarChart3,
  Inbox,
  User,
  Wallet,
  Layers,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/app/nav-items";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  search: Search,
  megaphone: Megaphone,
  target: Target,
  barChart: BarChart3,
  inbox: Inbox,
  user: User,
  wallet: Wallet,
  layers: Layers,
  building: Building2,
  users: Users,
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? Home;
        // Exact match for index routes; prefix match for nested sections.
        const isActive =
          pathname === item.href ||
          (item.href !== "/app" &&
            item.href !== "/creator" &&
            item.href !== "/agency" &&
            pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-ink text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
