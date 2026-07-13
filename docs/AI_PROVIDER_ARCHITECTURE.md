# AI Provider Architecture

**Goal:** A provider-agnostic AI infrastructure where the admin configures one or more AI providers via the settings UI, and the system uses them without code changes. No hardcoded providers, no vendor lock-in.

**Principle:** The system asks *"which providers are active?"* not *"which provider was coded?"*

---

## Architecture Overview

```
AiService (orchestrator)
│
├── receives analyze(userId, dto) → picks active provider(s) from registry
│   tries primary, falls back to next → stores result in AiAnalysisLog
│
└──► AiProviderRegistry (singleton, loaded from DB)
    │
    ├── getPrimary(): AiProvider          # highest priority active
    ├── getActive(): AiProvider[]         # all active, by priority
    └── refresh(): void                   # re-reads from DB (after admin changes)
        │
        └──► Adapters
             ├── OpenAICompatibleAdapter   # OpenAI, OpenRouter, Together, Groq, DeepSeek, etc.
             ├── AnthropicAdapter          # Claude native API
             └── GoogleAdapter             # Gemini native API
```

---

## Core Interface

```ts
interface AiProvider {
  readonly name: string          // "openai", "openrouter", "anthropic"
  readonly displayName: string   // Arabic name in UI
  generateText(prompt: string, options?: AiOptions): Promise<AiResult>
  isAvailable(): boolean
  supportedModels(): string[]
}

interface AiOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

interface AiResult {
  text: string
  model: string
  usage?: { promptTokens: number; completionTokens: number }
}
```

---

## DB Schema

### ai_providers

```prisma
model AiProvider {
  id          String   @id @default(uuid())
  name        String   @unique        // "openai", "openrouter", "anthropic", "google"
  displayName String?                 // Arabic label for UI
  baseUrl     String?                 // custom endpoint (e.g. https://openrouter.ai/api/v1)
  apiKey      String                  // encrypted with AES-256-GCM using KEY_ENCRYPTION_SECRET
  models      String[] @default([])   // active models for this provider
  priority    Int      @default(0)    // lower = tried first
  isActive    Boolean  @default(true)

  // Rate limiting
  requestsPerMinute  Int? @default(60)
  tokensPerMinute    Int? @default(100000)

  // Model defaults
  maxTokens   Int?     @default(4096)
  temperature Float?   @default(0.7)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("ai_providers")
}
```

---

## Adapter System

| Adapter | API Format | Covers |
|---------|-----------|--------|
| **OpenAICompatibleAdapter** | `POST /v1/chat/completions` | OpenAI, OpenRouter, Together AI, Groq, DeepSeek, Perplexity, Mistral, Azure OpenAI, Anyscale, Fireworks, 100+ via OpenRouter |
| **AnthropicAdapter** | Anthropic Messages API | Claude 3.5 Sonnet, Claude 3 Opus, Claude 4 |
| **GoogleAdapter** | Gemini SDK | Gemini 1.5 Pro, Gemini 2.0 Flash |

**OpenAI-compatible alone covers 90%+ of providers** since OpenRouter gives access to 200+ models through a single compatible endpoint.

---

## How It Works

### Setup Flow
1. Admin goes to `/dashboard/admin/ai`
2. Clicks "Add Provider"
3. Selects adapter type (OpenAI Compatible / Anthropic / Google)
4. Enters API key + optional custom base URL + model name
5. Sets priority and rate limits
6. Saves → provider stored encrypted in DB

### Runtime Flow
1. `AiService.analyze()` receives analysis request
2. Calls `AiProviderRegistry.getPrimary()` → gets highest-priority active provider
3. Calls `provider.generateText(prompt)` with the prompt template for the analysis type
4. If success → saves result to `AiAnalysisLog`
5. If failure → tries next active provider in chain (automatic fallback)
6. If all fail → graceful fallback to stub result (random score + explanation)

### Rate Limiting
- Each provider has its own `requestsPerMinute` and `tokensPerMinute` limits
- `AiProviderRegistry` tracks usage and auto-skips providers that hit their limit
- Admin can adjust limits freely from the UI

