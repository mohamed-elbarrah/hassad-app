# Client Dashboard Fix Plan

## Executive Summary

This plan addresses critical performance, security, and data freshness issues in the client portal dashboard. The audit identified **3 severity P0 issues** (rate limiting, file upload limits) and **7 severity P1 issues** (polling, page size limits, permission lookups, WebSocket underutilization, error handling). The plan prioritizes **minimal breaking changes** while maximizing impact.

---

## Phase 1: Critical Security Fixes (P0)

### 1.1 Add Rate Limiting to Auth Endpoints

**Location:** `apps/api/src/auth/auth.controller.ts`

**Changes Required:**

- Add `@nestjs/throttler` to `apps/api`
- Import `ThrottlerModule` in `AppModule`
- Apply `@Throttle()` decorator to sensitive endpoints:
  - `POST /auth/login` - 5 requests/minute (brute-force protection)
  - `POST /auth/register` - 3 requests/minute (spam protection)
  - `POST /auth/forgot-password` - 2 requests/5 minutes (email bombing protection)
  - `POST /auth/reset-password` - 10 requests/10 minutes ( abuse protection)
- Set default limits for other endpoints: 100 requests/minute

**Impact Analysis:**

- **Breaking:** No. This only adds security layer, existing functionality preserved
- **Dependencies:** None
- **Rollback:** Simple - remove ThrottlerModule import and decorators
- **Performance:** Slight CPU overhead for rate limiting storage (in-memory default)
- **Related Components:**
  - `apps/web/lib/baseQuery.ts` - No changes needed, rate limiting is server-side only
  - `apps/web/proxy.ts` - No changes needed, Edge authentication unchanged

**Implementation Steps:**

1. Add `@nestjs/throttler` dependency
2. Update `AppModule` imports
3. Add `ThrottlerGuard` globally with fallback to `AppGuard`
4. Add `@Throttle()` decorators to auth endpoints
5. Configure environment variables for thresholds
6. Test with controlled burst requests

### 1.2 Add File Upload Size Limits

**Location:** `apps/api/src/modules/portal/portal.module.ts`

**Changes Required:**

```typescript
MulterModule.register({
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // max 10 files per request
  },
}),
```

**Impact Analysis:**

- **Breaking:** **YES** - Clients currently uploading >10MB files will get 400 errors
- **Scope:** Affects:
  - `POST /deliverables` - deliverable files
  - `POST /clients/:id/intake-form` - intake form documents
  - `POST /clients/:id/intake-form` - intake form documents
- **Mitigation Strategy:**
  - Set limit to **25MB** (current practical max observed) to avoid breaking existing users
  - Log warnings for files approaching 20MB threshold
  - Consider adding a `fileSizeLimitMB` environment variable for configurability
- **Dependencies:** None
- **Rollback:** Simple - remove `limits` config

---

## Phase 2: Performance Optimization (P1)

### 2.1 Server-Side Page Size Cap

**Location:** `apps/api/src/modules/portal/controllers/portal.controller.ts`

**Changes Required:**

- Add helper function in `PortalController`:

```typescript
private parseLimit(query: string, defaultLimit: number, maxLimit: number = 100): number {
  const limit = Number(query) || defaultLimit;
  return Math.min(Math.max(1, limit), maxLimit);
}
```

- Update all paginated endpoints to use `parseLimit()`:
  - `getContracts()` → `limit: this.parseLimit(limit, 20)`
  - `getInvoices()` → `limit: this.parseLimit(limit, 20)`
  - `getPortalProjects()` → `limit: this.parseLimit(limit, 6)`
  - `getPortalRequests()` → `limit: this.parseLimit(limit, 6)`
  - `getActionItems()` → `limit: this.parseLimit(limit, 20)`
  - All other paginated endpoints

**Impact Analysis:**

- **Breaking:** **MINIMAL** - Clients using reasonable limits (<100) are unaffected
- **Scope:** All portal pagination endpoints (15+ endpoints)
- **Rollback:** Simple - revert limit parsing to raw `Number(limit) || X`
- **Related Components:**
  - Frontend pages use small limits (6-20) - no change needed
  - RTK Query pagination parameters unchanged
  - **No** database schema changes

### 2.2 Cache Permissions in JWT Claims

