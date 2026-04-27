# HASAD PLATFORM — NESTJS API SPEC (V2 FULL)
## Source of Truth — STRICT EXECUTION (NO INTERPRETATION ALLOWED)

This document defines the **complete API layer** for the Hasad Platform using **NestJS**.

🚨 The agent MUST:
- Implement EXACTLY what is written
- NOT add, remove, rename, or infer anything
- NOT bypass workflow rules
- NOT directly update DB state outside defined endpoints

---

# 🔒 GLOBAL RULES (MANDATORY)

- Base URL: `/api/v1`
- Framework: NestJS
- Architecture: Modular
- Validation: `class-validator`
- Auth: JWT (existing system reused)
- Authorization: RBAC (roles + permissions)
- All endpoints must use:
  - DTOs
  - Guards (Auth + Permissions)
  - Service layer (no logic in controller)

## Standard Response Format

```json
{
  "success": true,
  "data": {},
  "error": null
}
🔐 AUTHORIZATION SYSTEM
Guards (MUST BE IMPLEMENTED)
JwtAuthGuard
PermissionsGuard
Decorator
@RequirePermissions('resource.action')
Rule

Every endpoint MUST declare permission explicitly.

🧱 PROJECT STRUCTURE (STRICT)
src/
 ├── modules/
 │    ├── core/
 │    ├── crm/
 │    ├── proposals/
 │    ├── contracts/
 │    ├── projects/
 │    ├── tasks/
 │    ├── portal/
 │    ├── marketing/
 │    ├── finance/
 │    ├── chat/
 │    ├── notifications/
 │    ├── ai/
 │
 ├── common/
 │    ├── guards/
 │    ├── decorators/
 │    ├── interceptors/
 │    ├── filters/
🟣 CORE MODULE
UsersController
GET /users → users.read
POST /users → users.create
GET /users/:id → users.read
PATCH /users/:id → users.update
DELETE /users/:id → users.delete
RolesController
GET /roles
POST /roles
PATCH /roles/:id
POST /roles/:id/permissions
PermissionsController
GET /permissions
DepartmentsController
GET /departments
POST /departments
POST /users/:id/departments
🔵 CRM MODULE
LeadsController
POST /leads → leads.create
GET /leads → leads.read
GET /leads/:id → leads.read
PATCH /leads/:id → leads.update
Assignment
POST /leads/:id/assign → leads.assign
Contact Log
POST /leads/:id/contact-log
GET /leads/:id/contact-log
Pipeline (STRICT RULE)

❌ Forbidden:

Direct update of pipeline_stage

✅ Only allowed:

POST /leads/:id/stage
Must:
Insert into lead_pipeline_history
Validate transition
Emit notification_event
Automation
POST /automation/rules
GET /automation/rules
POST /automation/execute (INTERNAL ONLY)
Conversion
POST /leads/:id/convert
Must:
Create client
Emit event
ClientsController
GET /clients
GET /clients/:id
PATCH /clients/:id
Client Activity
GET /clients/:id/activity
🟠 PROPOSALS MODULE
POST /proposals
GET /proposals/:id
POST /proposals/:id/send
POST /proposals/:id/approve
POST /proposals/:id/reject
🟠 CONTRACTS MODULE
POST /contracts
GET /contracts/:id
POST /contracts/:id/sign
POST /contracts/:id/activate
POST /contracts/:id/cancel
Versions
POST /contracts/:id/versions
🟢 PROJECTS MODULE
POST /projects
GET /projects/:id
PATCH /projects/:id
POST /projects/:id/archive
Members
POST /projects/:id/members
DELETE /projects/:id/members/:user_id
🟢 TASKS MODULE
POST /tasks
GET /tasks/:id
PATCH /tasks/:id
TASK FLOW (STRICT — NO DEVIATION)
POST /tasks/:id/assign
POST /tasks/:id/start
POST /tasks/:id/submit
POST /tasks/:id/approve
POST /tasks/:id/reject
Each action MUST:
Insert into task_status_history
Validate state transition
Emit notification
Files
POST /tasks/:id/files
GET /tasks/:id/files
Comments
POST /tasks/:id/comments
🟦 PORTAL MODULE
Deliverables
POST /deliverables
GET /deliverables/:id
POST /deliverables/:id/approve
POST /deliverables/:id/reject
Revisions
POST /deliverables/:id/revisions
GET /deliverables/:id/revisions
Intake Forms
POST /clients/:id/intake-form
GET /clients/:id/intake-form
🔴 MARKETING MODULE
Campaigns
POST /campaigns
GET /campaigns/:id
POST /campaigns/:id/start
POST /campaigns/:id/pause
POST /campaigns/:id/end
KPIs
POST /campaigns/:id/kpis
GET /campaigns/:id/kpis
A/B Tests
POST /campaigns/:id/ab-tests
POST /ab-tests/:id/stop
🟡 FINANCE MODULE
Invoices
POST /invoices
GET /invoices/:id
POST /invoices/:id/send
POST /invoices/:id/mark-paid
Payment Tickets
POST /payment-tickets
GET /payment-tickets/:id
POST /payment-tickets/:id/resolve
⚫ CHAT MODULE
Conversations
POST /conversations
GET /conversations/:id
POST /conversations/:id/participants
Messages
POST /messages
GET /conversations/:id/messages
⚪ NOTIFICATIONS MODULE
GET /notifications
POST /notifications/mark-read
POST /notifications/mark-all-read
🔵 AI MODULE
POST /ai/analyze
GET /ai/logs/:id
Suggestions
GET /ai/suggestions
POST /ai/suggestions/:id/accept
POST /ai/suggestions/:id/reject
🔁 CRITICAL SYSTEM RULES
RULE 1 — STATE CONTROL

❌ Direct DB updates are FORBIDDEN
✅ Only via defined endpoints

RULE 2 — HISTORY

Every state change MUST:

Write to history table
RULE 3 — NOTIFICATIONS

Every important action MUST:

Create notification_event
RULE 4 — WORKFLOW ENFORCEMENT

MUST enforce:

Cannot create project without active contract
Cannot approve task before submission
Cannot mark invoice paid without invoice
Cannot convert lead twice
RULE 5 — NO HARD DELETE
Use archive flags only
🧱 EXECUTION PLAN (STRICT ORDER)
Core + Permissions
CRM
Proposals + Contracts
Projects + Tasks
Portal
Marketing
Finance
Notifications + Chat
AI
✅ FINAL INSTRUCTION

This specification is FINAL.

The agent MUST:

Follow it exactly
Not interpret
Not optimize
Not skip

ANY deviation = INVALID IMPLEMENTATION