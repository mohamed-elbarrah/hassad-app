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
import { Target, TrendingUp, Users, Sparkles, Calendar } from "lucide-react";

interface Section2FormData {
  campaignGoals?: string[];
  campaignOffer?: string;
  competitors?: string;
  seasonalTiming?: string;
}

const GOAL_OPTIONS = [
  { value: "increase_sales", label: "زيادة المبيعات", icon: TrendingUp },
  { value: "brand_awareness", label: "تعزيز الوعي بالبراند", icon: Users },
  { value: "new_customers", label: "جذب عملاء جدد", icon: Users },
  { value: "launch_product", label: "إطلاق منتج جديد", icon: Sparkles },
];

interface Section2_GoalsProps {
  initialData?: Section2FormData;
  onDataChange: (data: Section2FormData) => void;
  onValid: (valid: boolean) => void;
}

export function Section2_Goals({
  initialData,
  onDataChange,
  onValid,
}: Section2_GoalsProps) {
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
    (data: Section2FormData) => {
      onDataChange({ ...data, campaignGoals: selectedGoals });
    },
    [onDataChange, selectedGoals]
  );

  useEffect(() => {
    const subscription = form.watch((value) => {
      handleChange(value as Section2FormData);
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
            نحدد أولوياتك لتركز ميزانيتك على اللي يوصلك لهدفك
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-natural-100">
            <Target className="w-4 h-4 text-neutral-400" />
            أهداف الحملة
            <span className="text-danger-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((goal) => (
              <div
                key={goal.value}
                onClick={() => toggleGoal(goal.value)}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGoals.includes(goal.value)
                    ? "border-secondary-500 bg-secondary-50/50 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center ${
                    selectedGoals.includes(goal.value)
                      ? "bg-secondary-500 text-white"
                      : "border border-neutral-300 bg-white"
                  }`}
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
                <goal.icon className="w-5 h-5 text-neutral-400" />
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
                <Sparkles className="w-4 h-4 text-neutral-400" />
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
                <Target className="w-4 h-4 text-neutral-400" />
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
                <Calendar className="w-4 h-4 text-neutral-400" />
                التوقيت الموسمي
              </FormLabel>
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                className="flex h-11 w-full items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                <option value="" disabled>
                  اختر المناسبة (اختياري)
                </option>
                <option value="ramadan">رمضان</option>
                <option value="eid">العيد</option>
                <option value="end_year">نهاية العام</option>
                <option value="summer">الصيف</option>
                <option value="valentines">يوم التأسيس</option>
                <option value="national_day">اليوم الوطني</option>
              </select>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
