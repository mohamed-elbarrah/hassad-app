"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetInvoicesByClientQuery } from "@/features/finance/financeApi";
import { useGetContractsQuery } from "@/features/contracts/contractsApi";
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

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DUE: "مستحقة",
  SENT: "مُرسلة",
  PAID: "مدفوعة",
  LATE: "متأخرة",
  CANCELLED: "ملغاة",
};

const INVOICE_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DUE: "outline",
  SENT: "default",
  PAID: "secondary",
  LATE: "destructive",
  CANCELLED: "secondary",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "مُرسل",
  SIGNED: "موقّع",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

function fmt(n: number) {
  return n.toLocaleString("ar-DZ");
}

export default function PortalFinancePage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const { data: invoices, isLoading: invoicesLoading } = useGetInvoicesByClientQuery(
    clientId,
    { skip: !clientId },
  );
  const { data: contracts, isLoading: contractsLoading } = useGetContractsQuery(
    { clientId, limit: 10 },
    { skip: !clientId },
  );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الصفحة المالية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          الفواتير والمدفوعات والعقود الخاصة بك.
        </p>
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">
          لم يتم ربط حسابك بملف عميل.
        </p>
      )}

      {clientId && (
        <>
          {/* Invoices */}
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
              {!invoicesLoading && invoices && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الفاتورة</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          لا توجد فواتير.
                        </TableCell>
                      </TableRow>
                    )}
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell dir="ltr" className="font-mono text-sm">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell dir="ltr">{fmt(invoice.amount)} دج</TableCell>
                        <TableCell>
                          <Badge variant={INVOICE_STATUS_VARIANT[invoice.status] ?? "outline"}>
                            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell dir="ltr">
                          {new Date(invoice.dueDate).toLocaleDateString("ar-DZ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Contracts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">العقود</CardTitle>
            </CardHeader>
            <CardContent>
              {contractsLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              )}
              {!contractsLoading && contracts && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">قيمة العقد</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ البداية</TableHead>
                      <TableHead className="text-right">تاريخ النهاية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          لا توجد عقود.
                        </TableCell>
                      </TableRow>
                    )}
                    {contracts.items.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell dir="ltr">{fmt(contract.totalValue)} دج</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell dir="ltr">
                          {new Date(contract.startDate).toLocaleDateString("ar-DZ")}
                        </TableCell>
                        <TableCell dir="ltr">
                          {new Date(contract.endDate).toLocaleDateString("ar-DZ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
