import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { logger } from "@/lib/logger";
import {
  ACCOUNT_LOCKOUT_DURATION_MS,
  MAX_FAILED_LOGIN_ATTEMPTS_BEFORE_LOCKOUT,
} from "@/lib/constants";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image: string | null;
};

/**
 * Verify credentials with brute-force protection (OWASP-AUTH-001 / RATELIMIT-001).
 * Returns a safe user object on success, or null on any failure. Failure is
 * intentionally indistinguishable to the caller to avoid user enumeration.
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    logger.warn("auth.login.failed", { email: normalizedEmail, reason: "no_such_user" });
    return null;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    logger.warn("auth.login.blocked", { userId: user.id, reason: "account_locked" });
    return null;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    await registerFailedAttempt(user.id, user.failedLoginAttempts);
    logger.warn("auth.login.failed", { userId: user.id, reason: "bad_password" });
    return null;
  }

  await resetLoginState(user.id);
  logger.info("auth.login.success", { userId: user.id, role: user.role });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  };
}

async function registerFailedAttempt(userId: string, currentAttempts: number): Promise<void> {
  const nextAttempts = currentAttempts + 1;
  const shouldLock = nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS_BEFORE_LOCKOUT;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: nextAttempts,
      lockedUntil: shouldLock
        ? new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION_MS)
        : null,
    },
  });
  if (shouldLock) {
    logger.warn("auth.account.locked", { userId, attempts: nextAttempts });
  }
}

async function resetLoginState(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}
