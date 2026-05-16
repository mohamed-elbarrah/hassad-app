"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import {
  CreditCard,
  Landmark,
  Loader2,
  Upload,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  useCreateElementPaymentIntentMutation,
  useUploadPaymentReceiptMutation,
  useGetPublicGatewaysQuery,
  useGetStripePublishableKeyQuery,
  useGetBankAccountsQuery,
  usePayInvoicePublicMutation,
} from "@/features/finance/financeApi";
import { PaymentMethod } from "@hassad/shared";

export interface PayableInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
}

/* ═════════════ Shared utilities ═════════════ */

const PAYABLE_STATUSES = new Set([
  "PENDING",
  "SENT",
  "DUE",
  "PARTIAL",
  "LATE",
]);

function buildAvailableMethods(activeGateways: string[]) {
  const methods: {
    key: PaymentMethod;
    label: string;
    icon: typeof CreditCard;
  }[] = [];
  if (activeGateways.includes("stripe")) {
    methods.push({ key: PaymentMethod.CARD, label: "بطاقة", icon: CreditCard });
  }
  if (activeGateways.includes("bank_transfer")) {
    methods.push({
      key: PaymentMethod.BANK_TRANSFER,
      label: "تحويل بنكي",
      icon: Landmark,
    });
  }
  return methods;
}

/* ═════════════ Shared sub-components ═════════════ */

export function CardPaymentForm({
  invoice,
  stripeKey,
  onPaymentComplete,
}: {
  invoice: PayableInvoice;
  stripeKey: string;
  onPaymentComplete?: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [createElementIntent, { isLoading: creating }] =
    useCreateElementPaymentIntentMutation();

  const load = useCallback(async () => {
    try {
      const result = await createElementIntent({
        invoiceId: invoice.id,
        amount: invoice.amount,
      }).unwrap();
      if (result?.clientSecret) setClientSecret(result.clientSecret);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل تحضير الدفع";
      toast.error(msg);
    }
  }, [invoice.id, invoice.amount, createElementIntent]);

  useEffect(() => {
    if (!clientSecret && !creating) load();
  }, [clientSecret, creating, load]);

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          جاري تجهيز نموذج الدفع...
        </p>
      </div>
    );
  }

  return (
    <StripeElementsWrapper
      clientSecret={clientSecret}
      stripeKey={stripeKey}
      onComplete={onPaymentComplete}
    />
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
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      
        <PaymentElement />
      
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
      <p className="text-[10px] text-muted-foreground text-center">
        جميع المدفوعات مشفرة وآمنة 100%
      </p>
    </form>
  );
}

