# Contract Periods & Billing — Feature Plan

> **Tracking doc.** Read this before starting any phase. Update the checkbox `[ ]` → `[x]`
> when a task is done, and append a line to **Status log** at the bottom each time a
> phase is completed or a new phase is started. Branch: `feat/contract-periods-billing`.

---

## 1. Problem

Today a signed contract creates **one endless `Project`** (assigned to a PM) with a
flat, ever-growing list of tasks/deliverables. For a 6-month retainer this is one giant
blob on the client dashboard — not scalable, not reviewable, not billable per month.

Billing today is a **single "sign" invoice**. There is no concept of a down payment,
recurring monthly invoices, payment schedule, reminders, or suspension for non-payment.

## 2. Goals

1. **Slice a long contract into reviewable, reportable, billable monthly units**
   (`ProjectPeriod`) on top of the existing `Project` (Option 1, with a path to an
   `Engagement` parent later — Option 3).
2. **Split `totalValue` into a down payment (activation gate) + recurring monthly
   invoices** via a payment-plan/schedule (Option B1).
3. **Remind → suspend** engine: reminders at due −5 / −3 / 0 days; suspend the project
   on overdue until paid.

## 3. Locked decisions

| # | Decision |
|---|----------|
| 1 | End-of-month clamping **keeps the original day**: start 31/01 → 28/29 Feb (last day) → 31/03 (returns to 31). Never drift permanently. |
| 2 | Indefinite retainers supported (nullable `endDate` → rolling periods). |
| 3 | Zero down payment allowed → activate immediately on sign. |
| 4 | Suspension UX: project shows **paused with the reason**; PM keeps **read access**, sees it's on hold, and **decides himself** whether to stop current tasks. We block new task creation + approvals only. |
| 5 | Legacy contracts marked `FIXED_PROJECT`, left untouched (all new fields nullable). |
| 6 | Company timezone default `Asia/Riyadh`, **admin-only** to change (stored in `CompanySetting`). |
| 7 | Auto-cancel unpaid **down payment** after a grace period (default **14 days**, admin-configurable). |
| 8 | Period invoice issued at **period close** (arrears). No client acceptance gate before billing. |

## 4. Architecture summary (Option 1 + B1)

- **Commercial layer** (`Contract`): owns `ContractType` (already exists) + a
  `contract_payment_plans` schedule. Sales chooses `MONTHLY_RETAINER` vs
  `FIXED_PROJECT` and defines the plan (down payment + recurring + optional milestones).
- **Delivery layer** (`Project`): one project per contract (as today). For
  `MONTHLY_RETAINER`, the project owns many `project_periods` (the months).
- **Billing layer** (`Invoice`): generated from plan rows; linked to both the contract
  (existing `contractId`) and the period (new `periodId`). `Payment` unchanged.
- **Engine**: a daily cron issues period invoices at close, sends reminders, suspends on
  overdue, resumes on payment. All transitions are server-side state machines writing
  history rows, inside `prisma.$transaction()`. No hard deletes.

## 5. Data model (new + edited)

### New tables

```
contract_payment_plans
  id, contract_id, label, sequence (int),
  trigger_type   enum PaymentPlanTriggerType (ON_SIGN | PERIOD_END | MILESTONE | MANUAL)
  amount_type    enum PaymentAmountType (PERCENT | FIXED)
  amount_value   float                 -- percent (0-100) when PERCENT, SAR when FIXED
  is_recurring   bool default false     -- true for the monthly line
  due_offset_days int?                  -- days after trigger for due_date (default 0)
  is_active      bool default true
  created_at, updated_at

project_periods
  id, project_id, period_number (int), start_date, end_date,
  status          enum ProjectPeriodStatus (UPCOMING | ACTIVE | CLOSED | SUSPENDED)
  summary         text?
  report_file_path text?
  completion_percentage float default 0
  invoice_id      string? unique  -- FK invoices (the period's invoice)
  closed_at       datetime?
  suspended_at    datetime?
  resumed_at      datetime?
  created_at, updated_at

project_period_history            -- one row per period status transition (RULE 2)
  id, period_id, from_status, to_status, changed_by, reason?, changed_at

contract_status_history           -- one row per contract status transition (none exists today)
  id, contract_id, from_status, to_status, changed_by, reason?, changed_at
```

