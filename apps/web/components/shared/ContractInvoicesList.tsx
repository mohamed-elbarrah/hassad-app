"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Ban,
  CreditCard,
  Loader2,
  ExternalLink,
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
import {
  usePayInvoicePublicMutation,
  useCreatePaymentIntentMutation,
  useGetPublicGatewaysQuery,
} from "@/features/finance/financeApi";
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

const CARD_METHODS = new Set<PaymentMethod>([PaymentMethod.CARD]);

interface PaymentMethodOption {
  key: PaymentMethod;
  label: string;
}

/**
 * Map admin-configured gateway names → PaymentMethod options shown to clients.
 * Only gateways the admin has activated appear in the dropdown.
 */
function buildAvailableMethods(activeGateways: string[]): PaymentMethodOption[] {
  const methods: PaymentMethodOption[] = [];

  if (activeGateways.includes("stripe")) {
    methods.push({ key: PaymentMethod.CARD, label: "بطاقة" });
  }

  if (activeGateways.includes("bank_transfer")) {
    methods.push({ key: PaymentMethod.BANK_TRANSFER, label: "تحويل بنكي" });
  }

  return methods;
}

function getReturnUrls() {
  if (typeof window === "undefined") return { successUrl: "", cancelUrl: "" };
  const base = window.location.origin + window.location.pathname;
  return {
    successUrl: `${base}?success=true`,
    cancelUrl: `${base}?canceled=true`,
  };
}

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
  const [payInvoiceManual] = usePayInvoicePublicMutation();
  const [createPaymentIntent, { isLoading: creatingIntent }] =
    useCreatePaymentIntentMutation();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [methods, setMethods] = useState<Record<string, PaymentMethod>>({});

  const { data: activeGateways = [] } = useGetPublicGatewaysQuery(undefined, {
    skip: !showPayButton,
  });

  const availableMethods = useMemo(
    () => buildAvailableMethods(activeGateways),
    [activeGateways],
  );

  useEffect(() => {
    if (availableMethods.length > 0) {
      setMethods((prev) => {
        const next = { ...prev };
        invoices.forEach((inv) => {
          if (!next[inv.id]) {
            next[inv.id] = availableMethods[0].key;
          }
        });
        return next;
      });
    }
  }, [availableMethods, invoices]);

  if (!invoices || invoices.length === 0) return null;
  if (availableMethods.length === 0 && showPayButton) return null;

  function setMethod(invoiceId: string, method: PaymentMethod) {
    setMethods((prev) => ({ ...prev, [invoiceId]: method }));
  }

  function getMethod(invoiceId: string): PaymentMethod {
    return methods[invoiceId] ?? availableMethods[0]?.key ?? PaymentMethod.BANK_TRANSFER;
  }

  async function handlePay(invoice: InvoiceSummary) {
    const method = getMethod(invoice.id);
    setPayingId(invoice.id);

    if (CARD_METHODS.has(method)) {
      try {
        const { successUrl, cancelUrl } = getReturnUrls();
        const result = await createPaymentIntent({
          invoiceId: invoice.id,
          gatewayName: "stripe",
          amount: invoice.amount,
          successUrl,
          cancelUrl,
        }).unwrap();

        if (result.clientSecret) {
          sessionStorage.setItem(
            "pending_payment",
            JSON.stringify({
              paymentId: result.id,
              invoiceId: invoice.id,
            }),
          );
          window.location.href = result.clientSecret;
        } else {
          toast.error("لم يتم استلام رابط الدفع");
        }
      } catch (err: unknown) {
        const msg =
          (err as { data?: { message?: string } })?.data?.message ??
          "فشل إنشاء جلسة الدفع";
        toast.error(msg);
        setPayingId(null);
      }
    } else {
      try {
        await payInvoiceManual({
          id: invoice.id,
          amount: invoice.amount,
          method,
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
        const selectedMethod = getMethod(invoice.id);

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
              {isPayable && availableMethods.length > 0 && (
                <>
                  {availableMethods.length > 1 ? (
                    <Select
                      value={selectedMethod}
                      onValueChange={(v) =>
                        setMethod(invoice.id, v as PaymentMethod)
                      }
                    >
                      <SelectTrigger className="h-7 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMethods.map((opt) => (
                          <SelectItem key={opt.key} value={opt.key}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => handlePay(invoice)}
                    disabled={creatingIntent || isThisPaying}
                  >
                    {isThisPaying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : CARD_METHODS.has(selectedMethod) ? (
                      <ExternalLink className="w-3 h-3" />
                    ) : (
                      <CreditCard className="w-3 h-3" />
                    )}
                    {isThisPaying
                      ? "جارٍ..."
                      : CARD_METHODS.has(selectedMethod)
                        ? "ادفع عبر سترايب"
                        : "ادفع"}
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
