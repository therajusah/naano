import Image from "next/image";
import { cn, initials } from "@/lib/utils";

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

/** Circular avatar with a deterministic initials fallback. */
export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy text-white font-semibold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