### Edits to existing tables (all additive / nullable)

- `contracts`: add `down_payment_type` (`PaymentAmountType`), `down_payment_value` float,
  `number_of_months` int? (for bounded retainers). `ContractType` already covers the
  fixed/monthly split. Keep `total_value` / `monthly_value` as source numbers.
- `projects`: `ProjectStatus` enum **add `PENDING_ACTIVATION`** (`ON_HOLD` already
  exists).
- `contracts`: `ContractStatus` enum **add `ON_HOLD` + `COMPLETED`**.
- `invoices`: add `period_id` (nullable FK → `project_periods`),
  `payment_plan_id` (nullable FK → `contract_payment_plans`),
  `reminder_flags` int default 0 (bitmask: bit0=−5d, bit1=−3d, bit2=0d sent),
  `triggered_suspension` bool default false.
- `tasks`: add `period_id` nullable FK.
- `deliverables`: add `period_id` nullable FK.
- `project_files`: add `period_id` nullable FK.
- `campaigns`: add `period_id` nullable FK.
- `campaign_kpi_snapshots`: add `period_id` nullable FK.

### CompanySetting keys (generic key→JSON store, admin-only)

- `timezone` → `"Asia/Riyadh"`
- `down_payment_grace_days` → `14`
- `reminder_offset_days` → `[5, 3, 0]`
- `suspend_on_overdue` → `true`

## 6. State machines

**Contract** (`ContractStatus`): `DRAFT → SENT → SIGNED` → (down payment PAID, or 0)
`→ ACTIVE` → (overdue) `→ ON_HOLD` → (paid) `→ ACTIVE` → (term end) `→ COMPLETED` / `→ CANCELLED`.
Unpaid down payment past grace days `→ CANCELLED`.

**Project** (`ProjectStatus`): `PENDING_ACTIVATION` → (down payment PAID) `→ ACTIVE`
→ (period invoice overdue) `→ ON_HOLD` → (paid) `→ ACTIVE` → (all periods closed)
`→ COMPLETED`.

**ProjectPeriod** (`ProjectPeriodStatus`): `UPCOMING → ACTIVE` (start date reached)
`→ CLOSED` (end date reached / PM closes early) → invoice issued, next period opens.
`ACTIVE → SUSPENDED` (overdue) `→ ACTIVE/CLOSED` (paid). PM may extend `end_date` or
create an extra period manually.

## 7. Reminder & suspend engine (daily cron, ~03:00 company tz)

For each unpaid invoice with a `due_date` (and `reminder_flags` not yet set for that step):

- `due_date − 5d` → send reminder #1, set bit0.
- `due_date − 3d` → send reminder #2, set bit1.
- `due_date` (0d), unpaid → send reminder #3, set bit2, **suspend**:
  if project is `ACTIVE`, set project `ON_HOLD` + period `SUSPENDED`, write
  `project_period_history` + `contract_status_history`, notify PM (with reason) + client.
- Down-payment invoice uses the same engine; if unpaid past `down_payment_grace_days`
  → contract `CANCELLED`, project stays `PENDING_ACTIVATION`/archived.
- **Resume**: on payment success (`Payment.status = SUCCESS` on the overdue invoice),
  flip project `ACTIVE`, period back to `ACTIVE`/`CLOSED`, write history, notify.

Dedup via `reminder_flags` bitmask — never double-send even if cron runs twice.

## 8. Execution phases

> Each phase: schema edit → `prisma migrate dev` + commit migration →
> `prisma generate` → service/DTO/controller → **update seed for new tables** →
> `npx tsc --noEmit -p tsconfig.json` clean → manual inspection. **Never `db push`.**

