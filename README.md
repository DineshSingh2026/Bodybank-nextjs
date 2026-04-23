# BodyBank — Next.js + NestJS (migration)

This repository is the **new** stack for [Bodybank-nextjs](https://github.com/DineshSingh2026/Bodybank-nextjs). The original Express + `public/` app stays **untouched** in its own repo.

## Phase 1 — Next.js shell

- **App Router** (`app/`) with **no Tailwind** and minimal global CSS (legacy pages ship their own styles).
- **`public/`** — static HTML, CSS, JS, and assets copied from the legacy app for pixel parity.
- **`/`** — middleware rewrites to `public/index.html` so the URL stays `/` while the legacy document is served.
- **API / uploads** — when `LEGACY_ORIGIN` is set in `.env.local`, `next.config.ts` rewrites `/api/*` and `/uploads/*` to that origin.

## Phase 2 — NestJS API (incremental)

- **`backend/`** — Nest 11 + Express hybrid (`backend/src/main.ts`).
- **Express-mounted routes (legacy parity):**
  - `GET /health`
  - `GET /api/config`
  - `GET|POST /api/progress/*` — Express router from `backend/legacy-runtime/` (verbatim copies of `config/db.js`, `middleware/auth.js`, `routes/progress.js`, `controllers/progressController.js`, and the `progress` + `streak` + `goal` + `insight` + `userEmail` services).
- **Optional fallback proxy** — set `LEGACY_FALLBACK_ORIGIN` in `backend/.env` to your **legacy Express** URL. Any request not handled above is forwarded so you can run **Nest in front of Express** during migration.

### Local development (full chain)

| Process        | Port | Role |
| -------------- | ---- | ---- |
| Legacy Express | 3000 | Database of record + unmigrated routes |
| Nest `backend` | 3002 | Migrated routes + proxy to 3000 |
| Next           | 3001 | Static UI + rewrites to 3002 |

1. Install API deps once: `cd backend && npm install` (root `npm install` is only for Next).
2. Start **legacy** BodyBank Express on **3000**.
3. In `backend/`: copy `backend/.env.example` → `backend/.env`, set `DATABASE_URL`, `JWT_SECRET` (must match legacy), and:

   ```env
   LEGACY_FALLBACK_ORIGIN=http://localhost:3000
   PORT=3002
   ```

4. From repo root: `npm run dev:api` (or `cd backend && npm run start:dev`).
5. In repo root `.env.local`: `LEGACY_ORIGIN=http://localhost:3002`
6. `npm run dev:proxy` → open `http://localhost:3001`.

### Simpler dev (Next → Express only)

If you are not running Nest yet, keep Phase 1 setup: `LEGACY_ORIGIN=http://localhost:3000` and skip `backend/`.

## Phase 3 — Prisma + dedicated database

- **PostgreSQL database:** `bodybank_nextjs` (identifier without spaces; same intent as “bodybank nextjs”). **Only this DB is used** when `DATABASE_URL` in `backend/.env` points at it. Your other databases (e.g. `fitbase`, production) are **not** read or written by these scripts unless you put their URL in `.env`.
- **Bootstrap tables:** `cd backend && npm run db:bootstrap` — creates the core tables needed for progress + health on **whatever** `DATABASE_URL` is set to (idempotent `IF NOT EXISTS`).
- **ORM:** Prisma 5 (`backend/prisma/schema.prisma`, client in `node_modules/@prisma/client`). After changing the DB, run `npm run prisma:pull` in `backend/` and commit the updated schema if models changed.
- **`GET /api/health`** — implemented in Nest (`HealthController`) using **Prisma** (`$queryRaw`), same JSON shape as legacy. `/api/progress` still uses the legacy **`pg`** pool in `legacy-runtime/config/db.js` against the **same** `DATABASE_URL`.

### First-time backend DB setup

1. Create the database once in PostgreSQL (example for local `postgres` user):

   ```sql
   CREATE DATABASE bodybank_nextjs ENCODING 'UTF8' TEMPLATE template0;
   ```

2. `cd backend && cp .env.example .env` — set `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/bodybank_nextjs` (URL-encode special characters in the password).

3. `npm run db:bootstrap` then `npm run prisma:pull` (optional, if you changed tables outside Prisma) and `npm run build`.

**Never** point `DATABASE_URL` at a production database from this migration project unless you intend to operate on that data.

## Production (later)

- Deploy Next with `LEGACY_ORIGIN` pointing at your API (Nest only, or Nest+proxy, or monolith until cutover).

## Scripts (root)

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Next dev server                |
| `npm run dev:proxy` | Next on port 3001           |
| `npm run dev:api` | Nest backend watch (port from `backend/.env`) |
| `npm run build`   | Next production build          |
| `npm run build:api` | Nest production build       |
| `npm run start:api` | Nest `node dist/main`       |
| `npm run lint`    | Next ESLint                    |

Nest-only scripts: `cd backend && npm run start:dev` / `npm run build` / `npm test` / `npm run db:bootstrap` / `npm run prisma:pull`.

## Testing (local)

### API E2E (legacy Express)

In the **bodybank** repo, with PostgreSQL reachable and **BodyBank server listening on port 3000** (`DATABASE_URL` in `.env` pointing at your dev DB, e.g. `bodybank_nextjs`):

```bash
cd ../bodybank   # or path to your legacy app
npm test         # ensure-password-resets + tests/e2e-flow.js
```

The flow covers sign-up → approval → login → workouts → **public audit + part2** → admin lists → superadmin dashboard → re-signup after reject.  
`tests/e2e-flow.js` includes `height_cm` and geo fields required by current signup validation.

### Browser E2E (Next.js site → API)

1. Start **Express** on **:3000** (same as above).
2. From this repo root:

   ```bash
   npm install
   npx playwright install chromium   # once
   npm run test:e2e
   ```

Playwright starts **Next on :3001** (or reuses it) with `LEGACY_ORIGIN=http://127.0.0.1:3000` and runs `e2e/audit-form-website.spec.ts`: opens **Start Your Body Audit**, fills the modal, asserts `POST /api/audit` **200** and the success popup.

### One-shot commands (this repo)

| Script | Needs Express **:3000**? | What it runs |
|--------|---------------------------|----------------|
| `npm run test:all` | **Yes** (for Playwright) | ESLint → Next `build` → Playwright → Nest `jest --passWithNoTests` → Nest e2e Jest |
| `npm run test:legacy` | **Yes** | Sibling `../bodybank`: `npm test` + `tests/api-progress-test.js` |
| `npm run test:full` | **Yes** | `test:legacy` then `test:all` |

Start legacy BodyBank first, e.g. `PORT=3000 node server.js` in the **bodybank** folder (see bodybank `.env` for `DATABASE_URL`).
