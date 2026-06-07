# Sales Dashboard → Design-System Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every raw shadcn/ui primitive used in the sales dashboard (`dashboard/sales/*` + `dashboard/crm/*`) with the unified `@/components/design-system/*` wrapper layer, so the sales dashboard visually matches the client portal.

**Architecture:** The `components/design-system/` directory already contains styled wrappers (renamed from `components/portal/`). We will import those wrappers into sales pages/components instead of `@/components/ui/*`. No new wrappers are created — all migration is done with existing `ActionButton`, `SurfaceCard`, `DataTable`, `Dialog`, `Form`, `Input`, `FormTextarea`, `Checkbox`, `Select`, `Skeleton`, `Pill`, `StatusBadge`, `Divider`, `PageIntro`, `IconCircle`, `InfoPanel`, `Popover`, `KpiPill`, `NotificationBell`, `UserAvatar`, `Toast` etc.  The Kanban keeps its color-coded columns but borders/padding/shadows are updated to DS tokens.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui (wrappers), TypeScript, `cn()` from `@/lib/utils`, `zod`, `react-hook-form`.

**Key Constraints:**
- Do **not** touch `app/(dashboard)/layout.tsx` or `components/app-sidebar.tsx` — shell migration is out of scope.
- Do **not** create new wrappers — only use existing `design-system/` components.
- Kanban color-coded columns **must** be preserved (blue, violet, amber, etc.). Only borders/padding are updated.
- `SearchCombobox` is used inside `ProposalFormDialog` and `CreateContractDialog`. It is a common component that wraps `@/components/ui/command` + `@/components/ui/popover`. It is **not** in the design-system yet, so we cannot migrate its internals — we will only use it as-is and style its trigger/button to match via `className` or replace the trigger Button with `ActionButton` if possible.
- `Collapsible` from `@/components/ui/collapsible` is not in DS yet — leave it raw inside `KanbanGroup` but replace `Badge` inside it with `Pill`.
- `Button`, `Badge`, `Card`, `Table`, `Dialog`, `Form`, `Input`, `Textarea`, `Checkbox`, `Select`, `Skeleton` — all replaced.

---

## File Structure Map

Files modified in this migration:

| # | File | Type | Raw shadcn replaced |
|---|---|---|---|
| 1 | `app/(dashboard)/dashboard/sales/loading.tsx` | Page | `Skeleton` |
| 2 | `app/(dashboard)/dashboard/sales/pipeline/page.tsx` | Page | `Button` |
| 3 | `app/(dashboard)/dashboard/sales/proposals/page.tsx` | Page | loading/error divs |
| 4 | `app/(dashboard)/dashboard/sales/contracts/page.tsx` | Page | loading/error divs |
| 5 | `app/(dashboard)/dashboard/sales/requests/new/page.tsx` | Page | `Button`, `Input`, `Textarea`, `Checkbox`, `Form`, `Select` |
| 6 | `app/(dashboard)/dashboard/sales/requests/[id]/page.tsx` | Page | `Badge`, `Card`, `Skeleton`, `Button` |
| 7 | `app/(dashboard)/dashboard/sales/clients/[id]/page.tsx` | Page | `Skeleton`, `Button` |
| 8 | `components/dashboard/sales/ContractsTable.tsx` | Component | `Button`, `Table` |
| 9 | `components/dashboard/sales/ProposalsTable.tsx` | Component | `Button`, `Table` |
| 10 | `components/dashboard/sales/CreateContractDialog.tsx` | Component | `Dialog`, `Form`, `Input`, `Select`, `Button`, `Badge`, `Skeleton` |
| 11 | `components/dashboard/sales/ProposalFormDialog.tsx` | Component | `Dialog`, raw `<button>`, raw `<input>` (full restyle) |
| 12 | `components/dashboard/crm/KanbanBoard.tsx` | Component | loading skeletons |
| 13 | `components/dashboard/crm/KanbanColumn.tsx` | Component | border/padding re-skin |
| 14 | `components/dashboard/crm/KanbanCard.tsx` | Component | border/padding re-skin |
| 15 | `components/dashboard/crm/KanbanGroup.tsx` | Component | `Badge` |
| 16 | `components/dashboard/crm/ClientInfoCard.tsx` | Component | `Card`, `Badge`, `Button` |
| 17 | `components/dashboard/crm/ClientTimeline.tsx` | Component | `Card` |
| 18 | `components/dashboard/crm/ClientsTable.tsx` | Component | `Table`, `Button`, `Badge` |

---

## Design-System Import Cheatsheet

```tsx
// Buttons
import { ActionButton } from "@/components/design-system/ActionButton";
// variants: "primary" | "secondary" | "outline" | "ghost" | "toggle-active" | "toggle-inactive" | "action-purple" | "action-blue" | "pm" | "submit"
// sizes: "sm" | "md" | "lg" | "xl"

// Cards
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
// title, description?, icon?, action?, contentClassName

// Tables
import { DataTable, type DataTableColumn, type DataTableEmptyState } from "@/components/design-system/DataTable";

// Dialogs
import { Dialog } from "@/components/design-system/Dialog";
// open, onOpenChange, title?, description?, footer?, children, contentClassName

// Forms
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/design-system/Form";
import { FormInput } from "@/components/design-system/FormInput";
// label?, placeholder?, type?, error?, icon?, dir?
import { FormTextarea } from "@/components/design-system/FormTextarea";
// label?, placeholder?, rows?, error?

// Inputs
import { Input } from "@/components/design-system/Input";
// icon?, wrapperClassName (low-level)

// Select
import { Select, SelectItem } from "@/components/design-system/Select";

// Checkbox
import { Checkbox } from "@/components/design-system/Checkbox";

// Skeleton
import { Skeleton } from "@/components/design-system/Skeleton";

// Badges / Pills
import { Pill } from "@/components/design-system/Pill";
// tones: "neutral" | "success" | "warning" | "danger" | "purple" | "blue"

import { StatusBadge } from "@/components/design-system/StatusBadge";
// statuses: "completed" | "in-progress" | "not-started" | "pending" | "revision" | "active" | "on-hold" | "planning" | "cancelled" | "awaiting-review" | "needs-revision" | "draft" | "overdue" | "unpaid"

// Header / Page
import { PageIntro } from "@/components/design-system/PageIntro";
// title, description?, icon?, actions?
```

---

## Token Mapping Reference

| Raw shadcn / Tailwind | Design-System Token |
|---|---|
| `bg-muted` / `bg-muted/30` | `bg-neutral-100/50` or `bg-badge-gray-bg` |
| `bg-primary` | `bg-secondary-500` |
| `text-primary-foreground` | `text-white` |
| `bg-emerald-500` | `bg-success-500` |
| `text-foreground` | `text-natural-100` |
| `text-muted-foreground` | `text-portal-note-text` |
| `border` | `border-[1.5px] border-portal-card-border` |
| `rounded-md` | `rounded-xl` or `rounded-2xl` |
| `rounded-lg` | `rounded-xl` |
| `rounded-xl` | `rounded-2xl` or `rounded-[16px]` |
| `shadow-sm` | remove (cards have no shadow in DS) |
| `text-destructive` / `bg-destructive/10` | `text-danger-500` / `bg-danger-100` |
| `text-muted-foreground/60` | `text-portal-note-text/60` |
| `border-dashed` | keep `border-dashed` but change color to `border-portal-card-border` |
| `bg-background` | `bg-natural-0` |
| `hover:bg-muted` | `hover:bg-portal-bg` |

---

## Execution Phases

### Phase 1: Sales Pages — Easy Wins (Loading, Pipeline, Proposals, Contracts)

#### Task 1.1: `app/(dashboard)/dashboard/sales/loading.tsx`

**File:** `apps/web/app/(dashboard)/dashboard/sales/loading.tsx`

- [ ] **Step 1: Replace `Skeleton` import**

```tsx
// Remove: import { Skeleton } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/design-system/Skeleton";
```

- [ ] **Step 2: Adjust Skeleton class names**

Current:
```tsx
<Skeleton className="h-9 w-64" />
```

The DS `Skeleton` already applies `bg-neutral-100/80 rounded-xl`. But the old Skeleton also applies the same defaults. Keep `rounded-xl`. The existing markup is basically fine — just change the import path. The DS wrapper has the same API.

```tsx
export default function SalesLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}
```

- [ ] **Step 3: Build verification**

