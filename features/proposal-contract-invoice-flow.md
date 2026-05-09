# Proposal → Contract → Invoice Flow — Implementation Plan

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| Phase 1 — Shared Types | ✅ Done | 2026-05-10 |
| Phase 2 — Database | ⬜ Pending | — |
| Phase 3 — Backend API | ⬜ Pending | — |
| Phase 4 — Frontend API Slices | ⬜ Pending | — |
| Phase 5 — Proposal→Contract Bridge | ⬜ Pending | — |
| Phase 6 — Contract Detail Pages | ⬜ Pending | — |
| Phase 7 — Finance Dashboard | ⬜ Pending | — |

### Phase 1 Details
- ✅ Task 1.1 — `ServiceItemSchema` + typed `servicesList` in proposal schemas
- ✅ Task 1.2 — `servicesList` added to `CreateContractSchema`
- ✅ Task 1.3 — `servicesList`, `invoices`, `proposal` added to `Contract` interface; `Proposal.servicesList` typed as `ServiceItem[]`
- ✅ Task 1.4 — `turbo run build --filter=@hassad/shared` ✓, `turbo run build --filter=api` ✓

---

## Architecture Decisions

### 1. Source of truth for services/line-items

Services live as typed JSON on each entity (`Proposal.servicesList`, and new `Contract.servicesList`), **NOT** as separate join tables.

- The existing codebase convention is already JSON (`Proposal.servicesList` is `Json` in Prisma)
- Join tables would require 4 new models, migration drift, updating every query/include across 3 modules — disproportionate effort
- Each entity owns its own snapshot: the proposal's servicesList is an *offer*, the contract's is the *binding agreement*, invoice items are the *billing breakdown*. These are different views at different lifecycle stages

### 2. Invoice generation ownership moves to FinanceService

`FinanceService.generateInvoiceFromContract()` will be the single entry point, called by the contracts controller after contract creation. Not a hidden side effect in ContractsService.

### 3. Data flow

```
Proposal (servicesList JSON)
    │  approve
    │  create contract (copies servicesList)
    ▼
Contract (servicesList JSON) ──► FinanceService.generateInvoiceFromContract()
    │                                    │
    │                                    ▼
    │                            Invoice + InvoiceItem[]
    │  sign → active
```

---

## Phase 1: Shared Package — Type Foundation (3 files)

### Task 1.1 — Define `ServiceItem` as a shared, validated type

**File**: `packages/shared/src/schemas/proposal.schema.ts`

```ts
export const ServiceItemSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.number().positive("Price must be positive"),
  description: z.string().optional(),
});
export type ServiceItem = z.infer<typeof ServiceItemSchema>;
```

Then update `CreateProposalSchema.servicesList`:
```ts
// before: z.array(z.unknown()).min(1)
// after:
servicesList: z.array(ServiceItemSchema).min(1, "At least one service is required"),
```

### Task 1.2 — Add `servicesList` to Contract Zod schema

**File**: `packages/shared/src/schemas/contract.schema.ts`

```ts
export const CreateContractSchema = z.object({
  // ...existing fields...
  servicesList: z.array(ServiceItemSchema).optional(),  // NEW
});
```

Optional because when created from a proposal, the backend copies it automatically.

### Task 1.3 — Add to shared `Contract` interface

**File**: `packages/shared/src/index.ts`

```ts
export interface Contract {
  // ...existing fields (all unchanged)...
  servicesList?: ServiceItem[];       // NEW
  invoices?: Invoice[];               // NEW — populated only when include'd
  proposal?: Proposal;                // NEW — for accessing proposal details
}
```

`servicesList`, `invoices`, and `proposal` are optional — they're only populated when the API explicitly includes them.

### Task 1.4 — Build

```bash
turbo run build --filter=shared
```

---

## Phase 2: Database — Contract Model Update (1 file)

### Task 2.1 — Add `services_list` column to Contract

**File**: `apps/api/prisma/schema.prisma` (in Contract model, after `currency` line ~766)

```prisma
  currency       String         @default("SAR") @map("currency")
  servicesList   Json?          @map("services_list")    // NEW
  filePath        String?        @map("file_path")
```

### Task 2.2 — Push schema

```bash
cd apps/api && npx prisma db push --skip-generate && npx prisma generate
```

Additive (nullable JSON) — zero data loss.

---

## Phase 3: Backend API — Core Logic (6 files)

### Task 3.1 — Include `proposal` + `invoices` in `findOne`

**File**: `apps/api/src/modules/contracts/services/contracts.service.ts` — `findOne(id)` method

```ts
include: {
  client: true,
  versions: true,
  proposal: true,                    // NEW
  invoices: {                        // NEW
    include: { items: true, payments: true },
  },
  request: {
    include: { lead: { select: { id: true, pipelineStage: true } } },
  },
},
```

### Task 3.2 — Copy `servicesList` from proposal during contract creation

**File**: `apps/api/src/modules/contracts/services/contracts.service.ts` — `create()` method

