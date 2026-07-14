# Admin Dashboard Readiness Plan

Date: 2026-07-14
Scope: admin dashboard UX, management depth, finance, users, clients, projects, sales pipeline, contracts, invoices, payments, and payment gateway operations.

> This is a planning document only. No implementation/code changes are included in this plan.

---

## 1. Executive summary

The current admin dashboard is not empty, but it is still not deployment-ready as a true management console. The main problem is not the tables; the tables are mostly acceptable. The problem is that many admin areas stop at shallow summaries and do not give the administrator enough context, decision support, or safe operational actions.

Admin should be able to answer these questions quickly:

- Who is this client and what is their full business/portal/financial/project history?
- Who owns the relationship: sales owner, PM, accountant, team members?
- What was sold, proposed, contracted, delivered, invoiced, paid, overdue, or disputed?
- Which users are active, suspended, overloaded, underperforming, or risky?
- Which payment gateways are configured, healthy, failing, or missing credentials?
- What actions can admin safely take, and where is the audit trail?

The target is to convert admin from “generated list pages” into a complete control center.

---

## 2. Current-state findings from the codebase

### 2.1 Good existing foundations

Observed existing admin routes include:

- `apps/web/app/(dashboard)/dashboard/admin/clients`
- `apps/web/app/(dashboard)/dashboard/admin/clients/[id]`
- `apps/web/app/(dashboard)/dashboard/admin/projects/[id]`
- `apps/web/app/(dashboard)/dashboard/admin/employees/[id]`
- `apps/web/app/(dashboard)/dashboard/admin/contracts/[id]`
- `apps/web/app/(dashboard)/dashboard/admin/leads/[id]`
- `apps/web/app/(dashboard)/dashboard/admin/finance`
- `apps/web/app/(dashboard)/dashboard/admin/integrations`

Existing API foundations include:

- Admin clients API: `apps/web/features/admin/adminClientsApi.ts`
- Admin projects API: `apps/web/features/admin/adminProjectsApi.ts`
- Admin users API: `apps/web/features/admin/adminUsersApi.ts`
- Admin finance API: `apps/web/features/admin/adminFinanceApi.ts`
- Admin backend module: `apps/api/src/modules/admin/*`
- Payments backend module: `apps/api/src/modules/payments/*`

So the work should not be a rewrite. It should be a structured upgrade using existing admin APIs and proven Sales/PM UI patterns.

### 2.2 Main weaknesses

1. Admin detail pages exist, but many are shallow.
2. Admin list pages contain actions like “Add client/user/project”, but actions are not fully wired or supported by rich flows.
3. Admin client detail does not yet match the richness of the sales client detail experience.
4. Admin project detail is much poorer than PM project detail and lacks full operational context.
5. Admin employee/user detail lacks strong management actions and assignment/workload visibility.
6. Admin finance page consumes only a small part of the backend finance overview response.
7. Payment gateways UI is mostly read-only and does not expose configuration, tests, secure status, bank accounts, webhook logs, or retry flows.
8. Several backend payment/admin endpoints exist but are not fully represented in UI.
9. Some API contracts/types appear incomplete compared with backend responses, especially finance overview.
10. Admin pages need stronger auditability: every risky action should require confirmation, reason, and visible history.

---

## 3. Product standard for a deployment-ready admin dashboard

Every admin resource should follow this standard pattern:

```txt
List page
  - searchable, filterable, paginated, exportable
  - clear status, owner, financial or operational indicators
  - row opens detail page

Detail page
  - header with title, status, owner, key actions
  - overview tab with business-critical summary
  - related records tabs
  - activity/history tab
  - financial tab when relevant
  - safe action panel with confirmation and audit reason

Actions
  - permission-protected
  - validated forms
  - optimistic UI only where safe
  - server source of truth
  - mutation invalidates affected RTK Query tags
  - audit log/history visible to admin
```

---

## 4. Architecture and clean-code rules

### 4.1 Frontend rules

- Reuse existing design-system components:
  - `PageIntro`
  - `SurfaceCard`
  - `DataTable`
  - `ActionButton`
  - `Tabs`
  - `StatCard`
  - `Skeleton`
- Do not duplicate Sales/PM logic blindly. Extract reusable presentational components where the same card/table is needed by multiple roles.
- Keep feature API slices under `apps/web/features/<domain>/`.
- Admin-specific API calls remain in `features/admin/*` unless a shared endpoint is intentionally reused.
- Use RTK Query tags consistently after mutations.
- Keep page files thin. Move complex sections into components under:
  - `components/dashboard/admin/clients/*`
  - `components/dashboard/admin/projects/*`
  - `components/dashboard/admin/users/*`
  - `components/dashboard/admin/finance/*`
  - `components/dashboard/admin/payments/*`