```bash
# from apps/web
npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

Expected: no type errors in `loading.tsx`.

---

#### Task 1.2: `app/(dashboard)/dashboard/sales/pipeline/page.tsx`

**File:** `apps/web/app/(dashboard)/dashboard/sales/pipeline/page.tsx`

- [ ] **Step 1: Replace `Button` import**

```tsx
// Remove: import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/design-system/ActionButton";
```

- [ ] **Step 2: Update markup**

Current:
```tsx
<Button asChild variant="outline" size="sm">
  <Link href="/dashboard/sales/proposals">العروض الفنية</Link>
</Button>
```

Replace with `ActionButton`. Note: `ActionButton` supports `href` prop natively (it wraps in `Link` internally). Use `href` directly. `variant="outline"` and `size="sm"` map directly.

```tsx
export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold tracking-tight">لوحة خط المبيعات</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <ActionButton variant="outline" size="sm" href="/dashboard/sales/proposals">
            العروض الفنية
          </ActionButton>
          <ActionButton variant="outline" size="sm" href="/dashboard/sales/contracts">
            العقود
          </ActionButton>
        </div>
      </div>

      <KanbanBoard />
    </div>
  );
}
```

- [ ] **Step 3: Build verification**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep pipeline
```

Expected: no errors.

---

#### Task 1.3: `app/(dashboard)/dashboard/sales/proposals/page.tsx`

**File:** `apps/web/app/(dashboard)/dashboard/sales/proposals/page.tsx`

- [ ] **Step 1: Add DS imports**

```tsx
import { Skeleton } from "@/components/design-system/Skeleton";
import { StatusBanner } from "@/components/design-system/StatusBanner";
```

- [ ] **Step 2: Replace loading spinner div**

Current:
```tsx
{isLoading && (
  <div className="h-32 rounded-md border bg-muted/30 animate-pulse" />
)}
```

Replace:
```tsx
{isLoading && (
  <div className="h-32 rounded-2xl border-[1.5px] border-portal-card-border bg-neutral-100/50 animate-pulse" />
)}
```

Or better, use a skeleton stack:
```tsx
{isLoading && (
  <div className="space-y-3">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>
)}
```

- [ ] **Step 3: Replace error div**

Current:
```tsx
{isError && (
  <div className="rounded-md border p-4 text-sm text-destructive">
    {resolveProposalError(error)}
  </div>
)}
```

Replace with `StatusBanner` (danger variant):
```tsx
{isError && (
  <StatusBanner variant="danger">
    {resolveProposalError(error)}
  </StatusBanner>
)}
```

Note: The DS `StatusBanner` does not accept string children directly in the current API. Let’s check its props: it takes `variant`, `title?`, `children?`, `className?`, `icon?`. We can pass the message as children.

- [ ] **Step 4: Build verification**

---

#### Task 1.4: `app/(dashboard)/dashboard/sales/contracts/page.tsx`

**File:** `apps/web/app/(dashboard)/dashboard/sales/contracts/page.tsx`

Same pattern as Task 1.3. Replace loading/error divs with DS equivalents.

- [ ] **Step 1: Add imports**

```tsx
import { Skeleton } from "@/components/design-system/Skeleton";
import { StatusBanner } from "@/components/design-system/StatusBanner";
```

- [ ] **Step 2: Replace loading div**

```tsx
{isLoading && (
  <div className="space-y-3">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>
)}
```

- [ ] **Step 3: Replace error div**

```tsx
{isError && (
  <StatusBanner variant="danger">فشل تحميل العقود.</StatusBanner>
)}
```

- [ ] **Step 4: Build verification**

---

### Phase 2: Sales Tables — Contracts & Proposals

#### Task 2.1: `components/dashboard/sales/ContractsTable.tsx`

**File:** `apps/web/components/dashboard/sales/ContractsTable.tsx`

- [ ] **Step 1: Import replacements**

Remove:
```tsx
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
```

Add:
```tsx
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
```

- [ ] **Step 2: Define DataTable columns**

The current table has 5 columns: العميل, القيمة, الفترة, الحالة, إجراءات.

Add at top of file:
```tsx
const CONTRACT_COLUMNS: DataTableColumn[] = [
  { id: "client", label: "العميل", align: "right" },
  { id: "totalValue", label: "القيمة", align: "right" },
  { id: "period", label: "الفترة", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "actions", label: "إجراءات", align: "left" },
];

const CONTRACT_EMPTY: DataTableEmptyState = {
  icon: FileText,
  message: "لا توجد عقود بعد.",
  hint: "أنشئ عقداً جديداً من صفحة لوحة المبيعات أو من صفحة العروض.",
};
```

Also need to add `FileText` to existing imports from `lucide-react`.

- [ ] **Step 3: Rewrite component body**

Replace the entire `return` block. The old table is wrapped in `<div className="rounded-md border">`. The DS `DataTable` does not wrap in a border — it's just the table with its own header border styling. We can wrap it in `SurfaceCard` if we want a card shell, but `DataTable` already handles its own border/styling. For simplicity, use `DataTable` directly.

Current table body logic abstracts nicely into a `renderRow` function:

```tsx
function renderContractRow(contract: ContractListItem) {
  const period = `${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", numberingSystem: "latn" }).format(new Date(contract.startDate))} - ${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", numberingSystem: "latn" }).format(new Date(contract.endDate))}`;

  return (
    <tr key={contract.id} /* DataTable handles TableRow */>
      {/* We'll use JSX in DataTable via renderRow prop */}
    </tr>
  );
}
```

Actually, `DataTable` accepts a `renderRow?: (row: T, index: number) => ReactNode` prop. The return type is a `React.ReactNode` that should contain `<tr>` with `<td>`. But looking at `DataTable` implementation, it renders `renderRow` directly as children of `<TableBody>`. The expected return should be `<TableRow>` with `<TableCell>` elements.

So our `renderRow` function returns:

```tsx
function renderContractRow(contract: ContractListItem) {
  return (
    <TableRow key={contract.id}>
      <TableCell>{contract.client?.companyName ?? contract.clientId}</TableCell>
      <TableCell>{contract.totalValue.toLocaleString("en-US")}</TableCell>
      <TableCell>
        {/* period formatting */}
      </TableCell>
      <TableCell>{STATUS_LABELS[contract.status]}</TableCell>
      <TableCell className="text-left">
        {/* action buttons */}
      </TableCell>
    </TableRow>
  );
}
```

But we need to import `TableRow` and `TableCell` for the `renderRow` function. The DS `DataTable` already imports `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@/components/ui/table` internally. In our consumer file, we need to import these for the `renderRow` JSX.

However, the README says *"Never import `@/components/ui/*` in page files"*. For a table row render function, we need `TableRow` and `TableCell`. The DS does not export these. The cleanest solution is to import them from `@/components/ui/table` **only in this component file** because we need them to build the row markup that `DataTable` expects. This is structural, not styling.

Wait — actually `DataTable` renders `renderRow(row, idx)` as children of `TableBody`. The return value of `renderRow` must be a valid `ReactNode`, not necessarily a `<TableRow>`. Looking at the current `DataTable`:

```tsx
{renderRow
  ? data.map((row, idx) => renderRow(row, idx))
  : (
      <TableRow>...
      </TableRow>
    )}
```

So `renderRow` must return a `<TableRow>` element. We need `TableRow` + `TableCell` imported in `ContractsTable.tsx`.

Plan: import `TableRow, TableCell` from `@/components/ui/table` in `ContractsTable.tsx` ONLY for the row render function. Add an eslint-disable comment if needed, noting it is structural (required by `DataTable` interface).

Alternatively, `DataTable` could be extended to export `TableRow` / `TableCell` re-exports. But per constraints, we don't create new wrappers. Import raw is acceptable in wrapper definitions and structural composition.

Let me keep it simple: import `TableRow, TableCell` from `@/components/ui/table` with a comment.

```tsx
// Structural primitives needed by DataTable renderRow — styling comes from DataTable wrapper
import { TableRow, TableCell } from "@/components/ui/table";
```

Full rewrite of `ContractsTable` return:

