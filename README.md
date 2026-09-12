# Naano — B2B LinkedIn Creator Marketplace (clone)

A full-stack rebuild of [naano.com](https://naano.com), built from the live reference as an
engineering assignment for **8x.social**. Naano is a **three-sided B2B marketplace**: brands
discover and book vetted LinkedIn creators for fixed-price sponsored posts, creators get paid to
post in their own voice, and agencies manage clients or creator rosters — with **per-post
attribution** (clicks → leads → pipeline) tying every result back to the creator who drove it.

> ⚠️ Not affiliated with Naano. This is an independent, reference-built clone for demonstration.
> All copy is paraphrased and all assets (logo, imagery) are original — nothing is lifted from the
> live site.

---

## What's inside

**The full three-sided product, end to end:**

- **Marketing site** — faithful homepage (navy cloud hero), for-companies / for-creators /
  for-agencies, how-it-works, pricing, an SEO "creator marketplace" explainer, a blog, and **4
  interactive free-tool calculators** (creator worth, engagement rate, delivery odds, budget
  planner).
- **Company (brand) app** — ICP-driven **creator discovery** ranked by a computed *audience-fit
  score*, creator media-kit pages, campaign creation with an **AI campaign-brief generator**
  (OpenAI), a booking pipeline (Invited → Accepted → Draft → Approved → Scheduled → Live → Paid),
  an **attribution dashboard** (impressions / clicks / leads over time), an identifiable **leads**
  list, and reports.
- **Creator app** — editable media kit + rate card, incoming **deals** (accept / decline / submit
  content), post performance, and **earnings / payouts**.
- **Agency app** — adapts to agency type: **brand agencies** get per-client workspaces with
  budgets; **creator agencies** get a managed roster with **CSV import** (managed creators need no
  login of their own).
- **Real attribution** — every booked post gets a tracked link at `/t/<slug>` that records a click
  and redirects, feeding the analytics charts. Attribution is real, not faked.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router, Server Components, Server Actions) + **React 19** + TypeScript |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens) + a hand-rolled UI kit + `lucide-react` |
| Data | **PostgreSQL** (Docker) + **Prisma ORM** |
| Auth | **Auth.js v5** (NextAuth) — credentials + JWT sessions, role-based access |
| AI | **Vercel AI SDK v6** (`ai`) + `@ai-sdk/openai` — `generateObject` with a Zod schema |
| Charts | **Recharts** |
| Validation | **Zod** everywhere at the boundary |

---

## Quick start

**Prerequisites:** Node 20+, Docker (for Postgres). That's it.

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres (isolated container on port 5544)
docker compose up -d

# 3. Configure environment
cp .env.example .env
#    A working .env is generated for you on first setup; the only value you may
#    want to add is your OpenAI key (see "Enabling AI" below).

# 4. Create the schema + seed realistic demo data
npm run setup          # = prisma generate && prisma db push && seed

