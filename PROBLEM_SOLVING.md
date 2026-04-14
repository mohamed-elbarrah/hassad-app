# PROBLEM_SOLVING.md — Hassad Debugging & Fix Protocol

> Read AGENT.md first. This file is the ONLY approved method for diagnosing
> and fixing bugs during Hassad platform development.
> Bypassing this process is not allowed — patches without root cause analysis
> create new bugs and waste more time than they save.

---

## The Golden Rule

> **Never fix symptoms. Fix causes.**

A "quick fix" that works without understanding why it works is a time bomb.
Every fix must follow the 4-phase process below — no shortcuts.

---

## The 4-Phase Fix Protocol

```
PHASE 1: REPRODUCE
     ↓
PHASE 2: ANALYZE (find root cause)
     ↓
PHASE 3: PROPOSE (list options, pick best)
     ↓
PHASE 4: FIX + VERIFY
```

---

## Phase 1 — Reproduce

Before touching any code, you must be able to reproduce the problem reliably.

**Checklist:**
- [ ] Can you reproduce it consistently? (not "sometimes")
- [ ] What is the exact input/action that triggers it?
- [ ] What is the expected behavior?
- [ ] What is the actual behavior?
- [ ] Does it happen in all environments or only one? (local / staging / prod)
- [ ] When did it start happening? (after which commit/deploy?)

**Output of this phase:**
A clear one-paragraph description:
> "When [action], the system [actual behavior] instead of [expected behavior].
> Reproducible by [exact steps]. Started after [commit/change]."

If you cannot reproduce it reliably — **do not proceed to fixing**. Investigate reproduction first.

---

## Phase 2 — Analyze (Root Cause)

Work backward from the symptom to find where it actually breaks.

### Investigation Tools by Layer

**Frontend issues:**
```
1. Browser DevTools → Console (errors, warnings)
2. Browser DevTools → Network (request payload, response, status code)
3. Redux DevTools → state before and after the action
4. React component props — is the data reaching the component correctly?
5. RTK Query → check cache state, request status, error object
```

**Backend issues:**
```
1. Nest.js logs (structured, with request ID)
2. Browser DevTools → Network (request payload, response, status code)
3. Redux DevTools → state before and after the action
4. React component props — is the data reaching the component correctly?
5. RTK Query → check cache state, request status, error object
```

**Backend issues:**
```
1. Nest.js logs (structured, with request ID)
2. Prisma query logs → enable with: log: ['query', 'error']
3. Database → run the raw query directly to isolate ORM issues
4. Check DTO validation — is the incoming data actually valid?
5. Check guard execution — is the role/auth check passing correctly?
```

**Database issues:**
```
1. EXPLAIN ANALYZE on slow queries
2. Check indexes — are the WHERE columns indexed?
3. Check for N+1 queries in Prisma (repeated similar queries in logs)
4. Check transaction isolation if data consistency issues
```

**Integration issues (payments, ad APIs):**
```
1. Check webhook logs — did the external service actually send the event?
2. Check the raw request/response payload (log it temporarily)
3. Verify environment variables are set correctly in the target environment
4. Test with the external provider's sandbox/test mode
```

### The 5 Root Cause Categories

Every bug in this system falls into one of these:

| # | Category | Examples |
|---|---|---|
| 1 | **Data problem** | Wrong data in DB, missing record, stale cache |
| 2 | **Logic problem** | Wrong condition, off-by-one, wrong role check |
| 3 | **Integration problem** | API contract mismatch, wrong field name, missing header |
| 4 | **State problem** | RTK Query cache stale, Redux state not reset, race condition |
| 5 | **Environment problem** | Wrong env var, missing migration, different Node version |

**Output of this phase:**
A definitive statement: "The root cause is [X] because [evidence]."
If you cannot state the root cause with confidence — keep investigating. Do not guess.

---

## Phase 3 — Propose Solutions

Once the root cause is known, list all possible fixes. Do not jump to the first one.

### Evaluation Criteria

For each proposed fix, assess:

