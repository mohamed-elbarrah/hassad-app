# Plan: Sales Pipeline Feature Implementation

## TL;DR
Build the 9-stage Sales Pipeline: update pipeline stage names to match SALES_PIPELINE.md, add `requirements`/`activityLog` JSON fields to Client, enforce PROPOSAL_SENT guard, add public + admin registration endpoints, build Kanban board with dnd-kit, client detail page with timeline, and requirements form. Backend-first, then frontend.

## Decisions
- **PipelineStage vs ClientStatus**: The task says "update ClientStatus enum" but the codebase already separates `ClientStatus` (LEAD/ACTIVE/STOPPED = lifecycle) from `PipelineStage` (9 sales stages). We keep this separation — only rename the last 3 `PipelineStage` values to match SALES_PIPELINE.md.
- **Stage rename**: CONTRACT_SIGNED → WAITING_FOR_SIGNATURE, FIRST_PAYMENT → CONTRACTED_WON, TRANSFERRED_TO_OPERATIONS → HANDOVER
- **activityLog JSON**: Add as denormalized cache on Client alongside the existing ClientActivity table
- **Registration**: Public signup (CLIENT role + auto Client record) + Admin/Sales protected internal user creation
- **Auth service fix**: Current AuthService uses raw `new PrismaClient()` — must inject PrismaService properly

---

## Phase A: Shared Package + Schema (blocking — all other work depends on this)

### A1. Update `packages/shared/src/enums/client.ts`
- Rename `PipelineStage` values: `CONTRACT_SIGNED` → `WAITING_FOR_SIGNATURE`, `FIRST_PAYMENT` → `CONTRACTED_WON`, `TRANSFERRED_TO_OPERATIONS` → `HANDOVER`
- Update `PIPELINE_STAGE_ORDER` array accordingly

### A2. Update `packages/shared/src/schemas/client.schema.ts`
- No changes needed — schemas reference `PipelineStage` enum by `z.nativeEnum()`, so they auto-update

### A3. Update `packages/shared/src/index.ts`
- Add `requirements` and `activityLog` fields to `Client` interface (both `Json | null`)

### A4. Build shared package
- Run `npm run build` in `packages/shared`

### A5. Update `apps/api/prisma/schema.prisma`
- Rename PipelineStage enum values (last 3)
- Add `requirements Json?` field to Client model
- Add `activityLog Json?` field to Client model

### A6. Run migration
- `cd apps/api && npx prisma migrate dev --name update_sales_pipeline_stages`

**Relevant files:**
- `packages/shared/src/enums/client.ts` — rename 3 enum values + update PIPELINE_STAGE_ORDER
- `packages/shared/src/index.ts` — add requirements/activityLog to Client interface
- `apps/api/prisma/schema.prisma` — rename enum + add 2 fields

---

## Phase B: Backend API (depends on Phase A)

### B1. Fix AuthService to use injected PrismaService
- Replace `const prisma = new PrismaClient()` with constructor-injected `PrismaService`
- File: `apps/api/src/auth/auth.service.ts`

### B2. Add registration endpoints to AuthController/AuthService
- **Public**: `POST /auth/register` — accepts name, email, password, phone, businessType. Creates User (role=CLIENT) + Client (stage=NEW_LEAD, status=LEAD, source=PLATFORM). Uses `RegisterDto` already in shared.
- **Internal**: `POST /auth/register-internal` — protected by JwtAuthGuard + RolesGuard (ADMIN only). Creates internal users (PM, SALES, EMPLOYEE, etc.)
- Add `RegisterDto` class-validator DTO in `apps/api/src/auth/dto/register.dto.ts`
- Add `RegisterClientDto` with extra fields (phone, businessType) in `apps/api/src/auth/dto/register-client.dto.ts`

### B3. Add requirements update endpoint
- `PATCH /clients/:id/requirements` — accepts JSON body `{ requirements: object }` 
- Add `UpdateRequirementsDto` in `apps/api/src/clients/dto/update-requirements.dto.ts`
- Service method: updates `requirements` field + creates ClientActivity + appends to activityLog JSON

### B4. Enforce PROPOSAL_SENT guard in `updateStage()`
- In `ClientsService.updateStage()`: if target stage is PROPOSAL_SENT, check that `client.requirements` is not null/empty
- Throw `BadRequestException` with clear message if requirements missing

### B5. Update activityLog on stage transitions
- In `ClientsService.updateStage()`: append transition record to `activityLog` JSON array
- Format: `{ action, from, to, userId, timestamp }`

### B6. Auto-set status ACTIVE when stage reaches CONTRACTED_WON
- In `updateStage()`: when target stage is `CONTRACTED_WON`, also update `status` to `ACTIVE`

**Relevant files:**
- `apps/api/src/auth/auth.service.ts` — fix DI, add register methods
- `apps/api/src/auth/auth.controller.ts` — add register endpoints  
- `apps/api/src/auth/auth.module.ts` — ensure PrismaModule available
- `apps/api/src/clients/clients.service.ts` — PROPOSAL_SENT guard, activityLog updates, requirements update
- `apps/api/src/clients/clients.controller.ts` — add PATCH /:id/requirements endpoint
- New: `apps/api/src/clients/dto/update-requirements.dto.ts`
- New: `apps/api/src/auth/dto/register.dto.ts`
- New: `apps/api/src/auth/dto/register-client.dto.ts`

---

## Phase C: Frontend — RTK Query & State Updates (depends on Phase A, parallel with Phase B)

