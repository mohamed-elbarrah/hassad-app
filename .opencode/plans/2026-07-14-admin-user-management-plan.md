# Admin User Management Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate employees from clients in the admin dashboard, add client user segmentation (new vs active), and restructure navigation.

**Architecture:** Backend adds one new endpoint `GET /admin/clients/users` that returns CLIENT-role users joined with Client business data. Frontend moves `users/` → `employees/` with `excludeRole=CLIENT`, rewrites `clients/` page with segmentation tabs, and restructures nav.

**Tech Stack:** NestJS 11 + Prisma 6 (backend), Next.js 16 App Router + RTK Query (frontend), TypeScript 5.

---

## File Structure

### Backend
- `apps/api/src/modules/admin/dto/admin-clients.dto.ts` — add `QueryClientUsersDto`
- `apps/api/src/modules/admin/controllers/admin-clients.controller.ts` — add `@Get("users")`
- `apps/api/src/modules/admin/services/admin-clients.service.ts` — add `findClientUsers()`

### Frontend — Employees (moved from users)
- `apps/web/app/(dashboard)/dashboard/admin/employees/page.tsx` — create (with `excludeRole=CLIENT`)
- `apps/web/app/(dashboard)/dashboard/admin/employees/[id]/layout.tsx` — create (moved, enhanced sessions tab)
- `apps/web/app/(dashboard)/dashboard/admin/employees/[id]/page.tsx` — create (moved)
- `apps/web/app/(dashboard)/dashboard/admin/employees/[id]/sessions/page.tsx` — create (show actual sessions list)
- `apps/web/app/(dashboard)/dashboard/admin/employees/[id]/activity/page.tsx` — create (moved)
- `apps/web/app/(dashboard)/dashboard/admin/employees/[id]/permissions/page.tsx` — create (enhanced from placeholder)
- `apps/web/app/(dashboard)/dashboard/admin/employees/loading.tsx` — create (moved)
- `apps/web/app/(dashboard)/dashboard/admin/employees/error.tsx` — create (moved)
- `apps/web/features/admin/adminUsersApi.ts` — add `excludeRole` field to `AdminUserFilters`

### Frontend — Clients (reworked)
- `apps/web/app/(dashboard)/dashboard/admin/clients/page.tsx` — rewrite with segments
- `apps/web/features/admin/adminClientsApi.ts` — add `getAdminClientUsers` endpoint

### Frontend — Navigation
- `apps/web/lib/navigation.ts` — restructure nav sections

---

### Task 1: Backend — Add `GET /admin/clients/users` endpoint

**Files:**
- Modify: `apps/api/src/modules/admin/dto/admin-clients.dto.ts`
- Modify: `apps/api/src/modules/admin/controllers/admin-clients.controller.ts`
- Modify: `apps/api/src/modules/admin/services/admin-clients.service.ts`

- [ ] **Step 1: Read existing files to understand current patterns**

```bash
cat apps/api/src/modules/admin/dto/admin-clients.dto.ts
cat apps/api/src/modules/admin/controllers/admin-clients.controller.ts
cat apps/api/src/modules/admin/services/admin-clients.service.ts
```

- [ ] **Step 2: Add `QueryClientUsersDto` to admin-clients.dto.ts**

```typescript
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { ClientStatus } from "@prisma/client";

export class QueryClientUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsString()
  segment?: "new" | "active" | "stopped";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

- [ ] **Step 3: Add `@Get("users")` endpoint to controller**

```typescript
@Get("users")
@RequirePermissions("admin.clients.read")
findClientUsers(@Query() query: QueryClientUsersDto) {
  return this.adminClientsService.findClientUsers(query);
}
```

Add to the class body of `AdminClientsController`.

- [ ] **Step 4: Add `findClientUsers()` method to service**

Add to `admin-clients.service.ts`:

```typescript
import * as bcrypt from "bcrypt";

