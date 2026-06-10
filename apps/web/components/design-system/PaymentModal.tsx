"use client";

import { useState } from "react";
import {
  useCreatePaymentIntentMutation,
  useGetPaymentGatewaysQuery,
  useGetBankAccountsQuery,
} from "@/features/finance/financeApi";
import { Dialog } from "./Dialog";
import { ActionButton } from "./ActionButton";
import { CreditCard, Landmark, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentModal({
  invoice,
  open,
  onOpenChange,
}: PaymentModalProps) {
  const [method, setMethod] = useState<"stripe" | "bank" | null>(null);
  const { data: gateways } = useGetPaymentGatewaysQuery();
  const { data: bankAccounts } = useGetBankAccountsQuery();
  const [createIntent, { isLoading: isCreatingIntent }] =
    useCreatePaymentIntentMutation();

  const stripeGateway = gateways?.find(
    (g) => g.name === "stripe" && g.isActive,
  );

  const handleStripePayment = async () => {
    try {
      const response = await createIntent({
        invoiceId: invoice.id,
        gatewayName: "stripe",
        amount: invoice.amount,
      }).unwrap();

      if (response.clientSecret) {
        window.location.href = response.clientSecret;
      } else {
        toast.error("فشل في الحصول على رابط الدفع");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء بدء عملية الدفع");
    }
  };

  const footer = (
    <div className="text-[10px] text-portal-icon text-center w-full">
      جميع المدفوعات مشفرة وآمنة 100%
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={<>دفع الفاتورة {invoice.invoiceNumber}</>}
      description="اختر وسيلة الدفع المفضلة لديك"
      footer={footer}
      contentClassName="sm:max-w-[425px]"
    >
      {!method ? (
        <div className="grid gap-4 py-4">
          {stripeGateway && (
            <ActionButton
              variant="outline"
              size="xl"
              fullWidth
              onClick={() => setMethod("stripe")}
              iconPosition="right"
              icon={
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-action-blue/10 rounded-lg group-hover:bg-action-blue/20">
                    <CreditCard className="w-6 h-6 text-action-blue" />
                  </div>
                  <div className="text-right">
                    <div className="font-bold">بطاقة ائتمان / مدى</div>
                    <div className="text-xs text-portal-icon">
                      دفع آمن وفوري عبر Stripe
                    </div>
                  </div>
                </div>
              }
              className="h-20 justify-between px-6 border-2 hover:border-secondary-500 hover:bg-secondary-100/20 group"
            >
              <ChevronRight className="w-5 h-5 text-portal-icon rotate-180" />
            </ActionButton>
          )}

          <ActionButton
            variant="outline"
            size="xl"
            fullWidth
            onClick={() => setMethod("bank")}
            iconPosition="right"
            icon={
              <div className="flex items-center gap-4">
                <div className="p-2 bg-alert-50 rounded-lg group-hover:bg-alert-100">
                  <Landmark className="w-6 h-6 text-alert-600" />
                </div>
                <div className="text-right">
                  <div className="font-bold">تحويل بنكي مباشر</div>
                  <div className="text-xs text-portal-icon">
                    تحويل للمصرف وتأكيد يدوي
                  </div>
                </div>
              </div>
            }
            className="h-20 justify-between px-6 border-2 hover:border-secondary-500 hover:bg-secondary-100/20 group"
          >
            <ChevronRight className="w-5 h-5 text-portal-icon rotate-180" />
          </ActionButton>
        </div>
      ) : method === "stripe" ? (
        <div className="py-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-secondary-100/40 rounded-full animate-pulse">
              <CreditCard className="w-12 h-12 text-secondary-500" />
            </div>
          </div>
          <h4 className="font-bold text-lg">جاري تجهيز بوابة الدفع...</h4>
          <p className="text-sm text-portal-icon">
            سيتم توجيهك إلى صفحة الدفع الآمنة الخاصة بـ Stripe لإتمام العملية.
          </p>
          <div className="pt-4 flex gap-2">
            <ActionButton
              variant="outline"
              fullWidth
              onClick={() => setMethod(null)}
            >
              رجوع
            </ActionButton>
            <ActionButton
              variant="primary"
              fullWidth
              onClick={handleStripePayment}
              loading={isCreatingIntent}
            >
              تأكيد ومتابعة
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="py-4 space-y-4">
          <h4 className="font-bold text-center mb-2">
            بيانات الحسابات البنكية المعتمدة
          </h4>
          <div className="space-y-3 max-h-[300px] overflow-y-auto px-1">
            {bankAccounts?.map((acc: any) => (
              <div
                key={acc.id}
                className="p-4 border rounded-xl bg-portal-bg space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-secondary-500">
                    {acc.bankName}
                  </span>
                  <Landmark className="w-4 h-4 text-portal-icon" />
                </div>
                <div className="grid gap-1">
                  <span className="text-[10px] text-portal-icon uppercase">
                    اسم الحساب
                  </span>
                  <span className="text-sm font-semibold">
                    {acc.accountName}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-[10px] text-portal-icon uppercase">
                    IBAN
                  </span>
                  <span className="text-sm font-mono bg-white p-2 rounded border select-all text-center">
                    {acc.iban}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-action-blue-soft p-4 rounded-xl text-xs text-action-blue leading-relaxed">
            <p className="font-bold mb-1">تعليمات:</p>
            <p>
              يرجى إرفاق رقم الفاتورة{" "}
              <span className="font-bold">{invoice.invoiceNumber}</span> في
              ملاحظات التحويل لسرعة التأكيد.
            </p>
          </div>
          <ActionButton
            variant="outline"
            fullWidth
            onClick={() => setMethod(null)}
          >
            رجوع
          </ActionButton>
        </div>
      )}
    </Dialog>
  );
}
