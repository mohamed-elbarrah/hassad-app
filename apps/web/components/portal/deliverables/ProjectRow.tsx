"use client";

import {
  ArrowLeft,
  CircleUserRound,
  Clock,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import type { ReviewProject } from "@/features/portal/portalApi";
import { ProjectStatusPill } from "./ProjectStatusPill";
import { formatRelative } from "./utils";
import { buildPortalFileUrl, getPortalFileKind } from "@/lib/portal-files";

interface ProjectRowProps {
  project: ReviewProject;
  previews?: { id: string; fileName: string; filePath: string; url?: string }[];
  onSelect: (id: string) => void;
}

/**
 * One row of the deliverables table. The row IS the click target.
 * Keyboard-activatable. The CTA on the right is a clean gold pill —
 * the brand accent, not a chevron, and it doesn't move on hover
 * (motion is reserved for the row, not the button).
 */
export function ProjectRow({ project, previews, onSelect }: ProjectRowProps) {
  const hasFiles = project.deliverableCount > 0;

  return (
    <tr
      onClick={() => onSelect(project.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(project.id);
        }
      }}
      tabIndex={0}
      className={cn(
        "group border-b-[1.5px] border-portal-divider cursor-pointer bg-natural-0",
        "outline-none transition-colors",
        // Subtle brand-tinted hover, never translate any inner element.
        "hover:bg-primary-100/50",
        "focus-visible:bg-primary-100/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
      )}
    >
      {/* Project name + meta line */}
      <td className="px-5 py-3.5 align-middle">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-natural-100 truncate max-w-[300px]">
            {project.name}
          </span>
          <span className="inline-flex items-center gap-3 text-[11px] text-portal-note-text">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>
                آخر تحديث{" "}
                {formatRelative(project.updatedAt ?? project.createdAt)}
              </span>
            </span>
          </span>
        </div>
      </td>

      {/* Files preview */}
      <td className="px-3 py-3.5 align-middle">
        <FilePreview
          previews={previews}
          count={project.deliverableCount}
          hasFiles={hasFiles}
        />
      </td>

      {/* Manager */}
      <td className="px-3 py-3.5 align-middle">
        <ManagerCell project={project} />
      </td>

      {/* Dates */}
      <td className="px-3 py-3.5 align-middle text-[13px] text-portal-note-text tabular-nums">
        {formatRange(project.startDate, project.endDate)}
      </td>

      {/* Status */}
      <td className="px-3 py-3.5 align-middle">
        <ProjectStatusPill status={project.status} />
      </td>

      {/* CTA */}
      <td className="px-5 py-3.5 align-middle text-left w-[100px]">
        <span
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-3",
            "text-[13px] font-semibold",
            "bg-primary-100 text-primary-700",
            "ring-1 ring-inset ring-primary-200",
            "transition-colors",
            "group-hover:bg-primary-500 group-hover:text-secondary-500 group-hover:ring-primary-500",
          )}
        >
          <span>مراجعة</span>
          <ArrowLeft className="h-3.5 w-3.5" />
        </span>
      </td>
    </tr>
  );
}

// ─── Manager cell ────────────────────────────────────────────────────────────

function ManagerCell({ project }: { project: ReviewProject }) {
  const name = project.manager?.name ?? "—";

  if (!project.manager) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-portal-note-text">
        <CircleUserRound className="h-4 w-4" />
        <span>بدون مدير</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2.5 min-w-0">
      <UserAvatar name={name} size="sm" variant="circle" />
      <span className="text-[13px] text-natural-100 truncate max-w-[140px]">
        {name}
      </span>
    </div>
  );
}

// ─── File preview strip ──────────────────────────────────────────────────────

function FilePreview({
  previews,
  count,
  hasFiles,
}: {
  previews?: { id: string; fileName: string; filePath: string; url?: string }[];
  count: number;
  hasFiles: boolean;
}) {
  if (!hasFiles) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
          "text-[11px] font-medium",
          "bg-alert-100 text-alert-700 ring-1 ring-inset ring-alert-200",
        )}
        title="لم يتم إرفاق ملفات مع هذا المشروع"
      >
        <Paperclip className="h-3 w-3" />
        لا توجد مرفقات
      </span>
    );
  }

  const imagePreviews =
    previews
      ?.filter((p) => getPortalFileKind(p.fileName || p.filePath) === "image")
      .slice(0, 3) ?? [];
  const overflow = Math.max(0, count - imagePreviews.length);

  if (imagePreviews.length === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
          "text-[11px] font-medium tabular-nums",
          "bg-action-blue-soft text-action-blue ring-1 ring-inset ring-action-blue/20",
        )}
      >
        <Paperclip className="h-3 w-3" />
        <span>{count} ملف</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center -space-x-1.5 rtl:space-x-reverse">
      {imagePreviews.map((p) => {
        const src = p.url || buildPortalFileUrl(p.filePath);
        return (
          <span
            key={p.id}
            className={cn(
              "relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-md",
              "bg-portal-bg ring-2 ring-natural-0",
            )}
            title={p.fileName}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={p.fileName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-md",
            "bg-badge-gray-bg text-secondary-500 ring-2 ring-natural-0",
            "text-[10px] font-semibold tabular-nums",
          )}
          title={`${overflow} ملف إضافي`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRange(start?: string | null, end?: string | null): string {
  const s = formatShort(start);
  const e = formatShort(end);
  if (!s && !e) return "—";
  if (s && e) return `${s} — ${e}`;
  return s ?? e ?? "—";
}

function formatShort(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
