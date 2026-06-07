"use client";

import { toast } from "sonner";
import { FileText } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ContractStatus } from "@hassad/shared";
import type { ContractItem as ContractListItem } from "@/features/contracts/contractsApi";
import {
  useSendContractMutation,
  useSignContractMutation,
} from "@/features/contracts/contractsApi";
import { useAppSelector } from "@/lib/hooks";

const STATUS_LABELS: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "مسودة",
  [ContractStatus.SENT]: "مرسل",
  [ContractStatus.SIGNED]: "موقع",
  [ContractStatus.ACTIVE]: "نشط",
  [ContractStatus.EXPIRED]: "منتهي",
  [ContractStatus.CANCELLED]: "ملغى",
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
  hint: "أنشئ عقداً جديداً من صفحة لوحة المبيعات أو من صفحة العروض.",
};

interface ContractsTableProps {
  contracts: ContractListItem[];
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [sendContract, { isLoading: sending }] = useSendContractMutation();
  const [signContract, { isLoading: signing }] = useSignContractMutation();

  async function handleSend(id: string) {
    try {
      await sendContract(id).unwrap();
      toast.success("تم إرسال العقد بنجاح");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل إرسال العقد";
      toast.error(message);
    }
  }

  async function handleSign(id: string) {
    if (!user) return;
    try {
      await signContract({
        id,
        body: {
          signedByName: user.name,
          signedByEmail: user.email ?? undefined,
        },
      }).unwrap();
      toast.success("تم توقيع العقد بنجاح");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل توقيع العقد";
      toast.error(message);
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
            {contract.totalValue.toLocaleString("en-US")}
          </TableCell>
          <TableCell className="text-right">
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              numberingSystem: "latn",
            }).format(new Date(contract.startDate))}{" "}
            -{" "}
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              numberingSystem: "latn",
            }).format(new Date(contract.endDate))}
          </TableCell>
          <TableCell className="text-right">
            {STATUS_LABELS[contract.status]}
          </TableCell>
          <TableCell className="text-left">
            <div className="flex justify-end gap-2">
              {contract.status === ContractStatus.DRAFT && (
                <ActionButton
                  size="sm"
                  variant="primary"
                  onClick={() => handleSend(contract.id)}
                  loading={sending}
                >
                  إرسال
                </ActionButton>
              )}
              {contract.status === ContractStatus.SENT && (
                <ActionButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleSign(contract.id)}
                  loading={signing}
                >
                  توقيع
                </ActionButton>
              )}
              {contract.status === ContractStatus.SIGNED && (
                <ActionButton size="sm" variant="ghost" disabled>
                  تم التوقيع
                </ActionButton>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    />
  );
}
