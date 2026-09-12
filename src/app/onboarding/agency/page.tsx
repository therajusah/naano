import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth, roleHome } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AgencyOnboardingForm } from "@/components/auth/onboarding-form";

export default async function AgencyOnboardingPage() {
  const user = await requireAuth();
  if (user.role !== "AGENCY" && user.role !== "ADMIN") {
    redirect(roleHome(user.role));
  }

  const existing = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/agency");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Finish setting up</CardTitle>
        <CardDescription>
          Tell us about your agency to complete your profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AgencyOnboardingForm />
      </CardContent>
    </Card>
  );
}
