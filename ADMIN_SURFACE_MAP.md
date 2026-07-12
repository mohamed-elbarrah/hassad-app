# Admin Surface Map — Phase 0 Audit

Generated: 2026-07-12

---

## 1. Overview

| Metric | Count |
|--------|-------|
| Admin controllers | 29 (in `admin/` module) + 1 (in `disputes/` module) |
| Admin services | 28 |
| Total admin endpoints | 104 |
| Monitoring endpoints | 46 |
| Intervention endpoints | 33 |
| Reporting endpoints | 7 |
| Security endpoints | 5 |
| Configuration endpoints | 13 |

### Permission keys used in admin controllers

27 unique `admin.*` keys used in `@RequirePermissions()` decorators across admin controllers:

`admin.stats`, `admin.stats.trends`, `admin.funnel`, `admin.alerts`, `admin.audit`, `admin.settings`, `admin.dashboard`, `admin.reports`, `admin.notifications`, `admin.team`, `admin.marketing`, `admin.users.read`, `admin.users.manage`, `admin.users.impersonate`, `admin.sessions.read`, `admin.security.read`, `admin.projects.read`, `admin.projects.intervene`, `admin.projects.create`, `admin.tasks.read`, `admin.tasks.intervene`, `admin.contracts.read`, `admin.contracts.intervene`, `admin.leads.read`, `admin.requests.read`, `admin.requests.intervene`, `admin.campaigns.create`, `admin.campaigns.read`, `admin.chat.read`, `admin.chat.moderate`, `admin.portal.read`, `admin.portal.manage`, `admin.finance.read`, `admin.finance.intervene`, `admin.proposals.read`, `admin.proposals.intervene`, `admin.clients.read`, `admin.portal`

Plus 1 external: `disputes.admin`

---

## 2. Endpoint Classification by Category

### 2.1 Monitoring (46 endpoints)

Read-only endpoints that observe state without changing it.

