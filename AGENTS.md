# AGENTS.md — Hassad Platform

## Read first

| File | What it covers |
| --- | --- |
| `apps/api/src/app.module.ts` | Current backend module wiring. Inspect this before changing backend boundaries or registrations. |
| `apps/api/src/main.ts` | Backend bootstrap, global prefix, validation, CORS, and interceptors. |
| `apps/api/prisma/schema.prisma` | Current Prisma schema and database model source of truth. |
| `apps/web/components/ui/*` | shadcn primitives. Read the relevant component docs before changing UI. |
| `apps/web/app/globals.css` | Theme tokens and semantic styling source of truth. |
| `apps/web/proxy.ts` | Edge auth and route-guard behavior for the web app. |
| `apps/web/components/design-system/README.md` | Legacy migration layer rules. Read only to avoid extending the old system. |

Always inspect the relevant source files before touching API, DB, or UI code. Validate assumptions against the codebase itself - routes, modules, and behaviors can drift from older notes.

### Backend engineering standards (mandatory for `apps/api`)

- Treat NestJS, Prisma, and PostgreSQL as production infrastructure, not a place for quick fixes.
- Prefer clean module boundaries, explicit DTOs, transactions where needed, and clear error handling.
- Do not silence errors, bypass validation, or ship brittle one-off code just to make something pass.
- Preserve existing business rules, permissions, and state-machine behavior unless a change explicitly requires otherwise.
- Use Prisma migrations for schema changes and data changes.

### Frontend engineering standards (mandatory for `apps/web`)

- Treat Next.js App Router code as long-lived product code. Optimize for maintainability, readability, and predictable data flow.
- Use shadcn primitives and the installed shadcn skill/docs before adding or changing UI.
- Prefer semantic tokens, reusable patterns, and clean composition over ad-hoc wrappers or inline visual styling.
- Do not ship UI that only "works". Ship code that is consistent with the existing architecture and easy to extend.
- When a shared pattern is needed, compose it from shadcn primitives and keep the API small.

### UI migration policy (mandatory for `apps/web`)

- `apps/web/components/ui/*` is the only primitive UI source of truth.
- `apps/web/app/globals.css` is the only token/theme source of truth.
- `apps/web/components/design-system/*` is legacy migration code only; do not add new files there.
- New UI must be built from shadcn primitives and semantic utilities/tokens only.
- Do not hardcode visual values in shared UI: no raw colors, borders, radii, shadows, spacing, sizing, or typography decisions in TSX unless tokenized first.
- Do not build shared UI with raw HTML if a shadcn primitive exists.
- Before any UI change: run shadcn context/docs commands and read the relevant component docs.
- If a page or feature needs a reusable pattern, compose it from shadcn primitives and keep the API small.
- Old UI stays until migration is complete, but no new work should depend on the old wrapper layer.
- When in doubt, choose the simplest shadcn primitive composition and delete the legacy version after replacement.

---

## Tech stack

- **Monorepo**: npm workspaces + Turborepo. Node `>=20` required.
- **API** (`apps/api`): NestJS 11, TypeScript 5, Prisma 6, PostgreSQL 17.
- **Web** (`apps/web`): Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui, Redux Toolkit + RTK Query.
- **Shared** (`packages/shared`): `@hassad/shared` — enums, Zod schemas, TS interfaces consumed by both apps.

---

## Essential commands

### Monorepo root

```bash
npx turbo dev            # start both api (port 3001) and web (port 3000)
turbo build              # build everything (shared → api/web), gates on lint + typecheck
npm run verify           # lint + typecheck only — fast, no build
npm run lint             # lint only (turbo lint)
npm run format           # prettier --write "**/*.{ts,tsx,md}"
```

### Scoped via Turbo

```bash
npx turbo run dev --filter=api
npx turbo run dev --filter=web
npx turbo run build --filter=shared
```

### Database (run from `apps/api`)

