# Dispute Ticket System — Feature Plan

## Overview

A dispute resolution system that allows clients to open tickets ( reclamations تذكرة ) against their assigned Project Manager when disagreements arise. The system enforces a structured resolution workflow with automatic escalation to admin if disputes aren't resolved within the specified timeframe.

### Key Business Value

- **Client Satisfaction**: Provides clients with a formal channel to raise concerns
- **Accountability**: Tracks PM performance on dispute resolution
- **PM Analytics**: Builds a history of disputes per PM for admin decision-making
- **Project Continuity**: Ensures smooth PM transitions without losing progress
- **Transparent Process**: All parties have visibility into the dispute status

---

## User Stories

### Client (Portal)

> As a client, I want to open a dispute ticket against my PM so that my concerns are formally addressed.

> As a client, I want to track my ticket status and communicate with my PM through the ticket.

> As a client, I want to confirm if my issue was resolved or escalate it if not.

### Project Manager (Dashboard)

> As a PM, I want to be notified immediately when a dispute is opened against me.

> As a PM, I want to respond to the client's dispute and resolve it within the allowed time.

> As a PM, I want to see my dispute history and resolution rate.

### Admin (Dashboard)

> As an admin, I want to review new dispute tickets before notifying the PM.

> As an admin, I want to see escalated tickets with PM dispute history.

> As an admin, I want to change the PM for a project when disputes aren't resolved.

> As an admin, I want to close tickets that are invalid or resolved.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DISPUTE TICKET WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────────────────┘

DAY 0
┌──────────────────────────────────────┐
│  CLIENT OPENS TICKET                 │
│  (Portal → Project Detail Page)      │
│                                      │
│  Fields:                             │
│  - Project (auto-selected)           │
│  - Category (enum)                   │
│  - Title                             │
│  - Description                       │
│  - Attachments (optional)            │
│                                      │
│  Response: "تم استلام تذكرتك. سيتم   │
│  مراجعتها من قبل الإدارة."           │
└───────────────────┬──────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│  ADMIN REVIEW (Dashboard)            │
│                                      │
│  Admin sees: "New ticket pending     │
│  approval"                           │
│                                      │
│  Actions:                            │
│  [APPROVE] → Status: APPROVED        │
│              → Notify PM             │
│              → Set deadline (3 days) │
│                                      │
│  [REJECT]  → Status: REJECTED        │
│              → Notify client         │
│              → Reason required       │
└───────────────────┬──────────────────┘
                    │ (if approved)
                    ▼
DAY 0 (after approval)
┌──────────────────────────────────────┐
│  PM NOTIFICATION                     │
│                                      │
│  PM receives:                        │
│  - In-app notification              │
│  - Email (if configured)             │
│                                      │
│  Message: "You have a new dispute    │
│  ticket. Resolve within 3 days."     │
│                                      │
│  PM can:                             │
│  - View ticket details               │
│  - Message client in ticket thread   │
│  - Mark as "In Progress"             │
└───────────────────┬──────────────────┘
                    │
                    │ (PM ↔ Client messaging)
                    │
DAY 1-3             │
                    │
                    ▼
DAY 3
┌──────────────────────────────────────┐
│  CLIENT CONFIRMATION REQUEST         │
│                                      │
│  System sends to client:             │
│  "Has your issue been resolved?"     │
│                                      │
│  [YES, RESOLVED] → Close ticket      │
│                                      │
│  [NO, NOT RESOLVED] → ESCALATE       │
│                                      │
│  [NO RESPONSE] → Continue waiting    │
└───────────────────┬──────────────────┘
                    │
                    │ (if no response)
                    ▼
DAY 5
┌──────────────────────────────────────┐
│  REMINDER #1                         │
│                                      │
│  To client: "Reminder: Please        │
│  confirm if your issue is resolved." │
└───────────────────┬──────────────────┘
                    │
                    │ (if still no response)
                    ▼
DAY 7
┌──────────────────────────────────────┐
│  REMINDER #2 (Final)                 │
│                                      │
│  To client: "Final reminder: Please  │
│  respond or ticket will be auto-     │
│  escalated."                         │
│                                      │
│  After 24h with no response:         │
│  → Auto-escalate to admin            │
└───────────────────┬──────────────────┘
                    │
                    │ (client says NOT RESOLVED or auto-escalated)
                    ▼