| # | Controller | Method | Path | Permission |
|---|-----------|--------|------|-----------|
| 1 | AdminController | GET | `admin/stats` | `admin.stats` |
| 2 | AdminController | GET | `admin/stats/trends` | `admin.stats.trends` |
| 3 | AdminController | GET | `admin/funnel` | `admin.funnel` |
| 4 | AdminController | GET | `admin/alerts` | `admin.alerts` |
| 5 | AdminController | GET | `admin/recent-activity` | `admin.stats` |
| 6 | AdminController | GET | `admin/health` | `admin.stats` |
| 7 | AdminProjectsController | GET | `admin/projects` | `admin.projects.read` |
| 8 | AdminProjectsController | GET | `admin/projects/:id` | `admin.projects.read` |
| 9 | AdminLeadsController | GET | `admin/leads` | `admin.leads.read` |
| 10 | AdminLeadsController | GET | `admin/leads/stats` | `admin.leads.read` |
| 11 | AdminLeadsController | GET | `admin/leads/:id` | `admin.leads.read` |
| 12 | AdminCampaignsController | GET | `admin/campaigns` | `admin.campaigns.read` |
| 13 | AdminCampaignsController | GET | `admin/campaigns/:id` | `admin.campaigns.read` |
| 14 | AdminPortalController | GET | `admin/portal/overview` | `admin.portal.read` |
| 15 | AdminPortalController | GET | `admin/portal/clients` | `admin.portal.read` |
| 16 | AdminClientsController | GET | `admin/clients` | `admin.clients.read` |
| 17 | AdminClientsController | GET | `admin/clients/stats` | `admin.clients.read` |
| 18 | AdminClientsController | GET | `admin/clients/:id` | `admin.clients.read` |
| 19 | AdminClientsController | GET | `admin/clients/:id/full` | `admin.clients.read` |
| 20 | AdminClientsController | GET | `admin/clients/:id/history` | `admin.clients.read` |
| 21 | AdminUsersController | GET | `admin/users` | `admin.users.read` |
| 22 | AdminUsersController | GET | `admin/users/:id` | `admin.users.read` |
| 23 | AdminUsersController | GET | `admin/users/:id/performance` | `admin.users.read` |
| 24 | AdminUsersController | GET | `admin/users/:id/activity` | `admin.users.read` |
| 25 | AdminContractsController | GET | `admin/contracts` | `admin.contracts.read` |
| 26 | AdminContractsController | GET | `admin/contracts/:id` | `admin.contracts.read` |
| 27 | AdminProposalsController | GET | `admin/proposals` | `admin.proposals.read` |
| 28 | AdminProposalsController | GET | `admin/proposals/stats` | `admin.proposals.read` |
| 29 | AdminProposalsController | GET | `admin/proposals/:id` | `admin.proposals.read` |
| 30 | AdminRequestsController | GET | `admin/requests` | `admin.requests.read` |
| 31 | AdminRequestsController | GET | `admin/requests/:id` | `admin.requests.read` |
| 32 | AdminFinanceController | GET | `admin/finance/overview` | `admin.finance.read` |
| 33 | AdminFinanceController | GET | `admin/finance/payment-events` | `admin.finance.read` |
| 34 | AdminFinanceController | GET | `admin/finance/webhook-logs` | `admin.finance.read` |
| 35 | AdminFinanceController | GET | `admin/finance/gateways-health` | `admin.finance.read` |
| 36 | AdminDashboardController | GET | `admin/dashboard/attention` | `admin.dashboard` |
| 37 | AdminDashboardController | GET | `admin/dashboard/recent-activity` | `admin.dashboard` |
| 38 | AdminDashboardController | GET | `admin/dashboard/team-workload` | `admin.dashboard` |
| 39 | AdminNotificationTemplatesController | GET | `admin/notification-templates` | `admin.notifications` |
| 40 | AdminNotificationTemplatesController | GET | `admin/notification-templates/event-types` | `admin.notifications` |
| 41 | AdminNotificationTemplatesController | GET | `admin/notification-templates/:id` | `admin.notifications` |
| 42 | AdminNotificationTemplatesController | GET | `admin/notification-templates/:id/logs` | `admin.notifications` |
| 43 | AdminAuditController | GET | `admin/audit-log` | `admin.audit` |
| 44 | AdminAuditController | GET | `admin/audit-log/filters` | `admin.audit` |
| 45 | AdminTeamController | GET | `admin/team/workload` | `admin.team` |
| 46 | AdminTeamController | GET | `admin/team/workload/:userId` | `admin.team` |
| 47 | AdminDeliverablesController | GET | `admin/deliverables` | `admin.projects` |
| 48 | AdminDeliverablesController | GET | `admin/revision-requests` | `admin.projects` |
| 49 | AdminIntakeFormsController | GET | `admin/portal/intake-forms` | `admin.portal` |
| 50 | AdminMarketingController | GET | `admin/marketing/strategies` | `admin.marketing` |
| 51 | AdminIntegrationsController | GET | `admin/integrations/webhook-logs` | `admin.settings` |
| 52 | AdminAutomationController | GET | `admin/automation/logs` | `admin.settings` |
| 53 | AdminBackupsController | GET | `admin/exports/:type` | `admin.settings` |
| 54 | AdminDisputesController | GET | `admin/disputes` | `disputes.admin` |
| 55 | AdminDisputesController | GET | `admin/disputes/stats` | `disputes.admin` |
| 56 | AdminDisputesController | GET | `admin/disputes/pm/:pmId/stats` | `disputes.admin` |
| 57 | AdminDisputesController | GET | `admin/disputes/:id` | `disputes.admin` |

### 2.2 Intervention (33 endpoints)

Any POST/PATCH/PUT/DELETE that changes system state.

