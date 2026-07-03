# Admin Dashboard Redesign — Plan

> Goal: Turn the admin area from a **read-only oversight view** into a real
> **System Control Center** where the admin can observe, intervene, configure,
> and audit *every* part of the platform and every user/role.

---

## 1. Current State Audit

### What exists today (`apps/web/app/(dashboard)/dashboard/admin/`)

| Page | What it does | Quality |
|---|---|---|
| `page.tsx` (main) | KPI grid: users, clients, projects, revenue, overdue tasks, unpaid invoices, pending requests, campaigns, dispute stats, users-by-role, due invoices table | OK overview, **no drill-down, no trends, no actions** |
| `employees` | List staff users, search, filter role/dept, create/edit/deactivate/reactivate | Decent, but **no bulk ops, no per-user permissions, no impersonation, no password reset, no role change** |
| `clients` | List CLIENT users, activate/deactivate | **Very shallow** — no client business data, contracts, projects, revenue, portal access mgmt |
| `clients/[id]` | Client detail | Exists |
| `roles` | List roles, create/rename, assign permissions (grouped) | OK, but **no permission matrix, no per-user grants, no clone** |
| `departments` | List/create departments, assign users | Basic |
| `disputes` (+ sub-routes) | List/stats/approve/reject/change-pm/close | Good — model feature |
| `audit-log` | Paginated audit log with filters | Good |
| `health` | System health (738 lines) | Detailed |
| `settings` | Flat key/value form (companyName, supportEmail, currency, timezone, invoice prefix, billing flags…) | Basic flat form, no structure |
| `services` | Service catalog CRUD | OK |
| `currency` | Currency settings CRUD | OK |
| `payments` | Payment gateways config | OK |

### Backend admin capabilities (today)
- `GET /admin/stats`, `GET /admin/health`
- `GET/POST /admin/settings`, `POST /admin/settings/seed-defaults`
- `GET /admin/audit-log` (+ filters)
- Users CRUD + deactivate/reactivate + assign departments
- Roles CRUD + assign permissions; Permissions list
- Departments CRUD + assign users
- Admin disputes: approve/reject/change-pm/close/messages

### The core problem
The admin can **see** a lot but **control** almost nothing beyond user on/off.
There is **no way** for the admin to:
- Intervene in business operations (leads, proposals, contracts, projects, tasks, invoices, payments, campaigns, payroll) — those are siloed into role dashboards (PM, Sales, Marketing, Accountant).
- Manage access deeply (per-user permission overrides, impersonation, password reset, session revocation, invitations).
- Configure the system (integrations, webhooks, automation rules, notification templates, feature flags, branding, AI, SLAs).
- Run reports (trends, AR aging, team performance, conversion funnel, exports, custom date ranges).
- Do anything in **bulk** (bulk activate, bulk reassign, bulk archive, bulk export).
- Get a single **global search** across all entities.

The data model supports all of this (82 Prisma models including `UserPermission`, `LeadAutomationRule`, `WebhookLog`, `Ledger`, `StaffWorkload`, `SatisfactionRating`, `SystemError`, `ExternalServiceHealth`, etc.) — it's the **UI and admin-scoped API** that's missing.

---

## 2. Design Principles

1. **Admin = god-mode oversight, not a parallel role dashboard.** Admin pages read across all modules and intervene; they do **not** duplicate PM/Sales/Marketing daily workflows.
2. **Observe → Drill-down → Intervene.** Every metric links to a filtered list; every list row links to a detail with an action.
3. **One source of truth per entity.** Reuse existing RTK Query slices (`usersApi`, `rolesApi`, `financeApi`, `disputes…`) and add `adminApi` endpoints only for cross-module aggregation/admin-only interventions.
4. **Soft operations only.** No hard deletes (project rule). Every intervention writes to the relevant history table and `Ledger`.
5. **Every admin action is audited.** All interventions land in `audit-log` via the existing `Ledger` mechanism.
6. **Reuse the design system.** `StatCard`, `DashboardCard`, `DataTable`, `FilterBar`, `Dialog`, `Tabs`, `Timeline`, chart components (`MonthlyComparisonBarChart`, `PerformanceTrendLineChart`, `SpendDistributionDonutChart`, `GaugeChart`), `recharts`. Don't invent new primitives.
7. **RTL Arabic first**, matching the rest of the app.
8. **No strict TS flags** — match existing lenient config.

---

## 3. Target Information Architecture

Restructure `lib/navigation.ts` `adminNavSections` from a flat list into 5 grouped sections. New sidebar:

```
مركز القيادة (Command Center)
  ├─ نظرة عامة          /admin                      (redesigned overview)
  ├─ البحث الشامل       /admin/search              (NEW)
  └─ التنبيهات          /admin/alerts               (NEW)

إدارة المستخدمين والوصول (People & Access)
  ├─ المستخدمون         /admin/users                (replaces employees — unified incl. clients toggle)
  ├─ المستخدم /:id      /admin/users/[id]            (NEW detail drawer/page)
  ├─ الأدوار            /admin/roles                 (enhanced)
  ├─ مصفوفة الصلاحيات   /admin/permissions-matrix    (NEW)
  ├─ الأقسام            /admin/departments           (enhanced)
  └─ سجل الجلسات        /admin/sessions              (NEW — active sessions, force logout)

العمليات (Business Operations Oversight)
  ├─ العملاء            /admin/clients               (enhanced: business data + portal)
  ├─ العميل /:id        /admin/clients/[id]          (enhanced detail)
  ├─ المشاريع           /admin/projects              (NEW — all projects, health, reassign PM, archive)
  ├─ المهام             /admin/tasks                 (NEW — overdue board, reassign, force status)
  ├─ العقود             /admin/contracts             (NEW — all contracts, renewals, status)
  ├─ العروض             /admin/proposals             (NEW — all proposals, funnel)
  ├─ الخيول/العملاء المحتملون  /admin/leads          (NEW — pipeline, automation rules)
  ├─ الحملات التسويقية  /admin/campaigns             (NEW — all campaigns, budget vs spend)
  └─ النزاعات           /admin/disputes              (existing, keep)

المالية والإيرادات (Finance & Revenue)
  ├─ لوحة الإيرادات     /admin/finance              (NEW — revenue trends, AR aging, cashflow)
  ├─ الفواتير           /admin/invoices             (NEW — all, force status, write-off, refund)
  ├─ المدفوعات          /admin/payments-overview     (NEW — all payments, gateways, webhook logs)
  ├─ الرواتب            /admin/payroll               (NEW — payroll runs overview)
  ├─ بوابات الدفع        /admin/payments              (existing — keep/merge)
  ├─ الحسابات البنكية    /admin/bank-accounts         (NEW)
  └─ العملات            /admin/currency              (existing — keep)

النظام والإعدادات (System Administration)
  ├─ إعدادات المنصة     /admin/settings             (restructured into tabs)
  ├─ الخدمات            /admin/services             (existing — keep)
  ├─ التكاملات/Webhooks /admin/integrations          (NEW)
  ├─ قواعد الأتمتة     /admin/automation            (NEW — lead automation rules)
  ├─ قوالب الإشعارات    /admin/notification-templates (NEW)
  ├─ ميزات/Feature Flags /admin/feature-flags         (NEW)
  ├─ صحة النظام         /admin/health               (existing — keep)
  ├─ البيئة والمعلومات  /admin/environment          (NEW — versions, build, DB status)
  └─ النسخ الاحتياطي    /admin/backups               (NEW — export/backup mgmt)

التقارير والتحليلات (Analytics & Reporting)
  └─ التقارير           /admin/reports              (NEW — saved/custom reports, exports)

التدقيق والأمان (Audit & Compliance)
  ├─ سجل النشاطات       /admin/audit-log             (existing — keep)
  └─ الأمان             /admin/security              (NEW — security events, failed logins, 2FA status)
```

