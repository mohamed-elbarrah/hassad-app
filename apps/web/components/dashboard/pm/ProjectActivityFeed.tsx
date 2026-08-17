"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock, FileText, FolderKanban, AlertCircle, Upload, RefreshCw } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";
import { TaskStatus } from "@hassad/shared";
import type { ProjectFile } from "@/features/projects/projectsApi";
import type { Task } from "@hassad/shared";

// ── Types ────────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  type:
    | "status_change"
    | "file_upload"
    | "task_created"
    | "task_completed"
    | "milestone"
    | "comment";
  title: string;
  description?: string;
  user?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ProjectActivityFeedProps {
  projectStatus: string;
  projectStatusChangedAt?: string;
  files?: ProjectFile[];
  tasks?: Task[];
  projectManagerName?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectActivityFeed({
  projectStatus,
  projectStatusChangedAt,
  files = [],
  tasks = [],
  projectManagerName,
}: ProjectActivityFeedProps) {
  // Generate activity items from existing data
  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Project creation (simulated from first file or task date, or use current)
    items.push({
      id: "project-created",
      type: "milestone",
      title: "تم إنشاء المشروع",
      description: projectManagerName
        ? `بواسطة ${projectManagerName}`
        : undefined,
      timestamp: String(
        files[0]?.uploadedAt ?? tasks[0]?.createdAt ?? new Date().toISOString(),
      ),
    });

    // Status changes (simulated)
    if (projectStatus !== "PLANNING" && projectStatusChangedAt) {
      items.push({
        id: "status-change",
        type: "status_change",
        title: "تغيير حالة المشروع",
        description: `تم التغيير إلى "${PROJECT_STATUS_LABELS[projectStatus as keyof typeof PROJECT_STATUS_LABELS] ?? projectStatus}"`,
        timestamp: projectStatusChangedAt,
      });
    }

    // File uploads
    files.slice(0, 5).forEach((file) => {
      items.push({
        id: `file-${file.id}`,
        type: "file_upload",
        title: "تم رفع ملف جديد",
        description: file.fileName,
        timestamp: String(file.uploadedAt),
      });
    });

    // Task activities
    tasks.forEach((task) => {
      if (task.status === TaskStatus.DONE) {
        items.push({
          id: `task-done-${task.id}`,
          type: "task_completed",
          title: "تم إنجاز مهمة",
          description: task.title,
          timestamp: String(task.updatedAt ?? task.createdAt),
        });
      } else {
        items.push({
          id: `task-${task.id}`,
          type: "task_created",
          title: "تم إنشاء مهمة جديدة",
          description: task.title,
          timestamp: String(task.createdAt),
        });
      }
    });

    // Sort by timestamp (newest first)
    return items
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);
  }, [projectStatus, projectStatusChangedAt, files, tasks, projectManagerName]);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "status_change":
        return <RefreshCw className="w-4 h-4 text-secondary-500" />;
      case "file_upload":
        return <Upload className="w-4 h-4 text-primary-500" />;
      case "task_created":
        return <FolderKanban className="w-4 h-4 text-portal-note-text" />;
      case "task_completed":
        return <CheckCircle2 className="w-4 h-4 text-success-500" />;
      case "milestone":
        return <Clock className="w-4 h-4 text-warning-500" />;
      case "comment":
        return <AlertCircle className="w-4 h-4 text-info-500" />;
      default:
        return <FileText className="w-4 h-4 text-portal-note-text" />;
    }
  };

  const getActivityBg = (type: ActivityItem["type"]) => {
    switch (type) {
      case "status_change":
        return "bg-secondary-50";
      case "file_upload":
        return "bg-primary-50";
      case "task_created":
        return "bg-badge-gray-bg";
      case "task_completed":
        return "bg-success-100/50";
      case "milestone":
        return "bg-alert-100/50";
      case "comment":
        return "bg-action-blue-soft";
      default:
        return "bg-badge-gray-bg";
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-portal-note-text mx-auto mb-3" />
        <p className="text-sm text-portal-note-text">لا توجد نشاطات حديثة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3 relative">
          {/* Timeline line */}
          {index < activities.length - 1 && (
            <div className="absolute start-[19px] top-10 bottom-0 w-px bg-portal-divider" />
          )}

          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getActivityBg(
              activity.type,
            )}`}
          >
            {getActivityIcon(activity.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-4">
            <p className="text-sm font-medium text-natural-100">
              {activity.title}
            </p>
            {activity.description && (
              <p className="text-xs text-portal-note-text mt-0.5 line-clamp-1">
                {activity.description}
              </p>
            )}
            <p className="text-[11px] text-portal-note-text mt-1">
              {formatRelativeTime(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
