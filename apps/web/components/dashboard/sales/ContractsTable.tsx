"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, Eye, Link2, Copy, CheckCheck } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { TableRow, TableCell } from "@/components/ui/table";
import { Pill } from "@/components/design-system/Pill";
import { ContractStatus } from "@hassad/shared";
import type { ContractItem as ContractListItem } from "@/features/contracts/contractsApi";
import { formatShortDate } from "@/lib/format";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";

const STATUS_META: Record<
  ContractStatus,
  { label: string; tone: import("@/components/design-system/Pill").PillTone }
> = {
  [ContractStatus.DRAFT]: { label: "مسودة", tone: "neutral" },
  [ContractStatus.SENT]: { label: "مرسل", tone: "warning" },
  [ContractStatus.SIGNED]: { label: "موقع", tone: "blue" },
  [ContractStatus.ACTIVE]: { label: "نشط", tone: "success" },
  [ContractStatus.EXPIRED]: { label: "منتهي", tone: "danger" },
  [ContractStatus.CANCELLED]: { label: "ملغى", tone: "danger" },
};

const CONTRACT_COLUMNS: DataTableColumn[] = [
  { id: "client", label: "العميل", align: "right" },
  { id: "totalValue", label: "القيمة", align: "right" },
  { id: "period", label: "الفترة", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "actions", label: "إجراءات", align: "left" },
];

const CONTRACT_EMPTY: DataTableEmptyState = {
  icon: FileText,
  message: "لا توجد عقود بعد.",
  hint: "أنشئ عقداً جديداً من صفحة العروض بعد اعتمادها.",
};

interface ContractsTableProps {
  contracts: ContractListItem[];
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopyLink(token: string | null | undefined, id: string) {
    if (!token) return;
    const url = `${window.location.origin}/contract/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("تم نسخ رابط التوقيع");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  }

  return (
    <DataTable
      columns={CONTRACT_COLUMNS}
      data={contracts}
      isLoading={false}
      isError={false}
      emptyState={CONTRACT_EMPTY}
      renderRow={(contract) => (
        <TableRow key={contract.id}>
          <TableCell className="text-right">
            {contract.client?.companyName ?? contract.clientId}
          </TableCell>
          <TableCell className="text-right">
            <CurrencyDisplay amount={contract.totalValue} />
          </TableCell>
          <TableCell className="text-right">
            {formatShortDate(contract.startDate)} —{" "}
            {formatShortDate(contract.endDate)}
          </TableCell>
          <TableCell className="text-right">
            <Pill
              tone={STATUS_META[contract.status].tone}
              className="text-xs h-6 px-2"
            >
              {STATUS_META[contract.status].label}
            </Pill>
          </TableCell>
          <TableCell className="text-left">
            <div className="flex justify-end gap-2 items-center">
              {/* View detail — always available */}
              <Link href={`/dashboard/sales/contracts/${contract.id}`}>
                <ActionButton size="sm" variant="ghost" title="عرض العقد">
                  <Eye className="w-4 h-4" />
                </ActionButton>
              </Link>

              {/* Copy signing link — only for SENT */}
              {contract.status === ContractStatus.SENT && (
                <ActionButton
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopyLink(contract.shareLinkToken, contract.id)
                  }
                  disabled={!contract.shareLinkToken}
                  title="نسخ رابط التوقيع للعميل"
                >
                  {copiedId === contract.id ? (
                    <CheckCheck className="w-4 h-4 ml-1 text-success-600" />
                  ) : (
                    <Link2 className="w-4 h-4 ml-1" />
                  )}
                  {copiedId === contract.id ? "تم النسخ" : "نسخ الرابط"}
                </ActionButton>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    />
  );
}