| Criterion | Question |
|---|---|
| **Correctness** | Does it actually solve the root cause (not just the symptom)? |
| **Safety** | Could it break something else? What are the side effects? |
| **Scope** | Is it the smallest change that solves the problem? |
| **Reversibility** | Can it be undone easily if it causes new issues? |
| **Long-term** | Does it create technical debt or introduce a pattern we'd regret? |

### Decision Template

```
Root cause: [state it clearly]

Option A: [description]
  - Solves the cause: YES / NO
  - Risk: LOW / MEDIUM / HIGH
  - Side effects: [list them]

Option B: [description]
  - Solves the cause: YES / NO
  - Risk: LOW / MEDIUM / HIGH
  - Side effects: [list them]

CHOSEN: Option [X] because [reason]
```

**Output of this phase:**
A chosen option with written justification.

---

## Phase 4 — Fix + Verify

### Before writing code

- [ ] Identify exactly which files will be changed
- [ ] Identify if any DB migration is needed
- [ ] Identify if any other module/feature could be affected

### Writing the fix

- Keep the diff small and focused — fix only the root cause
- Do not "clean up" unrelated code in the same commit
- Add a comment if the fix is non-obvious explaining WHY it's done this way

### After writing code

- [ ] The original issue is resolved
- [ ] No new errors in console or logs
- [ ] Related features still work (regression check)
- [ ] If a DB migration was involved — test rollback
- [ ] If an API contract changed — frontend updated accordingly
- [ ] Write a test that would have caught this bug (if feasible)

### Commit message format

```
fix(module): short description of what was broken

Root cause: [one sentence]
Fix: [one sentence about what was changed]

Closes #[issue number if applicable]
```

Example:
```
fix(invoices): invoice status not updating after Moyasar webhook

Root cause: Webhook handler was not verifying the signature, causing
silent rejection before the status update logic ran.
Fix: Added HMAC signature verification before processing webhook payload.
```

---

## Anti-Patterns — What is Strictly Forbidden

### ❌ The Patch Without Understanding
```
// FORBIDDEN
// "I don't know why this breaks but adding this || [] fixes it"
const items = response.data.items || []
```
You must know WHY `items` was undefined. Fix the source, not the consequence.

---

### ❌ The Shotgun Fix
```
// FORBIDDEN — changing 3 things at once without knowing which one fixed it
// Changed: auth guard, token refresh logic, AND API base URL
// Now it works but we have no idea why
```
Change one thing at a time. Verify. Then move to the next.

---

### ❌ The Superstition Fix
```
// FORBIDDEN
// "Let me restart the server / clear cache / reinstall node_modules"
// without any diagnosis first
```
This is not debugging. If a restart fixes it, you must still find out why.

---

### ❌ The Copy-Paste Fix
```
// FORBIDDEN
// "Found this answer on Stack Overflow, pasting it in"
// without understanding what it does and whether it fits our context
```
Every line of code you write must be understood.

---

### ❌ The Silent Swallow
```typescript
// FORBIDDEN
try {
  await someOperation()
} catch (e) {
  // just ignore it for now
}
```
If you catch an error, handle it or re-throw it. Never silently swallow.

---

## Special Cases

### Performance Issues (slow queries, slow pages)

1. Measure first — get actual numbers (response time, query time)
2. Profile — find the bottleneck (Prisma query log, browser performance tab)
3. Verify the bottleneck — is it really the DB? Or the network? Or the render?
4. Fix specifically — add index, fix N+1, add pagination, add caching
5. Measure again — confirm improvement with numbers

Never "optimize" without a measured baseline. Never optimize code that isn't the bottleneck.

---

## Production Incidents

If something is broken in production:

1. **Assess impact** — how many users affected? Is data corrupted?
2. **Contain first** — if needed, roll back the deployment before fixing
3. **Then follow the 4-phase protocol** — do not push a hot patch without diagnosis
4. **Communicate** — document what happened, when, and what was done

---

## When You're Stuck

If you've been debugging for more than 30 minutes without progress:

1. Write down exactly what you know and what you've tried
2. Form a specific question: "I expected X but got Y, I've ruled out A and B"
3. Ask for help — bring your written analysis, not just "it doesn't work"

Rubber duck debugging: explain the problem out loud step by step. This forces clarity and often reveals the answer.
