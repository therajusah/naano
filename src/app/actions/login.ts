"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { signIn } from "@/auth";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export type LoginState = {
  error?: string;
};

// Rate-limit config (OWASP-RATELIMIT-001) — enforced on IP + email.
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Generic message for every failure to avoid user enumeration (OWASP-AUTH-001).
const GENERIC_ERROR = "Invalid email or password";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Credentials sign-in. Validates input (BP-INPUTVAL-001), rate-limits by IP and
 * email (OWASP-RATELIMIT-001), and returns a single generic error on any
 * failure so attackers cannot distinguish "no such user" from "bad password"
 * (OWASP-AUTH-001). On success, redirects to /app — the /app layout forwards
 * non-company roles to their own dashboard via requireRole.
 */
export async function loginUser(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const ipLimit = checkRateLimit(`login:ip:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  const emailLimit = checkRateLimit(
    `login:email:${email}`,
    LOGIN_MAX_ATTEMPTS,
    LOGIN_WINDOW_MS,
  );
  if (!ipLimit.allowed || !emailLimit.allowed) {
    logger.warn("auth.login.rate_limited", { ip });
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    // next-auth may internally throw a redirect — re-throw it untouched.
    if (isRedirectError(error)) throw error;
    // Any authentication failure (bad creds, locked account, etc.) collapses to
    // one generic message. Detail is already logged inside authenticateUser.
    logger.warn("auth.login.rejected", { email });
    return { error: GENERIC_ERROR };
  }

  redirect("/app");
}
