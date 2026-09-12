import { Container } from "@/components/ui/container";

const DEFAULT_LOGOS = [
  "lemlist",
  "La Growth Machine",
  "gojiberry",
  "Attio",
  "Pennylane",
  "Aircall",
  "Spendesk",
  "Qonto",
];

type LogoCloudProps = {
  label?: string;
  logos?: string[];
  /** `dark` renders muted white text over a navy hero; `light` for white sections. */
  tone?: "dark" | "light";
};

/**
 * A row of "trusted by" brand wordmarks rendered as styled text (no real
 * trademarks/assets). Used on the homepage below the hero.
 */
export function LogoCloud({
  label = "Trusted by modern B2B teams",
  logos = DEFAULT_LOGOS,
  tone = "light",
}: LogoCloudProps) {
  const dark = tone === "dark";
  return (
    <section className={dark ? "" : "border-y border-border bg-muted/30 py-12"}>
      <Container>
        {label && (
          <p
            className={
              dark
                ? "text-center text-xs font-semibold uppercase tracking-widest text-white/50"
                : "text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            }
          >
            {label}
          </p>
        )}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {logos.map((logo) => (
            <span
              key={logo}
              className={
                dark
                  ? "text-lg font-bold tracking-tight text-white/70 transition-colors hover:text-white"
                  : "text-lg font-bold tracking-tight text-foreground/45 transition-colors hover:text-foreground/80"
              }
            >
              {logo}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
