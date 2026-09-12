import Link from "next/link";
import { cn } from "@/lib/utils";

/** Original Naano-style wordmark: an orbiting comet mark + lowercase wordmark. */
export function Logo({
  className,
  href = "/",
  variant = "dark",
}: {
  className?: string;
  href?: string;
  variant?: "dark" | "light";
}) {
  const textColor = variant === "light" ? "text-white" : "text-ink";
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className={cn("text-xl font-extrabold tracking-tight", textColor)}>
        naano
      </span>
    </Link>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id="naano-comet" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b6ef6" />
          <stop offset="1" stopColor="#16c98d" />
        </linearGradient>
      </defs>
      <path
        d="M6 22c4-10 12-16 20-18-6 6-9 12-11 18"
        stroke="url(#naano-comet)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <circle cx="9" cy="23" r="5" fill="url(#naano-comet)" />
    </svg>
  );
}
