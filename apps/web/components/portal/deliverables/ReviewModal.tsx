"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Image as ImageIcon,
  Paperclip,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormTextarea } from "@/components/design-system/FormTextarea";
import { IconCircle } from "@/components/design-system/IconCircle";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { ProjectStatusPill } from "./ProjectStatusPill";
import { cn } from "@/lib/utils";
import { buildPortalFileUrl, getPortalFileKind } from "@/lib/portal-files";
import type {
  ProjectReviewDetail,
  ReviewProject,
} from "@/features/portal/portalApi";
import {
  useApproveProjectMutation,
  useRequestProjectRevisionMutation,
} from "@/features/portal/portalApi";
import { formatPortalDate, formatRelative } from "./utils";

interface ReviewModalProps {
  selectedProjectId: string | null;
  selectedProject: ProjectReviewDetail | undefined;
  fallbackProject: ReviewProject | undefined;
  onActionComplete: (approvedProjectId: string) => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * Review modal — the moment of decision.
 *
 *   ┌───────────────────────────────────────────────┐
 *   │  Header  (name · status · close)              │  ← identity
 *   │  Sub-row (manager · period · wait time)       │  ← who/when
 *   │  ───── divider ─────                          │
 *   │  Description (if any)                         │  ← context
 *   │  ───── divider ─────                          │
 *   │  Files (gallery + other list)                 │  ← THE WORK
 *   │  Revision history (if any)                    │
 *   │  ───── divider ─────                          │
 *   │  Decision bar                                 │  ← THE DECISION
 *   │    Approve (primary) | Request changes        │
 *   └───────────────────────────────────────────────┘
 */
export function ReviewModal({
  selectedProjectId,
  selectedProject,
  fallbackProject,
  onActionComplete,
  onOpenChange,
}: ReviewModalProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerComment, setComposerComment] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [approveProject, { isLoading: isApproving }] =
    useApproveProjectMutation();
  const [requestRevision, { isLoading: isRequestingRevision }] =
    useRequestProjectRevisionMutation();

