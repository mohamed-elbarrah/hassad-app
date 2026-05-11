# Chat Feature — Progress Tracker

| Step | Description | Status |
|------|-------------|--------|
| 1 | Prisma Schema: Extend `Conversation` model | DONE |
| 2 | Seed: Grant chat permissions to SALES, PM, CLIENT | DONE |
| 3 | Auto-Conversation Creation Service | DONE |
| 4 | Backend API: Extend chat endpoints | DONE |
| 5 | Frontend: RTK Query chat API slice | DONE |
| 6 | Frontend: Shared chat UI components | DONE |
| 7 | Frontend: Dashboard chat page | DONE |
| 8 | Frontend: Portal chat page | DONE |
| 9 | Navigation updates (sidebar + bottom nav) | DONE |
| 10 | Build, seed & verify | DONE |

---

## Post-Implementation Bug Fixes

### Bug 1: REST messages not delivered via WebSocket
**Root cause**: `ChatService.createMessage()` saved to DB and sent notifications but never emitted `chat.messageCreated` event. Only the WS gateway's `sendMessage` handler emitted this event.
**Fix**: Added `EventEmitter2` injection to `ChatService` and emitted `chat.messageCreated` after message creation.

### Bug 2: Seed data assigned PM as accountManager instead of SALES
**Root cause**: `seed.ts` had `accountManager: users["PM"]` for both clients. This meant SALES conversations had a PM participant, and SALES users never saw any conversations.
**Fix**: Changed to `accountManager: users["SALES"]`.

### Bug 3: Nova Eats client had no `userId`
**Root cause**: Seed client2 (Nova Eats) had no `userId`, making it impossible to create a conversation for them.
**Fix**: Added second CLIENT user (`client2@hassad.com`) and linked it to Nova Eats.

### Bug 4: No role validation on conversation participants
**Root cause**: `AutoConversationService.ensureSalesConversation()` blindly trusted `salesUserId` and `ChatService.getOrCreateConversation()` blindly trusted `accountManager`. A PM user could be added to a SALES conversation.
**Fix**: Both services now validate that the user has the correct role (SALES/ADMIN for SALES conversations, PM/ADMIN for PM conversations) before creating.

### Bug 5: Broken dedup query for conversations
**Root cause**: `findFirst` with `participants: { every: { userId: { in: userIds } } }` is incorrect — it matches any conversation where ALL participants are in the list, but doesn't check that ONLY those users are participants. Also, if `userIds` has duplicate entries from different sources (e.g., same user is both client and accountManager), the `in` filter doesn't guarantee exact participant match.
**Fix**: Replaced with a manual check that fetches candidate conversations and compares sorted participant arrays for exact match (same count, same IDs).

### Bug 6: Seed cascade order broke on re-seed
**Root cause**: Adding `clientId` FK to `Conversation` meant `client.deleteMany()` failed because conversations still referenced the client.
**Fix**: Added `message.deleteMany()`, `conversationParticipant.deleteMany()`, `conversation.deleteMany()` to seed cleanup before client deletion.

---

# Chat System Implementation Plan

### Current State Summary

| Layer | Status |
|---|---|
| Backend REST API | 6 endpoints ready, fully permission-gated |
| WebSocket Gateway | socket.io with auth, typing indicators, room-based delivery |
| Prisma Models | Conversation/Participant/Message/Attachment defined |
| Frontend Socket Hooks | `useSocket`, `useChatSocket` ready |
| **Permissions** | Only ADMIN has chat perms — no one else can use it |
| **Frontend UI** | Zero chat components exist |
| **Conversation Auto-Creation** | Not implemented |
| **Conversation Metadata** | Model has no type/clientId/name fields |

---

### Step 1 — Prisma Schema: Extend `Conversation` Model

Add to `Conversation`:
- `type` enum (`SALES` | `PM`) — distinguishes conversation purpose
- `clientId` FK → `Client` — which client this conversation belongs to
- `title` String — display label (e.g. "محادثة مع [client name]")
- `isActive` Boolean `@default(true)` — soft delete convention

### Step 2 — Seed: Grant Chat Permissions to Roles

| Role | chat.create | chat.read | chat.message | chat.update |
|------|:--:|:--:|:--:|:--:|
| SALES | ✓ | ✓ | ✓ | — |
| PM | ✓ | ✓ | ✓ | — |
| CLIENT | — | ✓ | ✓ | — |

### Step 3 — Auto-Conversation Creation Service

Create `AutoConversationService` with two triggers:

| Trigger | When | Participants |
|---------|------|-------------|
| Client assigned to Sales | `Client.accountManager` is set | Client user + Sales user |
| Contract signed + PM exists | Contract status → `SIGNED` and project has PM | Client user + PM user |

Hook into:
- `CanonicalClientService.upsertCanonicalClient()` — after `accountManager` is set
- `ContractsService` state transition handler — after `status = SIGNED`

Prevent duplicates: check existing `Conversation` with same `type` + `clientId` + same participants.

### Step 4 — Backend API: Extend Chat Endpoints

- Update `GET /conversations` to support `?type=SALES&clientId=xxx` filters
- Add `GET /conversations/by-client/:clientId/:type` — returns existing or creates new (idempotent)
- Update `CreateConversationDto` to accept `type` and `clientId`

### Step 5 — Frontend: RTK Query Chat API Slice

Create `features/chat/chatApi.ts` with:
- `getConversations(params)` — list conversations with filters
- `getConversation(id)` — single conversation
- `getOrCreateConversation(clientId, type)` — for auto-resolve
- `getMessages(conversationId, page?)` — paginated messages
- `sendMessage(data)` — send message via REST

### Step 6 — Frontend: Shared Chat UI Components

```
components/chat/
├── ConversationList.tsx     # Sidebar — list of conversations, last message, unread badge
├── ConversationItem.tsx     # Single conversation row (avatar, name, preview, time)
├── ChatWindow.tsx           # Messages area with auto-scroll + date separators
├── MessageBubble.tsx        # Single message (sender alignment, timestamp)
├── MessageInput.tsx         # Textarea + send button + typing emitter
├── ChatEmptyState.tsx       # "Select a conversation" placeholder
└── ChatHeader.tsx           # Conversation top bar (name, avatar, status)
```

### Step 7 — Frontend: Dashboard Chat Page

Route: `/messages` under `(dashboard)` layout.

- Split layout: `ConversationList` (right sidebar, w-80) + `ChatWindow` (main area)
- SALES role → sees SALES-type conversations
- PM role → sees PM-type conversations
- Socket integration: real-time message delivery + typing indicators
- Unread count badge on sidebar item

### Step 8 — Frontend: Portal Chat Page

Route: `/portal/chat` under `(portal)` layout.

- Same components reused
- CLIENT sees all conversations (both SALES and PM types)
- Socket integration + typing indicators

### Step 9 — Navigation Updates

**Dashboard `AppSidebar`:**
- SALES section: add "المحادثات" → `/messages`
- PM section (المشاريع): add "المحادثات" → `/messages`

**Portal `PortalSidebar`:** add "المحادثات" → `/portal/chat`

**Portal `BottomNav` (mobile):** add chat item

### Step 10 — Build, Seed & Verify

```bash
npx prisma db push --skip-generate
npx prisma generate
npx prisma db seed
turbo build        # verify nothing broken
```

---

### Files Changed/Created (summary)

| File | Action |
|------|--------|
| `apps/api/prisma/schema.prisma` | Extend Conversation model |
| `apps/api/prisma/seed.ts` | Grant chat perms to SALES, PM, CLIENT |
| `apps/api/src/modules/chat/services/auto-conversation.service.ts` | **New** — auto-creation logic |
| `apps/api/src/modules/chat/controllers/chat.controller.ts` | Add `by-client` endpoint + filter params |
| `apps/api/src/modules/chat/dto/chat.dto.ts` | Extend DTOs |
| `apps/api/src/modules/chat/chat.module.ts` | Wire AutoConversationService |
| `apps/api/src/modules/contracts/services/contracts.service.ts` | Hook auto-conversation on sign |
| `apps/api/src/modules/core/services/canonical-client.service.ts` | Hook auto-conversation on accountManager |
| `apps/web/features/chat/chatApi.ts` | **New** — RTK Query chat slice |
| `apps/web/lib/store.ts` | Register chatApi reducer |
| `apps/web/components/chat/*.tsx` | **New** — 7 chat UI components |
| `apps/web/app/(dashboard)/messages/page.tsx` | **New** — dashboard chat page |
| `apps/web/app/(portal)/portal/chat/page.tsx` | **New** — portal chat page |
| `apps/web/components/app-sidebar.tsx` | Add chat nav for SALES/PM |
| `apps/web/components/portal/PortalSidebar.tsx` | Add chat nav for CLIENT |
| `apps/web/components/portal/BottomNav.tsx` | Add chat nav for mobile |

---

### Estimated Effort

- **Low complexity**, **~15–20 files** touched/created
- Most infra already exists — the work is wiring permissions, auto-creation hooks, and building the UI
