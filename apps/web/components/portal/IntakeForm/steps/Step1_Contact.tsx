"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BusinessType } from "@hassad/shared";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { User, Building2, Phone, Mail, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const step1Schema = z.object({
  contactName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(80),
  businessName: z.string().min(2, "اسم النشاط يجب أن يكون حرفين على الأقل").max(100),
  businessType: z.nativeEnum(BusinessType, {
    message: "يرجى اختيار نوع النشاط التجاري",
  }),
  phone: z
    .string()
    .min(8, "رقم الهاتف غير صحيح")
    .max(20, "رقم الهاتف غير صحيح")
    .regex(/^(\+966)?5[0-9]{8}$/, "يرجى إدخال رقم هاتف سعودي صحيح (+966 5X XXX XXXX)"),
  email: z.string().email().optional().or(z.literal("")),
});

type Step1FormData = z.infer<typeof step1Schema>;

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم / كافيه",
  [BusinessType.CLINIC]: "عيادة / مركز صحي",
  [BusinessType.STORE]: "متجر / تجزئة",
  [BusinessType.SERVICE]: "شركة خدمات",
  [BusinessType.OTHER]: "أخرى",
};

interface Step1_ContactProps {
  onBack: () => void;
  onNext: () => void;
  updateStepData: (step: number, data: any) => void;
}

export function Step1_Contact({ onBack, onNext, updateStepData }: Step1_ContactProps) {
  const [isNextPressed, setIsNextPressed] = useState(false);

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      contactName: "",
      businessName: "",
      businessType: undefined,
      phone: "",
      email: "",
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    (data: Step1FormData) => {
      updateStepData(1, data);
      onNext();
    },
    [updateStepData, onNext]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="contactName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-neutral-400" />
                الاسم الكامل
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormInputControl placeholder="مثال: أحمد محمد" autoFocus {...field} />
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
                <Building2 className="w-4 h-4 text-neutral-400" />
                اسم النشاط
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormInputControl placeholder="مثال: مطعم النخيل" {...field} />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-neutral-400" />
                نوع النشاط التجاري
                <span className="text-danger-500">*</span>
              </FormLabel>
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                className={cn(
                  "flex h-11 w-full items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-right",
                  "focus:outline-none focus:ring-2 focus:ring-secondary-500",
                )}
              >
                <option value="" disabled>
                  اختر نوع نشاطك التجاري
                </option>
                {Object.values(BusinessType).map((type) => (
                  <option key={type} value={type}>
                    {BUSINESS_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-neutral-400" />
                رقم التواصل (واتساب)
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormInputControl placeholder="+966 5X XXX XXXX" type="tel" dir="ltr" {...field} />
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
                <Mail className="w-4 h-4 text-neutral-400" />
                البريد الإلكتروني
              </FormLabel>
              <FormInputControl placeholder="example@email.com" type="email" dir="ltr" {...field} />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <div className="pt-4">
          <ActionButton type="submit" variant="primary" className="w-full h-12 text-base font-semibold">
            التالي
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}

export default Step1_Contact;
