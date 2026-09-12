import { cn } from "@/lib/utils";

function toneFor(score: number): { ring: string; text: string } {
  if (score >= 85) return { ring: "text-accent", text: "text-accent-600" };
  if (score >= 70) return { ring: "text-brand", text: "text-brand-700" };
  return { ring: "text-warning", text: "text-warning" };
}

/** Circular audience-fit gauge (0..100), Naano's headline match metric. */
export function FitScoreRing({
  score,
  size = 56,
  label = "fit",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone = toneFor(clamped);
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      title={`${clamped}% audience ${label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all", tone.ring)}
        />
      </svg>
      <span className={cn("absolute text-xs font-bold", tone.text)}>{clamped}</span>
    </span>
  );
}