Before the Prisma `create` call, when `proposalId` is present:

```ts
let servicesList: ServiceItem[] = [];
if (dto.proposalId) {
  const proposal = await this.prisma.proposal.findUnique({
    where: { id: dto.proposalId },
    select: { servicesList: true },
  });
  if (proposal?.servicesList) {
    servicesList = proposal.servicesList as ServiceItem[];
  }
}
```

Then pass into contract creation:
```ts
data: {
  // ...existing fields...
  servicesList: servicesList.length > 0 ? servicesList : Prisma.JsonNull,
}
```

### Task 3.3 — Replace `generateInvoiceFromProposal` with `generateInvoiceFromContract` in FinanceService

**File**: `apps/api/src/modules/finance/services/finance.service.ts` — new public method

Reads `contract.servicesList` JSON, creates `Invoice` + `InvoiceItem[]` with proper `description/quantity/unitPrice/total`. Falls back to a single-line invoice if no services exist.

```ts
async generateInvoiceFromContract(contractId: string, userId: string): Promise<Invoice> {
  const contract = await this.prisma.contract.findUnique({
    where: { id: contractId },
    select: { id: true, clientId: true, title: true, totalValue: true, servicesList: true, proposal: { select: { durationDays: true } } },
  });
  if (!contract) throw new NotFoundException('Contract not found');

  const services = (contract.servicesList as ServiceItem[]) || [];
  const invoiceNumber = `INV-${Date.now()}-${contractId.slice(0, 8)}`;
  const durationDays = contract.proposal?.durationDays ?? 30;
  const dueDate = new Date(Date.now() + durationDays * 86400000);

  if (services.length === 0) {
    return this.prisma.invoice.create({
      data: {
        clientId: contract.clientId, contractId: contract.id, createdBy: userId,
        invoiceNumber, amount: contract.totalValue, status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER', issueDate: new Date(), dueDate,
        items: { create: { description: contract.title, quantity: 1, unitPrice: contract.totalValue, total: contract.totalValue } },
      },
      include: { items: true },
    });
  }

  return this.prisma.invoice.create({
    data: {
      clientId: contract.clientId, contractId: contract.id, createdBy: userId,
      invoiceNumber, amount: contract.totalValue, status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER', issueDate: new Date(), dueDate,
      items: { create: services.map(s => ({ description: s.name, quantity: 1, unitPrice: s.price, total: s.price })) },
    },
    include: { items: true },
  });
}
```

### Task 3.4 — Call FinanceService.generateInvoiceFromContract from contract controller

**File**: `apps/api/src/modules/contracts/controllers/contracts.controller.ts` — `create()` method

```ts
const contract = await this.contractsService.create(userId, dto);
try {
  await this.financeService.generateInvoiceFromContract(contract.id, userId);
} catch (error) {
  this.logger.error(`Failed to auto-generate invoice for contract ${contract.id}`, error);
}
return contract;
```

### Task 3.5 — Add explicit invoice generation endpoint

**File**: `apps/api/src/modules/contracts/controllers/contracts.controller.ts`

```ts
@Post(':id/generate-invoice')
@RequirePermissions('finance.create_invoice')
async generateInvoice(@CurrentUserId() userId: string, @Param('id') id: string) {
  return this.financeService.generateInvoiceFromContract(id, userId);
}
```

### Task 3.6 — Remove old `generateInvoiceFromProposal` in ContractsService

**File**: `apps/api/src/modules/contracts/services/contracts.service.ts` — delete the private method (~lines 321-406) and its fire-and-forget invocation.

### Task 3.7 — Add `contractId` filter to GET /invoices

**File**: `apps/api/src/modules/finance/services/finance.service.ts` — `findAllInvoices()`:
```ts
if (filters.contractId) where.contractId = filters.contractId;
```

**File**: `apps/api/src/modules/finance/controllers/finance.controller.ts` — `GET /invoices`:
```ts
@Query('contractId') contractId?: string
```

---

## Phase 4: Frontend API Slices (2 files)

### Task 4.1 — Add `InvoiceSummary` types + update `ContractItem`

**File**: `apps/web/features/contracts/contractsApi.ts`

```ts
export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  paymentReference?: string | null;
  payments?: PaymentSummary[];
  items?: InvoiceItemSummary[];
}

export interface PaymentSummary {
  id: string;
  amount: number;
  status: string;
  date: string;
}

export interface InvoiceItemSummary {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ContractItem {
  // ...existing fields unchanged...
  servicesList?: ServiceItem[];
  proposal?: {
    id: string;
    title: string;
    servicesList?: ServiceItem[];
    totalPrice?: number;
  } | null;
  invoices?: InvoiceSummary[];
}
```

### Task 4.2 — Add `getInvoicesByContractId` to financeApi

**File**: `apps/web/features/finance/financeApi.ts`

```ts
getInvoicesByContractId: builder.query<InvoiceSummary[], string>({
  query: (contractId) => ({ url: '/invoices', params: { contractId } }),
  providesTags: ['Invoices'],
}),
```

