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
import { CreatorOnboardingForm } from "@/components/auth/onboarding-form";

export default async function CreatorOnboardingPage() {
  const user = await requireAuth();
  if (user.role !== "CREATOR" && user.role !== "ADMIN") {
    redirect(roleHome(user.role));
  }

  const existing = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/creator");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Finish setting up</CardTitle>
        <CardDescription>
          Add your display name and headline to complete your creator profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreatorOnboardingForm />
      </CardContent>
    </Card>
  );
}
