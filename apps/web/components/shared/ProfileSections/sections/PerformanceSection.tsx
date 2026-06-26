/**
 * PerformanceSection - Section 6: Past Performance & Budget
 *
 * Handles past campaigns, tracking setup, and budget range.
 * Supports three modes: wizard, edit, view
 */

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
import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import { CurrencySymbol } from "@/components/design-system/CurrencySymbol";
import {
  TrendingUp,
  BarChart3,
  Link2,
  DollarSign,
  FileText,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import {
  SectionLayout,
  NavigationButtons,
  SectionSubtitle,
} from "../SectionLayout";
import type { ProfileMode, PastPerformance, BudgetInfo } from "../types";

const formSchema = z.object({
  bestCampaigns: z.string().optional(),
  pastPerformance: z.string().optional(),
  trackingSetup: z.string().optional(),
  budgetRange: z.number().positive().optional(),
});

type PerformanceForm = z.infer<typeof formSchema>;

const TRACKING_OPTIONS = [
  { value: "active", label: "مربوطة وشغالة تمام" },
  { value: "new", label: "بنأسسها من الصفر" },
  { value: "partial", label: "مربوطة بس محتاجة تحديث" },
];

interface PerformanceSectionProps {
  mode: ProfileMode;
  initialData?: {
    pastPerformance?: PastPerformance;
    budgetInfo?: BudgetInfo;
  };
  onDataChange?: (data: {
    pastPerformance: PastPerformance;
    budgetInfo: BudgetInfo;
  }) => void;
  onValid?: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

export function PerformanceSection({
  mode,
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
  hideNavigation = false,
}: PerformanceSectionProps) {
  const { fmtAmount } = useCurrency();
  const [reportFiles, setReportFiles] = useState<File[]>([]);

  const form = useForm<PerformanceForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bestCampaigns: initialData?.pastPerformance?.bestCampaigns ?? "",
      pastPerformance: initialData?.pastPerformance?.pastPerformance ?? "",
      trackingSetup: initialData?.pastPerformance?.trackingSetup ?? "",
      budgetRange: initialData?.budgetInfo?.budgetRange ?? undefined,
    },
    mode: "onChange",
  });

  // Reset form when initialData changes (e.g., when profile loads from API)
  useEffect(() => {
    if (initialData) {
      form.reset({
        bestCampaigns: initialData.pastPerformance?.bestCampaigns ?? "",
        pastPerformance: initialData.pastPerformance?.pastPerformance ?? "",
        trackingSetup: initialData.pastPerformance?.trackingSetup ?? "",
        budgetRange: initialData.budgetInfo?.budgetRange ?? undefined,
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    onValid?.(true);
  }, [onValid]);

  const buildPerformanceData = useCallback(
    (values: PerformanceForm) => ({
      pastPerformance: {
        bestCampaigns: values.bestCampaigns,
        pastPerformance: values.pastPerformance,
        trackingSetup: values.trackingSetup,
      },
      budgetInfo: {
        budgetRange: values.budgetRange,
        previousReports: reportFiles.map((f) => f.name),
      },
    }),
    [reportFiles],
  );

  useEffect(() => {
    if (mode === "view") return;

    const sub = form.watch((values) => {
      onDataChange?.(buildPerformanceData(values as PerformanceForm));
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange, mode, buildPerformanceData]);

  const onSubmit = useCallback(
    (data: PerformanceForm) => {
      onDataChange?.(buildPerformanceData(data));
      onNext?.();
    },
    [onDataChange, onNext, buildPerformanceData],
  );

  // View mode: render read-only display
  if (mode === "view") {
    const data = initialData;
    if (!data) return null;

    const hasPerformance =
      data.pastPerformance?.bestCampaigns ||
      data.pastPerformance?.pastPerformance ||
      data.pastPerformance?.trackingSetup;
    const hasBudget =
      data.budgetInfo?.budgetRange ||
      (data.budgetInfo?.previousReports &&
        data.budgetInfo.previousReports.length > 0);

    if (!hasPerformance && !hasBudget) return null;

    const performanceFields = [
      {
        icon: TrendingUp,
        label: "أفضل الحملات السابقة",
        value: data.pastPerformance?.bestCampaigns,
      },
      {
        icon: BarChart3,
        label: "أداء الحملات",
        value: data.pastPerformance?.pastPerformance,
      },
      {
        icon: Link2,
        label: "الربط",
        value: data.pastPerformance?.trackingSetup
          ? TRACKING_OPTIONS.find(
              (t) => t.value === data.pastPerformance?.trackingSetup,
            )?.label
          : undefined,
      },
    ];

    return (
      <SectionLayout mode="view" title="الأداء السابق والميزانية">
        <div className="space-y-6">
          {hasPerformance && (
            <div className="space-y-3">
              <SectionSubtitle>الأداء السابق</SectionSubtitle>
              {performanceFields.map(
                (f) =>
                  f.value && (
                    <ClientBriefField
                      key={f.label}
                      icon={f.icon}
                      label={f.label}
                      value={f.value}
                    />
                  ),
              )}
            </div>
          )}

          {hasBudget && (
            <div className="space-y-3">
              <SectionSubtitle>الميزانية</SectionSubtitle>
              {data.budgetInfo?.budgetRange && (
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-secondary-50 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-secondary-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-300 font-medium">
                      الميزانية الشهرية
                    </p>
                    <p className="text-sm font-medium text-natural-100 mt-0.5">
                      {fmtAmount(data.budgetInfo.budgetRange)}{" "}
                      <CurrencySymbol className="inline-block" />
                    </p>
                  </div>
                </div>
              )}
              {data.budgetInfo?.previousReports &&
                data.budgetInfo.previousReports.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-portal-icon flex items-center gap-2">
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      التقارير السابقة
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.budgetInfo.previousReports.map((report, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg text-sm bg-secondary-100 text-secondary-700"
                        >
                          {report}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </SectionLayout>
    );
  }

  // Edit/Wizard mode: render form
  return (
    <SectionLayout
      mode={mode}
      stepNumber={mode === "wizard" ? 6 : undefined}
      title="الأداء السابق والميزانية"
      instructions={
        mode === "wizard"
          ? [
              "وش الإعلانات الأكثر نجاحًا وليش نجحت؟",
              "هل البكسل وأكواد التتبع والـ API مربوطة وشغالة تمام، ولا بنأسسها من الصفر؟",
              "كم ناوي تصرف في الشهر على المنصات؟",
            ]
          : undefined
      }
      isOptional={mode === "wizard"}
      onSkip={mode === "wizard" ? onSkip : undefined}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="bestCampaigns"
            render={({ field }) => (
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
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pastPerformance"
            render={({ field }) => (
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
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="trackingSetup"
              render={({ field }) => (
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budgetRange"
              render={({ field }) => (
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

          {!hideNavigation && mode === "wizard" && (
            <NavigationButtons onBack={onBack} submitLabel="التالي" />
          )}
        </form>
      </Form>
    </SectionLayout>
  );
}
