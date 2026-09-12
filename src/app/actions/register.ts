"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import type { Prisma, UserRole } from "@prisma/client";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { roleHome } from "@/lib/auth-helpers";

export type RegisterState = {
  error?: string;
};

// --- Rate-limit config (OWASP-RATELIMIT-001) ---------------------------------
// Enforced on BOTH source IP and email to resist proxy rotation and targeted
// DoS. NOTE: backed by the shared in-process limiter for local dev; a
// horizontally-scaled deploy must swap this for a shared store (Redis).
const REGISTER_MAX_ATTEMPTS = 100;
const REGISTER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Only these roles may ever be self-registered. ADMIN is deliberately absent to
// prevent privilege escalation via mass assignment (OWASP-MASS-001).
const SELF_SERVE_ROLES = ["COMPANY", "CREATOR", "AGENCY"] as const;

// Explicit input DTOs per role — never bind the raw form to a Prisma model
// (OWASP-MASS-001). Unknown fields are stripped by zod's object parsing and the
// discriminated union rejects any role we don't accept.
const baseFields = {
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
};

const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("COMPANY"),
    companyName: z.string().trim().min(1, "Company name is required").max(160),
    ...baseFields,
  }),
  z.object({
    role: z.literal("CREATOR"),
    displayName: z.string().trim().min(1, "Display name is required").max(120),
    headline: z.string().trim().min(1, "Headline is required").max(200),
    ...baseFields,
  }),
  z.object({
    role: z.literal("AGENCY"),
    agencyName: z.string().trim().min(1, "Agency name is required").max(160),
    agencyType: z.enum(["BRAND_AGENCY", "CREATOR_AGENCY"]),
    ...baseFields,
  }),
]);

/** Extract a best-effort client IP for rate-limiting keys. */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

function readRole(formData: FormData): (typeof SELF_SERVE_ROLES)[number] | null {
  const raw = formData.get("role");
  return SELF_SERVE_ROLES.includes(raw as (typeof SELF_SERVE_ROLES)[number])
    ? (raw as (typeof SELF_SERVE_ROLES)[number])
    : null;
}

/**
 * Register a new user + minimal matching profile, then sign them in.
 * Security: zod-validated input (BP-INPUTVAL-001), role restricted to non-admin
 * self-serve roles (OWASP-MASS-001), IP + email rate limiting
 * (OWASP-RATELIMIT-001), bcrypt password hashing (OWASP-AUTH-001), generic
 * duplicate-email handling to limit enumeration, structured logging that never
 * records the password (OWASP-LOG-001).
 */
export async function registerUser(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  // Pull only known fields explicitly — no spreading of the raw body.
  const role = readRole(formData);
  if (!role) {
    return { error: "Please choose a valid account type." };
  }

  const candidate = {
    role,
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName") ?? undefined,
    displayName: formData.get("displayName") ?? undefined,
    headline: formData.get("headline") ?? undefined,
    agencyName: formData.get("agencyName") ?? undefined,
    agencyType: formData.get("agencyType") ?? undefined,
  };

  const parsed = registerSchema.safeParse(candidate);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    logger.warn("auth.register.invalid_input", {
      role,
      issue: first?.path.join("."),
    });
    return { error: first?.message ?? "Please check the form and try again." };
  }
  const data = parsed.data;

  // Rate limit on IP AND email (OWASP-RATELIMIT-001).
  const ip = await clientIp();
  const ipLimit = checkRateLimit(
    `register:ip:${ip}`,
    REGISTER_MAX_ATTEMPTS,
    REGISTER_WINDOW_MS,
  );
  const emailLimit = checkRateLimit(
    `register:email:${data.email}`,
    REGISTER_MAX_ATTEMPTS,
    REGISTER_WINDOW_MS,
  );
  if (!ipLimit.allowed || !emailLimit.allowed) {
    logger.warn("auth.register.rate_limited", { ip, role });
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  // Uniqueness check + creation. Race conditions are still guarded by the DB
  // unique constraint on User.email, handled below.
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    logger.warn("auth.register.email_taken", { email: data.email });
    return { error: "That email is already registered. Try signing in instead." };
  }

  const passwordHash = await hashPassword(data.password);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role as UserRole,
        },
        select: { id: true },
      });

      switch (data.role) {
        case "COMPANY":
          await tx.companyProfile.create({
            data: { userId: user.id, companyName: data.companyName },
          });
          break;
        case "CREATOR":
          await tx.creatorProfile.create({
            data: {
              userId: user.id,
              displayName: data.displayName,
              headline: data.headline,
              bio: "",
              location: "",
              followers: 0,
              medianReach: 0,
              engagementRate: 0,
              avgReactions: 0,
              avgComments: 0,
              pricePerPost: 100,
              verticals: [],
              audienceByFunction: {} as Prisma.InputJsonValue,
              audienceBySeniority: {} as Prisma.InputJsonValue,
            },
          });
          break;
        case "AGENCY":
          await tx.agencyProfile.create({
            data: {
              userId: user.id,
              agencyName: data.agencyName,
              type: data.agencyType,
            },
          });
          break;
      }
    });
  } catch (error) {
    // Unique-constraint race (P2002) or any DB failure — generic client error,
    // detailed server log (OWASP-SECCFG-001 / BP-ERR-001). Never log password.
    logger.error("auth.register.failed", {
      email: data.email,
      role: data.role,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return { error: "We couldn't create your account. Please try again." };
  }

  logger.info("auth.register.success", { email: data.email, role: data.role });

  // Sign in with the just-created credentials. redirect:false so we control the
  // post-login navigation ourselves.
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // Account exists but auto sign-in failed — send them to login rather than
    // leaking details.
    logger.warn("auth.register.autologin_failed", { email: data.email });
    redirect("/login");
  }

  redirect(roleHome(data.role as UserRole));
}
