"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const NAV_LINKS = [
  { href: "/for-companies", label: "For companies" },
  { href: "/for-creators", label: "For creators" },
  { href: "/for-agencies", label: "For agencies" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/free-tools", label: "Free tools" },
];

export function SiteNav({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const onDark = transparent;

  return (
    <header
      className={cn(
        "top-0 z-50 w-full",
        transparent
          ? "absolute bg-transparent"
          : "sticky border-b border-border bg-white/85 backdrop-blur",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Logo variant={onDark ? "light" : "dark"} />

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                onDark
                  ? "text-white/80 hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink
            href="/login"
            variant={onDark ? "ghost" : "ghost"}
            size="sm"
            className={onDark ? "text-white hover:bg-white/10" : ""}
          >
            Sign in
          </ButtonLink>
          <ButtonLink href="/register" variant={onDark ? "white" : "default"} size="sm">
            Sign up
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-lg lg:hidden",
            onDark ? "text-white" : "text-foreground",
          )}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <ButtonLink href="/login" variant="outline" onClick={() => setOpen(false)}>
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" onClick={() => setOpen(false)}>
                Sign up
              </ButtonLink>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
