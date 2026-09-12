# Deploying the Naano clone

The app is a standard Next.js 16 app that needs a **PostgreSQL** database at runtime. Below is the
fastest path (Vercel + Neon), plus a generic path for any host.

---

## Recommended: Vercel + Neon (free tiers)

### 1. Provision Postgres (Neon)
- Create a project at https://neon.tech → copy the **pooled connection string**
  (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).

### 2. Push the schema + seed the demo data (one-time, from your machine)
```bash
# point at the hosted DB just for these two commands
DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require" npx prisma db push
DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require" npm run db:seed
```
> `db push` syncs the schema (no migration history needed). `db:seed` loads ~40 creators,
> campaigns, metrics, and the four demo accounts.

### 3. Deploy on Vercel
- Push this repo to **GitHub** (public), then "Import Project" in Vercel (it auto-detects Next.js).
- Set **Environment Variables** (Production):

| Key | Value |
| --- | --- |
| `DATABASE_URL` | your Neon pooled connection string |
| `AUTH_SECRET` | generate with `openssl rand -base64 32` |
| `AUTH_URL` | your production URL, e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | *(optional)* your key, to enable the AI brief generator |
| `OPENAI_BRIEF_MODEL` | *(optional)* defaults to `gpt-4o-mini` |

- Deploy. The `build` script already runs `prisma generate` before `next build`.

### 4. Verify
- Open the deployed URL in a **fresh/incognito** window (must work for a signed-out visitor).
- Use the **one-click demo login** buttons on `/login`, or sign in with `company@naano.test` /
  `password123`.

---

## Generic host (Docker / Railway / Render / Fly)

1. Provision Postgres; set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (+ optional `OPENAI_API_KEY`).
2. Run once against the DB: `prisma db push` then `npm run db:seed`.
3. Build: `npm ci && npm run build`. Start: `npm run start` (Next.js server, port 3000).

---

## Notes
- The `naano_dev_password` in `docker-compose.yml` / `.env.example` is **only** for the local dev
  container — production uses your hosted `DATABASE_URL`.
- No secrets are committed; `.env` is gitignored. Set all secrets in the host's env settings.
- `AUTH_SECRET` **must** be set in production or Auth.js will refuse to start.
- Seeding is a one-time step, not part of the build — re-running `db:seed` wipes and reloads demo data.

---

## Pre-submission checklist (from the assignment)
- [ ] Live link opens for a signed-out visitor (test in incognito).
- [ ] Repository is **public** and includes the committed `.agent-logs/` directory.
- [ ] Walkthrough video (camera on, ≤ 5 min) recorded and linked.
