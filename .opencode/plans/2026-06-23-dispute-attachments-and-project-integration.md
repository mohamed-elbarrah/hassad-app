# Dispute Attachments & Project Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement file attachments on dispute tickets/messages and open the dispute dialog inline on the portal project page.

**Architecture:** Backend uses NestJS FilesInterceptor + existing StorageService (R2). Frontend extracts a shared FileDropzone UI component from the existing FileUploadZone, then composes it into dispute components. Project header opens NewDisputeDialog inline instead of navigating away.

**Tech Stack:** NestJS 11, Prisma 6, Cloudflare R2, Next.js 16, Redux Toolkit + RTK Query, Tailwind CSS 4

---

### Task 1: Backend — Add DISPUTE_ATTACHMENT storage category

**Files:**

- Modify: `apps/api/src/common/storage/storage.constants.ts`

- [ ] **Add the enum value and config**

```typescript
// Add to StorageCategory enum after MARKETING_STRATEGY:
DISPUTE_ATTACHMENT = "dispute_attachment",

// Add to STORAGE_CONFIG object:
[StorageCategory.DISPUTE_ATTACHMENT]: {
  keyPrefix: "disputes",
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: [
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
},
```

- [ ] **Build to verify**: `npx turbo run build --filter=api`

---

### Task 2: Backend — Add file interceptors to controllers

**Files:**

- Modify: `apps/api/src/modules/disputes/controllers/portal-disputes.controller.ts`
- Modify: `apps/api/src/modules/disputes/controllers/pm-disputes.controller.ts`

- [ ] **Update portal controller — add imports**

```typescript
// Add at top with existing imports:
import { UseInterceptors, UploadedFiles } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
```

- [ ] **Update portal `createDispute`**

```typescript
@Post()
@UseInterceptors(FilesInterceptor("files", 5))
async createDispute(
  @CurrentUser() user: any,
  @Body() dto: CreateDisputeDto,
  @UploadedFiles() files?: Express.Multer.File[],
) {
  const clientId = await this.resolveClientId(user);
  if (!clientId) throw new ForbiddenException();
  return this.disputesService.createDispute(clientId, dto, files);
}
```

- [ ] **Update portal `addMessage`**

```typescript
@Post(":id/messages")
@UseInterceptors(FilesInterceptor("files", 5))
async addMessage(
  @CurrentUser("id") userId: string,
  @Param("id") id: string,
  @Body() dto: CreateDisputeMessageDto,
  @UploadedFiles() files?: Express.Multer.File[],
) {
  return this.disputesService.addMessage(id, userId, dto, files);
}
```

- [ ] **Update PM controller — add same imports then modify `addMessage`**

```typescript
@Post(":id/messages")
@RequirePermissions("disputes.pm_update")
@UseInterceptors(FilesInterceptor("files", 5))
async addMessage(
  @CurrentUser("id") pmId: string,
  @Param("id") id: string,
  @Body() dto: CreateDisputeMessageDto,
  @UploadedFiles() files?: Express.Multer.File[],
) {
  return this.disputesService.addMessage(id, pmId, { ...dto, isInternal: false }, files);
}
```

- [ ] **Build to verify**: `npx turbo run build --filter=api`

---

### Task 3: Backend — Handle file uploads in dispute service

**Files:**

- Modify: `apps/api/src/modules/disputes/services/disputes.service.ts`

- [ ] **Add StorageService imports at top (after existing prisma import)**

```typescript
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
```

- [ ] **Inject StorageService into constructor**

```typescript
constructor(
  private prisma: PrismaService,
  private eventEmitter: EventEmitter2,
  private projectsService: ProjectsService,
  private storageService: StorageService,
) {}
```

- [ ] **Update `createDispute` signature and body**

