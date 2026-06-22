"use client";

import { useCallback, useEffect, useState } from "react";
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
import { ShoppingBag, Store, MessageSquare, Phone, Laptop } from "lucide-react";

const ORDER_METHODS = [
  {
    value: "online_store",
    label: "متجر إلكتروني",
    icon: Store,
    description: "موقع أو تطبيق",
  },
  {
    value: "whatsapp",
    label: "واتساب",
    icon: MessageSquare,
    description: "طلبات عبر واتساب",
  },
  {
    value: "phone",
    label: "الهاتف",
    icon: Phone,
    description: "اتصال هاتفي",
  },
  {
    value: "direct",
    label: "المتجر المباشر",
    icon: ShoppingBag,
    description: "زيارة شخصية",
  },
  {
    value: "form",
    label: "نموذج إلكتروني",
    icon: Laptop,
    description: "نموذج طلب",
  },
];

const section3Schema = z.object({
  orderMethods: z.array(z.string()).optional(),
  abandonedCartSystem: z.boolean().default(false),
});

interface Section3FormData {
  orderMethods?: string[];
  abandonedCartSystem?: boolean;
}

interface Section3_JourneyProps {
  initialData?: Section3FormData;
  onDataChange: (data: Section3FormData) => void;
  onValid: (valid: boolean) => void;
}

export function Section3_Journey({
  initialData,
  onDataChange,
  onValid,
}: Section3_JourneyProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    initialData?.orderMethods || []
  );
  const [hasAbandonedCart, setHasAbandonedCart] = useState(
    initialData?.abandonedCartSystem ?? false
  );

  const form = useForm({
    defaultValues: {
      orderMethods: initialData?.orderMethods || [],
      abandonedCartSystem: initialData?.abandonedCartSystem ?? false,
    },
    mode: "onChange",
  });

  const isValid = form.formState.isValid;

  useEffect(() => {
    onValid(isValid);
  }, [isValid, onValid]);

  const toggleMethod = useCallback((method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  }, []);

  useEffect(() => {
    form.setValue("orderMethods", selectedMethods);
  }, [selectedMethods, form]);

  const handleChange = useCallback(
    (data: Section3FormData) => {
      onDataChange({
        ...data,
        orderMethods: selectedMethods,
        abandonedCartSystem: hasAbandonedCart,
      });
    },
    [onDataChange, selectedMethods, hasAbandonedCart]
  );

  useEffect(() => {
    const subscription = form.watch((value) => {
      handleChange(value as Section3FormData);
    });
    return () => subscription.unsubscribe();
  }, [form, handleChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="p-4 bg-secondary-50/50 border border-secondary-100 rounded-xl">
          <p className="text-sm text-secondary-800 font-medium">
            💡 ليش نسأل هذا؟
          </p>
          <p className="text-xs text-secondary-600 mt-1">
            نفهم كيف يشتري عميلك عشان نوجهه بالطريقة الصح
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-natural-100">
            كيف يشتري العميل؟
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ORDER_METHODS.map((method) => (
              <div
                key={method.value}
                onClick={() => toggleMethod(method.value)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedMethods.includes(method.value)
                    ? "border-secondary-500 bg-secondary-50/50 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      selectedMethods.includes(method.value)
                        ? "bg-secondary-500 text-white"
                        : "border border-neutral-300 bg-white"
                    }`}
                  >
                    {selectedMethods.includes(method.value) && (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <method.icon className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-medium">
                        {method.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {method.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {form.formState.errors.orderMethods && (
            <p className="text-sm text-danger-500 mt-1">
              {form.formState.errors.orderMethods.message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-natural-100">
            أدوات المتابعة
          </label>

          <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div>
              <p className="font-medium text-natural-100">
                هل عندك نظام يتابع السلات المتروكة؟
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                نظام يرسل تذكير للعميل اللي يترك طلبه بدون إكمال
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasAbandonedCart(!hasAbandonedCart)}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                hasAbandonedCart ? "bg-secondary-500" : "bg-neutral-300"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  hasAbandonedCart ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </form>
    </Form>
  );
}
