# Naano clone — Shared Kit Reference (read before building)

You are building part of a **Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma + Auth.js** clone of naano.com, a B2B LinkedIn creator marketplace. A foundation is already built. **Reuse it. Do not rebuild or modify shared files.**

## Hard rules

- **Do NOT modify** any of these (they are shared & stable): `src/app/globals.css`, `src/app/layout.tsx`, `package.json`, anything in `prisma/`, anything in `src/lib/`, `src/components/ui/*`, `src/components/logo.tsx`, `src/components/marketing/site-nav.tsx`, `src/components/marketing/site-footer.tsx`, `src/components/app/*`, `src/auth.ts`, and the route-group layouts (`src/app/(marketing)/layout.tsx`, `src/app/(auth)/layout.tsx`, `src/app/app/layout.tsx`, `src/app/creator/layout.tsx`, `src/app/agency/layout.tsx`). Create **new files only, in your assigned directories.**
- **Do NOT run** `npm install`, `npm run dev`, or `npm run build`. All deps are installed; the orchestrator verifies centrally. You MAY run `npx tsc --noEmit` to check types if useful, but it's optional.
- If you think you need a new npm package, DON'T — use what's installed (recharts, lucide-react, zod, date-fns, ai, clsx, tailwind-merge, class-variance-authority) or note it in your final report.
- Path alias: `@/` → `src/`.

## Stack conventions

- **Server Components by default.** Add `"use client"` only for interactivity (state, event handlers, hooks).
- **Async params/searchParams** (Next 16): `export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string,string|undefined>> }) { const { id } = await params; }`
- **Do NOT use** the global `LayoutProps`/`PageProps` types (they break standalone typecheck) — type props explicitly as shown above.
- **DB access** via `import { prisma } from "@/lib/prisma"`. Always scope queries to the authenticated user (never trust client-supplied ids for ownership) — IDOR-safe. Return/redirect (404-style) if a record isn't owned by the current user.
- **Mutations** = server actions in `src/app/actions/<name>.ts` starting with `"use server"`. Validate inputs with `zod`. Call `revalidatePath(...)` after writes. Enforce role/ownership inside the action (default-deny) — never rely on the UI hiding a control.
- **Money** is stored as whole euros (integer). Render with `formatEuros`.
- **Security guardrails to honor**: server-side authz on every action/route; validate all external input with zod; never put secrets in code; rely on React's auto-escaping (never `dangerouslySetInnerHTML` with user/AI data); use explicit DTOs (don't spread a whole request body into a Prisma create — pick allowed fields).

## Design language

Deep-navy hero (`.hero-clouds` bg), near-black pill CTAs, airy white sections, clean grotesque type (Plus Jakarta Sans, the default `font-sans`).

Tailwind color utilities available: `bg-navy` `bg-navy-800` `bg-ink` `text-brand` `text-brand-700` `text-accent` `bg-brand` `bg-accent` `bg-muted` `text-muted-foreground` `border-border` `text-success/warning/danger`. Helpers: `.hero-clouds`, `.text-gradient`, `.bg-dotgrid`. Radius: `rounded-lg` / `rounded-xl` / `rounded-full`.

## UI components (import from these paths)

- `@/components/ui/button` → `Button` and `ButtonLink`. Variants: `default` (near-black), `brand`, `outline`, `subtle`, `ghost`, `white`, `danger`, `link`. Sizes: `sm|default|lg|icon`. `ButtonLink` takes `href` + all Link props.
- `@/components/ui/card` → `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter`.
- `@/components/ui/input` → `Input`. `@/components/ui/textarea` → `Textarea`. `@/components/ui/label` → `Label`.
- `@/components/ui/field` → `Field` `{ label, htmlFor?, hint?, error?, required?, children }` (label+control+hint/error row).
- `@/components/ui/select` → `Select` (styled native `<select>`; pass `<option>` children).
- `@/components/ui/badge` → `Badge` `{ variant }` (default|brand|accent|success|warning|danger|outline|ink).
- `@/components/ui/avatar` → `Avatar` `{ name, src?, size? }` (initials fallback).
- `@/components/ui/container` → `Container` (centered max-w-6xl).
- `@/components/ui/section-heading` → `SectionHeading` `{ eyebrow?, title, subtitle?, align? }`.
- `@/components/ui/stat-card` → `StatCard` `{ label, value, hint?, delta?: {value, positive?}, icon? }`.
- `@/components/ui/fit-score` → `FitScoreRing` `{ score, size?, label? }` (circular audience-fit gauge).
- `@/components/ui/progress` → `ProgressBar` `{ value }` (0..100).
- `@/components/logo` → `Logo` `{ variant?: "dark"|"light" }`, `LogoMark`.
- App chrome (already applied by layouts): `@/components/app/dashboard-shell` → `DashboardShell`, `PageHeader` `{ title, description?, action? }`. Use `PageHeader` at the top of each dashboard page.
- Icons: `lucide-react`. Charts: `recharts`.