| # | Controller | Method | Path | Permission |
|---|-----------|--------|------|-----------|
| 1 | AdminProjectsController | POST | `admin/projects` | `admin.projects.create` |
| 2 | AdminProjectsController | POST | `admin/projects/:id/reassign-pm` | `admin.projects.intervene` |
| 3 | AdminProjectsController | POST | `admin/projects/:id/archive` | `admin.projects.intervene` |
| 4 | AdminProjectsController | POST | `admin/projects/:id/force-status` | `admin.projects.intervene` |
| 5 | AdminProjectsController | POST | `admin/projects/:id/members` | `admin.projects.intervene` |
| 6 | AdminProjectsController | POST | `admin/projects/:id/tasks` | `admin.projects.intervene` |
| 7 | AdminLeadsController | POST | `admin/leads/:id/reassign` | `admin.leads.read` ⚠️ |
| 8 | AdminLeadsController | POST | `admin/leads/:id/contact-log` | `admin.leads.read` ⚠️ |
| 9 | AdminLeadsController | POST | `admin/leads/:id/convert-to-client` | `admin.leads.read` ⚠️ |
| 10 | AdminCampaignsController | POST | `admin/campaigns` | `admin.campaigns.create` |
| 11 | AdminCampaignsController | PATCH | `admin/campaigns/:id` | `admin.campaigns.read` ⚠️ |
| 12 | AdminCampaignsController | POST | `admin/campaigns/:id/pause` | `admin.campaigns.read` ⚠️ |
| 13 | AdminCampaignsController | POST | `admin/campaigns/:id/end` | `admin.campaigns.read` ⚠️ |
| 14 | AdminPortalController | POST | `admin/portal/clients/:id/regenerate-token` | `admin.portal.manage` |
| 15 | AdminPortalController | POST | `admin/portal/clients/:id/toggle-access` | `admin.portal.manage` |
| 16 | AdminUsersController | POST | `admin/users` | `admin.users.manage` |
| 17 | AdminUsersController | POST | `admin/users/bulk` | `admin.users.manage` |
| 18 | AdminUsersController | POST | `admin/users/:id/reset-password` | `admin.users.manage` |
| 19 | AdminUsersController | PATCH | `admin/users/:id` | `admin.users.manage` |
| 20 | AdminUsersController | POST | `admin/users/:id/permissions` | `admin.users.manage` |
| 21 | AdminContractsController | POST | `admin/contracts/:id/status` | `admin.contracts.intervene` |
| 22 | AdminContractsController | POST | `admin/contracts/:id/cancel` | `admin.contracts.intervene` |
| 23 | AdminContractsController | POST | `admin/contracts/:id/trigger-renewal-alert` | `admin.contracts.intervene` |
| 24 | AdminContractsController | POST | `admin/contracts/:id/convert-to-project` | `admin.contracts.intervene` |
| 25 | AdminProposalsController | POST | `admin/proposals/:id/convert-to-contract` | `admin.proposals.intervene` |
| 26 | AdminRequestsController | POST | `admin/requests/:id/reassign` | `admin.requests.intervene` |
| 27 | AdminRequestsController | POST | `admin/requests/:id/force-status` | `admin.requests.intervene` |
| 28 | AdminRequestsController | PATCH | `admin/requests/:id/notes` | `admin.requests.intervene` |
| 29 | AdminFinanceController | POST | `admin/finance/invoices/:id/force-status` | `admin.finance.intervene` |
| 30 | AdminFinanceController | POST | `admin/finance/invoices/:id/write-off` | `admin.finance.intervene` |
| 31 | AdminFinanceController | POST | `admin/finance/invoices/:id/refund` | `admin.finance.intervene` |
| 32 | AdminFinanceController | POST | `admin/finance/webhook-logs/:id/retry` | `admin.finance.intervene` |
| 33 | AdminTasksController | POST | `admin/tasks/:id/reassign` | `admin.tasks.intervene` |
| 34 | AdminTasksController | POST | `admin/tasks/:id/force-transition` | `admin.tasks.intervene` |
| 35 | AdminChatController | POST | `admin/conversations/:id/hide` | `admin.chat.moderate` |
| 36 | AdminMarketingController | PATCH | `admin/marketing/strategies/:id/status` | `admin.marketing` |
| 37 | AdminIntegrationsController | POST | `admin/integrations/webhook-logs/:id/retry` | `admin.settings` |
| 38 | AdminDisputesController | POST | `admin/disputes/:id/approve` | `disputes.admin` |
| 39 | AdminDisputesController | POST | `admin/disputes/:id/reject` | `disputes.admin` |
| 40 | AdminDisputesController | POST | `admin/disputes/:id/change-pm` | `disputes.admin` |
| 41 | AdminDisputesController | POST | `admin/disputes/:id/close` | `disputes.admin` |
| 42 | AdminDisputesController | POST | `admin/disputes/:id/messages` | `disputes.admin` |

⚠️ = uses read permission for mutation (likely a bug)

### 2.3 Reporting (7 endpoints)