```tsx
export function ContractsTable({ contracts }: ContractsTableProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [sendContract, { isLoading: sending }] = useSendContractMutation();
  const [signContract, { isLoading: signing }] = useSignContractMutation();

  // keep existing handlers unchanged ...

  return (
    <DataTable
      columns={CONTRACT_COLUMNS}
      data={contracts}
      isLoading={false}
      isError={false}
      emptyState={CONTRACT_EMPTY}
      renderRow={(contract) => (
        <TableRow key={contract.id}>
          <TableCell className="text-right">
            {contract.client?.companyName ?? contract.clientId}
          </TableCell>
          <TableCell className="text-right">
            {contract.totalValue.toLocaleString("en-US")}
          </TableCell>
          <TableCell className="text-right">
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit", month: "short", year: "numeric", numberingSystem: "latn",
            }).format(new Date(contract.startDate))}{" "}-{" "}
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit", month: "short", year: "numeric", numberingSystem: "latn",
            }).format(new Date(contract.endDate))}
          </TableCell>
          <TableCell className="text-right">{STATUS_LABELS[contract.status]}</TableCell>
          <TableCell className="text-left">
            <div className="flex justify-end gap-2">
              {contract.status === ContractStatus.DRAFT && (
                <ActionButton size="sm" variant="primary" onClick={() => handleSend(contract.id)} loading={sending}>
                  إرسال
                </ActionButton>
              )}
              {contract.status === ContractStatus.SENT && (
                <ActionButton size="sm" variant="outline" onClick={() => handleSign(contract.id)} loading={signing}>
                  توقيع
                </ActionButton>
              )}
              {contract.status === ContractStatus.SIGNED && (
                <ActionButton size="sm" variant="ghost" disabled>
                  تم التوقيع
                </ActionButton>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    />
  );
}
```

Note: remove the `rounded-md border` wrapper div — `DataTable` handles its own border-empty-error states.

- [ ] **Step 4: Build verification**

---

#### Task 2.2: `components/dashboard/sales/ProposalsTable.tsx`

**File:** `apps/web/components/dashboard/sales/ProposalsTable.tsx`

Same pattern as ContractsTable — replace `Button` + `Table` with `ActionButton` + `DataTable`. Add `DataTable` column definitions and `renderRow`.

- [ ] **Step 1: Import replacements**

```tsx
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
// Structural primitives for DataTable renderRow
import { TableRow, TableCell } from "@/components/ui/table";
```

- [ ] **Step 2: Define columns and empty state**

```tsx
const PROPOSAL_COLUMNS: DataTableColumn[] = [
  { id: "client", label: "العميل / العميل المحتمل", align: "right" },
  { id: "price", label: "السعر", align: "right" },
  { id: "createdAt", label: "تاريخ الإنشاء", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "actions", label: "إجراءات", align: "left" },
];

const PROPOSAL_EMPTY: DataTableEmptyState = {
  icon: FileText,
  message: "لا توجد عروض بعد.",
  hint: "أنشئ عرضاً فنياً جديداً من صفحة لوحة المبيعات.",
};
```

- [ ] **Step 3: Rewrite return block**

Replace the entire table block with `DataTable`. Keep the `ProposalFormDialog` conditional rendering at the end.

```tsx
return (
  <>
    <DataTable
      columns={PROPOSAL_COLUMNS}
      data={proposals}
      isLoading={false}
      isError={false}
      emptyState={PROPOSAL_EMPTY}
      renderRow={(proposal) => (
        <TableRow key={proposal.id}>
          <TableCell className="text-right">{getProposalDisplayName(proposal)}</TableCell>
          <TableCell className="text-right">{proposal.totalPrice.toLocaleString("en-US")}</TableCell>
          <TableCell className="text-right">
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit", month: "short", year: "numeric", numberingSystem: "latn",
            }).format(new Date(proposal.createdAt))}
          </TableCell>
          <TableCell className="text-right">{STATUS_LABELS[proposal.status]}</TableCell>
          <TableCell className="text-left">
            <div className="flex justify-end gap-2">
              {canEdit(proposal) && (
                <ActionButton
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditClick(proposal)}
                  title="تعديل"
                >
                  <Pencil className="w-4 h-4" />
                </ActionButton>
              )}
              {proposal.status === ProposalStatus.APPROVED && onCreateContract ? (
                <ActionButton size="sm" variant="primary" onClick={() => onCreateContract(proposal.id)}>
                  <FileText className="w-4 h-4 ml-1" />
                  إنشاء عقد
                </ActionButton>
              ) : proposal.status === ProposalStatus.DRAFT || proposal.status === ProposalStatus.REVISION_REQUESTED ? (
                <ActionButton size="sm" variant="primary" onClick={() => handleSend(proposal.id)} loading={isLoading}>
                  إرسال
                </ActionButton>
              ) : (
                <ActionButton size="sm" variant="outline" onClick={() => handleCopy(proposal.shareLinkToken)} disabled={!proposal.shareLinkToken}>
                  نسخ الرابط
                </ActionButton>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    />

    {editProposal && (
      <ProposalFormDialog
        mode="edit"
        proposal={editProposal}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    )}
  </>
);
```

Note: `isLoading` is from `[sendProposal, { isLoading }]` — rename if needed to avoid collision. The original uses `isLoading` for send proposal state; DataTable `isLoading` is a separate prop. Pass `false` to DataTable's `isLoading` since the table data is already loaded (loading is handled at page level). Actually the page-level `isLoading` means no proposals are passed yet. If `proposals` is empty because loading, DataTable will show empty state. We should either keep page-level loading skeleton (as done in Task 1.3) or pass `isLoading={false}` here. The page already shows a skeleton when loading, so DataTable only receives data.

- [ ] **Step 4: Build verification**

---

### Phase 3: Request Detail Page

#### Task 3.1: `app/(dashboard)/dashboard/sales/requests/[id]/page.tsx`

**File:** `apps/web/app/(dashboard)/dashboard/sales/requests/[id]/page.tsx`

This page uses: `Badge`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Skeleton`, `Button` (from `components/ui`). Also `Badge` hardcoded status colors.

We need to:
1. Replace `Badge` with `Pill` for status labels (custom tones needed).
2. Replace `Card` family with `SurfaceCard`.
3. Replace `Skeleton` with DS `Skeleton`.
4. Replace inline `Button` back-link with `ActionButton`.
5. Replace `text-muted-foreground` → `text-portal-note-text`, `border` → `border-portal-card-border`, etc.

- [ ] **Step 1: Import replacements**

```tsx
import { Pill } from "@/components/design-system/Pill";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
```

- [ ] **Step 2: Define status pill mapping**

The old page uses hardcoded shadcn classes for request status badges:
```
bg-slate-100 text-slate-700, bg-blue-100 text-blue-700, etc.
```

Replace with `Pill` tone mapping. `Pill` supports tones: `neutral`, `success`, `warning`, `danger`, `purple`, `blue`.

Map request statuses to pill tones:

```tsx
const STATUS_PILL: Record<RequestStatus, PillTone> = {
  [RequestStatus.SUBMITTED]: "neutral",
  [RequestStatus.QUALIFYING]: "blue",
  [RequestStatus.PROPOSAL_IN_PROGRESS]: "purple",
  [RequestStatus.PROPOSAL_SENT]: "warning",
  [RequestStatus.NEGOTIATION]: "warning",
  [RequestStatus.CONTRACT_PREPARATION]: "warning",
  [RequestStatus.CONTRACT_SENT]: "success",
  [RequestStatus.SIGNED]: "success",
  [RequestStatus.PROJECT_CREATED]: "success",
  [RequestStatus.CANCELLED]: "danger",
};
```

Import `PillTone` from `Pill.tsx`:
```tsx
import type { PillTone } from "@/components/design-system/Pill";
```

- [ ] **Step 3: Replace `Badge` in `RelatedRecords` and inline status**

In `RelatedRecords`:
- Replace `<Badge variant="outline">{proposal.status}</Badge>` → `<Pill tone="neutral">{proposal.status}</Pill>`
- Replace `<Badge variant="secondary">{project.status}</Badge>` → `<Pill tone="neutral">{project.status}</Pill>`

Inline status on the page header:
```tsx
<span className={cn("px-3 py-1 rounded-full text-xs font-semibold shrink-0", statusBadgeClass)}>
```

Replace with `<Pill>`:
```tsx
<Pill tone={STATUS_PILL[request.status] ?? "neutral"} className="shrink-0">
  {statusLabel}
</Pill>
```

Timeline badge spans:
```tsx
<span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[entry.toStatus] ?? "bg-muted text-muted-foreground")}>
```

Replace with:
```tsx
<Pill tone={STATUS_PILL[entry.toStatus] ?? "neutral"} className="text-[10px]">
  {STATUS_LABELS[entry.toStatus] ?? entry.toStatus}
</Pill>
```

The timeline bullet dot `bg-slate-400` and `bg-primary` should stay semantic — `bg-primary` maps to `bg-secondary-500`. Change:
```tsx
bg-slate-400 → bg-portal-note-text
bg-primary → bg-secondary-500
```

- [ ] **Step 4: Replace `Card` family with `SurfaceCard`**

The page has multiple `<Card>` sections. Replace each with `SurfaceCard`. `SurfaceCard` accepts `title`, `description?`, `icon?`, `action?`, `children`, `className`, `contentClassName`.

Example for "بيانات التواصل":
```tsx
<SurfaceCard
  title="بيانات التواصل"
  icon={User}
