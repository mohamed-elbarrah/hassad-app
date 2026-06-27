/**
 * Step1_Communication - DEPRECATED legacy wizard step
 *
 * This component is no longer used by the main wizard (`IntakeFormV2`
 * now uses the shared `CommunicationSection` and `PersonalInfoSection`
 * components from `@/components/shared/ProfileSections`). It is kept
 * as a re-export for backward compatibility with any external code that
 * imports it, but its form now only collects business-level fields
 * (businessName, industry). Personal identity (name, email, phone)
 * belongs to the `User` table and is collected separately by
 * `PersonalInfoSection`.
 *
 * @deprecated Use `CommunicationSection` and `PersonalInfoSection` instead.
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
import { Building2, Briefcase } from "lucide-react";
import { CommunicationInfoSchema, type IntakeFormV2Input } from "@hassad/shared";
import { StepLayout } from "../components/StepLayout";

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

interface Step1Props {
  initialData?: IntakeFormV2Input["communicationInfo"];
  onDataChange: (data: IntakeFormV2Input["communicationInfo"]) => void;
  onValid: (valid: boolean) => void;
  onNext?: () => void;
  hideNavigation?: boolean;
}

export function Step1_Communication({
  initialData,
  onDataChange,
  onValid,
  onNext,
  hideNavigation = false,
}: Step1Props) {
  const form = useForm<IntakeFormV2Input["communicationInfo"]>({
    resolver: zodResolver(CommunicationInfoSchema),
    defaultValues: initialData ?? {
      businessName: "",
      industry: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    onValid(form.formState.isValid);
  }, [form.formState.isValid, onValid]);

  useEffect(() => {
    const sub = form.watch((values) => {
      onDataChange(values as IntakeFormV2Input["communicationInfo"]);
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange]);

  const onSubmit = useCallback(
    (data: IntakeFormV2Input["communicationInfo"]) => {
      onDataChange(data);
      onNext?.();
    },
    [onDataChange, onNext],
  );

  return (
    <StepLayout
      stepNumber={1}
      title="بيانات النشاط"
      instructions={[
        "هذه بيانات نشاطك التجاري",
        "جميع الحقول مطلوبة للمتابعة",
      ]}
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

          {!hideNavigation && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-secondary-500 px-5 py-2.5 text-sm font-medium text-white"
              >
                التالي
              </button>
            </div>
          )}
        </form>
      </Form>
    </StepLayout>
  );
}