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
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FormSelect,
  FormSelectTrigger,
  FormSelectValue,
  FormSelectContent,
  FormSelectItem,
} from "@/components/design-system/FormSelectControl";
import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import { Building2, Briefcase } from "lucide-react";
import { z } from "zod";
import { CommunicationInfoSchema } from "@hassad/shared";
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
    defaultValues: initialData ?? {
      businessName: "",
      industry: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  useEffect(() => {
    onValid?.(form.formState.isValid);
  }, [form.formState.isValid, onValid]);

  useEffect(() => {
    if (mode === "view") return;

    const sub = form.watch((values) => {
      onDataChange?.(values as CommunicationForm);
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange, mode]);

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
      { icon: Briefcase, label: "المجال", value: data.industry },
    ];

    const hasData = fields.some((f) => f.value);
    if (!hasData) return null;

    return (
      <SectionLayout mode="view" title="بيانات النشاط">
        <div className="space-y-3">
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-portal-icon" />
                  اسم النشاط
                  <span className="text-danger-500">*</span>
                </FormLabel>
                <FormInputControl placeholder="اسم النشاط" {...field} />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-portal-icon" />
                  مجال النشاط
                  <span className="text-danger-500">*</span>
                </FormLabel>
                <FormSelect
                  onValueChange={field.onChange}
                  defaultValue={field.value || ""}
                  value={field.value || ""}
                >
                  <FormSelectTrigger>
                    <FormSelectValue placeholder="اختر مجال النشاط" />
                  </FormSelectTrigger>
                  <FormSelectContent>
                    {INDUSTRIES.map((ind) => (
                      <FormSelectItem key={ind} value={ind}>
                        {ind}
                      </FormSelectItem>
                    ))}
                  </FormSelectContent>
                </FormSelect>
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