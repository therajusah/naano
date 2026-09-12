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
import { CompanyOnboardingForm } from "@/components/auth/onboarding-form";

export default async function CompanyOnboardingPage() {
  const user = await requireAuth();
  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    redirect(roleHome(user.role));
  }

  // If a profile already exists, there's nothing to complete.
  const existing = await prisma.companyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/app");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Finish setting up</CardTitle>
        <CardDescription>
          Tell us your company name to complete your brand profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CompanyOnboardingForm />
      </CardContent>
    </Card>
  );
}
