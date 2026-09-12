import Link from "next/link";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/constants";

const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [
      { href: "/for-companies", label: "For companies" },
      { href: "/for-creators", label: "For creators" },
      { href: "/for-agencies", label: "For agencies" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/linkedin-creator-marketplace", label: "Creator marketplace" },
      { href: "/free-tools", label: "Free tools" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/register?role=company", label: "Launch a campaign" },
      { href: "/register?role=creator", label: "Become a creator" },
      { href: "/login", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">{SITE.tagline}.</p>
          </div>
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Naano clone — built as an engineering assignment.</p>
          <p>Not affiliated with Naano. Reference-built for demonstration.</p>
        </div>
      </Container>
    </footer>
  );
}
