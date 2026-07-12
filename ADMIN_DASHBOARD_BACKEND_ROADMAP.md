# Admin Backend Roadmap

## Goal
Build a clean **admin control center** for Hassad Platform that lets admins monitor, manage, intervene, and report on the whole system without duplicating normal product workflows.

## Core principles
- **Backend first**: define data, rules, permissions, and audit trails before UI.
- **Admin = control + oversight**, not a second app flow.
- **Every important action is traceable**: who, what, when, why, before/after.
- **Safe intervention only**: force actions require a reason and history entry.
- **UI/pages come last**: only after APIs, data, and workflows are stable.

## Scope
Admin should manage:
- Sales / leads / requests
- Clients / accounts
- Teams: sales, PM, employees, marketing, finance
- Projects / tasks / deliverables
- Contracts / invoices / payments
- Disputes / escalations
- Security / sessions / impersonation
- Integrations / gateways / webhooks
- Reports / KPIs / exports
- System settings / feature flags / notification templates

---

# Phase 0 — Audit the current backend admin surface
## Goal
Understand what already exists and classify it into keep / extend / replace.

## Deliverables
- Inventory of current admin modules, controllers, services, and permissions.
- Map each admin endpoint to one of these buckets:
  - Monitoring
  - Intervention
  - Reporting
  - Security
  - Configuration
- Identify missing history tables, status logs, and admin-only actions.

## Output
A clean backend map for admin without changing business behavior yet.

---

# Phase 1 — Admin data model foundation
## Goal
Make admin actions reliable, auditable, and consistent.

## Add / standardize backend concepts
- **Admin action log**: all admin interventions in one place.
- **Entity timeline**: unified history view for client / lead / request / project / contract / task / invoice.
- **Suspension model**:
  - user suspension
  - client account suspension
  - reason, duration, actor, timestamps
- **System event log**:
  - webhook failures
  - gateway failures
  - notification failures
  - integration sync failures
- **Report snapshots** for KPI periods.

## Minimum fields for every admin intervention
- actorId
- targetType
- targetId
- actionType
- beforeState
- afterState
- reason
- createdAt

---

# Phase 2 — Operational control APIs
## Goal
Give admins the ability to manage live operations safely.

## Sales / Leads / Requests
- list, search, filter, and segment leads
- assign / reassign lead owner
- move lead stage with reason
- list requests by status, age, source, owner
- reassign request
- force request status with reason
- add internal notes
- flag stale/unassigned requests

## Clients / Accounts
- client profile summary
- client lifecycle status
- suspend / reactivate client account
- reassign account manager
- view client history and linked objects

## Teams / Users
- all users list by role/team/department
- suspend / reactivate user
- reset password / revoke sessions
- assign departments/roles/permissions
- impersonate user with full audit log
- workload and performance summary

## Projects / Delivery
- list projects by status, PM, client, age
- reassign PM
- archive / unarchive
- force project status with reason
- view milestones, periods, tasks, deliverables, revisions
- highlight stalled or overdue projects

## Contracts / Finance
- list contracts by status, activation state, renewal risk
- force contract status with reason
- cancel contract with reason
- view linked invoices/payments
- invoice status override only with audit
- write-off / refund / retry payment actions

---

# Phase 3 — KPI engine and reporting
## Goal
Make admin data measurable and decision-friendly.

## KPIs to produce
### Sales
- new leads
- lead-to-request conversion
- request-to-contract conversion
- average response time
- unassigned leads/requests

### Clients
- new clients
- active clients
- suspended clients
- repeat clients
- churned/stopped clients

### Projects
- active projects
- pending activation
- completed projects
- stalled projects
- overdue projects
- revision rate
- average completion time

### Tasks
- total tasks by status
- overdue tasks
- blocked tasks
- revision loops
- team output by department

### Finance
- invoiced amount
- paid amount
- overdue amount
- refunded amount
- write-offs
- gateway success/failure rate

### Teams
- workload per user
- throughput per role
- SLA compliance
- average quality score
- backlog per team

### System
- failed webhooks
- failed notifications
- integration sync failures
- security events
- impersonations

## Reporting outputs
- daily / weekly / monthly summaries
- client report
- lead report
- project report
- team performance report
- finance report
- system health report
- export CSV/PDF

---

# Phase 4 — Security, compliance, and system ops
## Goal
Make admin safe and production-ready.

## Add
- session management
- login lockouts / failed login tracking
- impersonation audit
- permission management UI/API support
- security events dashboard
- gateway health dashboard
- webhook log and retry support
- integration sync status
- backups status and restore record
- feature flags management
- notification templates management

## Rules
- no destructive admin action without reason
- no silent force-status changes
- all overrides create audit entries
- all critical failures become visible in admin

