"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { loginUser, type LoginState } from "@/app/actions/login";

// Seeded demo accounts (all share the local-dev seed password). These are
// convenience shortcuts for reviewers; the credentials are not secrets — they
// belong to throwaway seeded accounts in the local database only.
const DEMO_PASSWORD = "password123";
const DEMO_ACCOUNTS = [
  { label: "Company", email: "company@naano.test" },
  { label: "Creator", email: "creator@naano.test" },
  { label: "Brand agency", email: "agency@naano.test" },
  { label: "Creator agency", email: "talent@naano.test" },
] as const;

const initialState: LoginState = {};

function DemoButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      className="w-full justify-center"
      disabled={pending}
    >
      {pending ? "…" : label}
    </Button>
  );
}

export function DemoAccounts() {
  const [state, formAction] = useActionState(loginUser, initialState);

  return (
    <div className="mt-6 border-t border-border pt-6">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Demo accounts
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        One-click sign-in for reviewers
      </p>
      {state.error ? (
        <p role="alert" className="mt-3 text-center text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <form key={account.email} action={formAction}>
            <input type="hidden" name="email" value={account.email} />
            <input type="hidden" name="password" value={DEMO_PASSWORD} />
            <DemoButton label={account.label} />
          </form>
        ))}
      </div>
    </div>
  );
}
