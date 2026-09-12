# Deploying the Naano clone

The app is a standard Next.js 16 app that needs a **PostgreSQL** database at runtime. Below is the
fastest path (Vercel + Neon), plus a generic path for any host.

---

## Recommended: Vercel + Neon (free tiers)

### 1. Provision Postgres (Neon)
- Create a project at https://neon.tech → copy the **pooled connection string**
  (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).

### 2. Deploy on Vercel
- Push this repo to **GitHub** (public), then "Import Project" in Vercel (it auto-detects Next.js).
- Set **Environment Variables** (Production **and** Preview — Prisma runs at build time):

| Key | Value |
| --- | --- |
| `DATABASE_URL` | your Neon connection string (`?sslmode=require`). Prefer the **direct** (non-pooled) URL so `prisma db push` can run during the build. |
| `AUTH_SECRET` | generate with `openssl rand -base64 32` |
| `AUTH_URL` | your production URL, e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | *(optional)* your key, to enable the AI brief generator |
| `OPENAI_BRIEF_MODEL` | *(optional)* defaults to `gpt-4o-mini` |

- Deploy. `npm run build` runs `prisma generate`, `prisma db push` (creates/updates tables from `DATABASE_URL`), then seeds **only if the database has no users**. Redeploys do not wipe data.

### 3. Optional: re-seed from your machine
`npm run db:seed` always wipes and reloads demo data. Use it only when you want a clean slate:

```bash
DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require" npm run db:seed
```

### 4. Verify
- Open the deployed URL in a **fresh/incognito** window (must work for a signed-out visitor).
- Use the **one-click demo login** buttons on `/login`, or sign in with `company@naano.test` /
  `password123`.

---

## Generic host (Docker / Railway / Render / Fly)

1. Provision Postgres; set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (+ optional `OPENAI_API_KEY`).
2. Build: `npm ci && npm run build` (pushes schema; seeds only if the DB is empty). Start: `npm run start` (Next.js server, port 3000).

---

## Notes
- The `naano_dev_password` in `docker-compose.yml` / `.env.example` is **only** for the local dev
  container — production uses your hosted `DATABASE_URL`.
- No secrets are committed; `.env` is gitignored. Set all secrets in the host's env settings.
- `AUTH_SECRET` **must** be set in production or Auth.js will refuse to start.
- The build applies the Prisma schema (`db push`) using the host `DATABASE_URL`. First build also seeds demo data; later builds skip seed if any user already exists. `npm run db:seed` still wipes and reloads.

---

## Pre-submission checklist (from the assignment)
- [ ] Live link opens for a signed-out visitor (test in incognito).
- [ ] Repository is **public** and includes the committed `.agent-logs/` directory.
- [ ] Walkthrough video (camera on, ≤ 5 min) recorded and linked.