```bash
docker compose up -d postgres          # start PostgreSQL 17
npx prisma migrate dev                 # dev: create + apply a migration from schema changes (NOT db push)
npx prisma generate                    # rebuild Prisma client after schema/migration changes
npx prisma migrate status              # check that the dev DB is in sync with migrations
npx prisma db seed                     # seed dev data (ts-node, see below)
npx prisma migrate reset               # drop & rebuild dev DB from all migrations + seed (wipes dev data)
```

**Dev and production use the same migration workflow — never `prisma db push`.**

- **Dev:** `prisma migrate dev` generates a migration file at `prisma/migrations/<timestamp>_<name>/migration.sql` and applies it.
- **Production:** the Docker entrypoint (`scripts/entrypoint.sh`) runs `prisma migrate deploy`, which applies only committed migration files (it never creates new ones).

**Rules:**

- **Never use `prisma db push`** — it writes no migration file, so production (`migrate deploy`) never sees the change. This is what previously caused dev/prod drift.
- **Commit every migration file** (`prisma/migrations/*/migration.sql`) to git — production deploys from these.
- After editing `schema.prisma`: run `migrate dev` (creates the migration + applies it) then `prisma generate` (rebuilds client types).
- If `migrate dev` reports drift and offers to reset, the DB was modified outside migrations (e.g. by a past `db push` or manual SQL). Fix the root cause instead of ignoring the warning.
- If a migration's SQL can't run because the change already exists in the DB (legacy `db push` drift), register it as applied without running the SQL: `npx prisma migrate resolve --applied <migration_name>`.

**Production deploy (on the server):** `git pull` → rebuild containers. `prisma migrate deploy` runs automatically in the entrypoint and applies any new committed migrations. **Never run `migrate dev` in production.**

### Data migrations (CRITICAL)

**Rule: Use migrations for ALL database changes, including data.**

- **Schema changes** (tables, columns, enums) → Schema migration (automatic via `prisma migrate dev`)
- **Data changes** (new permissions, new roles, reference data) → **Data migration** (manual SQL file)

**Why?**

- `prisma db seed` is for **initial data setup only** — it does NOT run in production.
- If you add new permissions/roles in `seed.ts`, existing production databases will NOT get them.
- This causes runtime errors when code expects permissions that don't exist.

**How to create a data migration:**

1. Create a folder in `prisma/migrations/` with timestamp: `20260101000000_add_new_permissions/`
2. Add `migration.sql` with INSERT statements:
   ```sql
   INSERT INTO permissions (id, name) VALUES (gen_random_uuid(), 'module.action')
   ON CONFLICT (name) DO NOTHING;
   ```
3. Add `migration_lock.toml`:
   ```toml
   provider = "postgresql"
   ```
4. Run `prisma migrate dev` to register it (or `prisma migrate resolve --applied <name>` if already applied)

**This ensures production gets all changes automatically on deploy.**

### Shared package

```bash
npm run build   # tsc → dist/  (must be built before api or web)
npm run watch   # tsc -w
```

Both apps have `predev`/`prebuild` scripts that build shared automatically. When working on shared in isolation, build it explicitly first.

---

## Parallel execution workflow

### Phase flow

- Phases run sequentially (Phase 0 → Phase 1 → ...)
- Within a phase, tasks are grouped by package, not by phase number
- Tasks touching `packages/shared` execute first (api + web depend on it)
- Remaining tasks dispatch in parallel — one subagent per package

### Per-task verification (each subagent)

- Prefer package-local `typecheck` and targeted tests for subagent verification.
- Use package-local `lint` only when you intentionally want that package's lint behavior; do not treat it as a build step.
- Do not run `turbo build --filter=<package>` during work unless you specifically need compiled output.
- Reserve `turbo build` for final integration after all subagents return.

### Integration (after all subagents return)

- One `turbo build` (full) — final integration gate for the whole repo.
- If it fails: fix only the broken package, preserve other packages' work.
- If it passes: phase complete.

### Before execution

- I infer each task's package from its description and present a grouped plan
- You approve or adjust before I start

