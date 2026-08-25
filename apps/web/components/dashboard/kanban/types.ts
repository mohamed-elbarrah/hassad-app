/**
 * Core types for the unified Kanban system.
 *
 * Every variant (sales pipeline, project status, task status) provides a
 * KanbanConfig that describes its stages, colours, and grouping.  The board
 * component is generic over the item type <T>.
 */

// ─── Stage visual theme ──────────────────────────────────────────────────────

export interface KanbanStageConfig {
  /** Arabic label shown in the column header */
  label: string;
  /** Token class for the stage dot */
  dotClass: string;
  /** Token class for the tinted header band */
  bandClass: string;
  /** Token class for the cards area */
  surfaceClass: string;
  /** Token class for the stage count badge */
  countClass: string;
  /** Text shown when the column is empty (default: "لا يوجد") */
  emptyLabel?: string;
}

// ─── Group definition (optional — used by sales pipeline) ────────────────────

export interface KanbanGroupConfig {
  id: string;
  label: string;
  /** Stage IDs that belong to this group */
  stages: string[];
}

// ─── Full board configuration ────────────────────────────────────────────────

export interface KanbanConfig {
  /**
   * Group definitions.  When non-empty the board renders a grouped layout
   * (groups → columns → cards).  When empty the board renders a flat layout
   * (standalone columns → cards).
   */
  groups: KanbanGroupConfig[];
  /** Map of stage ID → visual config */
  stages: Record<string, KanbanStageConfig>;
  /** Ordered list of all stage IDs (determines left-to-right / RTL order) */
  stageOrder: string[];
}

// ─── Board component props ───────────────────────────────────────────────────

export interface KanbanStagePagination {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export interface KanbanBoardProps<T extends { id: string }> {
  /** Stage/group configuration */
  config: KanbanConfig;
  /** All items to display across all stages */
  items: T[];
  /** Extract the stage ID from an item */
  getItemStage: (item: T) => string;
  /**
   * Render the content of a single card.
   * The board wraps this content in a draggable container.
   */
  renderCard: (item: T, options: { isOverlay: boolean }) => React.ReactNode;
  /**
   * Called when a card is dropped on a different stage.
   * The consumer handles API calls, optimistic updates, error toasts, etc.
   */
  onDragEnd: (
    itemId: string,
    fromStage: string,
    toStage: string,
  ) => Promise<void> | void;

  // ── Optional state overrides ──────────────────────────────────────────
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;

  // ── Optional behaviour ────────────────────────────────────────────────
  /** Return false to prevent dragging an item (e.g. permission check) */
  canDragItem?: (item: T) => boolean;
  /** Return false to prevent dropping an item into a destination stage */
  canDropItem?: (item: T, destinationStage: string) => boolean;
  /** Called when a user releases a card on an invalid destination */
  onInvalidDrop?: (item: T, destinationStage: string) => void;

  // ── Optional render overrides ─────────────────────────────────────────
  renderLoadingSkeleton?: () => React.ReactNode;
  /** Independent pagination state for each stage (columns auto-load on scroll). */
  stagePagination?: Record<string, KanbanStagePagination>;
}
