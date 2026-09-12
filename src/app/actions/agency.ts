"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAgency } from "@/lib/auth-helpers";
import { MIN_POST_PRICE, MAX_POST_PRICE, VERTICALS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Action result contract (BP-ERR-001 — explicit success/failure, no throws to UI)
// ---------------------------------------------------------------------------

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export type ImportResult =
  | { ok: true; created: number; skipped: number; message: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Domain limits (BP-CONST-001 — named constants, no inline literals)
// ---------------------------------------------------------------------------

const CLIENT_NAME_MAX_LEN = 120;
const CREATOR_NAME_MAX_LEN = 120;
const HEADLINE_MAX_LEN = 200;
const MIN_BUDGET = 0;
const MAX_BUDGET = 100_000_000; // €100M ceiling — guards against overflow/typo abuse
const MIN_FOLLOWERS = 0;
const MAX_FOLLOWERS = 500_000_000;
const MAX_VERTICALS_PER_CREATOR = 12;
const CSV_MAX_ROWS = 200; // hard cap on bulk import rows (matches assignment spec)
const CSV_MAX_INPUT_CHARS = 100_000;
const VERTICAL_SEPARATOR_PATTERN = /[|;/]/;

const AGENCY_PORTFOLIO_PATH = "/agency";
const AGENCY_CLIENTS_PATH = "/agency/clients";
const AGENCY_ROSTER_PATH = "/agency/roster";

const VALID_VERTICALS = new Set<string>(VERTICALS);

// ---------------------------------------------------------------------------
// Input schemas (OWASP-MASS-001 / BP-INPUTVAL-001 — explicit DTOs, strict shape)
// ---------------------------------------------------------------------------

const clientWorkspaceSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(1, "Client name is required")
    .max(CLIENT_NAME_MAX_LEN, `Client name must be ${CLIENT_NAME_MAX_LEN} characters or fewer`),
  budget: z
    .number()
    .int("Budget must be a whole number of euros")
    .min(MIN_BUDGET, "Budget cannot be negative")
    .max(MAX_BUDGET, "Budget exceeds the allowed maximum"),
});

const updateBudgetSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace id is required"),
  budget: z
    .number()
    .int("Budget must be a whole number of euros")
    .min(MIN_BUDGET, "Budget cannot be negative")
    .max(MAX_BUDGET, "Budget exceeds the allowed maximum"),
});

const managedCreatorSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Creator name is required")
    .max(CREATOR_NAME_MAX_LEN, `Name must be ${CREATOR_NAME_MAX_LEN} characters or fewer`),
  headline: z
    .string()
    .trim()
    .min(1, "Headline is required")
    .max(HEADLINE_MAX_LEN, `Headline must be ${HEADLINE_MAX_LEN} characters or fewer`),
  followers: z
    .number()
    .int("Followers must be a whole number")
    .min(MIN_FOLLOWERS, "Followers cannot be negative")
    .max(MAX_FOLLOWERS, "Followers exceeds the allowed maximum"),
  pricePerPost: z
    .number()
    .int("Price must be a whole number of euros")
    .min(MIN_POST_PRICE, `Price must be at least €${MIN_POST_PRICE}`)
    .max(MAX_POST_PRICE, `Price must be at most €${MAX_POST_PRICE}`),
  verticals: z.array(z.string().trim().min(1)).max(MAX_VERTICALS_PER_CREATOR).default([]),
});

const updateManagedCreatorSchema = z.object({
  creatorId: z.string().trim().min(1, "Creator id is required"),
  pricePerPost: z
    .number()
    .int("Price must be a whole number of euros")
    .min(MIN_POST_PRICE, `Price must be at least €${MIN_POST_PRICE}`)
    .max(MAX_POST_PRICE, `Price must be at most €${MAX_POST_PRICE}`),
  available: z.boolean(),
});

const csvImportSchema = z.object({
  csv: z
    .string()
    .min(1, "Paste CSV rows to import")
    .max(CSV_MAX_INPUT_CHARS, "CSV input is too large"),
});

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Server-side defaults for the required CreatorProfile fields that a managed
 * roster creator does not directly supply. Keeps DTOs explicit — we never spread
 * client input into a Prisma create (OWASP-MASS-001).
 */
function buildManagedCreatorDefaults() {
  return {
    bio: "",
    location: "",
    avatarUrl: null,
    medianReach: 0,
    engagementRate: 0,
    avgReactions: 0,
    avgComments: 0,
    currency: "EUR",
    available: true,
    audienceBySeniority: {},
    audienceByFunction: {},
    userId: null,
  } as const;
}

