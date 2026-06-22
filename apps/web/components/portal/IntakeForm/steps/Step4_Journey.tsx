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
import { ActionButton } from "@/components/design-system/ActionButton";

const step4Schema = z.object({
  orderMethods: z.array(z.string()).min(1, "اختر طريقة طلب واحدة على الأقل"),
  abandonedCartSystem: z.boolean().optional(),
});

type Step4FormData = z.infer<typeof step4Schema>;

const ORDER_METHODS = [
  { value: "online_store", label: "متجر إلكتروني" },
  { value: "whatsapp", label: "واتساب" },
  { value: "form", label: "نموذج إلكتروني" },
  { value: "direct_store", label: "المتجر المباشر" },
  { value: "phone", label: "الهاتف" },
];

interface Step4_JourneyProps {
  onBack: () => void;
  onNext: () => void;
  updateStepData: (step: number, data: any) => void;
}

export function Step4_Journey({ onBack, onNext, updateStepData }: Step4_JourneyProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [hasAbandonedCartSystem, setHasAbandonedCartSystem] = useState(false);

  const form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      orderMethods: [],
      abandonedCartSystem: false,
    },
    mode: "onChange",
  });

  const toggleMethod = useCallback((method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  }, []);

  const onSubmit = useCallback(
    (data: Step4FormData) => {
      updateStepData(4, {
        ...data,
        orderMethods: selectedMethods,
        abandonedCartSystem: hasAbandonedCartSystem,
      });
      onNext();
    },
    [updateStepData, selectedMethods, hasAbandonedCartSystem, onNext]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            كيف يشتري العميل؟
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ORDER_METHODS.map((method) => (
              <div
                key={method.value}
                onClick={() => toggleMethod(method.value)}
                className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer transition-all"
              >
                <div className="w-5 h-5 rounded border border-neutral-300 bg-white"></div>
                <span className="text-sm font-medium">{method.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            أدوات المتابعة
          </label>

          <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div>
              <p className="font-medium text-natural-100">هل عندكم نظام يتابع السلات المتروكة؟</p>
            </div>
            <button
              type="button"
              onClick={() => setHasAbandonedCartSystem(!hasAbandonedCartSystem)}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                hasAbandonedCartSystem ? "bg-secondary-500" : "bg-neutral-300"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  hasAbandonedCartSystem ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
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

export default Step4_Journey;