## Background process hygiene (CRITICAL)

**Problem this solves:** leaked `nest start --watch` / `next dev` processes that pile up and freeze the dev machine.

Past agent sessions started the API in the background with `nohup npx nest start --watch > /tmp/api.log 2>&1 &` (then `sleep; curl` to test an endpoint) and **never killed them**. Because `nohup ... &` detaches from the terminal, those processes get reparented to `systemd --user` when the session ends and **run forever** — each one holds a full NestJS container + Prisma client, watches `apps/api/src`, and recompiles on every file change. Three of these were once found running simultaneously, burning ~1–2 GB RAM and saturating 4 CPU cores, directly causing the PC to swap-thrash and freeze.

**Rules for agents (and humans) when starting the app to test something:**

1. **Never** use `nohup ... &` to start `nest start --watch` or `next dev` for a quick test. That combination is the leak.
2. If you background **any** dev server (api or web), you **MUST kill it before your task ends**. Track the PID you started and `kill` it (and its children) when done.
3. Prefer **one-shot, non-watch** runs for tests so they can't leak:
   ```bash
   # API — build once, run the compiled output, kill after
   cd apps/api && npm run build && node dist/main &         # note the PID, kill it when done
   # or with a hard timeout so it cannot leak:
   cd apps/api && timeout 60 node dist/main &
   ```
   Avoid `--watch` for throwaway tests — it is for long-running dev sessions only.
4. **Before** starting a dev server, check for and kill any existing instance so you never stack duplicates:
   ```bash
   pkill -f "nest start" ; pkill -f "next dev" ; pkill -f "next-server"
   ```
5. At the **end of your task**, run the same cleanup as a safety net:
   ```bash
   pkill -f "nest start" ; pkill -f "next dev" ; pkill -f "next-server"
   ```
   Do **not** kill `node dist/main` (the production-style compiled server) unless you started it.
6. Do not run `turbo dev` (which starts **both** api and web in parallel) just to test one endpoint — it doubles memory pressure. Use `npx turbo run dev --filter=api` or `--filter=web` to start only the side you need.

**Why it matters:** this dev machine has 7.6 GB RAM and 4 cores. Every leaked watcher brings the whole desktop closer to swap-thrash. Clean up after yourself.

---

## Environment setup

Copy `.env.example` → `.env` in `apps/api` and `apps/web`.

**`apps/api/.env` required vars:**

```
DATABASE_URL=postgresql://hassad:hassad_dev_password@localhost:5432/hassad
JWT_SECRET=<random>
JWT_REFRESH_SECRET=<random>
```

**`apps/web/.env.local` required vars:**

