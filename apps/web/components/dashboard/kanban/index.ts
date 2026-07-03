/**
 * Unified Kanban system.
 *
 * ## Usage
 *
 * ```tsx
 * import { KanbanBoard } from "@/components/dashboard/kanban";
 * import { SALES_PIPELINE_CONFIG } from "@/components/dashboard/kanban/configs/sales-pipeline";
 * import { SalesPipelineCardContent } from "@/components/dashboard/kanban/cards/SalesPipelineCardContent";
 *
 * <KanbanBoard
 *   config={SALES_PIPELINE_CONFIG}
 *   items={requests}
 *   getItemStage={(r) => r.status}
 *   renderCard={(request, { isOverlay }) => (
 *     <SalesPipelineCardContent request={request} />
 *   )}
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
