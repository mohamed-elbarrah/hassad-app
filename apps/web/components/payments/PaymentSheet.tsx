"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
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
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { portalErrorMessage } from "@/lib/i18n";
import {
  useCreateElementPaymentIntentMutation,
  useUploadPaymentReceiptMutation,
  useGetPublicGatewaysQuery,
  useGetStripePublishableKeyQuery,
  useGetPublicBankAccountsQuery,
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

const PAYABLE_STATUSES = new Set(["PENDING", "SENT", "DUE", "PARTIAL", "LATE"]);

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

function fmtAmount(n: number) {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

/* ═════════════ Simple Checkout Card (inline, no sheet) ═════════════════ */

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
  compact: _compact = false,
}: InlinePaymentProps) {
  const { data: activeGateways = [], isLoading: loadingGateways } =
    useGetPublicGatewaysQuery(undefined);
  const { data: stripeConfig, isLoading: loadingStripeConfig } =
    useGetStripePublishableKeyQuery(undefined, {
      skip: !!stripeKeyProp,
    });
  const { data: bankData, isLoading: loadingBankAccounts } =
    useGetPublicBankAccountsQuery(undefined, {
      skip:
        !!(bankAccountsProp && bankAccountsProp.length > 0) ||
        !activeGateways.includes("bank_transfer"),
    });

  const resolvedStripeKey = stripeKeyProp ?? stripeConfig?.publishableKey ?? "";
  const resolvedMethods = useMemo(
    () =>
      buildAvailableMethods(activeGateways).filter(
        (method) => method.key !== PaymentMethod.CARD || Boolean(resolvedStripeKey),
      ),
    [activeGateways, resolvedStripeKey],
  );
  const resolvedBankAccounts = bankAccountsProp ?? bankData ?? [];

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );

  useEffect(() => {
    if (resolvedMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(resolvedMethods[0].key);
    }
  }, [resolvedMethods, selectedMethod]);

  const showTabs = resolvedMethods.length > 1;
  const loadingPaymentConfiguration =
    loadingGateways ||
    loadingBankAccounts ||
    (activeGateways.includes("stripe") && loadingStripeConfig);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">المبلغ المستحق</p>
        </div>
        <p className="text-lg font-bold">
          {fmtAmount(invoice.amount)}{" "}
          <span className="text-sm font-normal text-muted-foreground">ر.س</span>
        </p>
      </div>

      {showTabs && (
        <div className="flex gap-2">
          {resolvedMethods.map((m) => {
            const Icon = m.icon;
            return (
              <Button
                key={m.key}
                onClick={() => setSelectedMethod(m.key)}
                type="button"
                variant={selectedMethod === m.key ? "default" : "outline"}
                className="flex-1"
              >
                <Icon data-icon="inline-start" />
                {m.label}
              </Button>
            );
          })}
        </div>
      )}

      {loadingPaymentConfiguration ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
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

/* ═════════════ Card Payment Form ═══════════════════════════════ */

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
      toast.error(portalErrorMessage(err));
    }
  }, [invoice.id, invoice.amount, createElementIntent]);

  useEffect(() => {
    if (!clientSecret && !creating) load();
  }, [clientSecret, creating, load]);

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
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
        colorPrimary: "#121936",
        colorText: "#121936",
        fontFamily: "system-ui, sans-serif",
        borderRadius: "12px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm clientSecret={clientSecret} onComplete={onComplete} />
    </Elements>
  );
}