>
  <div className="space-y-4">
    <InfoRow icon={<User className="w-4 h-4" />} label="الاسم" value={request.contactName} />
    {/* ... */}
  </div>
</SurfaceCard>
```

Similarly for "بيانات النشاط", "مسار حالة الطلب", and `RelatedRecords`.

Note: `SurfaceCard` uses `rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0` which matches the portal style. The old cards use `rounded-lg border`. This is the key visual upgrade.

- [ ] **Step 5: Replace `Skeleton` with DS `Skeleton`**

Change:
```tsx
import { Skeleton } from "@/components/ui/skeleton";
```
→
```tsx
import { Skeleton } from "@/components/design-system/Skeleton";
```

The existing skeleton classes in `DetailSkeleton` remain the same (`h-8 w-8 rounded`, `h-7 w-48`, etc.). The DS wrapper adds `bg-neutral-100/80 rounded-xl` which may override. The explicit `rounded` classes in the markup will win. Keep the markup mostly unchanged.

- [ ] **Step 6: Replace back link button with `ActionButton`**

Current:
```tsx
<Link href="/dashboard/sales/pipeline" className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0">
  <ArrowRight className="w-5 h-5" />
</Link>
```

Replace with an icon-only `ActionButton`:
```tsx
<ActionButton
  variant="ghost"
  size="sm"
  href="/dashboard/sales/pipeline"
  className="shrink-0 p-1"
  icon={<ArrowRight className="w-5 h-5" />}
  iconPosition="left"
/>
```

Wait — `ActionButton` doesn't have a `p-1` class in sizeStyles. The sizes are `sm: h-7 px-2.5`, `md: h-9 px-3`, etc. A `p-1` override might compress it. Alternatively, keep the raw `<Link>` for a simple icon-only back button since it's not really a "button" action. The rule says "raw shadcn imports only inside wrappers / structural usage". Back-link is structural navigation, not a styled button. So keeping `<Link>` is acceptable. But to be consistent, let's use `ActionButton` with `variant="ghost"` and remove padding override. It will be a slightly larger touch target, which is fine.

```tsx
<ActionButton
  variant="ghost"
  size="sm"
  href="/dashboard/sales/pipeline"
  icon={<ArrowRight className="w-5 h-5" />}
  iconPosition="left"
  className="shrink-0"
  title="العودة إلى لوحة المبيعات"
/ />
```

Actually looking at `ActionButton` implementation, `iconPosition` defaults to "left". Let's just use:
```tsx
<ActionButton variant="ghost" size="sm" href="/dashboard/sales/pipeline" icon={<ArrowRight className="w-5 h-5" />} className="shrink-0" />
```

- [ ] **Step 7: Replace `text-muted-foreground` → `text-portal-note-text`**

Global search-replace within this file:
- `text-muted-foreground` → `text-portal-note-text`
- `border-muted` → `border-portal-divider`
- `border-background` → `border-natural-0`
- `bg-background` → `bg-natural-0`

But do this carefully — not every `bg-background` should be `bg-natural-0`. In the timeline, `bg-background` is the bullet circle border color. That is correct as `bg-natural-0`.

- [ ] **Step 8: Build verification**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep requests/\[id\]
```

---

### Phase 4: New Order Page

#### Task 4.1: `app/(dashboard)/dashboard/sales/requests/new/page.tsx`

**File:** `apps/web/app/(dashboard)/dashboard/sales/requests/new/page.tsx`

This is the heaviest page — uses `Button`, `Input`, `Textarea`, `Checkbox`, `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`.

All map directly to existing DS wrappers.

- [ ] **Step 1: Replace imports**

Remove:
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
```

Add:
```tsx
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInput } from "@/components/design-system/FormInput";
import { FormTextarea } from "@/components/design-system/FormTextarea";
import { Checkbox } from "@/components/design-system/Checkbox";
import { Select, SelectItem } from "@/components/design-system/Select";
```

Note: We replace raw `<Input>` in forms with `FormInput` (which has label + error built-in). But the page currently wraps raw `<Input>` inside `FormControl` with `FormLabel` above and `FormMessage` below. Using `FormInput` means we can simplify: `FormInput` already has `FormItem` structure.

However, the page uses `FormField` from `react-hook-form` with `render={({ field, fieldState }) => ...}`. The DS `FormInput` is a standalone component that renders `<FormItem>` + `<FormLabel>` + `<FormControl>` + input + `<FormMessage>`. It expects `label`, `error`, `placeholder`, `type`, `dir`, and spreads the field props.

We can replace the entire `FormField` + `FormItem` + `FormLabel` + `FormControl` + `<Input>` + `FormMessage` block with a single `<FormField>` that returns `<FormInput>`.

Example current block:
```tsx
<FormField
  control={form.control}
  name="contactName"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>الاسم الكامل <span className="text-danger-500">*</span></FormLabel>
      <FormControl>
        <Input placeholder="مثال: أحمد محمد العمري" autoFocus {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

Replace with:
```tsx
<FormField
  control={form.control}
  name="contactName"
  render={({ field, fieldState }) => (
    <FormInput
      label="الاسم الكامل"
      placeholder="مثال: أحمد محمد العمري"
      error={fieldState.error?.message}
      autoFocus
      {...field}
    />
  )}
/>
```

Wait — `FormInput` already wraps in `FormItem` + `FormLabel` + `FormControl` + input + `FormMessage`. Using it inside `FormField` render means we have nested `FormItem`s. That might break shadcn form layout. Let's check `FormInput` implementation.

Read `FormInput.tsx`:

```tsx
// read this file
```

I need to know if `FormInput` wraps itself in `<FormItem>`. Let me assume it does since it's a form field wrapper. Then using it inside `FormField` would indeed double-wrap. The correct pattern for the DS `FormInput` is to NOT wrap it in `FormField` — instead pass `name` and `control`? But `FormInput` likely doesn't take `control`/`name`.

Looking at the portal `new-order/page.tsx` pattern, it does EXACTLY what we want:
```tsx
<FormField
  control={form.control}
  name="contactName"
  render={({ field, fieldState }) => (
    <FormInput
      label="الاسم الكامل"
      placeholder="..."
      error={fieldState.error?.message}
      {...field}
    />
  )}
/>
```

So yes, `FormInput` is designed to be used inside `FormField` render. It wraps in `FormItem`. This is the intended pattern.

For the `Select` inside form, the DS `Select` already has `label` and `error` props and renders its own wrapper. But in the form context, we need to pass `field.onChange` to `onValueChange` and `field.value` to `value`. The DS `Select` does NOT wrap in `FormItem` — it just renders a `<div className="space-y-2">` with a `<label>` and the select trigger.

So for selects, we keep the `FormField` + `FormItem` + `FormLabel` + `FormControl` wrapper and just swap the inner `<Select>` to DS `Select`.

Wait, let me read the portal new-order page to see how it handles Select inside FormField. I already read that file. It does:
```tsx
<FormField
  control={form.control}
  name="businessType"
  render={({ field, fieldState }) => (
    <Select
      label="نوع النشاط التجاري"
      onValueChange={field.onChange}
      defaultValue={field.value}
      placeholder="..."
      error={fieldState.error?.message}
    >
      <SelectItem ... />
    </Select>
  )}
/>
```

The DS `Select` includes its own `<label>` and wraps in `<div className="space-y-2">`. So it does NOT need `FormItem` / `FormLabel` / `FormControl` inside `FormField`. We just put `Select` directly inside `FormField` render.

For `Checkbox` inside multi-select services, the portal page uses:
```tsx
<FormField
  control={form.control}
  name="serviceIds"
  render={() => (
    <FormItem>
      <FormLabel>الخدمات المطلوبة *</FormLabel>
      <div className="grid...">
        {serviceOptions.map((service) => (
          <FormField key={...} ... render={({ field }) => (
            <FormItem className="...">
              <FormControl>
                <Checkbox checked={...} onCheckedChange={...} />
              </FormControl>
              <FormLabel className="font-normal">{service.label}</FormLabel>
            </FormItem>
          )} />
        ))}
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

So we keep the `FormItem` / `FormLabel` / `FormControl` wrapper for the checkbox group, but replace the inner `<Checkbox>` with DS `Checkbox`.

- [ ] **Step 2: Update stepper styling**

Current stepper uses:
```tsx
bg-primary text-primary-foreground
bg-emerald-500 text-white
bg-muted text-muted-foreground
```

Replace with DS tokens:
```tsx
bg-secondary-500 text-white
bg-success-500 text-white
bg-portal-divider text-portal-icon
```

And the connecting line:
```tsx
bg-emerald-400 → bg-success-500
bg-muted → bg-portal-divider
```

Also `text-foreground` → `text-natural-100`.

- [ ] **Step 3: Replace Textarea with FormTextarea**

Block:
```tsx
<FormField name="description" render={({ field, fieldState }) => (
  <FormItem>
    <FormLabel>وصف المشروع (اختياري)</FormLabel>
    <FormControl>
      <Textarea placeholder="..." className="resize-none h-24" {...field} />
    </FormControl>
    <FormMessage />
  </FormItem>
)} />
```

Replace:
```tsx
<FormField name="description" render={({ field, fieldState }) => (
  <FormTextarea
    label="وصف المشروع (اختياري)"
    placeholder="أخبرنا باختصار عن نشاطك وما تريد تحقيقه..."
    rows={3}
    error={fieldState.error?.message}
    {...field}
  />
)} />
```

- [ ] **Step 4: Replace navigation `Button`s with `ActionButton`**

```tsx
{step === 2 ? (
  <ActionButton type="button" variant="ghost" onClick={() => setStep(1)} disabled={isLoading} className="gap-2">
    <ChevronRight className="w-4 h-4" /> السابق
  </ActionButton>
) : <div />}

<ActionButton type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}>
  إلغاء
