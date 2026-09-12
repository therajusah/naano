import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string | null;
};

/** The landing route for each role after login. */
export function roleHome(role: UserRole): string {
  switch (role) {
    case "CREATOR":
      return "/creator";
    case "AGENCY":
      return "/agency";
    case "COMPANY":
    case "ADMIN":
    default:
      return "/app";
  }
}

/** Session user or null. Use in API routes (which return 401/404, not redirect). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** Redirects to /login if unauthenticated. For use in Server Components/pages. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Enforces role membership (default-deny, OWASP-ACLFUNC-001). Unauthenticated
 * users go to /login; authenticated users lacking the role are sent to their
 * own home rather than shown a forbidden page.
 */
export async function requireRole(
  role: UserRole | UserRole[],
): Promise<SessionUser> {
  const user = await requireAuth();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) {
    redirect(roleHome(user.role));
  }
  return user;
}

/** Company user + their profile, or redirect. */
export async function requireCompany() {
  const user = await requireRole(["COMPANY", "ADMIN"]);
  const company = await prisma.companyProfile.findUnique({
    where: { userId: user.id },
  });
  if (!company) redirect("/onboarding/company");
  return { user, company };
}

/** Creator user + their profile, or redirect. */
export async function requireCreator() {
  const user = await requireRole(["CREATOR", "ADMIN"]);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
  });
  if (!creator) redirect("/onboarding/creator");
  return { user, creator };
}

/** Agency user + their profile, or redirect. */
export async function requireAgency() {
  const user = await requireRole(["AGENCY", "ADMIN"]);
  const agency = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    include: { clientWorkspaces: true },
  });
  if (!agency) redirect("/onboarding/agency");
  return { user, agency };
}