function StripePaymentForm({
  clientSecret,
  onComplete,
}: {
  clientSecret: string;
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

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setError("لم يتم تحميل نموذج الدفع");
      setProcessing(false);
      return;
    }

    const { error: submitError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

    if (submitError) {
      setError(submitError.message ?? "فشل الدفع");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      toast.success("تم الدفع بنجاح!");
      onComplete?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card number */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          رقم البطاقة
        </label>
        <div className="rounded-xl border border-border bg-background px-4 py-3">
          <CardNumberElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#121936",
                  fontFamily: "system-ui, sans-serif",
                  "::placeholder": { color: "#a0a5ae" },
                },
                invalid: { color: "#dc2626" },
              },
            }}
          />
        </div>
      </div>

      {/* Expiry + CVC in a grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            تاريخ الانتهاء
          </label>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <CardExpiryElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#121936",
                    fontFamily: "system-ui, sans-serif",
                    "::placeholder": { color: "#a0a5ae" },
                  },
                  invalid: { color: "#dc2626" },
                },
              }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            رمز الأمان (CVV)
          </label>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <CardCvcElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#121936",
                    fontFamily: "system-ui, sans-serif",
                    "::placeholder": { color: "#a0a5ae" },
                  },
                  invalid: { color: "#dc2626" },
                },
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-danger-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full"
      >
        {processing ? (
          <>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            جاري تأكيد الدفع...
          </>
        ) : (
          <>
            <CreditCard data-icon="inline-start" />
            تأكيد الدفع
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <ShieldCheck className="size-3" />
        جميع المدفوعات مشفرة وآمنة 100%
      </div>
    </form>
  );
}

/* ═════════════ Bank Transfer Form ═══════════════════════════════ */

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
      toast.error(portalErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      {bankAccounts.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableBody>
          {bankAccounts.map((acc: any) => (
            <TableRow key={acc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-muted-foreground" />
                  {acc.bankName}
                </div>
              </TableCell>
              <TableCell>{acc.accountName}</TableCell>
              <TableCell className="font-mono text-left select-all">{acc.iban}</TableCell>
            </TableRow>
          ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          لا توجد حسابات بنكية متاحة حالياً
        </p>
      )}

      <div className="flex gap-3 rounded-lg border p-4">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-6 text-muted-foreground">
          <span className="font-semibold text-foreground">تعليمات التحويل:</span>{" "}
          قم بتحويل المبلغ{" "}
          <span className="font-semibold text-foreground">
            {fmtAmount(invoice.amount)} ر.س
          </span>{" "}
          إلى أحد الحسابات أعلاه. يرجى إرفاق رقم الفاتورة{" "}
          <span className="font-semibold text-foreground">
            {invoice.invoiceNumber}
          </span>{" "}
          في ملاحظات التحويل.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">إرفاق صورة الإيصال</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() =>
              document.getElementById(`receipt-${invoice.id}`)?.click()
            }
            variant={receiptFile ? "secondary" : "outline"}
          >
            <Upload data-icon="inline-start" />
            {receiptFile ? receiptFile.name : "اختيار ملف"}
          </Button>
          <Input
            id={`receipt-${invoice.id}`}
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
            <Badge variant="outline">
              {(receiptFile.size / 1024 / 1024).toFixed(1)} MB
            </Badge>
          )}
        </div>
      </div>

      <Button
        onClick={handleConfirm}
        disabled={confirming || !receiptFile}
        className="w-full"
      >
        {confirming ? (
          <>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            جاري التأكيد...
          </>
        ) : (
          <>
            <CheckCircle2 data-icon="inline-start" />
            تأكيد الدفع
          </>
        )}
      </Button>
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
  const { data: activeGateways = [], isLoading: loadingGateways } =
    useGetPublicGatewaysQuery(undefined, {
      skip: !invoice,
    });
  const { data: stripeConfig, isLoading: loadingStripeConfig } =
    useGetStripePublishableKeyQuery(undefined, {
      skip: !invoice,
    });
  const { data: bankAccounts, isLoading: loadingBankAccounts } =
    useGetPublicBankAccountsQuery(undefined, {
      skip: !invoice || !activeGateways.includes("bank_transfer"),
    });

  const availableMethods = useMemo(
    () =>
      buildAvailableMethods(activeGateways).filter(
        (method) =>
          method.key !== PaymentMethod.CARD ||
          Boolean(stripeConfig?.publishableKey),
      ),
    [activeGateways, stripeConfig?.publishableKey],
  );

  const loadingPaymentConfiguration =
    loadingGateways ||
    loadingBankAccounts ||
    (activeGateways.includes("stripe") && loadingStripeConfig);

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
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          dir="rtl"
          onClick={() => onOpenChange(false)}
        >
          <div
            className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-[30px] sm:rounded-[30px] bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">
                    دفع الفاتورة
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Invoice summary */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-portal-bg p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    المبلغ المستحق
                  </p>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {fmtAmount(invoice.amount)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ر.س
                  </span>
                </p>
              </div>

              {/* Payment method tabs */}
              {showTabs && (
                <div className="flex gap-1 rounded-xl bg-portal-bg p-1">
                  {availableMethods.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setSelectedMethod(m.key)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
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

              {/* Payment form */}
              {loadingPaymentConfiguration ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    جاري تحميل طرق الدفع...
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