Route base stays `/dashboard/admin/...` to match existing structure.

---

## 4. Pillar-by-Pillar Feature Breakdown

### Pillar A — Command Center

**A1. Redesigned Overview (`/admin`)**
- Top: 4–8 contextual **action-required alerts** (overdue tasks > threshold, unpaid invoices aging, escalated disputes, pending webhooks, failed payments, expiring contracts, low storage) — each is a clickable card that deep-links to the filtered list.
- KPI grid (keep existing) but **add sparkline trends** (30-day) using `recharts` + new `GET /admin/stats/trends?days=30`.
- **Pipeline funnel widget**: Leads → Clients → Proposals → Contracts → Projects → Invoices → Payments (counts + conversion %). New `GET /admin/funnel`.
- **Revenue / cashflow mini-chart** (monthly, 6–12 months) with MoM delta.
- **Team load widget**: top overloaded staff from `StaffWorkload` (active tasks, avg completion, quality score).
- **Recent activity stream** (last 20 ledger entries) using existing audit data.
- Remove inline dispute stat cards → consolidate into the alerts strip + a dedicated widget.

**A2. Global Search (`/admin/search`)**
- Single search box across: users, clients, projects, tasks, invoices, contracts, campaigns, leads.
- Keyboard shortcut (Cmd/Ctrl+K) opens a command palette overlay from any admin page.
- New `GET /admin/search?q=...` aggregating top hits per entity type with type-ahead.
- Reuse `Dialog`/`Popover` + `DataTable` for results.

**A3. Alerts Center (`/admin/alerts`)**
- Centralized, dismissible list of all system alerts (derived from overdue tasks, aged invoices, escalated disputes, failed webhooks, expired tokens, low balances).
- Each alert: severity, entity link, "resolve"/"snooze" actions.
- Fed by existing data + `GET /admin/alerts`.

### Pillar B — People & Access Control

**B1. Unified Users (`/admin/users`)** — replaces `employees` + adds client toggle
- One table for **all** users (staff + clients) with a role filter that includes `CLIENT`.
- Columns: name, email, role, department, status, **last active**, **2FA on/off**, **# active sessions**, **per-user extra perms badge**.
- Row actions: edit, activate/deactivate, **reset password**, **change role**, **manage per-user permissions**, **impersonate (login as)**, **force logout**, view detail.
- **Bulk selection bar**: bulk activate/deactivate, bulk reassign department, bulk change role, **bulk export CSV**, bulk delete (soft).
- Keep `EmployeeForm` for create/edit; extend it to support role assignment + per-user permission selection.

**B2. User Detail (`/admin/users/[id]`)** — NEW
- Tabs: **Profile**, **Permissions** (effective permissions = role perms ∪ user perms, with toggle to add/remove per-user grants via `user_permissions`), **Activity** (their ledger/audit history + task/project involvement), **Sessions** (active sessions, revoke), **Security** (2FA, password reset history, login attempts), **Assigned work** (projects, tasks, disputes, clients they manage).
- Impersonation button (with reason prompt + audit log entry).

**B3. Roles (enhanced `/admin/roles`)**
- Keep existing create/rename/assign-permissions.
- Add **permission count + user count** columns.
- Add **"Clone role"** action.
- Add **audit trail** of permission changes (who/when) — surfaced from existing audit log filtered to entity=`role_permissions`.

**B4. Permissions Matrix (`/admin/permissions-matrix`)** — NEW
- Grid: rows = roles, columns = permission modules (or individual permissions), cells = checkbox reflecting `role_permissions`.
- Batch toggle a whole module for a role.
- Read from `GET /roles` (+ permissions) and `POST /roles/:id/permissions` (existing). No new endpoint needed for the matrix itself, just a denser UI.

**B5. Departments (enhanced `/admin/departments`)**
- Add member count, lead/manager, workload summary per department.
- Add **"department performance"** mini-view (tasks completed, avg speed, quality) from `StaffWorkload`.

**B6. Sessions (`/admin/sessions`)** — NEW
- List active sessions (requires a `sessions`/`audit`-backed endpoint or JWT blocklist).
- Force-logout (revoke refresh) per user.
- *Backend gap*: need `GET /admin/sessions` + `POST /admin/users/:id/revoke-sessions`.

### Pillar C — Business Operations Oversight

> All these are **admin-scoped cross-module** views. They reuse existing module
> services on the backend via new lightweight admin controllers that call the same
> services with elevated context, OR add `GET /admin/<entity>` list endpoints.
> Every row deep-links to the **existing** role-specific detail page (admin views read-only + limited interventions).

