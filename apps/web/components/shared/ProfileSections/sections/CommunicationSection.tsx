/**
 * CommunicationSection - Section 1: Communication Info
 *
 * Handles contact and basic business information.
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
import { ActionButton } from "@/components/design-system/ActionButton";
import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import { User, Building2, Phone, Mail, Briefcase } from "lucide-react";
import { z } from "zod";
import { CommunicationInfoSchema } from "@hassad/shared";
import type { CommunicationInfo } from "../types";
import { SectionLayout, NavigationButtons } from "../SectionLayout";
import type { ProfileMode } from "../types";

// Schema type for form (validation)
type CommunicationForm = z.infer<typeof CommunicationInfoSchema>;

// Input type for view mode (all optional)
type CommunicationViewData = CommunicationInfo;

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
  initialData?: CommunicationViewData;
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
      contactName: "",
      businessName: "",
      industry: "",
      contactNumber: "",
      email: "",
    },
    mode: "onChange",
  });

  // Reset form when initialData changes (e.g., when profile loads from API)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  // Track validity
  useEffect(() => {
    onValid?.(form.formState.isValid);
  }, [form.formState.isValid, onValid]);

  // Sync form changes to parent
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

  // View mode: render read-only display
  if (mode === "view") {
    const data = initialData;
    if (!data) return null;

    const fields = [
      { icon: User, label: "الاسم", value: data.contactName },
      { icon: Building2, label: "اسم النشاط", value: data.businessName },
      { icon: Briefcase, label: "المجال", value: data.industry },
      {
        icon: Phone,
        label: "رقم التواصل",
        value: data.contactNumber,
        dir: "ltr" as const,
      },
      {
        icon: Mail,
        label: "البريد الإلكتروني",
        value: data.email,
        dir: "ltr" as const,
      },
    ];

    const hasData = fields.some((f) => f.value);
    if (!hasData) return null;

    return (
      <SectionLayout mode="view" title="معلومات التواصل">
        <div className="space-y-3">
          {fields.map(
            (f) =>
              f.value && (
                <ClientBriefField
                  key={f.label}
                  icon={f.icon}
                  label={f.label}
                  value={f.value}
                  dir={f.dir}
                />
              ),
          )}
        </div>
      </SectionLayout>
    );
  }

  // Edit/Wizard mode: render form
  return (
    <SectionLayout
      mode={mode}
      stepNumber={mode === "wizard" ? 1 : undefined}
      title="الملخص التواصلي"
      instructions={
        mode === "wizard"
          ? [
              "هذه المعلومات الأساسية للتواصل معك",
              "جميع الحقول مطلوبة للمتابعة",
            ]
          : undefined
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-portal-icon" />
                  اسمك
                  <span className="text-danger-500">*</span>
                </FormLabel>
                <FormInputControl placeholder="اسمك" {...field} />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-portal-icon" />
                  رقم التواصل
                  <span className="text-danger-500">*</span>
                </FormLabel>
                <FormInputControl
                  placeholder="رقم التواصل"
                  type="tel"
                  dir="ltr"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-portal-icon" />
                  البريد الإلكتروني
                  <span className="text-danger-500">*</span>
                </FormLabel>
                <FormInputControl
                  placeholder="البريد الإلكتروني"
                  type="email"
                  dir="ltr"
                  {...field}
                />
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
