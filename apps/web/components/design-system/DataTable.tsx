import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "./Skeleton";
import { cn } from "@/lib/utils";

export interface DataTableColumn {
  id: string;
  label?: string;
  align?: "right" | "center" | "left";
  width?: string;
}

export interface DataTableEmptyState {
  icon: LucideIcon;
  message: string;
  hint: string;
}

/**
 * Renders the standard <tr> chrome (divider, hover, focus ring,
 * background) so individual row components don't have to
 * duplicate these classes. If a caller needs a fully custom row
 * (e.g. expandable rows), they can still use `renderRow` and
 * skip `renderCells`.
 */
interface QueueRowProps {
  onActivate?: () => void;
  cells: React.ReactNode[];
  className?: string;
}

function QueueRow({ onActivate, cells, className }: QueueRowProps) {
  return (
    <tr
      onClick={onActivate}
      onKeyDown={
        onActivate
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActivate();
              }
            }
          : undefined
      }
      tabIndex={onActivate ? 0 : -1}
      className={cn(
        "group border-b-[1.5px] border-portal-divider bg-natural-0",
        "outline-none transition-colors",
        onActivate && "cursor-pointer",
        onActivate && "hover:bg-primary-100/50",
        onActivate && "focus-visible:bg-primary-100/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
        className,
      )}
    >
      {cells.map((cell, idx) => (
        <Fragment key={idx}>{cell}</Fragment>
      ))}
    </tr>
  );
}

interface DataTableProps<T> {
  columns: DataTableColumn[];
  data: T[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  skeletonRows?: number;
  emptyState: DataTableEmptyState;
  /**
   * Preferred: returns the <td> elements for a single row.
   * `DataTable` owns the surrounding <tr> chrome so all rows
   * look and behave identically. `onActivate` is optional —
   * pass it to make the row clickable + keyboard-activatable.
   */
  renderCells?: (row: T, helpers: { onActivate?: () => void }) => React.ReactNode[];
  /**
   * Legacy: full custom <tr>. Use only when the row needs
   * structural variation beyond what `renderCells` supports
   * (e.g. expandable rows).
   */
  renderRow?: (row: T, index: number) => React.ReactNode;
  minWidth?: string;
  className?: string;
  /**
   * Called when a row is clicked / Enter-pressed. Used by
   * `renderCells` callers to wire up navigation.
   */
  onRowActivate?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  skeletonRows = 4,
  emptyState,
  renderCells,
  renderRow,
  minWidth,
  className,
  onRowActivate,
}: DataTableProps<T>) {
  if (isError) {
    return (
      <div className="rounded-3xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-6 text-center">
        <p className="text-base font-medium text-danger-700">
          {errorMessage ?? "حدث خطأ أثناء تحميل البيانات."}
        </p>
        <p className="mt-2 text-sm text-danger-600">
          يرجى المحاولة لاحقاً أو تحديث الصفحة.
        </p>
      </div>
    );
  }

  if (!isLoading && data.length === 0) {
    const EmptyIcon = emptyState.icon;
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-portal-card-border bg-portal-bg px-6 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-gray-bg">
          <EmptyIcon className="h-8 w-8 text-secondary-500" />
        </div>
        <p className="text-lg font-medium text-natural-100">
          {emptyState.message}
        </p>
        <p className="max-w-md text-sm leading-6 text-portal-note-text">
          {emptyState.hint}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-gry", className)}>
      <Table className={cn(minWidth ?? "min-w-full")}>
        <TableHeader className="[tr]:border-b-[1.5px] [tr]:border-portal-divider">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  "h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text",
                  col.align === "center" && "text-center",
                  col.align === "left" && "text-start",
                  col.align === "right" && "text-end",
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-[#f0f2f5] [&_tr:hover]:bg-black/[0.03]">
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, idx) => (
              <TableRow
                key={`skeleton-${idx}`}
                className="border-b-[1.5px] border-portal-divider hover:bg-transparent"
              >
                {columns.map((col, cellIdx) => (
                  <TableCell key={`${col.id}-${cellIdx}`} className="px-5 py-4">
                    <Skeleton className="h-5 w-full rounded-lg" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : renderCells ? (
            data.map((row, idx) => {
              const key = String((row as any).id ?? `row-${idx}`);
              const onActivate = onRowActivate ? () => onRowActivate(row) : undefined;
              const cells = renderCells(row, { onActivate });
              return <QueueRow key={key} cells={cells} onActivate={onActivate} />;
            })
          ) : renderRow ? (
            data.map((row, idx) => {
              const key = String((row as any).id ?? `row-${idx}`);
              return (
                <Fragment key={key}>
                  {renderRow(row, idx)}
                </Fragment>
              );
            })
          ) : (
            <TableRow className="border-b-[1.5px] border-portal-divider">
              <TableCell
                colSpan={columns.length}
                className="px-5 py-4 text-center text-sm text-portal-note-text"
              >
                —
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}