**C1. Clients (enhanced `/admin/clients` + `/admin/clients/[id]`)**
- Add columns: company, status, **# contracts**, **# projects**, **# open invoices**, **total revenue**, **satisfaction score**, **portal access status**.
- Detail: full client record, contracts, projects, invoices, payments, history log (`client_history_log`), portal token regenerate, intake form status.

**C2. Projects (`/admin/projects`)** — NEW
- All projects with health (status, completion %, overdue tasks count, budget vs spent for marketing-linked, PM name).
- Filters: PM, client, status, priority, overdue-only.
- Actions: **reassign PM**, **archive**, **view detail** (link to existing PM project page), **force status** (with reason, audited).

**C3. Tasks (`/admin/tasks`)** — NEW
- All tasks, with overdue board.
- Filters: assignee, department, project, status, overdue, priority.
- Actions: **reassign**, **force status transition** (admin override of state machine, audited with reason), **view history** (`task_status_history`).

**C4. Contracts (`/admin/contracts`)** — NEW
- All contracts, renewal alerts (`contract_renewal_alerts`), status, monthly/total value.
- Actions: **cancel** (admin), **view versions**, **trigger renewal alert**.

**C5. Proposals (`/admin/proposals`)** — NEW
- All proposals + funnel (sent/approved/rejected counts), conversion %.

**C6. Leads (`/admin/leads`)** — NEW
- Pipeline overview by stage, automation rules management (`lead_automation_rules` CRUD — currently no UI), conversion stats.

**C7. Campaigns (`/admin/campaigns`)** — NEW
- All campaigns, budget_total vs budget_spent, status, platform, KPI summary.
- Overspend alerts (budget_spent > budget_total).

### Pillar D — Finance & Revenue

**D1. Finance Overview (`/admin/finance`)** — NEW
- Revenue trend (monthly, 6–12m), AR aging buckets (0–30/31–60/60+), cashflow in/out, top clients by revenue, unpaid invoices total, refund rate.
- Reuse `financeApi` where possible; add `GET /admin/finance/overview`.

**D2. Invoices (`/admin/invoices`)** — NEW
- All invoices, force status (mark paid/sent/late/void), write-off, refund trigger, export.
- Links to existing accountant invoice detail.

**D3. Payments Overview (`/admin/payments-overview`)** — NEW
- All `payments` (status, method, provider), `payment_events`, `webhook_logs` (failed/pending), gateways health.
- Action: **retry webhook**, **mark payment resolved**.

**D4. Payroll (`/admin/payroll`)** — NEW
- `employees` + `salaries` overview, run status, monthly totals.
- Read-only oversight (creation stays in accountant module) + admin overrides.

**D5. Bank Accounts (`/admin/bank-accounts`)** — NEW
- CRUD on `bank_accounts` (exists in schema, no UI).

**D6. Payments gateways (`/admin/payments`)** — keep existing; move under Finance section.

**D7. Currency (`/admin/currency`)** — keep existing.

### Pillar E — System Administration

**E1. Settings (restructured into tabs)** — `/admin/settings`
- Tabs: **عام** (company, contact, locale), **الفوترة** (invoice prefix, grace days, reminders, suspend-on-overdue), **العرض/Branding** (logo, colors, white-label — new keys), **الأمان** (password policy, session timeout, 2FA enforcement — new keys), **AI** (Gemini enable/disable, model — new keys), **الإشعارات** (channels, defaults).
- Replace flat form with grouped tabbed form; reuse `Tabs` + `SurfaceCard`.
- Add **"reset to defaults"** per tab.

**E2. Services (`/admin/services`)** — keep existing.

**E3. Integrations & Webhooks (`/admin/integrations`)** — NEW
- Configure webhook endpoints (URL, events), view `webhook_logs`, retry failed.
- Payment gateway connections status, ad platform connections (`ad_platform_connections`).
- *Backend gap*: `GET/POST /admin/webhooks`, `POST /admin/webhooks/:id/retry`.

**E4. Automation Rules (`/admin/automation`)** — NEW
- CRUD on `lead_automation_rules` (exists in schema + `/automation/rules` API, no UI), view `lead_automation_logs`.

**E5. Notification Templates (`/admin/notification-templates`)** — NEW
- Manage title/body templates per event type (read from `notification_events` event types). *Backend gap*: templates table/UI.

**E6. Feature Flags (`/admin/feature-flags`)** — NEW
- Toggle modules/features on/off per environment (store in `company_setting` with `feature.` prefix). No code branching needed beyond guards.

**E7. Health (`/admin/health`)** — keep existing (738 lines, already detailed).

**E8. Environment Info (`/admin/environment`)** — NEW
- Node version, app version (from `metadata.json`/`package.json`), DB version, pending migrations status, external service health (`ExternalServiceHealth` model), uptime, memory.

**E9. Backups & Exports (`/admin/backups`)** — NEW
- Trigger data exports (users, clients, invoices, audit log) as CSV/JSON.
- *Backend gap*: `GET /admin/exports/:type`.

### Pillar F — Analytics & Reporting

**F1. Reports (`/admin/reports`)** — NEW
- Pre-built: Sales funnel, Revenue by month, AR aging, Team performance, Client satisfaction, Campaign ROI.
- Date-range picker (`TimeRangeSelector` exists), export to CSV/PDF, save report configs.
- Charts via `recharts` + existing chart components.

### Pillar G — Audit, Security & Compliance

**G1. Audit Log (`/admin/audit-log`)** — keep existing; add **export** + **entity drill-down** (click a row → see full before/after JSON, related entries).

**G2. Security (`/admin/security`)** — NEW
- Failed login attempts, 2FA adoption rate, password resets, active sessions count, impersonation log.
- *Backend gap*: needs security-event aggregation endpoint.

---

## 5. Backend API Gaps to Fill

New admin-scoped endpoints (all `@RequirePermissions("admin.*")`, JWT-protected). Group under a new `AdminModule` extension or per-module admin sub-controllers. **Reuse existing services** — these are thin admin wrappers.

