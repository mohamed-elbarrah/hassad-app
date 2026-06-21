"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DollarSign, FileText } from "lucide-react";

const step7Schema = z.object({
  monthlyBudget: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
});

type Step7FormData = z.infer<typeof step7Schema>;

const PAYMENT_METHODS = [
  { value: "credit_card", label: "بطاقة ائتمانية" },
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "points", label: "نقاط" },
  { value: "cash", label: "نقداً" },
];

interface Step7_BudgetProps {
  onBack: () => void;
  onNext: () => void;
  updateStepData: (step: number, data: any) => void;
}

export function Step7_Budget({ onBack, onNext, updateStepData }: Step7_BudgetProps) {
  const [monthlyBudget, setMonthlyBudget] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const form = useForm<Step7FormData>({
    resolver: zodResolver(step7Schema),
    defaultValues: {
      monthlyBudget: undefined,
      paymentMethod: "",
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    (data: Step7FormData) => {
      updateStepData(7, {
        ...data,
        monthlyBudget: monthlyBudget ? parseInt(monthlyBudget) : undefined,
        paymentMethod: paymentMethod,
        reports: [],
      });
      onNext();
    },
    [updateStepData, monthlyBudget, paymentMethod, onNext]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            الميزانية الشهرية
          </label>

          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100/50 rounded-2xl p-8 border border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-natural-100 font-medium">
                  كم ناوي تصرف في الشهر على المنصات؟
                </p>
                <p className="text-sm text-neutral-500 mt-1">نبي رقم منطقي يخلينا ننافس بقوة</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary-700 font-bold text-xl">SAR</span>
                <FormInputControl
                  type="number"
                  min={0}
                  placeholder="0"
                  className="w-40"
                  dir="ltr"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            طريقة الدفع
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === method.value
                    ? "border-secondary-500 bg-secondary-50/30 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border ${
                    paymentMethod === method.value
                      ? "border-secondary-500 bg-secondary-500 text-white"
                      : "border-neutral-300 bg-white"
                  }`}
                ></div>
                <span className="font-medium">{method.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-6">
          <ActionButton type="button" variant="outline" onClick={onBack}>
            السابق
          </ActionButton>

          <ActionButton type="submit" variant="primary">
            التالي
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}

export default Step7_Budget;
