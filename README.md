# BodyBank — Next.js frontend (migration)

This repository is the **new** Next.js shell for [Bodybank-nextjs](https://github.com/DineshSingh2026/Bodybank-nextjs). The original Express + `public/` app stays untouched in its own repo.

## Phase 1 (current)

- **App Router** (`app/`) with **no Tailwind** and minimal global CSS (legacy pages ship their own styles).
- **`public/`** — static HTML, CSS, JS, and assets copied from the legacy app for pixel parity.
- **`/`** — middleware rewrites to `public/index.html` so the URL stays `/` while the legacy document is served.
- **API / uploads** — when `LEGACY_ORIGIN` is set, `next.config.ts` rewrites `/api/*` and `/uploads/*` to that origin (run the legacy server for auth, forms, and uploads during development).

## Local development

1. Start the **legacy** BodyBank server on port **3000** (or any port; match it below).
2. In this repo:

   ```bash
   npm install
   cp .env.example .env.local
   ```

   Set `LEGACY_ORIGIN=http://localhost:3000` in `.env.local`.

3. Start Next on another port so it does not bind the same port as Express:

   ```bash
   npm run dev -- -p 3001
   ```

4. Open `http://localhost:3001` — landing page should match legacy; API calls from the browser go to the same host and are rewritten to the legacy server.

## Production (later)

- Deploy Next with `LEGACY_ORIGIN` pointing at your API host, or remove rewrites once the API is migrated to NestJS in this or a sibling repo.

## Scripts

| Command        | Description           |
| -------------- | --------------------- |
| `npm run dev`  | Next dev server       |
| `npm run build`| Production build      |
| `npm run start`| Production server     |
| `npm run lint` | ESLint                |