/** Keep only verticals from the known taxonomy; drops unknown/garbage entries. */
function sanitizeVerticals(candidates: string[]): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (VALID_VERTICALS.has(trimmed) && !seen.has(trimmed)) {
      seen.add(trimmed);
      kept.push(trimmed);
    }
  }
  return kept;
}

function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

// ---------------------------------------------------------------------------
// Brand-agency: client workspaces
// ---------------------------------------------------------------------------

/** Create a new client workspace owned by the current brand agency. */
export async function createClientWorkspace(
  clientName: string,
  budget: number,
): Promise<ActionResult> {
  const { agency } = await requireAgency();
  if (agency.type !== "BRAND_AGENCY") {
    return { ok: false, error: "Client workspaces are only available to brand agencies" };
  }

  const parsed = clientWorkspaceSchema.safeParse({ clientName, budget });
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  await prisma.agencyClientWorkspace.create({
    data: {
      agencyProfileId: agency.id,
      clientName: parsed.data.clientName,
      budget: parsed.data.budget,
    },
  });

  revalidatePath(AGENCY_CLIENTS_PATH);
  revalidatePath(AGENCY_PORTFOLIO_PATH);
  return { ok: true, message: "Client workspace created" };
}

/** Allocate/update a workspace's budget, verifying agency ownership first. */
export async function updateClientBudget(
  workspaceId: string,
  budget: number,
): Promise<ActionResult> {
  const { agency } = await requireAgency();
  if (agency.type !== "BRAND_AGENCY") {
    return { ok: false, error: "Client workspaces are only available to brand agencies" };
  }

  const parsed = updateBudgetSchema.safeParse({ workspaceId, budget });
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  // Ownership check at the data layer (OWASP-IDOR-001): scope to this agency.
  const workspace = await prisma.agencyClientWorkspace.findFirst({
    where: { id: parsed.data.workspaceId, agencyProfileId: agency.id },
    select: { id: true },
  });
  if (!workspace) {
    // 404-style: never confirm existence of a record the caller can't access.
    return { ok: false, error: "Workspace not found" };
  }

  await prisma.agencyClientWorkspace.update({
    where: { id: workspace.id },
    data: { budget: parsed.data.budget },
  });

  revalidatePath(AGENCY_CLIENTS_PATH);
  revalidatePath(AGENCY_PORTFOLIO_PATH);
  return { ok: true, message: "Budget updated" };
}

// ---------------------------------------------------------------------------
// Creator-agency: managed roster
// ---------------------------------------------------------------------------

/** Add a single managed creator to the current creator-agency's roster. */
export async function addManagedCreator(input: {
  displayName: string;
  headline: string;
  followers: number;
  pricePerPost: number;
  verticals: string[];
}): Promise<ActionResult> {
  const { agency } = await requireAgency();
  if (agency.type !== "CREATOR_AGENCY") {
    return { ok: false, error: "A roster is only available to creator agencies" };
  }

  const parsed = managedCreatorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  await prisma.creatorProfile.create({
    data: {
      ...buildManagedCreatorDefaults(),
      managedByAgencyId: agency.id,
      displayName: parsed.data.displayName,
      headline: parsed.data.headline,
      followers: parsed.data.followers,
      pricePerPost: parsed.data.pricePerPost,
      verticals: sanitizeVerticals(parsed.data.verticals),
    },
  });

  revalidatePath(AGENCY_ROSTER_PATH);
  revalidatePath(AGENCY_PORTFOLIO_PATH);
  return { ok: true, message: "Creator added to roster" };
}

/** Update a managed creator's rate/availability, verifying agency ownership. */
export async function updateManagedCreator(
  creatorId: string,
  fields: { pricePerPost: number; available: boolean },
): Promise<ActionResult> {
  const { agency } = await requireAgency();
  if (agency.type !== "CREATOR_AGENCY") {
    return { ok: false, error: "A roster is only available to creator agencies" };
  }

  const parsed = updateManagedCreatorSchema.safeParse({ creatorId, ...fields });
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  // Ownership check (OWASP-IDOR-001): only roster creators of THIS agency.
  const creator = await prisma.creatorProfile.findFirst({
    where: { id: parsed.data.creatorId, managedByAgencyId: agency.id },
    select: { id: true },
  });
  if (!creator) {
    return { ok: false, error: "Creator not found" };
  }

  await prisma.creatorProfile.update({
    where: { id: creator.id },
    data: {
      pricePerPost: parsed.data.pricePerPost,
      available: parsed.data.available,
    },
  });

  revalidatePath(AGENCY_ROSTER_PATH);
  revalidatePath(AGENCY_PORTFOLIO_PATH);
  return { ok: true, message: "Creator updated" };
}

