import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export type ValueProp = {
  title: string;
  description: string;
  icon?: ReactNode;
  /** Optional extra content (chips, sub-list) rendered inside the card. */
  footer?: ReactNode;
};

type ValuePropsProps = {
  eyebrow?: string;
  heading?: ReactNode;
  subheading?: ReactNode;
  items: ValueProp[];
  columns?: 2 | 3;
  /** `muted` gives a light-gray section background. */
  background?: "white" | "muted";
  className?: string;
};

/** A grid of icon + title + description feature cards. */
export function ValueProps({
  eyebrow,
  heading,
  subheading,
  items,
  columns = 3,
  background = "white",
  className,
}: ValuePropsProps) {
  return (
    <section
      className={cn(
        "py-20 sm:py-24",
        background === "muted" ? "bg-muted/30" : "bg-white",
        className,
      )}
    >
      <Container>
        {(heading || eyebrow || subheading) && (
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            subtitle={subheading}
            className="mx-auto mb-14"
          />
        )}
        <div
          className={cn(
            "grid gap-6",
            columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {item.icon && (
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand-700">
                  {item.icon}
                </span>
              )}
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              {item.footer && <div className="mt-4">{item.footer}</div>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
