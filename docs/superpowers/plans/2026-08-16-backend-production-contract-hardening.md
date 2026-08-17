# Backend Production Contract Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. The authoritative requirements are `docs/BACKEND_PRODUCTION_CONTRACT_HARDENING_PLAN.md`; this file only defines execution ownership and checkpoints.

**Goal:** Make the NestJS API, shared business contracts, notifications, and API response/error behavior safe and deterministic for production and frontend V2 integration.

**Architecture:** The orchestrator owns cross-cutting infrastructure, the error catalog, response-envelope audits, integration verification, and final reporting. Each implementation subagent owns exactly one backend module or one explicitly named support boundary and may not edit another owner’s files. Work starts with the seed and error-helper gates, then proceeds in dependency-ordered waves.

**Tech Stack:** NestJS 11, TypeScript 5, Prisma 6, PostgreSQL, Vitest, npm workspaces, `@hassad/shared`.

---

## Operating Rules

- Treat `docs/BACKEND_PRODUCTION_CONTRACT_HARDENING_PLAN.md` as the only product and contract authority.
- Preserve business behavior, state machines, history writes, notification metadata, and transaction semantics unless the authoritative plan explicitly requires a contract correction.
- Use `ApiException` or `domain-errors.ts` for business failures.
- Add stable codes to `docs/API_ERROR_CATALOG.md` through the orchestrator only; agents submit catalog entries in their handoff.
- Keep backend-generated fallback messages in English and preserve user-generated content exactly.
- Do not add locale-dependent formatting or raw notification call sites.
- Do not use `prisma db push`.
- Run no watch-mode servers and do not run full e2e concurrently.
- Every agent runs API typecheck and `git diff --check`; targeted e2e runs only after the seed gate passes.

## Ownership Map

The following are persistent owners. A subagent may work only within its assigned boundary and its dedicated tests.

| Owner | Boundary | Plan coverage |
| --- | --- | --- |
| Auth | `apps/api/src/auth` | Phase 2 |
| Requests | `apps/api/src/modules/requests` | Phase 3 |
| CRM | `apps/api/src/modules/crm` | Phases 3, 5, 12 overlaps reported through handoff |
| Core | `apps/api/src/modules/core` | Phase 4 |
| Admin | `apps/api/src/modules/admin` | Phases 4-14 |
| Contracts | `apps/api/src/modules/contracts` | Phase 5 |
| Finance | `apps/api/src/modules/finance` | Phase 6 |
| Payments | `apps/api/src/modules/payments` | Phase 6 |
| Settings | `apps/api/src/modules/settings` | Phase 6 |
| Projects | `apps/api/src/modules/projects` | Phase 7 |
| Tasks | `apps/api/src/modules/tasks` | Phase 8 |
| PM | `apps/api/src/modules/pm` | Phases 7-8 |
| Team | `apps/api/src/modules/team` | Phase 8 |
| Marketing | `apps/api/src/modules/marketing` | Phase 9 |
| Disputes | `apps/api/src/modules/disputes` | Phase 10 |
| Portal | `apps/api/src/modules/portal` | Phase 11 |
| Chat | `apps/api/src/modules/chat` | Phase 12 |
| AI | `apps/api/src/modules/ai` | Phase 13 |
| AI Assistant | `apps/api/src/modules/ai-assistant` | Phase 13 |
| Proposals | `apps/api/src/modules/proposals` | Phase 14/16 gap coverage |
| Services | `apps/api/src/modules/services` | Phase 14 |
| Notifications | `apps/api/src/modules/notifications` | Phase 14/16 |
| Health | `apps/api/src/modules/health` | Phase 14/16 gap coverage |
| Storage | `apps/api/src/common/storage` | Phase 6/16 gap coverage |
| Shared | `packages/shared/src` | Phase 15 |

The orchestrator owns `apps/api/prisma/seed.ts`, `apps/api/src/common/errors/*`, `apps/api/src/test/api-error.spec.ts`, `docs/API_ERROR_CATALOG.md`, response-envelope audits, and final verification/reporting.

## Task 1: Establish the Repeatable Seed Baseline

**Files:**

