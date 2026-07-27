import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { SalesDetailError } from "./SalesDetailError";
import { SalesEmptyState } from "./SalesEmptyState";

export interface SalesTableColumn {
  id: string;
  label?: string;
  align?: "right" | "center" | "left";
  width?: string;
}

interface SalesTableEmptyState {
  icon: LucideIcon;
  message: string;
  hint: string;
}

interface SalesDataTableProps<T> {
  columns: SalesTableColumn[];
  data: T[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  skeletonRows?: number;
  emptyState: SalesTableEmptyState;
  renderCells?: (
    row: T,
    helpers: { onActivate?: () => void },
  ) => React.ReactNode[];
  renderRow?: (row: T, index: number) => React.ReactNode;
  minWidth?: string;
  className?: string;
  onRowActivate?: (row: T) => void;
}

function SalesTableRow({
  onActivate,
  cells,
  className,
}: {
  onActivate?: () => void;
  cells: React.ReactNode[];
  className?: string;
}) {
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
        "border-b border-border bg-background outline-none transition-colors",
        onActivate && "cursor-pointer hover:bg-muted/60",
        onActivate &&
          "focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className,
      )}
    >
      {cells.map((cell, idx) => (
        <Fragment key={idx}>{cell}</Fragment>
      ))}
    </tr>
  );
}

export function SalesDataTable<T>({
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
}: SalesDataTableProps<T>) {
  if (isError) {
    return <SalesDetailError title={errorMessage ?? "حدث خطأ أثناء تحميل البيانات."} />;
  }

  if (!isLoading && data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10">
        <SalesEmptyState
          icon={emptyState.icon}
          title={emptyState.message}
          description={emptyState.hint}
        />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <Table className={cn(minWidth ?? "min-w-full")}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  "h-12 whitespace-nowrap px-5 text-sm font-medium text-muted-foreground",
                  col.align === "center" && "text-center",
                  col.align === "left" && "text-end",
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, idx) => (
              <TableRow key={`skeleton-${idx}`} className="hover:bg-transparent">
                {columns.map((col, cellIdx) => (
                  <TableCell key={`${col.id}-${cellIdx}`} className="px-5 py-4">
                    <Skeleton className="h-5 w-full rounded-lg" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : renderCells ? (
            data.map((row, idx) => {
              const key = String((row as { id?: string }).id ?? `row-${idx}`);
              const onActivate = onRowActivate
                ? () => onRowActivate(row)
                : undefined;
              const cells = renderCells(row, { onActivate });
              return <SalesTableRow key={key} cells={cells} onActivate={onActivate} />;
            })
          ) : renderRow ? (
            data.map((row, idx) => {
              const key = String((row as { id?: string }).id ?? `row-${idx}`);
              return <Fragment key={key}>{renderRow(row, idx)}</Fragment>;
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="px-5 py-4 text-center text-sm text-muted-foreground"
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