</ActionButton>

{step === 1 ? (
  <ActionButton type="button" variant="primary" onClick={handleNext} className="gap-2">
    التالي <ChevronLeft className="w-4 h-4" />
  </ActionButton>
) : (
  <ActionButton type="submit" variant="primary" disabled={isLoading} className="gap-2">
    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</> : <>إنشاء الطلب <ArrowRight className="w-4 h-4" /></>}
  </ActionButton>
)}
```

- [ ] **Step 5: Replace checkbox card border styling**

Current service checkbox card:
```tsx
rounded-lg border p-3 hover:bg-muted/40
```

Replace:
```tsx
rounded-2xl border-[1.5px] border-portal-card-border p-3 hover:bg-portal-bg transition-colors cursor-pointer
```

Also `text-destructive` → `text-danger-500` for the required asterisk.

- [ ] **Step 6: Build verification**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep requests/new
```

---

### Phase 5: Kanban Re-skin

#### Task 5.1: `components/dashboard/crm/KanbanBoard.tsx`

**File:** `apps/web/components/dashboard/crm/KanbanBoard.tsx`

- [ ] **Step 1: Replace loading skeletons**

Replace the loading block divs with DS `Skeleton`:
```tsx
import { Skeleton } from "@/components/design-system/Skeleton";
```

Current loading:
```tsx
<div className="h-10 bg-muted animate-pulse rounded-lg" />
<div className="w-72 shrink-0 h-48 bg-muted animate-pulse rounded-xl" />
```

Replace:
```tsx
<Skeleton className="h-10 rounded-xl w-full" />
<Skeleton className="w-72 shrink-0 h-48 rounded-[16px]" />
```

- [ ] **Step 2: Replace error text color**

```tsx
<p className="text-danger-500 font-medium">{resolveKanbanError(error)}</p>
```

- [ ] **Step 3: Replace empty banner border**

```tsx
<div className="mb-4 rounded-2xl border-[1.5px] border-dashed border-portal-card-border px-6 py-4 text-center">
  <p className="text-sm font-medium text-portal-note-text">
```

- [ ] **Step 4: Build verification**

---

#### Task 5.2: `components/dashboard/crm/KanbanColumn.tsx`

**File:** `apps/web/components/dashboard/crm/KanbanColumn.tsx`

- [ ] **Step 1: Update border/padding tokens**

Current:
```tsx
"w-72 shrink-0 rounded-xl border-2 flex flex-col transition-all duration-150",
colorClass,
isOver && "ring-2 ring-primary ring-offset-2 scale-[1.01]",
```

Replace:
```tsx
"w-72 shrink-0 rounded-[16px] border-[1.5px] flex flex-col transition-all duration-150",
colorClass,
isOver && "ring-2 ring-secondary-500 ring-offset-2 scale-[1.01]",
```

Keep `colorClass` (e.g. `bg-blue-50 border-blue-200`) passed from parent — those colors are required by user.

- [ ] **Step 2: Update header and empty state text**

```tsx
<h3 className="text-xs font-semibold text-natural-100 truncate">
<span className="text-xs font-medium bg-natural-0/70 px-2 py-0.5 rounded-full text-portal-note-text shrink-0 tabular-nums">
```

Replace `text-foreground` → `text-natural-100`, `bg-background/70` → `bg-natural-0/70`, `text-muted-foreground` → `text-portal-note-text`.

For empty state:
```tsx
<p className="text-xs text-portal-note-text/60 text-center select-none">
```

- [ ] **Step 3: Build verification**

---

#### Task 5.3: `components/dashboard/crm/KanbanCard.tsx`

**File:** `apps/web/components/dashboard/crm/KanbanCard.tsx`

- [ ] **Step 1: Update card surface tokens**

Current:
```tsx
"bg-background rounded-lg border p-3 cursor-grab active:cursor-grabbing",
"hover:border-primary/40 hover:shadow-sm transition-all duration-100",
```

Replace:
```tsx
"bg-natural-0 rounded-xl border-[1.5px] border-portal-card-border p-3 cursor-grab active:cursor-grabbing",
"hover:border-secondary-500/40 transition-all duration-100",
```

Remove `shadow-sm` — DS cards don't have shadow.

- [ ] **Step 2: Update text tokens**

```tsx
"text-xs text-portal-note-text truncate"
"text-xs text-portal-note-text mt-2 line-clamp-2 leading-relaxed border-t border-portal-divider pt-2"
"text-xs text-portal-note-text min-w-0"
```

- [ ] **Step 3: Build verification**

---

#### Task 5.4: `components/dashboard/crm/KanbanGroup.tsx`

**File:** `apps/web/components/dashboard/crm/KanbanGroup.tsx`

- [ ] **Step 1: Replace `Badge` with `Pill`**

```tsx
// Remove: import { Badge } from "@/components/ui/badge";
import { Pill } from "@/components/design-system/Pill";
```

Replace:
```tsx
<Badge variant="secondary" className={cn("text-xs font-medium min-w-[1.5rem] justify-center", accentClass, "border-0")}>
  {totalCount}
</Badge>
```

With:
```tsx
<Pill tone="neutral" className={cn("min-w-[1.5rem] justify-center text-xs font-medium", accentClass)}>
  {totalCount}
</Pill>
```

Note: `Pill` adds `h-8` and `rounded-full`, which is fine for the count badge.

- [ ] **Step 2: Keep `Collapsible` raw**

`Collapsible` is not in DS yet — leave as `@/components/ui/collapsible`. The trigger can keep the same styling.

- [ ] **Step 3: Build verification**

---

### Phase 6: Client Detail + CRM Components

#### Task 6.1: `components/dashboard/crm/ClientInfoCard.tsx`

**File:** `apps/web/components/dashboard/crm/ClientInfoCard.tsx`

- [ ] **Step 1: Replace imports**

```tsx
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pill } from "@/components/design-system/Pill";
```

Remove `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`, `Button`.

- [ ] **Step 2: Rewrite with `SurfaceCard`**

```tsx
export function ClientInfoCard({ client }: ClientInfoCardProps) {
  // ... state and selectors unchanged ...

  return (
    <SurfaceCard
      title="معلومات العميل"
      action={
        <Pill tone={STATUS_VARIANT[client.status as ClientStatus] === "destructive" ? "danger" : STATUS_VARIANT[client.status as ClientStatus] === "secondary" ? "neutral" : "success"}>
          {STATUS_LABELS[client.status as ClientStatus] ?? client.status}
        </Pill>
      }
    >
      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* ... all Info rows unchanged, just replace text-muted-foreground → text-portal-note-text ... */}
      </div>

      {canHandover && (
        <div className="pt-4 border-t border-portal-divider flex justify-end mt-4">
          <ActionButton variant="primary" size="sm" onClick={() => setHandoverOpen(true)}>
            تسليم للعمليات
          </ActionButton>
        </div>
      )}

      {handoverOpen && (
        <HandoverModal
          open={handoverOpen}
          client={{ id: client.id, name: client.companyName }}
          onClose={() => setHandoverOpen(false)}
        />
      )}
    </SurfaceCard>
  );
}
```

