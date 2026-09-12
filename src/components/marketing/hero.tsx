import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

type HeroProps = {
  /** Small pill badge above the headline. */
  badge?: ReactNode;
  /** Main headline. Use a highlighted `<span className="text-gradient">` for emphasis. */
  title: ReactNode;
  subtitle?: ReactNode;
  /** CTA buttons / links, rendered in a responsive row. */
  actions?: ReactNode;
  /** Small line of text below the CTAs (e.g. "Trusted by modern B2B teams"). */
  footnote?: ReactNode;
  /** Extra content rendered below the copy block (e.g. a preview card). */
  children?: ReactNode;
  /** `dark` = navy hero with light text (uses `.hero-clouds`). `light` = airy white. */
  tone?: "dark" | "light";
  /** Center or left-align the copy. */
  align?: "center" | "left";
};

/** Reusable marketing hero. On the navy tone it renders the `.hero-clouds` backdrop. */
export function Hero({
  badge,
  title,
  subtitle,
  actions,
  footnote,
  children,
  tone = "dark",
  align = "center",
}: HeroProps) {
  const dark = tone === "dark";
  const centered = align === "center";

  return (
    <section
      className={
        dark
          ? "hero-clouds relative overflow-hidden text-white"
          : "relative overflow-hidden bg-white text-foreground"
      }
    >
      {/* subtle grain/dot texture layer for depth */}
      <div
        aria-hidden
        className={
          dark
            ? "pointer-events-none absolute inset-0 opacity-[0.06] bg-dotgrid"
            : "pointer-events-none absolute inset-0 opacity-40 bg-dotgrid [mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent)]"
        }
      />
      <Container className="relative pb-20 pt-28 sm:pb-24 sm:pt-36">
        <div
          className={
            centered
              ? "mx-auto flex max-w-3xl flex-col items-center text-center"
              : "flex max-w-3xl flex-col items-start text-left"
          }
        >
          {badge && (
            <div
              className={
                dark
                  ? "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur"
                  : "inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
              }
            >
              {badge}
            </div>
          )}

          <h1
            className={
              "mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            }
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className={
                dark
                  ? "mt-6 max-w-2xl text-pretty text-lg text-white/70 sm:text-xl"
                  : "mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl"
              }
            >
              {subtitle}
            </p>
          )}

          {actions && (
            <div
              className={
                centered
                  ? "mt-9 flex flex-col items-center gap-3 sm:flex-row"
                  : "mt-9 flex flex-col gap-3 sm:flex-row"
              }
            >
              {actions}
            </div>
          )}

          {footnote && (
            <p
              className={
                dark
                  ? "mt-6 text-sm text-white/50"
                  : "mt-6 text-sm text-muted-foreground"
              }
            >
              {footnote}
            </p>
          )}
        </div>

        {children && <div className="mt-16">{children}</div>}
      </Container>
    </section>
  );
}