**Location:** `apps/api/src/auth/auth.service.ts` + `apps/api/src/common/guards/permissions.guard.ts`

**Changes Required:**

1. **On Login:** Add permissions array to JWT payload:

   ```typescript
   // In AuthService.login()
   const user = await this.prisma.user.findUnique({
     where: { email: dto.email },
     include: {
       role: { include: { permissions: { include: { permission: true } } } },
       permissions: { include: { permission: true } },
     },
   });
   const permissions = [
     ...user.role.permissions.map((p) => p.permission.name),
     ...user.permissions.map((p) => p.permission.name),
   ];
   const accessToken = this.jwtService.sign({
     id: user.id,
     role: user.role.name,
     permissions, // NEW: add permissions array
   });
   ```

2. **Update PermissionsGuard:** Read from JWT instead of DB:

   ```typescript
   // In permissions.guard.ts
   const { user } = context.switchToHttp().getRequest();
   if (user.role === "ADMIN") return true;

   const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
     PERMISSIONS_KEY,
     [context.getHandler(), context.getClass()],
   );

   if (!requiredPermissions) return true;

   // NEW: Use cached permissions from JWT
   const hasPermission = requiredPermissions.every((p) =>
     user.permissions?.includes(p),
   );
   ```

**Impact Analysis:**

- **Breaking:** **YES** - JWT payload structure changes
- **Scope:**
  - **All authenticated API requests** (30+ endpoints per page × 31 pages × N clients)
  - **Authentication flow** - login/refresh endpoints
  - **Permission validation** - every request with @RequirePermissions
- **Rollback Strategy:**
  - Add migration flag in config
  - Check for both JWT permissions and DB lookup during transition
  - Gradual rollout with canary deployment
- **Performance Impact:**
  - **+1 query per request** removed
  - **~50-100ms saved per request** (DB roundtrip eliminated)
  - **+50 bytes per JWT token** (small overhead)
- **Security Considerations:**
  - Permissions changes require token refresh
  - Implement short token TTL for sensitive permission changes
  - Consider adding Redis cache as fallback for real-time updates

### 2.3 Reduce Polling Intervals + Extend WebSocket

**Location:** Frontend RTK Query endpoints + Backend WebSocket events

**Changes Required:**

#### A. Backend WebSocket Events

**File:** `apps/api/src/modules/notifications/notifications.service.ts`

Add WebSocket broadcast for cache invalidation:

```typescript
async broadcastPortalInvalidations(clientId: string, tags: string[]) {
  // Broadcast to all WebSocket connections for this client
  this.eventEmitter.emit('socket.broadcast', {
    type: 'INVALIDATE_TAGS',
    payload: { tags, clientId },
  });
}
```

**File:** `apps/api/src/modules/portal/portal.service.ts`

Update mutation methods to broadcast invalidations:

```typescript
// In approveProject()
await this.broadcastPortalInvalidations(clientId, [
  "ReviewProjects",
  "ProjectProgress",
  "PortalProjects",
  "ActionItems", // NEW
  "ActivityFeed", // NEW
]);

// In requestProjectRevision()
await this.broadcastPortalInvalidations(clientId, [
  "ReviewProjects",
  "ProjectProgress",
  "PortalProjects",
  "ActionItems", // NEW
  "ActivityFeed", // NEW
]);

// In createDeliverable()
await this.broadcastPortalInvalidations(clientId, [
  "ActionItems", // NEW
  "ActivityFeed", // NEW
  "ProjectProgress", // NEW
]);
```

#### B. Frontend Polling Reduction

**File:** All 31 polling pages (30s → 120s)

**Pages to update:**

- `apps/web/app/(portal)/portal/page.tsx` - 7 queries @ 120s
- `apps/web/app/(portal)/portal/finance/page.tsx` - 2 queries @ 120s
- `apps/web/app/(portal)/portal/deliverables/page.tsx` - 3 queries @ 120s
- `apps/web/app/(portal)/portal/actions/page.tsx` - 1 query @ 120s
- `apps/web/app/(portal)/portal/campaigns/page.tsx` - 1 query @ 120s
- `apps/web/app/(portal)/portal/projects/page.tsx` - 1 query @ 120s
- `apps/web/app/(portal)/portal/reports/page.tsx` - 2 queries @ 120s
- Notification bell components (3 instances) - 1 query @ 120s

