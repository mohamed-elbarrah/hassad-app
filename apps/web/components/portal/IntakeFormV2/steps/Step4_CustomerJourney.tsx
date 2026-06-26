"use client";

import { useCallback, useEffect } from "react";
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
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ShoppingCart, ClipboardList } from "lucide-react";
import { StepLayout } from "../components/StepLayout";

const formSchema = z.object({
  orderMethods: z.array(z.string()).optional(),
  followUpTools: z.string().optional(),
});

type CustomerJourneyForm = z.infer<typeof formSchema>;

const ORDER_METHODS = [
  { value: "store", label: "من المتجر دايركت" },
  { value: "whatsapp", label: "يكلمك واتساب" },
  { value: "form", label: "نموذج يعبيه" },
  { value: "phone", label: "اتصال هاتفي" },
  { value: "email", label: "بريد إلكتروني" },
];

interface Step4Props {
  initialData?: CustomerJourneyForm;
  onDataChange: (data: CustomerJourneyForm) => void;
  onValid: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

export function Step4_CustomerJourney({
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
  hideNavigation = false,
}: Step4Props) {
  const form = useForm<CustomerJourneyForm>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? {
      orderMethods: [],
      followUpTools: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    onValid(true);
  }, [onValid]);

  useEffect(() => {
    const sub = form.watch((values) => {
      onDataChange(values as CustomerJourneyForm);
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange]);

  const selectedMethods = form.watch("orderMethods") ?? [];

  const toggleMethod = useCallback(
    (value: string) => {
      const current = form.getValues("orderMethods") ?? [];
      const updated = current.includes(value)
        ? current.filter((m) => m !== value)
        : [...current, value];
      form.setValue("orderMethods", updated, { shouldDirty: true });
    },
    [form],
  );

  const onSubmit = useCallback(
    (data: CustomerJourneyForm) => {
      onDataChange(data);
      onNext?.();
    },
    [onDataChange, onNext],
  );

  return (
    <StepLayout
      stepNumber={4}
      title="رحلة العميل"
      instructions={[
        "العميل كيف يشتري؟ (من المتجر دايركت، وإلا يكلمك واتساب، وإلا نموذج يعبيه؟)",
        "هل عندكم نظام يتابع السلات المتروكة أو العملاء المترددين؟",
      ]}
      isOptional
      onSkip={onSkip}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <span className="text-sm font-medium text-natural-100 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-portal-icon" />
              طريقة الطلب
            </span>
            <div className="flex flex-wrap gap-2">
              {ORDER_METHODS.map((method) => {
                const selected = selectedMethods.includes(method.value);
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => toggleMethod(method.value)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm border transition-colors",
                      selected
                        ? "bg-secondary-500 text-white border-secondary-500"
                        : "bg-natural-0 text-portal-icon border-portal-divider hover:border-secondary-300",
                    )}
                  >
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          <FormField
            control={form.control}
            name="followUpTools"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-portal-icon" />
                  أدوات المتابعة
                </FormLabel>
                <FormTextareaControl
                  placeholder="هل عندكم نظام يتابع السلات المتروكة أو العملاء المترددين؟"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          {!hideNavigation && (
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-portal-divider">
              {onBack && (
                <ActionButton type="button" variant="outline" onClick={onBack}>
                  السابق
                </ActionButton>
              )}
              <ActionButton type="submit" variant="primary" className="mr-auto">
                التالي
              </ActionButton>
            </div>
          )}
        </form>
      </Form>
    </StepLayout>
  );
}