### C1. Install dnd-kit
- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` in apps/web

### C2. Update stage labels in all frontend components
- `ClientFiltersBar.tsx` — update STAGE_LABELS for renamed stages
- `StageSelect.tsx` — update STAGE_LABELS for renamed stages

### C3. Update RTK Query `clientsApi.ts`
- Add `updateClientRequirements` mutation (`PATCH /clients/:id/requirements`)
- No other changes needed — existing endpoints already handle stages

### C4. Add registration API to `authApi.ts`
- Add `register` mutation (`POST /auth/register`)

**Relevant files:**
- `apps/web/features/clients/clientsApi.ts` — add requirements mutation
- `apps/web/features/auth/authApi.ts` — add register mutation
- `apps/web/components/dashboard/crm/ClientFiltersBar.tsx` — update labels
- `apps/web/components/dashboard/crm/StageSelect.tsx` — update labels

---

## Phase D: Frontend — Kanban Board (depends on C1, C3)

### D1. Create Kanban board page
- Path: `apps/web/app/dashboard/sales/pipeline/page.tsx`
- Composition only: imports KanbanBoard component
- Uses `useGetClientsQuery` to fetch all clients (no stage filter — board shows all)

### D2. Create KanbanBoard component
- Path: `apps/web/components/dashboard/crm/KanbanBoard.tsx`
- Uses `@dnd-kit/core` `DndContext` with `DragOverlay`
- Groups clients by stage into 9 columns
- On drag end: calls `updateClientStage` mutation
- RTL: uses `dir="rtl"` + horizontal scroll with `overflow-x-auto`

### D3. Create KanbanColumn component
- Path: `apps/web/components/dashboard/crm/KanbanColumn.tsx`
- Uses `@dnd-kit/sortable` `useDroppable`
- Shows stage name (Arabic), client count, colored header
- Accepts dropped cards

### D4. Create KanbanCard component
- Path: `apps/web/components/dashboard/crm/KanbanCard.tsx`
- Uses `@dnd-kit/sortable` `useSortable` / `useDraggable`
- Shows: client name, businessType, createdAt, time-in-stage indicator
- Clicking card navigates to client detail page

### D5. Add pipeline link to sidebar navigation
- Update `apps/web/components/app-sidebar.tsx` — add "Pipeline" sub-link under Sales & CRM, pointing to `/dashboard/sales/pipeline`

**Relevant files:**
- New: `apps/web/app/dashboard/sales/pipeline/page.tsx`
- New: `apps/web/components/dashboard/crm/KanbanBoard.tsx`
- New: `apps/web/components/dashboard/crm/KanbanColumn.tsx`
- New: `apps/web/components/dashboard/crm/KanbanCard.tsx`
- `apps/web/components/app-sidebar.tsx` — add pipeline nav item

---

## Phase E: Frontend — Client Detail Page (depends on C3, parallel with D)

### E1. Create client detail page
- Path: `apps/web/app/dashboard/sales/clients/[id]/page.tsx`
- Uses `useGetClientByIdQuery(id)` to fetch client data
- Layout: 2-column grid — left: info + forms, right: timeline

### E2. Create ClientTimeline component
- Path: `apps/web/components/dashboard/crm/ClientTimeline.tsx`
- Vertical timeline showing ClientActivity records (from `activities` relation)
- Each entry: action icon, description, timestamp, user who performed it
- Also reads from `activityLog` JSON for denormalized data

### E3. Create RequirementsForm component
- Path: `apps/web/components/dashboard/crm/RequirementsForm.tsx`
- React Hook Form + Zod validation
- Fields: project description, target audience, services needed, budget range, timeline, special requirements (all text/select)
- Editable ONLY when client stage is REQUIREMENTS_GATHERING (disabled otherwise)
- Calls `updateClientRequirements` mutation on submit
- Shows existing requirements data when pre-filled

### E4. Create ClientInfoCard component  
- Path: `apps/web/components/dashboard/crm/ClientInfoCard.tsx`
- Displays client details (name, phone, email, businessType, source, stage, status)
- Includes StageSelect for inline stage changes

**Relevant files:**
- New: `apps/web/app/dashboard/sales/clients/[id]/page.tsx`
- New: `apps/web/components/dashboard/crm/ClientTimeline.tsx`
- New: `apps/web/components/dashboard/crm/RequirementsForm.tsx`
- New: `apps/web/components/dashboard/crm/ClientInfoCard.tsx`

---

## Verification

1. **Build shared package**: `cd packages/shared && npm run build` — no errors
2. **Migration**: `cd apps/api && npx prisma migrate dev` — succeeds, schema synced
3. **Backend compilation**: `cd apps/api && npm run build` — no TS errors
4. **Frontend compilation**: `cd apps/web && npm run build` — no TS errors
5. **Manual test — Registration flow**: POST /auth/register → User created with CLIENT role → Client record with NEW_LEAD stage appears in DB
6. **Manual test — Pipeline route**: Navigate to /dashboard/sales/pipeline — 9 columns render, no 404
7. **Manual test — Drag and drop**: Drag client from NEW_LEAD to CONTACTED → API updates stage → card moves
8. **Manual test — PROPOSAL_SENT guard**: Try to drag client to PROPOSAL_SENT without filling requirements → error toast, card snaps back
9. **Manual test — Requirements form**: Navigate to client detail in REQUIREMENTS_GATHERING stage → fill form → submit → requirements saved → can now move to PROPOSAL_SENT
10. **Manual test — Timeline**: After multiple stage transitions, timeline shows all entries in order

## Scope Boundaries
- **Included**: Schema update, migration, stage transition logic, requirements guard, registration (public + admin), Kanban board with dnd-kit, client detail page, timeline, requirements form, RTL support
- **Excluded**: Notification system for CONTRACTED_WON (mentioned in SALES_PIPELINE.md but the notifications module doesn't exist yet), PM visibility restrictions for HANDOVER stage (no PM-specific pipeline view needed now)