```typescript
async createDispute(clientId: string, dto: CreateDisputeDto, files?: Express.Multer.File[]) {
  // ... existing validation logic unchanged (project check, existing dispute, ticketNumber) ...

  const dispute = await this.prisma.$transaction(async (tx) => {
    const created = await tx.disputeTicket.create({
      data: {
        ticketNumber,
        clientId,
        pmId: project.projectManagerId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        category: dto.category as DisputeCategory,
        status: DisputeStatus.PENDING_APPROVAL,
        history: {
          create: {
            toStatus: DisputeStatus.PENDING_APPROVAL,
            changedBy: clientId,
            note: "تم إنشاء التذكرة",
          },
        },
      },
      include: {
        project: { select: { id: true, name: true } },
        pm: { select: { id: true, name: true } },
      },
    });

    if (files?.length) {
      const attachmentData = await Promise.all(
        files.map(async (file) => {
          const result = await this.storageService.upload({
            category: StorageCategory.DISPUTE_ATTACHMENT,
            entityId: created.id,
            file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size },
          });
          return { ticketId: created.id, uploadedBy: clientId, fileName: result.originalName, filePath: result.key, fileSize: result.size, mimeType: result.mimeType };
        })
      );
      await tx.disputeAttachment.createMany({ data: attachmentData });
    }
    return created;
  });

  this.eventEmitter.emit("dispute.created", { disputeId: dispute.id, ticketNumber: dispute.ticketNumber, clientId, projectId: dto.projectId, pmId: project.projectManagerId, title: dto.title });

  return this.prisma.disputeTicket.findUnique({
    where: { id: dispute.id },
    include: {
      project: { select: { id: true, name: true } },
      pm: { select: { id: true, name: true } },
      attachments: { include: { uploader: { select: { id: true, name: true } } } },
    },
  });
}
```

- [ ] **Update `addMessage` signature and body**

```typescript
async addMessage(disputeId: string, authorId: string, dto: CreateDisputeMessageDto, files?: Express.Multer.File[]) {
  // ... existing validation unchanged (find dispute, check status) ...

  const message = await this.prisma.$transaction(async (tx) => {
    const created = await tx.disputeMessage.create({
      data: { ticketId: disputeId, authorId, content: dto.content, isInternal: dto.isInternal ?? false },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });

    if (files?.length) {
      const attachmentData = await Promise.all(
        files.map(async (file) => {
          const result = await this.storageService.upload({
            category: StorageCategory.DISPUTE_ATTACHMENT,
            entityId: disputeId,
            file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size },
          });
          return { ticketId: disputeId, messageId: created.id, uploadedBy: authorId, fileName: result.originalName, filePath: result.key, fileSize: result.size, mimeType: result.mimeType };
        })
      );
      await tx.disputeAttachment.createMany({ data: attachmentData });
    }
    return created;
  });

  this.eventEmitter.emit("dispute.message", { disputeId, messageId: message.id, authorId });
  return message;
}
```

- [ ] **Build to verify**: `npx turbo run build --filter=api`

---

### Task 4: Frontend — Create shared FileDropzone component

**Files:**

- Create: `apps/web/components/shared/FileDropzone.tsx`

Extracted UI layer from `FileUploadZone`. Handles drag-drop, validation, image/file previews, removal. No upload logic — returns `File[]` to parent.

- [ ] **Create the component**

JSX includes: dashed drop zone with drag states, hidden file input triggered by click, validation via `acceptedTypes` + `maxSizeMB`, preview grid (image thumbnails via `URL.createObjectURL`, file icons for non-images), remove button per file. Props: `files: File[]`, `onFilesChange: (files: File[]) => void`, `maxFiles?`, `maxSizeMB?`, `acceptedTypes?`.

- [ ] **Build to verify**: `npx turbo run build --filter=web`

---

### Task 5: Frontend — Refactor FileUploadZone to use FileDropzone

**Files:**

- Modify: `apps/web/components/shared/IntakeFormFields/components/FileUploadZone.tsx`

- [ ] **Rewrite FileUploadZone to wrap FileDropzone internally**

The component keeps the exact same public interface (`onFilesUploaded`, `maxFiles`, `maxSizeMB`, `acceptedTypes`, `uploadedFiles`, `onRemoveFile`). Internally:

- Wraps `FileDropzone` with local `File[]` state
- On file selection, auto-uploads to `POST /portal/upload-intake-files`
- Converts server response `UploadedFile[]` back to existing `onFilesUploaded` callback
- Old `uploadedFiles` (already-uploaded items) shown alongside using the existing preview render logic