┌──────────────────────────────────────┐
│  ESCALATED TO ADMIN                  │
│                                      │
│  Admin dashboard shows:              │
│  - Ticket details                    │
│  - Full message history              │
│  - PM dispute statistics             │
│                                      │
│  Admin actions:                      │
│  [CHANGE PM] → Assign new PM         │
│               → Preserve all tasks   │
│               → Notify all parties   │
│               → Close ticket         │
│                                      │
│  [KEEP PM] → Add resolution notes    │
│              → Close ticket          │
│                                      │
│  [REQUEST INFO] → Ask for more       │
│                   details             │
└──────────────────────────────────────┘
```

---

## Database Schema

### New Tables

```prisma
/// Dispute ticket opened by client against PM
model DisputeTicket {
  id              String              @id @default(cuid())
  ticketNumber    Int                 @unique // Display: #TKT-001

  // ── Parties ────────────────────────────────────────────────
  clientId        String              @map("client_id")
  client          Client              @relation(fields: [clientId], references: [id], onDelete: Cascade)
  pmId            String              @map("pm_id")
  pm              User                @relation("DisputesAgainstPM", fields: [pmId], references: [id])
  projectId       String              @map("project_id")
  project         Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  reviewedBy      String?             @map("reviewed_by") // Admin who approved/rejected
  reviewer        User?               @relation("DisputeReviewer", fields: [reviewedBy], references: [id])
  resolvedBy      String?             @map("resolved_by") // Admin who resolved escalation
  resolver        User?               @relation("DisputeResolver", fields: [resolvedBy], references: [id])

  // ── Content ─────────────────────────────────────────────────
  title           String
  description     String              @db.Text
  category        DisputeCategory

  // ── Status & Timeline ───────────────────────────────────────
  status          DisputeStatus       @default(PENDING_APPROVAL)
  priority        DisputePriority     @default(NORMAL)

  openedAt        DateTime            @default(now()) @map("opened_at")
  approvedAt      DateTime?           @map("approved_at")
  deadlineAt      DateTime?           @map("deadline_at") // 3 days from approval
  clientNotifiedAt DateTime?          @map("client_notified_at")
  clientRespondedAt DateTime?         @map("client_responded_at")
  clientConfirmedResolved Boolean?     @map("client_confirmed_resolved")
  escalatedAt     DateTime?           @map("escalated_at")
  resolvedAt      DateTime?           @map("resolved_at")
  closedAt        DateTime?           @map("closed_at")

  // ── Resolution ──────────────────────────────────────────────
  resolution      String?             @db.Text // Admin's resolution notes
  pmChanged       Boolean             @default(false) @map("pm_changed")
  newPmId         String?             @map("new_pm_id")
  newPm           User?               @relation("NewPmAssignment", fields: [newPmId], references: [id])
  rejectionReason String?             @map("rejection_reason") // If admin rejected

  // ── Relations ───────────────────────────────────────────────
  messages        DisputeMessage[]
  history          DisputeHistory[]
  attachments     DisputeAttachment[]

  @@index([clientId])
  @@index([pmId])
  @@index([projectId])
  @@index([status])
  @@index([openedAt])
  @@map("dispute_tickets")
}

/// Message thread within a dispute ticket
model DisputeMessage {
  id              String          @id @default(cuid())
  ticketId        String          @map("ticket_id")
  authorId        String          @map("author_id")
  author          User            @relation(fields: [authorId], references: [id])
  content         String          @db.Text
  isInternal      Boolean         @default(false) @map("is_internal") // Admin-only notes
  createdAt       DateTime        @default(now()) @map("created_at")

  ticket          DisputeTicket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  attachments     DisputeAttachment[]

  @@index([ticketId])
  @@index([createdAt])
  @@map("dispute_messages")
}

