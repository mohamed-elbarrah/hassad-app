/**
 * Centralized project status utilities.
 *
 * Single source of truth for Arabic labels, StatusBadge keys, and kanban
 * dot colours.  Every component should import from here instead of defining
 * its own map.
 */
import { ProjectStatus, PROJECT_STATUS_AR, type Project } from "@hassad/shared";

// ── Extended project type (includes API relations) ──────────────────────────
// The backend /projects endpoint returns client, manager, _count fields
// that the base Project type doesn't include.

export interface ProjectWithMeta extends Project {
  client?: { id: string; companyName: string };
  manager?: { id: string; name: string };
  _count?: { tasks: number };
  completionPercentage?: number;
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

// ── Kanban status colors (distinct per status) ─────────────────────────────
// Each status has a unique color for clear visual differentiation.

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "#6B7280",      // Cool grey - not started
  [ProjectStatus.PENDING_ACTIVATION]: "#94A3B8", // Slate - awaiting activation
  [ProjectStatus.ACTIVE]: "#3B82F6",        // Blue - in progress
  [ProjectStatus.ON_HOLD]: "#F59E0B",       // Amber - paused
  [ProjectStatus.AWAITING_REVIEW]: "#8B5CF6", // Purple - waiting external
  [ProjectStatus.NEEDS_REVISION]: "#F97316", // Orange - attention needed (not as severe as red)
  [ProjectStatus.COMPLETED]: "#10B981",     // Emerald - success
  [ProjectStatus.CANCELLED]: "#EF4444",     // Red - terminal/cancelled
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

// ── Deprecated exports (kept for backwards compatibility) ─────────────────
// These will be removed in future. Use PROJECT_STATUS_COLOR instead.

/** @deprecated Use PROJECT_STATUS_COLOR for distinct per-status colors */
export const PROJECT_STATUS_DOT_COLOR = PROJECT_STATUS_COLOR;

/** @deprecated Groups are no longer used. Use KANBAN_STATUS_ORDER instead. */
export const PROJECT_KANBAN_GROUPS = [
  { id: "planning", label: "التخطيط", statuses: [ProjectStatus.PLANNING] },
  { id: "execution", label: "التنفيذ", statuses: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD] },
  { id: "review", label: "المراجعة", statuses: [ProjectStatus.AWAITING_REVIEW, ProjectStatus.NEEDS_REVISION] },
  { id: "closure", label: "الإغلاق", statuses: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] },
] as const;