# 5. Run it
npm run dev            # http://localhost:3000
```

### Demo accounts

Seeded, password **`password123`**. The login page also has **one-click demo login** buttons.

| Account | Role | What you'll see |
| --- | --- | --- |
| `company@naano.test` | Company | Discovery, AI briefs, campaigns, attribution, leads |
| `creator@naano.test` | Creator | Media kit, live/invited/paid deals, earnings |
| `agency@naano.test` | Agency (brand) | Client workspaces + budgets |
| `talent@naano.test` | Agency (creator) | Managed roster + CSV import |

### Enabling AI (optional but recommended)

The **AI campaign-brief generator** uses OpenAI. Without a key the feature degrades gracefully
(clear "add your key" message; manual brief entry still works). To enable it, add your key to
`.env`:

```
OPENAI_API_KEY="sk-..."
```

Then generate a brief from **Company → Campaigns → New campaign**. It returns a structured brief
(angle, hook, CTA, key messages, do/don't, proof points) that you can edit before saving.

---

## Architecture

```
src/
├── app/
│   ├── (marketing)/          # public site: for-companies, pricing, blog, free-tools, …
│   ├── (auth)/               # login, register (role select)
│   ├── app/                  # COMPANY dashboard (RBAC-gated in layout)
│   ├── creator/              # CREATOR dashboard
│   ├── agency/               # AGENCY dashboard
│   ├── onboarding/           # profile completion fallback
│   ├── api/ai/brief/         # AI brief endpoint (auth + rate-limited)
│   ├── api/auth/[...nextauth]/
│   ├── t/[slug]/             # tracked-link attribution redirect
│   ├── actions/              # server actions (campaigns, bookings, creator, agency, auth)
│   └── page.tsx              # homepage
├── components/
│   ├── ui/                   # design-system primitives (Button, Card, FitScoreRing, …)
│   ├── marketing/  app/  company/  creator/  agency/  free-tools/  auth/
├── lib/                      # prisma, auth, env, constants, fit-score, ai, queries, logger
└── types/
prisma/schema.prisma          # data model
prisma/seed.ts                # deterministic demo data
```

**Key design decisions**

- **Audience-fit score** (`src/lib/fit-score.ts`) — a deterministic 0–100 score matching a
  campaign's ICP (target functions + seniorities + vertical) against a creator's audience
  composition. This is Naano's core "which creators your buyers trust" mechanic, and it's
  algorithmic (no AI cost, fully explainable).
- **Real attribution** — `PostMetricDaily` is a per-post daily time series; the `/t/<slug>`
  redirect increments it on every click. Charts read straight from it.
- **Booking state machine** — a single `Booking` row moves through an explicit, server-enforced
  lifecycle. The company drives the later transitions (approve/schedule/publish/pay); the creator
  drives the earlier ones (accept/decline/submit). Illegal transitions are rejected by default.
- **Money** is stored as whole euros (integers) to avoid float drift.
- **Auth.js credentials + JWT** with the user's `role` carried in the token/session; every
  dashboard segment re-checks the role in its layout (default-deny).

---

## Security

Built against an OWASP + best-practices guardrail set. Highlights:

- **Passwords** hashed with bcrypt (adaptive, salted); **account lockout** after repeated failures.
- **RBAC** enforced server-side on every route/action (default-deny); role can never be escalated
  at registration.
- **IDOR-safe** — every query/mutation is scoped to the authenticated user; non-owned records read
  as *not found*.
- **Input validation** with Zod at every boundary; explicit DTOs (no mass-assignment).
- **Secrets** only via env (`.env` is gitignored); config validated at startup, fails loudly.
- **Rate limiting** on auth + the AI endpoint; **structured logging** with sensitive-field
  scrubbing; parameterized queries via Prisma; React auto-escaping (no `dangerouslySetInnerHTML`).

---

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (`prisma generate` + `db push` + seed-if-empty + `next build`) |
| `npm run setup` | Generate client, push schema, seed |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run typecheck` | `tsc --noEmit` |

---

## Notes, assumptions & limitations

- **Pricing model** follows Naano's current **fixed price-per-post** model (the legacy per-click
  model is intentionally not implemented; click *tracking* remains, for attribution).
- **"Attributed pipeline"** on the company overview is an explicitly-labelled estimate
  (`leads × €2,500` assumed deal value).
- Payments are **modelled**, not integrated with a real PSP (Stripe/SEPA) — this is a demo.
- The rate limiter is in-memory (fine for a single local instance; production would use Redis).
- The Postgres container uses port **5544** to avoid clashing with other local databases.

---

## How this was built

Scaffolding and the shared foundation (schema, auth, design system, AI, seed, attribution) were
built first, then the six page-level workstreams (marketing, free tools, auth, company app,
creator app, agency app) were implemented in parallel against a shared component kit, and finally
integrated and verified (typecheck, production build, and an end-to-end auth/RBAC/render smoke
test). See `docs/AGENT_KIT.md` for the shared conventions used across the codebase.
# naano