Note: The old `Badge variant` mapping is `"default" | "secondary" | "destructive"`. We map to `Pill` tones.

- [ ] **Step 3: Build verification**

---

#### Task 6.2: `components/dashboard/crm/ClientTimeline.tsx`

**File:** `apps/web/components/dashboard/crm/ClientTimeline.tsx`

- [ ] **Step 1: Replace imports**

```tsx
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
```

Remove `Card`, `CardContent`, `CardHeader`, `CardTitle`.

- [ ] **Step 2: Replace text/border tokens**

```tsx
text-muted-foreground → text-portal-note-text
bg-border → bg-portal-divider
bg-background → bg-natural-0
border-border → border-portal-divider
```

- [ ] **Step 3: Rewrite with `SurfaceCard`**

```tsx
export function ClientTimeline({ activities }: ClientTimelineProps) {
  return (
    <SurfaceCard title="سجل النشاط">
      {activities.length === 0 ? (
        <p className="text-sm text-portal-note-text text-center py-4">
          لا يوجد نشاط مسجل
        </p>
      ) : (
        <div className="relative">
          <div className="absolute right-4 top-0 bottom-0 w-px bg-portal-divider" />
          {/* ... rest of timeline unchanged ... */}
        </div>
      )}
    </SurfaceCard>
  );
}
```

- [ ] **Step 4: Build verification**

---

#### Task 6.3: `components/dashboard/crm/ClientsTable.tsx`

**File:** `apps/web/components/dashboard/crm/ClientsTable.tsx`

- [ ] **Step 1: Replace imports**

```tsx
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pill } from "@/components/design-system/Pill";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
// Structural for renderRow
import { TableRow, TableCell } from "@/components/ui/table";
```

Remove `Button`, `Badge`, `Table` family.

- [ ] **Step 2: Define columns and empty state**

```tsx
const CLIENT_COLUMNS: DataTableColumn[] = [
  { id: "companyName", label: "الشركة", align: "right" },
  { id: "contactName", label: "المسؤول", align: "right" },
  { id: "phone", label: "الجوال", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "actions", label: "", align: "left" },
];

const CLIENT_EMPTY: DataTableEmptyState = {
  icon: Building2,
  message: "لا يوجد عملاء بعد.",
  hint: "أضف عميلاً جديداً من خلال نموذج الإضافة.",
};
```

- [ ] **Step 3: Rewrite render block with `DataTable` + `renderRow`**

Map `Badge` → `Pill`. Map `Button` → `ActionButton`.

```tsx
<DataTable
  columns={CLIENT_COLUMNS}
  data={clients}
  isLoading={false}
  isError={false}
  emptyState={CLIENT_EMPTY}
  renderRow={(client) => (
    <TableRow key={client.id}>
      <TableCell className="text-right font-medium">{client.companyName}</TableCell>
      <TableCell className="text-right">{client.contactName}</TableCell>
      <TableCell className="text-right font-mono" dir="ltr">{client.phoneWhatsapp}</TableCell>
      <TableCell className="text-right">
        <Pill tone={client.status === ClientStatus.ACTIVE ? "success" : client.status === ClientStatus.LEAD ? "neutral" : "danger"}>
          {STATUS_LABELS[client.status as ClientStatus] ?? client.status}
        </Pill>
      </TableCell>
      <TableCell className="text-left">
        <ActionButton size="sm" variant="ghost" href={`/dashboard/sales/clients/${client.id}`}>
          عرض
        </ActionButton>
      </TableCell>
    </TableRow>
  )}
/>
```

- [ ] **Step 4: Build verification**

---

### Phase 7: Dialogs — CreateContractDialog, ProposalFormDialog

#### Task 7.1: `components/dashboard/sales/CreateContractDialog.tsx`

**File:** `apps/web/components/dashboard/sales/CreateContractDialog.tsx`

- [ ] **Step 1: Replace imports**

Remove:
```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
```

Add:
```tsx
import { ActionButton } from "@/components/design-system/ActionButton";
import { Dialog } from "@/components/design-system/Dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/design-system/Form";
import { FormInput } from "@/components/design-system/FormInput";
import { Select, SelectItem } from "@/components/design-system/Select";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Pill } from "@/components/design-system/Pill";
```

- [ ] **Step 2: Wrap dialog with `Dialog` + remove `DialogTrigger` / `DialogContent` / `DialogHeader` / `DialogTitle`**

The DS `Dialog` takes `open`, `onOpenChange`, `title`, `description?`, `footer?`, `children`, `contentClassName`.

Old wrapper:
```tsx
<Dialog open={open} onOpenChange={handleOpenChange}>
  <DialogTrigger asChild><Button>إنشاء عقد</Button></DialogTrigger>
  <DialogContent className="sm:max-w-lg" dir="rtl">
    <DialogHeader><DialogTitle>...</DialogTitle></DialogHeader>
    {/* body */}
  </DialogContent>
</Dialog>
```

Replace with:
```tsx
{/* Trigger outside the dialog wrapper so it can be placed anywhere */}
{isControlled ? null : (
  <ActionButton variant="primary" onClick={() => handleOpenChange(true)}>
    إنشاء عقد
  </ActionButton>
)}

<Dialog
  open={open}
  onOpenChange={handleOpenChange}
  title={isFromProposal ? "إنشاء عقد من العرض الفني" : "عقد جديد"}
  contentClassName="sm:max-w-lg"
>
  {/* body */}
</Dialog>
```

Note: The trigger `ActionButton` must be placed outside the `Dialog` component because DS `Dialog` does not have a `DialogTrigger` slot. In the page that uses `<CreateContractDialog />`, it was the trigger itself. We need to update the page (`contracts/page.tsx`) to show the button and manage open state, OR keep a trigger inside the component. The simplest approach: keep the dialog self-contained by rendering the trigger button conditionally alongside the `Dialog`.

But `CreateContractDialog` is used in two ways:
1. As a standalone trigger: `<CreateContractDialog />` in `contracts/page.tsx`
2. As a controlled dialog: `contractDialogProposalId && <CreateContractDialog proposalId={...} open={...} />`

For case 1 (uncontrolled), we need a trigger button visible. For case 2 (controlled), no trigger needed.

So modify `CreateContractDialog` to:
- If not controlled, render an `ActionButton` before the `Dialog`.
- The `Dialog` itself has no trigger slot.

```tsx
return (
  <>
    {!isControlled && (
      <ActionButton variant="primary" onClick={() => setInternalOpen(true)}>
        إنشاء عقد
      </ActionButton>
    )}
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isFromProposal ? "إنشاء عقد من العرض الفني" : "عقد جديد"}
      contentClassName="sm:max-w-lg"
    >
      {/* body */}
    </Dialog>
  </>
);
```

Wait — the page that uses `<CreateContractDialog />` expects the component to render its own trigger. This change means the component now returns a fragment with both trigger + dialog. The parent page wraps it in a flex layout. That should be fine.

However, the `Dialog` component might already internally wrap in a `Dialog` primitive from shadcn. The DS `Dialog` wraps `Dialog` + `DialogContent`. There is no trigger slot. So we must render the trigger separately. This is the correct pattern for the DS wrapper.

- [ ] **Step 3: Replace form fields with DS equivalents**

Replace all `FormField` + `FormItem` + `FormLabel` + `FormControl` + `<Input>` blocks with `FormInput` (or `FormField` + `Select` for selects).

For selects:
```tsx
<FormField name="type" render={({ field }) => (
  <FormItem>
    <FormLabel>نوع العقد</FormLabel>
    <Select onValueChange={field.onChange} value={field.value}>
      <FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
      <SelectContent>{...}</SelectContent>
    </Select>
    <FormMessage />
  </FormItem>
)} />
```

Replace with DS `Select` (has built-in label/error):
```tsx
<FormField name="type" render={({ field, fieldState }) => (
  <Select
    label="نوع العقد"
    onValueChange={field.onChange}
    value={field.value}
    placeholder="اختر النوع"
    error={fieldState.error?.message}
  >
    {Object.values(ContractType).map((t) => (
      <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
    ))}
  </Select>
)} />
```

For inputs (e.g. "عنوان العقد"):
```tsx
<FormField name="title" render={({ field, fieldState }) => (
  <FormItem>
    <FormLabel>عنوان العقد</FormLabel>
    <FormControl><Input placeholder="..." {...field} /></FormControl>
    <FormMessage />
  </FormItem>
)} />
```

Replace:
```tsx
<FormField name="title" render={({ field, fieldState }) => (
  <FormInput
    label="عنوان العقد"
    placeholder="عقد خدمات التسويق الرقمي..."
    error={fieldState.error?.message}
    {...field}
  />
)} />
```

