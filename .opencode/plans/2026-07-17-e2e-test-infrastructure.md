# E2E Integration Test Infrastructure Implementation Plan

**Goal:** Build a maintainable, scenario-driven E2E test suite for the Hassad Platform backend that covers all business workflows with clear step-by-step logging output.

**Architecture:** Vitest + Supertest test the NestJS app in-process via `Test.createTestingModule`. Each domain has reusable step helper functions. Scenarios compose steps and output a running log. A separate test database (`hassad_e2e`) is auto-reset before every run.

**Tech Stack:** Vitest, Supertest, Prisma 6, NestJS Testing

---

## Phase 0: Infrastructure Setup (Tasks 1-7)
Install deps, create config, global-setup, helpers (setup, scenario, prisma), smoke test

## Phase 1: Core Domain Scenarios (Tasks 8-14)
Auth, Lead, Proposal, Contract, Payment, Task, Project

## Phase 2: Secondary Domain Scenarios (Tasks 15-19)
Periods, Marketing, Dispute, Request, Portal

## Phase 3: Edge Cases + Integration (Tasks 20-22)
Permissions, Validation/404, Full lifecycle

## Phase 4: Polish (Tasks 23-24)
Shared setup helper, final verification

---

## Scenario Coverage Map

### Lead Pipeline (5 tests)
| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | Happy path through all 8 stages | Valid transitions |
| 2 | Invalid: NEW → APPROVED (skip stages) | Stage gate |
| 3 | Invalid: MEETING_DONE → NEW (back to first) | Backward guard |
| 4 | Pipeline history created per stage change | History tracking |
| 5 | Convert lead at CONTRACT_SIGNED → isActive=false | Conversion logic |

### Proposal (5 tests)
| 1 | Create → SENT | Creation |
| 2 | Approve via token → APPROVED | Token flow |
| 3 | Reject via token → REJECTED | Rejection |
| 4 | Revision loop: revise → resend → approve | Revision cycle |
| 5 | Invalid token → 404 | Token validation |

### Contract (7 tests)
| 1 | Create → SENT | Creation |
| 2 | Sign (no down payment) → ACTIVE immediately | Fast activation |
| 3 | Sign (with down payment) → PENDING_ACTIVATION + invoice | Payment gate |
| 4 | Cancel from SENT → CANCELLED | Cancellation |
| 5 | Sign already-signed contract → error | Idempotency |
| 6 | Version created on status change | Version history |
| 7 | Activate → project ACTIVE + client upgraded | Orchestration |

### Payment (6 tests)
| 1 | Down payment → PAID → contract + project activate | Activation chain |
| 2 | Partial payment → PARTIAL | Partial handling |
| 3 | Payment fails → FAILED, invoice stays DUE | Failure |
| 4 | Overdue → suspended → payment → resumed | Suspension+resume |
| 5 | No down payment → no invoice created | Conditional |
| 6 | PERIOD_END invoice for retainer | Period billing |

### Task (6 tests)
| 1 | Full cycle TODO → IN_PROGRESS → IN_REVIEW → DONE | Valid transitions |
| 2 | Revision loop: IN_REVIEW → REVISION → IN_PROGRESS → DONE | Revision cycle |
| 3 | Invalid: TODO → DONE → 400 | State guard |
| 4 | 100% DONE → project AWAITING_REVIEW | Auto-progress |
| 5 | Internal comment not visible to client | Visibility |
| 6 | File with DELIVERABLE purpose | File handling |

### Project (5 tests)
| 1 | ACTIVE → AWAITING_REVIEW → COMPLETED | Lifecycle |
| 2 | AWAITING_REVIEW → NEEDS_REVISION → ACTIVE | Revision |
| 3 | ACTIVE → ON_HOLD → ACTIVE | Hold+resume |
| 4 | ACTIVE → CANCELLED | Cancellation |
| 5 | PM auto-assigned on creation | Load balancing |

### Periods (4 tests)
| 1 | Auto-generated on activation | Period gen |
| 2 | PM closes → CLOSED + summary | Closure |
| 3 | Overdue → SUSPENDED → payment → ACTIVE | Suspend+resume |
| 4 | Rolling periods for retainers | Rolling gen |

### Marketing (8 tests)
| 1 | Strategy: DRAFT → SEND → approve → campaign | Full flow |
| 2 | Strategy: reject → REJECTED | Rejection |
| 3 | Strategy: revision → resend → approve | Revision |
| 4 | Unauthorized marketer → 403 | Permission |
| 5 | Campaign: ACTIVE → PAUSED → ACTIVE → COMPLETED | Campaign lifecycle |
| 6 | Campaign: ACTIVE → STOPPED | Stopped |
| 7 | KPI snapshot recorded | KPI tracking |
| 8 | Auto-task on marketing member added | Auto task |

### Dispute (5 tests)
| 1 | Open → admin approve → PM resolve → client close | Happy path |
| 2 | Admin reject → REJECTED | Rejection |
| 3 | Escalation: PENDING_CLIENT → ESCALATED → CLOSED | Escalation |
| 4 | PM reassignment as resolution | Resolution type |
| 5 | Unauthorized approve → 403 | Permission |

### Auth (5 tests)
| 1 | Valid login → tokens + cookies | Login |
| 2 | Wrong password → 401 | Failed login |
| 3 | 5 failed attempts → lockout | Rate limit |
| 4 | Token refresh → new tokens | Refresh |
| 5 | Logout → cookies cleared | Logout |

### Request (4 tests)
| 1 | Full flow through all 8 transitions | State machine |
| 2 | Cancel at any step → CANCELLED | Cancellation |
| 3 | Backward: PROPOSAL_SENT → PROPOSAL_IN_PROGRESS | Allowed rewind |
| 4 | Invalid transition → 400 | Guard |

### Portal (4 tests)
| 1 | Client login → dashboard | Login |
| 2 | View projects | Read |
| 3 | View contracts | Read |
| 4 | Open dispute from portal | Create |

### Edge Cases (5 tests)
| 1 | No auth → 401 | Auth guard |
| 2 | Insufficient permission → 403 | Permission guard |
| 3 | Invalid payload → 400 | Validation |
| 4 | Not found → 404 | NotFound |
| 5 | Duplicate operation (approve twice) | Idempotency |