/// File attachments for dispute tickets
model DisputeAttachment {
  id              String          @id @default(cuid())
  ticketId        String          @map("ticket_id")
  messageId       String?         @map("message_id") // Optional: linked to a message
  uploadedBy      String          @map("uploaded_by")
  fileName        String          @map("file_name")
  filePath        String          @map("file_path")
  fileSize        Int             @map("file_size")
  mimeType        String          @map("mime_type")
  uploadedAt      DateTime        @default(now()) @map("uploaded_at")

  ticket          DisputeTicket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  message         DisputeMessage? @relation(fields: [messageId], references: [id], onDelete: Cascade)
  uploader        User            @relation(fields: [uploadedBy], references: [id])

  @@index([ticketId])
  @@map("dispute_attachments")
}

/// Audit trail for dispute ticket status changes
model DisputeHistory {
  id              String          @id @default(cuid())
  ticketId        String          @map("ticket_id")
  fromStatus      DisputeStatus?  @map("from_status")
  toStatus        DisputeStatus   @map("to_status")
  changedBy       String          @map("changed_by")
  changedAt       DateTime        @default(now()) @map("changed_at")
  note            String?

  ticket          DisputeTicket  @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  changer         User           @relation(fields: [changedBy], references: [id])

  @@index([ticketId])
  @@index([changedAt])
  @@map("dispute_history")
}

/// PM dispute statistics (cached for quick lookup)
model PmDisputeStats {
  id                  String    @id @default(cuid())
  userId              String    @unique @map("user_id")
  totalDisputes        Int       @default(0) @map("total_disputes")
  resolvedDisputes     Int       @default(0) @map("resolved_disputes")
  escalatedDisputes    Int       @default(0) @map("escalated_disputes")
  pmChangedCount       Int       @default(0) @map("pm_changed_count")
  avgResolutionDays    Float     @default(0) @map("avg_resolution_days")
  lastUpdated          DateTime  @default(now()) @map("last_updated")

  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("pm_dispute_stats")
}

enum DisputeStatus {
  PENDING_APPROVAL    // Waiting for admin to approve
  REJECTED            // Admin rejected the ticket
  APPROVED            // Admin approved, PM notified
  IN_PROGRESS         // PM is working on resolution
  PENDING_CLIENT      // PM marked resolved, waiting for client
  ESCALATED           // Passed deadline or client confirmed unresolved
  RESOLVED            // Successfully resolved
  CLOSED              // Admin closed (various reasons)

  @@map("dispute_statuses")
}

enum DisputeCategory {
  DELAY               // Project delays
  QUALITY             // Deliverable quality issues
  COMMUNICATION       // PM not responding, unprofessional
  BUDGET              // Budget disputes
  SCOPE               // Scope creep / feature disagreements
  ATTITUDE            // Unprofessional behavior
  OTHER               // Catch-all

  @@map("dispute_categories")
}

enum DisputePriority {
  LOW
  NORMAL
  HIGH
  URGENT

  @@map("dispute_priorities")
}
```

### Updates to Existing Models

```prisma
// Add to User model
model User {
  // ... existing fields ...

  // Dispute relations
  disputesAgainstPm      DisputeTicket[]      @relation("DisputesAgainstPM")
  disputeReviews         DisputeTicket[]      @relation("DisputeReviewer")
  disputeResolutions     DisputeTicket[]      @relation("DisputeResolver")
  newPmAssignments       DisputeTicket[]      @relation("NewPmAssignment")
  disputeMessages        DisputeMessage[]
  disputeAttachments     DisputeAttachment[]
  disputeHistoryChanges  DisputeHistory[]
  disputeStats           PmDisputeStats?
}