For number inputs (monthlyValue, totalValue):
Use `FormInput` with `type="number"`, but since it delegates to raw `<input>` inside, we need to check if `FormInput` supports `type`. Read `FormInput.tsx`.

Actually, let me read it:

`FormInput.tsx` uses `PortalInput` which is `Input` — an `<input>` with a wrapper div. It takes all HTML input props via `...props`. So passing `type="number"` works.

However, the current code has custom `onChange` handling for number fields:
```tsx
onChange={(e) => {
  const n = e.target.valueAsNumber;
  field.onChange(Number.isNaN(n) ? undefined : n);
}}
```

`FormInput` spreads `{...field}` which gets the default `onChange`. To override, we can't easily use `FormInput` if it swallows `onChange`. We might need to keep raw `FormField` + `FormControl` + `<Input>` for number fields, but change `<Input>` to DS `Input`.

Wait — `FormInput` is a convenience wrapper. For complex cases, we can still use `FormField` + `FormItem` + `FormLabel` + `FormControl` + DS `Input`.

So for simple text inputs, use `FormInput`. For number/date inputs with custom onChange, use the manual `FormField` pattern with DS `Input`.

```tsx
// Simple text
<FormField name="title" render={({ field, fieldState }) => (
  <FormInput label="عنوان العقد" error={fieldState.error?.message} {...field} />
)} />

// Number with custom onChange
<FormField name="monthlyValue" render={({ field, fieldState }) => (
  <FormItem>
    <FormLabel>القيمة الشهرية (ر.س)</FormLabel>
    <FormControl>
      <Input
        type="number"
        min="0"
        step="0.01"
        {...field}
        value={field.value ?? ""}
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          field.onChange(Number.isNaN(n) ? undefined : n);
        }}
      />
    </FormControl>
    <FormMessage />
  </FormItem>
)} />
```

Note: `Input` now imported from DS, not raw shadcn.

- [ ] **Step 4: Replace `Button` with `ActionButton` inside dialog**

All `Button` elements inside the dialog body (cancel, submit, copy link, etc.) become `ActionButton`.

The success state icon circle:
```tsx
<div className="h-14 w-14 rounded-full bg-success-100/15 flex items-center justify-center">
  <CheckCheck className="h-7 w-7 text-success-500" />
</div>
```

The share link copy button and close button also become `ActionButton`.

- [ ] **Step 5: Replace `Skeleton` with DS `Skeleton`**

Change import path. Markup keeps same classes.

- [ ] **Step 6: Replace `Badge` with `Pill`**

There is only a `Badge` in the proposal info summary block inside the dialog. Actually looking at the code, I don't see `Badge` used in `CreateContractDialog` (the subagent said it was used but looking at the file content, it's not). There is `ContractServicesTable` imported but no Badge. Skip this.

- [ ] **Step 7: Replace file drop zone styling**

Current:
```tsx
"flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer hover:bg-muted/40 transition-colors"
```

Replace:
```tsx
"flex flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-portal-card-border p-5 cursor-pointer hover:bg-portal-bg transition-colors"
```

Also inside the drop zone `text-blue-600` → `text-action-blue`, `text-muted-foreground` → `text-portal-note-text`.

- [ ] **Step 8: Update page that uses this dialog (`contracts/page.tsx`)**

Since the dialog no longer has a built-in trigger, the page that renders `<CreateContractDialog />` uncontrolled will now see a trigger button from the component itself (the fragment includes it). However, the page currently places it in the header layout:
```tsx
<div className="flex items-center justify-between">
  <h1>العقود</h1>
  <CreateContractDialog />
</div>
```

This will still work because the component returns a fragment with trigger + dialog.

But wait — the current `<CreateContractDialog />` renders `<Dialog>` which includes `<DialogTrigger>` inside it. The trigger is part of the Dialog. When we move trigger outside, the page flex layout will place the trigger button correctly because the fragment includes the dialog (which is hidden until open) + the button. React renders the button in the DOM at the same position as before.

Actually, the fragment contains both the button and the dialog (dialog is a portal-like overlay). The button appears in the flex container. This works fine.

However, the `Dialog` component might already internally wrap in a `Dialog` primitive from shadcn. The DS `Dialog` wraps `Dialog` + `DialogContent`. There is no trigger slot. So we must render the trigger separately. This is the correct pattern for the DS wrapper.

- [ ] **Step 9: Build verification**

---

#### Task 7.2: `components/dashboard/sales/ProposalFormDialog.tsx`

**File:** `apps/web/components/dashboard/sales/ProposalFormDialog.tsx`

This is the most complex file — 700 lines, heavily custom-styled with hardcoded gray hex colors, raw `<input>`, `<button>`, `<select>`, custom `<style dangerouslySetInnerHTML>`, inline scrollbar CSS, `@keyframes`.

The raw shadcn imports used:
- `Dialog`, `DialogContent`, `DialogTitle`, `DialogTrigger` from `@/components/ui/dialog`
- `SearchCombobox` from `@/components/common/SearchCombobox` (not a shadcn primitive, but it wraps Command+Popover internally)

All hardcoded styles (e.g. `bg-[#1e293b]`, `border-gray-200`, `text-gray-900`, `bg-gray-50`, `bg-emerald-100`) must be replaced with DS tokens.

However, the `Dialog` wrapper from DS already gives us `rounded-[30px]`, `border-portal-card-border`, `bg-natural-0`. The form inside should match.

- [ ] **Step 1: Replace `Dialog` imports**

Remove:
```tsx
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
```

Add:
```tsx
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Input } from "@/components/design-system/Input";
import { Select, SelectItem } from "@/components/design-system/Select";
```

