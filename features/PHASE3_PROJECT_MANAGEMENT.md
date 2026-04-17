## Feature Plan

### Objective

Implement Phase 3: Project Management + Tasks.

Build a full project management system that links projects to clients/contracts, allows PMs and Admins to manage projects and assign tasks to team members, with a structured status workflow enforced on both the backend and frontend.

---

### Scope

**Backend:**

- Migrate `Project` and `Task` Prisma models from plain `String` fields to proper enums
- Add missing fields to both models
- Build `ProjectsModule` with full CRUD
- Build `TasksModule` with full CRUD + status transition endpoint
- Enforce role-based access on every endpoint

**Shared Package:**

- `ProjectStatus` enum: `PLANNING | ACTIVE | ON_HOLD | COMPLETED | CANCELLED`
- `TaskStatus` enum: `TODO | IN_PROGRESS | IN_REVIEW | BLOCKED | DONE`
- `TaskPriority` enum: `LOW | NORMAL | HIGH | URGENT`
- `TaskDepartment` enum: `DESIGN | MARKETING | DEVELOPMENT | CONTENT | MANAGEMENT`
- Zod schemas: `CreateProjectSchema`, `UpdateProjectSchema`, `CreateTaskSchema`, `UpdateTaskSchema`
- TypeScript interfaces: `Project`, `Task`

**Frontend:**

- Projects list page: `/dashboard/pm/projects`
- Project detail page: `/dashboard/pm/projects/[id]` (with embedded task list/kanban)
- Create/Edit project form (modal or drawer)
- Create/Edit task form (modal or drawer)
- RTK Query slices for `projectsApi` and `tasksApi`

---

### Technical Design

#### Schema Changes

**New enums (Prisma + Shared):**

```
ProjectStatus: PLANNING | ACTIVE | ON_HOLD | COMPLETED | CANCELLED
TaskStatus:    TODO | IN_PROGRESS | IN_REVIEW | BLOCKED | DONE
TaskPriority:  LOW | NORMAL | HIGH | URGENT
TaskDepartment: DESIGN | MARKETING | DEVELOPMENT | CONTENT | MANAGEMENT
```

**Project model additions:**

- `name String` — project title
- `description String?` — optional description
- `startDate DateTime` — project start
- `endDate DateTime` — planned end date
- `status ProjectStatus @default(PLANNING)` — replaces plain String

**Task model additions:**

- `title String` — task title (was missing)
- `status TaskStatus @default(TODO)` — replaces plain String
- `priority TaskPriority @default(NORMAL)` — replaces plain String
- `dept TaskDepartment` — replaces plain String

#### API Design

**Projects** (`/v1/projects`):
| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | /projects | ADMIN, PM | List all (PM sees own only) |
| POST | /projects | ADMIN, PM | Create project |
| GET | /projects/:id | ADMIN, PM | Get project detail |
| PATCH | /projects/:id | ADMIN, PM | Update project |
| DELETE | /projects/:id | ADMIN | Delete project |
| PATCH | /projects/:id/status | ADMIN, PM | Update project status |

**Tasks** (`/v1/projects/:projectId/tasks` + `/v1/tasks`):
| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | /projects/:projectId/tasks | ADMIN, PM | List tasks for project |
| POST | /projects/:projectId/tasks | ADMIN, PM | Create task in project |
| GET | /tasks/:id | ADMIN, PM, EMPLOYEE (own) | Get task detail |
| PATCH | /tasks/:id | ADMIN, PM | Update task (full edit) |
| PATCH | /tasks/:id/status | ADMIN, PM, EMPLOYEE (own) | Update task status only |
| DELETE | /tasks/:id | ADMIN | Delete task |

#### Frontend Architecture

- `features/projects/` — RTK Query `projectsApi`, `projectsSlice`
- `features/tasks/` — RTK Query `tasksApi`, `tasksSlice`
- `app/(dashboard)/dashboard/pm/projects/page.tsx` — project list
- `app/(dashboard)/dashboard/pm/projects/[id]/page.tsx` — project detail + task kanban
- `components/dashboard/pm/` — `ProjectCard`, `ProjectForm`, `TaskCard`, `TaskForm`, `TaskKanban`

---

### Constraints

1. Tech stack is locked — no new packages outside approved list (dnd-kit may be used for kanban as it was approved in Phase 2)
2. PM can only see/modify projects they manage (`managerId === currentUser.id`)
3. EMPLOYEE can only update status on tasks assigned to them
4. `contractId` on Project is optional — not every project must start from a contract (mark as `String?`)
5. Migration must not destroy existing data — use `@default` values for new NOT NULL columns
6. All new enums must be defined in `packages/shared` first, then mirrored in Prisma schema
7. No `any` types — zero tolerance
8. Shared package must be rebuilt (`npm run build`) before API can consume updated types

---

### Risks

1. **Schema migration with data** — Project/Task models have existing data from seed. New NOT NULL enum fields require defaults in migration. Mitigation: use `@default(PLANNING)` and `@default(TODO)` in schema before migrating.
2. **contractId optionality** — Current schema has `contractId String` (required). Making it optional (`String?`) requires a migration. Must be handled carefully.
3. **Circular task/project relationship** — TasksModule and ProjectsModule must not import each other. Tasks module uses ProjectsService or raw PrismaService queries to verify project ownership.

---

### Open Questions

None — all resolved during clarification.