// Add to Project model
model Project {
  // ... existing fields ...

  disputeTickets    DisputeTicket[]
}
```

---

## API Endpoints

### Client Portal Endpoints

| Method | Endpoint                        | Description               | Permission           |
| ------ | ------------------------------- | ------------------------- | -------------------- |
| POST   | `/portal/disputes`              | Open new dispute ticket   | Client (own project) |
| GET    | `/portal/disputes`              | List client's disputes    | Client               |
| GET    | `/portal/disputes/:id`          | Get dispute details       | Client (own)         |
| POST   | `/portal/disputes/:id/messages` | Add message to ticket     | Client (own)         |
| POST   | `/portal/disputes/:id/confirm`  | Confirm resolution        | Client (own)         |
| POST   | `/portal/disputes/:id/escalate` | Escalate unresolved issue | Client (own)         |

### PM Dashboard Endpoints

| Method | Endpoint                    | Description           | Permission    |
| ------ | --------------------------- | --------------------- | ------------- |
| GET    | `/pm/disputes`              | List PM's disputes    | PM            |
| GET    | `/pm/disputes/:id`          | Get dispute details   | PM (assigned) |
| POST   | `/pm/disputes/:id/messages` | Add message to ticket | PM (assigned) |
| POST   | `/pm/disputes/:id/resolve`  | Mark as resolved      | PM (assigned) |

### Admin Dashboard Endpoints

| Method | Endpoint                         | Description                    | Permission |
| ------ | -------------------------------- | ------------------------------ | ---------- |
| GET    | `/admin/disputes`                | List all disputes (filterable) | Admin      |
| GET    | `/admin/disputes/stats`          | Dispute statistics             | Admin      |
| GET    | `/admin/disputes/:id`            | Get dispute details            | Admin      |
| POST   | `/admin/disputes/:id/approve`    | Approve ticket                 | Admin      |
| POST   | `/admin/disputes/:id/reject`     | Reject ticket                  | Admin      |
| POST   | `/admin/disputes/:id/change-pm`  | Change project PM              | Admin      |
| POST   | `/admin/disputes/:id/close`      | Close ticket                   | Admin      |
| GET    | `/admin/disputes/pm/:pmId/stats` | PM dispute statistics          | Admin      |

---

## Notification Events

| Event                     | Trigger                        | Recipients             | Channel       |
| ------------------------- | ------------------------------ | ---------------------- | ------------- |
| `DISPUTE_OPENED`          | Client opens ticket            | Admin                  | In-app, Email |
| `DISPUTE_APPROVED`        | Admin approves                 | PM                     | In-app, Email |
| `DISPUTE_REJECTED`        | Admin rejects                  | Client                 | In-app, Email |
| `DISPUTE_NEW_MESSAGE`     | New message added              | Other party            | In-app        |
| `DISPUTE_PM_RESOLVED`     | PM marks resolved              | Client                 | In-app, Email |
| `DISPUTE_CLIENT_CONFIRM`  | Client confirms resolved       | PM, Admin              | In-app        |
| `DISPUTE_CLIENT_ESCALATE` | Client says not resolved       | Admin                  | In-app, Email |
| `DISPUTE_AUTO_ESCALATED`  | 7 days with no client response | Admin                  | In-app, Email |
| `DISPUTE_PM_CHANGED`      | Admin changes PM               | Client, Old PM, New PM | In-app, Email |
| `DISPUTE_CLOSED`          | Admin closes                   | Client, PM             | In-app        |
| `DISPUTE_REMINDER_DAY3`   | 3 days after approval          | Client                 | In-app        |
| `DISPUTE_REMINDER_DAY5`   | 5 days after approval          | Client                 | In-app        |
| `DISPUTE_REMINDER_DAY7`   | 7 days after approval          | Client                 | In-app        |

---

## Cron Jobs (Scheduled Tasks)

### 1. Dispute Reminder Scheduler

**Frequency**: Every hour

```typescript
// Check for tickets needing reminders
// Day 3: Send first reminder to client
// Day 5: Send second reminder to client
// Day 7: Send final reminder + auto-escalate if no response
```

### 2. Dispute Deadline Checker

**Frequency**: Every 15 minutes

```typescript
// Check for tickets past deadline
// Mark as ESCALATED if PM hasn't resolved
// Notify admin
```

---

## Frontend Components

### Client Portal

#### Pages

1. **Dispute List** (`/portal/disputes`)
   - Table of client's disputes
   - Status badges
   - Filter by status

2. **Dispute Detail** (`/portal/disputes/:id`)
   - Ticket info header
   - Message thread
   - Attachment viewer
   - Action buttons (confirm/escalate)

3. **New Dispute Modal** (from project page)
   - Project selector
   - Category dropdown
   - Description textarea
   - File upload

#### Components

- `DisputeStatusBadge`
- `DisputeMessageThread`
- `DisputeAttachmentList`
- `NewDisputeForm`
- `DisputeConfirmationDialog`

### PM Dashboard

#### Pages

1. **Dispute List** (`/pm/disputes`)
   - Table of PM's disputes
   - Status badges
   - Priority indicators

2. **Dispute Detail** (`/pm/disputes/:id`)
   - Ticket info
   - Message thread
   - Resolve button

#### Components

- `DisputeResolutionTimer` (shows remaining time)
- `PmDisputeStatsCard`

### Admin Dashboard

#### Pages

1. **Dispute Overview** (`/admin/disputes`)
   - Tabs: Pending Approval, Active, Escalated, Resolved
   - Statistics cards
   - Filterable table

2. **Dispute Detail** (`/admin/disputes/:id`)
   - Full ticket info
   - Message history
   - PM statistics sidebar
   - Action buttons (approve, reject, change PM, close)

3. **PM Statistics** (`/admin/disputes/pm/:pmId`)
   - Total disputes
   - Resolution rate
   - Average resolution time
   - Escalation count
   - PM change count

#### Components

- `DisputeApprovalDialog`
- `PmChangeDialog`
- `DisputeStatsCard`
- `PmHistoryPanel`

---

## Implementation Phases

### Phase 1: Database & Core Backend (Priority: HIGH)

**Files to Create/Modify:**

1. **Prisma Schema**
   - Add `DisputeTicket`, `DisputeMessage`, `DisputeAttachment`, `DisputeHistory`, `PmDisputeStats` models
   - Add enums: `DisputeStatus`, `DisputeCategory`, `DisputePriority`
   - Update User and Project models with relations
   - Create migration

2. **Shared Package**
   - Add enums to `packages/shared/src/enums/`
   - Add interfaces to `packages/shared/src/index.ts`
   - Add Zod schemas for validation

3. **Backend Module**
   - Create `apps/api/src/modules/disputes/` module
   - `disputes.module.ts`
   - `controllers/disputes.controller.ts`
   - `controllers/admin-disputes.controller.ts`
   - `controllers/pm-disputes.controller.ts`
   - `controllers/portal-disputes.controller.ts`
   - `services/disputes.service.ts`
   - `services/disputes-notifications.service.ts`
   - `dto/create-dispute.dto.ts`
   - `dto/update-dispute.dto.ts`
   - `dto/dispute-message.dto.ts`

4. **Permissions**
   - Add permissions: `disputes.create`, `disputes.read`, `disputes.update`, `disputes.admin`

### Phase 2: Notification & Cron Jobs (Priority: HIGH)

**Files to Create:**

1. **Cron Jobs**
   - `apps/api/src/modules/disputes/disputes.scheduler.ts`
   - Implement reminder logic (day 3, 5, 7)
   - Implement auto-escalation

2. **Notification Integration**
   - Create notification templates
   - Integrate with existing notification system

### Phase 3: PM Change Logic (Priority: HIGH)

**Files to Modify/Create:**

1. **Project Service**
   - Add `changeProjectManager` method
   - Handle task reassignment
   - Preserve project state

2. **Dispute Service**
   - Implement `changePm` resolution action
   - Update PM statistics
   - Create history entries

### Phase 4: Client Portal Frontend (Priority: MEDIUM)

**Files to Create:**

1. **API Slice**
   - `apps/web/features/disputes/disputesApi.ts`

2. **Pages**
   - `apps/web/app/(portal)/portal/disputes/page.tsx`
   - `apps/web/app/(portal)/portal/disputes/[id]/page.tsx`

3. **Components**
   - `apps/web/components/disputes/DisputeStatusBadge.tsx`
   - `apps/web/components/disputes/DisputeMessageThread.tsx`
   - `apps/web/components/disputes/NewDisputeDialog.tsx`
   - `apps/web/components/disputes/DisputeConfirmationDialog.tsx`

4. **Shared Enums**
   - Update `packages/shared/src/enums/` with dispute enums

### Phase 5: PM Dashboard Frontend (Priority: MEDIUM)

**Files to Create:**

1. **Pages**
   - `apps/web/app/(dashboard)/dashboard/pm/disputes/page.tsx`
   - `apps/web/app/(dashboard)/dashboard/pm/disputes/[id]/page.tsx`

2. **Components**
   - `apps/web/components/disputes/PmDisputeCard.tsx`
   - `apps/web/components/disputes/DisputeResolutionTimer.tsx`

### Phase 6: Admin Dashboard Frontend (Priority: MEDIUM)

**Files to Create:**

1. **Pages**
   - `apps/web/app/(dashboard)/dashboard/admin/disputes/page.tsx`
   - `apps/web/app/(dashboard)/dashboard/admin/disputes/[id]/page.tsx`
   - `apps/web/app/(dashboard)/dashboard/admin/disputes/pm/[pmId]/page.tsx`

2. **Components**
   - `apps/web/components/disputes/AdminDisputeList.tsx`
   - `apps/web/components/disputes/DisputeApprovalDialog.tsx`
   - `apps/web/components/disputes/PmChangeDialog.tsx`
   - `apps/web/components/disputes/PmStatsPanel.tsx`

### Phase 7: Testing & Polish (Priority: LOW)

1. **Manual Testing Checklist**
   - Client opens ticket
   - Admin approves/rejects
   - PM receives notification
   - PM responds in thread
   - Client confirms/escalates
   - Admin changes PM
   - Reminders sent correctly
   - Auto-escalation works

2. **Edge Cases**
   - What if PM is deactivated mid-dispute?
   - What if project is archived mid-dispute?
   - What if client deletes account?

---

## Design System Guidelines

### Status Colors

| Status             | Badge Color  | CSS Variable                    |
| ------------------ | ------------ | ------------------------------- |
| `PENDING_APPROVAL` | Yellow/Amber | `bg-yellow-100 text-yellow-800` |
| `REJECTED`         | Gray         | `bg-gray-100 text-gray-800`     |
| `APPROVED`         | Blue         | `bg-blue-100 text-blue-800`     |
| `IN_PROGRESS`      | Indigo       | `bg-indigo-100 text-indigo-800` |
| `PENDING_CLIENT`   | Cyan         | `bg-cyan-100 text-cyan-800`     |
| `ESCALATED`        | Red          | `bg-red-100 text-red-800`       |
| `RESOLVED`         | Green        | `bg-green-100 text-green-800`   |
| `CLOSED`           | Gray         | `bg-gray-100 text-gray-800`     |

### Category Icons

| Category        | Icon          | Label (AR) | Label (EN)    |
| --------------- | ------------- | ---------- | ------------- |
| `DELAY`         | Clock         | تأخير      | Delay         |
| `QUALITY`       | Star          | جودة       | Quality       |
| `COMMUNICATION` | MessageCircle | تواصل      | Communication |
| `BUDGET`        | DollarSign    | ميزانية    | Budget        |
| `SCOPE`         | FileText      | نطاق       | Scope         |
| `ATTITUDE`      | Frown         | تعامل      | Attitude      |
| `OTHER`         | HelpCircle    | أخرى       | Other         |

### UI Components (Use existing shadcn/ui)

- `Button` - Actions
- `Card` - Ticket cards
- `Dialog` - Modals
- `Badge` - Status indicators
- `Avatar` - User avatars in thread
- `Textarea` - Message input
- `Select` - Category dropdown
- `Table` - List views
- `Tabs` - Status tabs
- `Separator` - Message dividers

---

## Rules & Constraints

### Business Rules

1. **One active dispute per project per client** - A client cannot have multiple open disputes for the same project
2. **PM has 3 days** from approval to resolve
3. **Client confirmation required** - PM cannot close ticket unilaterally
4. **Admin approval required** - Clients cannot notify PM directly
5. **PM history tracked** - All disputes recorded for analytics
6. **Project preservation** - Changing PM preserves all tasks, files, team

### Technical Rules

1. **Soft delete** - Never hard delete disputes, use status `CLOSED`
2. **History on every status change** - Follow existing pattern (`task_status_history`, etc.)
3. **Transaction for PM change** - Use `prisma.$transaction()` for PM reassignment
4. **Notification after transaction** - Send notifications only after DB commit
5. **Permission check on every endpoint** - Use `@RequirePermissions()` decorator

### Validation Rules

```typescript
// Create dispute DTO
{
  projectId: string;      // Required, must exist, client must own project
  category: DisputeCategory; // Required
  title: string;          // Required, min 5 chars, max 100 chars
  description: string;    // Required, min 20 chars, max 2000 chars
  attachments?: File[];   // Optional, max 5 files, max 10MB each
}