```
# Command Center
GET  /admin/stats/trends?days=30
GET  /admin/funnel
GET  /admin/search?q=...&limit=...
GET  /admin/alerts

# People & Access
GET  /admin/users                 (cross-module enriched user list — already have users list; add lastActive, sessions, 2FA, perms badge)
POST /admin/users/:id/reset-password
POST /admin/users/:id/impersonate  (issue short-lived token + audit)
POST /admin/users/:id/revoke-sessions
POST /admin/users/bulk            (bulk activate/deactivate/reassign/role/export)
GET  /admin/sessions
POST /admin/users/:id/permissions (per-user grant — user_permissions)

# Business Operations (cross-module oversight + interventions)
GET  /admin/projects
POST /admin/projects/:id/reassign-pm
POST /admin/projects/:id/force-status   (audited override)
GET  /admin/tasks
POST /admin/tasks/:id/reassign
POST /admin/tasks/:id/force-transition
GET  /admin/contracts
POST /admin/contracts/:id/cancel         (admin)
GET  /admin/proposals
GET  /admin/leads
POST /admin/automation/rules (exists) → wire UI
GET  /admin/campaigns

# Finance
GET  /admin/finance/overview
GET  /admin/invoices
POST /admin/invoices/:id/force-status
POST /admin/invoices/:id/write-off
GET  /admin/payments-overview
POST /admin/webhooks/:id/retry
GET  /admin/payroll/overview
CRUD /admin/bank-accounts

# System
GET/POST /admin/webhooks
GET  /admin/environment
GET  /admin/exports/:type
GET  /admin/security/events

# Reports
GET  /admin/reports/sales-funnel?from&to
GET  /admin/reports/revenue?from&to&group=month
GET  /admin/reports/ar-aging
GET  /admin/reports/team-performance
GET  /admin/reports/client-satisfaction
GET  /admin/reports/campaign-roi
```

**Data migrations** (per AGENTS.md rules — manual SQL migration files, not seed):
- Add new `admin.*` permissions to `permissions` table.
- Add new default `company_setting` keys (branding, security, AI, feature flags) via a data migration.
- If a `notification_templates` table is introduced, a schema migration + data migration.

**Permissions to register**: `admin.stats`, `admin.audit`, `admin.settings` (exist) → add `admin.users.manage`, `admin.users.impersonate`, `admin.projects.intervene`, `admin.tasks.intervene`, `admin.contracts.intervene`, `admin.finance.overview`, `admin.invoices.intervene`, `admin.integrations`, `admin.automation`, `admin.exports`, `admin.reports`, `admin.security`, `admin.sessions`, `admin.backups`.

---

## 6. Frontend / Component Needs

- **Extend `adminApi.ts`** with all new endpoints above (RTK Query tags: `AdminUsers`, `AdminProjects`, `AdminFinance`, `AdminAlerts`, `AdminReport`).
- **New shared components** (add to `components/design-system/`):
  - `BulkActionBar` — sticky bar with selection count + bulk actions.
  - `CommandPalette` — Cmd/Ctrl+K global search overlay.
  - `DrillDownLink` — metric → filtered list navigation helper.
  - `PermissionMatrix` — roles × permissions grid.
  - `AlertCard` (exists) — reuse for alerts strip.
  - `DateRangePicker` — extend `TimeRangeSelector` if needed.
  - `ExportButton` — triggers `/admin/exports/:type`.
- **Reuse**: `DataTable`, `FilterBar`, `Tabs`, `Dialog`, `Timeline`, `StatCard`, `DashboardCard`, `SurfaceCard`, `StatusBadge`, `Pill`, `Pagination`, all chart components.
- **Navigation**: rewrite `adminNavSections` in `lib/navigation.ts` per §3.

---

## 7. Implementation Phases (sequenced)

Each phase is independently shippable. Build `shared` → API → web, run `turbo build` to verify (no test suite).

### Phase 0 — Foundations (no UI changes)
1. Add `admin.*` permissions via data migration + assign to ADMIN role.
2. Add new `company_setting` default keys (branding, security, AI, feature flags) via data migration.
3. Extend `adminApi.ts` tag types; create skeleton endpoints returning empty until built.
4. Refactor `adminNavSections` into the 5-section IA (links may 404 until pages land — gate behind feature flag or add pages incrementally).

### Phase 1 — Command Center + People (highest value, lowest risk)
1. Redesign `/admin` overview (alerts strip, trends sparklines, funnel, revenue chart, team load, activity stream). Backend: `/admin/stats/trends`, `/admin/funnel`, `/admin/alerts`.
2. `/admin/users` unified table + bulk bar + row actions (reset password, change role, impersonate, force logout, per-user perms). Backend: `/admin/users/bulk`, `/admin/users/:id/reset-password`, `/admin/users/:id/impersonate`, `/admin/users/:id/revoke-sessions`, `/admin/users/:id/permissions`.
3. `/admin/users/[id]` detail with tabs.
4. Enhance `/admin/roles` (clone, counts, audit) + `/admin/permissions-matrix`.
5. Global search command palette + `/admin/search` + `/admin/alerts`.

### Phase 2 — Business Operations Oversight
1. `/admin/clients` enhanced + detail (portal access, history, revenue).
2. `/admin/projects` + interventions (reassign PM, force status).
3. `/admin/tasks` + overdue board + force transition.
4. `/admin/contracts` + `/admin/proposals` + `/admin/leads` (with automation rules UI).
5. `/admin/campaigns`.

### Phase 3 — Finance & Revenue Control
1. `/admin/finance` overview (revenue, AR aging, cashflow).
2. `/admin/invoices` + force status/write-off.
3. `/admin/payments-overview` + webhook retry + `/admin/bank-accounts`.
4. `/admin/payroll` overview.

### Phase 4 — System Administration
1. Restructure `/admin/settings` into tabbed sections + new setting keys.
2. `/admin/integrations` + webhook management.
3. `/admin/automation` (lead automation rules CRUD).
4. `/admin/notification-templates`, `/admin/feature-flags`.
5. `/admin/environment`, `/admin/backups` (exports).

### Phase 5 — Analytics, Audit & Security
1. `/admin/reports` (pre-built + date range + export).
2. Enhance `/admin/audit-log` (export, drill-down).
3. `/admin/security` (security events, 2FA adoption, impersonation log).

---

## 8. Migration / Safety Approach

