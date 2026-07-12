# Admin Dashboard Backend Specification

This document is the technical companion to `ADMIN_DASHBOARD_BACKEND_ROADMAP.md`.

## How to use the two files
- **ROADMAP.md** = mission, phases, and implementation order.
- **SPEC.md** = concrete backend scope for each phase.
- When working on a phase, read the matching section in this file.
- Implement phases in order; do not jump to UI before backend foundations.

---

# Phase 0 — Audit current admin surface
## Purpose
Understand existing admin code and classify what to keep, extend, or replace.

## Backend tasks
- inventory all admin controllers/services/permissions
- map endpoints to monitoring / intervention / reporting / security / config
- identify missing history, logs, and unsafe actions
- list duplicated logic and cross-module coupling

## Output
- admin surface map
- gap list
- keep/replace decision list

---

# Phase 1 — Data foundation
## Purpose
Create the admin data structures needed for control, traceability, and reporting.

## Required backend concepts
- admin action log
- entity timeline / unified history
- user suspension record
- client suspension record
- system event log
- report snapshot tables

## Minimum tracked fields
- actorId
- targetType
- targetId
- actionType
- reason
- beforeState
- afterState
- createdAt

## This phase must enable
- safe overrides
- full audit trail
- later KPI computation

---

# Phase 2 — Operational control APIs
## Purpose
Allow admins to manage live business operations.

## Lead / Request control
- list and filter leads/requests
- reassign owner/assignee
- force stage/status with reason
- add internal notes
- detect stale/unassigned items

## Client control
- view client summary
- suspend/reactivate client
- change account manager
- inspect linked requests/projects/contracts/invoices

## Team / User control
- list users by role/team/department
- suspend/reactivate user
- revoke sessions
- reset password
- impersonate user
- update role/permission bindings

## Project / Delivery control
- reassign PM
- archive/unarchive
- force project status with reason
- view periods/tasks/deliverables/revisions

## Contract / Finance control
- cancel contract with reason
- force contract status with reason
- inspect invoices/payments
- write-off/refund/retry payment

---

# Phase 3 — KPI engine and reporting
## Purpose
Make admin decisions data-driven.

## Metrics to compute
### Sales
- leads created
- request conversion rate
- request aging
- unassigned requests

### Clients
- active clients
- suspended clients
- churned clients
- repeat clients

### Projects
- active/pending/completed/stalled/overdue
- revision rate
- average delivery time

### Tasks
- tasks by status
- overdue tasks
- blocked tasks
- team throughput

### Finance
- invoiced
- paid
- overdue
- refunded
- write-offs
- gateway failures

### System
- failed webhooks
- failed notifications
- security events
- impersonations

## Reports
- daily/weekly/monthly summaries
- per team
- per client
- per project
- per finance bucket
- CSV/PDF export

---

# Phase 4 — Security and system ops
## Purpose
Protect admin operations and surface system health.

## Add support for
- session management
- login lockouts
- impersonation audit trail
- security events dashboard
- gateway health
- webhook retry logs
- integration sync status
- backup status
- feature flags
- notification templates

## Rules
- all critical admin actions require reason
- all overrides create audit entries
- all failures are visible in admin

---

# Phase 5 — Automation and alerts
## Purpose
Reduce manual monitoring work.

## Alerts
- stalled requests/projects/contracts
- overdue invoices
- unassigned leads/requests
- overloaded / underloaded team members
- failed gateways/webhooks
- inactive clients
- renewal risk

## Optional automation
- auto-flag stale records
- auto-escalate overdue items
- auto-suggest reassignment
- auto-generate entity summaries

---

# Phase 6 — UI/pages
## Purpose
Build pages after backend is stable.

## Pages
- Overview
- Leads
- Requests
- Clients
- Users & Teams
- Projects
- Tasks
- Contracts
- Finance
- Disputes
- Integrations
- Audit Logs
- Reports
- Security
- Settings

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

# Phase mapping to roadmap
- `ROADMAP Phase 0` -> `SPEC Phase 0`
- `ROADMAP Phase 1` -> `SPEC Phase 1`
- `ROADMAP Phase 2` -> `SPEC Phase 2`
- `ROADMAP Phase 3` -> `SPEC Phase 3`
- `ROADMAP Phase 4` -> `SPEC Phase 4`
- `ROADMAP Phase 5` -> `SPEC Phase 5`
- `ROADMAP Phase 6` -> `SPEC Phase 6`
- `ROADMAP Phase 7` -> final cleanup after all above
