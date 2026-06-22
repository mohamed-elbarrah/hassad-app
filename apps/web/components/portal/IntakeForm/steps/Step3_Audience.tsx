"use client";

import { useCallback, useState } from "react";
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
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Users, Target, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const step3Schema = z.object({
  audienceLocation: z.string().optional(),
  brandTone: z.string().optional(),
  tagline: z.string().max(100).optional(),
  appearanceStyle: z.string().optional(),
});

type Step3FormData = z.infer<typeof step3Schema>;

const BRAND_TONES = [
  { value: "formal", label: "رسمي وجاد" },
  { value: "casual", label: "سواليف" },
  { value: "youthful", label: "شبابي" },
  { value: "professional", label: "احترافي" },
  { value: "friendly", label: "ودود" },
];

const APPEARANCE_STYLES = [
  { value: "voiceover", label: "مؤدي صوتي" },
  { value: "model", label: "مودل بوجه" },
  { value: "hands", label: "تصوير يدين" },
  { value: "infographic", label: "إنفوجراف" },
  { value: "animation", label: "أنيميشن" },
];

interface Step3_AudienceProps {
  onBack: () => void;
  onNext: () => void;
  updateStepData: (step: number, data: any) => void;
}

export function Step3_Audience({ onBack, onNext, updateStepData }: Step3_AudienceProps) {
  const form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      audienceLocation: "",
      brandTone: "",
      tagline: "",
      appearanceStyle: "",
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    (data: Step3FormData) => {
      updateStepData(3, {
        ...data,
        audienceInterests: ["سوشيال ميديا", "تسويق رقمي", "تصميم", "براند", "محتوى"],
        contentRestrictions: [],
      });
      onNext();
    },
    [updateStepData, onNext]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="audienceLocation"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-neutral-400" />
                الموقع / المنطقة
              </FormLabel>
              <FormInputControl placeholder="مثال: الرياض، جدة، الشرقية" {...field} />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brandTone"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-neutral-400" />
                النبرة المفضلة
              </FormLabel>
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                className={cn(
                  "flex h-11 w-full items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-right",
                  "focus:outline-none focus:ring-2 focus:ring-secondary-500",
                )}
              >
                <option value="" disabled>
                  اختر النبرة
                </option>
                {BRAND_TONES.map((opt) => (
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
          name="tagline"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-neutral-400" />
                الشعار اللفظي
              </FormLabel>
              <FormInputControl placeholder="شعار ثابت لبراندك" {...field} />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appearanceStyle"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-neutral-400" />
                طريقة الظهور في الفيديو
              </FormLabel>
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                className={cn(
                  "flex h-11 w-full items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-right",
                  "focus:outline-none focus:ring-2 focus:ring-secondary-500",
                )}
              >
                <option value="" disabled>
                  اختر طريقة الظهور
                </option>
                {APPEARANCE_STYLES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between gap-4 pt-6">
          <ActionButton type="button" variant="outline" onClick={onBack}>
            السابق
          </ActionButton>

          <ActionButton type="submit" variant="primary">
            التالي
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}

export default Step3_Audience;
