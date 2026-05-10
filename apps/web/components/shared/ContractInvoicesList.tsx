"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Ban,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceSummary } from "@/features/contracts/contractsApi";
import { usePayInvoicePublicMutation } from "@/features/finance/financeApi";
import { PaymentMethod } from "@hassad/shared";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  PAID: { label: "مدفوع", icon: CheckCircle, color: "text-emerald-600" },
  PENDING: { label: "معلق", icon: Clock, color: "text-amber-600" },
  SENT: { label: "مرسل", icon: Send, color: "text-blue-600" },
  DUE: { label: "مستحق", icon: AlertCircle, color: "text-orange-600" },
  PARTIAL: { label: "مدفوع جزئياً", icon: AlertCircle, color: "text-yellow-600" },
  LATE: { label: "متأخر", icon: AlertCircle, color: "text-red-600" },
  CANCELLED: { label: "ملغي", icon: Ban, color: "text-gray-600" },
};

const PAYABLE_STATUSES = new Set(["PENDING", "SENT", "DUE", "PARTIAL", "LATE"]);

const METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.BANK_TRANSFER]: "تحويل بنكي",
  [PaymentMethod.CARD]: "بطاقة",
  [PaymentMethod.MADA]: "مدى",
  [PaymentMethod.VISA_MC]: "فيزا / ماستركارد",
  [PaymentMethod.APPLE_PAY]: "Apple Pay",
  [PaymentMethod.TABBY]: "تابي",
  [PaymentMethod.TAMARA]: "تمارا",
  [PaymentMethod.CASH]: "نقدي",
};

interface ContractInvoicesListProps {
  invoices: InvoiceSummary[];
  showPayButton?: boolean;
  onPaymentComplete?: () => void;
}

export function ContractInvoicesList({
  invoices,
  showPayButton = false,
  onPaymentComplete,
}: ContractInvoicesListProps) {
  const [payInvoice, { isLoading: paying }] = usePayInvoicePublicMutation();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [methods, setMethods] = useState<Record<string, PaymentMethod>>({});

  if (!invoices || invoices.length === 0) return null;

  function setMethod(invoiceId: string, method: PaymentMethod) {
    setMethods((prev) => ({ ...prev, [invoiceId]: method }));
  }

  function getMethod(invoiceId: string): PaymentMethod {
    return methods[invoiceId] ?? PaymentMethod.BANK_TRANSFER;
  }

  async function handlePay(invoice: InvoiceSummary) {
    setPayingId(invoice.id);
    try {
      await payInvoice({
        id: invoice.id,
        amount: invoice.amount,
        method: getMethod(invoice.id),
      }).unwrap();
      toast.success("تم دفع الفاتورة بنجاح");
      onPaymentComplete?.();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل دفع الفاتورة";
      toast.error(msg);
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <p className="text-sm font-semibold">الفواتير</p>
      {invoices.map((invoice) => {
        const config = STATUS_CONFIG[invoice.status] ?? {
          label: invoice.status,
          icon: Clock,
          color: "text-muted-foreground",
        };
        const Icon = config.icon;
        const isPayable = showPayButton && PAYABLE_STATUSES.has(invoice.status);
        const isThisPaying = payingId === invoice.id;

        return (
          <div
            key={invoice.id}
            className="flex items-center justify-between text-sm py-1.5 flex-wrap gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
              <span className="text-foreground truncate">
                {invoice.invoiceNumber}
              </span>
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-muted-foreground text-xs">
                {new Date(invoice.dueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <span className="font-medium">
                {invoice.amount.toLocaleString("en-US")} ر.س
              </span>
              {isPayable && (
                <>
                  <Select
                    value={getMethod(invoice.id)}
                    onValueChange={(v) => setMethod(invoice.id, v as PaymentMethod)}
                  >
                    <SelectTrigger className="h-7 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(METHOD_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => handlePay(invoice)}
                    disabled={paying}
                  >
                    {isThisPaying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CreditCard className="w-3 h-3" />
                    )}
                    {isThisPaying ? "جارٍ..." : "ادفع"}
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