  const open = !!selectedProjectId;
  const isLoading = open && !selectedProject;

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setComposerOpen(false);
        setComposerComment("");
        setLightboxIndex(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open, selectedProjectId]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLightboxIndex((i) => (i === null ? null : Math.max(0, i - 1)));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setLightboxIndex((i) =>
          i === null ? null : i + 1, // clamped in render
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex]);

  function handleClose() {
    onOpenChange(false);
  }

  function handleCancelComposer() {
    if (composerComment.trim() && !isRequestingRevision) {
      const ok = window.confirm("هل تريد تجاهل التعديلات المكتوبة؟");
      if (!ok) return;
    }
    setComposerOpen(false);
    setComposerComment("");
  }

  async function handleApprove() {
    if (!selectedProjectId) return;
    try {
      await approveProject(selectedProjectId).unwrap();
      toast.success("تمت الموافقة على المشروع بنجاح");
      onActionComplete(selectedProjectId);
      handleClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "حدث خطأ أثناء الموافقة على المشروع");
    }
  }

  async function handleSubmitRevision() {
    const comment = composerComment.trim();
    if (!selectedProjectId || !comment) return;
    try {
      await requestRevision({ id: selectedProjectId, comment }).unwrap();
      toast.success("تم إرسال طلب التعديل بنجاح");
      onActionComplete(selectedProjectId);
      handleClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "حدث خطأ أثناء إرسال طلب التعديل");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}
      contentClassName="max-w-2xl sm:max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden"
      className="p-0 overflow-visible flex-none"
      hideClose
    >
      {isLoading ? (
        <ModalSkeleton />
      ) : selectedProject ? (
        <div className="flex flex-col max-h-[90vh]">
          {/* ── Header ────────────────────────────────────────────── */}
          <Header
            project={selectedProject}
            onClose={handleClose}
          />

          {/* ── Scrollable body ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 bg-natural-0">
            {selectedProject.description && (
              <Description text={selectedProject.description} />
            )}

            <FilesSection
              files={selectedProject.files ?? []}
              onOpenLightbox={(i) => setLightboxIndex(i)}
            />

            {selectedProject.revisionRequests?.length > 0 && (
              <RevisionHistory
                requests={selectedProject.revisionRequests}
              />
            )}
          </div>

          {/* ── Decision bar (sticky bottom) ────────────────────── */}
          <footer className="border-t border-portal-divider bg-natural-0 px-5 sm:px-6 py-3">
            {!composerOpen ? (
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-end">
                <ActionButton
                  variant="outline"
                  size="lg"
                  onClick={() => setComposerOpen(true)}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  className="sm:w-auto"
                >
                  طلب تعديلات
                </ActionButton>
                <ActionButton
                  variant="primary"
                  size="lg"
                  onClick={handleApprove}
                  loading={isApproving}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  className="sm:min-w-[180px]"
                >
                  {isApproving ? "جارٍ الموافقة…" : "موافقة على المشروع"}
                </ActionButton>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-alert-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="text-[13px] font-medium">
                    صف التعديلات المطلوبة بدقة حتى يتسنى للفريق معالجتها.
                  </p>
                </div>
                <FormTextarea
                  value={composerComment}
                  onChange={(e) => setComposerComment(e.target.value)}
                  placeholder="مثال: تعديل ألوان الهوية، توسيع قسم الخدمات…"
                  rows={3}
                  disabled={isRequestingRevision}
                  autoFocus
                />
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ActionButton
                    variant="outline"
                    size="md"
                    onClick={handleCancelComposer}
                    disabled={isRequestingRevision}
                  >
                    إلغاء
                  </ActionButton>
                  <ActionButton
                    variant="action-blue"
                    size="md"
                    onClick={handleSubmitRevision}
                    disabled={isRequestingRevision || !composerComment.trim()}
                    loading={isRequestingRevision}
                  >
                    {isRequestingRevision
                      ? "جارٍ الإرسال…"
                      : "إرسال طلب التعديل"}
                  </ActionButton>
                </div>
              </div>
            )}
          </footer>
        </div>
      ) : (
        <EmptyFallback
          name={fallbackProject?.name ?? "—"}
          description={fallbackProject?.description ?? null}
        />
      )}

      {/* Lightbox */}
      {selectedProject && lightboxIndex !== null && (
        <ImageLightbox
          files={(selectedProject.files ?? []).filter(
            (f) => getPortalFileKind(f.fileName || f.filePath) === "image",
          )}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </Dialog>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({
  project,
  onClose,
}: {
  project: ProjectReviewDetail;
  onClose: () => void;
}) {
  const start = formatPortalDate(project.startDate);
  const end = formatPortalDate(project.endDate);
  const wait = formatRelative(project.updatedAt ?? project.createdAt);

  return (
    <header
      className={cn(
        "relative border-b border-portal-divider",
        "bg-gradient-to-bl from-secondary-500 to-secondary-600",
        "px-5 sm:px-6 py-4",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + status on the same row so they feel like one unit */}
          <div className="flex flex-wrap items-center gap-2.5 gap-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
              {project.name}
            </h2>
            <ProjectStatusPill status={project.status} />
          </div>

          {/* Sub-row: who · when · wait time */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-white/70">
            {project.manager && (
              <span className="inline-flex items-center gap-1.5">
                <UserAvatar
                  name={project.manager.name}
                  size="sm"
                  variant="circle"
                  className="ring-1.5 ring-white/20 !h-6 !w-6"
                />
                <span className="text-white/90">{project.manager.name}</span>
              </span>
            )}
            {(start || end) && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-white/55" />
                <span className="tabular-nums">
                  {start && end ? `${start} — ${end}` : start ?? end}
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-white/55" />
              <span>آخر تحديث {wait}</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            "bg-white/10 text-white/80 backdrop-blur",
            "hover:bg-white/20 hover:text-white",
            "transition-colors",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

// ─── Description ─────────────────────────────────────────────────────────────

function Description({ text }: { text: string }) {
  return (
    <section className="space-y-1.5">
      <SectionLabel>وصف المشروع</SectionLabel>
      <p className="text-sm leading-6 text-natural-100 whitespace-pre-line">
        {text}
      </p>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-portal-note-text uppercase tracking-wider">
      {children}
    </h3>
  );
}

// ─── Files section ───────────────────────────────────────────────────────────

interface ProjectFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  url?: string;
}

function FilesSection({
  files,
  onOpenLightbox,
}: {
  files: ProjectFile[];
  onOpenLightbox: (imageIndex: number) => void;
}) {
  if (files.length === 0) {
    return <ZeroFilesNudge />;
  }

  const images = files.filter(
    (f) => getPortalFileKind(f.fileName || f.filePath) === "image",
  );
  const others = files.filter(
    (f) => getPortalFileKind(f.fileName || f.filePath) !== "image",
  );

  return (
    <section className="space-y-2.5">
      <SectionLabel>
        المرفقات{" "}
        <span className="text-secondary-500 tabular-nums">
          ({files.length})
        </span>
      </SectionLabel>

      {images.length > 0 && (
        <ImageGrid images={images} onOpen={(idx) => onOpenLightbox(idx)} />
      )}

      {others.length > 0 && (
        <ul className="space-y-1.5">
          {others.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ImageGrid({
  images,
  onOpen,
}: {
  images: ProjectFile[];
  onOpen: (index: number) => void;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        images.length === 1
          ? "grid-cols-1"
          : images.length === 2
            ? "grid-cols-2"
            : "grid-cols-3",
      )}
    >
      {images.map((file, idx) => {
        const href = file.url || buildPortalFileUrl(file.filePath);
        return (
          <button
            key={file.id}
            type="button"
            onClick={() => onOpen(idx)}
            className={cn(
              "group relative overflow-hidden rounded-xl",
              "border border-portal-divider bg-portal-bg",
              "transition-colors",
              "hover:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              "aspect-[4/3]",
            )}
            title={file.fileName}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={href}
              alt={file.fileName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        );
      })}
    </div>
  );
}

function FileRow({ file }: { file: ProjectFile }) {
  const href = file.url || buildPortalFileUrl(file.filePath);
  const FileIcon = inferFileIcon(file.fileName);
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex items-center gap-3 rounded-lg border border-portal-divider",
          "bg-natural-0 px-3 py-2.5",
          "transition-colors hover:border-secondary-500/40 hover:bg-secondary-500/[0.02]",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            FileIcon === ImageIcon
              ? "bg-action-purple-soft text-action-purple"
              : "bg-action-blue-soft text-action-blue",
          )}
        >
          <FileIcon className="h-4 w-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-medium text-natural-100 truncate group-hover:text-secondary-500 transition-colors">
            {file.fileName}
          </span>
          <span className="block text-[11px] text-portal-note-text tabular-nums">
            {formatFileSize(file.fileSize)}
          </span>
        </span>
        <Download className="h-4 w-4 shrink-0 text-portal-icon group-hover:text-secondary-500 transition-colors" />
      </a>
    </li>
  );
}

function inferFileIcon(filename: string): LucideIcon {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(ext)) {
    return ImageIcon;
  }
  return FileText;
}

function ZeroFilesNudge() {
  return (
    <section
      className={cn(
        "rounded-xl border border-dashed border-alert-300",
        "bg-alert-100/50 p-3.5 space-y-1",
      )}
    >
      <div className="flex items-center gap-2">
        <IconCircle
          icon={Paperclip}
          size="sm"
          className="!bg-alert-100 !border-alert-300 !text-alert-600 !h-7 !w-7"
        />
        <h3 className="text-[13px] font-semibold text-natural-100">
          لا توجد ملفات مرفقة مع هذا المشروع
        </h3>
      </div>
      <p className="text-[12.5px] leading-5 text-portal-note-text pr-9">
        قد يكون الفريق أنهى المشروع دون رفع المرفقات. إذا كنت تتوقع ملفات، تواصل
        مع مدير المشروع قبل اتخاذ قرار الموافقة.
      </p>
    </section>
  );
}

// ─── Revision history ────────────────────────────────────────────────────────

function RevisionHistory({
  requests,
}: {
  requests: ProjectReviewDetail["revisionRequests"];
}) {
  return (
    <section className="space-y-2">
      <SectionLabel>طلبات التعديل السابقة ({requests.length})</SectionLabel>
      <ol className="space-y-1.5">
        {requests.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-portal-divider bg-portal-bg p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[12px] font-semibold text-secondary-500">
                {r.client?.companyName ?? "—"}
              </span>
              <span className="text-[11px] text-portal-note-text tabular-nums">
                {formatRelative(r.createdAt)}
              </span>
            </div>
            <p className="text-[13px] leading-5 text-natural-100 whitespace-pre-line">
              {r.comment}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Image lightbox ──────────────────────────────────────────────────────────

function ImageLightbox({
  files,
  index,
  onClose,
  onChange,
}: {
  files: ProjectFile[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  if (files.length === 0) return null;
  const safeIndex = Math.min(Math.max(0, index), files.length - 1);
  const current = files[safeIndex];
  const src = current.url || buildPortalFileUrl(current.filePath);

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      contentClassName="max-w-[min(96vw,1100px)] max-h-[94vh] p-0 gap-0 bg-secondary-700/95 border-secondary-700/0"
      className="p-0 overflow-visible flex-none"
    >
      <div className="relative flex flex-col h-[min(90vh,820px)]">
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <span className="text-sm font-semibold truncate max-w-[60%]">
            {current.fileName}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums text-white/60">
              {safeIndex + 1} / {files.length}
            </span>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full",
                "bg-white/10 text-white hover:bg-white/20 transition-colors",
              )}
              aria-label="تنزيل"
              title="تنزيل"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full",
                "bg-white/10 text-white hover:bg-white/20 transition-colors",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 flex items-center justify-center px-4 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={current.fileName}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
          />

          {files.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onChange(Math.max(0, safeIndex - 1))}
                disabled={safeIndex === 0}
                aria-label="السابق"
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "inline-flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-white/10 text-white backdrop-blur",
                  "hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed",
                  "transition-colors",
                )}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onChange(Math.min(files.length - 1, safeIndex + 1))}
                disabled={safeIndex === files.length - 1}
                aria-label="التالي"
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2",
                  "inline-flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-white/10 text-white backdrop-blur",
                  "hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed",
                  "transition-colors",
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function ModalSkeleton() {
  return (
    <div className="space-y-0" aria-busy="true">
      <div className="h-20 bg-secondary-600" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-1/3 rounded-lg bg-portal-divider" />
        <div className="h-4 w-2/3 rounded-lg bg-portal-divider" />
        <div className="grid grid-cols-3 gap-1.5 pt-2">
          <div className="h-24 rounded-xl bg-portal-divider" />
          <div className="h-24 rounded-xl bg-portal-divider" />
          <div className="h-24 rounded-xl bg-portal-divider" />
        </div>
      </div>
      <div className="border-t border-portal-divider grid grid-cols-2 gap-3 p-4">
        <div className="h-10 rounded-xl bg-portal-divider" />
        <div className="h-10 rounded-xl bg-portal-divider" />
      </div>
    </div>
  );
}

function EmptyFallback({
  name,
  description,
}: {
  name: string;
  description: string | null;
}) {
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-bold text-natural-100">{name}</h2>
      {description && (
        <p className="text-sm text-portal-note-text">{description}</p>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
