"use client";

import { useGetContractsQuery } from "@/features/contracts/contractsApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pill } from "@/components/design-system/Pill";
import { Skeleton } from "@/components/design-system/Skeleton";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "مُرسل",
  SIGNED: "موقّع",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

const STATUS_PILL_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "blue"> = {
  DRAFT: "neutral",
  SENT: "blue",
  SIGNED: "success",
  ACTIVE: "success",
  EXPIRED: "warning",
  CANCELLED: "danger",
};

function fmt(n: number) {
  return n.toLocaleString("ar-DZ");
}

export default function FinanceContractsPage() {
  const { data, isLoading, isError } = useGetContractsQuery({ limit: 30 });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">العقود</h1>
        <p className="text-sm text-neutral-300 mt-1">
          قيمة العقود وحالتها لكل عميل.
        </p>
      </div>

      <SurfaceCard title={data ? `قائمة العقود (${data.total})` : "قائمة العقود"}>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-danger-500">حدث خطأ أثناء تحميل العقود.</p>
        )}
        {!isLoading && !isError && data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">قيمة العقد</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">تاريخ البداية</TableHead>
                <TableHead className="text-right">تاريخ النهاية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-neutral-300 py-8">
                    لا توجد عقود.
                  </TableCell>
                </TableRow>
              )}
              {data.items.map((contract) => {
                const clientName = contract.client?.companyName ?? "—";
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{clientName}</TableCell>
                    <TableCell dir="ltr">{fmt(contract.totalValue)} دج</TableCell>
                    <TableCell>
                      <Pill tone={STATUS_PILL_TONE[contract.status] ?? "neutral"}>
                        {STATUS_LABELS[contract.status] ?? contract.status}
                      </Pill>
                    </TableCell>
                    <TableCell dir="ltr">
                      {new Date(contract.startDate).toLocaleDateString("ar-DZ")}
                    </TableCell>
                    <TableCell dir="ltr">
                      {new Date(contract.endDate).toLocaleDateString("ar-DZ")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>
    </div>
  );
}
