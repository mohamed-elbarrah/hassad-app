# Business Operations Oversight — Full Plan

> 8 pages that give the admin full visibility and control over every business
> operation in the system. Each page follows the same pattern:
> **table + filters → detail page → action buttons (all audited).**

---

## Page 1: المشاريع (`/admin/projects`)

### Backend endpoints

```
GET    /admin/projects
       ?search=&pmId=&clientId=&status=&priority=&overdueOnly=true&page=&limit=
       → { items: ProjectRow[], total, page, limit, totalPages }

GET    /admin/projects/:id
       → ProjectDetail (with members, tasks summary, periods, files, meetings)

POST   /admin/projects/:id/reassign-pm   { pmUserId: string }
       → { success: true }

POST   /admin/projects/:id/archive
       → { success: true }

POST   /admin/projects/:id/force-status  { status: ProjectStatus, reason: string }
       → { success: true }
```

### ProjectRow columns

| Column               | Source                                                               | Filterable?                                                 |
| -------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| name                 | Project.name                                                         | search                                                      |
| clientName           | Project.client.companyName                                           | clientId filter                                             |
| pmName               | Project.projectManager.name                                          | pmId filter                                                 |
| status               | Project.status                                                       | status filter (ACTIVE/PLANNING/COMPLETED/ON_HOLD/CANCELLED) |
| completionPercentage | Project.completionPercentage                                         | —                                                           |
| overdueTasksCount    | count of tasks where dueDate < now && status not in [DONE, REVISION] | overdueOnly filter                                          |
| priority             | Project.priority                                                     | priority filter                                             |
| startDate            | Project.startDate                                                    | —                                                           |
| endDate              | Project.endDate                                                      | —                                                           |
| createdAt            | Project.createdAt                                                    | —                                                           |

### Row actions

- Click row → navigate to `/admin/projects/[id]`
- "إعادة تعيين PM" → dialog with user search/select → confirm → POST reassign-pm
- "أرشفة" → confirmation dialog → POST archive
- "تغيير الحالة" → dialog with status dropdown + reason textarea → POST force-status

### Detail page tabs (`/admin/projects/[id]`)

1. **نظرة عامة**: name, client, PM, status, priority, dates, completion %, description, action buttons
2. **الأعضاء**: list of ProjectMember (user name, role, joinedAt), "إضافة عضو" dialog (search user + select role), "إزالة" button
3. **المهام**: DataTable of tasks in this project (title, assignee, status, dueDate, priority) + "إعادة تعيين" + "تغيير الحالة" per row
4. **الملفات**: list of ProjectFile (fileName, uploadedBy, uploadedAt, download link)
5. **الاجتماعات**: list of ProjectMeeting (title, date, notes, createdBy)
6. **الفترات**: list of ProjectPeriod (periodNumber, startDate, endDate, status, completion, report download)
7. **النشاطات**: Ledger entries filtered to entity=project, entityId=:id

---

## Page 2: المهام (`/admin/tasks`)

### Backend endpoints

```
GET    /admin/tasks
       ?search=&assigneeId=&projectId=&department=&status=&priority=&overdueOnly=true&page=&limit=
       → { items: TaskRow[], total, page, limit, totalPages }

GET    /admin/tasks/:id
       → TaskDetail (with history, comments, files)

POST   /admin/tasks/:id/reassign          { assigneeId: string }
       → { success: true }

POST   /admin/tasks/:id/force-transition  { status: TaskStatus, reason: string }
       → { success: true }
```

### TaskRow columns

| Column        | Source                                          | Filterable?                                              |
| ------------- | ----------------------------------------------- | -------------------------------------------------------- |
| title         | Task.title                                      | search                                                   |
| projectName   | Task.project.name                               | projectId filter                                         |
| assigneeName  | Task.assignedTo.name                            | assigneeId filter                                        |
| department    | Task.departmentId → Department.name             | department filter                                        |
| status        | Task.status                                     | status filter (TODO/IN_PROGRESS/IN_REVIEW/DONE/REVISION) |
| priority      | Task.priority                                   | priority filter                                          |
| dueDate       | Task.dueDate                                    | —                                                        |
| isOverdue     | dueDate < now && status not in [DONE, REVISION] | overdueOnly filter                                       |
| revisionCount | Task.revisionCount                              | —                                                        |
| createdAt     | Task.createdAt                                  | —                                                        |

### Row actions

- Click row → navigate to `/admin/tasks/[id]`
- "إعادة تعيين" → dialog with user search/select → POST reassign
- "تغيير الحالة" → dialog with status dropdown + reason → POST force-transition

