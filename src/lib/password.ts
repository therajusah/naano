import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/constants";

// Adaptive, salted password hashing only (OWASP-AUTH-001). bcrypt salts
// internally, so no separate salt storage is needed.

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