- **Don't delete** existing pages until replacements are verified. Ship new pages alongside, then redirect old routes (`employees` → `users`) once feature-parity is confirmed.
- **Gate the new nav** behind `feature.admin_dashboard_v2` setting (in `company_setting`) so we can roll out per environment.
- Every admin intervention endpoint must: validate state, write history row, emit `notification_event`, write `Ledger`/audit entry — per platform rules in AGENTS.md.
- Impersonation: short-lived (15 min) scoped token, always audited, never available for ADMIN→ADMIN, auto-ends on logout.
- All bulk ops require confirmation `Dialog` + are audited per-row.
- No `prisma db push` — every schema change via `migrate dev`; every data/permission change via data migration file.

---

## 9. Acceptance Criteria (per phase)

A phase is "done" when:
- `turbo build` passes for `shared`, `api`, `web`.
- Admin can perform every listed action end-to-end without hitting a 404/500.
- Every admin intervention appears in `audit-log` with actor, before/after, timestamp.
- RTL layout intact; design-system components reused (no raw ad-hoc markup).
- New `admin.*` permissions exist in DB and are granted to ADMIN role (ADMIN bypasses guard, but permissions must still be registered for completeness and future role cloning).
- No hard deletes introduced; soft flags only.
- Navigation reflects the new 5-section IA.

---

## 10. Out of Scope (explicitly)

- Rewriting the role-specific dashboards (PM/Sales/Marketing/Accountant/Employee/Portal) — those stay; admin gets oversight + intervention, not duplication.
- Real-time WebSocket admin broadcast UI (exists in spec, optional later).
- Full BI suite — start with pre-built reports; custom report builder is a later initiative.
- Mobile-optimized admin (admin is desktop-first; responsive is best-effort).

---

# PART 2 — Complete Blind-Spot Audit & Extended Scope

> Part 1 was the backbone. After auditing **every** controller (34 files) and
> **all 82 Prisma models**, Part 1 missed several **entire operational modules**
> the admin currently has **zero** visibility into. This Part closes those gaps
> and is now the authoritative scope. Anything not explicitly listed here is
> covered by Part 1.

## 11. Module-by-Module Blind-Spot Audit

Legend: ❌ = admin has NO UI at all · ⚠️ = partial/existing but shallow · ✅ = already in Part 1.

### Communication (chat) — ❌ ENTIRELY BLIND
The chat module (`/conversations`, direct msgs, project group chats, participants,
messages + file attachments) has **no admin oversight whatsoever**.
- `Conversation`, `ConversationParticipant`, `Message`, `MessageAttachment`.
- Admin can't: see conversation volume, find who talks to whom, moderate/hide
  messages, intervene in a client↔PM dispute chat, export a conversation for
  legal/CS reasons, or spot silent/stalled conversations.
- **Add:** `/admin/chat` — conversations explorer (filters: project, client, PM,
  participants, activity, stalled), per-conversation message viewer (read-only,
  with export), "mute/hide" moderation, and "create announcement conversation".
- **Backend:** `GET /admin/conversations` (cross-user, unlike current
  user-scoped `GET /conversations`), `GET /admin/conversations/:id/messages`,
  `POST /admin/conversations/:id/hide`, `GET /admin/conversations/:id/export`.

### Notifications & Broadcast — ❌ BLIND (broadcast endpoint exists, no UI)
- `POST /notifications/broadcast` (targets roles + departments) **already exists**
  but there is **no UI** to use it. Admin cannot send platform-wide announcements.
- `Notification`, `NotificationEvent` — admin can't see what was sent, to whom,
  read rates, or failed deliveries.
- **Add:** `/admin/notifications` — Broadcast composer (title/message/roles/
  departments/preview recipients count + send), sent-history table with read-rate,
  notification-event log explorer. Also surface the per-user notification inbox
  in the user detail page (Part 1).
- **Backend:** reuse existing broadcast + add `GET /admin/notifications` (all,
  not just mine), `GET /admin/notification-events`.

### AI Module — ❌ BLIND
- `AiAnalysisLog`, `AiSuggestion`, endpoints `ai/analyze`, `ai/logs/:id`,
  `ai/suggestions`, accept/reject. Admin has no view of AI usage, cost, confidence,
  or suggestion outcomes.
- **Add:** `/admin/ai` — AI usage dashboard (analyses over time by type/entity,
  confidence distribution, suggestion accept/reject rate), full log explorer,
  and AI config (enable/disable per analysis type, Gemini key status) wired into
  Settings → AI tab.
- **Backend:** `GET /admin/ai/logs`, `GET /admin/ai/stats`.

### Sales Oversight — ❌ BLIND
- `sales/metrics`, `sales/performance`, `sales/activity` exist but the admin has
  **no cross-team sales dashboard**. Part 1 only put a funnel in reports.
- **Add:** `/admin/sales` — team sales leaderboard (per sales rep: leads owned,
  conversions, revenue closed, avg cycle time), pipeline health by stage,
  activity feed across ALL reps, period compare.

### Service Requests Pipeline — ❌ BLIND
- The `requests` module is the sales intake pipeline (portal + for-client), with
  `Request`, `RequestService`, `RequestStatusHistory`, assigned reps. Admin has
  no view of this queue, can't reassign, can't see bottlenecks.
- **Add:** `/admin/requests` — request queue board (status, assignee, client,
  age, services), reassign, force-status, SLA/aging highlights, status-history
  timeline per request.

### Marketing Strategies — ❌ BLIND
- `MarketingStrategy`, endpoints generate/download/send/resubmit + portal
  approve/request-revision. Admin has no oversight.
- **Add:** `/admin/marketing-strategies` — all strategies, approval queue,
  status, download, version history.

### Portal Activity Oversight — ❌ BLIND (huge)
The client portal has ~50 endpoints and the admin sees **none** of it:
- portal dashboard, team-members, contracts, finance, invoices, deliverables,
  intake forms, campaigns, projects, **project periods**, project-progress,
  **action-items + snooze**, activity-feed, reports/timeline, **project review /
  approve / request-revision**, **marketing-strategy approve/revision**.
- Models: `PortalIntakeForm`, `ClientRevisionRequest`, `ClientSnoozedItem`,
  `ProjectRevisionRequest`, `Deliverable` + revisions.
- **Add:** `/admin/portal` — portal engagement overview (active clients using
  portal vs idle, pending approvals the client owes, pending revisions,
  unsubmitted intake forms, snoozed items count), portal-token management
  (view/regenerate/expire per client), and an "admin portal preview" to see a
  client's portal as they see it (read-only).