- Avoid double-unwrapping API responses because `baseQuery.ts` already unwraps the response envelope.
- Use Arabic RTL consistently.
- All destructive/risky actions need a modal with reason input.

### 4.2 Backend rules

- Keep controller thin, service owns logic.
- Every endpoint requires explicit permission decorator.
- Use DTOs instead of `any` for new/updated admin endpoints.
- Multi-table writes must use `prisma.$transaction()`.
- No hard deletes; use soft status flags where possible.
- Every admin intervention should write an admin action log and/or ledger/history row.
- Payment gateway secrets must never be returned to the frontend.
- Sensitive gateway fields should be write-only or masked.
- Use migrations for schema and data changes. Never use `prisma db push`.

---

## 5. Target admin information architecture

```txt
Admin
├── Overview
├── Clients
│   ├── List
│   └── Detail
│       ├── Overview
│       ├── Profile / brief
│       ├── Leads & requests
│       ├── Proposals
│       ├── Contracts
│       ├── Projects
│       ├── Invoices & payments
│       └── Activity / history
├── Users & Team
│   ├── Employees
│   ├── User detail
│   ├── Roles
│   ├── Permissions
│   ├── Sessions
│   └── Workload
├── Leads
├── Proposals
├── Contracts
├── Projects
│   └── Detail
│       ├── Overview
│       ├── Client brief
│       ├── Team & ownership
│       ├── Tasks / kanban
│       ├── Deliverables
│       ├── Periods / milestones
│       ├── Files / meetings
│       ├── Finance
│       └── Timeline / history
├── Finance
│   ├── Overview
│   ├── Invoices
│   ├── Payments
│   ├── Ledger
│   ├── Payroll
│   ├── Reports
│   └── Webhooks / payment events
├── Payment Gateways
│   ├── Gateways
│   ├── Bank accounts
│   ├── Webhook logs
│   ├── Health checks
│   └── Configuration
└── Settings / Security / Audit
```

---

## 6. Step-by-step implementation plan

## Phase 0 — Full audit and contracts freeze

Goal: know exactly what exists before coding.

Steps:

1. Inventory all admin pages and compare them with available backend endpoints.
2. Inventory Sales/PM pages that already provide richer UI:
   - Sales client detail
   - PM project detail
   - Finance role pages
3. Document missing frontend routes, missing API mutations, and API response mismatches.
4. Confirm permission keys for all planned actions.
5. Decide what is reused, what is admin-specific, and what needs backend extension.

Deliverables:

- Gap matrix: page → current status → needed data → needed actions → backend support.
- Final route map.
- Final endpoint/action map.

Verification:

- No code change required.

---

## Phase 1 — Admin clients: make client management complete

Goal: admin client detail should be at least as useful as Sales client detail, plus admin controls.

Frontend steps:

1. Upgrade `dashboard/admin/clients/[id]` header:
   - company name
   - contact name
   - email/phone
   - status
   - portal access
   - account owner/sales owner
   - quick actions
2. Add richer overview cards:
   - client profile/business info
   - contact info
   - portal status
   - sales owner/account manager
   - last login
   - creation/update dates
3. Add client brief/profile tab by reusing Sales/ClientBrief patterns where possible.
4. Add related tabs:
   - leads/requests
   - proposals
   - contracts
   - projects
   - invoices/payments
   - history/activity
5. Add actions:
   - edit client
   - activate/suspend client
   - invite/reset portal access
   - assign/change manager/sales owner
   - create request for this client
6. Add clear empty states and loading/error states.

Backend steps:

1. Confirm `GET /admin/clients/:id/full` has all needed relations.
2. Add missing fields only if necessary:
   - sales owner
   - portal user state
   - client brief/profile
   - proposals/requests relation
3. Add/admin-safe mutations if missing:
   - suspend/activate client
   - assign manager
   - portal invite/reset
4. Ensure every action logs history.

Priority: Critical.

---

## Phase 2 — Admin users/employees: real team management

Goal: admin can create, inspect, suspend, and manage users safely.

Frontend steps:

1. Wire “Add employee” to a real create-user modal/page.
2. Upgrade employee detail header:
   - name
   - role
   - department
   - active/suspended status
   - last login
   - security/session indicators
3. Add tabs:
   - profile
   - assignments
   - workload/performance
   - activity
   - sessions
   - permissions
4. Add actions:
   - edit profile
   - activate/suspend
   - reset password
   - revoke sessions
   - change role
   - update permissions when allowed
5. Add assignment visibility:
   - active projects
   - active tasks
   - owned leads/clients
   - managed contracts/projects

