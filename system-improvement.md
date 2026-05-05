# System Improvement Review

## 1. Objective

This document reviews the current Hassad Platform across database, backend, API, and frontend layers against the required business workflow:

1. A client can create multiple requests.
2. Each request must remain independently trackable before contract signing.
3. Sales manages the pre-contract workflow through CRM and pipeline stages.
4. After contract signing, the request becomes a real execution project.
5. A PM manages the project, creates tasks, assigns teams, and controls delivery.
6. Every involved user must be explicitly linked to the project.
7. The client can track progress, deliverables, invoices, contracts, and campaign analytics without seeing internal employee or task-management details.

This review focuses on preventing the recurring instability caused by overlapping responsibilities, weak ownership boundaries, and inconsistent cross-module behavior.

## 2. Reviewed Surfaces

The review is based on actual code and schema, not only planning documents.

- `apps/api/prisma/schema.prisma`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/main.ts`
- `apps/api/src/modules/crm/services/leads.service.ts`
- `apps/api/src/modules/crm/services/clients.service.ts`
- `apps/api/src/modules/proposals/services/proposals.service.ts`
- `apps/api/src/modules/contracts/services/contracts.service.ts`
- `apps/api/src/modules/projects/services/projects.service.ts`
- `apps/api/src/modules/portal/controllers/portal.controller.ts`
- `apps/api/src/modules/portal/services/portal.service.ts`
- `packages/shared/src/enums/client.ts`
- `packages/shared/src/enums/project.ts`
- `apps/web/app/(portal)/portal/new-order/page.tsx`
- `apps/web/app/(portal)/portal/page.tsx`
- `apps/web/app/(portal)/portal/deliverables/page.tsx`
- `apps/web/features/leads/leadsApi.ts`
- `apps/web/features/portal/portalApi.ts`
- `apps/web/features/deliverables/deliverablesApi.ts`
- `apps/web/proxy.ts`

## 3. Executive Summary

The current system already supports a meaningful part of the post-contract lifecycle. Client contracts, projects, tasks, deliverables, invoices, notifications, and campaigns are present and partially integrated. The main weakness is not the absence of all functionality, but the absence of a stable, canonical domain model at the beginning of the lifecycle.

The core issue is that the platform does not have a first-class Request entity. Client-originated work is currently forced into `Lead`, `Client`, `Contract`, and `Project` semantics too early. This produces overlapping ownership rules and competing write paths. As a result, the system can appear to work in one area while silently breaking another.

The recommended direction is:

1. Introduce a dedicated `Request` entity as the canonical record for client-originated work.
2. Keep `Lead` as the internal sales/CRM object, not the client-facing origin record.
3. Do not create a real execution `Project` before contract signing.
4. Show pre-signing work in the portal as a request/opportunity item with the client-visible label `طلب قيد الانتظار`.
5. Create the true execution `Project` only after contract signing.
6. Consolidate client creation, project handover, and workflow orchestration into one canonical backend path.

## 4. Current-State Review

### 4.1 Database Review

#### What is already strong

- `Client`, `Contract`, `Project`, `Task`, `Deliverable`, `Invoice`, `Campaign`, `NotificationEvent`, and `Notification` are already modeled and related.
- `ProjectMember` exists and can explicitly link users to projects.
- `LeadPipelineHistory` and `TaskStatusHistory` support auditability.
- `Campaign` can link to `Client`, `Task`, and `Project`.
- Portal-facing entities already exist: `Deliverable`, `ClientRevisionRequest`, `PortalIntakeForm`, and `ClientSnoozedItem`.

#### Verified gaps and inconsistencies

| Area                  | Current state                                              | Gap                                         | Impact                                                       |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Request origin        | Client intake writes to `Lead`                             | No first-class `Request` model              | The beginning of the lifecycle is overloaded and unstable    |
| Client identity       | `Client` can be linked by `userId` or `leadId`             | No canonical merge strategy                 | The same real customer can split into multiple `Client` rows |
| Pre-signing lifecycle | `ProjectStatus` starts at `PLANNING`                       | No dedicated pre-contract lifecycle object  | The business meaning of pre-signing work is unclear          |
| Team model            | `ProjectMember` exists                                     | No reusable team abstraction                | Team assignment is project-scoped only                       |
| Deliverable linkage   | `Deliverable.taskId` is optional                           | Deliverables can drift from execution tasks | Traceability is weaker than it should be                     |
| Campaign lineage      | `Campaign` can link to `Task` and `Project`                | Creation rules are not canonical            | Marketing analytics can be partially connected               |
| Ownership graph       | Multiple modules can create `Client` and `Project` records | No single lifecycle authority               | Fixes in one module can break another                        |

### 4.2 Backend Logic Review

#### What is already strong

- Lead stages are controlled in `LeadsService.changeStage()`.
- Proposal approval advances lead state.
- Contract signing triggers downstream workflow.
- Project creation correctly requires a signed or active contract in `ProjectsService.create()`.
- Portal ownership checks are present in `PortalController`.

#### Verified gaps and inconsistencies

| Area                          | Current state                                                                                       | Gap                                                  | Impact                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| Intake                        | Portal creates a `Lead` directly                                                                    | No request-first orchestration                       | Client intent is mixed with internal sales records             |
| Client creation               | `AuthService`, `LeadsService`, and `ContractsService` can each create client records                | No canonical client creation service                 | Duplicate and divergent client rows become likely              |
| Project creation              | `ContractsService`, `ClientsService.handover()`, and `ProjectsService.create()` can all participate | No single project handover authority                 | Competing project lifecycle rules                              |
| Contract signing side effects | Project creation and lead conversion can run after signing with swallowed errors                    | Critical steps are not guaranteed                    | A contract can be signed while project creation fails silently |
| Project activation            | Contract activation does not guarantee synchronized project activation                              | Status drift between contract and project            | Confusing and unstable user experience                         |
| Communication handoff         | No canonical pre-sales to PM handoff                                                                | Ownership shift is implicit, not enforced            | Client communication rules remain ambiguous                    |
| Invoice rule                  | Invoices exist, but creation is not the canonical result of a specific milestone                    | Finance behavior is partly manual and partly assumed | The workflow is not predictable                                |

### 4.3 API Review

#### What is already strong

- The actual API prefix is consistently `/v1` in `apps/api/src/main.ts`.
- Response envelopes are consistent.
- Portal endpoints already support dashboards, projects, campaigns, action items, activity feeds, invoices, and contracts.
- Core modules expose leads, proposals, contracts, projects, tasks, finance, and notifications.

#### Verified gaps and inconsistencies

| Area               | Current state                                                               | Gap                                               | Impact                                      |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| Request APIs       | No request-focused API surface                                              | The frontend cannot model client requests cleanly | Portal and CRM must overload lead endpoints |
| Naming alignment   | Some route naming differs from earlier specs                                | Docs and implementation drift                     | Confusion during integration                |
| Ownership contract | Portal relies on `clientId` resolution from auth/profile                    | Works only if client identity is canonical        | Duplicate clients break visibility          |
| Visibility model   | Some scoping is enforced server-side, some assumed client-side              | Inconsistent trust boundary                       | Data leakage risk and UI mismatch           |
| Workflow contract  | No API that explicitly models request -> opportunity -> contract -> project | Workflow semantics remain spread across modules   | Cross-module breakage stays likely          |

### 4.4 Frontend Review

#### What is already strong

- The portal has real screens for requests intake, projects, contracts, invoices, deliverables, actions, and campaign analytics.
- The sales area already has lead pipeline views.
- The PM area already has project and task views.
- Role-based route separation exists in `proxy.ts`.

#### Verified gaps and inconsistencies

| Area                  | Current state                                                                 | Gap                                                                 | Impact                                         |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| New request flow      | `PortalNewOrderPage` uses `useCreateLeadMutation()`                           | The UI creates a lead, not a request                                | Wrong business object at the start of the flow |
| Pre-contract tracking | No dedicated request tracking page                                            | Clients cannot clearly see pending requests before project creation | Important business requirement is missing      |
| Unified timeline      | Portal shows separate summaries                                               | No single request-to-project timeline                               | Hard to explain progress to clients            |
| Deliverables security | `PortalDeliverablesPage` re-filters by `isVisibleToClient` on the client side | The API contract is too trusting                                    | Visibility should be enforced server-side      |
| Identity dependency   | Portal expects one stable `clientId` from profile                             | Breaks when backend creates a second client record                  | Portal data becomes inconsistent               |
| Workflow semantics    | Frontend mixes request, lead, and project concepts                            | Same business object appears differently in different screens       | Ongoing integration fragility                  |

### 4.5 System Integrity Review

The recurring cycle of fixes is being caused by architectural overlap, not only by missing endpoints.

The verified root causes are:

1. No first-class Request domain.
2. Multiple independent paths create or mutate `Client` records.
3. Multiple independent paths create or hand over `Project` records.
4. Critical side effects after contract signing are not reliable.
5. Shared enums, docs, and frontend assumptions do not fully match actual lifecycle rules.

## 5. Recommended Target Architecture

### 5.1 Core Principles

1. One real customer must map to one canonical `Client` identity.
2. One client can own many `Request` records.
3. A `Request` represents pre-contract business demand.
4. A `Lead` represents internal sales handling, not the portal-facing source record.
5. A real execution `Project` is created only after a contract is signed.
6. Every involved internal user must be explicitly linked to the project.
7. Clients must never depend on frontend filtering to hide internal-only data.
8. Critical downstream workflow steps must be reliable and auditable.

### 5.2 Canonical Domain Model

Recommended target relationship model:

```text
User (CLIENT) 1 --- 1 Client
Client 1 --- N Request
Request 0 --- 1 Lead
Request 1 --- N Proposal
Request 0 --- N ContractVersion or Contract revisions
Request 0 --- 1 Active Contract
Signed Contract 1 --- 1 Execution Project
Project 1 --- N ProjectMember
Project 1 --- N Task
Project 1 --- N Deliverable
Project 1 --- N Campaign
Invoice N --- 1 Client
Invoice N --- 1 Contract
NotificationEvent 1 --- N Notification
```

### 5.3 Ownership Rules

1. `Client` is the canonical customer identity.
2. `Request` is the canonical client-originated work item.
3. `Lead` is optional and internal; it mirrors sales qualification, not customer identity.
4. `Contract` must reference the canonical `Client` and the originating `Request`.
5. `Project` must reference the canonical `Client`, the signed `Contract`, and the originating `Request`.
6. `ProjectMember` must include all PMs, team members, and any internal user assigned meaningful work.
7. A task assignee must also be a valid project member.

### 5.4 Status Strategy

The platform should not overload `ProjectStatus` to represent pre-contract work.

Recommended approach:

- `RequestStatus` handles pre-contract lifecycle.
- `Lead.pipelineStage` remains the detailed internal sales pipeline.
- `ContractStatus` controls the legal/commercial lifecycle.
- `ProjectStatus` remains execution-only.

Client-facing rule:

- Until contract signing, the portal can display the request in a project-like list with the status label `طلب قيد الانتظار`.
- After contract signing, the request is converted into a real execution project and the client sees true project status values.

### 5.5 Reliability Strategy

Critical lifecycle transitions should follow this pattern:

1. Commit core business transaction.
2. Persist an auditable workflow event.
3. Process guaranteed side effects through an outbox/job pattern or another reliable orchestration layer.
4. Never swallow critical errors when project creation, client linkage, or ownership handoff is required for workflow correctness.

## 6. Improvement Program

### Unit 1 - Canonical Domain Audit and Decision Freeze

**Goal**
Create one stable source of truth before implementation starts.

**Tasks**

- Task 1.1: Build a lifecycle matrix for `Request`, `Lead`, `Client`, `Proposal`, `Contract`, `Invoice`, `Project`, `Task`, `Campaign`, `Notification`, and portal visibility.
- Task 1.2: List every current module that creates or mutates `Client`, `Project`, or workflow status.
- Task 1.3: Freeze the agreed architectural decisions: separate `Request`, portal-visible pending request, real `Project` only after contract signing.
- Task 1.4: Define invariants that all later units must preserve.

**Expected output**

- Approved lifecycle map
- Approved ownership rules
- Approved invariant checklist

### Unit 2 - Database and Domain Stabilization

**Goal**
Introduce the missing domain model and remove structural ambiguity.

**Tasks**

- Task 2.1: Add a dedicated `Request` model and related history/service tables.
- Task 2.2: Define `RequestStatus` and request history rules.
- Task 2.3: Add canonical foreign keys from request to downstream entities where required.
- Task 2.4: Preserve `Project` as execution-only.
- Task 2.5: Decide whether `ProjectMember` alone is enough or whether a reusable team abstraction is needed.
- Task 2.6: Define migration and backfill rules for duplicate clients and broken ownership links.

**Expected output**

- Stable domain model
- Migration strategy
- Backfill checklist

### Unit 3 - Backend Orchestration and State Management

**Goal**
Move business transitions into one canonical workflow path.

**Tasks**

- Task 3.1: Refactor portal intake to create `Request` first.
- Task 3.2: Consolidate client creation and update logic into one canonical service.
- Task 3.3: Replace fire-and-forget post-signing orchestration with deterministic workflow handling.
- Task 3.4: Synchronize request, lead, contract, and project statuses.
- Task 3.5: Encode the invoice generation rule explicitly.
- Task 3.6: Enforce the communication handoff from Sales to PM after signing.
- Task 3.7: Ensure every meaningful state change writes history and notifications consistently.

**Expected output**

- Reliable request-to-project conversion
- Stable ownership handoff
- Auditable state transitions

### Unit 4 - API Contract Realignment

**Goal**
Expose a clean API contract that matches the intended workflow.

**Tasks**

- Task 4.1: Add request-focused endpoints for portal and internal teams.
- Task 4.2: Keep CRM endpoints focused on internal sales activity while linking them to requests.
- Task 4.3: Normalize payloads and response shapes across modules.
- Task 4.4: Enforce ownership and visibility server-side.
- Task 4.5: Update specs only after actual routes and payloads are finalized.

**Expected output**

- Predictable API contracts
- Reduced integration drift
- Clear ownership boundaries

### Unit 5 - Frontend Workflow Alignment

**Goal**
Make the UI reflect the real domain and lifecycle without overloading terminology.

**Tasks**

- Task 5.1: Replace request creation via `leadsApi` with `requestsApi`.
- Task 5.2: Add a portal pending-requests tracking page and summary state.
- Task 5.3: Add one client-visible lifecycle timeline from request creation to delivery.
- Task 5.4: Rework sales views to operate on request-linked opportunities instead of using lead as the entire business object.
- Task 5.5: Ensure PM and team views always reflect explicit project membership and task ownership.
- Task 5.6: Remove client-side data visibility filtering where the backend should already scope the response.
- Task 5.7: Keep internal employee and operational details hidden from the client.

**Expected output**

- Stable portal semantics
- Clear pre-contract and post-contract separation
- Cleaner API consumption

### Unit 6 - Integrity Hardening and Data Migration

**Goal**
Protect the platform from future breakage and clean up existing inconsistencies.

**Tasks**

- Task 6.1: Audit duplicate clients, broken request-client links, contracts without projects, projects without PM membership, and tasks assigned outside project membership.
- Task 6.2: Build idempotent backfill scripts.
- Task 6.3: Validate the end-to-end business workflow with seeded users.
- Task 6.4: Re-check permission boundaries for portal, sales, PM, marketing, finance, and admin.
- Task 6.5: Run build and manual verification after each major unit.

**Expected output**

- Cleaner data
- Lower regression risk
- Stable end-to-end behavior

### Unit 7 - Documentation and Governance

**Goal**
Prevent future drift between implementation, docs, and business expectations.

**Tasks**

- Task 7.1: Publish the approved target architecture.
- Task 7.2: Publish the end-to-end workflow specification.
- Task 7.3: Keep code, docs, and shared enums aligned before merging lifecycle changes.
- Task 7.4: Add a release checklist for workflow-impacting changes.

**Expected output**

- Shared source of truth
- Lower future ambiguity
- Better implementation discipline

## 7. Acceptance Criteria

The workflow should be considered stable only when all of the following are true:

1. One portal user resolves to one canonical `Client` record.
2. One client can create multiple requests without record duplication.
3. Each request stays independently trackable before signing.
4. The client sees `طلب قيد الانتظار` until contract signing.
5. Sales can manage internal qualification without corrupting client identity.
6. Contract signing reliably creates the execution project and PM handoff.
7. Every internal contributor is explicitly linked to the project.
8. Tasks, deliverables, campaigns, notifications, and invoices remain traceable to the same request/client/project chain.
9. The client can track progress and marketing analytics without seeing internal-only operational details.
10. No critical workflow step depends on swallowed exceptions.

## 8. Immediate Next Recommendation

Before implementation begins, the team should approve the target domain boundaries in this document and then start with Unit 2, not with UI changes. The current instability is being caused by domain ambiguity at the persistence and orchestration layers. Fixing the frontend first would only move the inconsistency around.
