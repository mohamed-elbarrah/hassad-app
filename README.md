# Hassad Platform

Hassad is a request-first monorepo for agency sales, delivery, portal, finance, chat, and notifications. The current implementation treats `Request` as the primary business record across the database, API, and web app. `Lead` still exists, but only as an internal CRM object for sales handling.

This README reflects the current architecture after the request-first alignment pass.

## Request-First Model

- `Client` is the canonical customer identity.
- `Request` is the canonical pre-contract work item.
- `Lead` is optional and internal; it can mirror sales qualification for a request, but it is not the source of truth.
- `Proposal` and `Contract` flows are linked through `requestId`.
- A signed contract creates the real execution `Project`.
- `Project.requestId` is one-to-one. If legacy data contains multiple contract or project branches for one old lead, those branches must be split into sibling requests during backfill.
- Before contract signing, the portal shows the item as `طلب قيد الانتظار`.
- After signing, the client tracks the real project, deliverables, invoices, contracts, and campaign progress.

## Core Lifecycle

```mermaid
flowchart LR
    A[Client identity resolved to canonical Client]
    B[Request created]
    C[Sales qualification and optional internal Lead handling]
    D[Proposal created and reviewed]
    E[Contract prepared and signed]
    F[Execution Project created]
    G[Tasks, deliverables, campaigns, invoices, notifications]
    H[Client tracks progress in portal]

    A --> B --> C --> D --> E --> F --> G --> H
```

### Workflow rules

1. A client can create many requests.
2. A request belongs to exactly one client.
3. A request can attach to one internal lead for CRM handling.
4. A request can have multiple proposals and contract revisions over time.
5. A signed contract creates one execution project for that request.
6. A project remains execution-only; it must not be used to represent pre-contract work.
7. Sales owns the pre-contract phase. PM ownership starts after the signed-contract handoff.

## Current Web and API Surfaces

| Area                 | Primary surface                                                   | Notes                                                                                                             |
| -------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Sales UI             | `/dashboard/sales/requests/new`, `/dashboard/sales/requests/[id]` | These are the owning pages for intake and detail views.                                                           |
| Legacy sales aliases | `/dashboard/sales/leads/new`, `/dashboard/sales/leads/[id]`       | These routes remain only as compatibility re-exports to the request pages. New work should target request routes. |
| Portal UI            | `/portal/requests`, `/portal/projects`, `/portal/actions`         | Pending requests, live projects, and client action items are separate first-class portal surfaces.                |
| Public client flows  | `/proposal/[token]`, `/contract/[token]`                          | Token-based proposal review and contract signing.                                                                 |
| API                  | `/v1/requests`, `/v1/proposals`, `/v1/contracts`, `/v1/portal/*`  | Responses are wrapped as `{ success, data, error }`; the frontend base query unwraps `data`.                      |

## Monorepo Layout

```text
hassad-platform/
├── apps/
│   ├── api/        NestJS 11 API + Prisma 6 + PostgreSQL 17
│   └── web/        Next.js 16 App Router dashboard + portal
├── packages/
│   └── shared/     Shared enums, schemas, and TypeScript types
├── features/       Workflow and planning documents
├── .agent/         API and schema reference documents
├── ROADMAP.md
├── workflow-a-to-z.md
└── system-improvement.md
```

## Tech Stack

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Monorepo       | npm workspaces + Turborepo                                 |
| API            | NestJS 11, TypeScript 5, Prisma 6                          |
| Web            | Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui |
| State          | Redux Toolkit + RTK Query                                  |
| Database       | PostgreSQL 17                                              |
| Auth           | JWT access token + refresh token in HttpOnly cookies       |
| Real-time      | Socket.IO for chat and notifications                       |
| Shared package | `@hassad/shared`                                           |

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment files

Copy the examples:

- `apps/api/.env.example` -> `apps/api/.env`
- `apps/web/.env.example` -> `apps/web/.env.local`

Minimum API settings:

```env
DATABASE_URL=postgresql://hassad:hassad_dev_password@localhost:5432/hassad
JWT_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me-too
```

Minimum web settings:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
JWT_SECRET=must-match-api-jwt-secret
```

Notes:

- `apps/web/proxy.ts` verifies JWTs at the edge when `JWT_SECRET` is configured.
- Cloudflare R2, Moyasar, email, OAuth, and Gemini settings are optional depending on the flows you are exercising.

### 3. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 4. Push schema and generate Prisma client

Run from `apps/api`:

```bash
npx prisma db push --skip-generate
npx prisma generate
```

Important:

- Do not run `prisma migrate dev` in this repo.
- The supported workflow is `prisma db push`.

### 5. Seed development data

Run from `apps/api`:

```bash
npx prisma db seed
```

### 6. Backfill request lineage for existing databases

If your database contains data from before the request-first cutover, run this from `apps/api` after `db push` and `generate`:

```bash
npm run backfill:requests
```

This script normalizes legacy request, lead, proposal, contract, and project lineage so downstream records are linked by `requestId`. It also handles the legacy case where one lead produced multiple contract or project branches by creating sibling requests instead of violating the one-project-per-request rule.

### 7. Start the apps

From the repo root:

```bash
npm run dev
```

Default URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/v1`

## Useful Commands

### Repo root

```bash
npm run dev
npm run build
npm run format
npx turbo run dev --filter=api
npx turbo run dev --filter=web
npx turbo run build --filter=api --filter=web
```

### Shared package

```bash
npm --prefix packages/shared run build
npm --prefix packages/shared run watch
```

### API

Run from `apps/api`:

```bash
npx prisma db push --skip-generate
npx prisma generate
npx prisma db seed
npm run backfill:requests
npm run backfill:create-projects
npm run dev
```

## Validation Workflow

There is currently no automated test suite in this repository. Validation is done through targeted database checks, manual flow verification, and builds.

Recommended validation flow after pulling major changes:

1. `npx prisma db push --skip-generate`
2. `npx prisma generate`
3. `npm run backfill:requests` if the database predates the request-first model
4. `npx turbo run build --filter=api --filter=web`
5. Manually verify the main flows:
   - portal request creation
   - sales request review
   - proposal creation from request
   - contract creation/signing from request
   - project creation after signing
   - portal visibility for pending requests, projects, invoices, contracts, and action items

## Engineering Rules That Matter

- Treat `Request` as the source of truth for pre-contract work.
- Do not build new primary workflows around `Lead`.
- Keep `Client` canonical; avoid creating duplicate client rows through parallel flows.
- Do not create execution `Project` records before contract signing.
- Preserve the one-project-per-request invariant.
- Keep history tables updated for workflow transitions.
- Do not hard-delete business data.
- Notification failures must not roll back the core business transaction.

## Seed Accounts

Password for all seeded users:

```text
password123
```

Available accounts:

- `admin@hassad.com`
- `pm@hassad.com`
- `sales@hassad.com`
- `employee@hassad.com`
- `marketing@hassad.com`
- `accountant@hassad.com`
- `client@hassad.com`

## Documentation Map

- `workflow-a-to-z.md`: approved business workflow from request intake to completed project
- `system-improvement.md`: system review, gaps, and target architecture rationale
- `ROADMAP.md`: phased implementation and follow-up plan
- `AGENTS.md`: repository-specific operating rules for contributors and agents
- `.agent/NESTJS_API_V2.md`: API reference and endpoint conventions
- `.agent/DATA_BASE_V2.md`: schema reference notes; validate against the actual Prisma schema because this file is partly stale

## Summary

The current platform is not lead-first anymore. The stable lifecycle is:

`Client -> Request -> Proposal -> Contract -> Signed Project -> Delivery/Finance/Portal`

If you are extending the system, start from that assumption and wire new behavior through `requestId` unless the feature is explicitly internal CRM detail.