**Impact Analysis:**

- **Breaking:** **NO** - WebSocket invalidations will handle real-time updates
- **Dependencies:**
  - Backend WebSocket events must be implemented first
  - RTK Query tag invalidation must be properly configured
- **Performance Impact:**
  - **~1,400 req/min reduced to ~350 req/min** with 100 concurrent users (75% reduction)
  - **Real-time updates** instead of 30s delay
- **Related Components:**
  - **RTK Query cache invalidation** - must add tags to all mutation endpoints
  - **WebSocket connection** - must handle INVALIDATE_TAGS events
  - **Frontend RTK baseQuery** - no changes needed

#### C. Missing RTK Query Mutations

**Issue:** Some backend mutations lack frontend RTK implementations

**Missing Mutations (add to `portalApi`):**

```typescript
// In portalApi endpoints
approveDeliverable: builder.mutation<any, string>({
  query: (id) => ({ url: `/deliverables/${id}/approve`, method: "POST" }),
  invalidatesTags: ["ActionItems", "ActivityFeed", "ProjectProgress"],
}),

rejectDeliverable: builder.mutation<any, string>({
  query: (id) => ({ url: `/deliverables/${id}/reject`, method: "POST" }),
  invalidatesTags: ["ActionItems", "ActivityFeed", "ProjectProgress"],
}),

// Contract signing
signContract: builder.mutation<any, string>({
  query: (id) => ({ url: `/portal/contracts/${id}/sign`, method: "POST" }),
  invalidatesTags: ["PortalContracts", "ActionItems", "ActivityFeed"],
}),

// Add to exports
useApproveDeliverableMutation,
useRejectDeliverableMutation,
useSignContractMutation,
```

---

## Phase 3: User Experience Improvements

### 3.1 Add Retry Logic to RTK Query

**Location:** `apps/web/lib/baseQuery.ts`

**Changes Required:**

```typescript
import { retry } from "@reduxjs/toolkit/query";

export const baseQuery: BaseQueryFn<...> = async (args, api, extraOptions) => {
  let result = unwrap(
    (await _rawBaseQuery(args, api, extraOptions)) as RawResult,
  );

  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    // ... existing refresh logic
  }

  // Add retry logic
  result = await retry(baseQuery, {
    maxRetries: 3,
    delay: () => 1000, // 1 second fixed delay
  })(args, api, extraOptions);

  return result;
};
```

**Impact Analysis:**

- **Breaking:** **NO**
- **Dependencies:** None
- **User Impact:**
  - **No more silent failures** on network blips
  - **Automatic recovery** in 1-3 seconds
- **Performance:** Minimal overhead (only when errors occur)

### 3.2 Fix Silent Error Handling

**Files to Update:**

1. **`apps/web/app/(portal)/portal/page.tsx`** - Dashboard page:

```typescript
const handleSnooze = async (item: { id: string; type: string }) => {
  const itemId = item.id.replace(/^(del|inv|prop|con)-/, "");
  try {
    await snoozeActionItem({ itemType: item.type, itemId }).unwrap();
  } catch (err: any) {
    toast.error(err?.data?.message || "فشل في إخفاء الإجراء");
  }
};
```

2. **`apps/web/app/(portal)/portal/chat/page.tsx`** - Chat page:

```typescript
const handleSend = useCallback(
  async (content: string) => {
    if (!selectedId) return;
    try {
      await sendMessage({
        conversationId: selectedId,
        content,
      }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "فشل في إرسال الرسالة");
    }
  },
  [selectedId, sendMessage],
);
```

3. **`apps/web/app/(portal)/portal/notifications/page.tsx`** - Notifications:

```typescript
const handleMarkRead = useCallback(
  async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "فشل في وضع علامة مقروءة");
    }
  },
  [markAsRead],
);
```

**Impact Analysis:**

- **Breaking:** **NO** - Only adds error feedback
- **Dependencies:** None (requires `sonner` toast already imported)
- **User Impact:**
  - **Critical** - Users will now know when actions fail
  - **Reduces support tickets** by providing clear error messages

---

## Phase 4: Cleanup & Optimization

### 4.1 Remove Unused API Slices (Low Priority)

**Location:** `apps/web/lib/store.ts`

