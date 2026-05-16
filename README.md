# Hassad Platform

A marketing agency management platform that handles the complete client lifecycle — from sales and project execution through campaign intelligence and financial operations.

Built as a monorepo with **NestJS 11 API**, **Next.js 16 web application**, **PostgreSQL 17**, and a shared TypeScript package consumed by both apps.

---

## System Overview

The platform is used by seven types of users and connects to external services for payments, storage, ads, and notifications.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {'background':'#ffffff','primaryColor':'#f1f5f9','primaryBorderColor':'#64748b','primaryTextColor':'#1e293b','secondaryColor':'#f8fafc','secondaryBorderColor':'#cbd5e1','secondaryTextColor':'#475569','tertiaryColor':'#f0fdf4','tertiaryBorderColor':'#22c55e','tertiaryTextColor':'#166534','lineColor':'#94a3b8','fontSize':'13px','fontFamily':'system-ui'}}}%%
flowchart TB
  classDef team fill:#f1f5f9,stroke:#94a3b8,stroke-width:1px,color:#334155
  classDef platform fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af
  classDef sub fill:#f8fafc,stroke:#cbd5e1,stroke-width:1px,color:#475569
  classDef external fill:#fef2f2,stroke:#ef4444,stroke-width:1px,color:#991b1b

  subgraph Internal["🏢 Internal Team"]
    U1["🛡️ Admin"]
    U2["💼 Sales"]
    U3["📋 PM"]
    U4["👨‍🎨 Employee"]
    U5["📢 Marketing"]
    U6["💰 Finance"]
  end

  subgraph Platform["⚙️ Hassad Platform"]
    WEB["Web Application<br/>Next.js 16 · React 19"]
    API["API Server<br/>NestJS 11 · REST + WebSocket"]
    DB["Database<br/>PostgreSQL 17"]
  end

  subgraph External["🌐 External Services"]
    ADS["Ad Platforms<br/>Meta, Google, TikTok"]
    PAY["Payment Gateway<br/>Moyasar"]
    STORAGE["Cloud Storage<br/>Cloudflare R2"]
    CHAT["WebSockets<br/>Real-time"]
  end

  U1 -.-> WEB
  U2 -.-> WEB
  U3 -.-> WEB
  U4 -.-> WEB
  U5 -.-> WEB
  U6 -.-> WEB

  WEB <--> API
  API <--> DB
  API <--> ADS
  API <--> PAY
  API <--> STORAGE
  API <--> CHAT

  CLIENT["👤 Client<br/>Portal only"]
  CLIENT -.-> WEB

  class Internal team
  class Platform platform
  class WEB,API,DB sub
  class External external
  class CLIENT team