### Phase 0 — Prep & seed sync

- [ ] Confirm this doc is reviewed & approved.
- [ ] Audit current seed vs current schema (baseline: `tsc --noEmit` clean — confirmed).
      Documented gaps (not seeded today, relevant to this feature):
      `company_settings` (timezone/grace/reminders), `currency_settings` (SAR default),
      `bank_accounts`, `payment_gateways`, `notifications`/`notification_events`,
      `conversations`/`messages`, `requests`/`request_service`/`request_status_history`.
- [ ] Add supporting **reference** seed data used by the feature:
      `CompanySetting` timezone=`Asia/Riyadh`, `down_payment_grace_days=14`,
      `reminder_offset_days=[5,3,0]`, `suspend_on_overdue=true`; `CurrencySetting` SAR
      default; one `BankAccount`; one `PaymentGateway` (MANUAL).
- [ ] Verify seed typechecks & (if DB available) `npx prisma db seed` runs clean.

### Phase 1 — Payment plan + down-payment activation gate

Schema:
- [ ] Add enums `PaymentPlanTriggerType`, `PaymentAmountType`.
- [ ] Add `contract_payment_plans` table.
- [ ] Add `contract_status_history` table.
- [ ] `contracts`: add `down_payment_type`, `down_payment_value`, `number_of_months`.
- [ ] `ContractStatus`: add `ON_HOLD`, `COMPLETED`.
- [ ] `ProjectStatus`: add `PENDING_ACTIVATION`.
- [ ] `migrate dev` + commit migration + `prisma generate`.

API (`contracts` + `finance`):
- [ ] DTO + endpoints for Sales to define/manage a contract's payment plan
      (`@RequirePermissions('contracts.update')`): create/plan rows, list, update, remove.
- [ ] On `POST /contracts/:id/sign` (and `signByToken`): create the **down-payment invoice**
      from the `ON_SIGN` plan row (amount resolved PERCENT→`total_value*pct` /
      FIXED→value). Project created as `PENDING_ACTIVATION`.
- [ ] Activation gate: on `Payment.status = SUCCESS` for the down-payment invoice →
      contract `SIGNED→ACTIVE`, project `PENDING_ACTIVATION→ACTIVE`, write
      `contract_status_history`, emit `CONTRACT_ACTIVATED` notification.
- [ ] Zero-down-payment path: no `ON_SIGN` row / `amount_value=0` → activate on sign.
- [ ] Legacy contracts: backfill `billingType` is N/A (uses `ContractType`); leave existing
      invoice/project untouched. Add a nullable-tolerant migration (no data rewrite).
- [ ] Seed: add sample contract with a payment plan (down payment + recurring) + the
      down-payment invoice in `PENDING`/`DUE` for the `client@hassad.com` account.
- [ ] `tsc --noEmit` clean; manual inspect.

### Phase 2 — Periods lifecycle

Schema:
- [ ] Add enum `ProjectPeriodStatus`.
- [ ] Add `project_periods` + `project_period_history` tables.
- [ ] `project_periods.invoice_id` unique FK → `invoices`.
- [ ] Add `period_id` nullable FK on: `tasks`, `deliverables`, `project_files`,
      `campaigns`, `campaign_kpi_snapshots`.
- [ ] `migrate dev` + commit migration + `prisma generate`.

API (`projects`):
- [ ] Period generation service: bounded (endDate set → generate all) vs rolling
      (null endDate → current + next; roll forward on close). Anniversary-based dates
      with end-of-month clamping that **returns to the original day** (31→28/29→31).
- [ ] `ProjectPeriod` transitions (server-side): `UPCOMING→ACTIVE` (start date),
      `ACTIVE→CLOSED` (end date / PM close-early), each writes `project_period_history`.
