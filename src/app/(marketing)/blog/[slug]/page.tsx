import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { BLOG_POSTS, getPost } from "../posts";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <article>
        {/* Article header */}
        <header className="hero-clouds relative overflow-hidden text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] bg-dotgrid"
          />
          <Container className="relative pb-16 pt-28 sm:pt-32">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                <ArrowLeft className="size-4" />
                All articles
              </Link>
              <div className="mt-6">
                <Badge variant="accent" className="bg-white/15 text-white">
                  {post.tag}
                </Badge>
              </div>
              <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <div className="mt-6 flex items-center gap-3">
                <Avatar
                  name={post.author.name}
                  className="bg-white/15 ring-1 ring-white/25"
                />
                <div className="text-sm">
                  <div className="font-semibold">{post.author.name}</div>
                  <div className="text-white/60">
                    {post.author.role} · {formatDate(post.date)} ·{" "}
                    {post.readingMinutes} min read
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </header>

        {/* Article body */}
        <div className="bg-white py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl">
              <p className="text-pretty text-xl font-medium leading-relaxed text-foreground">
                {post.excerpt}
              </p>
              <div className="mt-8 space-y-6">
                {post.body.map((block, i) => {
                  if (block.type === "heading") {
                    return (
                      <h2
                        key={i}
                        className="pt-2 text-2xl font-bold tracking-tight text-foreground"
                      >
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.type === "list") {
                    return (
                      <ul key={i} className="space-y-2.5 pl-1">
                        {block.items.map((item, j) => (
                          <li key={j} className="flex gap-3 text-muted-foreground">
                            <span
                              aria-hidden
                              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                            />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p
                      key={i}
                      className="text-base leading-relaxed text-muted-foreground"
                    >
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </div>
          </Container>
        </div>
      </article>

      <CtaBand
        title="Put this into practice"
        subtitle="Launch a measurable B2B creator campaign on Naano."
        actions={
          <>
            <ButtonLink href="/register?role=company" variant="white" size="lg">
              Launch a campaign
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink
              href="/blog"
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10"
            >
              Read more articles
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