Backend steps:

1. Confirm admin user mutations are safe and typed.
2. Replace `Partial<AdminUserItem>` frontend create/update payloads with explicit DTO-aligned types.
3. Confirm suspend is soft (`isActive=false`) not delete.
4. Ensure reset/revoke/permission actions write audit logs.

Priority: Critical.

---

## Phase 3 — Admin projects: match PM depth plus admin ownership context

Goal: admin project detail should show operational, ownership, team, contract, and finance context.

Frontend steps:

1. Upgrade admin project header:
   - project name
   - client
   - status/priority
   - PM
   - sales owner/source contract/request
   - total value and remaining value
   - progress
2. Add overview cards:
   - client brief
   - contract value/monthly value
   - project manager
   - team members
   - overdue tasks
   - current period/milestone
3. Add team/ownership tab:
   - PM
   - sales/account owner
   - assigned members
   - role per member
   - add/remove member actions
   - change PM action
4. Add tasks tab using richer PM task patterns where safe.
5. Add deliverables and periods tabs with status summaries.
6. Add finance tab:
   - contract value
   - invoices
   - payments
   - outstanding amount
   - overdue invoices
7. Add timeline/history tab with state changes.
8. Add admin actions:
   - edit project metadata
   - change PM
   - assign team member
   - archive project
   - open related client/contract/invoices

Backend steps:

1. Confirm `GET /admin/projects/:id` returns enough ownership context.
2. Add missing sales owner/request/proposal/contract details if needed.
3. Add admin mutations for PM/team assignment only if existing project endpoints are insufficient.
4. Ensure project changes write history/action logs.

Priority: Critical.

---

## Phase 4 — Finance dashboard: expose real business health

Goal: admin finance should become a management area, not only four cards and two tables.

Frontend steps:

1. Align `AdminFinanceOverview` TypeScript type with actual backend response:
   - summary
   - metrics
   - aging
   - cashflow
   - topClients
   - revenueTrend
   - alerts
   - refundRate
   - paymentMethodDistribution
   - topOverdueInvoices
   - paidVsUnpaid
2. Upgrade finance overview UI:
   - revenue cards
   - invoiced/paid/unpaid/overdue
   - cashflow trend
   - aging buckets
   - top clients by revenue
   - finance alerts
   - refund rate
   - payment method distribution
3. Add admin finance subpages or tabs:
   - invoices
   - payments
   - ledger
   - webhook logs
   - payment events
4. Add invoice actions for permitted admins:
   - force invoice status
   - write off
   - refund
   - view payment events
5. Add safety modals with reason field.

Backend steps:

1. Review `AdminFinanceService` intervention methods for accounting correctness.
2. Confirm refund behavior is correct for all payment methods.
3. Confirm ledger/action log coverage.
4. Add stricter DTO validation for force-status/write-off/refund.
5. Confirm invoice status transitions do not silently break finance reports.

Priority: Critical.

---

## Phase 5 — Payment gateways UI and backend hardening

Goal: admin can manage payment infrastructure safely before deployment.

Frontend steps:

1. Add dedicated route:
   - `/dashboard/admin/payment-gateways`
   - or improve `/dashboard/admin/integrations` with a full gateways section.
2. Show gateway list:
   - name
   - type
   - active/inactive
   - mode: test/live if available
   - configured/missing config
   - last updated
   - total payments
   - health status
   - recent failures
3. Add gateway detail/edit UI:
   - enable/disable
   - public key
   - secret key write-only
   - webhook secret write-only
   - supported currencies/methods
   - masked existing secret indicators
4. Add bank account management UI:
   - list accounts
   - create/update/deactivate account
5. Add webhook logs UI:
   - provider filter
   - processed/failed filter
   - payload preview
   - retry failed webhook with reason
6. Add payment events UI:
   - event type
   - payload
   - linked payment/invoice
7. Add “check gateway health” action.

Backend steps:

1. Payments controller currently has gateway/bank account endpoints but some endpoints lack visible guards at controller level. Review and ensure all sensitive endpoints are protected by `JwtAuthGuard` + `PermissionsGuard`.
2. Replace `any` DTOs in payment gateway and bank account endpoints.
3. Never return decrypted gateway secrets.
4. Add masked config status response:
   - `hasSecretKey`
   - `hasWebhookSecret`
   - `hasPublicKey`
5. Confirm webhook signature validation and raw body configuration are correct.
6. Add duplicate webhook protection/idempotency if missing.
7. Ensure gateway config updates write admin action logs.

Priority: Critical for deployment.

---

## Phase 6 — Leads, proposals, contracts, requests: full sales chain visibility