- Modify: `apps/api/prisma/seed.ts:305-315`
- Test: `apps/api/src/test/global-setup.ts` only if the existing reset/seed lifecycle requires a deterministic adjustment

- [ ] Inspect the `PaymentGateway` unique constraints and existing seed behavior.
- [ ] Change the bank-transfer gateway upsert to use the unique `name` key, preserve the canonical existing row ID when present, and update only the intended type, active state, and bank-account configuration.
- [ ] Run the seed twice against the configured development database and verify the second run exits successfully without duplicate-name errors.
- [ ] Run `npm run test:e2e --workspace=api -- notification-messages` and record whether the runner starts.
- [ ] Record baseline scans for direct Nest exceptions, raw production `throw new Error`, raw notification calls, Arabic literals outside approved catalogs, and locale-dependent formatting.
- [ ] Run `git diff --check`.

## Task 2: Create the Error Helper Foundation

**Files:**

- Create: `apps/api/src/common/errors/domain-errors.ts`
- Modify: `apps/api/src/common/errors/api-error.ts`
- Modify: `apps/api/src/common/filters/http-exception.filter.ts` only where required to preserve the documented envelope
- Modify: `apps/api/src/test/api-error.spec.ts`

- [ ] Add typed helpers with the signatures `badRequest(code, message, details?)`, `notFound(code, message, details?)`, `forbidden(code, message, details?)`, `conflict(code, message, details?)`, and `internal(code, message, details?)`.
- [ ] Ensure every helper returns `ApiException` with the matching HTTP status and safe structured details.
- [ ] Add tests for helper status/code/details, validation conversion to `VALIDATION_FAILED`, unknown-error conversion to `INTERNAL_ERROR`, and legacy Nest-exception fallback behavior.
- [ ] Verify the filter emits exactly `{ success, data, error }` for normal API error responses and does not expose raw unknown-error messages.
- [ ] Run `npm run typecheck --workspace=api`, the targeted API error tests, and `git diff --check`.

## Task 3: Execute Module Hardening Waves

Each wave dispatches one subagent per listed owner. Agents follow the source plan’s required code mappings, add focused tests, and report unresolved cross-module behavior rather than editing outside their boundary.

### Wave 1: Auth, Intake, Users, and Revenue Contracts

- [ ] Dispatch Auth owner for Phase 2, including guards, strategies, refresh-token failures, and auth error-code tests.
- [ ] Dispatch Requests owner for Phase 3, including request lifecycle errors, canonical-client resolution, and history/transaction tests.
- [ ] Dispatch CRM owner for its Phase 3 intake consumers and CRM-owned errors, response shapes, and transaction behavior.
- [ ] Dispatch Core owner for users, roles, permissions, departments, transactions, and RBAC contract tests.
- [ ] Dispatch Admin owner for Phase 4 admin-user files only, preserving later admin ownership for subsequent waves.
- [ ] Dispatch Contracts owner for contracts and payment plans, structured validation details, and lifecycle regression tests.
- [ ] Dispatch Finance owner for invoices, payroll, tickets, and ledger lookup errors.
- [ ] Dispatch Payments owner for gateway guards, provider/webhook error sanitization, safe projections, and webhook tests.
- [ ] Dispatch Settings owner for currency errors, SVG validation, and no-hard-delete behavior review.
- [ ] Review every handoff before starting Wave 2; integrate catalog additions centrally.

### Wave 2: Delivery, Team, Marketing, Client Portal, and Chat

- [ ] Dispatch Projects owner for project/period lifecycle errors, history invariants, file handling, and response shapes.
- [ ] Dispatch Tasks owner for task errors, status-machine contract tests, required-file handling, and archive/delete behavior review.
- [ ] Dispatch PM owner for PM wrappers and actions without duplicating canonical task/period state machines.
- [ ] Dispatch Team owner for team task/chat contracts and sensitive-response projections.
- [ ] Dispatch Marketing owner for campaign/strategy/workspace errors, PDF validation, transitions, and notifications.
- [ ] Dispatch Disputes owner for lifecycle codes, scheduler safety, history, and notification regressions.
- [ ] Dispatch Portal owner for customer-facing codes, explicit action results, access boundaries, and snooze scheduler behavior.
- [ ] Dispatch Chat owner for shared chat errors and normalized safe conversation/message projections.
- [ ] Align duplicated Admin, CRM, Marketing, PM, and Team chat controllers through their respective owners without shared-file edits.
- [ ] Review every handoff before starting Wave 3; integrate catalog additions centrally.

