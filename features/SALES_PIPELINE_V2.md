# Plan: Sales Pipeline Feature Implementation (ALIGNED WITH V2 SYSTEM)

## TL;DR

Implement Sales Pipeline UI and features **WITHOUT modifying database enums or workflow logic**.
Use existing `PipelineStage` (V2 schema) as the single source of truth.
SALES_PIPELINE.md acts as a **presentation layer mapping only**.

---

# 🚨 SOURCE OF TRUTH

The following are FINAL and MUST NOT be changed:

* Database schema (Prisma)
* `PipelineStage` enum in DB
* API workflow logic (stage transitions)
* Existing guards and validations

---

# ✅ ACTUAL PIPELINE (FROM DB — FINAL)

```ts
export enum PipelineStage {
  NEW,
  INTRO_SENT,
  CALL_ATTEMPT,
  MEETING_SCHEDULED,
  MEETING_DONE,
  PROPOSAL_SENT,
  FOLLOW_UP,
  APPROVED,
  CONTRACT_SIGNED
}
```

---

# 🎨 UI PIPELINE (SALES VIEW ONLY)

This mapping is for UI/UX purposes ONLY.

```ts
export const PIPELINE_UI_MAP = {
  NEW: "New Lead",
  INTRO_SENT: "Contacted",
  CALL_ATTEMPT: "Follow-up Attempt",
  MEETING_SCHEDULED: "Meeting Scheduled",
  MEETING_DONE: "Meeting Completed",
  PROPOSAL_SENT: "Proposal Sent",
  FOLLOW_UP: "Negotiation / Follow-up",
  APPROVED: "Approved",
  CONTRACT_SIGNED: "Won (Contract Signed)"
}
```

❗ This mapping:

* DOES NOT change DB values
* DOES NOT affect API logic
* Used only in frontend display

---

# 🧠 DESIGN PRINCIPLE

| Layer | Responsibility         |
| ----- | ---------------------- |
| DB    | Truth (immutable)      |
| API   | Business rules         |
| UI    | Labels & visualization |

---

# 🧩 FEATURE IMPLEMENTATION

## Phase A — Safe Enhancements (NO DB CHANGES)

### A1. Add optional fields to Client

```prisma
requirements Json?
activityLog Json?
```

✔️ Allowed (non-breaking)

---

## Phase B — Backend (SAFE ONLY)

### B1. Requirements Endpoint

```http
PATCH /clients/:id/requirements
```

* Stores structured requirements JSON
* Adds entry to `client_history_log`
* Optionally appends to `activityLog`

---

### B2. Stage Transition Guard

```ts
IF stage === PROPOSAL_SENT
AND requirements IS NULL
→ THROW ERROR
```

✔️ This matches existing pipeline (no new stage added)

---

### B3. Activity Logging

On every stage change:

```json
{
  "from": "CALL_ATTEMPT",
  "to": "MEETING_SCHEDULED",
  "userId": "...",
  "timestamp": "..."
}
```

Stored in:

* `client_history_log` (primary)
* `activityLog` (cache)

---

### B4. Auto Activation

```ts
IF stage === CONTRACT_SIGNED
→ client.status = ACTIVE
```

✔️ Already consistent with V2

---

## Phase C — Frontend

### C1. Kanban Board

* 9 columns (based on DB enum)
* Labels from `PIPELINE_UI_MAP`
* Drag & Drop updates real stage

---

### C2. Client Detail Page

Includes:

* Timeline (from `client_history_log`)
* Requirements form
* Stage selector

---

### C3. Requirements Form

Editable ONLY when:

```ts
stage === MEETING_DONE || CALL_ATTEMPT
```

❗ NOT a new stage — just condition

---

# 🚫 STRICT RULES

DO NOT:

* ❌ Add new PipelineStage values
* ❌ Rename existing enums
* ❌ Modify DB enum order
* ❌ Introduce REQUIREMENTS_GATHERING stage
* ❌ Introduce NEGOTIATION stage

---

# 🧪 VALIDATION

## Must pass:

1. DB enum = unchanged
2. API transitions = unchanged
3. UI labels = mapped only
4. No new enum values

---

# 🎯 RESULT

* System remains stable
* No schema conflicts
* No API breakage
* UI achieves desired pipeline experience

---

# 🔚 CONCLUSION

SALES_PIPELINE.md is now:

✔️ UI/UX enhancement layer
✔️ Fully aligned with DB V2
✔️ Safe for production

NOT:

❌ A source for changing backend logic
❌ A source for modifying enums
