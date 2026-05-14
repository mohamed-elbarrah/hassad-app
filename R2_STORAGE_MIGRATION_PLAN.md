# R2 Cloud Storage Migration Plan

## Objective

Replace all local filesystem storage (`diskStorage` → `apps/api/uploads/`) with Cloudflare R2 as the centralized cloud storage backend. Migrate every file entity in the platform — projects, tasks, contracts, proposals, payments, deliverables, intake forms, and chat attachments — to a secure, organized, presigned-URL-based R2 architecture. Eliminate duplicated multer configs, remove dead static-asset serving, and add file cleanup on delete.

---

## Architecture Principles

| Principle | Implementation |
|---|---|
| **Secure** | Private R2 bucket — all access via presigned URLs from API |
| **Organized** | Hierarchical key structure scoped to parent entity |
| **Clean** | Centralized service, zero duplicated code, file cleanup on delete |
| **Complete** | Every file entity covered, including chat attachments |

---

## R2 Key Structure

```
{bucket}/
  projects/{projectId}/files/{fileId}.{ext}
  projects/{projectId}/deliverables/{deliverableId}.{ext}
  tasks/{taskId}/files/{fileId}.{ext}
  contracts/{contractId}/main.{ext}
  contracts/{contractId}/versions/{versionId}.{ext}
  proposals/{proposalId}/main.{ext}
  payments/{paymentId}/receipts/{random}.{ext}
  chat/conversations/{conversationId}/messages/{messageId}/{attachmentId}.{ext}
```

Every key is scoped to its owning entity so:
- Deleting a project → one `DeleteObjects` call with prefix `projects/{projectId}/`
- Deleting a task → prefix `tasks/{taskId}/`
- A file's ownership is visible just from its key

---

## Phase 1: New Files to Create

| File | Purpose |
|---|---|
| `apps/api/src/common/storage/storage.service.ts` | Centralized R2 S3Client: upload, delete, presignedURL, multi-delete by prefix |
| `apps/api/src/common/storage/storage.module.ts` | `@Global()` module exporting `StorageService` |
| `apps/api/src/common/storage/storage.constants.ts` | Key prefix patterns, allowed MIME types, max sizes per category |
| `apps/api/src/common/storage/file-validator.pipe.ts` | Validation pipe for file size/mime per category |

---

## Phase 2: Files to Modify — API