### Wave 3: AI and Remaining Admin Support

- [ ] Resume Admin owner for Phases 5-14 admin contracts, projects, tasks, finance, marketing, chat, portal, and remaining support services.
- [ ] Dispatch AI owner for provider/model errors, adapter redaction, fail-closed encryption, safe user projections, and response contracts.
- [ ] Dispatch AI Assistant owner for conversation/tool codes, tool-area authorization, safe SSE errors, and stream tests.
- [ ] Review provider-secret, raw-upstream-error, and sensitive-record scans before starting Wave 4.

### Wave 4: Omitted Final-Criteria Boundaries

- [ ] Dispatch Proposals owner for the six service/controller exceptions and proposal action contracts.
- [ ] Dispatch Services owner for service-catalog and deliverable-template lookup codes.
- [ ] Dispatch Notifications owner for notification-template errors and pagination response shape.
- [ ] Dispatch Health owner for safe health payloads, resolve action response, DTO alignment, and persistence-error handling.
- [ ] Dispatch Storage owner for file validation failures using the existing file error contract.
- [ ] Review all handoffs and integrate the complete catalog once no owner has unresolved code mappings.

## Task 4: Clean the Shared Business Contract

**Files:**

- Modify: `packages/shared/src/enums/*.ts`
- Modify: `packages/shared/src/schemas/*.ts`
- Test: shared package tests or compile-time contract tests owned by the Shared agent

- [ ] Remove Arabic UI labels and user-facing copy from shared enums and schemas while preserving stable enum values and exported business codes.
- [ ] Replace Arabic schema messages with English fallback messages or structured issue keys without changing validation semantics.
- [ ] Run `npm run build --workspace=@hassad/shared` and `npm run typecheck --workspace=api`.
- [ ] Run the Arabic-literal scan and `git diff --check`.

## Task 5: Response Envelope and Contract Audit

**Files:**

- Modify: active API controllers/services identified by the scan
- Modify: `docs/API_ERROR_CATALOG.md`
- Test: `apps/api/src/test/api-error.spec.ts` and targeted module tests as needed

- [ ] Scan active API source for `return { success: true }`, `return { success: false }`, raw message/status payloads, nested `data`, manual response writes, and redirects.
- [ ] Replace accidental business nested envelopes with explicit action/resource payloads while documenting intentional auth, OAuth, download, health, and redirect exceptions.
- [ ] Verify all new domain codes are present in the catalog exactly once with English fallback semantics.
- [ ] Verify raw notification creation remains confined to `NotificationsService`.
- [ ] Verify no active API/shared `toLocale*`, `Intl.NumberFormat`, or `Intl.DateTimeFormat` usage exists.
- [ ] Run targeted envelope tests and `git diff --check`.

## Task 6: Final Production Verification and Readiness Report

- [ ] Run `npm run build --workspace=@hassad/shared`.
- [ ] Run `npm run typecheck --workspace=api`.
- [ ] Run `npm run test:e2e --workspace=api` sequentially.
- [ ] Re-run all production scans and compare before/after counts.
- [ ] Verify seed repeatability and migration status without using `prisma db push`.
- [ ] Run `git diff --check`.
- [ ] Produce the final report required by Phase 17: exception counts, raw-error counts, Arabic scan, locale scan, notification scan, envelope audit, catalog status, test results, and intentionally deferred items.

## Agent Handoff Template

Every module owner returns:

1. Files changed and files intentionally untouched.
2. Direct exception/raw-error counts before and after.
3. Stable code mappings and catalog entries requested.
4. Response-shape, localization, notification, security, and state-machine checks.
5. Targeted test command and exact result.
6. `npm run typecheck --workspace=api` result.
7. `git diff --check` result.
8. Cross-module follow-ups that must be handled by another owner or the orchestrator.