- This is the admin's window into the client-facing experience.

### Project Periods / Delivery Cadence — ❌ BLIND
- `ProjectPeriod`, `ProjectPeriodHistory`, period close/open/extend/extra/
  summary/completion/goals/report + `ProjectMeeting`. This is the recurring
  billing/delivery cadence — admin sees none of it.
- **Add:** fold into `/admin/projects/[id]` detail + a `/admin/periods` overview
  (all open periods across projects, overdue-to-close, upcoming reports due,
  meetings log).

### Contract Lifecycle — ⚠️ (Part 1 list view, missing internals)
- Missing oversight of: `ContractPaymentPlan` + rows + generate-invoice,
  `ContractVersion`, `ContractStatusHistory`, `ContractRenewalAlert`.
- **Add to `/admin/contracts`:** payment-plan viewer/editor, versions timeline,
  status-history timeline, **renewal-alert manager** (view/dismiss/schedule),
  and a renewal-due board (contracts expiring 30/60/90 days).

### Payments Deep Oversight — ❌ BLIND
- `Payment`, `PaymentEvent` (CREATED/SUCCESS/FAILED/REFUNDED), `PaymentTicket`
  (+ resolve), manual receipt upload, payment intents. Admin only sees gateway
  config.
- **Add to `/admin/payments-overview`:** all payment intents + statuses,
  payment-event timeline per payment, failed-payment board with retry, **payment
  tickets** queue (assign/resolve), manual receipt review queue, refunds log.

### Webhook Management — ❌ BLIND (logs only, in health)
- `WebhookLog`, `POST /webhooks/:provider`. Admin can see unprocessed logs in
  health but can't configure, retry, or inspect payloads.
- **Add:** `/admin/integrations` → Webhooks tab: endpoint config, incoming log
  table (payload, processed, error), per-log payload viewer, **retry**.
- **Backend:** `GET /admin/webhooks`, `POST /admin/webhooks/:id/retry`,
  `POST /admin/webhooks/config`.

### Client Records Deep View — ⚠️
- Missing: `ClientProfile` (+ v2), team-view, **handover** history, client
  activity log (`ClientHistoryLog`), account-manager assignment.
- **Add to `/admin/clients/[id]`:** profile editor, team-view, handover log,
  full `client_history_log` timeline, account-manager reassign.

### Lead Intelligence — ⚠️ (Part 1 list, missing internals)
- Missing: `LeadService`, `LeadAutomationRule` + `LeadAutomationLog`, contact
  logs, conversion stats per rep/source.
- **Add to `/admin/leads`:** automation rules CRUD UI (exists API, no UI),
  automation logs, lead-services per lead, contact-log timeline, source/
  rep conversion analytics.

### Service Catalog Internals — ⚠️
- Missing: `DeliverableTemplate` (deliverable-templates CRUD exists, no admin UI).
- **Add to `/admin/services`:** deliverable templates manager.

### Campaign Intelligence — ⚠️ (Part 1 list, missing internals)
- Missing: `AbTest` (+ stop), `CampaignKpiSnapshot`, `CampaignKpiAuditLog`
  (KPI tamper detection), `CampaignStatusHistory`, `AdPlatformConnection`,
  overspend alerts.
- **Add to `/admin/campaigns`:** A/B tests board, KPI snapshot history per
  campaign, **KPI audit log** (who changed marketing numbers + before/after —
  fraud/integrity control), ad-platform connection status, budget-vs-spent with
  overspend flag.

### Performance & Quality — ❌ BLIND
- `SatisfactionRating`, `InternalRating`, `StaffWorkload` exist. Admin has no
  performance/quality dashboard.
- **Add:** `/admin/performance` — per-staff scorecard (active tasks, avg
  completion speed, avg quality from `InternalRating`, client satisfaction
  from `SatisfactionRating`, workload status), team leaderboard, satisfaction
  trend, low-performer alerts.

### System Errors Console — ⚠️ (buried in health)
- Health page resolves errors, but it's buried. `SystemError`, `SystemHealthCheck`,
  `ExternalServiceHealth`.
- **Add:** `/admin/errors` — dedicated errors console (filter resolved/unresolved/
  severity/service, stack trace, resolve-with-note, bulk-resolve) + external
  service health grid. Keep health page as the high-level status.

### Dispute Internals — ⚠️ (page exists, verify completeness)
- Ensure `/admin/disputes` shows `DisputeAttachment`, `DisputeHistory`, and full
  `DisputeMessage` thread (likely partial). Add export + bulk-close.

### Project Artifacts — ❌ BLIND
- `ProjectFile`, `ProjectMeeting`, `ProjectRevisionRequest`. Admin can't audit
  uploaded project files or meeting notes across projects.
- **Add to `/admin/projects/[id]`:** files list + meetings log.

### Task Delay Alerts — ❌ BLIND
- `TaskDelayAlert` (notifications of delayed tasks, acknowledgement state).
- **Add to `/admin/tasks`:** delay-alerts panel + the overdue board from Part 1.

### Client Snooze / Action Items — ❌ BLIND
- `ClientSnoozedItem` + portal action-items. Admin sees none.
- **Add to `/admin/portal`:** snoozed-items overview per client.

## 12. Meta-Control Features (true "control everything")

These go beyond per-module oversight and give the admin platform-level levers.

### 12.1 Security & Identity (schema gaps!)
The `User` model currently has **no** `lastLoginAt`, `twoFactorEnabled`,
`failedLoginAttempts`, `lockedUntil`, or sessions table. Part 1's
sessions/2FA/last-active features need **schema migrations**:
- Add to `User`: `lastLoginAt DateTime?`, `twoFactorEnabled Boolean @default(false)`,
  `failedLoginAttempts Int @default(0)`, `lockedUntil DateTime?`.
- New `Session` model (id, userId, refreshTokenHash, userAgent, ip, expiresAt,
  revokedAt) — or reuse refresh-token records if present; verify current auth
  implementation before adding.
- New `SecurityEvent` model (id, userId?, type enum LOGIN_SUCCESS/LOGIN_FAIL/
  PASSWORD_RESET/IMPERSONATION/2FA_…, ip, userAgent, metadata, createdAt).
