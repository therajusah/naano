"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { registerUser, type RegisterState } from "@/app/actions/register";

export type RegisterRole = "COMPANY" | "CREATOR" | "AGENCY";

const initialState: RegisterState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function RegisterForm({ role }: { role: RegisterRole }) {
  const [state, formAction] = useActionState(registerUser, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="role" value={role} />

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      {/* Role-specific fields */}
      {role === "COMPANY" ? (
        <Field label="Company name" htmlFor="companyName" required>
          <Input
            id="companyName"
            name="companyName"
            autoComplete="organization"
            placeholder="Acme Inc."
            required
          />
        </Field>
      ) : null}

      {role === "CREATOR" ? (
        <>
          <Field label="Display name" htmlFor="displayName" required>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Jordan Rivera"
              required
            />
          </Field>
          <Field
            label="Headline"
            htmlFor="headline"
            hint="A short line buyers see first, e.g. 'B2B SaaS growth, in public'"
            required
          >
            <Input
              id="headline"
              name="headline"
              placeholder="B2B SaaS growth, in public"
              required
            />
          </Field>
        </>
      ) : null}

      {role === "AGENCY" ? (
        <>
          <Field label="Agency name" htmlFor="agencyName" required>
            <Input
              id="agencyName"
              name="agencyName"
              autoComplete="organization"
              placeholder="Northwind Agency"
              required
            />
          </Field>
          <Field label="Agency type" htmlFor="agencyType" required>
            <Select id="agencyType" name="agencyType" defaultValue="BRAND_AGENCY" required>
              <option value="BRAND_AGENCY">Brand agency (works with companies)</option>
              <option value="CREATOR_AGENCY">Creator agency (manages creators)</option>
            </Select>
          </Field>
        </>
      ) : null}

      {/* Shared fields */}
      <Field label="Your name" htmlFor="name" required>
        <Input id="name" name="name" autoComplete="name" placeholder="Jane Doe" required />
      </Field>

      <Field label="Work email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        hint="At least 8 characters"
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
