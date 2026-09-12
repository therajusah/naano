import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export type FaqItem = { question: string; answer: string };

type FaqProps = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  items: FaqItem[];
  className?: string;
};

/**
 * Accordion FAQ built on native <details>/<summary> so it works without
 * client JS (progressive enhancement, accessible by default).
 */
export function Faq({
  eyebrow = "FAQ",
  heading = "Frequently asked questions",
  subheading,
  items,
  className,
}: FaqProps) {
  return (
    <section className={`bg-muted/30 py-20 sm:py-24 ${className ?? ""}`}>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          subtitle={subheading}
          className="mx-auto mb-12"
        />
        <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
          {items.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-foreground transition-colors hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
