"use client";

import { FileText, ExternalLink } from "lucide-react";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import Link from "next/link";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  project?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;
}

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  totalAmount: number;
}

export function InvoiceItemsTable({ items, totalAmount }: InvoiceItemsTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-4 text-portal-note-text text-sm">
        لا توجد بنود في هذه الفاتورة
      </div>
    );
  }

  return (
    <div>
      <DataTable
        columns={[
          { id: "#", label: "#", width: "40px" },
          { id: "description", label: "الوصف" },
          { id: "project", label: "المشروع" },
          { id: "quantity", label: "الكمية", align: "center" },
          { id: "unitPrice", label: "سعر الوحدة", align: "center" },
          { id: "total", label: "الإجمالي", align: "left" },
        ]}
        data={items}
        isLoading={false}
        isError={false}
        emptyState={{
          icon: FileText,
          message: "لا توجد بنود",
          hint: "هذه الفاتورة لا تحتوي على بنود مفصلة.",
        }}
        renderCells={(item) => [
          <td key="num" className="px-4 py-3 align-middle w-10">
            <span className="text-sm text-portal-note-text">
              {items.indexOf(item) + 1}
            </span>
          </td>,
          <td key="desc" className="px-4 py-3 align-middle">
            <span className="text-sm font-medium text-natural-100">
              {item.description}
            </span>
          </td>,
          <td key="project" className="px-4 py-3 align-middle">
            {item.project ? (
              <Link
                href={`/dashboard/pm/projects/${item.project.id}`}
                className="flex items-center gap-1 text-sm text-secondary-500 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {item.project.name}
              </Link>
            ) : item.task ? (
              <Link
                href={`/dashboard/pm/tasks/${item.task.id}`}
                className="flex items-center gap-1 text-sm text-secondary-500 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {item.task.title}
              </Link>
            ) : (
              <span className="text-sm text-portal-note-text">—</span>
            )}
          </td>,
          <td key="qty" className="px-4 py-3 align-middle text-center">
            <span className="text-sm text-natural-100">{item.quantity}</span>
          </td>,
          <td key="price" className="px-4 py-3 align-middle text-center">
            <span className="text-sm text-natural-100 font-mono">
              {item.unitPrice.toLocaleString("ar-SA-u-nu-latn")}
            </span>
          </td>,
          <td key="total" className="px-4 py-3 align-middle text-start">
            <span className="text-sm font-bold text-natural-100 font-mono">
              <CurrencyDisplay amount={item.total} />
            </span>
          </td>,
        ]}
      />

      {/* Totals footer */}
      <div className="px-4 py-3 border-t border-portal-divider flex justify-between items-center">
        <span className="text-sm font-medium text-portal-note-text">المجموع</span>
        <span className="text-base font-bold text-natural-100 font-mono">
          <CurrencyDisplay amount={totalAmount} />
        </span>
      </div>
    </div>
  );
}
