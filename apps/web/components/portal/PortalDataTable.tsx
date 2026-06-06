import type { LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PortalSkeleton } from "./PortalSkeleton";
import { cn } from "@/lib/utils";

export interface PortalDataTableColumn {
  id: string;
  label?: string;
  align?: "right" | "center" | "left";
  width?: string;
}

export interface PortalDataTableEmptyState {
  icon: LucideIcon;
  message: string;
  hint: string;
}

interface PortalDataTableProps<T> {
  columns: PortalDataTableColumn[];
  data: T[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  skeletonRows?: number;
  emptyState: PortalDataTableEmptyState;
  renderRow?: (row: T, index: number) => React.ReactNode;
  minWidth?: string;
  className?: string;
}

export function PortalDataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  skeletonRows = 4,
  emptyState,
  renderRow,
  minWidth,
  className,
}: PortalDataTableProps<T>) {
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
        <p className="text-lg font-medium text-natural-100">{emptyState.message}</p>
        <p className="max-w-md text-sm leading-6 text-portal-note-text">{emptyState.hint}</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table className={cn(minWidth ?? "min-w-full", "border-collapse")}>
        <TableHeader className="[tr]:border-b-[1.5px] [tr]:border-portal-divider">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  "h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text",
                  col.align === "center" && "text-center",
                  col.align === "left" && "text-left",
                  (!col.align || col.align === "right") && "text-right",
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody
          className="[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-[#f0f2f5] [&_tr:hover]:bg-black/[0.03]"
        >
          {isLoading
            ? Array.from({ length: skeletonRows }).map((_, idx) => (
                <TableRow
                  key={`skeleton-${idx}`}
                  className="border-b-[1.5px] border-portal-divider hover:bg-transparent"
                >
                  {columns.map((col, cellIdx) => (
                    <TableCell key={`${col.id}-${cellIdx}`} className="px-5 py-4">
                      <PortalSkeleton className="h-5 w-full rounded-lg" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : renderRow
              ? data.map((row, idx) => renderRow(row, idx))
              : (
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