| # | Controller | Method | Path | Permission |
|---|-----------|--------|------|-----------|
| 1 | AdminReportsController | GET | `admin/reports/sales` | `admin.reports` |
| 2 | AdminReportsController | GET | `admin/reports/revenue` | `admin.reports` |
| 3 | AdminReportsController | GET | `admin/reports/projects` | `admin.reports` |
| 4 | AdminReportsController | GET | `admin/reports/team-performance` | `admin.reports` |
| 5 | AdminReportsController | GET | `admin/reports/satisfaction` | `admin.reports` |
| 6 | AdminReportsController | GET | `admin/reports/campaigns` | `admin.reports` |
| 7 | AdminReportsController | GET | `admin/reports/export` | `admin.reports` |

### 2.4 Security (5 endpoints)

| # | Controller | Method | Path | Permission |
|---|-----------|--------|------|-----------|
| 1 | AdminUsersController | POST | `admin/users/:id/impersonate` | `admin.users.impersonate` |
| 2 | AdminUsersController | POST | `admin/users/:id/revoke-sessions` | `admin.users.manage` |
| 3 | AdminSessionsController | GET | `admin/sessions` | `admin.sessions.read` |
| 4 | AdminSessionsController | POST | `admin/sessions/:id/revoke` | `admin.users.manage` |
| 5 | AdminSecurityController | GET | `admin/security/events` | `admin.security.read` |
| 6 | AdminSecurityController | GET | `admin/security/stats` | `admin.security.read` |

### 2.5 Configuration (13 endpoints)

| # | Controller | Method | Path | Permission |
|---|-----------|--------|------|-----------|
| 1 | AdminSettingsController | GET | `admin/settings` | `admin.settings` |
| 2 | AdminSettingsController | POST | `admin/settings` | `admin.settings` |
| 3 | AdminSettingsController | POST | `admin/settings/seed-defaults` | `admin.settings` |
| 4 | AdminFeatureFlagsController | GET | `admin/feature-flags` | `admin.settings` |
| 5 | AdminFeatureFlagsController | GET | `admin/feature-flags/defaults` | `admin.settings` |
| 6 | AdminFeatureFlagsController | POST | `admin/feature-flags/:key` | `admin.settings` |
| 7 | AdminEnvironmentController | GET | `admin/environment` | `admin.settings` |
| 8 | AdminNotificationTemplatesController | PATCH | `admin/notification-templates/:id` | `admin.notifications` |
| 9 | AdminIntegrationsController | GET | `admin/integrations/ad-platforms` | `admin.settings` |
| 10 | AdminIntegrationsController | GET | `admin/integrations/gateways` | `admin.settings` |
| 11 | AdminAutomationController | GET | `admin/automation/rules` | `admin.settings` |
| 12 | AdminAutomationController | GET | `admin/automation/rules/:id` | `admin.settings` |
| 13 | AdminAutomationController | POST | `admin/automation/rules` | `admin.settings` |
| 14 | AdminAutomationController | PATCH | `admin/automation/rules/:id` | `admin.settings` |
| 15 | AdminAutomationController | DELETE | `admin/automation/rules/:id` | `admin.settings` |

---

## 3. Gap Analysis

### P0 — Critical Missing Concepts (blocks Phase 1+)

| # | Gap | Impact | Required by |
|---|-----|--------|-------------|
| G1 | **No `AdminActionLog` model** — no centralized table for all admin interventions. Ledger table exists but is generic; no way to query "all admin actions across all domains" | Cannot fulfill "track every admin intervention" requirement | Phase 1§Admin action log |
| G2 | **No user suspension model** — User has `failedLoginAttempts` + `lockedUntil` but no `suspendedAt`, `suspendedUntil`, `suspendReason`, `suspendedBy`. No soft-suspend mechanism. | Cannot suspend users safely | Phase 1§Suspension model, Phase 2§Team/User control |
| G3 | **No client suspension model** — Client has only `LEAR`, `ACTIVE`, `STOPPED` status. No `suspendedAt`, `suspendedUntil`, `suspendReason`. | Cannot suspend/reactivate clients with proper audit trail | Phase 1§Suspension model, Phase 2§Client control |
| G4 | **No unified system event log** — `webhook_logs` exists but scoped to incoming webhooks only. No model for notification failures, gateway failures, integration sync failures. | Cannot track system health holistically | Phase 1§System event log, Phase 3§System KPIs |
| G5 | **No report snapshot tables** — no model to persist KPI snapshots for daily/weekly/monthly periods. CampaignKpiSnapshot exists but is campaign-specific. | Cannot compute period-over-period KPI trends | Phase 1§Report snapshots, Phase 3§KPI engine |
| G6 | **`admin.*` permissions not seeded** — 27 `admin.*` keys used in `@RequirePermissions()` across all admin controllers do not exist in the seed file. They work only because `PermissionsGuard` bypasses for ADMIN role. | Any non-ADMIN role accessing admin endpoints gets 403; permission model is implicit, not declarative | Phase 2+ (permission-based access) |

