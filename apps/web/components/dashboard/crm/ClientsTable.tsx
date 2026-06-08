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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Client } from "@hassad/shared";
import { ClientStatus } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Pill } from "@/components/design-system/Pill";

// ── Column helper ─────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<Client>();

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: "نشط",
  [ClientStatus.STOPPED]: "متوقف",
  [ClientStatus.LEAD]: "عميل محتمل",
};

const STATUS_TONE: Record<
  ClientStatus,
  import("@/components/design-system/Pill").PillTone
> = {
  [ClientStatus.ACTIVE]: "success",
  [ClientStatus.STOPPED]: "danger",
  [ClientStatus.LEAD]: "purple",
};

// ── Table component ───────────────────────────────────────────────────────────

interface ClientsTableProps {
  clients: Client[];
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
}

export function ClientsTable({
  clients,
  page,
  totalPages,
  total = 0,
  limit = 20,
  onPageChange,
}: ClientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const columns = [
    columnHelper.accessor("companyName", {
      id: "companyName",
      header: "الشركة",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{info.getValue()}</span>
          {info.row.original.businessName && (
            <span className="text-xs text-neutral-300">
              {info.row.original.businessName}
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("contactName", {
      id: "contactName",
      header: "المسؤول",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("phoneWhatsapp", {
      id: "phoneWhatsapp",
      header: "الجوّال / واتساب",
      cell: (info) => (
        <span dir="ltr" className="font-mono text-sm">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("email", {
      id: "email",
      header: "البريد الإلكتروني",
      cell: (info) => (
        <span dir="ltr" className="font-mono text-sm">
          {info.getValue() || "—"}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      id: "status",
      header: "الحالة",
      cell: (info) => {
        const status = info.getValue() as ClientStatus;
        return (
          <Pill tone={STATUS_TONE[status]} className="text-xs h-6 px-2">
            {STATUS_LABELS[status]}
          </Pill>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      id: "createdAt",
      header: "تاريخ الإضافة",
      cell: (info) =>
        new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          numberingSystem: "latn",
        }).format(new Date(info.getValue())),
    }),
  ] as ColumnDef<Client, unknown>[];

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <div className="rounded-[30px] border-[1.5px] border-portal-card-border overflow-hidden">
        <Table>
          <TableHeader className="[tr]:border-b-[1.5px] [tr]:border-portal-divider">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 whitespace-nowrap px-5 text-sm font-medium text-portal-note-text"
                  >
                    {header.column.getCanSort() ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-[#f0f2f5] [&_tr:hover]:bg-black/[0.03]">
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b-[1.5px] border-portal-divider hover:bg-transparent text-right"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-5 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-neutral-300">
          صفحة {page} من {totalPages} ({total} عميل)
        </p>
        <div className="flex gap-2">
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={!canPrev}
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </ActionButton>
          <ActionButton
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={!canNext}
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </ActionButton>
        </div>
      </div>
    </>
  );
}