```

> Dashed lines = user access | Solid lines = system integration

---

## Client-Centered Process Flow

The client is at the center of every process. A new request from the client triggers the entire workflow. Each department operates within its own domain, handling specific processes and handing off to other departments when needed.

### Master Flow — All Departments & Handoffs

Each colored block is a department. Internal processes stay inside. Arrows that leave a block represent handoffs — work moving to another department or back to the client.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {'background':'#ffffff','primaryColor':'#f1f5f9','primaryBorderColor':'#64748b','primaryTextColor':'#1e293b','secondaryColor':'#f8fafc','secondaryBorderColor':'#cbd5e1','secondaryTextColor':'#475569','lineColor':'#94a3b8','fontSize':'12px','fontFamily':'system-ui','clusterBkg':'#fafafa','clusterBorder':'#e2e8f0'}}}%%
flowchart TD
  classDef client fill:#f1f5f9,stroke:#64748b,color:#1e293b,stroke-width:3px
  classDef clientStep fill:#f8fafc,stroke:#94a3b8,color:#334155,stroke-width:1px
  classDef sales fill:#dbeafe,stroke:#3b82f6,color:#1e40af,stroke-width:2px
  classDef salesStep fill:#eff6ff,stroke:#93c5fd,color:#1e40af,stroke-width:1px
  classDef pm fill:#dcfce7,stroke:#22c55e,color:#166534,stroke-width:2px
  classDef pmStep fill:#f0fdf4,stroke:#86efac,color:#166534,stroke-width:1px
  classDef emp fill:#fed7aa,stroke:#f97316,color:#9a3412,stroke-width:2px
  classDef empStep fill:#fff7ed,stroke:#fdba74,color:#9a3412,stroke-width:1px
  classDef mkt fill:#e9d5ff,stroke:#a855f7,color:#5b21b6,stroke-width:2px
  classDef mktStep fill:#f3e8ff,stroke:#c084fc,color:#5b21b6,stroke-width:1px
  classDef fin fill:#fecaca,stroke:#ef4444,color:#991b1b,stroke-width:2px
  classDef finStep fill:#fef2f2,stroke:#fca5a5,color:#991b1b,stroke-width:1px
  classDef handoff fill:#fef3c7,stroke:#d97706,color:#92400e,stroke-width:2px,stroke-dasharray:5 3

  subgraph CL["👤 CLIENT — Request & Review"]
    direction TB
    CR["1. Submit New Request"]:::clientStep
    RP["2. Review Proposal"]:::clientStep
    SC["3. Sign Contract"]:::clientStep
    PI["4. Pay Invoice"]:::clientStep
    RD["5. Review Deliverables"]:::clientStep

    CR --> RP
    RP -->|"Approve"| SC
    RP -->|"Request Revision"| RP
    SC --> PI
    PI --> RD
    RD -->|"Approve ✓"| DONE["✅ Completed"]:::clientStep
    RD -->|"Request Revision"| RD
  end

  subgraph SL["💼 SALES — Pipeline & Contracting"]
    direction TB
    SR["Receive Request"]:::salesStep
    PIP["Pipeline Stages<br/>1 → 2 → 3 → 4 → 5<br/>→ 6 → 7 → 8 → 9"]:::salesStep
    CP["Create Proposal"]:::salesStep
    CC["Create Contract"]:::salesStep
    HANDOFF["▶ Handoff to PM"]:::salesStep

    SR --> PIP
    PIP --> CP
    CP -->|"Send to Client"| CW{"Client<br/>Response"}:::salesStep
    CW -->|"Approved"| CC
    CW -->|"Revision"| CP
    CW -->|"Rejected"| LOST["❌ Lost"]:::salesStep
    CC -->|"Send to Client"| CS{"Client<br/>Signs?"}:::salesStep
    CS -->|"Yes"| HANDOFF
    CS -->|"No"| FOLLOWUP["Follow Up"]:::salesStep
    FOLLOWUP --> CS
  end

  subgraph PM["📋 PROJECT MANAGER — Task Management"]
    direction TB
    PRJ["Receive Project"]:::pmStep
    CT["Create Tasks<br/>from contract services"]:::pmStep
    RV["Review Completed Work"]:::pmStep
    SENDD["Submit to Client"]:::pmStep
    CAMPREQ["Request Campaign<br/>(if marketing needed)"]:::pmStep

    PRJ --> CT
    CT -->|"Assign tasks"| EXEC{"Employees<br/>working"}:::pmStep
    EXEC -->|"Submitted ✓"| RV
    RV -->|"Approve"| SENDD
    RV -->|"Send back"| EXEC
    SENDD --> CMP{"Client<br/>Approves?"}:::pmStep
    CMP -->|"Yes"| TASKDONE["✅ Task Complete"]:::pmStep
    CMP -->|"Revision"| EXEC
    PRJ --> CAMPREQ
  end

  subgraph EM["👨‍🎨 EMPLOYEE — Task Execution"]
    direction TB
    TR["Task Assigned<br/>TODO"]:::empStep
    START["Start Work<br/>IN PROGRESS"]:::empStep
    SUBMIT["Submit for Review<br/>IN REVIEW"]:::empStep
    FIX["Revise<br/>REVISION"]:::empStep
    DONE2["✅ DONE"]:::empStep

    TR --> START
    START --> SUBMIT
    SUBMIT --> DONE2
    SUBMIT --> FIX
    FIX --> SUBMIT
  end

  subgraph MK["📢 MARKETING — Campaigns"]
    direction TB
    MCR["Receive Campaign Request"]:::mktStep
    MCP["Create Campaign<br/>PLANNING"]:::mktStep
    MCA["Activate<br/>ACTIVE"]:::mktStep
    MCM["Monitor KPIs"]:::mktStep
    MCRPT["Generate Report"]:::mktStep

    MCR --> MCP
    MCP --> MCA
    MCA --> MCM
    MCM --> MCRPT
  end

  subgraph FN["💰 FINANCE — Invoicing & Payments"]
    direction TB
    FI["Receive Contract<br/>→ Create Invoice"]:::finStep
    FS["Send to Client"]:::finStep
    FP["Record Payment<br/>PAID / PARTIAL"]:::finStep
    FL["Late Alert"]:::finStep
    FLEDGER["Update Ledger"]:::finStep
    FPR["Run Payroll"]:::finStep

    FI --> FS
    FS --> FWP{"Payment?"}:::finStep
    FWP -->|"Yes"| FP
    FWP -->|"Overdue"| FL
    FL --> FS
    FP --> FLEDGER
    FLEDGER --> FPR
  end

  CR -.->|"① New Request":::handoff| SR
  CP -.->|"② Proposal":::handoff| RP
  CC -.->|"③ Contract":::handoff| SC
  HANDOFF -.->|"④ Project":::handoff| PRJ
  SENDD -.->|"⑦ Deliverables":::handoff| RD
  CAMPREQ -.->|"⑥ Campaign":::handoff| MCR
  MCRPT -.->|"Reports":::handoff| RD
  PI -.->|"⑤ Payment":::handoff| FI

  CMP -.->|"← Approve/Revise":::handoff| RD
  CS -.->|"← Signed":::handoff| SC
  CW -.->|"← Approve":::handoff| RP

  CT -.->|"Assign tasks":::handoff| TR
  DONE2 -.->|"Submit work":::handoff| EXEC

  class CL client
  class SL sales
  class PM pm
  class EM emp
  class MK mkt
  class FN fin
```

