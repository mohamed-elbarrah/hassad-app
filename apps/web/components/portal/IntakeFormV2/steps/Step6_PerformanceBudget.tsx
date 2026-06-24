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
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FormSelect,
  FormSelectTrigger,
  FormSelectValue,
  FormSelectContent,
  FormSelectItem,
} from "@/components/design-system/FormSelectControl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ActionButton } from "@/components/design-system/ActionButton";
import { TrendingUp, BarChart3, Link2, DollarSign, FileText } from "lucide-react";
import { StepLayout } from "../components/StepLayout";

const formSchema = z.object({
  bestCampaigns: z.string().optional(),
  pastPerformance: z.string().optional(),
  trackingSetup: z.string().optional(),
  budgetRange: z.number().positive().optional(),
});

type PerformanceBudgetForm = z.infer<typeof formSchema>;

const TRACKING_OPTIONS = [
  { value: "active", label: "مربوطة وشغالة تمام" },
  { value: "new", label: "بنأسسها من الصفر" },
  { value: "partial", label: "مربوطة بس محتاجة تحديث" },
];

interface Step6Props {
  initialData?: PerformanceBudgetForm & { previousReports?: string[] };
  onDataChange: (data: PerformanceBudgetForm & { previousReports?: string[] }) => void;
  onValid: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function Step6_PerformanceBudget({
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
}: Step6Props) {
  const [reportFiles, setReportFiles] = useState<File[]>([]);

  const form = useForm<PerformanceBudgetForm>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? {
      bestCampaigns: "",
      pastPerformance: "",
      trackingSetup: "",
      budgetRange: undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    onValid(true);
  }, [onValid]);

  useEffect(() => {
    const sub = form.watch((values) => {
      onDataChange({
        ...(values as PerformanceBudgetForm),
        previousReports: reportFiles.map((f) => f.name),
      });
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange, reportFiles]);

  const onSubmit = useCallback(
    (data: PerformanceBudgetForm) => {
      onDataChange({
        ...data,
        previousReports: reportFiles.map((f) => f.name),
      });
      onNext?.();
    },
    [onDataChange, onNext, reportFiles],
  );

  return (
    <StepLayout
      stepNumber={6}
      title="الأداء السابق والميزانية"
      instructions={[
        "وش الإعلانات الأكثر نجاحًا وليش نجحت؟",
        "هل البكسل وأكواد التتبع والـ API مربوطة وشغالة تمام، ولا بنأسسها من الصفر؟",
        "كم ناوي تصرف في الشهر على المنصات؟",
      ]}
      isOptional
      onSkip={onSkip}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="bestCampaigns"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-portal-icon" />
                  أفضل الحملات السابقة
                </FormLabel>
                <FormTextareaControl
                  placeholder="وش الإعلانات الأكثر نجاحًا وليش نجحت؟"
                  className="min-h-[120px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pastPerformance"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-portal-icon" />
                  أداء الحملات السابقة
                </FormLabel>
                <FormTextareaControl
                  placeholder="مهم ذكر المنصات الإعلانية المستخدمة - نوع المواد الإبداعية (صور – ريل – تصميم اعلاني)، مدة الحملة وتوقيتها, الميزانية المخصصة لها، طريقة قياس النتائج (نقرات، مبيعات، تسجيل،)، النتائج الإيجابية أو السلبية التي خرجتم بها."
                  className="min-h-[120px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="trackingSetup"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-portal-icon" />
                    الربط
                  </FormLabel>
                  <FormSelect
                    onValueChange={field.onChange}
                    defaultValue={field.value || ""}
                    value={field.value || ""}
                  >
                    <FormSelectTrigger>
                      <FormSelectValue placeholder="اختر حالة الربط" />
                    </FormSelectTrigger>
                    <FormSelectContent>
                      {TRACKING_OPTIONS.map((opt) => (
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
              name="budgetRange"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-portal-icon" />
                    الميزانية (شهرياً)
                  </FormLabel>
                  <FormInputControl
                    type="number"
                    placeholder="كم ناوي تصرف في الشهر؟"
                    dir="ltr"
                    {...field}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val ? Number(val) : undefined);
                    }}
                    value={field.value ?? ""}
                  />
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3">
            <span className="text-sm font-medium text-natural-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-portal-icon" />
              التقارير السابقة
            </span>
            <FileDropzone
              files={reportFiles}
              onFilesChange={setReportFiles}
              maxFiles={5}
              maxSizeMB={10}
            />
          </div>

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
        </form>
      </Form>
    </StepLayout>
  );
}
