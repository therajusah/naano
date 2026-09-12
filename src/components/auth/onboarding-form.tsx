"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  completeCompanyOnboarding,
  completeCreatorOnboarding,
  completeAgencyOnboarding,
  type OnboardingState,
} from "@/app/actions/onboarding";

const initialState: OnboardingState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Finish setup"}
    </Button>
  );
}

function ErrorBanner({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2 text-sm text-danger"
    >
      {error}
    </p>
  );
}

export function CompanyOnboardingForm() {
  const [state, formAction] = useActionState(completeCompanyOnboarding, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <ErrorBanner error={state.error} />
      <Field label="Company name" htmlFor="companyName" required>
        <Input id="companyName" name="companyName" placeholder="Acme Inc." required />
      </Field>
      <SubmitButton />
    </form>
  );
}

export function CreatorOnboardingForm() {
  const [state, formAction] = useActionState(completeCreatorOnboarding, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <ErrorBanner error={state.error} />
      <Field label="Display name" htmlFor="displayName" required>
        <Input id="displayName" name="displayName" placeholder="Jordan Rivera" required />
      </Field>
      <Field label="Headline" htmlFor="headline" required>
        <Input
          id="headline"
          name="headline"
          placeholder="B2B SaaS growth, in public"
          required
        />
      </Field>
      <SubmitButton />
    </form>
  );
}

export function AgencyOnboardingForm() {
  const [state, formAction] = useActionState(completeAgencyOnboarding, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <ErrorBanner error={state.error} />
      <Field label="Agency name" htmlFor="agencyName" required>
        <Input id="agencyName" name="agencyName" placeholder="Northwind Agency" required />
      </Field>
      <Field label="Agency type" htmlFor="agencyType" required>
        <Select id="agencyType" name="agencyType" defaultValue="BRAND_AGENCY" required>
          <option value="BRAND_AGENCY">Brand agency (works with companies)</option>
          <option value="CREATOR_AGENCY">Creator agency (manages creators)</option>
        </Select>
      </Field>
      <SubmitButton />
    </form>
  );
}