- **UI:** `/admin/security` (Part 1) backed by these; **impersonation** writes a
  `SecurityEvent` + short-lived scoped token.
- *If adding auth fields is too risky now, Phase 0 can approximate last-active
  from the latest `Ledger`/`Notification` createdAt per user.*

### 12.2 Bulk Messaging
- Compose + target a segment (all clients, a role, a department, clients of a
  PM, overdue-invoice clients) → send via the existing notification system, and
  optionally email/WhatsApp.
- **Add:** `/admin/messaging` — audience builder + templates + send + delivery
  log.

### 12.3 Storage & File Management
- Aggregate all file tables (`TaskFile`, `ProjectFile`, `MessageAttachment`,
  `DisputeAttachment`, `PortalIntakeForm.uploadedFiles`) into one admin view:
  total storage used, per-entity breakdown, orphaned files, and a cleanup tool.
- **Add:** `/admin/storage`.

### 12.4 Data Integrity & Reconciliation
- Admin tools to catch drift: invoices without matching payments, campaigns
  where `budget_spent > budget_total`, tasks assigned to inactive users, leads
  never contacted, clients without portal access, contracts past end-date still
  ACTIVE, orphaned records (entity with no required relation).
- **Add:** `/admin/integrity` — health-check rules with "fix" or "flag" actions.
- **Backend:** `GET /admin/integrity/checks` returning categorized issues.

### 12.5 Scheduled Jobs / Automation Visibility
- `lead_automation_rules` + `POST /automation/execute` (INTERNAL ONLY) run on a
  schedule; admin can't see what ran, when, or failures (`LeadAutomationLog`).
- **Add to `/admin/automation`:** job-run log, last-run status, manual "run now",
  disabled-rule toggle.

### 12.6 API & Rate-Limit Control
- API key management (issue/revoke scoped keys for integrations), rate-limit
  thresholds per role, request-volume dashboard.
- **Add:** `/admin/api-keys` + a usage chart. *Backend may need a key model —
  scope as later phase if no auth infra exists.*

### 12.7 Import / Data Entry Tools
- Bulk-import users, clients, leads, invoices via CSV (with dry-run preview +
  validation report). Useful for onboarding.
- **Add:** `/admin/imports`.

### 12.8 Feature Flags / Module Toggles
- Already in Part 1; reaffirm: per-environment enable/disable of AI, portal
  revisions, marketing strategies, payroll, disputes, etc., stored in
  `company_setting` with `feature.*` prefix and surfaced in `/admin/feature-flags`.

## 13. Revised Information Architecture (supersedes §3)

```
مركز القيادة (Command Center)
  ├─ نظرة عامة            /admin
  ├─ البحث الشامل         /admin/search
  ├─ التنبيهات            /admin/alerts
  └─ سجل الأخطاء          /admin/errors            (NEW — was buried in health)

إدارة المستخدمين والوصول (People & Access)
  ├─ المستخدمون          /admin/users
  ├─ المستخدم /:id       /admin/users/[id]
  ├─ الأدوار             /admin/roles
  ├─ مصفوفة الصلاحيات    /admin/permissions-matrix
  ├─ الأقسام             /admin/departments
  ├─ سجل الجلسات         /admin/sessions
  └─ الأمان والهوية       /admin/security          (NEW — security events, 2FA, logins)

العمليات (Business Operations)
  ├─ العملاء             /admin/clients
  ├─ العميل /:id         /admin/clients/[id]
  ├─ طلبات الخدمة        /admin/requests          (NEW — request pipeline)
  ├─ العملاء المحتملون   /admin/leads
  ├─ العروض             /admin/proposals
  ├─ العقود             /admin/contracts
  ├─ المشاريع           /admin/projects
  ├─ فترات المشاريع     /admin/periods           (NEW — delivery/billing cadence)
  ├─ المهام             /admin/tasks
  ├─ الحملات            /admin/campaigns
  ├─ استراتيجيات التسويق /admin/marketing-strategies (NEW)
  ├─ النزاعات           /admin/disputes
  └─ المحادثات           /admin/chat              (NEW — chat moderation)

المالية والإيرادات (Finance & Revenue)
  ├─ لوحة الإيرادات     /admin/finance
  ├─ الفواتير           /admin/invoices
  ├─ المدفوعات          /admin/payments-overview
  ├─ تذاكر الدفع        /admin/payment-tickets    (NEW)
  ├─ الرواتب            /admin/payroll
  ├─ بوابات الدفع        /admin/payments
  ├─ الحسابات البنكية    /admin/bank-accounts
  └─ العملات            /admin/currency

بوابة العملاء (Portal Oversight) — NEW section
  └─ نظرة عامة البوابة   /admin/portal            (engagement, approvals, tokens, snoozed)

الأداء والجودة (Performance & Quality) — NEW section
  └─ أداء الفريق         /admin/performance       (staff scorecards, satisfaction, workload)

المبيعات (Sales Oversight) — NEW section
  └─ لوحة المبيعات       /admin/sales             (leaderboard, pipeline, activity)

الذكاء الاصطناعي (AI Oversight) — NEW section
  └─ لوحة الذكاء         /admin/ai               (usage, logs, suggestions)

النظام والإعدادات (System Administration)
  ├─ إعدادات المنصة     /admin/settings
  ├─ الخدمات + قوالب التسليم  /admin/services
  ├─ التكاملات و Webhooks /admin/integrations
  ├─ قواعد الأتمتة     /admin/automation
  ├─ قوالب الإشعارات    /admin/notification-templates
  ├─ البث/الإشعارات     /admin/notifications     (NEW — broadcast composer + history)
  ├─ الرسائل الجماعية   /admin/messaging         (NEW — bulk messaging)
  ├─ ميزات/Feature Flags /admin/feature-flags
  ├─ التخزين والملفات  /admin/storage           (NEW)
  ├─ سلامة البيانات     /admin/integrity         (NEW — reconciliation)
  ├─ مفاتيح API         /admin/api-keys          (NEW)
  ├─ الاستيراد          /admin/imports           (NEW)
  ├─ صحة النظام         /admin/health
  ├─ البيئة والمعلومات  /admin/environment
  └─ النسخ الاحتياطي    /admin/backups

التقارير والتحليلات (Analytics & Reporting)
  └─ التقارير           /admin/reports

التدقيق (Audit & Compliance)
  └─ سجل النشاطات       /admin/audit-log
```

