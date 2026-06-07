"use client";

import {
  useGetPaymentTicketsQuery,
  useResolvePaymentTicketMutation,
} from "@/features/finance/financeApi";
import { ActionButton } from "@/components/design-system/ActionButton";
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
  PENDING: "معلّقة",
  COLLECTION: "تحصيل",
  PAID: "مدفوعة",
  LATE: "متأخرة",
};

const STATUS_PILL_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "blue"> = {
  PENDING: "warning",
  COLLECTION: "blue",
  PAID: "success",
  LATE: "danger",
};

export default function FinanceTicketsPage() {
  const { data, isLoading, isError } = useGetPaymentTicketsQuery({ limit: 30 });
  const [resolveTicket, { isLoading: resolving }] = useResolvePaymentTicketMutation();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">التذاكر المالية</h1>
        <p className="text-sm text-neutral-300 mt-1">
          طلبات مالية داخلية ومتابعة الحالة.
        </p>
      </div>

      <SurfaceCard title={data ? `قائمة التذاكر (${data.total})` : "قائمة التذاكر"}>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-danger-500">حدث خطأ أثناء تحميل التذاكر.</p>
        )}
        {!isLoading && !isError && data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">ملاحظات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-neutral-300 py-8">
                    لا توجد تذاكر مالية.
                  </TableCell>
                </TableRow>
              )}
              {data.items.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {ticket.notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Pill tone={STATUS_PILL_TONE[ticket.status] ?? "neutral"}>
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </Pill>
                  </TableCell>
                  <TableCell dir="ltr">
                    {new Date(ticket.createdAt).toLocaleDateString("ar-DZ")}
                  </TableCell>
                  <TableCell>
                    {ticket.status !== "PAID" && (
                      <ActionButton
                        variant="outline"
                        size="sm"
                        disabled={resolving}
                        onClick={() => resolveTicket(ticket.id)}
                      >
                        إنهاء
                      </ActionButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>
    </div>
  );
}
