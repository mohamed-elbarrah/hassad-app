/**
 * Centralized project status utilities.
 *
 * Single source of truth for Arabic labels, StatusBadge keys, and kanban
 * tone classes. Every component should import from here instead of defining
 * its own map.
 */
import { ProjectStatus, PROJECT_STATUS_AR, type Project } from "@hassad/shared";
import { KANBAN_TONES, type KanbanToneClasses } from "@/components/dashboard/kanban/theme";

// ── Extended project type (includes API relations) ──────────────────────────
// The backend /projects endpoint returns client, manager, _count fields
// that the base Project type doesn't include.

export interface ProjectWithMeta extends Project {
  client?: { id: string; companyName: string };
  manager?: { id: string; name: string } | null;
  _count?: { tasks: number };
  completionPercentage?: number;
  contract?: {
    id: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    numberOfMonths?: number | null;
  } | null;
}

// ── StatusBadge key mapping ────────────────────────────────────────────────
// Maps ProjectStatus enum values to the keys accepted by <StatusBadge />.

export const PROJECT_STATUS_BADGE_KEY: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "DRAFT",
  [ProjectStatus.ACTIVE]: "ACTIVE",
  [ProjectStatus.ON_HOLD]: "STOPPED",
  [ProjectStatus.PENDING_ACTIVATION]: "PENDING",
  [ProjectStatus.AWAITING_REVIEW]: "PENDING",
  [ProjectStatus.NEEDS_REVISION]: "REJECTED",
  [ProjectStatus.COMPLETED]: "COMPLETED",
  [ProjectStatus.CANCELLED]: "CANCELLED",
};

// ── Kanban tone classes (distinct per status) ─────────────────────────────
// Each status has a consistent tokenized tone for dashboard surfaces.

export const PROJECT_STATUS_TONES: Record<
  ProjectStatus,
  KanbanToneClasses
> = {
  [ProjectStatus.PLANNING]: KANBAN_TONES.neutral,
  [ProjectStatus.PENDING_ACTIVATION]: KANBAN_TONES.neutral,
  [ProjectStatus.ACTIVE]: KANBAN_TONES.blue,
  [ProjectStatus.ON_HOLD]: KANBAN_TONES.yellow,
  [ProjectStatus.AWAITING_REVIEW]: KANBAN_TONES.purple,
  [ProjectStatus.NEEDS_REVISION]: KANBAN_TONES.orange,
  [ProjectStatus.COMPLETED]: KANBAN_TONES.green,
  [ProjectStatus.CANCELLED]: KANBAN_TONES.red,
};

// ── All statuses in kanban order (left to right flow) ───────────────────────
// Flattened layout: all 7 statuses inline, no grouping.

export const KANBAN_STATUS_ORDER: ProjectStatus[] = [
  ProjectStatus.PLANNING,
  ProjectStatus.ACTIVE,
  ProjectStatus.ON_HOLD,
  ProjectStatus.AWAITING_REVIEW,
  ProjectStatus.NEEDS_REVISION,
  ProjectStatus.COMPLETED,
  ProjectStatus.CANCELLED,
];

// ── Re-export the shared Arabic labels for convenience ──────────────────────

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> =
  PROJECT_STATUS_AR;

// Compatibility color map for older PM dashboard summary widgets.
// New kanban surfaces should use PROJECT_STATUS_TONES instead.
export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "#64748b",
  [ProjectStatus.PENDING_ACTIVATION]: "#64748b",
  [ProjectStatus.ACTIVE]: "#2563eb",
  [ProjectStatus.ON_HOLD]: "#d97706",
  [ProjectStatus.AWAITING_REVIEW]: "#7c3aed",
  [ProjectStatus.NEEDS_REVISION]: "#ea580c",
  [ProjectStatus.COMPLETED]: "#16a34a",
  [ProjectStatus.CANCELLED]: "#dc2626",
};

/** @deprecated Groups are no longer used. Use KANBAN_STATUS_ORDER instead. */
export const PROJECT_KANBAN_GROUPS = [
  { id: "planning", label: "التخطيط", statuses: [ProjectStatus.PLANNING] },
  {
    id: "execution",
    label: "التنفيذ",
    statuses: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD],
  },
  {
    id: "review",
    label: "المراجعة",
    statuses: [ProjectStatus.AWAITING_REVIEW, ProjectStatus.NEEDS_REVISION],
  },
  {
    id: "closure",
    label: "الإغلاق",
    statuses: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
  },
] as const;
