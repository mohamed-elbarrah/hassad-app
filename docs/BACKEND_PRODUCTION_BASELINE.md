# Backend Production Hardening Baseline

Recorded during Phase 0 execution on 2026-08-16. Requirements and completion criteria remain defined by `docs/BACKEND_PRODUCTION_CONTRACT_HARDENING_PLAN.md`.

## Verification Evidence

- The first development seed reproduced `P2002` on the unique `payment_gateways.name` field at `apps/api/prisma/seed.ts:305`.
- After changing the upsert selector to the unique gateway name, two consecutive `npx prisma db seed` runs passed.
- `npm run test:e2e --workspace=api -- notification-messages` passed with 1 file and 4 tests after the database reset and seed.
- The API error-contract test passed with 9 tests after the Phase 1 foundation changes.
- `npm run typecheck --workspace=api` passed after the Phase 1 foundation changes.
- `git diff --check` passed after the Phase 1 foundation changes.

## Baseline Counts

The initial active-source scan, excluding API tests and backup files, reported:

- Direct Nest exception throws: 336.
- Raw production `throw new Error(...)` statements: 19.
- Locale-dependent `toLocale*`/`Intl.NumberFormat`/`Intl.DateTimeFormat` usage in active API/shared TypeScript: 0.
- Raw notification creation outside `NotificationsService`: 0, matching the plan scan.
- Arabic literals: concentrated in `packages/shared/src/enums/*.ts`, `packages/shared/src/schemas/intake-form-v2.schema.ts`, and `packages/shared/src/schemas/marketing-strategy.schema.ts`, matching the plan scan.

The final Phase 17 report must rerun the same scans after all module waves and include before/after values plus intentionally deferred items.
