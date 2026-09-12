import { Container } from "@/components/ui/container";

type Stat = { value: string; label: string };

type StatStripProps = {
  stats: Stat[];
  /** `dark` for navy sections; `light` for white sections. */
  tone?: "dark" | "light";
  className?: string;
};

/** Horizontal band of headline metrics (impressions, leads, creators, match). */
export function StatStrip({ stats, tone = "light", className }: StatStripProps) {
  const dark = tone === "dark";
  return (
    <section
      className={
        dark
          ? `bg-navy py-16 text-white ${className ?? ""}`
          : `bg-white py-16 ${className ?? ""}`
      }
    >
      <Container>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2">
              <dt
                className={
                  dark
                    ? "order-2 text-sm font-medium text-white/60"
                    : "order-2 text-sm font-medium text-muted-foreground"
                }
              >
                {stat.label}
              </dt>
              <dd className="order-1 text-4xl font-extrabold tracking-tight sm:text-5xl">
                <span className={dark ? "text-white" : "text-gradient"}>
                  {stat.value}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
