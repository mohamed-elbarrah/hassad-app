# AGENTS.md — Hassad Platform

## Read first

| File | What it covers |
| --- | --- |
| `apps/api/src/app.module.ts` | Current backend module wiring. Inspect this before changing backend boundaries or registrations. |
| `apps/api/src/main.ts` | Backend bootstrap, global prefix, validation, CORS, and interceptors. |
| `apps/api/prisma/schema.prisma` | Current Prisma schema and database model source of truth. |
| `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md` | V2 workspace, screen, information, action, workflow, and approval-gate catalog. Read before any V2 planning or implementation. |
| `docs/V2_TEMPLATE_EXECUTION_RULES.md` | Mandatory V2 execution sequence, stop conditions, and doc routing. Read before any V2 template, design-system, or screen work. |
| `docs/V2_TAILADMIN_REFERENCE_AUDIT.md` | Rules for using `apps/free-nextjs-admin-dashboard-main` as a reference without copying its code or weak patterns. Read before using the reference template. |
| `docs/V2_DESIGN_SYSTEM_CONTRACT.md` | V2 tokens, density, component, layout, state, and screenshot rules. Read before creating or changing V2 UI patterns or screens. |
| `docs/V2_FRONTEND_ARCHITECTURE_CONTRACT.md` | V2 route, package, data, auth, permission, state, testing, and implementation-boundary rules. Read before creating V2 routes, features, data access, or app-shell code. |
| `.agents/skills/shadcn/SKILL.md` | Current shadcn composition and tooling rules. Read fully before any V2 UI work. |
| `packages/shared/src/` | Shared business enums, schemas, and types. Validate V2 contracts here and against the API. |

Always inspect the relevant sources before touching API, DB, or UI code. For V2, the relevant sources are approved product documents, shared business contracts, backend behavior, official framework documentation, and the new V2 package itself—not legacy frontend implementation. Validate assumptions because routes, modules, and behaviors can drift from older notes.

### Frontend V2 document routing

Use this routing before any V2 planning or implementation:

1. Read `docs/V2_TEMPLATE_EXECUTION_RULES.md` first. It defines the required order and stop conditions.
2. Read `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md` when deciding what workspaces, screens, workflows, commands, and states exist.
3. Read `docs/V2_TAILADMIN_REFERENCE_AUDIT.md` before using `apps/free-nextjs-admin-dashboard-main` for template inspiration.
4. Read `docs/V2_DESIGN_SYSTEM_CONTRACT.md` before designing or implementing shell, layout, shared patterns, tokens, or screens.
5. Read `docs/V2_FRONTEND_ARCHITECTURE_CONTRACT.md` before creating routes, features, data access, auth/session code, or app-shell code.
6. Read `.agents/skills/shadcn/SKILL.md`, use the shadcn MCP/CLI, and use Next DevTools docs before touching V2 code.

If these documents conflict, the priority is: execution rules, product catalog, architecture contract, design-system contract, reference audit, then implementation notes.

### Backend engineering standards (mandatory for `apps/api`)

- Treat NestJS, Prisma, and PostgreSQL as production infrastructure, not a place for quick fixes.
- Prefer clean module boundaries, explicit DTOs, transactions where needed, and clear error handling.
- Do not silence errors, bypass validation, or ship brittle one-off code just to make something pass.
- Preserve existing business rules, permissions, and state-machine behavior unless a change explicitly requires otherwise.
- Use Prisma migrations for schema changes and data changes.

### Backend presentation and localization contract (mandatory for `apps/api`)