Note: we still need `SearchCombobox` as-is (can't migrate internals). But we can replace its trigger button styling by passing a custom trigger.

- [ ] **Step 2: Restyle dialog wrapper**

Old:
```tsx
<Dialog open={open} onOpenChange={handleOpenChange}>
  {!isControlled && (
    <DialogTrigger asChild>
      <button className="bg-[#1e293b] hover:bg-[#0f172a] text-white text-[15px] font-semibold py-3 px-6 rounded-xl ...">
        {isEdit ? "تعديل العرض" : "إنشاء عرض جديد"}
      </button>
    </DialogTrigger>
  )}
  <DialogContent className="sm:max-w-[520px] p-0 gap-0 rounded-[24px] overflow-hidden" dir="rtl">
    <DialogTitle className="sr-only">...</DialogTitle>
    ...
    <style dangerouslySetInnerHTML={...} />
  </DialogContent>
</Dialog>
```

New:
```tsx
<>
  {!isControlled && (
    <ActionButton
      variant="primary"
      size="lg"
      onClick={() => setInternalOpen(true)}
    >
      {isEdit ? "تعديل العرض" : "إنشاء عرض جديد"}
    </ActionButton>
  )}
  <Dialog
    open={open}
    onOpenChange={handleOpenChange}
    title={isEdit ? "تعديل العرض" : "إنشاء عرض جديد"}
    contentClassName="sm:max-w-[520px]"
  >
    <div className="max-h-[90vh] overflow-y-auto modal-scroll">
      <div className="space-y-6">
        {/* body */}
      </div>
    </div>
  </Dialog>
</>
```

`Dialog` from DS already wraps `DialogContent` with `rounded-[30px]`, `border-portal-card-border`, `bg-natural-0`. We don't need to specify `rounded-[24px]`. `contentClassName="sm:max-w-[520px]"` is supported via `contentClassName`.

The `modal-scroll` class is in the `<style>` block. We should keep the style block for scrollbar and spinner hiding, but we can inline it in `globals.css` instead. For now, keep `<style dangerouslySetInnerHTML>` but update colors to DS tokens.

- [ ] **Step 3: Restyle inner form to DS tokens**

Current hardcoded tokens to replace globally within this file:

| Current | Replacement |
|---|---|
| `bg-[#1e293b]` | `bg-secondary-500` |
| `hover:bg-[#0f172a]` | `hover:bg-secondary-600` |
| `text-gray-900` | `text-natural-100` |
| `text-gray-700` | `text-natural-100` |
| `text-gray-500` | `text-portal-note-text` |
| `text-gray-400` | `text-portal-icon` |
| `border-gray-200` | `border-portal-card-border` |
| `border-gray-300` | `border-portal-card-border` |
| `bg-gray-50` | `bg-portal-bg` |
| `bg-gray-100` | `bg-portal-bg` |
| `hover:bg-gray-50` | `hover:bg-portal-bg` |
| `bg-white` | `bg-natural-0` |
| `bg-emerald-100` | `bg-success-100/15` |
| `text-emerald-600` / `text-emerald-700` | `text-success-500` |
| `text-red-500` | `text-danger-500` |
| `bg-blue-600` | `text-action-blue` |
| `shadow-slate-800/20` | remove shadow |
| `rounded-[24px]` on card wrapper | `rounded-[30px]` (DS Dialog handles it) |
| `rounded-xl` | `rounded-2xl` |
| `text-[22px]` | `text-2xl` |
| `text-[15px]` | `text-base` |
| `text-[14px]` | `text-sm` |
| `text-[13px]` | `text-sm` |
| `text-[12px]` | `text-xs` |
| `text-[11px]` | `text-xs` |
| `h-12` / `h-14` inputs | keep sizes, but assign wrapper classes |

For all raw `<input>` and `<select>` elements:

Current pattern:
```tsx
<input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="..."
  className="w-full h-12 px-4 text-right text-[13px] text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors bg-white"
/>
```

Replace with DS `Input`:
```tsx
<Input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="باقة إدارة وسائل التواصل الاجتماعي"
  className="w-full"
/>
```

But `Input` from DS is a wrapper with `rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 py-2`. It also accepts `icon` and `wrapperClassName`. The inner `<input>` gets `flex-1 bg-transparent text-sm outline-none text-right text-natural-100 placeholder:text-neutral-300`.

However, the `Input` wrapper does not expose `value`/`onChange` directly — it spreads `...props` to the inner `<input>`. So passing `value={title} onChange={...}` works.

But `Input` may not support `dir="ltr"` for the link input? Let's just pass `dir` as a prop to the inner input via `...props`.

For the file upload row and other non-form simple inputs, we can still use raw `<input>` if they don't fit `Input` wrapper semantics (e.g. hidden inputs, file inputs). The rule is "don't use raw shadcn primitives for UI" — raw HTML elements are fine.

For the PDF upload row and the link display input, using raw `<input>` is acceptable.

For the number inputs (duration, offer validity) and date picker, we can keep raw `<input>` with updated class names (remove hardcoded gray, use DS tokens). Alternatively, if we want to avoid any raw input, we can wrap them with a minimal inline style. The instructions say "use our design system" — using raw `<input>` for a number field is a basic HTML element, not a shadcn primitive. That's acceptable.

But to be fully consistent, we can style raw inputs with DS token classes:
```tsx
<input
  type="number"
  className="w-full h-12 px-2 text-sm text-natural-100 border border-portal-card-border rounded-2xl focus:outline-none focus:border-secondary-500 transition-colors bg-natural-0 text-center"
/>
```

- [ ] **Step 4: Replace action `<button>` elements with `ActionButton`**

There are several inline `<button>` elements in the form:
1. File upload row click target
2. Remove service X button
3. Add service button
4. Cancel button
5. Submit button
6. Copy link button
7. Close success button

Replace all that are visible UI actions:

```tsx
{/* Remove service */}
<ActionButton
  variant="ghost"
  size="sm"
  onClick={() => removeService(index)}
  disabled={services.length <= 1}
  icon={<X className="w-4 h-4" />}
  className="rounded-full border border-portal-card-border w-10 h-10 p-0"
/>

{/* Add service */}
<ActionButton variant="outline" size="lg" fullWidth onClick={addService} icon={<Plus className="w-4 h-4" />}>
  اضافة خدمة اخرى
</ActionButton>

{/* Cancel */}
<ActionButton variant="outline" size="lg" fullWidth onClick={() => handleOpenChange(false)}>
  إلغاء
</ActionButton>

{/* Submit */}
<ActionButton variant="primary" size="lg" fullWidth type="submit" disabled={isSubmitting} loading={isSubmitting}>
  {isEdit ? "تحديث العرض" : "ارسال العرض للعميل"}
</ActionButton>
```

For the copy link success state:
```tsx
<ActionButton
  size="sm"
  variant={copied ? "secondary" : "primary"}
  onClick={copyLink}
  icon={copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
>
  {copied ? "تم النسخ ✓" : "نسخ الرابط"}
</ActionButton>
```

For close success:
```tsx
<ActionButton variant="outline" size="lg" fullWidth onClick={() => handleOpenChange(false)}>
  إغلاق
</ActionButton>
```

- [ ] **Step 5: Replace `<select>` for duration unit with DS `Select`**

Current:
```tsx
<select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="h-12 px-2 ...">
  <option value="DAYS">أيام</option>
  ...
</select>
```

Replace with DS `Select`:
```tsx
<Select
  value={durationUnit}
  onValueChange={setDurationUnit}
  triggerClassName="h-12 text-center"
>
  <SelectItem value="DAYS">أيام</SelectItem>
  <SelectItem value="WEEKS">أسابيع</SelectItem>
  <SelectItem value="MONTHS">أشهر</SelectItem>
</Select>
```

Note: `Select` takes `value` and `onValueChange`, not `onChange`. The `setDurationUnit` setter from `useState` accepts a string directly, so it matches `(value: string) => void`. Good.

- [ ] **Step 6: Update the `<style>` block colors**

Current style block:
```css
.modal-scroll::-webkit-scrollbar { width: 6px; }
.modal-scroll::-webkit-scrollbar-track { background: transparent; }
.modal-scroll::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
.modal-scroll::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
```

Replace scrollbar colors with portal tokens:
```css
.modal-scroll::-webkit-scrollbar-thumb { background-color: #E1E4EA; border-radius: 20px; }
.modal-scroll::-webkit-scrollbar-thumb:hover { background-color: #CFD0D6; }
```

Where `#E1E4EA` = `var(--color-portal-card-border)`, `#CFD0D6` = `var(--color-neutral-100)`.

We can keep the `<style dangerouslySetInnerHTML>` for now since it's self-contained and scoped to this component.

- [ ] **Step 7: Build verification**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep ProposalFormDialog
```

---

### Phase 8: Client Detail Page

#### Task 8.1: `app/(dashboard)/dashboard/sales/clients/[id]/page.tsx`

**File:** `apps/web/app/(dashboard)/dashboard/sales/clients/[id]/page.tsx`

- [ ] **Step 1: Replace imports**

```tsx
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
```

Remove `Skeleton` from `@/components/ui/skeleton` and `Button` from `@/components/ui/button`.

- [ ] **Step 2: Update skeleton loading block**

Keep markup but change import path. No class changes needed.

- [ ] **Step 3: Update error back button**

Current:
```tsx
<Button variant="outline" onClick={() => router.back()}>
  <ArrowRight className="h-4 w-4 me-2" />
  رجوع
</Button>
```

Replace:
```tsx
<ActionButton variant="outline" onClick={() => router.back()} icon={<ArrowRight className="h-4 w-4" />}>
  رجوع
</ActionButton>
```

- [ ] **Step 4: Update header back button**

Current:
```tsx
<Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
  <ArrowRight className="h-4 w-4" />
  رجوع
</Button>
```

Replace:
```tsx
<ActionButton variant="ghost" size="sm" onClick={() => router.back()} icon={<ArrowRight className="h-4 w-4" />} className="gap-2">
  رجوع
</ActionButton>
```

- [ ] **Step 5: Build verification**

---

## Final Verification

After all tasks are complete:

- [ ] **Run TypeScript check**

```bash
cd /home/mohamed/Documents/Apps/hassad-platform/apps/web
npx tsc --noEmit --project tsconfig.json 2>&1 | head -30
```

Expected: zero type errors in migrated files.

- [ ] **Run Next.js build**

```bash
npx turbo build --filter=web
```

Expected: build succeeds.

- [ ] **Check no raw shadcn imports remain in migrated files**

```bash
grep -rn 'from "@/components/ui/' apps/web/app/(dashboard)/dashboard/sales/ apps/web/components/dashboard/sales/ apps/web/components/dashboard/crm/ | grep -v 'table' | grep -v 'collapsible'
```

Only `@/components/ui/table` (for DataTable renderRow) and `@/components/ui/collapsible` (in KanbanGroup) should remain.

- [ ] **Sanity-check visual diff**

Open `/dashboard/sales/pipeline`, `/dashboard/sales/proposals`, `/dashboard/sales/contracts`, `/dashboard/sales/requests/new`, `/dashboard/sales/requests/[id]`, `/dashboard/sales/clients/[id]`, `/dashboard/sales/leads/[id]`.

Cards should have `rounded-[30px]`, borders should be `border-portal-card-border`, buttons should match portal style (outline navy, primary navy, ghost navy), tables should have portal table styling with loading/error/empty states.