---

# Phase 5 — Admin intelligence and automation
## Goal
Reduce manual admin work.

## Add
- alerts for stalled requests/projects/contracts
- overdue invoice alerts
- unassigned lead/request alerts
- low workload / overloaded team alerts
- failed webhook/gateway alerts
- client inactivity alerts
- renewal risk alerts
- auto-segmentation for reports

## Optional automation
- auto-flag stale records
- auto-escalate overdue items
- auto-suggest reassignment
- auto-summarize entity timeline

---

# Phase 6 — Admin UI/pages
## Goal
Build pages only after backend is stable.

## Recommended pages
- **Overview**: KPIs, alerts, trends
- **Leads**: pipeline, ownership, conversion, aging
- **Requests**: status, assignee, notes, cancellation reasons
- **Clients**: account status, history, linked projects/contracts
- **Users & Teams**: roles, departments, workload, suspension, impersonation
- **Projects**: status, PM, delays, revisions, periods
- **Tasks**: department, assignee, due dates, progress, blockers
- **Contracts**: sent/signed/active/cancelled, renewal, activation
- **Finance**: invoices, payments, refunds, write-offs, gateways
- **Disputes**: open cases, escalation, resolution history
- **Integrations**: gateways, webhooks, sync health, retries
- **Audit Logs**: full system activity
- **Reports**: exports and scheduled reports
- **Security**: sessions, lockouts, impersonations
- **Settings**: feature flags, templates, environment config

## Page pattern
- table
- filters
- detail drawer / timeline
- actions panel

## Recommended clean UX structure

### Global layout
- left sidebar: modules
- top bar: search, alerts, user menu, quick actions
- main area: list / detail / report content

### UX rules
- one primary list per page
- detail opens in drawer or nested route
- use tabs only for related data on one entity
- keep destructive actions separated and confirmed
- show history/timeline in every entity detail page
- keep tables dense but readable with badges and quick filters

### Nested route structure
- `/admin/overview`
- `/admin/leads`
  - `/admin/leads/[id]`
  - `/admin/leads/[id]/history`
  - `/admin/leads/[id]/requests`
- `/admin/requests`
  - `/admin/requests/[id]`
  - `/admin/requests/[id]/timeline`
  - `/admin/requests/[id]/notes`
- `/admin/clients`
  - `/admin/clients/[id]`
  - `/admin/clients/[id]/timeline`
  - `/admin/clients/[id]/projects`
  - `/admin/clients/[id]/contracts`
  - `/admin/clients/[id]/invoices`
- `/admin/users`
  - `/admin/users/[id]`
  - `/admin/users/[id]/sessions`
  - `/admin/users/[id]/activity`
  - `/admin/users/[id]/permissions`
- `/admin/teams`
  - `/admin/teams/[team]`
  - `/admin/teams/[team]/members`
  - `/admin/teams/[team]/workload`
- `/admin/projects`
  - `/admin/projects/[id]`
  - `/admin/projects/[id]/timeline`
  - `/admin/projects/[id]/periods`
  - `/admin/projects/[id]/tasks`
  - `/admin/projects/[id]/deliverables`
- `/admin/tasks`
  - `/admin/tasks/[id]`
  - `/admin/tasks/[id]/history`
  - `/admin/tasks/[id]/comments`
- `/admin/contracts`
  - `/admin/contracts/[id]`
  - `/admin/contracts/[id]/history`
  - `/admin/contracts/[id]/invoices`
  - `/admin/contracts/[id]/payments`
- `/admin/finance`
  - `/admin/finance/invoices`
  - `/admin/finance/payments`
  - `/admin/finance/refunds`
  - `/admin/finance/gateways`
- `/admin/audit`
  - `/admin/audit/actions`
  - `/admin/audit/system-events`
  - `/admin/audit/security-events`
- `/admin/reports`
  - `/admin/reports/sales`
  - `/admin/reports/clients`
  - `/admin/reports/projects`
  - `/admin/reports/finance`
  - `/admin/reports/teams`
- `/admin/settings`
  - `/admin/settings/feature-flags`
  - `/admin/settings/templates`
  - `/admin/settings/integrations`
  - `/admin/settings/environment`

---

# Phase 7 — Final cleanup and consolidation
## Goal
Make admin easy to maintain.

## Cleanup targets
- merge duplicated admin logic
- centralize history/audit writing
- standardize intervention endpoints
- normalize permissions naming
- reduce cross-module coupling
- keep reporting read-only and fast

---

# Success criteria
Admin is successful when it can:
- detect issues early
- explain what happened in the system
- safely intervene when needed
- manage teams and accounts
- track KPI health across the whole company
- support finance and integrations reliably
- provide clean reports without touching normal user flows
