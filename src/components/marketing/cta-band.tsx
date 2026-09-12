import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

type CtaBandProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** CTA buttons/links. */
  actions: ReactNode;
};

/** Full-width navy call-to-action band used at the bottom of marketing pages. */
export function CtaBand({ title, subtitle, actions }: CtaBandProps) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div className="hero-clouds relative overflow-hidden rounded-3xl px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] bg-dotgrid"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-4 text-pretty text-lg text-white/70">{subtitle}</p>
            )}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              {actions}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
