# Stripe Payment Gateway Integration — Implementation Plan

## Current State Audit

### What Exists (already built!)

| Component | File | Status |
|-----------|------|--------|
| `PaymentsModule` | `apps/api/src/modules/payments/` | ✅ Full module |
| `PaymentsService` | `payments/services/payments.service.ts` (272 lines) | ✅ createPayment, processWebhook, updatePaymentStatus, getGateways, encrypt/decrypt |
| `StripeProvider` | `payments/providers/stripe.provider.ts` (106 lines) | ✅ Checkout Session creation, webhook verify, event handler |
| `BankTransferProvider` | `payments/providers/bank-transfer.provider.ts` (26 lines) | ✅ Basic mock |
| `PaymentProvider` interface | `payments/providers/payment-provider.interface.ts` (26 lines) | ✅ |
| `WebhooksController` | `payments/controllers/webhooks.controller.ts` (23 lines) | ✅ POST /webhooks/:provider with raw body |
| `PaymentsController` | `payments/controllers/payments.controller.ts` (48 lines) | ✅ create-intent, gateways CRUD, bank-accounts CRUD |
| `stripe` npm pkg v17.x | `apps/api/package.json` | ✅ Installed |
| `rawBody: true` | `apps/api/src/main.ts:13` | ✅ Enabled for webhook sig verification |
| Prisma: `PaymentGateway` | schema.prisma:1230 | ✅ name, type, configJson (encrypted) |
| Prisma: `Payment` | schema.prisma:1201 | ✅ invoiceId, gatewayId, providerPaymentId, metadataJson |
| Prisma: `PaymentEvent` | schema.prisma:1258 | ✅ audit trail per payment |
| Prisma: `WebhookLog` | schema.prisma:1270 | ✅ records all incoming webhooks |
| Prisma: `BankAccount` | schema.prisma:1244 | ✅ iban, bankName |
| Shared enums/types | `packages/shared/src/enums/finance.ts` | ✅ PaymentStatus, PaymentMethod, PaymentGatewayType, PaymentEventType |
| Zod schemas | `packages/shared/src/schemas/payment.schema.ts` | ✅ CreatePaymentIntentSchema, ManualPaymentSchema |

### What's Missing / Broken

#### P0 — Flow is disconnected (5 items)

| # | Issue | Impact |
|---|-------|--------|
| 1 | **`POST payments/create-intent` has NO auth guard** | Anyone can create payment intents without authentication |
| 2 | **Contract "ادفع" button calls old manual endpoint (`POST /invoices/:id/pay-public`)**, NOT `POST /v1/payments/create-intent` | Payments don't go through Stripe; they're always marked SUCCESS instantly |
| 3 | **No frontend API hook for `create-intent`** | `usePayInvoicePublicMutation` hits the manual path; no hook for the Stripe path |
| 4 | **`BankAccount.deleteBankAccount` is hard delete** | Violates project's "no hard deletes" convention |
| 5 | **No `StripeProvider` instance management** — instantiated per-call in `getProvider()` | New Stripe client per request, no singleton reuse |

#### P1 — Missing Stripe integration behavior (4 items)

| # | Issue | Impact |
|---|-------|--------|
| 6 | **No `POST payments/create-intent` integration in ContractInvoicesList** | After creating payment intent, should redirect to Stripe Checkout URL |
| 7 | **`PaymentsModule` and `FinanceModule` are not connected** | Two parallel payment flows exist; `FinanceController` doesn't delegate to `PaymentsService` |
| 8 | **`updatePaymentStatus` doesn't trigger contract activation** | When invoice PAID, should check if contract can become ACTIVE |
| 9 | **The old `registerPayment` in `FinanceService` marks everything SUCCESS** | Bypasses any real gateway; legacy path should be restricted or removed |

#### P2 — Polish & hardening (4 items)

| # | Issue | Impact |
|---|-------|--------|
| 10 | **`PAYMENT_ENCRYPTION_KEY` hardcoded fallback** `'hassad-platform-secret-key-32chars'` | Security risk if env var is missing |
| 11 | **No admin UI to configure payment gateways** | Admin can't set Stripe keys through the app |
| 12 | **No refund support** in `PaymentProvider` interface | Can't issue refunds programmatically |
| 13 | **No idempotency keys** for `create-intent` | Retried payments could create duplicate records |

---

## Implementation Plan

### Phase 1: Fix the disconnect — route payments through Stripe (3 files)

#### Task 1.1 — Add auth guard to `POST payments/create-intent`

**File**: `apps/api/src/modules/payments/controllers/payments.controller.ts`

```typescript
@Post('create-intent')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('invoices.pay_public')
async createIntent(@CurrentUser() user: any, @Body() dto: ...) {
  return this.paymentsService.createPayment({ ...dto, userId: user.id });
}
```

