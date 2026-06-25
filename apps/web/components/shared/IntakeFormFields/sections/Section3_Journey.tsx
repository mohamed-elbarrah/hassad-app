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
import { cn } from "@/lib/utils";
import type { Section3Data, FormMode } from "../types";

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

interface Section3_JourneyProps {
  initialData?: Section3Data;
  onDataChange: (data: Section3Data) => void;
  onValid: (valid: boolean) => void;
  mode?: FormMode;
  showInfoBox?: boolean;
}

export function Section3_Journey({
  initialData,
  onDataChange,
  onValid,
  mode = "portal",
  showInfoBox = true,
}: Section3_JourneyProps) {
  const isPortal = mode === "portal";
  const iconColor = isPortal ? "text-portal-icon" : "text-neutral-400";
  const descriptionColor = isPortal ? "text-portal-note-text" : "text-neutral-500";
  const cardBorder = isPortal ? "border-portal-card-border hover:border-portal-card-border" : "border-neutral-200 hover:border-neutral-300";
  const checkboxBorder = isPortal ? "border-portal-divider" : "border-neutral-300";
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
    (data: Section3Data) => {
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
      handleChange(value as Section3Data);
    });
    return () => subscription.unsubscribe();
  }, [form, handleChange]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        {showInfoBox && (
          <div className={cn(
            "p-4 rounded-xl",
            isPortal ? "bg-secondary-50/50 border border-secondary-100" : "bg-muted/50 border border-border"
          )}>
            <p className={cn("text-sm font-medium", isPortal ? "text-secondary-800" : "text-foreground")}>
              💡 ليش نسأل هذا؟
            </p>
            <p className={cn("text-xs mt-1", isPortal ? "text-secondary-600" : "text-muted-foreground")}>
              نفهم كيف يشتري عميلك عشان نوجهه بالطريقة الصح
            </p>
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-medium text-natural-100">
            كيف يشتري العميل؟
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ORDER_METHODS.map((method) => (
              <div
                key={method.value}
                onClick={() => toggleMethod(method.value)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  selectedMethods.includes(method.value)
                    ? "border-secondary-500 bg-secondary-50/50 shadow-sm"
                    : cardBorder
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center shrink-0",
                      selectedMethods.includes(method.value)
                        ? "bg-secondary-500 text-white"
                        : cn("border bg-white", checkboxBorder)
                    )}
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
                      <method.icon className={cn("w-4 h-4", iconColor)} />
                      <span className="text-sm font-medium">
                        {method.label}
                      </span>
                    </div>
                    <p className={cn("text-xs mt-1", descriptionColor)}>
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

          <div className={cn(
            "flex items-center justify-between p-6 rounded-2xl border",
            isPortal ? "bg-portal-bg border-portal-divider" : "bg-muted/50 border-border"
          )}>
            <div>
              <p className="font-medium text-natural-100">
                هل عندك نظام يتابع السلات المتروكة؟
              </p>
              <p className={cn("text-sm mt-1", iconColor)}>
                نظام يرسل تذكير للعميل اللي يترك طلبه بدون إكمال
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasAbandonedCart(!hasAbandonedCart)}
              className={cn(
                "w-14 h-8 rounded-full p-1 transition-colors duration-300",
                hasAbandonedCart ? "bg-secondary-500" : "bg-portal-divider"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300",
                  hasAbandonedCart ? "translate-x-7" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </form>
    </Form>
  );
}