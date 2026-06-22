"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { Building2, Target, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section1FormData {
  industry?: string;
  businessDescription?: string;
  targetAudience?: string;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
}

const INDUSTRY_OPTIONS = [
  { value: "restaurant", label: "مطعم / كافيه" },
  { value: "clinic", label: "عيادة / مركز صحي" },
  { value: "store", label: "متجر / تجزئة" },
  { value: "service", label: "شركة خدمات" },
  { value: "education", label: "تعليم / تدريب" },
  { value: "health", label: "صحة / عافية" },
  { value: "technology", label: "تكنولوجيا" },
  { value: "other", label: "أخرى" },
];

interface Section1_BusinessProps {
  initialData?: Section1FormData;
  onDataChange: (data: Section1FormData) => void;
  onValid: (valid: boolean) => void;
}

export function Section1_Business({
  initialData,
  onDataChange,
  onValid,
}: Section1_BusinessProps) {
  const form = useForm({
    defaultValues: {
      industry: initialData?.industry || "",
      businessDescription: initialData?.businessDescription || "",
      targetAudience: initialData?.targetAudience || "",
      budgetRangeMin: initialData?.budgetRangeMin,
      budgetRangeMax: initialData?.budgetRangeMax,
    },
    mode: "onChange",
  });

  const isValid = form.formState.isValid;

  useEffect(() => {
    onValid(isValid);
  }, [isValid, onValid]);

  const handleChange = useCallback(
    (data: Section1FormData) => {
      onDataChange(data);
    },
    [onDataChange]
  );

  useEffect(() => {
    const subscription = form.watch((value) => {
      handleChange(value as Section1FormData);
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
            نساعدك في الحصول على حلول تسويقية مصممة خصيصاً لنشاطك
          </p>
        </div>

        <FormField
          control={form.control}
          name="industry"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-neutral-400" />
                المجال / النشاط التجاري
                <span className="text-danger-500">*</span>
              </FormLabel>
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                className={cn(
                  "flex h-11 w-full items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-right",
                  "focus:outline-none focus:ring-2 focus:ring-secondary-500"
                )}
              >
                <option value="" disabled>
                  اختر مجال نشاطك
                </option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessDescription"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-neutral-400" />
                قصة النشاط التجاري
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormTextareaControl
                placeholder="مثال: مطعم متخصص في المأكولات الإيطالية، بدأنا في 2020 بهدف تقديم تجربة طعام أصيلة..."
                className="resize-none h-32"
                {...field}
              />
              <div className="flex justify-between items-center mt-1">
                <FormMessage>{fieldState.error?.message}</FormMessage>
                <span className="text-xs text-neutral-400">
                  {field.value?.length || 0} / 1000
                </span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-neutral-400" />
                الجمهور المستهدف
              </FormLabel>
              <FormTextareaControl
                placeholder="مثال: رجال ونساء 25-45 سنة، مهتمين بالطعام الصحي، في الرياض وجدة..."
                className="resize-none h-24"
                {...field}
              />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budgetRangeMin"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-neutral-400" />
                  الميزانية من (SAR)
                </FormLabel>
                <FormInputControl
                  type="number"
                  min={0}
                  placeholder="0"
                  dir="ltr"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budgetRangeMax"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-neutral-400" />
                  الميزانية إلى (SAR)
                </FormLabel>
                <FormInputControl
                  type="number"
                  min={0}
                  placeholder="0"
                  dir="ltr"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
