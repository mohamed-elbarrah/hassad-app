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
import { User, Building2, Phone, Mail, Briefcase } from "lucide-react";
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
      contactName: "",
      businessName: "",
      industry: "",
      contactNumber: "",
      email: "",
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
      title="الملخص التواصلي"
      instructions={[
        "هذه المعلومات الأساسية للتواصل معك",
        "جميع الحقول مطلوبة للمتابعة",
      ]}
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
                <FormInputControl placeholder="رقم التواصل" type="tel" dir="ltr" {...field} />
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
                <FormInputControl placeholder="البريد الإلكتروني" type="email" dir="ltr" {...field} />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          {!hideNavigation && (
            <div className="flex justify-end pt-2">
              <ActionButton type="submit" variant="primary" size="lg">
                التالي
              </ActionButton>
            </div>
          )}
        </form>
      </Form>
    </StepLayout>
  );
}