### Detail page tabs (`/admin/tasks/[id]`)

1. **نظرة عامة**: title, description, project, assignee, status, priority, dueDate, revisionCount
2. **السجل**: TaskStatusHistory timeline (from_status → to_status, changedBy, changedAt)
3. **التعليقات**: TaskComment list
4. **الملفات**: TaskFile list

---

## Page 3: العقود (`/admin/contracts`)

### Backend endpoints

```
GET    /admin/contracts
       ?search=&clientId=&status=&type=&expiringDays=&page=&limit=
       → { items: ContractRow[], total, page, limit, totalPages }

GET    /admin/contracts/:id
       → ContractDetail (with versions, payment plan, renewal alerts, status history)

POST   /admin/contracts/:id/cancel        { reason: string }
       → { success: true }

POST   /admin/contracts/:id/trigger-renewal-alert
       → { success: true }
```

### ContractRow columns

| Column        | Source                      | Filterable?                                      |
| ------------- | --------------------------- | ------------------------------------------------ |
| title         | Contract.title              | search                                           |
| clientName    | Contract.client.companyName | clientId filter                                  |
| type          | Contract.type               | type filter                                      |
| status        | Contract.status             | status filter (DRAFT/ACTIVE/COMPLETED/CANCELLED) |
| monthlyValue  | Contract.monthlyValue       | —                                                |
| totalValue    | Contract.totalValue         | —                                                |
| currency      | Contract.currency           | —                                                |
| startDate     | Contract.startDate          | —                                                |
| endDate       | Contract.endDate            | —                                                |
| isExpiring    | endDate within next N days  | expiringDays filter                              |
| versionNumber | Contract.versionNumber      | —                                                |
| eSigned       | Contract.eSigned            | —                                                |

### Row actions

- Click row → navigate to `/admin/contracts/[id]`
- "إلغاء" → dialog with reason → POST cancel
- "تفعيل تنبيه التجديد" → POST trigger-renewal-alert

### Detail page tabs (`/admin/contracts/[id]`)

1. **نظرة عامة**: title, client, type, status, dates, values, e-sign status
2. **خطة الدفع**: ContractPaymentPlan rows (description, amount, dueDate, status)
3. **الإصدارات**: ContractVersion list (versionNumber, filePath, createdBy, createdAt)
4. **التنبيهات**: ContractRenewalAlert list (alertType, isSent, scheduledAt, sentAt)
5. **سجل الحالة**: ContractStatusHistory timeline

---

## Page 4: العملاء المحتملون (`/admin/leads`)

### Backend endpoints

```
GET    /admin/leads
       ?search=&assigneeId=&stage=&source=&businessType=&page=&limit=
       → { items: LeadRow[], total, page, limit, totalPages }

GET    /admin/leads/:id
       → LeadDetail (with contact log, pipeline history, services, automation logs)

POST   /admin/leads/:id/reassign          { assigneeId: string }
       → { success: true }

GET    /admin/leads/stats
       → { byStage: { stage: count }[], bySource: { source: count }[], conversionRate: number }
```

### LeadRow columns

| Column              | Source                   | Filterable?         |
| ------------------- | ------------------------ | ------------------- |
| companyName         | Lead.companyName         | search              |
| contactName         | Lead.contactName         | search              |
| email               | Lead.email               | —                   |
| phone               | Lead.phoneWhatsapp       | —                   |
| assigneeName        | Lead.assignedTo.name     | assigneeId filter   |
| pipelineStage       | Lead.pipelineStage       | stage filter        |
| source              | Lead.source              | source filter       |
| businessType        | Lead.businessType        | businessType filter |
| contactAttemptCount | Lead.contactAttemptCount | —                   |
| lastContactAt       | Lead.lastContactAt       | —                   |
| createdAt           | Lead.createdAt           | —                   |

### Row actions

- Click row → navigate to `/admin/leads/[id]`
- "إعادة تعيين" → dialog with user search/select → POST reassign

### Detail page tabs (`/admin/leads/[id]`)

1. **نظرة عامة**: company, contact, email, phone, stage, source, notes
2. **سجل التواصل**: LeadContactLog timeline (type, result, notes, contactedAt)
3. **سجل المراحل**: LeadPipelineHistory timeline (from_stage → to_stage, changedBy)
4. **الخدمات**: LeadService list (serviceCatalog name, quantity, price)
5. **سجل الأتمتة**: LeadAutomationLog list (rule name, status, executedAt)

