import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
          <Logo />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
