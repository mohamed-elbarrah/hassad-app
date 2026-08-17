"use client";

import {
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Ban,
  FileText,
} from "lucide-react";
import type { InvoiceSummary } from "@/features/contracts/contractsApi";
import type { ServiceItem } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  InlinePaymentCard,
  type PayableInvoice,
} from "@/components/payments/PaymentSheet";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  PAID: { label: "مدفوع", icon: CheckCircle, color: "text-success-600" },
  PENDING: { label: "معلق", icon: Clock, color: "text-alert-600" },
  SENT: { label: "مرسل", icon: Send, color: "text-action-blue" },
  DUE: { label: "مستحق", icon: AlertCircle, color: "text-alert-600" },
  PARTIAL: {
    label: "مدفوع جزئياً",
    icon: AlertCircle,
    color: "text-alert-600",
  },
  LATE: { label: "متأخر", icon: AlertCircle, color: "text-danger-600" },
  CANCELLED: { label: "ملغي", icon: Ban, color: "text-natural-100" },
};

const PAYABLE_STATUSES = new Set(["PENDING", "SENT", "DUE", "PARTIAL", "LATE"]);

interface ContractPaymentSummaryProps {
  services: ServiceItem[];
  totalValue: number;
  invoices: InvoiceSummary[];
  showPayButton?: boolean;
  onPaymentComplete?: () => void;
}

export function ContractPaymentSummary({
  services,
  totalValue,
  invoices,
  showPayButton = false,
  onPaymentComplete,
}: ContractPaymentSummaryProps) {
  if (
    !services ||
    services.length === 0 ||
    !invoices ||
    invoices.length === 0
  ) {
    return null;
  }

  const toPayable = (invoice: InvoiceSummary): PayableInvoice => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    status: invoice.status,
  });

  return (
    <Card dir="rtl">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText />
          الفوترة والدفع
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">الخدمات</div>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableBody>
                {services.map((service, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-left tabular-nums">
                      {service.price.toLocaleString("en-US")} ر.س
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">الإجمالي</TableCell>
                  <TableCell className="text-left font-semibold tabular-nums">
                    {totalValue.toLocaleString("en-US")} ر.س
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">الفواتير</div>
          <div className="flex flex-col gap-3">
            {invoices.map((invoice) => {
              const config = STATUS_CONFIG[invoice.status] ?? {
                label: invoice.status,
                icon: Clock,
                color: "text-muted-foreground",
              };
              const Icon = config.icon;
              const isPaid = invoice.status === "PAID";
              const isPayable =
                showPayButton && PAYABLE_STATUSES.has(invoice.status);

              return (
                <Card key={invoice.id}>
                  <CardContent className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon className={config.color} />
                        <span className="truncate text-sm font-medium">
                          {invoice.invoiceNumber}
                        </span>
                        <Badge variant={isPaid ? "secondary" : "outline"}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="text-sm font-semibold tabular-nums">
                        {invoice.amount.toLocaleString("en-US")} ر.س
                      </div>
                    </div>

                    {isPayable ? (
                      <InlinePaymentCard
                        invoice={toPayable(invoice)}
                        onPaymentComplete={onPaymentComplete}
                        compact
                      />
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