#### Handoff Summary

| #  | Handoff         | From → To            | What triggers it                                  |
|----|-----------------|----------------------|---------------------------------------------------|
| ①  | New Request     | Client → Sales       | Client submits intake form via portal             |
| ②  | Proposal        | Sales → Client       | Sales sends shareable proposal link               |
| ③  | Contract        | Sales → Client       | Sales sends shareable contract link               |
| ④  | Project         | Sales → PM           | System auto-creates project after contract signed |
| ⑤  | Payment         | Client → Finance     | Client pays invoice (online or manual)            |
| ⑥  | Campaign request| PM → Marketing       | PM adds marketing team member → auto-task created |
| ⑦  | Deliverables    | PM → Client          | PM approves task → deliverable visible in portal  |

### Client — State Machine

The client has four interaction points in the lifecycle. Each follows a defined workflow with approval/revision loops.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {'background':'#ffffff','primaryColor':'#f8fafc','primaryBorderColor':'#64748b','primaryTextColor':'#1e293b','secondaryColor':'#f1f5f9','secondaryBorderColor':'#94a3b8','secondaryTextColor':'#475569','tertiaryColor':'#fef3c7','tertiaryBorderColor':'#d97706','tertiaryTextColor':'#92400e','lineColor':'#94a3b8','fontSize':'14px','fontFamily':'system-ui'}}}%%
stateDiagram-v2
  [*] --> REQUEST_SUBMITTED : Client submits new request
  REQUEST_SUBMITTED --> REVIEWING_PROPOSAL : Sales sends proposal
  REVIEWING_PROPOSAL --> APPROVED : Client approves ✓
  REVIEWING_PROPOSAL --> REVISION_REQUESTED : Client requests changes
  REVISION_REQUESTED --> REVIEWING_PROPOSAL : Sales revises & resends
  APPROVED --> SIGNING_CONTRACT : Sales sends contract
  SIGNING_CONTRACT --> SIGNED : Client signs ✓
  SIGNING_CONTRACT --> CANCELLED : Client rejects
  SIGNED --> PAYING_INVOICE : Finance sends invoice
  PAYING_INVOICE --> PAID : Client pays ✓
  PAYING_INVOICE --> LATE : Overdue
  LATE --> PAYING_INVOICE : Client pays after reminder
  PAID --> REVIEWING_DELIVERABLE : PM submits work
  REVIEWING_DELIVERABLE --> ACCEPTED : Client approves ✓
  REVIEWING_DELIVERABLE --> REVISION : Client requests changes
  REVISION --> REVIEWING_DELIVERABLE : PM sends revised work
  ACCEPTED --> [*] : Satisfaction rating