### P1 — Audit Trail Gaps

| # | Gap | Location | Detail |
|---|-----|----------|--------|
| A1 | **Projects force-status has no domain history** | `admin-projects.service.ts::forceStatus` | Writes to Ledger but NO `ProjectStatusHistory` model exists. No domain-specific status change record. |
| A2 | **Contracts cancel skips domain history** | `admin-contracts.service.ts::cancel` | Does not write to `contractStatusHistory` — inconsistent with `updateStatus` which does. |
| A3 | **Tasks reassign skips domain history** | `admin-tasks.service.ts::reassign` | Does not write to `taskStatusHistory`. |
| A4 | **Requests reassign skips domain history** | `admin-requests.service.ts::reassign` | Does not write to `requestStatusHistory`. |
| A5 | **Leads reassign skips domain history** | `admin-leads.service.ts::reassign` | Does not write to `leadPipelineHistory`. |
| A6 | **No `InvoiceStatusHistory` model** | `admin-finance.service.ts::forceInvoiceStatus` | Finance writes to Ledger only. No invoice-specific status history table exists. |
| A7 | **Hardcoded `"admin"` userId** | `admin-tasks.service.ts::forceTransition`, `admin-requests.service.ts::forceStatus` | Stores string `"admin"` instead of the actual admin's userId. |
| A8 | **Finance interventions not in `$transaction`** | `admin-finance.service.ts::forceInvoiceStatus`, `triggerRefund` | Audit write (`audit()` helper) runs after the mutation. If the process crashes between mutation and audit, the intervention is lost from history. |
| A9 | **Requests updateNotes has zero audit trail** | `admin-requests.service.ts::updateNotes` | No Ledger write, no history table write, no audit at all. |
| A10 | **Missing `reason` on many interventions** | Archive, reassign (all domains), retry-webhook | The `reason` param is a spec requirement for every admin intervention but is missing from these endpoints. |

### P2 — Permission & Naming Inconsistencies

| # | Issue | Detail |
|---|-------|--------|
| I1 | **Mutation endpoints gated with read permissions** | `AdminLeadsController` uses `admin.leads.read` for `reassign`, `contact-log`, `convert-to-client`. `AdminCampaignsController` uses `admin.campaigns.read` for `PATCH`, `pause`, `end`. Should use `admin.*.intervene`. |
| I2 | **Finance audit naming mismatch** | Finance uses `ADMIN_FORCE_INVOICE_STATUS`, `ADMIN_TRIGGER_REFUND` (shout_case) — all other services use `admin.invoices.force-status` (dot-notation). |
| I3 | **AdminBackupsController path mismatch** | Route is `admin/exports` instead of `admin/backups`. |
| I4 | **AdminDisputesController outside admin module** | Lives in `modules/disputes/controllers/` instead of `modules/admin/controllers/`. Architectural inconsistency. |
| I5 | **AdminDeliverablesController uses root `admin/` prefix** | Routes `admin/deliverables` and `admin/revision-requests` on a controller without a sub-path prefix. |
| I6 | **AdminSessionsController uses wrong permission** | Session revoke uses `admin.users.manage` instead of an `admin.sessions.revoke` permission. |
| I7 | **`admin.reports.permission` vs specific report permissions** | All 7 report endpoints use a single `admin.reports` key — no granularity per report type. |

### P3 — Minor / Cosmetic