This endpoint already exists for the Stripe path. Currently unguarded, used only by admin. Adding `invoices.pay_public` makes it accessible to CLIENTS too — same permission we already seeded.

#### Task 1.2 — Update `ContractInvoicesList` to call the Stripe endpoint

**File**: `apps/web/components/shared/ContractInvoicesList.tsx`

Replace `usePayInvoicePublicMutation` with a new `useCreatePaymentIntentMutation`:

```typescript
import { useCreatePaymentIntentMutation } from "@/features/finance/financeApi";

async function handlePay(invoice: InvoiceSummary) {
  setPayingId(invoice.id);
  try {
    const result = await createPaymentIntent({
      invoiceId: invoice.id,
      gatewayName: "stripe",        // will be configurable later
      amount: invoice.amount,
    }).unwrap();

    if (result.clientSecret) {
      window.location.href = result.clientSecret;  // redirect to Stripe Checkout
    }
  } catch (err) {
    toast.error("فشل إنشاء جلسة الدفع");
  }
}
```

#### Task 1.3 — Add `createPaymentIntent` query to frontend API slice

**File**: `apps/web/features/finance/financeApi.ts`

```typescript
export interface CreatePaymentIntentInput {
  invoiceId: string;
  gatewayName: string;
  amount: number;
  currency?: string;
}

createPaymentIntent: builder.mutation<
  { clientSecret: string; id: string },
  CreatePaymentIntentInput
>({
  query: (body) => ({ url: "/payments/create-intent", method: "POST", body }),
  invalidatesTags: ["Payment", "Invoice"],
}),
```

Export: `useCreatePaymentIntentMutation`

### Phase 2: Make `StripeProvider` production-grade (1 file)

#### Task 2.1 — Singleton Stripe client + idempotency

**File**: `apps/api/src/modules/payments/providers/stripe.provider.ts`

```typescript
export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(private config: { secretKey: string; webhookSecret: string }) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-03-31.basil' as any,  // update to latest stable
      maxNetworkRetries: 3,
    });
  }

  async createPaymentIntent(params: {
    invoiceId: string; amount: number; currency: string; clientId: string;
    successUrl: string; cancelUrl: string; metadata?: any;
  }): Promise<PaymentIntentResponse> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: `فاتورة ${params.invoiceId}` },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        invoiceId: params.invoiceId,
        clientId: params.clientId,
        ...params.metadata,
      },
      // No idempotencyKey for Checkout Sessions (Stripe doesn't support it);
      // we use internal idempotency via DB uniqueness
    });

    return {
      providerPaymentId: session.id,
      clientSecret: session.url ?? '',
      status: PaymentStatus.PENDING,
    };
  }
}
```

Add `successUrl` and `cancelUrl` to `PaymentProvider` interface and `createPayment` in PaymentsService.

### Phase 3: Connect webhooks → invoice + contract state (2 files)

#### Task 3.1 — Auto-activate contract after sign + payment

**File**: `apps/api/src/modules/payments/services/payments.service.ts`

In `updatePaymentStatus`, after marking invoice PAID:

```typescript
if (status === PaymentStatus.SUCCESS && payment.invoice.contractId) {
  const contract = await tx.contract.findUnique({
    where: { id: payment.invoice.contractId },
    select: { status: true },
  });

  if (contract?.status === 'SIGNED') {
    await tx.contract.update({
      where: { id: payment.invoice.contractId },
      data: { status: 'ACTIVE' },
    });
  }
}
```

#### Task 3.2 — Ensure `processWebhook` receives raw body correctly

**File**: `apps/api/src/modules/payments/controllers/webhooks.controller.ts`

The `rawBody: true` in `main.ts` already makes `req.rawBody` available. Current code uses it. Verify:

```typescript
const payload = req.rawBody || req.body;
```

This is correct. The `@Body()` decorator reads `req.body` (JSON-parsed), but for signature verification we need the raw buffer. `req.rawBody` from `rawBody: true` provides this.

### Phase 4: Security hardening (2 files)

#### Task 4.1 — Remove hardcoded encryption key fallback

**File**: `apps/api/src/modules/payments/services/payments.service.ts`

```typescript
private readonly ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY;
```

If missing, throw at startup via `OnModuleInit`:

```typescript
onModuleInit() {
  if (!process.env.PAYMENT_ENCRYPTION_KEY) {
    throw new Error('PAYMENT_ENCRYPTION_KEY environment variable is required');
  }
}
```

#### Task 4.2 — Soft-delete for BankAccount

**File**: `apps/api/src/modules/payments/services/payments.service.ts`

Replace `prisma.bankAccount.delete` with:

```typescript
async deleteBankAccount(id: string) {
  return this.prisma.bankAccount.update({
    where: { id },
    data: { isActive: false },
  });
}
```

### Phase 5: Admin UI for gateway config (3 files — NEW)

#### Task 5.1 — Admin payment gateways page

**File**: `apps/web/app/(dashboard)/dashboard/admin/payments/page.tsx` (NEW)

- List of gateways (stripe, bank_transfer) with active/inactive toggle
- Stripe config form: secret key (masked), webhook secret (masked), publishable key
- Bank account management: IBAN, bank name, SWIFT, instructions
- Uses `useGetPaymentGatewaysQuery`, `useUpdatePaymentGatewayMutation`, `useGetBankAccountsQuery`, etc.

#### Task 5.2 — Admin route & permission

Add `payments.read` permission to ADMIN role in seed (already has all). Add `payments.admin` permission if needed. Wire route in sidebar.

#### Task 5.3 — Stripe publishable key to client

**File**: `apps/api/src/modules/payments/controllers/payments.controller.ts`

```typescript
@Get('public-config')
@RequirePermissions('invoices.pay_public')
async getPublicConfig() {
  const gateway = await this.prisma.paymentGateway.findUnique({
    where: { name: 'stripe' },
  });
  const config = this.decrypt(/* ... */);
  return { publishableKey: config.publishableKey };
}
```

### Phase 6: Frontend flow — Stripe Checkout redirect (2 files)

#### Task 6.1 — Update `ContractInvoicesList` with full flow

```typescript
// After successful createPaymentIntent:
if (result.clientSecret) {
  // Store intent info in sessionStorage for return verification
  sessionStorage.setItem('pending_payment', JSON.stringify({
    paymentId: result.id,
    invoiceId: invoice.id,
  }));
  window.location.href = result.clientSecret;
}
```

#### Task 6.2 — Add return URL handler

**File**: `apps/web/app/(portal)/portal/contracts/[token]/page.tsx`

Check query params for `?success=true` or `?canceled=true` on mount, show appropriate toast.

---

## Complete Payment Flow (After All Phases)

### Happy Path

```
1. Client views contract detail page
   → sees services list + unpaid invoice with payment method selector (BANK_TRANSFER/CARD)

2. Client selects "بطاقة" (CARD) method, clicks "ادفع"
   → frontend calls POST /v1/payments/create-intent
     { invoiceId, gatewayName: "stripe", amount, currency: "SAR" }

3. Backend PaymentsService.createPayment:
   a) loads gateway config from DB (Stripe secret key, decrypted)
   b) StripeProvider.createPaymentIntent() → creates Stripe Checkout Session
   c) creates Payment row (status: PENDING, providerPaymentId: cs_xxx)
   d) creates PaymentEvent (type: CREATED)
   e) returns { id, clientSecret: "https://checkout.stripe.com/c/..." }

4. Frontend receives clientSecret (Checkout URL)
   → saves payment context to sessionStorage
   → redirects to Stripe Checkout (window.location.href)

5. Client pays on Stripe's hosted page
   → enters card details on Stripe's secure page
   → Stripe processes payment

6a. Payment SUCCESS:
   → Stripe redirects to success_url: /portal/contracts/[token]?success=true
   → Frontend sees query param, shows toast: "تم الدفع بنجاح"
   → In parallel, Stripe sends webhook to POST /v1/webhooks/stripe

6b. Payment FAILED/CANCELED:
   → Stripe redirects to cancel_url: /portal/contracts/[token]?canceled=true
   → Frontend shows toast: "تم إلغاء الدفع"
   → Webhook may also arrive with payment_intent.payment_failed

7. Backend WebhooksController receives Stripe webhook:
   a) reads rawBody from request (req.rawBody)
   b) StripeProvider.verifyWebhook() → constructEvent(rawBody, sig, webhookSecret)
   c) StripeProvider.handleWebhookEvent() → extracts status + metadata
   d) PaymentsService.updatePaymentStatus():
      - updates Payment.status → SUCCESS
      - creates PaymentEvent (type: SUCCESS)
      - recalculates invoice totalPaid
      - if fully paid: Invoice.status → PAID, sets paidAt
      - if contract is SIGNED: Contract.status → ACTIVE
   e) sends notifications

8. Client returns to contract page (either via Stripe redirect or manual refresh)
   → page reloads, RTK Query re-fetches contract data
   → sees invoice status = PAID
   → name + email fields UNLOCKED
   → signs contract

9. Contract is SIGNED + Invoice is PAID
   → webhook handler auto-activates contract (ACTIVE)
   OR
   → if no webhook yet, client signs, but contract stays SIGNED until webhook arrives
```

### Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Client closes browser during Stripe payment | Webhook still fires; invoice/contract updated server-side |
| Webhook arrives late (after client signs) | Contract auto-activates when webhook arrives (check if SIGNED → ACTIVE) |
| Duplicate webhook | `updatePaymentStatus` checks `if (payment.status === status) return;` — idempotent |
| Payment partially covers invoice | Status → PARTIAL; sign form remains disabled |
| Bank transfer method selected | `BankTransferProvider` creates manual payment (PENDING); no redirect; admin marks paid later |
| Stripe gateway not configured | `getProvider()` throws BadRequestException "gateway not available" |
| ENCRYPTION_KEY not set | App fails to start with clear error message |
| Multiple invoices on one contract | ALL must be PAID before sign unlocks |

---

## Summary

| Phase | Files Changed | Key Deliverable |
|-------|--------------|-----------------|
| 1 | 3 | `create-intent` auth guarded + frontend calls Stripe path |
| 2 | 1 | Singleton Stripe client, success/cancel URLs |
| 3 | 2 | Webhook → auto-activate contract |
| 4 | 1 | Hardcoded key removed, soft-delete for bank accounts |
| 5 | 3 (new) | Admin UI for gateway config |
| 6 | 2 | Full redirect flow with return URL handling |
| **Total** | **~10 changed + 3 new** | Production-ready Stripe integration |

### Stripe Setup Required

1. Create Stripe account → get API keys (dashboard.stripe.com)
2. Set env vars in `apps/api/.env`:
   ```
   PAYMENT_ENCRYPTION_KEY=<random 32-char string>
   ```
3. Run seed (or manually via admin UI):
   ```
   POST /v1/payments/gateways/stripe
   { "secretKey": "sk_test_...", "webhookSecret": "whsec_...", "publishableKey": "pk_test_..." }
   ```
4. Set up Stripe webhook endpoint: `https://yourdomain.com/v1/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.payment_failed`
5. Set `WEB_URL` env var for success/cancel redirect URLs

---

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| Phase 1 — Fix disconnect | ✅ Done | 2026-05-10 |
| Phase 2 — StripeProvider hardening | ✅ Done | 2026-05-10 |
| Phase 3 — Webhook → contract state | ✅ Done | 2026-05-10 |

### Phase 3 Details
- ✅ Task 3.1 — `updatePaymentStatus` now auto-activates contract: after invoice PAID, checks linked contract status === SIGNED → auto-transitions to ACTIVE + sends notification
- ✅ Task 3.2 — `processWebhook` fixed: handles raw Buffer payload properly (parses JSON for eventType logging, passes raw Buffer to `verifyWebhook` for signature verification). `WebhooksController` uses `req.rawBody` and falls back to `req.body` as stringified backup
- ✅ Build: `nest build` ✓
| Phase 4 — Security hardening | ✅ Done | 2026-05-10 |

### Phase 4 Details
- ✅ Task 4.1 — Hardcoded encryption key fallback removed. `PAYMENT_ENCRYPTION_KEY` is now mandatory (throws at construct time if missing). Added `OnModuleInit` warning if key < 32 chars. Moved from static field to constructor-validated instance variable
- ✅ Task 4.2 — `deleteBankAccount` now soft-deletes (sets `isActive: false`) instead of hard `prisma.bankAccount.delete`. `getBankAccounts` filters `where: { isActive: true }`
- ✅ Build: `nest build` ✓
| Phase 5 — Admin UI | ✅ Done | 2026-05-10 |

### Phase 5 Details
- ✅ Task 5.1 — Admin payments page already existed at `/dashboard/admin/payments/page.tsx` with full Stripe gateway config (secret key, webhook secret, publishable key) + bank account CRUD
- ✅ Task 5.2 — Sidebar link already existed under "إعدادات النظام" → "بوابات الدفع"
- ✅ Task 5.3 — `GET payments/public-config` endpoint added (auth-guarded with `invoices.pay_public`). Returns decrypted Stripe publishable key for client-side use, with `isActive: false` when gateway not configured
- ✅ Build: `nest build` ✓
| Phase 6 — Frontend redirect flow | ⬜ Pending | — |

### Phase 1 Details
- ✅ Task 1.1 — `POST payments/create-intent` now has `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions('invoices.pay_public')`
- ✅ Task 1.2 — `ContractInvoicesList` routes card methods (CARD/MADA/VISA_MC/APPLE_PAY) through `useCreatePaymentIntentMutation` → Stripe Checkout redirect; bank_transfer/cash through `usePayInvoicePublicMutation` for manual processing
- ✅ Task 1.3 — Existing `createPaymentIntent` endpoint already had `useCreatePaymentIntentMutation` hook; updated with `invalidatesTags: ["Payment", "Invoice"]`
- ✅ Build: `nest build` ✓, `next build` ✓
