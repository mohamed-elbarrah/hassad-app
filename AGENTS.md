# AGENTS.md — Hassad Platform

## Read first

| File | What it covers |
|---|---|
| `ROADMAP.md` | Full 7-phase improvement plan. Check this before making any change — your task may be part of a phase. |
| `.agent/NESTJS_API_V2.md` | Full API spec: module structure, all endpoints, permission keys, workflow rules. |
| `.agent/DATA_BASE_V2.md` | Prisma schema spec. **Stale** — actual schema has 50 models with payments, payroll, ledger, and bank accounts not in this doc. |
| `.agent/PROBLEM_SOLVING.md` | Required debugging protocol and commit message format. |

Always read the relevant `.agent/` spec before touching API or DB code. Validate spec claims against actual code — some endpoints/paths/methods differ.

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
turbo build              # build everything (shared → api/web)
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
npx prisma db push --skip-generate     # sync schema — use this, NOT migrate dev
npx prisma generate                    # rebuild Prisma client after schema changes
npx prisma db seed                     # seed dev data (ts-node, see below)
```

**Never run `prisma migrate dev`** — migration drift exists; `db push` is the correct workflow.

### Shared package
```bash
npm run build   # tsc → dist/  (must be built before api or web)
npm run watch   # tsc -w
```
Both apps have `predev`/`prebuild` scripts that build shared automatically. When working on shared in isolation, build it explicitly first.

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
.agent/         Agent spec docs (not runtime code)
features/       Feature planning markdown docs
```

### API internals (`apps/api/src/`)
- `main.ts` — bootstrap: global `/v1` prefix, cookie-parser, CORS, `ValidationPipe(whitelist:true, forbidNonWhitelisted:true)`
- `app.module.ts` — wires all 14 modules
- `common/` — global `ResponseInterceptor`, `HttpExceptionFilter`, `PermissionsGuard`, decorators
- `modules/` — grouped: `core/`, `crm/`, `proposals/`, `contracts/`, `projects/`, `tasks/`, `portal/`, `marketing/`, `finance/`, `chat/`, `notifications/`, `ai/`, `sales/`

### Web internals (`apps/web/`)
- `app/(dashboard)/` — auth-protected; sub-routes per role: `sales/`, `pm/`, `employee/`, `marketing/`, `accountant/`, `admin/`
- `app/(portal)/` — client portal
- `app/contract/[token]` and `app/proposal/[token]` — public token-based share pages
- `features/<domain>/` — RTK Query API slices (not in `lib/`)
- `lib/store.ts` — Redux store; `lib/baseQuery.ts` — shared base query with envelope unwrap + auto token refresh
- **No `middleware.ts` exists** — auth is handled client-side in layouts. Edge guard needs to be added (see ROADMAP Phase 0).
- Path alias `@/*` maps to the root of `apps/web/` (not `src/`)

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
- **Notifications** are written *after* the core transaction commits; a notification failure must never roll back business data.
- Every business event creates two rows: one in `notification_events` and one in `notifications`.

---

## TypeScript strictness

Both `apps/api` and `apps/web` use `strict: false`, `strictNullChecks: false`, `noImplicitAny: false`. Do not add strict flags; match the existing lenient config.

---

## No test suite

There are no tests anywhere in this repo — no jest, no vitest, no test scripts. Verify changes by running `turbo build` and manual inspection.

---

## Seed accounts (password: `password123`)

`admin@hassad.com`, `pm@hassad.com`, `sales@hassad.com`, `employee@hassad.com`, `marketing@hassad.com`, `accountant@hassad.com`, `client@hassad.com`

---

## Commit message format (from `.agent/PROBLEM_SOLVING.md`)

```
fix(module): short description

Root cause: ...
Fix: ...
```