| # | Issue |
|---|-------|
| M1 | Regular module controllers duplicate admin list/get-one endpoints (heaviest in Leads and Projects) |
| M2 | No `RolesGuard` exists — `@Roles` decorator is defined but unused |
| M3 | Several permission keys appear to be unused (e.g., `admin.portal` used only for intake-forms list) |
| M4 | `disputes.admin` is the only non-`admin.*` permission that gates admin-level actions — naming convention mismatch |

---

## 4. Keep / Replace / Extend Decisions

### Keep As-Is

| Controller | Rationale |
|-----------|-----------|
| **AdminReportsController** | Clean 7-endpoint reporting surface, read-only, properly isolated. Add snapshot persistence in Phase 3. |
| **AdminDashboardController** | Lightweight monitoring hub. Keep structure, extend with more KPIs. |
| **AdminAuditController** | Existing audit-log viewer. Will become more valuable once Phase 1 adds AdminActionLog. |
| **AdminNotificationTemplatesController** | Clean CRUD for template management. |
| **AdminAutomationController** | Full CRUD for automation rules + logs viewer. Complete. |
| **AdminFeatureFlagsController** | Simple key-based toggle management. Complete. |
| **AdminEnvironmentController** | Read-only environment viewer. Complete. |
| **AdminSecurityController** | Read-only security events + stats. Complete. |
| **AdminSessionsController** | Session list + revoke. Complete. |
| **AdminChatController** | Conversation monitoring + moderate (hide). Complete. |
| **AdminDisputesController** | Full dispute lifecycle. Consider moving into admin module for consistency. |
| **AdminPortalController** | Portal client management + token/access control. Complete. |
| **AdminIntakeFormsController** | Read-only intake form list. Complete. |
| **AdminDeliverablesController** | Read-only deliverables + revision list. Complete. |
| **AdminTeamController** | Team workload view. Complete. |
| **AdminMarketingController** | Strategy list + status update. Complete. |

### Extend

| Controller | What to add |
|-----------|------------|
| **AdminUsersController** | Add suspend/reactivate endpoints, user summary endpoint. Move `impersonate` to a separate security concern. Add `revoke-sessions` under proper session permission. |
| **AdminClientsController** | Add suspend/reactivate endpoints, lifecycle status management, reassign account manager. Currently read-only — needs intervention endpoints. |
| **AdminProjectsController** | Currently has good intervention coverage. Add stalled/overdue flagging endpoint. Add `reason` to archive. Standardize on `admin.projects.intervene` consistently. |
| **AdminLeadsController** | Fix permission bug (intervention endpoints use read permission). Add `force-stage` with reason. Add stale/unassigned flagging. |
| **AdminRequestsController** | Add `reason` to reassign. Add stale/unassigned detection. |
| **AdminContractsController** | Fix `cancel` to write to `contractStatusHistory`. Add `reason` constraint to all status changes. |
| **AdminTasksController** | Add `reason` to reassign + force-transition. Fix hardcoded `"admin"` userId. |
| **AdminFinanceController** | Wrap all interventions in `$transaction`. Add invoice status history model. Normalize audit naming to `admin.*.*` dot-notation. |
| **AdminController** (main) | Add system health KPIs, alerts aggregation, trends. |

### Replace / Consolidate

| Controller | Decision |
|-----------|---------|
| **AdminBackupsController** | Rename path from `admin/exports` to `admin/backups`. The `exports/:type` behavior suggests it serves export routes too — split into `admin/exports` (report export) and `admin/backups` (system backup). |
| **AdminCampaignsController** | Fix permission on mutation endpoints. Move campaign interruption (pause/end) under `admin.campaigns.intervene`. |
| **AdminIntegrationsController** | Currently mixes monitoring (webhook-logs) with configuration (ad-platforms, gateways). Split into separate concerns. |
| **AdminSettingsController** | Generic key-value settings. Evaluate whether `CompanySetting` model should replace or complement this. |

---

## 5. Duplication Map