---

## AI Module Structure (after refactor)

```
src/modules/ai/
├── ai.module.ts
├── adapters/
│   ├── provider.interface.ts         # AiProvider interface
│   ├── openai-compatible.adapter.ts  # OpenAI-compatible implementation
│   ├── anthropic.adapter.ts          # Anthropic implementation
│   └── google.adapter.ts             # Google implementation
├── controllers/
│   ├── ai.controller.ts              # Existing: analyze, logs, suggestions
│   └── ai-provider.controller.ts     # New: CRUD for providers
├── dto/
│   ├── ai.dto.ts                     # Existing: AiAnalyzeDto
│   └── ai-provider.dto.ts            # New: Create/Update provider DTOs
├── services/
│   ├── ai.service.ts                 # Refactored: uses registry instead of Gemini
│   ├── ai-provider-registry.service.ts # New: loads providers from DB, manages fallback
│   └── ai-provider-crud.service.ts    # New: CRUD operations for providers
└── encryption/
    └── encryption.service.ts          # New: AES-256-GCM encrypt/decrypt for API keys
```

---

## API Key Encryption

- Uses `AES-256-GCM` symmetric encryption
- Encryption key stored in env: `KEY_ENCRYPTION_SECRET`
- Same approach as password hashing but reversible (needed to send API key to provider)
- `EncryptionService` provides `encrypt(text): string` and `decrypt(ciphertext): string`
- Encrypted keys stored in DB; decrypted in-memory only when making API calls

---

## Admin UI

**Route:** `/dashboard/admin/ai`
**Navigation:** Settings section → "الذكاء الاصطناعي" (AI)

Features:
- List configured providers as cards with status indicator (active/inactive)
- Add provider: dropdown (OpenAI Compatible / Anthropic / Google) → form (name, API key, base URL, model, priority, rate limits)
- Edit provider: same form, pre-filled (key masked)
- Delete provider
- Priority reorder (drag or up/down buttons)
- "Test Connection" button → sends a test prompt, shows response time + model

---

## Remaining Admin Overview Items

1. **Update `loading.tsx`** skeleton to match the 6-row layout
2. **Wire `PeriodSelector`** to pass `from`/`to` params to API hook queries

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `AiProvider` model |
| `apps/api/prisma/migrations/*` | New migration for ai_providers |
| `apps/api/src/modules/ai/adapters/provider.interface.ts` | **New** — interface |
| `apps/api/src/modules/ai/adapters/openai-compatible.adapter.ts` | **New** — adapter |
| `apps/api/src/modules/ai/adapters/anthropic.adapter.ts` | **New** — adapter |
| `apps/api/src/modules/ai/adapters/google.adapter.ts` | **New** — adapter |
| `apps/api/src/modules/ai/encryption/encryption.service.ts` | **New** — encryption |
| `apps/api/src/modules/ai/services/ai-provider-registry.service.ts` | **New** — registry |
| `apps/api/src/modules/ai/services/ai-provider-crud.service.ts` | **New** — CRUD |
| `apps/api/src/modules/ai/services/ai.service.ts` | Refactor to use registry |
| `apps/api/src/modules/ai/controllers/ai-provider.controller.ts` | **New** — controller |
| `apps/api/src/modules/ai/controllers/ai.controller.ts` | No change needed |
| `apps/api/src/modules/ai/dto/ai-provider.dto.ts` | **New** — DTO |
| `apps/api/src/modules/ai/ai.module.ts` | Wire new services + controllers |
| `apps/web/features/admin/adminApi.ts` | Add provider query/mutation hooks |
| `apps/web/app/(dashboard)/dashboard/admin/ai/page.tsx` | **New** — UI page |
| `apps/web/lib/navigation.ts` | Add AI nav item |
| `apps/web/app/(dashboard)/dashboard/admin/loading.tsx` | Update skeleton |
| `apps/web/app/(dashboard)/dashboard/admin/page.tsx` | Wire PeriodSelector |
