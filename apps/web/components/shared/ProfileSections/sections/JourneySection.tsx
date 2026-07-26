/**
 * JourneySection - Section 4: Customer Journey
 *
 * Handles order methods and follow-up tools.
 * Supports three modes: wizard, edit, view
 */

"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel } from "@/components/design-system/Form";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";

import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import { ShoppingCart, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionLayout,
  NavigationButtons,
  SectionSubtitle,
} from "../SectionLayout";
import type { ProfileMode } from "../types";

const formSchema = z.object({
  orderMethods: z.array(z.string()).optional(),
  followUpTools: z.string().optional(),
});

type JourneyForm = z.infer<typeof formSchema>;

const ORDER_METHODS = [
  { value: "store", label: "من المتجر دايركت" },
  { value: "whatsapp", label: "يكلمك واتساب" },
  { value: "form", label: "نموذج يعبيه" },
  { value: "phone", label: "اتصال هاتفي" },
  { value: "email", label: "بريد إلكتروني" },
];

interface JourneySectionProps {
  mode: ProfileMode;
  initialData?: JourneyForm;
  onDataChange?: (data: JourneyForm) => void;
  onValid?: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

export function JourneySection({
  mode,
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
  hideNavigation = false,
}: JourneySectionProps) {
  const form = useForm<JourneyForm>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? {
      orderMethods: [],
      followUpTools: "",
    },
    mode: "onChange",
  });

  // Reset form when initialData changes (e.g., when profile loads from API)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  useEffect(() => {
    onValid?.(true);
  }, [onValid]);

  useEffect(() => {
    if (mode === "view") return;

    const sub = form.watch((values) => {
      onDataChange?.(values as JourneyForm);
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange, mode]);

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
    (data: JourneyForm) => {
      onDataChange?.(data);
      onNext?.();
    },
    [onDataChange, onNext],
  );

  // View mode: render read-only display
  if (mode === "view") {
    const data = initialData;
    if (!data) return null;

    const hasData =
      (data.orderMethods && data.orderMethods.length > 0) || data.followUpTools;
    if (!hasData) return null;

    return (
      <SectionLayout mode="view" title="رحلة العميل">
        <div className="space-y-4">
          {data.orderMethods && data.orderMethods.length > 0 && (
            <div className="space-y-2">
              <SectionSubtitle icon={ShoppingCart}>طريقة الطلب</SectionSubtitle>
              <div className="flex flex-wrap gap-2">
                {data.orderMethods.map((method) => {
                  const label =
                    ORDER_METHODS.find((m) => m.value === method)?.label ??
                    method;
                  return (
                    <span
                      key={method}
                      className="px-3 py-1.5 rounded-lg text-sm bg-secondary-100 text-secondary-700"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <ClientBriefField
            icon={ClipboardList}
            label="أدوات المتابعة"
            value={data.followUpTools}
          />
        </div>
      </SectionLayout>
    );
  }

  // Edit/Wizard mode: render form
  return (
    <SectionLayout
      mode={mode}
      stepNumber={mode === "wizard" ? 4 : undefined}
      title="رحلة العميل"
      instructions={
        mode === "wizard"
          ? [
              "العميل كيف يشتري؟ (من المتجر دايركت، وإلا يكلمك واتساب، وإلا نموذج يعبيه؟)",
              "هل عندكم نظام يتابع السلات المتروكة أو العملاء المترددين؟",
            ]
          : undefined
      }
      isOptional={mode === "wizard"}
      onSkip={mode === "wizard" ? onSkip : undefined}
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
            render={({ field }) => (
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
              </FormItem>
            )}
          />

          {!hideNavigation && mode === "wizard" && (
            <NavigationButtons onBack={onBack} submitLabel="التالي" />
          )}
        </form>
      </Form>
    </SectionLayout>
  );
}
