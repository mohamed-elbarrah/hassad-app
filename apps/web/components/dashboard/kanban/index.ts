/**
 * Unified Kanban system.
 *
 * ## Usage
 *
 * ```tsx
 * import { KanbanBoard } from "@/components/dashboard/kanban";
 *
 * <KanbanBoard
 *   config={config}
 *   items={items}
 *   getItemStage={(item) => item.status}
 *   renderCard={(item, { isOverlay }) => <CardContent item={item} />}
 *   onDragEnd={handleDragEnd}
 * />
 * ```
 */

export { KanbanBoard } from "./KanbanBoard";
export { KanbanGroup } from "./KanbanGroup";
export { KanbanColumn } from "./KanbanColumn";
export { KanbanCard } from "./KanbanCard";
export { KanbanStandaloneColumn } from "./KanbanStandaloneColumn";

export type {
  KanbanConfig,
  KanbanStageConfig,
  KanbanGroupConfig,
  KanbanBoardProps,
} from "./types";
