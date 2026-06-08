"use client";

import { useGetInvoicesQuery } from "@/features/finance/financeApi";
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
import { InvoiceStatus } from "@hassad/shared";

const STATUS_LABELS: Record<string, string> = {
  DUE: "مستحقة",
  SENT: "مُرسلة",
  PAID: "مدفوعة",
  LATE: "متأخرة",
  CANCELLED: "ملغاة",
};

const STATUS_PILL_TONE: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "blue"
> = {
  DUE: "warning",
  SENT: "blue",
  PAID: "success",
  LATE: "danger",
  CANCELLED: "neutral",
};

function fmt(n: number) {
  return n.toLocaleString("ar-DZ");
}

export default function FinanceInvoicesPage() {
  const { data, isLoading, isError } = useGetInvoicesQuery({ limit: 50 });

  const counts = {
    due:
      data?.items.filter(
        (i) =>
          i.status === InvoiceStatus.DUE || i.status === InvoiceStatus.SENT,
      ).length ?? 0,
    paid:
      data?.items.filter((i) => i.status === InvoiceStatus.PAID).length ?? 0,
    late:
      data?.items.filter((i) => i.status === InvoiceStatus.LATE).length ?? 0,
  };

  const SUMMARY = [
    { label: "مستحقة", value: counts.due },
    { label: "مدفوعة", value: counts.paid },
    { label: "متأخرة", value: counts.late },
  ];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الفواتير</h1>
        <p className="text-sm text-neutral-300 mt-1">
          متابعة الفواتير المستحقة والمدفوعة والمتأخرة.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SUMMARY.map((item) => (
          <div
            key={item.label}
            className="overflow-hidden rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0"
          >
            <div className="flex flex-col gap-4 px-5 py-4">
              <h2 className="text-sm text-neutral-300">{item.label}</h2>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-semibold">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <SurfaceCard
        title={data ? `قائمة الفواتير (${data.total})` : "قائمة الفواتير"}
      >
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-danger-500">
            حدث خطأ أثناء تحميل الفواتير.
          </p>
        )}
        {!isLoading && !isError && data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">القيمة</TableHead>
                <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-neutral-300 py-8"
                  >
                    لا توجد فواتير.
                  </TableCell>
                </TableRow>
              )}
              {data.items.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell dir="ltr" className="font-mono text-sm">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {invoice.client?.companyName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Pill tone={STATUS_PILL_TONE[invoice.status] ?? "neutral"}>
                      {STATUS_LABELS[invoice.status] ?? invoice.status}
                    </Pill>
                  </TableCell>
                  <TableCell dir="ltr">{fmt(invoice.amount)} دج</TableCell>
                  <TableCell dir="ltr">
                    {new Date(invoice.dueDate).toLocaleDateString("ar-DZ")}
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