- Backend-generated user-facing content must be English by default. Do not add Arabic hardcoded literals to API source files.
- Preserve user-generated content exactly as entered: names, comments, chat messages, proposal/project titles, notes, and client-provided text must not be translated or rewritten.
- Numbers in backend-generated text must always use Latin digits (`0-9`) without grouping separators. Use `formatPlainNumber` for numeric interpolation and avoid locale-dependent number formatting.
- Do not use `toLocale*`, `Intl.NumberFormat`, or locale-dependent date/number formatting in API presentation code. Use the centralized English date helpers or return raw ISO/numeric values.
- API errors must expose a stable `error.code`; frontend behavior must never parse English error messages. Add domain-specific codes through `ApiException` and document them in `docs/API_ERROR_CATALOG.md`.
- Notifications must use typed message keys and parameters through `createLocalizedNotification` or `notifyUsersWithMessage`. Keep event types, recipients, entity IDs, and metadata stable. Do not introduce new raw `createNotification`/`notifyUsers` call sites outside `NotificationsService`.
- Notification templates must keep dynamic user content as parameters. Do not translate user-provided parameter values.
- Localization must be additive: English remains the fallback, and future Arabic catalogs must not change business logic, event types, error codes, or numeric formatting rules.
- After changing API presentation, errors, or notifications, run package typecheck/build and the relevant tests; before completing a phase run the full API E2E suite and `git diff --check`.

### Frontend V2 engineering standards (mandatory for `apps/web-v2`)

- Treat Next.js App Router code as long-lived product code. Optimize for maintainability, readability, and predictable data flow.
- Use the `next-devtools` and `shadcn` MCP servers before touching frontend work, then use current shadcn primitives and the installed shadcn skill/docs before adding or changing UI.
- Prefer semantic tokens, reusable patterns, and clean composition over ad-hoc wrappers or inline visual styling.
- Do not ship UI that only "works". Ship code that is consistent with the approved V2 architecture and easy to extend.
- When a shared pattern is needed, compose it from shadcn primitives and keep the API small.
- Enable TypeScript strict mode from the first V2 commit. Do not inherit the legacy frontend's lenient compiler settings.
- Establish automated unit/component, integration, accessibility, and critical-flow end-to-end testing with the V2 foundation; absence of tests in the legacy app is not precedent.

### Frontend V2 clean-room boundary (mandatory)

- `apps/web` is the legacy frontend and remains available only until V2 replacement is complete. It is not a source of frontend architecture, UI, UX, components, tokens, layouts, copy, state management, data-access patterns, or tests.
- The planned V2 package is `apps/web-v2`. Do not create or scaffold it until the architecture and template foundation are explicitly approved.
- When a task says "frontend" without explicitly requesting a legacy hotfix, it means V2 planning or `apps/web-v2`, never new work in `apps/web`.
- Do not import, copy, move, adapt, or extend code from `apps/web` into V2. Shared business truth may come only from `packages/shared`, backend contracts, and approved product documents.
- Current route/page names may be used only as an inventory cross-check. Do not reuse current page content, information hierarchy, interaction design, visual composition, or navigation grouping.
- The legacy patterns `WorkspaceShell`, `PageHeader`, `PageSection`, `KpiGroup`, `DataTable`, `FilterToolbar`, `DetailHeader`, `DetailTabs`, `FormSection`, `ActivityTimeline`, and `StatusIndicator` are prohibited V2 dependencies. Do not import them, reproduce their APIs, or treat their names/composition as requirements.
- V2 must establish its own `components/ui` primitive source and global token/theme source inside `apps/web-v2` during the approved foundation phase.
- New V2 UI must be built from current shadcn primitives and semantic utilities/tokens only.
- Do not hardcode visual values in shared UI: no raw colors, borders, radii, shadows, spacing, sizing, or typography decisions in TSX unless tokenized first.
- Do not build shared UI with raw HTML if a shadcn primitive exists.
- Before any UI change: run shadcn context/docs commands and read the relevant component docs.
- If a page or feature needs a reusable pattern, compose it from shadcn primitives and keep the API small.
- Design and validate V2 in English and LTR first. Keep localization possible, but do not let legacy Arabic/RTL layout decisions shape the initial system.
- A legacy frontend change is allowed only when the user explicitly requests a legacy production hotfix. Keep it isolated and never use that work as V2 precedent.

---

## Tech stack

