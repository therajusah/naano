import { handlers } from "@/auth";

// Auth.js route handler (Node runtime — the credentials authorize() uses
// Prisma + bcrypt which are not Edge-compatible).
export const { GET, POST } = handlers;