**Analysis:** 25 RTK slices loaded but client users only use ~5:

- **Used by clients:** `portalApi`, `portalNotificationsApi`, `authApi`, `chatApi`
- **Unused by clients:** `adminApi`, `salesApi`, `financeApi`, `healthApi`, `adminApi`, etc.

**Recommendation:** Deferred - Client users are a minority, and loading 25 slices has minimal impact compared to polling issues. Consider this for a future architecture refactor.

---

## Implementation Order & Timeline

### **Week 1: Security & Basic Performance**

1. **Day 1-2:** Add rate limiting (P0 - critical)
2. **Day 3:** Add file upload size limits (P0 - critical)
3. **Day 4-5:** Server-side page size caps (P1)

### **Week 2: Real-time & WebSocket**

1. **Day 1-2:** Backend WebSocket invalidation events (P1)
2. **Day 3:** Frontend polling reduction (P1)
3. **Day 4-5:** Add missing RTK mutations (P1)

### **Week 3: Error Handling & Polish**

1. **Day 1:** Fix silent error handling (P1)
2. **Day 2:** Add RTK retry logic (P1)
3. **Day 3-5:** Testing, documentation, deployment

---

## Testing Strategy

### Unit Tests (Manual Verification Required)

1. **Rate Limiting:**
   - Test auth endpoints with >5 requests/minute (should 429)
   - Test other endpoints with >100 requests/minute (should 429)

2. **File Upload Limits:**
   - Test 11MB file upload (should fail with 400)
   - Test 9MB file upload (should succeed)

3. **Page Size Cap:**
   - Test `?limit=1000` (should return max 100)
   - Test `?limit=1` (should return 1)
   - Test `?limit=-1` (should return 1)

4. **WebSocket Invalidations:**
   - Approve project → verify dashboard action items update within 2s
   - Reject deliverable → verify project progress updates

### Integration Tests

1. **End-to-End Flow:**
   - Login as client → navigate to portal dashboard
   - Approve project from dashboard → verify action items update
   - Send chat message → verify real-time delivery
   - Refresh page during upload → verify partial progress not lost

---

## Rollback Plan

### Immediate Rollback (30 minutes)

- Remove ThrottlerModule from `AppModule`
- Remove `limits` config from MulterModule
- Revert `parseLimit()` calls to raw `Number(limit)`
- Restore WebSocket events in backend
- Revert polling intervals to 30s

### Gradual Rollback (2 hours)

- Revert JWT permissions to DB lookup
- Revert error handling to silent catches
- Disable RTK retry logic

---

## Monitoring & Alerts

### Post-Deployment Monitoring

1. **Error Rates:**
   - Alert on 429 (rate limit) spikes
   - Alert on 413 (file too large) errors

2. **Performance:**
   - Monitor DB query count per request (should drop by ~30%)
   - Monitor WebSocket connection count
   - Monitor API response time (P50, P95, P99)

3. **User Experience:**
   - Track error toast display rate (should increase, but user satisfaction up)
   - Track polling request count (should drop by 75%)

---

## Known Limitations & Future Work

1. **JWT Permissions:**
   - Changes require token refresh (not real-time)
   - Future: Redis cache with TTL for real-time permission updates

2. **WebSocket Reliability:**
   - No acknowledgment of received invalidations
   - Future: Add WebSocket message ack/nack

3. **RTK Retry:**
   - Fixed 1-second delay (not exponential backoff)
   - Future: Implement exponential backoff with jitter

4. **Polling Still Needed:**
   - WebSocket events could be missed if client disconnected
   - 120s fallback still necessary (reduced from 30s)

---

## Conclusion

This plan addresses all P0 and P1 issues with **minimal breaking changes**. The key trade-offs:

1. **Breaking Changes:** File upload limits (25MB cap), JWT payload structure
2. **No Breaking Changes:** Rate limiting, page size caps, retry logic, error handling
3. **Performance Gains:** 75% reduction in polling requests, ~50-100ms saved per request (permissions)
4. **Security Improvements:** Brute-force protection, DoS prevention, email bombing protection
5. **User Experience:** Real-time updates, clear error messages, automatic recovery

The plan prioritizes **security fixes first**, then **performance optimizations**, and finally **UX improvements** to maximize impact while minimizing risk.