```

### Sales Pipeline — All Possible Paths

Sales handles every path the client's request can take. The pipeline advances forward; proposals and contracts have approval/revision loops.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {'background':'#ffffff','primaryColor':'#eff6ff','primaryBorderColor':'#3b82f6','primaryTextColor':'#1e40af','secondaryColor':'#f8fafc','secondaryBorderColor':'#cbd5e1','secondaryTextColor':'#475569','tertiaryColor':'#fef3c7','tertiaryBorderColor':'#d97706','tertiaryTextColor':'#92400e','lineColor':'#94a3b8','fontSize':'14px','fontFamily':'system-ui'}}}%%
stateDiagram-v2
  [*] --> REQUEST_RECEIVED : Client submits request

  REQUEST_RECEIVED --> PIPELINE : Sales qualifies request

  PIPELINE --> PROPOSAL_SENT : Sales creates & sends proposal

  PROPOSAL_SENT --> APPROVED : Client approves ✓
  PROPOSAL_SENT --> REVISION_REQUESTED : Client wants changes
  PROPOSAL_SENT --> REJECTED : Client declines ❌

  REVISION_REQUESTED --> PROPOSAL_SENT : Sales revises & resends

  APPROVED --> CONTRACT_SENT : Sales creates contract

  CONTRACT_SENT --> SIGNED : Client signs ✓
  CONTRACT_SENT --> CANCELLED : Client cancels / rejects

  SIGNED --> [*] : Contract signed → Project auto-created

  REJECTED --> [*] : Lead lost
  CANCELLED --> [*] : Deal cancelled
```

### PM & Employee — Task Management Cycle

The PM creates tasks from contract services and assigns them. Employees execute and submit. Tasks cycle between execution and review until approved.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {'background':'#ffffff','primaryColor':'#f0fdf4','primaryBorderColor':'#22c55e','primaryTextColor':'#14532d','tertiaryColor':'#fef3c7','tertiaryBorderColor':'#d97706','tertiaryTextColor':'#92400e','lineColor':'#94a3b8','fontSize':'14px','fontFamily':'system-ui'}}}%%
stateDiagram-v2
  [*] --> PROJECT_RECEIVED : Contract signed

  PROJECT_RECEIVED --> TASKS_CREATED : PM creates tasks from services
  TASKS_CREATED --> TASKS_ASSIGNED : PM assigns to employees

  TASKS_ASSIGNED --> IN_PROGRESS : Employee starts
  IN_PROGRESS --> IN_REVIEW : Employee submits for review

  IN_REVIEW --> APPROVED : PM approves ✓
  IN_REVIEW --> REVISION : PM sends back for changes
  REVISION --> IN_PROGRESS : Employee revises & resubmits

  APPROVED --> DELIVERABLE_SENT : Deliverable visible to client

  DELIVERABLE_SENT --> CLIENT_APPROVED : Client approves ✓
  DELIVERABLE_SENT --> CLIENT_REVISION : Client requests changes
  CLIENT_REVISION --> TASKS_ASSIGNED : PM creates revision task

  CLIENT_APPROVED --> [*] : Task complete
  APPROVED --> [*] : Deliverable closed
```

### Marketing — Campaigns

Marketing runs campaigns and sends reports to the client.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {'background':'#ffffff','primaryColor':'#f3e8ff','primaryBorderColor':'#a855f7','primaryTextColor':'#5b21b6','lineColor':'#94a3b8','fontSize':'13px','fontFamily':'system-ui'}}}%%
stateDiagram-v2
  [*] --> CAMPAIGN_REQUESTED : PM requests campaign
  CAMPAIGN_REQUESTED --> PLANNING : Marketing creates campaign
  PLANNING --> ACTIVE : Campaign launched
  ACTIVE --> KPIS_TRACKED : Metrics collected daily
  KPIS_TRACKED --> REPORT_SENT : Report sent to client
  KPIS_TRACKED --> PLANNING : A/B test suggests changes
  ACTIVE --> COMPLETED : Campaign ends
  COMPLETED --> [*] : Final report delivered
```

### Finance — Invoicing & Payments

Finance handles invoicing, payment tracking, and payroll.

```mermaid
%%{init: {'theme':'base', 'themeVariables': {'background':'#ffffff','primaryColor':'#fef2f2','primaryBorderColor':'#ef4444','primaryTextColor':'#991b1b','lineColor':'#94a3b8','fontSize':'13px','fontFamily':'system-ui'}}}%%
stateDiagram-v2
  [*] --> INVOICE_CREATED : Contract signed
  INVOICE_CREATED --> SENT : Finance sends to client
  SENT --> PAID : Client pays ✓
  SENT --> PARTIAL : Client pays partially
  SENT --> LATE : Overdue (no payment)
  LATE --> SENT : Finance sends reminder
  PARTIAL --> PAID : Remaining paid ✓
  PARTIAL --> LATE : Remaining overdue
  PAID --> LEDGER_UPDATED : Transaction recorded
  LEDGER_UPDATED --> PAYROLL_RUN : Monthly cycle
  PAYROLL_RUN --> [*] : Salaries processed
```

