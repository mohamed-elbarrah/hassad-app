"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { StageSelect } from "@/components/dashboard/crm/StageSelect";
import type { Client } from "@hassad/shared";
import { ClientStatus, PipelineStage } from "@hassad/shared";
import { cn } from "@/lib/utils";

// ── Column helper ─────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<Client>();

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<
  ClientStatus,
  "default" | "secondary" | "destructive"
> = {
  [ClientStatus.LEAD]: "secondary",
  [ClientStatus.ACTIVE]: "default",
  [ClientStatus.STOPPED]: "destructive",
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: "عميل محتمل",
  [ClientStatus.ACTIVE]: "نشط",
  [ClientStatus.STOPPED]: "متوقف",
};

// ── Table component ───────────────────────────────────────────────────────────

interface ClientsTableProps {
  clients: Client[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ClientsTable({
  clients,
  page,
  totalPages,
  onPageChange,
}: ClientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Client, string>[] = [
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1 px-0 font-medium"
        >
          الاسم
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("phone", {
      header: "الهاتف",
      cell: (info) => (
        <span dir="ltr" className="font-mono text-sm">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("businessType", {
      header: "نوع النشاط",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("status", {
      header: "الحالة",
      cell: (info) => {
        const status = info.getValue() as ClientStatus;
        return (
          <Badge variant={STATUS_VARIANT[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("stage", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="gap-1 px-0 font-medium"
        >
          مرحلة البيع
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: (info) => (
        <StageSelect
          clientId={info.row.original.id}
          clientName={info.row.original.name}
          currentStage={info.getValue() as PipelineStage}
        />
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "تاريخ الإضافة",
      cell: (info) =>
        new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          numberingSystem: "latn",
        }).format(new Date(info.getValue())),
    }),
  ] as ColumnDef<Client, string>[];

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  لا يوجد عملاء.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination controls ──────────────────────────────────────── */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          صفحة {page} من {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="gap-1"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="gap-1"
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
