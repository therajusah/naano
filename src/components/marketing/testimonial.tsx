import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Avatar } from "@/components/ui/avatar";

type CaseStat = { value: string; label: string };

type TestimonialProps = {
  eyebrow?: string;
  heading?: ReactNode;
  quote: string;
  authorName: string;
  authorRole: string;
  /** Optional mini case-study stats shown alongside the quote. */
  caseStats?: CaseStat[];
  caseLabel?: ReactNode;
};

/** Featured customer quote with an optional mini case-study stat block. */
export function Testimonial({
  eyebrow,
  heading,
  quote,
  authorName,
  authorRole,
  caseStats,
  caseLabel,
}: TestimonialProps) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        {(heading || eyebrow) && (
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            className="mx-auto mb-14"
          />
        )}
        <div className="mx-auto grid max-w-5xl items-stretch gap-6 lg:grid-cols-5">
          {/* Quote card */}
          <figure className="relative flex flex-col justify-between rounded-3xl bg-navy p-8 text-white shadow-sm sm:p-10 lg:col-span-3">
            <span
              aria-hidden
              className="text-6xl font-serif leading-none text-white/20"
            >
              &ldquo;
            </span>
            <blockquote className="-mt-4 text-pretty text-xl font-medium leading-snug sm:text-2xl">
              {quote}
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3">
              <Avatar name={authorName} className="bg-white/15 ring-1 ring-white/25" />
              <div>
                <div className="font-semibold">{authorName}</div>
                <div className="text-sm text-white/60">{authorRole}</div>
              </div>
            </figcaption>
          </figure>

          {/* Case-study stat block */}
          {caseStats && caseStats.length > 0 && (
            <div className="flex flex-col rounded-3xl border border-border bg-muted/30 p-8 lg:col-span-2">
              {caseLabel && (
                <p className="text-xs font-semibold uppercase tracking-widest text-brand">
                  {caseLabel}
                </p>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-6">
                {caseStats.map((stat) => (
                  <div key={stat.label}>
                    <dd className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                      {stat.value}
                    </dd>
                    <dt className="mt-1 text-sm text-muted-foreground">
                      {stat.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