---

## Page 5: طلبات الخدمة (`/admin/requests`)

### Backend endpoints

```
GET    /admin/requests
       ?search=&assigneeId=&status=&clientId=&page=&limit=
       → { items: RequestRow[], total, page, limit, totalPages }

GET    /admin/requests/:id
       → RequestDetail (with services, status history)

POST   /admin/requests/:id/reassign       { assigneeId: string }
       → { success: true }

POST   /admin/requests/:id/force-status   { status: RequestStatus, reason: string }
       → { success: true }
```

### RequestRow columns

| Column         | Source                  | Filterable?                                                   |
| -------------- | ----------------------- | ------------------------------------------------------------- |
| id (رقم الطلب) | Request.id (short)      | search                                                        |
| clientName     | Request.client.name     | clientId filter                                               |
| assigneeName   | Request.assignedTo.name | assigneeId filter                                             |
| status         | Request.status          | status filter (SUBMITTED/QUALIFYING/APPROVED/REJECTED/CLOSED) |
| servicesCount  | count of RequestService | —                                                             |
| ageDays        | days since createdAt    | —                                                             |
| createdAt      | Request.createdAt       | —                                                             |

### Row actions

- Click row → navigate to `/admin/requests/[id]`
- "إعادة تعيين" → dialog with user search/select → POST reassign
- "تغيير الحالة" → dialog with status dropdown + reason → POST force-status

### Detail page tabs (`/admin/requests/[id]`)

1. **نظرة عامة**: client, assignee, status, description, age
2. **الخدمات المطلوبة**: RequestService list (serviceCatalog name, quantity)
3. **سجل الحالة**: RequestStatusHistory timeline

---

## Page 6: الحملات (`/admin/campaigns`)

### Backend endpoints

```
GET    /admin/campaigns
       ?search=&clientId=&managedById=&platform=&status=&overspentOnly=true&page=&limit=
       → { items: CampaignRow[], total, page, limit, totalPages }

GET    /admin/campaigns/:id
       → CampaignDetail (with KPIs, A/B tests, status history, ad connections)

POST   /admin/campaigns/:id/pause        → { success: true }
POST   /admin/campaigns/:id/end          → { success: true }
```

### CampaignRow columns

| Column        | Source                      | Filterable?                                  |
| ------------- | --------------------------- | -------------------------------------------- |
| name          | Campaign.name               | search                                       |
| clientName    | Campaign.client.companyName | clientId filter                              |
| managedByName | Campaign.managedBy.name     | managedById filter                           |
| platform      | Campaign.platform           | platform filter                              |
| status        | Campaign.status             | status filter (PLANNING/ACTIVE/PAUSED/ENDED) |
| budgetTotal   | Campaign.budgetTotal        | —                                            |
| budgetSpent   | Campaign.budgetSpent        | —                                            |
| isOverspent   | budgetSpent > budgetTotal   | overspentOnly filter                         |
| startDate     | Campaign.startDate          | —                                            |
| endDate       | Campaign.endDate            | —                                            |

### Row actions

- Click row → navigate to `/admin/campaigns/[id]`
- "إيقاف مؤقت" → POST pause
- "إنهاء" → confirmation dialog → POST end

### Detail page tabs (`/admin/campaigns/[id]`)

1. **نظرة عامة**: name, client, manager, platform, status, dates, budget vs spent
2. **مؤشرات الأداء**: CampaignKpiSnapshot list (impressions, clicks, conversions, revenue, CPC, CPA, CTR, conversionRate, ROAS, recordedAt)
3. **اختبارات A/B**: AbTest list (name, testElement, status, variants, winningVariant)
4. **سجل الحالة**: CampaignStatusHistory timeline
5. **اتصالات المنصات**: AdPlatformConnection list (platform, syncStatus, lastSyncedAt)

---

## Page 7: المحادثات (`/admin/chat`)

### Backend endpoints

```
GET    /admin/conversations
       ?search=&participantId=&projectId=&isActive=&staleDays=&page=&limit=
       → { items: ConversationRow[], total, page, limit, totalPages }

GET    /admin/conversations/:id/messages
       ?page=&limit=
       → { items: Message[], total, page, limit, totalPages }

POST   /admin/conversations/:id/hide     → { success: true }
GET    /admin/conversations/:id/export   → CSV file download
```

### ConversationRow columns