// Message DTO
{
  content: string;        // Required, min 1 char, max 2000 chars
  attachments?: File[];    // Optional, max 5 files
}

// Admin approval DTO
{
  priority?: DisputePriority; // Optional, default NORMAL
  notes?: string;        // Optional, internal admin notes
}

// Admin rejection DTO
{
  reason: string;        // Required, min 10 chars
}
```

---

## Error Handling

| Error Code    | Message (AR)                   | Message (EN)                |
| ------------- | ------------------------------ | --------------------------- |
| `DISPUTE_001` | المشروع غير موجود              | Project not found           |
| `DISPUTE_002` | ليس لديك صلاحية                | Unauthorized                |
| `DISPUTE_003` | يوجد تذكرة مفتوحة لهذا المشروع | Open dispute already exists |
| `DISPUTE_004` | التذكرة غير موجودة             | Dispute not found           |
| `DISPUTE_005` | لا يمكن تنفيذ هذا الإجراء      | Invalid action              |
| `DISPUTE_006` | الوقت غير مسموح                | Deadline passed             |
| `DISPUTE_007` | الملفات كبيرة جداً             | Files too large             |
| `DISPUTE_008` | لا يوجد مدير متاح              | No PM available             |

---

## Success Metrics

1. **Resolution Time** - Average days from approval to resolution
2. **Escalation Rate** - % of disputes that escalate to admin
3. **PM Change Rate** - % of disputes resulting in PM change
4. **Client Satisfaction** - Post-resolution rating (optional future feature)
5. **Response Time** - Average PM response time to new disputes

---

## Future Enhancements (Out of Scope)

1. **Dispute Analytics Dashboard** - Charts and trends
2. **SLA Configuration** - Configurable resolution time per category
3. **Multi-language Templates** - Notification templates in AR/EN
4. **Dispute Templates** - Pre-filled dispute forms for common issues
5. **Appeal Process** - Allow PM to appeal PM change decision
6. **Rating System** - Client rates resolution quality
7. **Knowledge Base** - Link to help articles for common disputes

---

## Dependencies

- **Existing Modules**:
  - `ProjectsModule` - For PM change logic
  - `NotificationsModule` - For notifications
  - `UsersModule` - For user lookups
  - `StorageService` - For file uploads

- **New Dependencies**:
  - `@nestjs/schedule` - For cron jobs
  - `luxon` or `date-fns` - For date calculations

---

## Timeline Estimate

| Phase                            | Duration | Dependencies  |
| -------------------------------- | -------- | ------------- |
| Phase 1: Database & Core Backend | 3-4 days | None          |
| Phase 2: Notifications & Cron    | 2 days   | Phase 1       |
| Phase 3: PM Change Logic         | 1-2 days | Phase 1       |
| Phase 4: Client Portal UI        | 3 days   | Phase 1, 2    |
| Phase 5: PM Dashboard UI         | 2 days   | Phase 1, 2    |
| Phase 6: Admin Dashboard UI      | 3 days   | Phase 1, 2, 3 |
| Phase 7: Testing & Polish        | 2 days   | All phases    |

**Total Estimated: 15-17 days**

---

## Checklist Before Implementation

- [ ] Review and approve this plan
- [ ] Confirm all business rules with stakeholders
- [ ] Verify PM change logic doesn't break existing workflows
- [ ] Test notification delivery (email, in-app)
- [ ] Verify cron job scheduling works in production
- [ ] Check file upload limits with storage provider
- [ ] Confirm Arabic translations for all UI text
- [ ] Test with multiple concurrent disputes
- [ ] Verify admin approval workflow timing
