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
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Building2, FileText, Target, DollarSign } from "lucide-react";

const step2Schema = z.object({
  brandStory: z.string().min(50, "قصة البراند يجب أن تكون مفصلة").max(500),
  productDescription: z.string().min(50, "الوصف مطلوب").max(500),
  uniqueValue: z.string().min(20, "القيمة المضافة يجب أن تكون مفصلة").max(300),
  benefits: z.string().min(20, "وصف الفوائد مطلوب").max(500),
});

type Step2FormData = z.infer<typeof step2Schema>;

interface Step2_ProductProps {
  onBack: () => void;
  onNext: () => void;
  updateStepData: (step: number, data: any) => void;
}

export function Step2_Product({ onBack, onNext, updateStepData }: Step2_ProductProps) {
  const form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      brandStory: "",
      productDescription: "",
      uniqueValue: "",
      benefits: "",
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    (data: Step2FormData) => {
      updateStepData(2, data);
      onNext();
    },
    [updateStepData, onNext]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="brandStory"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-neutral-400" />
                قصة البراند
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormTextareaControl
                placeholder="ابدأ من البداية، كواليس التصنيع، تجارب العملاء الأوائل..."
                className="resize-none h-32"
                {...field}
              />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productDescription"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-neutral-400" />
                وصف تفصيلي للمنتج
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormTextareaControl
                placeholder="ماذا تقدم؟ اشرح وكأنك واقف قدام العميل..."
                className="resize-none h-32"
                {...field}
              />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uniqueValue"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-neutral-400" />
                القيمة المضافة
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormTextareaControl
                placeholder="وش ميزتك الجوهرية؟ وش يخليك تفرق عن الكل؟"
                className="resize-none h-24"
                {...field}
              />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="benefits"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-neutral-400" />
                الفوائد
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormTextareaControl
                placeholder="وش بيستفيد العميل؟ زبونك وش بيتغير في حياته بعد ما يجرب منتجك؟"
                className="resize-none h-32"
                {...field}
              />
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

export default Step2_Product;