| Column        | Source                              | Filterable?          |
| ------------- | ----------------------------------- | -------------------- |
| id            | Conversation.id (short)             | search               |
| participants  | ConversationParticipant[].user.name | participantId filter |
| lastMessageAt | max(Message.createdAt)              | —                    |
| messageCount  | count of Message                    | —                    |
| projectId     | (from context)                      | projectId filter     |
| isActive      | Conversation.isActive               | isActive filter      |
| isStale       | last message > N days ago           | staleDays filter     |
| createdAt     | Conversation.createdAt              | —                    |

### Row actions

- Click row → view messages (read-only)
- "إخفاء" → POST hide (soft moderation)
- "تصدير" → GET export (CSV download)

---

## Page 8: نظرة عامة البوابة (`/admin/portal`)

### Backend endpoints

```
GET    /admin/portal/overview
       → { activeClients, idleClients, pendingApprovals, pendingRevisions,
           unsubmittedIntakeForms, snoozedItemsCount, totalTokens }

GET    /admin/portal/clients
       ?search=&status=&hasPortalAccess=&page=&limit=
       → { items: PortalClientRow[], total, page, limit, totalPages }

POST   /admin/clients/:id/regenerate-portal-token
       → { token, expiresAt }
```

### Portal overview data

- **activeClients**: clients who logged into portal in last 30 days
- **idleClients**: clients with portal access but no login in 30 days
- **pendingApprovals**: deliverables/projects/reports awaiting client approval
- **pendingRevisions**: client revision requests not yet resolved
- **unsubmittedIntakeForms**: intake forms created but not submitted
- **snoozedItemsCount**: ClientSnoozedItem count
- **totalTokens**: active portal tokens

### PortalClientRow columns

| Column                | Source                                 | Filterable?            |
| --------------------- | -------------------------------------- | ---------------------- |
| clientName            | Client.contactName                     | search                 |
| companyName           | Client.companyName                     | search                 |
| status                | Client.status                          | status filter          |
| hasPortalAccess       | Client.portalAccessToken != null       | hasPortalAccess filter |
| lastLoginAt           | User.lastLoginAt (linked via userId)   | —                      |
| intakeCompleted       | Client.intakeCompleted                 | —                      |
| pendingApprovalsCount | count of pending deliverables/projects | —                      |

### Row actions

- "إعادة إنشاء رمز البوابة" → POST regenerate-portal-token → show new token
- Click row → navigate to existing `/admin/clients/[id]`

---

## Shared patterns across ALL pages

### Backend

- Every list endpoint: `?search=&...&page=&limit=` → `{ items, total, page, limit, totalPages }`
- Every mutation: `POST` with body → `{ success: true }` or throws `HttpException`
- Every mutation writes to `Ledger` (audit) with `action`, `entity`, `entityId`, `userId`, `after`
- Every mutation validates existence of the entity first (`findUniqueOrThrow` → `NotFoundException`)
- All endpoints use `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions('admin.<entity>.<action>')`
- All services use `PrismaService` with proper transactions where needed

### Frontend

- Every list page: `DataTable` + `FilterBar` + search + pagination + loading/error/empty states
- Every detail page: tabs using `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`
- Every action: `Dialog` with confirmation + `toast.success`/`toast.error`
- Every page has `loading.tsx` (skeleton) + `error.tsx` (retry)
- All text in Arabic (RTL)
- All API calls through RTK Query with proper `tagTypes` and cache invalidation

### Permissions needed (data migration)

```
admin.projects.read, admin.projects.intervene
admin.tasks.read, admin.tasks.intervene
admin.contracts.read, admin.contracts.intervene
admin.leads.read
admin.requests.read, admin.requests.intervene
admin.campaigns.read
admin.chat.read, admin.chat.moderate
admin.portal.read, admin.portal.manage
```

(Already registered in the Phase 0 data migration.)

---

## Order of implementation

1. **المشاريع** (Projects) — most complex, sets the pattern for all others
2. **المهام** (Tasks) — reuses the same pattern as projects
3. **العقود** (Contracts) — adds payment plan + renewal concepts
4. **العملاء المحتملون** (Leads) — adds pipeline + automation concepts
5. **طلبات الخدمة** (Requests) — simplest, quick win
6. **الحملات** (Campaigns) — adds KPI + budget concepts
7. **المحادثات** (Chat) — read-only oversight, different data shape
8. **نظرة عامة البوابة** (Portal) — aggregation dashboard + token management

Each page is self-contained and can be built independently. No page depends on another.

---

Ready to start with **المشاريع (Projects)**? I'll build the backend endpoints + frontend page + detail page + loading/error states in one go.