### Install dependencies (`apps/api/package.json`)
No file edits — run `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

### 2.1 `apps/api/src/app.module.ts`
- Import `StorageModule` (new global module)

### 2.2 `apps/api/src/main.ts`
- **Remove** `app.useStaticAssets(...)` block entirely
- Add early validation that `CLOUDFLARE_R2_*` vars are set in production

### 2.3 Multer configs — deduplicated to shared
- **`projects.module.ts`**: Replace `diskStorage` block → import `StorageModule`; change `MulterModule.register({ storage: diskStorage(...) })` → `MulterModule.register({ storage: memoryStorage() })`
- **`tasks.module.ts`**: Same change
- **`contracts.controller.ts`**: Remove inline `contractStorage`; `FileInterceptor('file', { storage: contractStorage })` → `FileInterceptor('file')` (inherits module-level memoryStorage)
- **`proposals.controller.ts`**: Remove inline `proposalStorage`; same as above
- **`payments.controller.ts`**: Remove inline `receiptStorage`; same as above

### 2.4 Controllers — inject & use StorageService

**`projects.controller.ts`** — add `StorageService` to constructor; the `uploadFile` and `deleteFile` methods delegate to service

**`tasks.controller.ts`** — same pattern; `downloadFile` becomes: fetch key from DB → generate presigned URL → 302 redirect

**`contracts.controller.ts`** — inject `StorageService`; upload file buffer then pass the R2 key to service.create()

**`proposals.controller.ts`** — same as contracts

**`payments.controller.ts`** — upload receipt buffer then pass key to service.attachReceipt()

### 2.5 Services — replace filePath logic

**`projects.service.ts`**:
- `uploadFile()`: Receive `file.buffer`, `file.mimetype`, `file.originalname`; call `StorageService.upload()` with key `projects/{projectId}/files/{uuid}.ext`; store the R2 **key** (not URL) in DB; return response with presigned URL
- `deleteFile()`: Call `StorageService.deleteByKey()` then delete DB row
- `getFiles()`: Return records with presigned URLs generated on-the-fly

**`tasks.service.ts`**:
- `addFile()`: Same pattern, key `tasks/{taskId}/files/{uuid}.ext`
- `deleteFile()`: Delete from R2 then DB
- `downloadFile()`: Generate presigned GET URL, return redirect or the URL. Remove `createReadStream`, `existsSync`, `join` from `fs`/`path` imports
- `getFiles()`: Return with presigned URLs

**`contracts.service.ts`**:
- `create()`: Call `StorageService.upload()` with key `contracts/{contractId}/main.pdf`; store the R2 key
- `createVersion()`: Same, key `contracts/{contractId}/versions/{versionId}.pdf`

**`proposals.service.ts`**:
- `create()`: Upload with key `proposals/{proposalId}/main.pdf`; store key

**`payments.service.ts`**:
- `attachReceipt()`: Receive R2 key, store in `receiptImage` field

**`portal.service.ts`**:
- `getProjectReviewDetail()`: When returning files, generate presigned URLs via StorageService
- `findDeliverables*()`: Same
- `createDeliverable()`: Accept file buffer, upload to `projects/{projectId}/deliverables/{id}.ext`
- `createIntakeForm()`: Accept actual file uploads instead of just JSON paths; upload to `intake-forms/{clientId}/{random}.ext`

### 2.6 DTO updates

| DTO | Change |
|---|---|
| `CreateVersionDto` | Change `filePath: string` → `file: Express.Multer.File` (or remove — file comes from request) |
| `CreateDeliverableDto` | Add `file` field; endpoint becomes multipart |
| `CreateMessageDto` | Add optional `attachments` array of files |
| `UploadTaskFileDto` | Unchanged (already multipart) |
| `TaskFileResponseDto` | `filePath` → `downloadUrl` (presigned) |

---

## Phase 3: New Chat Attachment Uploads

### 3.1 `apps/api/src/modules/chat/controllers/chat.controller.ts`
- Add `POST /messages/with-files` endpoint: multipart with `content`, `conversationId`, `files[]`
- Or modify `POST /messages` to accept `@UploadedFiles() files` using `FilesInterceptor`

### 3.2 `apps/api/src/modules/chat/services/chat.service.ts`
- `createMessage()`: After creating the message, loop through uploaded files, upload each to `chat/conversations/{conversationId}/messages/{messageId}/{attachmentId}.ext`, create `MessageAttachment` rows

### 3.3 `apps/api/src/modules/chat/chat.module.ts`
- Import `MulterModule.register({ storage: memoryStorage() })` and `StorageModule`

### 3.4 `apps/api/src/modules/chat/dto/chat.dto.ts`
- `CreateMessageDto`: Add optional `files` field

---

## Phase 4: Frontend Changes

### 4.1 `apps/web/lib/portal-files.ts` — centralize all URL building
- `buildFileUrl()` now just returns the URL as-is (it's already a full presigned URL from the API)
- No more `apiBase` prefixing needed

### 4.2 Remove 5 duplicate `buildFileUrl()` inline functions
- `apps/web/app/(portal)/portal/contracts/[id]/page.tsx` — delete `buildFileUrl`, import from `portal-files.ts`
- `apps/web/app/contract/[token]/page.tsx` — same
- `apps/web/app/(dashboard)/dashboard/finance/contracts/[id]/page.tsx` — same
- `apps/web/app/(portal)/portal/proposals/[token]/page.tsx` — same
- `apps/web/app/proposal/[token]/page.tsx` — same

### 4.3 Replace hardcoded URL patterns
- `apps/web/app/(portal)/portal/deliverables/page.tsx:337` — `${NEXT_PUBLIC_API_URL}${filePath}` → `buildPortalFileUrl()` or direct URL from API response
- `apps/web/app/(dashboard)/dashboard/pm/projects/[id]/page.tsx:295` — same

### 4.4 Add chat file upload UI
- Chat message component: add file upload button + preview
- Uses the existing `createMessage` endpoint (now multipart-capable)

---

## Phase 5: Cleanup

### 5.1 Delete test files and add gitignore
- `rm -rf apps/api/uploads/`
- Add `uploads/` to `.gitignore`

### 5.2 Environment variables

**`apps/api/.env`** and **`apps/api/.env.example`** (already have placeholders):
```env
CLOUDFLARE_R2_BUCKET=hassad-storage
CLOUDFLARE_R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY=<access_key>
CLOUDFLARE_R2_SECRET_KEY=<secret_key>
CLOUDFLARE_R2_PUBLIC_DOMAIN=  # Optional: custom domain for R2
```

**`apps/web/.env.local`**: Nothing extra needed — all file URLs come from API responses now.

### 5.3 Validation on startup
Add to `StorageService.onModuleInit()`: validate R2 connectivity and env vars.

---

## Presigned URL Strategy

- **Default TTL**: 1 hour for downloads, 5 minutes for uploads
- **Refresh**: Frontend re-requests presigned URLs when viewing files (API generates fresh)
- **No public access**: R2 bucket is private. All read/write goes through the API
- **API response format**: Every file object includes `url` (presigned download URL) generated at response time

---

## Complete File Change List

**New files (4):**
1. `apps/api/src/common/storage/storage.module.ts`
2. `apps/api/src/common/storage/storage.service.ts`
3. `apps/api/src/common/storage/storage.constants.ts`
4. `apps/api/src/common/storage/file-validator.pipe.ts`

**Modified API files (19):**
5. `apps/api/package.json` — add deps
6. `apps/api/src/main.ts` — remove static assets
7. `apps/api/src/app.module.ts` — import StorageModule
8. `apps/api/src/modules/projects/projects.module.ts` — memoryStorage
9. `apps/api/src/modules/projects/controllers/projects.controller.ts` — inject StorageService
10. `apps/api/src/modules/projects/services/projects.service.ts` — use StorageService
11. `apps/api/src/modules/tasks/tasks.module.ts` — memoryStorage
12. `apps/api/src/modules/tasks/controllers/tasks.controller.ts` — presigned redirects
13. `apps/api/src/modules/tasks/services/tasks.service.ts` — use StorageService, remove fs/path
14. `apps/api/src/modules/contracts/controllers/contracts.controller.ts` — remove inline storage
15. `apps/api/src/modules/contracts/services/contracts.service.ts` — store R2 key
16. `apps/api/src/modules/proposals/controllers/proposals.controller.ts` — remove inline storage
17. `apps/api/src/modules/proposals/services/proposals.service.ts` — store R2 key
18. `apps/api/src/modules/payments/controllers/payments.controller.ts` — remove inline storage
19. `apps/api/src/modules/payments/services/payments.service.ts` — store R2 key
20. `apps/api/src/modules/portal/services/portal.service.ts` — presigned URLs, multipart deliverables
21. `apps/api/src/modules/chat/chat.module.ts` — add MulterModule + StorageModule
22. `apps/api/src/modules/chat/controllers/chat.controller.ts` — add file upload endpoint
23. `apps/api/src/modules/chat/services/chat.service.ts` — create attachments on upload
24. `apps/api/src/modules/chat/dto/chat.dto.ts` — add files field
25. `apps/api/src/modules/contracts/dto/contract.dto.ts` — update CreateVersionDto
26. `apps/api/src/modules/portal/dto/portal.dto.ts` — update CreateDeliverableDto

**Modified Web files (8):**
27. `apps/web/lib/portal-files.ts` — simplify, no more apiBase prefixing
28. `apps/web/app/(portal)/portal/contracts/[id]/page.tsx` — remove inline buildFileUrl
29. `apps/web/app/contract/[token]/page.tsx` — remove inline buildFileUrl
30. `apps/web/app/(dashboard)/dashboard/finance/contracts/[id]/page.tsx` — remove inline buildFileUrl
31. `apps/web/app/(portal)/portal/proposals/[token]/page.tsx` — remove inline buildFileUrl
32. `apps/web/app/proposal/[token]/page.tsx` — remove inline buildFileUrl
33. `apps/web/app/(portal)/portal/deliverables/page.tsx` — use proper URL helper
34. `apps/web/app/(dashboard)/dashboard/pm/projects/[id]/page.tsx` — use proper URL helper

**Config files (2):**
35. `.gitignore` — add `uploads/`
36. `apps/api/.env.example` — add `CLOUDFLARE_R2_PUBLIC_DOMAIN`
