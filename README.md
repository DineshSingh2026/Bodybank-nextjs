# BodyBank — Next.js + NestJS (migration)

This repository is the **new** stack for [Bodybank-nextjs](https://github.com/DineshSingh2026/Bodybank-nextjs). The original Express + `public/` app stays **untouched** in its own repo.

## Phase 1 — Next.js shell

- **App Router** (`app/`) with **no Tailwind** and minimal global CSS (legacy pages ship their own styles).
- **`public/`** — static HTML, CSS, JS, and assets copied from the legacy app for pixel parity.
- **`/`** — middleware rewrites to `public/index.html` so the URL stays `/` while the legacy document is served.
- **API / uploads** — when `LEGACY_ORIGIN` is set in `.env.local`, `next.config.ts` rewrites `/api/*` and `/uploads/*` to that origin.

## Phase 2 — NestJS API (incremental)

- **`backend/`** — Nest 11 + Express hybrid (`backend/src/main.ts`).
- **Migrated routes (same handlers as legacy):**
  - `GET /health`
  - `GET /api/config`
  - `GET /api/health`
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

Nest-only scripts: `cd backend && npm run start:dev` / `npm run build` / `npm test`.