async findClientUsers(query: QueryClientUsersDto) {
  const where: any = {
    role: { name: "CLIENT" },
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        role: true,
        client: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    this.prisma.user.count({ where }),
  ]);

  let mapped = items.map((u) => ({
    id: u.id,
    clientId: u.client?.id ?? null,
    name: u.name,
    email: u.email,
    companyName: u.client?.companyName ?? null,
    businessType: u.client?.businessType ?? null,
    status: u.client?.status ?? "LEAD",
    portalAccess: u.client?.portalAccessToken ? true : false,
    totalProjects: u.client?.totalProjects ?? 0,
    activeProjects: u.client?.activeProjects ?? 0,
    totalPaid: u.client?.totalPaid ?? 0,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  // Apply segment filter in-memory
  if (query.segment === "new") {
    mapped = mapped.filter((c) => c.activeProjects === 0);
  } else if (query.segment === "active") {
    mapped = mapped.filter((c) => c.activeProjects > 0);
  } else if (query.segment === "stopped") {
    mapped = mapped.filter((c) => c.status === "STOPPED");
  }

  return {
    items: mapped,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

Make sure `PrismaService` is already injected as `this.prisma` (check existing code — it uses `this.prisma`).

- [ ] **Step 5: Verify backend compiles**

```bash
cd apps/api && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing ones).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/admin/dto/admin-clients.dto.ts apps/api/src/modules/admin/controllers/admin-clients.controller.ts apps/api/src/modules/admin/services/admin-clients.service.ts
git commit -m "feat(api): add GET /admin/clients/users endpoint"
```

---

### Task 2: Frontend — Move `users/` → `employees/` with segment filter

**Files:**
- Create: `apps/web/app/(dashboard)/dashboard/admin/employees/*`
- Modify: `apps/web/features/admin/adminUsersApi.ts`
- Delete: `apps/web/app/(dashboard)/dashboard/admin/users/`

- [ ] **Step 1: Add `excludeRole` to `AdminUserFilters`**

Read `apps/web/features/admin/adminUsersApi.ts`, find `AdminUserFilters` interface, add:

```typescript
export interface AdminUserFilters {
  search?: string;
  role?: string;
  excludeRole?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}
```

- [ ] **Step 2: Create employees page directory structure**

```bash
mkdir -p apps/web/app/(dashboard)/dashboard/admin/employees/\[id\]/sessions
mkdir -p apps/web/app/(dashboard)/dashboard/admin/employees/\[id\]/activity
mkdir -p apps/web/app/(dashboard)/dashboard/admin/employees/\[id\]/permissions
```

- [ ] **Step 3: Create `employees/page.tsx`**

Read `apps/web/app/(dashboard)/dashboard/admin/users/page.tsx`, modify:
- Change `title="المستخدمون"` → `title="الموظفون"`
- Change `description="إدارة جميع مستخدمي المنصة: الموظفون والعملاء"` → `description="إدارة جميع موظفي المنصة: الأدوار، الأقسام، والصلاحيات"`
- Change `icon={Users}` → keep `Users`
- Change `EMPTY_STATE.message="لا يوجد مستخدمون"` → `message="لا يوجد موظفون"`
- Change `EMPTY_STATE.hint="لم يتم إضافة أي مستخدمين بعد."` → `hint="لم يتم إضافة أي موظفين بعد."`
- Change the API call to: `useGetAdminUsersQuery({ search: search || undefined, excludeRole: "CLIENT", page, limit: 20 })`
- Remove the status filter from `filterGroups` (employees don't need client status filter)
- Add role and department filters instead:

```typescript
filterGroups={[
  {
    key: "role",
    label: "الدور",
    options: [
      { label: "مدير نظام", value: "ADMIN" },
      { label: "مدير مشروع", value: "PM" },
      { label: "مبيعات", value: "SALES" },
      { label: "فريق", value: "TEAM" },
      { label: "تسويق", value: "MARKETING" },
      { label: "محاسب", value: "ACCOUNTANT" },
    ],
  },
  {
    key: "status",
    label: "الحالة",
    options: [
      { label: "نشط", value: "true" },
      { label: "موقوف", value: "false" },
    ],
  },
]}
```

- Change stat cards — add a "by role" breakdown as additional cards below the main 3:

```typescript
const roleBreakdown = useMemo(() => {
  const counts: Record<string, number> = {};
  users.forEach((u) => {
    counts[u.role] = (counts[u.role] || 0) + 1;
  });
  return counts;
}, [users]);
```

Add the role cards after the main grid.

- [ ] **Step 4: Create `employees/[id]/layout.tsx`**

Same as current `users/[id]/layout.tsx` but:
- Breadcrumb back-link → `/dashboard/admin/employees`

- [ ] **Step 5: Create `employees/[id]/page.tsx`**

Same as current `users/[id]/page.tsx`, no change except breadcrumb link.

- [ ] **Step 6: Create `employees/[id]/sessions/page.tsx`**

Enhanced version — call `useGetAdminSessionsQuery` with userId filter to show actual sessions list instead of just count. Read current `users/[id]/sessions/page.tsx` and the global sessions page for pattern.

- [ ] **Step 7: Create `employees/[id]/activity/page.tsx`**

Same as current `users/[id]/activity/page.tsx`, no change.

- [ ] **Step 8: Create `employees/[id]/permissions/page.tsx`**

Enhanced — add the ability to view and select permissions. Read current file and the existing `AssignPermissionsDto` pattern.

- [ ] **Step 9: Create `employees/loading.tsx` and `employees/error.tsx`**

Same as current `users/loading.tsx` and `users/error.tsx`, no change.

- [ ] **Step 10: Delete old `users/` directory**

```bash
rm -rf apps/web/app/\(dashboard\)/dashboard/admin/users/
```

- [ ] **Step 11: Verify build**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing ones).

- [ ] **Step 12: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/admin/employees/ apps/web/features/admin/adminUsersApi.ts
git rm -r apps/web/app/\(dashboard\)/dashboard/admin/users/
git commit -m "feat(web): move users page to employees, exclude CLIENT role"
```

---

### Task 3: Frontend — Rewrite clients page with segmentation

**Files:**
- Modify: `apps/web/app/(dashboard)/dashboard/admin/clients/page.tsx`
- Modify: `apps/web/features/admin/adminClientsApi.ts`

- [ ] **Step 1: Add `getAdminClientUsers` API endpoint**

Read `apps/web/features/admin/adminClientsApi.ts` and add:

```typescript
export interface ClientUserFilters {
  search?: string;
  status?: string;
  segment?: "new" | "active" | "stopped";
  page?: number;
  limit?: number;
}

export interface ClientUserItem {
  id: string;
  clientId: string | null;
  name: string;
  email: string;
  companyName: string | null;
  businessType: string | null;
  status: string;
  portalAccess: boolean;
  totalProjects: number;
  activeProjects: number;
  totalPaid: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PaginatedClientUsers {
  items: ClientUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

Add query:

```typescript
getAdminClientUsers: builder.query<PaginatedClientUsers, ClientUserFilters>({
  query: (params) => ({
    url: "/admin/clients/users",
    params,
  }),
  providesTags: ["AdminClientUsers"],
}),
```

Export hook:

```typescript
export const {
  useGetAdminClientsQuery,
  useGetAdminClientByIdQuery,
  useGetAdminClientStatsQuery,
  useGetAdminClientHistoryQuery,
  useGetAdminClientUsersQuery,   // NEW
} = adminClientsApi;
```

- [ ] **Step 2: Rewrite `clients/page.tsx` with segmentation tabs**

```typescript
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, UserPlus } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminClientUsersQuery,
  type ClientUserItem,
} from "@/features/admin/adminClientsApi";
import { cn } from "@/lib/utils";

type SegmentTab = "all" | "new" | "active" | "stopped";

const SEGMENT_TABS: { key: SegmentTab; label: string }[] = [
  { key: "all", label: "كل العملاء" },
  { key: "new", label: "جدد" },
  { key: "active", label: "نشطون" },
  { key: "stopped", label: "موقوفون" },
];

const COLUMNS: DataTableColumn[] = [
  { id: "name", label: "اسم العميل", align: "right" },
  { id: "company", label: "الشركة", align: "right" },
  { id: "email", label: "البريد الإلكتروني", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "projects", label: "المشاريع", align: "right" },
  { id: "revenue", label: "الإيرادات", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: Building2,
  message: "لا يوجد عملاء",
  hint: "لم يتم إضافة أي عملاء بعد.",
};

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  minimumFractionDigits: 0,
});

export default function AdminClientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [segment, setSegment] = useState<SegmentTab>("all");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const segmentParam = segment === "all" ? undefined : segment;
  const statusFilter = activeFilters.status?.[0];

  const { data, isLoading, isError } = useGetAdminClientUsersQuery({
    search: search || undefined,
    segment: segmentParam,
    status: statusFilter,
    page,
    limit: 20,
  });

  const clients = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const newCount = clients.filter((c) => c.activeProjects === 0).length;
    const active = clients.filter((c) => c.activeProjects > 0).length;
    const stopped = clients.filter((c) => c.status === "STOPPED").length;
    return { total, new: newCount, active, stopped };
  }, [data, clients]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="العملاء"
        description="إدارة حسابات العملاء: متابعة النشاط والمشاريع والفواتير"
        icon={Building2}
        actions={
          <ActionButton variant="primary" size="md">
            <UserPlus className="h-4 w-4" />
            إضافة عميل
          </ActionButton>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total, className: "" },
          { label: "جدد", value: statCards.new, className: "bg-blue-100/50 border-blue-200 text-blue-600" },
          { label: "نشطون", value: statCards.active, className: "bg-success-100/50 border-success-200 text-success-600" },
          { label: "موقوفون", value: statCards.stopped, className: "bg-danger-100/50 border-danger-200 text-danger-600" },
        ].map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-[30px] border-[1.5px] border-portal-card-border p-5",
              card.className,
            )}
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Segment tabs */}
      <div className="flex gap-1 bg-portal-divider/30 rounded-xl p-1 w-fit">
        {SEGMENT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setSegment(tab.key); setPage(1); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              segment === tab.key
                ? "bg-white text-natural-100 shadow-sm"
                : "text-portal-note-text hover:text-natural-100",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SurfaceCard title="قائمة العملاء">
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث باسم العميل أو الشركة..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { label: "عميل محتمل", value: "LEAD" },
                  { label: "نشط", value: "ACTIVE" },
                  { label: "موقوف", value: "STOPPED" },
                ],
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, values) =>
              setActiveFilters((prev) => ({ ...prev, [key]: values }))
            }
          />
        </div>

        <DataTable
          columns={COLUMNS}
          data={clients}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل العملاء."
          emptyState={EMPTY_STATE}
          renderRow={(client: ClientUserItem) => (
            <tr
              key={client.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/clients/${client.clientId || client.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {client.name}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {client.companyName || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {client.email || "—"}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="client" status={client.status} />
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {client.activeProjects}/{client.totalProjects}
              </td>
              <td className="py-3 px-2 text-right text-sm font-medium text-natural-100">
                {currencyFormatter.format(client.totalPaid)}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing ones).

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/admin/clients/page.tsx apps/web/features/admin/adminClientsApi.ts
git commit -m "feat(web): rewrite clients page with new/active/stopped segments"
```

---

### Task 4: Frontend — Restructure navigation

**Files:**
- Modify: `apps/web/lib/navigation.ts`

- [ ] **Step 1: Restructure navigation in `navigation.ts`**

Read `apps/web/lib/navigation.ts`, modify `adminNavSections`:

Remove the entire `"المستخدمون"` section (currently has Users + Teams items).

Remove `"العملاء"` and `"العملاء المحتملون"` from the `"العمليات"` section.

Add new sections after the `"لوحة التحكم"` section:

```typescript
{
  label: "إدارة الموظفين",
  items: [
    {
      title: "الموظفون",
      url: "/dashboard/admin/employees",
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      title: "الفرق",
      url: "/dashboard/admin/teams",
      icon: Group,
      roles: ["ADMIN"],
    },
  ],
},
{
  label: "إدارة العملاء",
  items: [
    {
      title: "العملاء",
      url: "/dashboard/admin/clients",
      icon: Handshake,
      roles: ["ADMIN"],
    },
    {
      title: "العملاء المحتملون",
      url: "/dashboard/admin/leads",
      icon: UserPlus,
      roles: ["ADMIN"],
    },
  ],
},
```

Keep all other sections unchanged.

- [ ] **Step 2: Check TS compiles**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/navigation.ts
git commit -m "feat(web): restructure admin nav - separate staff and client management"
```

---

### Task 5: Verify integration

- [ ] **Step 1: Run full lint + typecheck**

```bash
npm run verify
```

Expected: pass.

- [ ] **Step 2: Full build**

```bash
turbo build 2>&1 | tail -20
```

Expected: build succeeds.