| Domain | Overlap | Overlapping Endpoints | Admin-Only Value | Recommendation |
|--------|---------|----------------------|-----------------|----------------|
| **Leads** | HIGH | list, get-one, assign/reassign, contact-log, convert | stats, stale detection | Accept duplication for Phase 2 — admin needs a cleaner read model with cross-domain joins. Don't deduplicate until Phase 7. |
| **Projects** | HIGH | list, get-one, create, archive, add-member, status-change | reassign-pm, add-task, force-status (bypasses workflow) | Admin `force-status` is intentionally different from regular `updateStatus` (bypasses workflow validation). Keep both. |
| **Tasks** | MODERATE | list, get-one, assign/reassign, status-change | force-transition (bypasses workflow) | Same as projects — admin force is a distinct concept. |
| **Contracts** | MODERATE | list, get-one, cancel, status-change | renewal-alert, convert-to-project | Admin cancel is same as regular cancel — consider unifying. |
| **Requests** | MODERATE | list, get-one, status-change | reassign, notes (admin-only) | Admin force-status bypasses workflow validation. Keep distinct. |
| **Clients** | LOW | list, get-one | stats, full, history | Admin is read-only view layer. Regular handles mutations. Healthy separation. |
| **Finance** | LOW | overview/summary | force-status, write-off, refund, webhooks, gateways | Admin is pure intervention/oversight. Regular is full business module. Best separation in the system. |

**Rule for Phase 7 cleanup:** If an admin endpoint does exactly what the regular endpoint does (same logic, same validation), deduplicate by delegating admin → regular service. If the admin version bypasses workflow logic (force-status, force-transition), keep it separate.

---

## 6. Existing History/Log Models (Foundation for Phase 1)

These already exist and can be reused/extended:

| Model | Table | Covers |
|-------|-------|--------|
| `LeadPipelineHistory` | `lead_pipeline_history` | Lead stage transitions |
| `LeadContactLog` | `lead_contact_log` | Contact attempts |
| `LeadAutomationLog` | `lead_automation_logs` | Automation rule executions |
| `RequestStatusHistory` | `request_status_history` | Request status transitions |
| `ContractStatusHistory` | `contract_status_history` | Contract status transitions |
| `ContractVersion` | `contract_versions` | Versioned files |
| `TaskStatusHistory` | `task_status_history` | Task status transitions |
| `TaskDelayAlert` | `task_delay_alerts` | Overdue task notifications |
| `ProjectPeriodHistory` | `project_period_history` | Period status transitions |
| `CampaignStatusHistory` | `campaign_status_history` | Campaign status transitions |
| `CampaignKpiAuditLog` | `campaign_kpi_audit_logs` | KPI value changes |
| `SecurityEvent` | `security_events` | Auth/security events |
| `Session` | `sessions` | User sessions |
| `PaymentEvent` | `payment_events` | Payment lifecycle |
| `WebhookLog` | `webhook_logs` | Incoming webhooks |
| `Ledger` | `ledger` | Generic audit ledger (action/entity/before/after) |
| `DisputeHistory` | `dispute_history` | Dispute status transitions |
| `ClientHistoryLog` | `client_history_log` | Client events |
| `SystemHealthCheck` | `system_health_checks` | Health snapshots |
| `SystemError` | `system_errors` | Error logs |
| `NotificationEvent` | `notification_events` | Notification triggers |

### What's missing for Phase 1

The Ledger table is the closest to a unified admin action log but is generic (not admin-focused). Phase 1 should either:
- **Option A**: Create a dedicated `AdminActionLog` model with the minimum tracked fields (actorId, targetType, targetId, actionType, reason, beforeState, afterState)
- **Option B**: Extend the Ledger model to require `reason` and standardize admin action naming

---

## 7. Recommendations for Phase 1

Based on this audit, Phase 1 should prioritize in this order:

1. **Create `AdminActionLog` model** — centralized admin audit table
2. **Add User suspension fields** — `suspendedAt`, `suspendedUntil`, `suspendReason`, `suspendedBy` on User model
3. **Add Client suspension fields** — same fields on Client model (or a new `Suspension` model polymorphic for both)
4. **Create `SystemEventLog` model** — unified log for webhook/gateway/notification/integration failures
5. **Create report snapshot table** — for KPI period persistence
6. **Seed all `admin.*` permissions** — so they exist in the database and can be assigned to roles
7. **Fix audit trail gaps** — add domain history writes for projects force-status, contracts cancel, tasks/leads/requests reassign
8. **Fix hardcoded `"admin"` userId** — replace with real actor ID
9. **Wrap finance interventions in `$transaction`**
10. **Standardize permission naming** — fix `admin.leads.read`/`admin.campaigns.read` on mutation endpoints; normalize finance audit naming
