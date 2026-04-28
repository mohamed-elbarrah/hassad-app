"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContractStatus } from "@hassad/shared";
import type { ContractListItem } from "@/features/contracts/contractsApi";
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العميل</TableHead>
            <TableHead>القيمة</TableHead>
            <TableHead>الفترة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="text-right">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                لا توجد عقود بعد.
              </TableCell>
            </TableRow>
          ) : (
            contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>
                  {contract.client?.companyName ?? contract.clientId}
                </TableCell>
                <TableCell>{contract.totalValue.toLocaleString("en-US")}</TableCell>
                <TableCell>
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
                <TableCell>{STATUS_LABELS[contract.status]}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {contract.status === ContractStatus.DRAFT && (
                      <Button
                        size="sm"
                        onClick={() => handleSend(contract.id)}
                        disabled={sending}
                      >
                        إرسال
                      </Button>
                    )}
                    {contract.status === ContractStatus.SENT && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSign(contract.id)}
                        disabled={signing}
                      >
                        توقيع
                      </Button>
                    )}
                    {contract.status === ContractStatus.SIGNED && (
                      <Button size="sm" variant="secondary" disabled>
                        تم التوقيع
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