Export: `useGetInvoicesByContractIdQuery`

### Task 4.3 — Add `generateInvoice` mutation to contractsApi

**File**: `apps/web/features/contracts/contractsApi.ts`

```ts
generateInvoice: builder.mutation<InvoiceSummary, string>({
  query: (contractId) => ({
    url: `/contracts/${contractId}/generate-invoice`,
    method: 'POST',
  }),
}),
```

Export: `useGenerateInvoiceMutation`

---

## Phase 5: Proposal → Contract Bridge (2 files)

### Task 5.1 — Add "Create Contract" button on approved proposals

**File**: `apps/web/components/dashboard/sales/ProposalsTable.tsx`

```tsx
{proposal.status === 'APPROVED' && (
  <Button
    onClick={() => {
      setSelectedProposalId(proposal.id);
      setCreateContractOpen(true);
    }}
  >
    إنشاء عقد
  </Button>
)}
```

### Task 5.2 — Update `CreateContractDialog` to accept `proposalId`

**File**: `apps/web/components/dashboard/sales/CreateContractDialog.tsx`

Add `proposalId?: string` prop. When non-null, fetch proposal to pre-fill:
- `title` from proposal title
- `totalValue` from `totalPrice`
- Dates calculated from `durationDays`
- Append `proposalId` to FormData on submit

---

## Phase 6: Contract Detail Pages — Services + Invoices (4 files)

### Task 6.1 — Create `ContractServicesTable` component (NEW)

**File**: `apps/web/components/shared/ContractServicesTable.tsx`

Reusable table: service name | price, with a bold "الإجمالي" footer row.

### Task 6.2 — Create `ContractInvoicesList` component (NEW)

**File**: `apps/web/components/shared/ContractInvoicesList.tsx`

Table: invoice number, amount, status badge, due date, paid date.
Accepts `isPortal` prop — when true, shows a "Pay" button for PENDING/SENT/DUE invoices.

### Task 6.3 — Update public contract share page

**File**: `apps/web/app/contract/[token]/page.tsx`

After the existing financial grid, add:
```tsx
{data.servicesList?.length > 0 && (
  <ContractServicesTable
    services={data.servicesList}
    totalValue={data.totalValue}
  />
)}

{data.invoices?.length > 0 && (
  <ContractInvoicesList invoices={data.invoices} />
)}
```

### Task 6.4 — Update portal contract detail page

**File**: `apps/web/app/(portal)/portal/contracts/[token]/page.tsx`

Same as 6.3, plus `isPortal={true}` on ContractInvoicesList for payment actions.

---

## Phase 7: Finance Dashboard Contract Detail (1 new file)

### Task 7.1 — Create finance contract detail page (NEW)

**File**: `apps/web/app/(dashboard)/dashboard/finance/contracts/[id]/page.tsx`

Full page:
- **Header**: Title, type badge, status badge
- **4 KPI cards**: Total value, paid, remaining, collection rate %
- **Progress bar** for collection
- **ContractServicesTable** for services
- **ContractInvoicesList** for invoices (with admin actions: send, mark paid)
- **Payments table** across all invoices
- **"توليد فاتورة" button** (if no invoices exist yet)

---

## Summary

| Phase | Files Changed | Key Deliverable |
|-------|--------------|-----------------|
| 1 | 3 | `ServiceItem` type, Zod validation |
| 2 | 1 | `Contract.servicesList` DB column |
| 3 | 6 | Backend: includes, copy services, invoice gen in FinanceService |
| 4 | 2 | Frontend types + API hooks |
| 5 | 2 | "Create Contract" from approved proposal |
| 6 | 2 new + 2 edit | Services + invoices on contract detail pages |
| 7 | 1 new | Finance contract detail dashboard |
| **Total** | **18 changed** (4 new) | Full flow operational |

---

## Verification Checklist

After each phase, verify:

- [ ] Phase 1: `turbo run build --filter=shared` passes
- [ ] Phase 2: `npx prisma db push` succeeds; `npx prisma generate` succeeds
- [ ] Phase 3: `turbo run build --filter=api` passes; test `GET /contracts/:id` returns `servicesList` + `invoices`
- [ ] Phase 4: `turbo run build --filter=web` passes
- [ ] Phase 5: Create proposal → approve it → click "Create Contract" → verify contract has services
- [ ] Phase 6: Open contract detail pages — verify services table + invoices list render
- [ ] Phase 7: Open `/dashboard/finance/contracts/:id` — verify all sections render

### E2E test script

```bash
# 1. Login as sales
# 2. Create proposal with 3 services (name + price)
# 3. Approve the proposal
# 4. Click "Create Contract" from the approved proposal
# 5. Verify contract was created with the same 3 services
# 6. Verify an invoice was auto-generated with 3 line items
# 7. Open the contract public page — verify services + invoices visible
# 8. Login as client, open portal contract — verify same
# 9. Login as accountant, open finance contract detail — verify all data
```
