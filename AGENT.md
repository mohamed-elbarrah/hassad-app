# AGENT.md — Hassad Platform Master Instructions

> This file is the entry point for every agent working on the Hassad platform.
> Read this file first, then read the skill file(s) relevant to your task.

---

## Project Overview

**Hassad** is a full-stack SaaS platform for marketing agencies.
It covers: CRM & Sales Pipeline → Project Management → Client Portal → Finance → Marketing Campaigns → AI layer.

**Monorepo structure:**
```
hassad/
├── apps/
│   ├── web/          ← Next.js (App Router) — internal dashboard + client portal
│   └── api/          ← NestJS — REST API
├── packages/
│   └── shared/       ← Shared TypeScript types, Zod schemas, Enums
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Tech Stack (locked — do not deviate)

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js, App Router, TypeScript, Tailwind CSS, shadcn/ui | **16.2** |
| State | Redux Toolkit + RTK Query | **2.x** |
| Forms | React Hook Form + Zod | RHF **7.x** · Zod **4.x** |
| Form Resolvers | @hookform/resolvers | **5.x** |
| React | React | **19.x** |
| Backend | NestJS, TypeScript | **11.x** |
| ORM | Prisma | **6.x** |
| Database | PostgreSQL | **17** (Docker only) |
| File Storage | Cloudflare R2 (S3-compatible) | — |
| Auth | JWT + Refresh Token | — |
| Payments | Moyasar | — |
| Monorepo | Turborepo | latest |

> ⚠️ **Prisma v7 is NOT used** — it ships as ESM-only with breaking changes and no MongoDB support yet. Stay on v6.

> ⚠️ **React Hook Form v8 is NOT used** — still in beta. Use v7 only.

---

## Development Environment Setup

### Database: Docker only (never install PostgreSQL directly on the machine)

```yaml
# docker-compose.yml — monorepo root
version: '3.9'
services:
  postgres:
    image: postgres:17-alpine
    container_name: hassad_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: hassad
      POSTGRES_PASSWORD: hassad_dev_password
      POSTGRES_DB: hassad
    ports:
      - "5432:5432"
    volumes:
      - hassad_pgdata:/var/lib/postgresql/data  # named volume = survives container deletion

volumes:
  hassad_pgdata:
    driver: local
```

**Key rules for the DB container:**
- The `hassad_pgdata` named volume persists data even if the container is deleted or recreated
- To start: `docker compose up -d postgres`
- To back up: `docker exec hassad_db pg_dump -U hassad hassad > backup.sql`
- To restore: `cat backup.sql | docker exec -i hassad_db psql -U hassad hassad`
- Never use a bind mount (`./data:/var/lib/...`) for DB storage — named volumes are the standard

### Running apps: directly on the host (not in Docker during development)

```bash
# 1. Start only the DB container
docker compose up -d postgres

# 2. Run the apps locally with hot reload
cd apps/api && npm run start:dev    # NestJS on port 3001
cd apps/web && npm run dev          # Next.js on port 3000 (Turbopack)
```

Frontend and backend are **never** run inside Docker during development. Only the database container runs. Docker for the apps is only used for production deployment.

---

## Roles & Access Levels

Every feature you build must respect this role matrix:

| Role | Identifier | Access Scope |
|---|---|---|
| Super Admin | `ADMIN` | Everything |
| Project Manager | `PM` | Own projects only |
| Sales | `SALES` | CRM, proposals, contracts |
| Executive Employee | `EMPLOYEE` | Own tasks only |
| Marketing Manager | `MARKETING` | Campaigns, KPIs |
| Accountant | `ACCOUNTANT` | Invoices, contracts (financial view) |
| Client | `CLIENT` | Client portal section only |

**Rule:** Never expose data across role boundaries. When in doubt, restrict.

---

## Client Portal: Route Groups (no domain separation during development)

The client portal lives inside the **same Next.js app** as the dashboard. They are separated by route groups, not by domain or middleware hostname checks. This keeps local development simple.

```
apps/web/app/
├── (dashboard)/       ← internal roles (ADMIN, PM, SALES, EMPLOYEE, etc.)
│   └── layout.tsx     ← verifies token + role, redirects non-internal users
└── (portal)/          ← CLIENT role only
    └── layout.tsx     ← verifies token + CLIENT role, redirects others
```

Both sections are accessible on `localhost:3000` during development:
- `localhost:3000/dashboard/...` → internal app
- `localhost:3000/portal/...` → client portal

---

## Available Skill Files

Before starting any task, read the relevant skill file:

| Task Type | Skill File |
|---|---|
| Frontend work (UI, pages, components, forms) | `FRONTEND_SKILL.md` |
| Backend work (APIs, modules, DB, business logic) | `BACKEND_SKILL.md` |
| Debugging or fixing a bug | `PROBLEM_SOLVING.md` |

---

## Non-Negotiable Rules (apply to ALL agents)

1. **Never mix concerns** — frontend logic stays in frontend, business logic stays in backend.
2. **Never hardcode values** — use environment variables for URLs, keys, model names, etc.
3. **Never skip types** — `any` is forbidden unless explicitly justified with a comment.
4. **Never write a fix without understanding the root cause** — see `PROBLEM_SOLVING.md`.
5. **Never create files outside the defined folder structure** — see skill files.
6. **Always use the shared package** for types and enums used by both apps.
7. **Always validate on both sides** — Zod on frontend (forms), class-validator on backend (DTOs).
8. **Always check role permissions** before implementing any API endpoint or UI component.
9. **Commit messages must be descriptive** — `fix: invoice status not updating after Moyasar webhook` not `fix bug`.
10. **When a task is ambiguous — stop and ask** rather than guessing and building wrong.

---

## Development Phases (reference)

| Phase | Focus | Duration |
|---|---|---|
| Foundation | Monorepo setup, Prisma schema, shared types, Docker DB | 3–5 days |
| Phase 1 | Auth + RBAC | 5–7 days |
| Phase 2 | CRM + Sales Pipeline | 10–14 days |
| Phase 3 | Project Management + Tasks | 10–14 days |
| Phase 4 | Client Portal | 7–10 days |
| Phase 5 | Finance + Contracts | 7–10 days |
| Phase 6A | Marketing dashboard (manual KPIs) | 7–10 days |
| Phase 6B | Ad platform API integrations | Later |
| Phase 6C | AI layer | After 3 months of real data |

**Do not jump phases.** Each phase has a completion gate defined in the development plan.

---

## Environment Variables Convention

All env vars must be defined in `.env.example` before use.

```bash
# apps/api/.env
DATABASE_URL="postgresql://hassad:hassad_dev_password@localhost:5432/hassad"
JWT_SECRET=
JWT_REFRESH_SECRET=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ENDPOINT=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
MOYASAR_API_KEY=
PORT=3001

# AI (Phase 6C only)
GEMINI_MODEL=gemini-2.5-flash

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```
