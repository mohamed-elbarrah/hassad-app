"use client";

import { use, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  User,
  TrendingUp,
  Eye,
  AlertTriangle,
  Upload,
  Trash2,
  Download,
} from "lucide-react";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { AlertCard } from "@/components/design-system/AlertCard";
import { FileAttachmentRow } from "@/components/design-system/FileAttachmentRow";
import { EmptyState } from "@/components/common/EmptyState";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { TaskForm } from "@/components/dashboard/pm/TaskForm";
import { TaskKanban } from "@/components/dashboard/pm/TaskKanban";
import {
  useGetProjectByIdQuery,
  useGetProjectFilesQuery,
  useUploadProjectFileMutation,
  useDeleteProjectFileMutation,
} from "@/features/projects/projectsApi";
import { useAppSelector } from "@/lib/hooks";
import { ProjectStatus } from "@hassad/shared";
import { formatDate } from "@/lib/format";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_KEY,
  type ProjectWithMeta,
} from "@/lib/utils/project-status";

// ── Page ──────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const { user } = useAppSelector((state) => state.auth);
  const { data: project, isLoading, isError } = useGetProjectByIdQuery(id);
  const { data: files } = useGetProjectFilesQuery(id);
  const [uploadFile, { isLoading: isUploading }] =
    useUploadProjectFileMutation();
  const [deleteFile] = useDeleteProjectFileMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <DSSkeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <DSSkeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <DSSkeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <EmptyState
        title="المشروع غير موجود"
        description="لا يمكن الوصول إلى هذا المشروع. ربما تم حذفه أو ليس لديك صلاحية."
        actionLabel="العودة للمشاريع"
        actionHref="/dashboard/pm/projects"
      />
    );
  }

  const p = project as ProjectWithMeta;
  const progressValue = Math.round(p.progress ?? p.completionPercentage ?? 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-300">
        <Link
          href="/dashboard/pm/projects"
          className="hover:text-natural-100 transition-colors"
        >
          المشاريع
        </Link>
        <span>/</span>
        <span className="text-natural-100 font-medium">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <StatusBadge
            status={PROJECT_STATUS_BADGE_KEY[project.status as ProjectStatus]}
            label={PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
          />
        </div>
        <ProjectForm project={project} currentUserId={user.id} />
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-neutral-300 text-sm max-w-2xl">
          {project.description}
        </p>
      )}

      {/* Status banners */}
      {project.status === ProjectStatus.AWAITING_REVIEW && (
        <AlertCard variant="warning" className="flex items-center gap-3">
          <Eye className="size-5 shrink-0" />
          <span>هذا المشروع بانتظار مراجعة العميل والموافقة.</span>
        </AlertCard>
      )}
      {project.status === ProjectStatus.NEEDS_REVISION && (
        <AlertCard variant="danger" className="flex items-center gap-3">
          <AlertTriangle className="size-5 shrink-0" />
          <span>طلب العميل تعديلات على هذا المشروع.</span>
        </AlertCard>
      )}

      {/* Meta cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SurfaceCard title="الجدول الزمني" icon={Calendar}>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-300">البداية</span>
              <span>{formatDate(project.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-300">النهاية</span>
              <span>{formatDate(project.endDate)}</span>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="التقدم" icon={TrendingUp}>
          <p className="text-2xl font-bold">{progressValue}%</p>
          <div className="mt-2">
            <ProgressBar value={progressValue} variant="default" size="sm" />
          </div>
        </SurfaceCard>

        <SurfaceCard title="المدير" icon={User}>
          <div className="text-sm space-y-1">
            {p.manager ? (
              <p className="font-medium">{p.manager.name}</p>
            ) : (
              <p className="text-neutral-300">—</p>
            )}
          </div>
        </SurfaceCard>
      </div>

      {/* Tasks section */}
      <SurfaceCard title="المهام" action={<TaskForm projectId={id} />}>
        <TaskKanban projectId={id} />
      </SurfaceCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SurfaceCard title="الفريق">
          <p className="text-sm text-neutral-300">
            أعضاء الفريق وتوزيع الأدوار سيظهرون هنا.
          </p>
        </SurfaceCard>
        <SurfaceCard title="المحادثة">
          <p className="text-sm text-neutral-300">
            سجل المحادثات سيكون متاحاً هنا.
          </p>
        </SurfaceCard>
        <SurfaceCard title="التسليمات">
          <p className="text-sm text-neutral-300">
            قائمة التسليمات المعتمدة ستظهر هنا.
          </p>
        </SurfaceCard>
      </div>

      {/* Project Files */}
      <SurfaceCard
        title="ملفات المشروع"
        action={
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await uploadFile({ projectId: id, file }).unwrap();
                } catch {}
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <ActionButton
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="size-4" />}
            >
              {isUploading ? "جارٍ الرفع..." : "رفع ملف"}
            </ActionButton>
          </div>
        }
      >
        {!files || files.length === 0 ? (
          <p className="text-sm text-neutral-300">
            لا توجد ملفات مرفقة بعد. ارفع ملفات يراها العميل عند مراجعة المشروع.
          </p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <FileAttachmentRow
                key={file.id}
                filename={file.fileName}
                size={`${(file.fileSize / 1024).toFixed(0)} KB`}
                action={
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={file.url || buildPortalFileUrl(file.filePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        icon={<Download className="size-4" />}
                      >
                        {""}
                      </ActionButton>
                    </a>
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      className="text-danger-500 hover:text-danger-500"
                      onClick={async () => {
                        try {
                          await deleteFile({
                            projectId: id,
                            fileId: file.id,
                          }).unwrap();
                        } catch {}
                      }}
                      icon={<Trash2 className="size-4" />}
                    >
                      {""}
                    </ActionButton>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}