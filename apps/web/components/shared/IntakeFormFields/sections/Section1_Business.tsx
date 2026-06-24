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
import {
  FormSelect,
  FormSelectTrigger,
  FormSelectValue,
  FormSelectContent,
  FormSelectItem,
} from "@/components/design-system/FormSelectControl";
import { Building2, Target, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section1Data, FormMode } from "../types";

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
  initialData?: Section1Data;
  onDataChange: (data: Section1Data) => void;
  onValid: (valid: boolean) => void;
  mode?: FormMode;
  showInfoBox?: boolean;
}

export function Section1_Business({
  initialData,
  onDataChange,
  onValid,
  mode = "portal",
  showInfoBox = true,
}: Section1_BusinessProps) {
  const isPortal = mode === "portal";
  const sectionBg = isPortal ? "" : "bg-card";
  const borderColor = isPortal ? "border-secondary-100" : "border-border";
  const iconColor = isPortal ? "text-portal-icon" : "text-neutral-400";
  const charColor = isPortal ? "text-portal-icon" : "text-neutral-400";

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
    (data: Section1Data) => {
      onDataChange(data);
    },
    [onDataChange]
  );

  useEffect(() => {
    const subscription = form.watch((value) => {
      handleChange(value as Section1Data);
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
              نساعدك في الحصول على حلول تسويقية مصممة خصيصاً لنشاطك
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="industry"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Building2 className={cn("w-4 h-4", iconColor)} />
                المجال / النشاط التجاري
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormSelect
                onValueChange={field.onChange}
                defaultValue={field.value || ""}
                value={field.value || ""}
              >
                <FormSelectTrigger className={cn(isPortal ? "border-portal-card-border" : "border-input")}>
                  <FormSelectValue placeholder="اختر مجال نشاطك" />
                </FormSelectTrigger>
                <FormSelectContent>
                  {INDUSTRY_OPTIONS.map((opt) => (
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

        <FormField
          control={form.control}
          name="businessDescription"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Building2 className={cn("w-4 h-4", iconColor)} />
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
                <span className={cn("text-xs", charColor)}>
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
                <Target className={cn("w-4 h-4", iconColor)} />
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
                  <DollarSign className={cn("w-4 h-4", iconColor)} />
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
                  <DollarSign className={cn("w-4 h-4", iconColor)} />
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