## Utilities & constants

- `@/lib/utils` → `cn`, `formatEuros`, `formatCompact`, `formatPercentFromFraction`, `formatScore`, `formatDate`, `initials`.
- `@/lib/constants` → `SITE`, `MARKETPLACE_STATS`, `PRICING_PLANS`, `VERTICALS`, `AUDIENCE_FUNCTIONS`, `AUDIENCE_SENIORITIES`, `CREATOR_WORTH`, `DELIVERY_RATES`, `PRICE_BANDS`, `MIN_POST_PRICE`, `MAX_POST_PRICE`, `BOOKING_PIPELINE`, `PAGE_SIZE_DEFAULT`, `PAGE_SIZE_MAX`.
- `@/lib/fit-score` → `computeFitScore(target, creatorAudience)`, `asAudienceMap(json)`.

## Auth

- `@/lib/auth-helpers` → `getSessionUser()`, `requireAuth()`, `requireRole(role|roles)`, `requireCompany()` → `{user, company}`, `requireCreator()` → `{user, creator}`, `requireAgency()` → `{user, agency}`, `roleHome(role)`.
- `@/auth` → `signIn`, `signOut`, `auth`.
- Dashboard layouts already call the right `requireX()` — inside `src/app/app/**` you can call `requireCompany()` again to get the profile; it's cheap and safe.

## Data model (Prisma — key models)

- `User { id, email, name, role: COMPANY|CREATOR|AGENCY|ADMIN, image }`
- `CompanyProfile { id, userId, companyName, website, industry, vertical, icpDescription, icpFunctions[], icpSeniorities[], plan }`
- `CreatorProfile { id, userId?, displayName, headline, bio, avatarUrl?, location, verticals[], followers, medianReach, engagementRate, avgReactions, avgComments, pricePerPost, currency, available, audienceBySeniority(Json), audienceByFunction(Json), statsUpdatedAt, managedByAgencyId?, posts[] }`
- `CreatorPost { id, creatorProfileId, content, imageUrl?, reactions, comments, postedAt }`
- `AgencyProfile { id, userId, agencyName, type: BRAND_AGENCY|CREATOR_AGENCY, clientWorkspaces[], rosterCreators[] }`
- `AgencyClientWorkspace { id, agencyProfileId, clientName, budget, companies[], campaigns[] }`
- `Campaign { id, companyProfileId, agencyClientWorkspaceId?, name, status: DRAFT|ACTIVE|COMPLETED|ARCHIVED, vertical, icp, objective, budget, targetPostCount, startDate?, endDate?, brief?, bookings[] }`
- `Brief { id, campaignId, angle, hook, cta, keyMessages[], audience, toneOfVoice, doList[], dontList[], proofPoints[], generatedByAI, prompt? }`
- `Booking { id, campaignId, creatorProfileId, status: INVITED|ACCEPTED|DECLINED|DRAFT_SUBMITTED|APPROVED|SCHEDULED|LIVE|COMPLETED|PAID, pricePerPost, fitScore, trackedSlug (unique), targetUrl, draftContent?, scheduledAt?, publishedAt?, metrics[], leads[], payout? }`
- `PostMetricDaily { id, bookingId, date, impressions, clicks, leads }` (time series)
- `Lead { id, bookingId, name, title, company, linkedinUrl?, capturedAt }`
- `Payout { id, bookingId, amount, currency, status: PENDING|PROCESSING|PAID, method, paidAt? }`

Audience Json shape: `{ "Marketing": 0.32, "Sales/BD": 0.18, ... }` (fractions summing ~1). Use `asAudienceMap()` to read safely.

## AI brief generator (already built)

`POST /api/ai/brief` with JSON `{ productName, productDescription, targetAudience, objective, vertical?, keyPoints? }` → `{ brief: { angle, hook, cta, keyMessages[], audience, toneOfVoice, doList[], dontList[], proofPoints[] } }`. Returns 503 if the OpenAI key isn't configured (handle gracefully in the UI with a clear message). Schema/types at `@/lib/ai/brief-schema`.

## Tracked links (attribution)

Booking `trackedSlug` powers `/t/<slug>` which records a click and redirects. In UIs that show a post's tracked link, link to `/t/<slug>`.

## Demo accounts (seeded, password `password123`)

`company@naano.test`, `creator@naano.test`, `agency@naano.test` (brand agency), `talent@naano.test` (creator agency).