// ---------------------------------------------------------------------------
// Bulk CSV import
// ---------------------------------------------------------------------------

type ParsedCsvRow = {
  displayName: string;
  headline: string;
  followers: number;
  pricePerPost: number;
  verticals: string[];
};

/**
 * Split a single CSV line into fields, honoring double-quoted fields that may
 * contain commas. Intentionally minimal — enough for pasted spreadsheet rows.
 */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let insideQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

/** Map header labels to their column index. Missing headers -> -1. */
function buildColumnIndex(headerFields: string[]) {
  const normalized = headerFields.map((field) => field.toLowerCase());
  return {
    name: normalized.findIndex((field) => field === "name" || field === "displayname"),
    headline: normalized.indexOf("headline"),
    followers: normalized.indexOf("followers"),
    pricePerPost: normalized.findIndex(
      (field) => field === "priceperpost" || field === "price",
    ),
    verticals: normalized.indexOf("verticals"),
  };
}

/** Parse a non-negative integer from a raw cell; NaN on invalid input. */
function parseIntegerCell(raw: string | undefined): number {
  if (raw === undefined) return Number.NaN;
  const cleaned = raw.replace(/[,\s€]/g, "");
  if (cleaned === "") return Number.NaN;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.trunc(value);
}

type ColumnIndex = ReturnType<typeof buildColumnIndex>;

/** Validate one already-split data row into a typed roster entry, or null. */
function parseCsvDataRow(fields: string[], columns: ColumnIndex): ParsedCsvRow | null {
  const displayName = columns.name >= 0 ? (fields[columns.name] ?? "").trim() : "";
  const headline = columns.headline >= 0 ? (fields[columns.headline] ?? "").trim() : "";
  const followers = parseIntegerCell(fields[columns.followers]);
  const pricePerPost = parseIntegerCell(fields[columns.pricePerPost]);
  const rawVerticals = columns.verticals >= 0 ? (fields[columns.verticals] ?? "") : "";
  const verticals = sanitizeVerticals(
    rawVerticals
      .split(VERTICAL_SEPARATOR_PATTERN)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

  const candidate = { displayName, headline, followers, pricePerPost, verticals };
  const parsed = managedCreatorSchema.safeParse(candidate);
  if (!parsed.success) return null;
  return {
    displayName: parsed.data.displayName,
    headline: parsed.data.headline,
    followers: parsed.data.followers,
    pricePerPost: parsed.data.pricePerPost,
    verticals: parsed.data.verticals,
  };
}

/** Parse pasted CSV into validated rows plus a skipped count (robust to junk). */
function parseRosterCsv(csv: string): { rows: ParsedCsvRow[]; skipped: number } {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return { rows: [], skipped: 0 };

  const columns = buildColumnIndex(splitCsvLine(lines[0]));
  const dataLines = lines.slice(1, 1 + CSV_MAX_ROWS);

  const rows: ParsedCsvRow[] = [];
  let skipped = 0;
  for (const line of dataLines) {
    const parsedRow = parseCsvDataRow(splitCsvLine(line), columns);
    if (parsedRow) {
      rows.push(parsedRow);
    } else {
      skipped += 1;
    }
  }
  return { rows, skipped };
}

/** Bulk-create managed creators from pasted CSV; returns a created/skipped summary. */
export async function importRosterCsv(csv: string): Promise<ImportResult> {
  const { agency } = await requireAgency();
  if (agency.type !== "CREATOR_AGENCY") {
    return { ok: false, error: "A roster is only available to creator agencies" };
  }

  const parsed = csvImportSchema.safeParse({ csv });
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const { rows, skipped } = parseRosterCsv(parsed.data.csv);
  if (rows.length === 0) {
    return {
      ok: false,
      error:
        "No valid rows found. Expected headers: name, headline, followers, pricePerPost, verticals",
    };
  }

  const defaults = buildManagedCreatorDefaults();
  await prisma.creatorProfile.createMany({
    data: rows.map((row) => ({
      ...defaults,
      managedByAgencyId: agency.id,
      displayName: row.displayName,
      headline: row.headline,
      followers: row.followers,
      pricePerPost: row.pricePerPost,
      verticals: row.verticals,
    })),
  });

  revalidatePath(AGENCY_ROSTER_PATH);
  revalidatePath(AGENCY_PORTFOLIO_PATH);
  return {
    ok: true,
    created: rows.length,
    skipped,
    message: `Imported ${rows.length} creator${rows.length === 1 ? "" : "s"}${
      skipped > 0 ? `, skipped ${skipped} invalid row${skipped === 1 ? "" : "s"}` : ""
    }`,
  };
}
