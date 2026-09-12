import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { BLOG_POSTS } from "./posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Playbooks, benchmarks and comparisons for running B2B LinkedIn creator campaigns that generate measurable pipeline.",
};

export default function BlogIndexPage() {
  return (
    <>
      <Hero
        tone="dark"
        badge="Blog"
        title={
          <>
            Playbooks for B2B{" "}
            <span className="text-gradient">creator marketing.</span>
          </>
        }
        subtitle="Practical guides, honest benchmarks and comparisons to help you run LinkedIn creator campaigns that your finance team can measure."
      />

      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                {/* Decorative header block (no external images) */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="hero-clouds relative flex aspect-[16/9] items-end p-5"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-10 bg-dotgrid"
                  />
                  <span className="relative">
                    <Badge variant="accent" className="bg-white/15 text-white">
                      {post.tag}
                    </Badge>
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span aria-hidden>·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-foreground">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition-colors group-hover:text-brand"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
                  >
                    Read article
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand
        title="Ready to put the playbook to work?"
        subtitle="Launch your first B2B creator campaign on Naano."
        actions={
          <ButtonLink href="/register?role=company" variant="white" size="lg">
            Launch a campaign
            <ArrowRight className="size-4" />
          </ButtonLink>
        }
      />
    </>
  );
}