Goal: admin sees the complete lifecycle from lead to project and payment.

Frontend steps:

1. Lead detail:
   - lead owner
   - stage
   - contact history
   - pipeline history
   - related requests/proposals/client if converted
   - reassign action
2. Proposal detail:
   - client/lead
   - items/services
   - totals
   - status
   - sent/approved/rejected history
   - contract linkage
3. Contract detail:
   - parties
   - value/monthly value
   - status
   - payment plan
   - invoices/payments
   - project linkage
   - versions/signatures/history
4. Request detail:
   - client
   - intake/brief
   - assignment
   - converted entities
   - notes/timeline

Backend steps:

1. Ensure admin endpoints return linked entity chain IDs.
2. Ensure status transitions remain server-controlled.
3. Add missing history endpoints only where no existing logs are available.

Priority: High.

---

## Phase 7 — Admin overview/dashboard intelligence

Goal: the admin landing page should guide action, not just show counts.

Frontend steps:

1. Add executive cards:
   - monthly revenue
   - overdue amount
   - active projects
   - delayed projects
   - pending approvals
   - failed payments/webhooks
   - open disputes
2. Add “needs attention” panels:
   - overdue invoices
   - projects behind schedule
   - overloaded team members
   - gateway failures
   - unassigned leads/projects
3. Add quick navigation to affected detail pages.
4. Add date range filters.

Backend steps:

1. Confirm admin dashboard service exposes these metrics efficiently.
2. Avoid N+1 queries.
3. Add indexes if required by query patterns.

Priority: High.

---

## Phase 8 — UX polish, consistency, and accessibility

Goal: make the admin dashboard feel intentionally designed.

Steps:

1. Standardize page headers and breadcrumbs.
2. Standardize detail tabs across clients/projects/users/contracts.
3. Standardize empty/loading/error states.
4. Standardize Arabic labels for statuses and roles.
5. Add clickable relations everywhere:
   - client → detail
   - project → detail
   - invoice → detail
   - payment → detail
   - user → detail
6. Add responsive behavior for mobile/tablet.
7. Add clear disabled states when permissions do not allow actions.

Priority: Medium/High.

---

## Phase 9 — Deployment readiness verification

Goal: prove the admin dashboard is reliable before production.

Checks:

1. Run frontend verify:
   - `npm run verify --filter=web`
2. Run API verify:
   - `npm run verify --filter=api`
3. Run full verify:
   - `npm run verify`
4. Run full build once at integration:
   - `turbo build`
5. Manual smoke test using admin account:
   - clients list/detail/actions
   - employees list/detail/actions
   - projects list/detail/actions
   - finance overview/invoice actions
   - payment gateway settings
   - webhook retry
6. Confirm no leaked dev processes.
7. Confirm production env requirements:
   - `PAYMENT_ENCRYPTION_KEY`
   - gateway secrets
   - webhook secrets
   - JWT secrets
   - database migrations applied

---

## 7. Recommended implementation order

1. Phase 0 — audit and gap matrix.
2. Phase 4 + Phase 5 — finance/payment gateways because deployment risk is highest.
3. Phase 1 — clients because admin needs client control.
4. Phase 3 — projects because delivery visibility is critical.
5. Phase 2 — users/team because admin actions are required.
6. Phase 6 — sales chain detail.
7. Phase 7 — intelligence dashboard.
8. Phase 8 — polish.
9. Phase 9 — final verification.

---

## 8. Highest-risk areas to review carefully

1. Payment gateway configuration and secret handling.
2. Webhook raw body/signature validation.
3. Duplicate webhook/idempotency behavior.
4. Admin financial interventions: force status, write-off, refund.
5. User suspension/session revocation security.
6. Project member/PM reassignment side effects.
7. Client portal access reset/invite flows.
8. Permissions coverage for all admin actions.
9. Missing migration/data migration for new permissions.

---

## 9. Definition of done

The admin dashboard is deployment-ready when:

- Admin can open detail pages for all major resources.
- Detail pages show related entities and business context, not just IDs.
- Admin can safely manage users, clients, projects, finance, and gateways.
- Every risky action requires confirmation and reason.
- Every risky action is permission-protected and audited.
- Payment gateways can be configured, monitored, and troubleshot from UI.
- Finance has real dashboards, invoice/payment detail, webhook logs, and interventions.
- Tables remain searchable/filterable/paginated.
- All pages have loading/error/empty states.
- `npm run verify` and final `turbo build` pass.

---

## 10. Immediate next task recommendation

Start with Phase 0 as a no-code audit and produce a gap matrix. After that, implement Phase 5 payment gateways and Phase 4 finance UI/backend hardening first, because these are the biggest deployment risks.
