import { cn } from "@/lib/utils";

/** Slim horizontal bar for audience breakdowns and pipeline fill. */
export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number; // 0..100
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-brand transition-all", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