```
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

Optional: `CLOUDFLARE_R2_*` (file uploads), `MOYASAR_API_KEY` (payments), `GEMINI_API_KEY` (AI module).

---

## Monorepo structure

```
apps/api/       NestJS REST API — global prefix /v1, port 3001
apps/web/       Next.js App Router — port 3000
packages/shared @hassad/shared — shared enums, schemas, types
docker-compose.yml  PostgreSQL 17 only (no Docker images for apps)
.agents/        Agent spec docs (not runtime code)
features/       Feature planning markdown docs
```

### API internals (`apps/api/src/`)

- `main.ts` — bootstrap: global `/v1` prefix, cookie-parser, CORS, `ValidationPipe(whitelist:true, forbidNonWhitelisted:true)`
- `app.module.ts` — wires the current application modules; inspect before changing module registration
- `common/` — global `ResponseInterceptor`, `HttpExceptionFilter`, `PermissionsGuard`, decorators
- `modules/` — grouped: `core/`, `crm/`, `proposals/`, `contracts/`, `projects/`, `tasks/`, `portal/`, `marketing/`, `finance/`, `chat/`, `notifications/`, `ai/`, `sales/`

### Web internals (`apps/web/`)

- `app/(dashboard)/` — authenticated dashboard routes grouped by feature area
- `app/(portal)/` — client portal
- `app/contract/[token]` and `app/proposal/[token]` — public token-based share pages
- `features/<domain>/` — RTK Query API slices (not in `lib/`)
- `lib/store.ts` — Redux store; `lib/baseQuery.ts` — shared base query with envelope unwrap + auto token refresh
- `apps/web/proxy.ts` — edge auth and role routing for protected paths
- Path alias `@/*` maps to the root of `apps/web/` (not `src/`)

### UI rules (`apps/web/`) — mandatory

- Follow the UI rules in this file before any UI change.
- `apps/web/components/ui/*` is the **only primitive UI source of truth**.
- `apps/web/app/globals.css` is the **only token/theme source of truth**.
- Do **not** add new files to `apps/web/components/design-system/*`.
- Do **not** guess shadcn APIs, composition, theming, or variants.
- Do **not** build shared UI from hardcoded HTML + inline style when shadcn already provides the primitive.
- Before implementing any UI primitive/pattern, use the installed shadcn skill at `.agents/skills/shadcn/` and the shadcn CLI/docs.

### Required shadcn workflow for every UI task

From `apps/web/` run these before implementing UI:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component>
```

Use these when needed:

```bash
npx shadcn@latest search <query>
npx shadcn@latest view <component-or-registry-item>
npx shadcn@latest add <component>
```

Rules:

1. Check installed components and project context first via `info --json`.
2. Read docs for every component you will use; do not rely on memory.
3. Prefer shadcn composition over custom wrappers.
4. Shared app patterns must be composed from shadcn primitives only.
5. No hardcoded visual values in TSX unless first tokenized in `app/globals.css`.
6. No inline visual styles for colors, spacing, radii, borders, shadows, or sizing in shared UI.

---

## Auth architecture

- JWT access token (1 h) + refresh token (7 d) stored in **HttpOnly cookies** (`token`, `refreshToken`).
- `PermissionsGuard` fetches permissions from DB **per request**; ADMIN bypasses entirely.
- Use `@RequirePermissions('module.action')` to gate endpoints.
- Frontend `baseQuery.ts` auto-refreshes on 401; second 401 dispatches `logout()`.

---

## API response envelope

All responses are wrapped:

```json
{ "success": true, "data": <payload>, "error": null }
```

`baseQuery.ts` unwraps this — RTK Query slices receive the inner `data` directly. Do not double-unwrap.

---

## Critical business logic conventions

- **No hard deletes** — always use `isActive`, `isArchived`, or equivalent soft flags.
- **State machines are server-side** — invalid transitions return 400. Lead stages, task statuses (TODO→IN_PROGRESS→IN_REVIEW→DONE with REVISION loop), contract statuses, deliverable statuses.
- **Every state change writes a history row** — `lead_pipeline_history`, `task_status_history`, `client_history_log`.
- **Multi-table operations** must use `prisma.$transaction()`.
- **Notifications** are written _after_ the core transaction commits; a notification failure must never roll back business data.
- Every business event creates two rows: one in `notification_events` and one in `notifications`.

---

## TypeScript strictness

Both `apps/api` and `apps/web` use `strict: false`, `strictNullChecks: false`, `noImplicitAny: false`. Do not add strict flags; match the existing lenient config.

---

## Testing

- Backend has Vitest scenario/e2e coverage under `apps/api/src/test/**`.
- Frontend currently has no dedicated test suite.
- For subagent work, prefer package-local `typecheck` and targeted tests.
- `npm run verify` is the repo-level lint/typecheck check, but do not treat it as a no-build subagent gate because Turbo may still run upstream build prerequisites.
- Run `turbo build` once at final integration confirmation when needed.

---

## Seed accounts (password: `password123`)

`admin@hassad.com`, `pm@hassad.com`, `sales@hassad.com`, `employee@hassad.com`, `marketing@hassad.com`, `accountant@hassad.com`, `client@hassad.com`

---

## Commit message format

```
fix(module): short description

Root cause: ...
Fix: ...
```