- [ ] **Build to verify**: `npx turbo run build --filter=web`

---

### Task 6: Frontend — Update NewDisputeDialog with file uploads

**Files:**

- Modify: `apps/web/components/disputes/NewDisputeDialog.tsx`
- Modify: `apps/web/features/portal/portalApi.ts`

- [ ] **Import FileDropzone in NewDisputeDialog**

```typescript
import { FileDropzone } from "@/components/shared/FileDropzone";
```

- [ ] **Add local state for files**

```typescript
const [files, setFiles] = useState<File[]>([]);
```

- [ ] **Add FileDropzone JSX before the footer (after description textarea)**

```tsx
{
  /* File Attachments */
}
<div className="space-y-2">
  <label className="text-sm font-medium text-natural-100">
    المرفقات (اختياري)
  </label>
  <FileDropzone
    files={files}
    onFilesChange={setFiles}
    maxFiles={5}
    maxSizeMB={10}
  />
</div>;
```

- [ ] **Change `handleSubmit` signature to include files — update the `onSubmit` prop type**

```typescript
interface NewDisputeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDisputeInput, files?: File[]) => void;
  isLoading?: boolean;
  projectId?: string;
  projectName?: string;
}

const handleSubmit = () => {
  if (!validate() || !category || !selectedProjectId) return;
  onSubmit(
    {
      projectId: selectedProjectId,
      category,
      title: title.trim(),
      description: description.trim(),
    },
    files.length > 0 ? files : undefined,
  );
};
```

- [ ] **Reset files state in handleClose**

```typescript
setFiles([]); // ADD alongside other state resets
```

- [ ] **Update `portalApi.ts` — change `createDispute` mutation to use `queryFn` with FormData**

```typescript
createDispute: builder.mutation<DisputeDetail, CreateDisputeInput & { files?: File[] }>({
  queryFn: async ({ files, ...data }, _api) => {
    const formData = new FormData();
    formData.append("projectId", data.projectId);
    formData.append("category", data.category);
    formData.append("title", data.title);
    formData.append("description", data.description);
    if (files?.length) files.forEach((f) => formData.append("files", f));

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/portal/disputes`, {
      method: "POST", credentials: "include", body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { error: { status: res.status, data: json } };
    return { data: json?.data ?? json };
  },
  invalidatesTags: ["ClientDisputes"],
}),
```

- [ ] **Update the portal disputes page to pass files**

In `apps/web/app/(portal)/portal/disputes/page.tsx`, update `handleCreateDispute`:

```typescript
const handleCreateDispute = async (
  input: CreateDisputeInput,
  files?: File[],
) => {
  try {
    await createDispute({ ...input, files }).unwrap();
    toast.success("تم إرسال التذكرة", {
      description: "تم استلام تذكرتك. سيتم مراجعتها من قبل الإدارة.",
    });
    setIsNewDisputeOpen(false);
    refetch();
  } catch (error: any) {
    const message =
      error?.data?.error?.message || "حدث خطأ أثناء إرسال التذكرة";
    toast.error("خطأ", { description: message });
  }
};
```

- [ ] **Build to verify**: `npx turbo run build --filter=web`

---

### Task 7: Frontend — Update DisputeMessageThread + message APIs with file uploads

**Files:**

- Modify: `apps/web/components/disputes/DisputeMessageThread.tsx`
- Modify: `apps/web/features/portal/portalApi.ts` (addMessage mutation)
- Modify: `apps/web/features/disputes/pmDisputesApi.ts` (addPmDisputeMessage mutation)
- Modify: `apps/web/app/(portal)/portal/disputes/[id]/page.tsx`
- Modify: `apps/web/app/(dashboard)/dashboard/pm/disputes/[id]/page.tsx`

- [ ] **Update DisputeMessageThread props + add FileDropzone**

```typescript
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Paperclip } from "lucide-react"; // add to existing import

