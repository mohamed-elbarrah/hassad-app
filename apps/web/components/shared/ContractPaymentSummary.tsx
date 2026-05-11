"use client";

import { useState, useEffect, useMemo } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Ban,
  CreditCard,
  Landmark,
  Loader2,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
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
import type { ServiceItem } from "@hassad/shared";
import {
  useCreateElementPaymentIntentMutation,
  useUploadPaymentReceiptMutation,
  useGetPublicGatewaysQuery,
  useGetStripePublishableKeyQuery,
  useGetBankAccountsQuery,
  usePayInvoicePublicMutation,
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

function buildAvailableMethods(activeGateways: string[]) {
  const methods: { key: PaymentMethod; label: string }[] = [];
  if (activeGateways.includes("stripe")) {
    methods.push({ key: PaymentMethod.CARD, label: "بطاقة" });
  }
  if (activeGateways.includes("bank_transfer")) {
    methods.push({ key: PaymentMethod.BANK_TRANSFER, label: "تحويل بنكي" });
  }
  return methods;
}

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
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [methods, setMethods] = useState<Record<string, PaymentMethod>>({});
  const [stripeKey, setStripeKey] = useState<string | null>(null);

  const { data: activeGateways = [] } = useGetPublicGatewaysQuery(undefined, {
    skip: !showPayButton,
  });
  const { data: stripeConfig, isSuccess: stripeConfigLoaded } =
    useGetStripePublishableKeyQuery(undefined, { skip: !showPayButton });
  const { data: bankAccounts } = useGetBankAccountsQuery(undefined, {
    skip: !showPayButton,
  });

  const availableMethods = useMemo(
    () => buildAvailableMethods(activeGateways),
    [activeGateways],
  );

  useEffect(() => {
    if (stripeConfigLoaded && stripeConfig?.publishableKey) {
      setStripeKey(stripeConfig.publishableKey);
    }
  }, [stripeConfig, stripeConfigLoaded]);

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

  const toggleInvoice = (id: string) => {
    setExpandedInvoice((prev) => (prev === id ? null : id));
  };

  const setMethod = (invoiceId: string, method: PaymentMethod) => {
    setMethods((prev) => ({ ...prev, [invoiceId]: method }));
  };

  const getMethod = (invoiceId: string): PaymentMethod => {
    return methods[invoiceId] ?? availableMethods[0]?.key ?? PaymentMethod.BANK_TRANSFER;
  };

  if (!services || services.length === 0 || !invoices || invoices.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-card" dir="rtl">
      <div className="p-4 border-b bg-muted/20">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          ملخص العقد والدفع
        </h3>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">الخدمات المشمولة</p>
          <div className="rounded-lg border divide-y">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-foreground">{service.name}</span>
                <span className="text-muted-foreground font-medium tabular-nums">
                  {service.price.toLocaleString("en-US")} ر.س
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5 text-sm font-bold bg-muted/20">
              <span>الإجمالي</span>
              <span className="tabular-nums">{totalValue.toLocaleString("en-US")} ر.س</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">الفواتير</p>
          <div className="rounded-lg border divide-y">
            {invoices.map((invoice) => {
              const config = STATUS_CONFIG[invoice.status] ?? {
                label: invoice.status,
                icon: Clock,
                color: "text-muted-foreground",
              };
              const Icon = config.icon;
              const isPaid = invoice.status === "PAID";
              const isPayable = showPayButton && PAYABLE_STATUSES.has(invoice.status);
              const isExpanded = expandedInvoice === invoice.id;
              const selectedMethod = getMethod(invoice.id);

              return (
                <div key={invoice.id}>
                  <button
                    type="button"
                    onClick={() => isPayable && toggleInvoice(invoice.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                      isPayable ? "hover:bg-muted/30 cursor-pointer" : ""
                    } ${isExpanded ? "bg-muted/20" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                      <span className="text-foreground truncate font-medium">
                        {invoice.invoiceNumber}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold tabular-nums">
                        {invoice.amount.toLocaleString("en-US")} ر.س
                      </span>
                      {isPayable &&
                        (isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ))}
                    </div>
                  </button>

                  {isExpanded && isPayable && (
                    <div className="px-3 pb-3">
                      <InvoicePaymentForm
                        invoice={invoice}
                        selectedMethod={selectedMethod}
                        availableMethods={availableMethods}
                        setMethod={setMethod}
                        stripeKey={stripeKey}
                        bankAccounts={bankAccounts ?? []}
                        onPaymentComplete={onPaymentComplete}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface InvoicePaymentFormProps {
  invoice: InvoiceSummary;
  selectedMethod: PaymentMethod;
  availableMethods: { key: PaymentMethod; label: string }[];
  setMethod: (id: string, method: PaymentMethod) => void;
  stripeKey: string | null;
  bankAccounts: any[];
  onPaymentComplete?: () => void;
}

function InvoicePaymentForm({
  invoice,
  selectedMethod,
  availableMethods,
  setMethod,
  stripeKey,
  bankAccounts,
  onPaymentComplete,
}: InvoicePaymentFormProps) {
  const [createElementIntent, { isLoading: creatingIntent }] =
    useCreateElementPaymentIntentMutation();
  const [uploadReceipt] = useUploadPaymentReceiptMutation();
  const [payInvoiceManual] = usePayInvoicePublicMutation();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [confirmingBank, setConfirmingBank] = useState(false);

  const isCard = selectedMethod === PaymentMethod.CARD;
  const isBank = selectedMethod === PaymentMethod.BANK_TRANSFER;

  const handleInitCardPayment = async () => {
    setStripeLoading(true);
    try {
      const result = await createElementIntent({
        invoiceId: invoice.id,
        amount: invoice.amount,
      }).unwrap();
      setClientSecret(result.clientSecret);
      setPaymentId(result.id);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل تحضير الدفع";
      toast.error(msg);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleBankConfirm = async () => {
    if (!receiptFile) {
      toast.error("يرجى رفع صورة الإيصال البنكي");
      return;
    }
    setConfirmingBank(true);
    try {
      const payment = await payInvoiceManual({
        id: invoice.id,
        amount: invoice.amount,
        method: PaymentMethod.BANK_TRANSFER,
      }).unwrap();

      await uploadReceipt({
        paymentId: payment.id,
        file: receiptFile,
      }).unwrap();

      toast.success("تم رفع الإيصال. سنقوم بتأكيد الدفع بعد المراجعة.");
      onPaymentComplete?.();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل تأكيد الدفع";
      toast.error(msg);
    } finally {
      setConfirmingBank(false);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      {availableMethods.length > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">طريقة الدفع</span>
          <Select
            value={selectedMethod}
            onValueChange={(v) => setMethod(invoice.id, v as PaymentMethod)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
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
        </div>
      )}

      {isCard && !clientSecret && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                الدفع ببطاقة ائتمان
              </p>
              <p className="text-xs text-muted-foreground">
                المبلغ: {invoice.amount.toLocaleString("en-US")} ر.س
              </p>
            </div>
          </div>
          <Button
            onClick={handleInitCardPayment}
            disabled={stripeLoading}
            className="w-full gap-2"
            size="sm"
          >
            {stripeLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التحضير...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                ادفع {invoice.amount.toLocaleString("en-US")} ر.س
              </>
            )}
          </Button>
        </div>
      )}

      {isCard && clientSecret && stripeKey && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">أدخل بيانات البطاقة</p>
          <StripeElementsWrapper
            clientSecret={clientSecret}
            stripeKey={stripeKey}
            onComplete={onPaymentComplete}
          />
        </div>
      )}

      {isBank && (
        <div className="space-y-3">
          <div className="space-y-2">
            {bankAccounts.length > 0 ? (
              bankAccounts.map((acc: any) => (
                <div
                  key={acc.id}
                  className="rounded-lg border bg-muted/20 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{acc.bankName}</span>
                    <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground">اسم الحساب</div>
                  <div className="text-sm font-semibold">{acc.accountName}</div>
                  <div className="text-xs text-muted-foreground mt-1">IBAN</div>
                  <div className="text-sm font-mono bg-background p-1.5 rounded border select-all text-center">
                    {acc.iban}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                لا توجد حسابات بنكية متاحة حالياً
              </p>
            )}
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
            <p className="font-bold">تعليمات التحويل:</p>
            <p>
              قم بتحويل المبلغ {invoice.amount.toLocaleString("en-US")} ر.س إلى
              أحد الحسابات أعلاه. يرجى إرفاق رقم الفاتورة{" "}
              <span className="font-bold">{invoice.invoiceNumber}</span> في ملاحظات
              التحويل.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">
              إرفاق صورة الإيصال
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 relative"
                onClick={() => document.getElementById(`receipt-${invoice.id}`)?.click()}
              >
                <Upload className="w-4 h-4" />
                {receiptFile ? receiptFile.name : "اختيار ملف"}
              </Button>
              <input
                id={`receipt-${invoice.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReceiptChange}
              />
              {receiptFile && (
                <span className="text-xs text-muted-foreground">
                  {(receiptFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handleBankConfirm}
            disabled={confirmingBank || !receiptFile}
            className="w-full gap-2"
            size="sm"
          >
            {confirmingBank ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التأكيد...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                تأكيد الدفع
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function StripeElementsWrapper({
  clientSecret,
  stripeKey,
  onComplete,
}: {
  clientSecret: string;
  stripeKey: string;
  onComplete?: () => void;
}) {
  const stripePromise = useMemo(() => loadStripe(stripeKey), [stripeKey]);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#2563eb",
        colorText: "#1e293b",
        fontFamily: "system-ui, sans-serif",
        borderRadius: "8px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm onComplete={onComplete} />
    </Elements>
  );
}

function StripePaymentForm({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?stripe_success=true`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "فشل الدفع");
      setProcessing(false);
      return;
    }

    toast.success("تم الدفع بنجاح!");
    onComplete?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-lg border bg-white p-3">
        <PaymentElement />
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full gap-2"
        size="sm"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري تأكيد الدفع...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            تأكيد الدفع
          </>
        )}
      </Button>
    </form>
  );
}
