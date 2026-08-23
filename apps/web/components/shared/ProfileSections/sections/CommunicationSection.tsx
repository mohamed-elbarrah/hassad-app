/**
 * CommunicationSection - Section 2: Business Communication Info
 *
 * Collects business-level communication data (businessName, industry).
 * Personal identity (name, email, phone) is collected separately by
 * `PersonalInfoSection` and written to the `User` table. This separation
 * eliminates the three-table duplication that previously caused
 * `/portal/account` and `/portal/profile` to show different names for
 * the same person.
 *
 * Supports three modes: wizard, edit, view
 */

"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import { Building2, Briefcase } from "lucide-react";
import { z } from "zod";
import {
  BUSINESS_TYPE_AR,
  BusinessType,
  CommunicationInfoSchema,
} from "@hassad/shared";
import type { CommunicationInfo } from "../types";
import { SectionLayout, NavigationButtons } from "../SectionLayout";
import type { ProfileMode } from "../types";

type CommunicationForm = z.infer<typeof CommunicationInfoSchema>;

const INDUSTRIES = [
  "تقنية",
  "عقارات",
  "صحة وجمال",
  "مطاعم ومقاهي",
  "تجارة إلكترونية",
  "تعليم",
  "سياحة وسفر",
  "خدمات",
  "أخرى",
];

interface CommunicationSectionProps {
  mode: ProfileMode;
  initialData?: CommunicationInfo;
  onDataChange?: (data: CommunicationForm) => void;
  onValid?: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  hideNavigation?: boolean;
}

export function CommunicationSection({
  mode,
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  hideNavigation = false,
}: CommunicationSectionProps) {
  const form = useForm<CommunicationForm>({
    resolver: zodResolver(CommunicationInfoSchema),
    defaultValues: {
      businessName: initialData?.businessName ?? "",
      businessType: initialData?.businessType ?? BusinessType.OTHER,
      industry: initialData?.industry ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset({
        businessName: initialData.businessName ?? "",
        businessType: initialData.businessType ?? BusinessType.OTHER,
        industry: initialData.industry ?? "",
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    onValid?.(form.formState.isValid);
  }, [form.formState.isValid, onValid]);

  // Keep form state local while the user edits. Persist only at the explicit
  // submit boundary; updating the parent on every keystroke causes the parent
  // to recreate initialData and reset the active form.

  const onSubmit = useCallback(
    (data: CommunicationForm) => {
      onDataChange?.(data);
      onNext?.();
    },
    [onDataChange, onNext],
  );

  // ── View mode: read-only display ────────────────────────────────
  if (mode === "view") {
    const data = initialData;
    if (!data) return null;

    const fields = [
      { icon: Building2, label: "اسم النشاط", value: data.businessName },
      {
        icon: Building2,
        label: "نوع النشاط",
        value: data.businessType
          ? BUSINESS_TYPE_AR[data.businessType]
          : undefined,
      },
      { icon: Briefcase, label: "المجال", value: data.industry },
    ];

    const hasData = fields.some((f) => f.value);
    if (!hasData) return null;

    return (
      <SectionLayout mode="view" title="بيانات النشاط">
        <div className="flex flex-col gap-3">
          {fields.map(
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
      </SectionLayout>
    );
  }

  // ── Edit/Wizard mode: form with businessName + industry ─────────
  return (
    <SectionLayout
      mode={mode}
      stepNumber={mode === "wizard" ? 2 : undefined}
      title="بيانات النشاط"
      instructions={
        mode === "wizard"
          ? [
              "هذه بيانات نشاطك التجاري — بياناتك الشخصية تم إدخالها في الخطوة السابقة",
              "جميع الحقول مطلوبة للمتابعة",
            ]
          : undefined
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FormField
            control={form.control}
            name="businessName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  اسم النشاط
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Input placeholder="اسم النشاط" {...field} />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessType"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel
                  htmlFor="communication-business-type"
                  className="flex items-center gap-2 text-sm"
                >
                  <Building2 className="size-4 text-muted-foreground" />
                  نوع النشاط
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || BusinessType.OTHER}
                  value={field.value || BusinessType.OTHER}
                >
                  <SelectTrigger
                    id="communication-business-type"
                    className="min-h-11"
                  >
                    <SelectValue placeholder="اختر نوع النشاط" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(BusinessType).map((value) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="min-h-11"
                      >
                        {BUSINESS_TYPE_AR[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel
                  htmlFor="communication-industry"
                  className="flex items-center gap-2 text-sm"
                >
                  <Briefcase className="size-4 text-muted-foreground" />
                  مجال النشاط
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || ""}
                  value={field.value || ""}
                >
                  <SelectTrigger
                    id="communication-industry"
                    className="min-h-11"
                  >
                    <SelectValue placeholder="اختر مجال النشاط" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{fieldState.error?.message}</FormMessage>
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