interface DisputeMessageThreadProps {
  messages: Message[];
  onSendMessage: (content: string, files?: File[]) => void; // CHANGED
  isLoading?: boolean;
  canSendMessage?: boolean;
  showInternalBadge?: boolean;
}
```

Add state inside the component:

```typescript
const [attachFiles, setAttachFiles] = useState<File[]>([]);
const [showAttach, setShowAttach] = useState(false);
```

- [ ] **Replace textarea area with expanded version**

```tsx
{
  /* Input Area */
}
{
  canSendMessage && (
    <div className="flex flex-col gap-2">
      {showAttach && (
        <div className="rounded-2xl border-[1.5px] border-portal-divider bg-natural-0 p-3">
          <FileDropzone
            files={attachFiles}
            onFilesChange={setAttachFiles}
            maxFiles={5}
            maxSizeMB={10}
          />
        </div>
      )}
      <div className="flex items-end gap-2 rounded-2xl border-[1.5px] border-portal-divider bg-natural-0 p-3">
        <button
          type="button"
          onClick={() => setShowAttach(!showAttach)}
          className={cn(
            "h-9 w-9 shrink-0 flex items-center justify-center rounded-full transition-colors",
            showAttach
              ? "bg-secondary-100 text-secondary-600"
              : "text-portal-icon hover:bg-badge-gray-bg",
          )}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك هنا..."
          className="flex-1 resize-none border-0 bg-transparent text-sm text-natural-100 placeholder:text-portal-placeholder focus:outline-none focus:ring-0 min-h-[40px] max-h-[120px]"
          rows={1}
          disabled={isLoading}
        />
        <Button
          onClick={() => {
            handleSend();
            setAttachFiles([]);
            setShowAttach(false);
          }}
          disabled={(!newMessage.trim() && !attachFiles.length) || isLoading}
          className="h-9 w-9 shrink-0 rounded-full bg-secondary-500 p-0 hover:bg-secondary-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

Also update `handleSend`:

```typescript
const handleSend = () => {
  if ((!newMessage.trim() && !attachFiles.length) || isLoading) return;
  onSendMessage(
    newMessage.trim(),
    attachFiles.length > 0 ? attachFiles : undefined,
  );
  setNewMessage("");
  setAttachFiles([]);
  setShowAttach(false);
};
```

- [ ] **Show attachment previews in message bubbles** — add after content in `MessageBubble`:

```tsx
{
  /* Attachments — shown when message has them (passed via extended Message type) */
}
{
  (message as any).attachments?.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-2">
      {(message as any).attachments.map((att: any) => (
        <a
          key={att.id}
          href={att.fileUrl || "#"}
          target="_blank"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 text-xs hover:bg-white/30 transition-colors"
        >
          <FileText className="h-3 w-3" />
          <span className="truncate max-w-[120px]">{att.fileName}</span>
        </a>
      ))}
    </div>
  );
}
```

- [ ] **Update portalApi.ts — change `addDisputeMessage` to queryFn with FormData**

```typescript
addDisputeMessage: builder.mutation<DisputeMessage, { disputeId: string; content: string; files?: File[] }>({
  queryFn: async ({ disputeId, content, files }, _api) => {
    const formData = new FormData();
    formData.append("content", content);
    if (files?.length) files.forEach((f) => formData.append("files", f));

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/portal/disputes/${disputeId}/messages`, {
      method: "POST", credentials: "include", body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { error: { status: res.status, data: json } };
    return { data: json?.data ?? json };
  },
  invalidatesTags: (_result, _error, { disputeId }) => [{ type: "ClientDispute", id: disputeId }],
}),
```

- [ ] **Update portal dispute detail page `handleSendMessage`**

```typescript
const handleSendMessage = async (content: string, files?: File[]) => {
  try {
    await addMessage({ disputeId: id, content, files }).unwrap();
    refetch();
  } catch (error: any) {
    const message =
      error?.data?.error?.message || "حدث خطأ أثناء إرسال الرسالة";
    toast.error(message);
  }
};
```

- [ ] **Update pmDisputesApi.ts — change `addPmDisputeMessage` to queryFn**

```typescript
addPmDisputeMessage: builder.mutation<PmDisputeMessage, { disputeId: string; input: PmDisputeMessageInput; files?: File[] }>({
  queryFn: async ({ disputeId, input, files }, _api) => {
    const formData = new FormData();
    formData.append("content", input.content);
    if (files?.length) files.forEach((f) => formData.append("files", f));

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/pm/disputes/${disputeId}/messages`, {
      method: "POST", credentials: "include", body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { error: { status: res.status, data: json } };
    return { data: json?.data ?? json };
  },
  invalidatesTags: (_result, _error, { disputeId }) => [{ type: "PmDispute", id: disputeId }],
}),
```

- [ ] **Update PM dispute detail page `handleSendMessage`**

```typescript
const handleSendMessage = async (content: string, files?: File[]) => {
  try {
    await addMessage({ disputeId: id, input: { content }, files }).unwrap();
    refetch();
  } catch (error: any) {
    const message =
      error?.data?.error?.message || "حدث خطأ أثناء إرسال الرسالة";
    toast.error(message);
  }
};
```

- [ ] **Build to verify**: `npx turbo run build --filter=web`

---

### Task 8: Frontend — Open dispute dialog inline on project page

**Files:**

- Modify: `apps/web/components/portal/project-detail/ProjectHeader.tsx`

- [ ] **Replace navigation with inline dialog**

```typescript
"use client";

import { useState } from "react"; // ADD useState
// Remove: import { useRouter } from "next/navigation"; // REMOVE
import { ChevronRight, Ticket } from "lucide-react";
import type { PortalProjectDetail } from "@/features/portal/portalApi";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";
import { ActionButton } from "@/components/design-system/ActionButton";
import { NewDisputeDialog } from "@/components/disputes"; // ADD
import { useCreateDisputeMutation } from "@/features/portal/portalApi"; // ADD
import { toast } from "sonner"; // ADD
import type { CreateDisputeInput } from "@hassad/shared"; // ADD
```

- [ ] **Update component body**

```typescript
export function ProjectHeader({ project }: ProjectHeaderProps) {
  // Remove: const router = useRouter();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [createDispute, { isLoading: isCreating }] = useCreateDisputeMutation();

  const initials = (project.client?.companyName ?? project.name)
    .trim().charAt(0).toUpperCase();

  const handleCreateDispute = async (data: CreateDisputeInput, files?: File[]) => {
    try {
      await createDispute({ ...data, files }).unwrap();
      toast.success("تم إرسال التذكرة", {
        description: "تم استلام تذكرتك. سيتم مراجعتها من قبل الإدارة.",
      });
      setDisputeOpen(false);
    } catch (error: any) {
      const message = error?.data?.error?.message || "حدث خطأ أثناء إرسال التذكرة";
      toast.error("خطأ", { description: message });
    }
  };

  return (
    // ... existing JSX unchanged ...
    <div className="flex items-center gap-3">
      <ActionButton
        variant="outline"
        size="sm"
        onClick={() => setDisputeOpen(true)} // CHANGED from router.push
        className="h-10 rounded-xl border-portal-divider text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 gap-2"
      >
        <Ticket className="h-4 w-4" />
        فتح تذكرة
      </ActionButton>
      {/* ... initials circle ... */}
    </div>
    // ... rest of existing JSX ...

    {/* ADD dialog at end of return */}
    <NewDisputeDialog
      isOpen={disputeOpen}
      onClose={() => setDisputeOpen(false)}
      onSubmit={handleCreateDispute}
      isLoading={isCreating}
      projectId={project.id}
      projectName={project.name}
    />
  );
}
```

- [ ] **Build to verify**: `npx turbo run build --filter=web`

---

### Self-Review Checklist

- [ ] **Spec coverage**: Every requirement from the spec is addressed — DISPUTE_ATTACHMENT category, controller interceptors, service upload logic, FileDropzone component, FileUploadZone refactor, dialog file picker, message file picker, project header inline dialog.
- [ ] **Placeholder scan**: No "TBD", "TODO", or incomplete sections remain.
- [ ] **Type consistency**: `CreateDisputeDto` unchanged (files via interceptor); `onSubmit` prop changed to `(data: CreateDisputeInput, files?: File[]) => void` consistently; `onSendMessage` changed to `(content: string, files?: File[]) => void`; mutation inputs extended with optional `files`.
- [ ] **Build verification**: Each task includes a build step. All changes should compile cleanly after Task 8.
