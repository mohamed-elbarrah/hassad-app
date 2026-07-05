"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { useRegisterPaymentMutation } from "@/features/finance/financeApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RegisterPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  maxAmount: number;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "تحويل بنكي" },
  { value: "CASH", label: "نقدي" },
  { value: "CARD", label: "بطاقة" },
  { value: "MADA", label: "مدى" },
  { value: "VISA_MC", label: "Visa/Mastercard" },
  { value: "APPLE_PAY", label: "Apple Pay" },
  { value: "TABBY", label: "تابي" },
  { value: "TAMARA", label: "تمارا" },
];

export function RegisterPaymentModal({
  open,
  onOpenChange,
  invoiceId,
  maxAmount,
  onSuccess,
}: RegisterPaymentModalProps) {
  const [amount, setAmount] = useState<string>(String(maxAmount));
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [notes, setNotes] = useState("");
  const [registerPayment, { isLoading }] = useRegisterPaymentMutation();

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }
    if (numAmount > maxAmount) {
      toast.error(
        `المبلغ يتجاوز المتبقي (${maxAmount.toLocaleString("ar-SA-u-nu-latn")})`,
      );
      return;
    }

    try {
      await registerPayment({
        invoiceId,
        amount: numAmount,
        method: method as any,
        notes: notes || undefined,
      }).unwrap();
      toast.success("تم تسجيل الدفعة بنجاح");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("فشل تسجيل الدفعة");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
          <DialogDescription>
            المبلغ المتبقي: <CurrencyDisplay amount={maxAmount} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-natural-100">
              المبلغ
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-portal-card-border bg-natural-0 px-4 py-2.5 text-sm text-natural-100 focus:outline-none focus:ring-2 focus:ring-secondary-500/30"
              placeholder="أدخل المبلغ"
              min="0"
              step="0.01"
            />
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-natural-100">
              طريقة الدفع
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-xl border border-portal-card-border bg-natural-0 px-4 py-2.5 text-sm text-natural-100 focus:outline-none focus:ring-2 focus:ring-secondary-500/30"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-natural-100">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-portal-card-border bg-natural-0 px-4 py-2.5 text-sm text-natural-100 focus:outline-none focus:ring-2 focus:ring-secondary-500/30 resize-none"
              rows={3}
              placeholder="أضف ملاحظة..."
              dir="rtl"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <ActionButton variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleSubmit}
            loading={isLoading}
            icon={
              isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : undefined
            }
          >
            تسجيل الدفعة
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
