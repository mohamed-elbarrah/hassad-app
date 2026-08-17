"use client";

import { DollarSign, FileText } from "lucide-react";
import type { PortalPeriodInvoice } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTz } from "@/lib/format";
import { useCurrency } from "@/hooks/useCurrency";
import { EmptyState } from "./EmptyState";

export function InvoiceTab({
  invoice,
}: {
  invoice: PortalPeriodInvoice | null;
}) {
  const { fmtAmount } = useCurrency();
  if (!invoice)
    return (
      <EmptyState
        icon={DollarSign}
        title="لا توجد فاتورة لهذه الفترة"
        description="سيتم إصدار فاتورة الفترة عند إغلاقها."
      />
    );
  const statusVariant =
    invoice.status === "CANCELLED" || invoice.status === "LATE"
      ? "destructive"
      : invoice.status === "PAID"
        ? "default"
        : "secondary";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign />
          فاتورة هذه الفترة
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
          <p className="text-3xl font-semibold">
            {fmtAmount(invoice.remainingAmount)}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p>
            رقم الفاتورة: <strong>{invoice.invoiceNumber}</strong>
          </p>
          <p>
            المبلغ الإجمالي: <strong>{fmtAmount(invoice.amount)}</strong>
          </p>
          <p>
            المدفوع: <strong>{fmtAmount(invoice.paidAmount)}</strong>
          </p>
          <p>
            تاريخ الاستحقاق: <strong>{formatDateTz(invoice.dueDate)}</strong>
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <Badge variant={statusVariant}>{invoice.status}</Badge>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <FileText />
            {formatDateTz(invoice.issueDate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
