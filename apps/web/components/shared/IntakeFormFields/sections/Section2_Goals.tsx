"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FormSelect,
  FormSelectTrigger,
  FormSelectValue,
  FormSelectContent,
  FormSelectItem,
} from "@/components/design-system/FormSelectControl";
import { Target, TrendingUp, Users, Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section2Data, FormMode } from "../types";

const GOAL_OPTIONS = [
  { value: "increase_sales", label: "زيادة المبيعات", icon: TrendingUp },
  { value: "brand_awareness", label: "تعزيز الوعي بالبراند", icon: Users },
  { value: "new_customers", label: "جذب عملاء جدد", icon: Users },
  { value: "launch_product", label: "إطلاق منتج جديد", icon: Sparkles },
];

const SEASONAL_OPTIONS = [
  { value: "ramadan", label: "رمضان" },
  { value: "eid", label: "العيد" },
  { value: "end_year", label: "نهاية العام" },
  { value: "summer", label: "الصيف" },
  { value: "valentines", label: "يوم التأسيس" },
  { value: "national_day", label: "اليوم الوطني" },
];

interface Section2_GoalsProps {
  initialData?: Section2Data;
  onDataChange: (data: Section2Data) => void;
  onValid: (valid: boolean) => void;
  mode?: FormMode;
  showInfoBox?: boolean;
}

export function Section2_Goals({
  initialData,
  onDataChange,
  onValid,
  mode = "portal",
  showInfoBox = true,
}: Section2_GoalsProps) {
  const isPortal = mode === "portal";
  const iconColor = isPortal ? "text-portal-icon" : "text-neutral-400";
  const cardBorder = isPortal ? "border-portal-card-border hover:border-portal-card-border" : "border-neutral-200 hover:border-neutral-300";
  const checkboxBorder = isPortal ? "border-portal-divider" : "border-neutral-300";
  const selectBorder = isPortal ? "border-portal-card-border" : "border-input";
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    initialData?.campaignGoals || []
  );

  const form = useForm({
    defaultValues: {
      campaignGoals: initialData?.campaignGoals || [],
      campaignOffer: initialData?.campaignOffer || "",
      competitors: initialData?.competitors || "",
      seasonalTiming: initialData?.seasonalTiming || "",
    },
    mode: "onChange",
  });

  const isValid = form.formState.isValid;

  useEffect(() => {
    onValid(isValid);
  }, [isValid, onValid]);

  const toggleGoal = useCallback((goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }, []);

  useEffect(() => {
    form.setValue("campaignGoals", selectedGoals);
  }, [selectedGoals, form]);

  const handleChange = useCallback(
    (data: Section2Data) => {
      onDataChange({ ...data, campaignGoals: selectedGoals });
    },
    [onDataChange, selectedGoals]
  );

  useEffect(() => {
    const subscription = form.watch((value) => {
      handleChange(value as Section2Data);
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
              نحدد أولوياتك لتركز ميزانيتك على اللي يوصلك لهدفك
            </p>
          </div>
        )}

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-natural-100">
            <Target className={cn("w-4 h-4", iconColor)} />
            أهداف الحملة
            <span className="text-danger-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((goal) => (
              <div
                key={goal.value}
                onClick={() => toggleGoal(goal.value)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                  selectedGoals.includes(goal.value)
                    ? "border-secondary-500 bg-secondary-50/50 shadow-sm"
                    : cardBorder
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center",
                    selectedGoals.includes(goal.value)
                      ? "bg-secondary-500 text-white"
                      : cn("border bg-white", checkboxBorder)
                  )}
                >
                  {selectedGoals.includes(goal.value) && (
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
                <goal.icon className={cn("w-5 h-5", iconColor)} />
                <span className="text-sm font-medium">{goal.label}</span>
              </div>
            ))}
          </div>
          {form.formState.errors.campaignGoals && (
            <p className="text-sm text-danger-500 mt-1">
              {form.formState.errors.campaignGoals.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="campaignOffer"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Sparkles className={cn("w-4 h-4", iconColor)} />
                عرض الحملة القوي
              </FormLabel>
              <FormTextareaControl
                placeholder="وش العرض القوي اللي بتقدمه؟ خصم، عرض محدود، هدية..."
                className="resize-none h-24"
                {...field}
              />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="competitors"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Target className={cn("w-4 h-4", iconColor)} />
                المنافسون
              </FormLabel>
              <FormInputControl
                placeholder="أقوى 3 منافسين عندك (مثال: مطعم البركة، مطعم النخيل...)"
                {...field}
              />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="seasonalTiming"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Calendar className={cn("w-4 h-4", iconColor)} />
                التوقيت الموسمي
              </FormLabel>
              <FormSelect
                onValueChange={field.onChange}
                defaultValue={field.value || ""}
                value={field.value || ""}
              >
                <FormSelectTrigger className={selectBorder}>
                  <FormSelectValue placeholder="اختر المناسبة (اختياري)" />
                </FormSelectTrigger>
                <FormSelectContent>
                  {SEASONAL_OPTIONS.map((opt) => (
                    <FormSelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </FormSelectItem>
                  ))}
                </FormSelectContent>
              </FormSelect>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}