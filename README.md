<div align="center">
<!-- <img width="1200" height="475" alt="Hassad Platform Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" /> -->

# 🌾 Hassad Platform

### The Ultimate SaaS Engine for Marketing Agencies

[![Turborepo](https://img.shields.io/badge/Maintained%20with-Turborepo-09d4ff.svg)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Powered%20by-Next.js-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E.svg)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 🚀 Overview

**Hassad** (حَصاد) is a comprehensive, enterprise-grade SaaS platform specifically designed for marketing agencies. It streamlines the entire agency lifecycle: from initial lead acquisition in the CRM to project execution, financial management, and advanced marketing campaign analytics.

Built with a modern monorepo architecture, Hassad provides a unified experience for both agency internal teams and their clients via a dedicated secure portal.

---

## 🛠️ Tech Stack

### Core Infrastructure

- **Monorepo Management**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: [NestJS 11](https://nestjs.com/) (REST API)
- **Database & ORM**: PostgreSQL 17, [Prisma 6](https://prisma.io/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) + RTK Query

### Security & Integrations

- **Authentication**: JWT + HttpOnly Cookies (Zero-JS Token Strategy)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) (S3-compatible)
- **Payments**: [Moyasar](https://moyasar.com/)
- **Deployment**: Docker, Docker Compose

---

## 📂 Repository Structure

```
hassad-platform/
├── apps/
│   ├── web/          ← Next.js (Dashboard + Client Portal)
│   └── api/          ← NestJS (Central API)
├── packages/
│   └── shared/       ← Shared Zod schemas, TypeScript types, and Enums
├── docker-compose.yml ← Infrastructure (DB, Redis)
└── turbo.json        ← Build pipeline configuration
```

---

## 🚦 Roadmap & Progress

| Phase          | Feature Set                                    | Status           |
| :------------- | :--------------------------------------------- | :--------------- |
| **Foundation** | Monorepo setup, Prisma schemas, Shared Package | ✅ **Done**      |
| **Phase 1**    | **Secure Auth (HttpOnly) & RBAC Matrix**       | ✅ **Done**      |
| **Phase 2**    | CRM & Sales Pipeline Management                | ✅ **Done**      |
| **Phase 3**    | Project Management & Task Tracking             | 🏗️ _In Progress_ |
| **Phase 4**    | Client Portal (Project visibility, Invoices)   | ⏳ Planned       |
| **Phase 5**    | Finance (Invoicing, Moyasar Integration)       | ⏳ Planned       |
| **Phase 6**    | Marketing Campaigns & AI Layer                 | ⏳ Planned       |

---

## Mission / Requirements Checklist (Source: resources/\*.txt)

Legend: [x] done, [ ] (partial) partially implemented, [ ] (missing) not implemented.

### Part 1: CRM And Sales Pipeline

- [ ] (partial) Customer journey across 16 stages from lead to contract renewal
- [x] CRM client profile fields (name/company, phone/WhatsApp, email optional, business name, business type, source, notes)
- [x] Assigned employee (manual or automatic assignment)
- [x] Sales pipeline stages (9 stages per spec)
- [x] Follow-up automation for unresponsive leads (1st/2nd/3rd attempts, auto-stop, week reminder)
- [x] Log every contact attempt with timestamp and employee
- [x] Proposal creation inside system
- [x] Proposal share link to client
- [x] Proposal approval or revision request flow
- [ ] (partial) Contract upload with electronic signature
- [x] Convert Lead to Active Client on signed contract

### Part 2: Project Management And Tasks

- [x] Create project and assign a project manager
- [ ] (missing) Welcome chat group with client
- [ ] (missing) Requirements form sent to client
- [ ] (partial) Receive requirements and distribute to departments
- [ ] (partial) PM creates tasks per department (design/content/dev/marketing/production)
- [ ] (partial) Task fields per spec (title, description, department, assignee, due date + 24h alert, required files, status, internal comments)
- [ ] (partial) Task lifecycle flow (assign, notify, execute, submit, PM approve or revision)
- [ ] (partial) Client sees approved work only
- [ ] (partial) Privacy matrix enforced across tasks, reports, invoices, marketing, admin

### Part 3: Client Portal, Reports, And Financials

- [ ] (missing) Portal: project status with overall progress + chart
- [ ] (missing) Portal: approved work list
- [ ] (missing) Portal: files and designs download
- [ ] (missing) Portal: downloadable campaign reports
- [ ] (missing) Portal: simplified campaign results
- [ ] (partial) Portal: invoice history with payment status
- [ ] (missing) Portal: change request to PM
- [ ] (missing) Portal: service rating (1-5 stars)
- [ ] (partial) Portal access rules (hide employee tasks, campaign management details, other clients)
- [ ] (missing) CSAT rating actions (5..1 stars with required responses)
- [ ] (missing) Renewal reminders (60/30/7 days) and auto contract + invoice on approval
- [ ] (partial) Invoice status labels (due, paid, late)

### Part 4: Marketing And Campaigns

- [ ] (missing) Marketing dashboard cards (active clients, campaign status, platforms)
- [ ] (missing) Marketing KPIs (spend, impressions, clicks, messages, orders, leads, CVR, CAC)
- [ ] (missing) Platform integrations (Meta, Google, Snapchat, TikTok)
- [ ] (missing) Daily data sync + marketing approval workflow
- [ ] (missing) Marketing reports and client-visible campaign reports

### Part 5: 14 Advanced Features

- [ ] (missing) #01 Client onboarding portal flow (link, form, auto client record, PM notification, queue, assignment)
- [ ] (missing) #02 Financial tickets system (pending/collection/paid/late, payment log, auto-close, WhatsApp receipt, finance alert)
- [ ] (missing) #03 Electronic payments (Apple Pay, Mada, Visa/MC, Tabby, Tamara, bank transfer)
- [ ] (partial) #04 Contract management and archiving (upload, status, search, versioning, expiry alerts)
- [ ] (missing) #05 Admin broadcast alerts
- [ ] (missing) #06 Client notifications (holiday, project update, delivery, invoice, renewal)
- [x] #07 Priority management (urgent/normal/low)
- [ ] (missing) #08 Workload indicator
- [ ] (partial) #09 Delay prevention system (start delay -> employee, 2h -> PM, 24h -> admin)
- [ ] (partial) #10 Full client history log (messages, tasks/deliverables, invoices, reports, ratings)
- [ ] (missing) #11 Template library (proposals, tasks, reports, messages, contracts)
- [ ] (missing) #12 Quick internal rating (excellent/needs revision/poor)
- [ ] (partial) #13 Sales team performance dashboard
- [ ] (partial) #14 Project archival (archive, searchable, restorable)

### Part 6: AI Layer (20 Units)

- [ ] (missing) AI-01 Client intelligence (stable/sensitive/high-risk)
- [ ] (missing) AI-02 Churn prediction
- [ ] (missing) AI-03 Smart task assignment
- [ ] (missing) AI-04 Delay prediction
- [ ] (missing) AI-05 Proposal writer
- [ ] (missing) AI-06 Campaign analysis
- [ ] (missing) AI-07 Campaign optimizer
- [ ] (missing) AI-08 Staff performance analysis
- [ ] (missing) AI-09 Smart assistant
- [ ] (missing) AI-10 Content generator
- [ ] (missing) AI-11 Quality checker
- [ ] (missing) AI-12 Satisfaction intelligence
- [ ] (missing) AI-13 Smart alerts
- [ ] (missing) AI-14 Optimization engine
- [ ] (missing) AI-15 Campaign plan analysis
- [ ] (missing) AI-16 Pre-launch campaign QA
- [ ] (missing) AI-17 Smart A/B testing
- [ ] (missing) AI-18 Post-campaign analysis
- [ ] (missing) AI-19 Beta data warning
- [ ] (missing) AI-20 Campaign smart alerts

### Part 7: Permissions And Roles

- [ ] (partial) Advanced permission controls (no open screens, strict role scoping)
- [ ] (partial) Role-based access examples enforced (designer, marketing, PM, accountant, sales manager, admin)
- [ ] (partial) Tech stack alignment with spec recommendations (Laravel/React/etc.)

### Dashboard Pages (UI)

#### Admin Dashboard

- [ ] (partial) Home KPIs (active clients, monthly revenue, ongoing projects, client satisfaction)
- [ ] (partial) Home tables (overdue tasks, unpaid invoices)
- [ ] (partial) CRM list (name, status, projects count, last interaction, total value) + filters (status, date, value)
- [ ] (partial) Client details (info, projects, invoices, conversations, contracts)
- [ ] (partial) Employees list (name, role, workload indicator, task count, performance)
- [ ] (partial) Settings and permissions (add user, role assignment, custom permissions)

#### Project Manager Dashboard

- [ ] (partial) Home cards (client name, progress, overdue tasks, due date) + alerts (overdue task, change request)
- [ ] (partial) Project core page with tabs (tasks, team, files, chat, deliverables)
- [ ] (partial) Tasks list (name, priority, status, assignee, deadline) + add task
- [ ] (partial) Change requests page (convert to task, reply, close)

#### Sales Dashboard

- [x] Pipeline columns (9 stages per spec)
- [x] Proposal creation (services dropdown, price, start date, send)
- [x] Contracts page (Draft, Sent, Signed)

#### Executive Employee Dashboard

- [ ] (partial) Home task list (task name, project, priority, due date)
- [ ] (partial) Task page (details, briefing, files, upload work, change status)

#### Marketing Dashboard

- [ ] (partial) Clients list
- [ ] (partial) Campaigns per client
- [ ] (partial) Campaign details KPIs (budget, impressions, clicks, conversions, CAC)

#### Finance Dashboard

- [ ] (partial) Invoices (due, paid, late)
- [ ] (partial) Financial tickets
- [ ] (partial) Contracts (value, paid, remaining)

#### Client Portal

- [ ] (partial) Home (welcome message, progress bar, cards for last deliverable, campaign status, next invoice)
- [ ] (partial) Deliverables (name, date, download, request change)
- [ ] (partial) Reports (Meta Ads, Google Ads, TikTok charts)
- [ ] (partial) Financial page (invoices, payments, contracts)

## ⚙️ Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create `.env` files based on the templates:

- `apps/api/.env` (Copy from `apps/api/.env.example`)
- `apps/web/.env.local` (Copy from `apps/web/.env.example`)

### 3. Spin up Infrastructure

```bash
docker compose up -d postgres
```

### 4. Run Development Servers

```bash
# From the root
npx turbo dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001/v1](http://localhost:3001/v1)

---

## 🔒 Security Principles

Hassad employs a **Security-First** approach:

- **HttpOnly Cookies**: No session tokens are accessible via JavaScript, neutralizing XSS risks.
- **Strict RBAC**: Every endpoint and UI component respects a predefined role-access matrix.
- **Sanitized Inputs**: Zero-trust policy on all incoming data, validated via Zod on both client and server.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