- **Monorepo**: npm workspaces + Turborepo. Node `>=20` required.
- **API** (`apps/api`): NestJS 11, TypeScript 5, Prisma 6, PostgreSQL 17.
- **Legacy Web** (`apps/web`): Current Next.js application retained temporarily; it has no V2 architecture or design authority.
- **Web V2** (`apps/web-v2`, planned): Next.js 16+ App Router, React 19+, Tailwind CSS 4, and current shadcn/ui. Confirm exact versions during foundation work. Select client state and server-data tooling from V2 requirements; do not inherit Redux Toolkit or RTK Query by default.
- **Shared** (`packages/shared`): `@hassad/shared` — enums, Zod schemas, and TS interfaces consumed by the API, legacy web, and future V2 where appropriate.

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
npx turbo run dev --filter=web        # legacy frontend only
npx turbo run build --filter=shared
```

V2 package commands are defined only after `apps/web-v2` is approved and scaffolded. Do not point existing `web` commands at V2 or replace the legacy package before cutover approval.

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
- Tasks touching `packages/shared` execute first because dependent applications consume it.
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

Copy `.env.example` → `.env` in `apps/api`. The existing `apps/web` environment is legacy-only; define and document a separate V2 environment contract when `apps/web-v2` is scaffolded.

**`apps/api/.env` required vars:**

```
DATABASE_URL=postgresql://hassad:hassad_dev_password@localhost:5432/hassad
JWT_SECRET=<random>
JWT_REFRESH_SECRET=<random>
```

**Legacy `apps/web/.env.local` required vars:**

```
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

Optional: `CLOUDFLARE_R2_*` (file uploads), `MOYASAR_API_KEY` (payments), `GEMINI_API_KEY` (AI module).

---

## Monorepo structure

```
apps/api/       NestJS REST API — global prefix /v1, port 3001
apps/web/       Legacy Next.js frontend retained until V2 cutover
apps/web-v2/    Planned clean-room Next.js frontend; does not exist until foundation approval
packages/shared @hassad/shared — shared enums, schemas, types
docker-compose.yml  PostgreSQL 17 only (no Docker images for apps)
.agents/        Agent spec docs (not runtime code)
docs/           Product, UX, and engineering planning documents
```

### API internals (`apps/api/src/`)

- `main.ts` — bootstrap: global `/v1` prefix, cookie-parser, CORS, `ValidationPipe(whitelist:true, forbidNonWhitelisted:true)`
- `app.module.ts` — wires the current application modules; inspect before changing module registration
- `common/` — global `ResponseInterceptor`, `HttpExceptionFilter`, `PermissionsGuard`, decorators
- `modules/` — grouped: `core/`, `crm/`, `proposals/`, `contracts/`, `projects/`, `tasks/`, `portal/`, `marketing/`, `finance/`, `chat/`, `notifications/`, `ai/`, `sales/`

### Legacy frontend (`apps/web/`)

- Treat the entire directory as a temporary, read-only product during V2 work.
- Do not read its implementation to decide V2 architecture or design. If route-name inventory is explicitly needed, inspect filenames only and validate the resulting screen against `docs/FRONTEND_V2_PRODUCT_SURFACE_CATALOG.md`.
- Do not add shared components, tokens, wrappers, abstractions, routes, or feature work there for V2.
- Do not copy its proxy, Redux store, RTK Query slices, base query, route groups, component APIs, or CSS into V2.

### V2 UI rules (`apps/web-v2/`) — mandatory

- The V2 package owns its primitives, tokens, route organization, application shell, feature boundaries, data-access layer, and tests.
- shadcn primitives inside V2 are the only primitive UI source once the package is scaffolded.
- The V2 global stylesheet is the only token/theme source once established; do not read or copy legacy `apps/web/app/globals.css`.
- Do not guess shadcn APIs, composition, theming, or variants.
- Do not build shared UI from hardcoded HTML and inline visual styling when a shadcn primitive exists.
- Before implementing any UI primitive or pattern, use the mandatory frontend MCP workflow below, read `.agents/skills/shadcn/SKILL.md`, and use current shadcn CLI/docs.