export function BankTransferForm({
  invoice,
  bankAccounts,
  onPaymentComplete,
}: {
  invoice: PayableInvoice;
  bankAccounts: any[];
  onPaymentComplete?: () => void;
}) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [uploadReceipt] = useUploadPaymentReceiptMutation();
  const [payInvoiceManual] = usePayInvoicePublicMutation();

  const handleConfirm = async () => {
    if (!receiptFile) {
      toast.error("يرجى رفع صورة الإيصال البنكي");
      return;
    }
    setConfirming(true);
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
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {bankAccounts.length > 0 ? (
        <div className="space-y-3">
          {bankAccounts.map((acc: any) => (
            <div
              key={acc.id}
              className="rounded-xl border bg-muted/20 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">
                  {acc.bankName}
                </span>
                <Landmark className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">
                  اسم الحساب
                </p>
                <p className="text-sm font-semibold">{acc.accountName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">IBAN</p>
                <p className="text-sm font-mono bg-background p-2 rounded border select-all text-center">
                  {acc.iban}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          لا توجد حسابات بنكية متاحة حالياً
        </p>
      )}

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
        <p className="font-bold">تعليمات التحويل:</p>
        <p>
          قم بتحويل المبلغ{" "}
          <span className="font-bold">
            {invoice.amount.toLocaleString("ar-SA-u-nu-latn")} ر.س
          </span>{" "}
          إلى أحد الحسابات أعلاه. يرجى إرفاق رقم الفاتورة{" "}
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
            onClick={() =>
              document.getElementById(`receipt-sheet-${invoice.id}`)?.click()
            }
          >
            <Upload className="w-4 h-4" />
            {receiptFile ? receiptFile.name : "اختيار ملف"}
          </Button>
          <input
            id={`receipt-sheet-${invoice.id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setReceiptFile(e.target.files[0]);
              }
            }}
          />
          {receiptFile && (
            <span className="text-xs text-muted-foreground">
              {(receiptFile.size / 1024 / 1024).toFixed(1)} MB
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={handleConfirm}
        disabled={confirming || !receiptFile}
        className="w-full gap-2"
      >
        {confirming ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري التأكيد...
          </>
        ) : (
          <>
            <Landmark className="w-4 h-4" />
            تأكيد الدفع
          </>
        )}
      </Button>
    </div>
  );
}

/* ═══════════════ INLINE PAYMENT CARD (for contract pages) ═════════════════ */ 

export interface InlinePaymentProps {
  invoice: PayableInvoice;
  stripeKey?: string;
  bankAccounts?: any[];
  onPaymentComplete?: () => void;
  compact?: boolean;
}

export function InlinePaymentCard({
  invoice,
  stripeKey: stripeKeyProp,
  bankAccounts: bankAccountsProp,
  onPaymentComplete,
  compact = false,
}: InlinePaymentProps) {
  const { data: activeGateways = [] } = useGetPublicGatewaysQuery(undefined);
  const { data: stripeConfig } = useGetStripePublishableKeyQuery(undefined, {
    skip: !!stripeKeyProp,
  });
  const { data: bankData } = useGetBankAccountsQuery(undefined, {
    skip: !!(bankAccountsProp && bankAccountsProp.length > 0),
  });

  const resolvedStripeKey = stripeKeyProp ?? stripeConfig?.publishableKey ?? "";
  const resolvedMethods = useMemo(
    () => buildAvailableMethods(activeGateways),
    [activeGateways],
  );
  const resolvedBankAccounts = bankAccountsProp ?? (bankData ?? []);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );

  useEffect(() => {
    if (resolvedMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(resolvedMethods[0].key);
    }
  }, [resolvedMethods, selectedMethod]);

  const showTabs = resolvedMethods.length > 1;
  const loadingGateways = !(stripeKeyProp ?? stripeConfig?.publishableKey);

  const wrapperClass = compact
    ? "bg-muted/30 rounded-lg p-3 space-y-3"
    : "rounded-xl border bg-white p-4 space-y-4";

  return (
    <div className={wrapperClass} dir="rtl">
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {invoice.invoiceNumber}
            </p>
            <p className="text-xs text-muted-foreground">المبلغ المستحق</p>
          </div>
          <p className="text-lg font-bold text-foreground">
            {invoice.amount.toLocaleString("ar-SA-u-nu-latn")}{" "}
            <span className="text-sm font-normal text-muted-foreground">ر.س</span>
          </p>
        </div>
      )}

      {showTabs && (
        <div className={compact ? "flex gap-1 rounded-lg bg-muted" : "flex gap-1 p-1 rounded-lg bg-muted"}>
          {resolvedMethods.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMethod(m.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors",
                  selectedMethod === m.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {loadingGateways ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">جاري تحميل طرق الدفع...</p>
        </div>
      ) : (
        <>
          {selectedMethod === PaymentMethod.CARD && resolvedStripeKey && (
            <CardPaymentForm
              invoice={invoice}
              stripeKey={resolvedStripeKey}
              onPaymentComplete={onPaymentComplete}
            />
          )}
          {selectedMethod === PaymentMethod.BANK_TRANSFER && (
            <BankTransferForm
              invoice={invoice}
              bankAccounts={resolvedBankAccounts}
              onPaymentComplete={onPaymentComplete}
            />
          )}
        </>
      )}
    </div>
  );
}


/* ═══════════════ PAYMENT SHEET (for finance table) ═════════════════ */

interface PaymentSheetProps {
  invoice: PayableInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentComplete?: () => void;
}

export function PaymentSheet({
  invoice,
  open,
  onOpenChange,
  onPaymentComplete,
}: PaymentSheetProps) {
  const { data: activeGateways = [] } = useGetPublicGatewaysQuery(undefined, {
    skip: !invoice,
  });
  const { data: stripeConfig } =
    useGetStripePublishableKeyQuery(undefined, { skip: !invoice });
  const { data: bankAccounts } = useGetBankAccountsQuery(undefined, {
    skip: !invoice,
  });

  const availableMethods = useMemo(
    () => buildAvailableMethods(activeGateways),
    [activeGateways],
  );

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );

  useEffect(() => {
    if (availableMethods.length === 1) {
      setSelectedMethod(availableMethods[0].key);
    } else if (availableMethods.length > 1 && !selectedMethod) {
      setSelectedMethod(availableMethods[0].key);
    }
  }, [availableMethods, selectedMethod]);

  useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
    }
  }, [open]);

  if (!invoice || !PAYABLE_STATUSES.has(invoice.status)) return null;

  const showTabs = availableMethods.length > 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
        dir="rtl"
      >
        <SheetHeader className="text-right mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            دفع الفاتورة
          </SheetTitle>
          <SheetDescription>
            الفاتورة {invoice.invoiceNumber} —{" "}
            {invoice.amount.toLocaleString("ar-SA-u-nu-latn")} ر.س
          </SheetDescription>
        </SheetHeader>

        <div className="rounded-xl border bg-muted/30 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                المبلغ المستحق
              </p>
            </div>
            <p className="text-lg font-bold text-foreground">
              {invoice.amount.toLocaleString("ar-SA-u-nu-latn")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ر.س
              </span>
            </p>
          </div>
        </div>

        {showTabs && (
          <div className="flex gap-1 p-1 rounded-lg bg-muted mb-6">
            {availableMethods.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedMethod(m.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors",
                    selectedMethod === m.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        )}

        {selectedMethod === PaymentMethod.CARD &&
          stripeConfig?.publishableKey && (
            <CardPaymentForm
              invoice={invoice}
              stripeKey={stripeConfig.publishableKey}
              onPaymentComplete={() => {
                onPaymentComplete?.();
                onOpenChange(false);
              }}
            />
          )}

        {selectedMethod === PaymentMethod.BANK_TRANSFER && (
          <BankTransferForm
            invoice={invoice}
            bankAccounts={bankAccounts ?? []}
            onPaymentComplete={() => {
              onPaymentComplete?.();
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