## 14. Revised Backend API Additions (additions beyond Part 1 §5)

```
# Chat oversight
GET  /admin/conversations
GET  /admin/conversations/:id/messages
POST /admin/conversations/:id/hide
GET  /admin/conversations/:id/export

# Notifications / broadcast
GET  /admin/notifications
GET  /admin/notification-events
# (reuse POST /notifications/broadcast for send)

# AI
GET  /admin/ai/logs
GET  /admin/ai/stats

# Sales
GET  /admin/sales/leaderboard
GET  /admin/sales/pipeline-health

# Requests
GET  /admin/requests
POST /admin/requests/:id/reassign
POST /admin/requests/:id/force-status

# Marketing strategies
GET  /admin/marketing-strategies

# Portal oversight
GET  /admin/portal/overview          (engagement, pending approvals, idle clients)
GET  /admin/portal/tokens           (manage portal tokens)
POST /admin/clients/:id/portal-token/regenerate
GET  /admin/portal/snoozed

# Project periods
GET  /admin/periods

# Contract internals
GET  /admin/contracts/:id/payment-plan
GET  /admin/contracts/renewals-due

# Payments deep
GET  /admin/payments/intents
GET  /admin/payments/events
GET  /admin/payment-tickets
POST /admin/payment-tickets/:id/resolve  (exists) → wire UI

# Webhooks
GET  /admin/webhooks
POST /admin/webhooks/:id/retry
POST /admin/webhooks/config

# Campaign internals
GET  /admin/campaigns/:id/kpi-history
GET  /admin/campaigns/kpi-audit        (fraud/integrity)
GET  /admin/campaigns/ab-tests

# Performance & quality
GET  /admin/performance/staff          (scorecards)
GET  /admin/performance/satisfaction

# System errors
GET  /admin/errors
POST /admin/errors/:id/resolve          (exists in /health) → expose under /admin
GET  /admin/external-services

# Meta-control
GET  /admin/integrity/checks
GET  /admin/storage/usage
GET  /admin/imports/preview
POST /admin/imports/:type
GET  /admin/api-keys
POST /admin/api-keys
DELETE /admin/api-keys/:id
GET  /admin/messaging/audiences
POST /admin/messaging/send

# Security (needs schema)
GET  /admin/security/events
GET  /admin/users/:id/last-active       (or derived)
POST /admin/users/:id/impersonate       (Part 1)
POST /admin/users/:id/revoke-sessions   (Part 1)
```

## 15. Revised Phasing (absorbs Part 2)

- **Phase 0 — Foundations:** permissions + setting keys data migrations; **User
  security fields + Session + SecurityEvent schema migrations**; nav restructure
  to the §13 IA; adminApi scaffolding.
- **Phase 1 — Command Center + People + Security:** redesigned overview,
  global search, alerts, errors console, `/admin/users` + detail + bulk +
  impersonation/password-reset/per-user-perms, `/admin/security`, roles + matrix,
  sessions. *(The highest-leverage control surface.)*
- **Phase 2 — Business Operations:** clients (deep), requests, leads (+automation
  UI), proposals, contracts (incl. payment plans + renewals), projects (+files/
  meetings), periods, tasks (+delay alerts), campaigns (+A/B + KPI audit),
  marketing strategies, disputes (deepen), **chat oversight**, portal oversight.
- **Phase 3 — Finance & Revenue:** finance overview, invoices (force/write-off),
  payments deep (+events + tickets), payroll, bank accounts, gateways, currency.
- **Phase 4 — Platform Control & Config:** tabbed settings, integrations +
  webhooks, automation rules, notification templates, **broadcast/messaging**,
  feature flags, **storage**, **integrity checks**, **API keys**, **imports**,
  environment, backups/exports.
- **Phase 5 — Insight Layers:** **performance & quality**, **sales oversight**,
  **AI oversight**, reports hub, audit-log enhancements (export/drill-down).

Each phase stays independently shippable and gated behind `feature.admin_dashboard_v2`.

## 16. What this now guarantees the admin can do

Observe everything: every user, role, permission, department, client, lead,
request, proposal, contract (+payment plans + renewals + versions), project
(+periods + files + meetings + revisions), task (+delay alerts + history),
campaign (+KPIs + A/B + audit), marketing strategy, invoice, payment (+events +
tickets), payroll, bank account, currency, dispute (+attachments + thread),
conversation, notification/broadcast, AI log/suggestion, portal activity +
tokens + snoozed items, system error, external service, audit log, security
event, storage usage, data-integrity issues.

Intervene anywhere: create/edit/activate/deactivate/soft-delete users in bulk,
reset passwords, change roles, grant per-user permissions, impersonate (audited),
revoke sessions, reassign PMs/assignees/account-managers, force project/task/
contract/invoice statuses (audited with reason), write off invoices, retry
webhooks, resolve payment tickets, approve/reject/close disputes + change PM,
broadcast notifications, send bulk messages, retry/reconfigure automations,
resolve system errors, manage feature flags, regenerate portal tokens, hide
chat conversations, run data exports/imports.

Configure the system: company/billing/branding/security/AI/notification
settings, service catalog + deliverable templates, currencies, payment
gateways, bank accounts, webhooks, automation rules, notification templates,
feature flags, AI toggles.

Audit it all: every intervention lands in the audit log with actor + before/
after + timestamp; KPI changes are independently audit-logged
(`CampaignKpiAuditLog`); security events captured; impersonation always logged.

---

## 17. Final scoping notes

- The schema additions in §12.1 are the only hard blockers; everything else is
  UI + thin admin endpoints over existing services. Validate the current
  auth/refresh-token implementation before adding a `Session` model — reuse if
  possible.
- Order of work should still follow phases; do **not** attempt all 40+ pages at
  once. Phase 1 alone delivers ~80% of perceived "admin control."
- Reuse existing endpoints where they already return cross-data (e.g.
  `finance/summary`, `finance/aging`, `finance/revenue-trend`, `finance/cashflow`,
  `sales/*`, `health/*`, `admin/disputes/*`) — wrap in admin pages instead of
  re-querying.