- [ ] Endpoints: list periods for a project, get period detail (aggregates
      tasks/deliverables/files/campaigns/KPIs for the month), PM close-early, PM extend,
      PM create-extra-period, PM save summary + upload report file.
- [ ] Link new tasks/deliverables/files to the **active period** automatically.
- [ ] Seed: generate periods for the sample monthly contract; attach a few tasks to a
      period; one period `ACTIVE`, one `CLOSED` with a summary + report file.
- [ ] Portal: client project view shows a **timeline of periods** instead of a flat list.
- [ ] `tsc --noEmit` clean; manual inspect.

### Phase 3 — Recurring invoicing + reminder/suspend engine

Schema:
- [ ] `invoices`: add `period_id`, `payment_plan_id`, `reminder_flags` (default 0),
      `triggered_suspension` (default false). `migrate dev` + commit + `generate`.

API (`finance` + cron):
- [ ] On period `CLOSED`: issue the period invoice from the recurring (`PERIOD_END`,
      `is_recurring`) plan row; `issue_date = period.end_date`,
      `due_date = next_period.start_date`; set `invoice.period_id`, `payment_plan_id`;
      send invoice; emit `INVOICE_ISSUED` + `PERIOD_CLOSED` notifications. One
      transaction; next period `UPCOMING→ACTIVE`.
- [ ] Daily cron (company tz): reminder pass (−5/−3/0 with bitmask dedup) + suspend pass
      (project `ON_HOLD`, period `SUSPENDED`, reason, notify PM + client).
- [ ] Resume hook on `Payment.status = SUCCESS` for an overdue invoice: project
      `ON_HOLD→ACTIVE`, period `SUSPENDED→ACTIVE|CLOSED`, write history, notify.
- [ ] Down-payment auto-cancel: unpaid past `down_payment_grace_days` → contract
      `CANCELLED`, notify admin + sales + client.
- [ ] Permissions: reminders/suspend are internal; resume triggered by payment webhook
      (reuse Moyasar webhook path) or manual `mark-paid` (`finance.update`).
- [ ] Seed: one `LATE`/overdue period invoice + a suspended project (with reason) to demo
      the engine; one `PAID` period invoice.
- [ ] `tsc --noEmit` clean; manual inspect; dry-run cron once to confirm.

### Phase 4 — Aggregation, reporting, polish

- [ ] Period dashboard endpoint: aggregate tasks (count by status), deliverables, files,
      campaigns + KPIs (for marketing clients), satisfaction rating, into one payload;
      include PM summary + report file.
- [ ] Accountant view: scheduled vs issued vs paid per contract; overdue/suspended list.
- [ ] Client portal monthly report view (read-only summary + report download).
- [ ] Admin settings UI: timezone, grace days, reminder offsets (admin-only).
- [ ] Notifications for all new events wired to existing notification engine.
- [ ] Seed: add a fully-populated period with KPIs + rating + report for demo.
- [ ] `turbo build` green end-to-end; final manual walkthrough.

## 9. Conventions (do not violate)

- `prisma migrate dev` only — **never `db push`**. Commit every migration SQL.
- No hard deletes — soft flags only (`is_active`/`is_archived`).
- State machines server-side; invalid transitions → 400.
- Every state change writes its history row (`contract_status_history`,
  `project_period_history`, existing `task_status_history`, `client_history_log`).
- Multi-table ops in `prisma.$transaction()`.
- Notifications written **after** the core tx commits; a notification failure never
  rolls back business data. Every business event → one `notification_events` + one
  `notifications` row.
- Match existing lenient TS config (`strict: false`, `strictNullChecks: false`).
- No test suite — verify via `tsc --noEmit` + `turbo build` + manual inspection.
- Seed stays in sync with schema at the end of every phase (Phase 0 baseline confirmed).

## 10. Status log

- 2026-06-18 — Branch `feat/contract-periods-billing` created; tracking doc written;
  current seed audited (`tsc --noEmit` clean vs generated client). Awaiting approval to
  start **Phase 0**.