import { z } from "zod";

// Validate configuration at startup and fail loudly on missing/invalid values
// (BP-CONFIG-001, OWASP-SECRETS-001). Never fall back to a hardcoded secret.
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid Postgres connection string"),
  AUTH_SECRET: z
    .string()
    .min(16, "AUTH_SECRET must be at least 16 characters — generate with `openssl rand -base64 32`"),
  AUTH_URL: z.string().url().default("http://localhost:3000"),
  // Optional at boot: the app runs without it, but the AI brief route checks
  // for it at the request boundary and returns a clear error if absent.
  // An empty string (common in a copied .env) is treated as "unset".
  OPENAI_API_KEY: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
  OPENAI_BRIEF_MODEL: z.string().min(1).default("gpt-4o-mini"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Fix your .env.local:\n${issues}`,
    );
  }
  return parsed.data;
}

export const env = loadEnv();

export type AppEnv = z.infer<typeof envSchema>;
