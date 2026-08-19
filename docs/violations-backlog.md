# Violations Backlog

| Date       | Portal | File                    | Layer          | Violation                                                                 | Reason Deferred                                                   | Status |
|------------|--------|-------------------------|----------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------|--------|
| 2026-08-18 | portal | apps/web/lib/i18n.ts    | Frontend/Logic | Shared action/activity presentation helpers accept backend human-readable message fields instead of codes only. | Shared by multiple portal pages; requires coordinated API/type/localization migration outside `/portal/projects`. | Open   |
| 2026-08-19 | sales  | apps/web/features/proposals/proposalsApi.ts; apps/web/features/contracts/contractsApi.ts | Frontend/Architecture | Create proposal/contract mutations use direct fetch and duplicate transport/envelope handling instead of the shared baseQuery. | Shared APIs have multiple consumers and require a coordinated transport migration beyond this pipeline dialog integration. | Open   |
