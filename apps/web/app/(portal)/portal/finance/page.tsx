"use client";

import { useGetPortalInvoicesQuery } from "@/features/portal/portalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/portal/PaymentModal";
import { useState } from "react";
import { CreditCard } from "lucide-react";

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DUE: "مستحقة",
  SENT: "مُرسلة",
  PAID: "مدفوعة",
  PARTIAL: "مدفوعة جزئياً",
  LATE: "متأخرة",
  CANCELLED: "ملغاة",
  PENDING: "معلقة",
};

const INVOICE_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DUE: "outline",
  SENT: "default",
  PAID: "secondary",
  PARTIAL: "default",
  LATE: "destructive",
  CANCELLED: "secondary",
  PENDING: "outline",
};

function fmt(n: number) {
  return n.toLocaleString("ar-SA");
}

export default function PortalFinancePage() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: invoicesData, isLoading: invoicesLoading } = useGetPortalInvoicesQuery(
    { page: 1, limit: 20 },
  );

  const invoices = invoicesData?.data ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الصفحة المالية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          الفواتير والمدفوعات الخاصة بك.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {!invoicesLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الفاتورة</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      لا توجد فواتير.
                    </TableCell>
                  </TableRow>
                )}
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell dir="ltr" className="font-mono text-sm">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell dir="ltr">{fmt(invoice.amount)} ر.س</TableCell>
                    <TableCell>
                      <Badge variant={INVOICE_STATUS_VARIANT[invoice.status] ?? "outline"}>
                        {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell dir="ltr">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("ar-SA") : "—"}
                    </TableCell>
                    <TableCell>
                      {(invoice.status === "DUE" || invoice.status === "SENT" || invoice.status === "PARTIAL") && (
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <CreditCard className="w-3 h-3 ml-2" />
                          دفع الآن
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
        />
      )}
    </div>
  );
}