---

## Tech Stack

| Layer          | Technology                                                 |
|----------------|------------------------------------------------------------|
| Monorepo       | npm workspaces + Turborepo                                 |
| API            | NestJS 11, TypeScript 5, Prisma 6                          |
| Web            | Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui |
| State          | Redux Toolkit + RTK Query                                  |
| Database       | PostgreSQL 17                                              |
| Auth           | JWT access token + refresh token in HttpOnly cookies       |
| Real-time      | Socket.IO for chat and notifications                       |
| Shared package | `@hassad/shared` — enums, Zod schemas, types               |

## Monorepo Layout

```
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

## Request-First Model

- **Client** is the canonical customer identity.
- **Request** is the canonical pre-contract work item.
- **Lead** is optional and internal; it mirrors sales qualification for a request but is not the source of truth.
- **Proposal** and **Contract** flows are linked through `requestId`.
- A signed contract creates the real execution **Project**.
- `Project.requestId` is one-to-one.
- Before contract signing, the portal shows the item as `طلب قيد الانتظار`.
- After signing, the client tracks the real project, deliverables, invoices, contracts, and campaign progress.

### Core Lifecycle

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

### Workflow Rules

1. A client can create many requests.
2. A request belongs to exactly one client.
3. A request can attach to one internal lead for CRM handling.
4. A request can have multiple proposals and contract revisions over time.
5. A signed contract creates one execution project for that request.
6. A project remains execution-only; it must not be used to represent pre-contract work.
7. Sales owns the pre-contract phase. PM ownership starts after the signed-contract handoff.

## Auth Architecture

- JWT access token (1 h) + refresh token (7 d) stored in **HttpOnly cookies** (`token`, `refreshToken`).
- `PermissionsGuard` fetches permissions from DB **per request**; ADMIN bypasses entirely.
- Use `@RequirePermissions('module.action')` to gate endpoints.
- Frontend `baseQuery.ts` auto-refreshes on 401; second 401 dispatches `logout()`.
- `apps/web/proxy.ts` verifies JWTs at the edge using `jose` (no Next.js middleware).

## API Response Envelope

All responses are wrapped:

```json
{ "success": true, "data": <payload>, "error": null }
```

The frontend base query unwraps this automatically — RTK Query slices receive the inner `data` directly.

## Critical Business Rules

- **No hard deletes** — always use `isActive`, `isArchived`, or equivalent soft flags.
- **State machines are server-side** — invalid transitions return 400.
- **Every state change writes a history row** — `lead_pipeline_history`, `task_status_history`, `client_history_log`.
- **Multi-table operations** must use `prisma.$transaction()`.
- **Notifications** are written *after* the core transaction commits; a notification failure must never roll back business data.
- Every business event creates two rows: one in `notification_events` and one in `notifications`.

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

> Do not run `prisma migrate dev` — use `prisma db push`.

### 5. Seed development data

```bash
npx prisma db seed
```

### 6. Start the apps

From the repo root:

```bash
npm run dev
```

Default URLs:
- Web: `http://localhost:3000`
- API: `http://localhost:3001/v1`

## Seed Accounts

Password for all seeded users: `password123`

| Email                  | Role        |
|------------------------|-------------|
| admin@hassad.com       | Admin       |
| pm@hassad.com          | PM          |
| sales@hassad.com       | Sales       |
| employee@hassad.com    | Employee    |
| marketing@hassad.com   | Marketing   |
| accountant@hassad.com  | Finance     |
| client@hassad.com      | Client      |

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
npm run dev
```

## Documentation Map

- `docs/platform-overview.html` — full system architecture with all diagrams (open in browser)
- `workflow-a-to-z.md` — approved business workflow from request intake to completed project
- `system-improvement.md` — system review, gaps, and target architecture rationale
- `ROADMAP.md` — phased implementation and follow-up plan
- `AGENTS.md` — repository-specific operating rules for contributors and agents
- `.agent/NESTJS_API_V2.md` — API reference and endpoint conventions
- `.agent/DATA_BASE_V2.md` — schema reference notes

## Summary

The stable lifecycle is:

```
Client → Request → Proposal → Contract → Signed Contract → Project → Delivery / Finance / Portal
```

All new behavior should be wired through `requestId` unless the feature is explicitly internal CRM detail.