### Mandatory frontend MCP gate

The configured Codex MCP server names are `next-devtools` and `shadcn`. This gate applies to every task that reads, plans, reviews, diagnoses, changes, or validates V2 frontend work. It also applies to an explicitly requested legacy frontend hotfix.

Before touching frontend code:

1. Confirm both `next-devtools` and `shadcn` MCP servers are available in the current agent session.
2. Call `nextjs_docs` with the relevant topic and exact target project path before answering a Next.js question or writing Next.js code. Follow the version-matched documentation location returned by the tool. The current server does not expose an `init` tool; do not require or invent one.
3. Use `nextjs_docs` for every Next.js API, convention, routing, rendering, caching, configuration, or upgrade decision. If it reports that version-matched docs are unavailable, repair/install the target package dependencies when authorized or report the blocker; do not guess.
4. Call shadcn `get_project_registries`, then use `search_items_in_registries`, `view_items_in_registries`, and `get_item_examples_from_registries` as relevant before selecting or installing UI. Run `get_audit_checklist` after creating shared UI.
5. The shadcn MCP working directory must point to `apps/web-v2` and its own `components.json` before V2 component work begins. Results from legacy `apps/web/components.json` are forbidden as V2 evidence.
6. For implementation, runtime diagnosis, or verification, call `nextjs_index` first. When a Next.js 16+ development server is running, use `nextjs_call` for errors, logs, route metadata, and runtime state. Do not start or leak a dev server only to satisfy this gate; follow the background-process hygiene rules below whenever starting one is actually required.
7. Record the MCP evidence used in working commentary or the final handoff: documentation path, registry item/example, audit result, or runtime diagnostic.

If either MCP server is unavailable, fails to initialize, or exposes no required tools, **stop frontend work** and report the tooling blocker. The CLI and model memory may be used to diagnose the MCP installation, but they are not substitutes for this mandatory gate. Restart Codex after MCP configuration changes before resuming frontend work.

One-time V2 bootstrap exception: before `apps/web-v2/components.json` exists, shadcn registry tools cannot resolve the V2 project. After architecture approval, use the official shadcn CLI only to scaffold the approved V2 package and configuration, immediately point the shadcn MCP server at `apps/web-v2`, restart Codex, and pass this MCP gate before creating any template or product UI. Never bootstrap V2 from the legacy `apps/web/components.json`.

### Required shadcn workflow for every UI task

From `apps/web-v2/` run these before implementing UI:

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
5. No hardcoded visual values in TSX unless first tokenized in V2's own `app/globals.css`.
6. No inline visual styles for colors, spacing, radii, borders, shadows, or sizing in shared UI.

---

## Auth architecture

- JWT access token (1 h) + refresh token (7 d) stored in **HttpOnly cookies** (`token`, `refreshToken`).
- `PermissionsGuard` fetches permissions from DB **per request**; ADMIN bypasses entirely.
- Use `@RequirePermissions('module.action')` to gate endpoints.
- V2 must preserve the security behavior without copying the legacy implementation: perform one automatic refresh attempt after a 401, then clear authenticated client state and require login after a second 401.

---

## API response envelope

All responses are wrapped:

```json
{ "success": true, "data": <payload>, "error": null }
```

V2's typed API transport must unwrap this envelope exactly once. Feature code receives the inner `data`; do not copy the legacy `baseQuery.ts` or double-unwrap responses.

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

`apps/api` and legacy `apps/web` currently use lenient TypeScript settings. Preserve them unless a scoped task changes them. V2 must not inherit them: initialize `apps/web-v2` with strict TypeScript settings and keep strict checks enabled.

---

## Testing

- Backend has Vitest scenario/e2e coverage under `apps/api/src/test/**`.
- Legacy `apps/web` currently has no dedicated test suite; this is a known legacy limitation, not a V2 rule.
- V2 foundation must include automated tests and accessibility checks before dashboard implementation begins.
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
