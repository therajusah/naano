import { PrismaClient } from "@prisma/client";

// Single PrismaClient across hot reloads in dev — avoids exhausting the
// connection pool by creating a new client on every module reload
// (BP-RESOURCE-001: reuse pooled connections, never one-per-request).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
