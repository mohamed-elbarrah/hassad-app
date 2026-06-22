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

const step5Schema = z.object({
  campaignGoals: z.array(z.string()).min(1, "اختر هدف واحد على الأقل"),
  campaignOffer: z.string().min(10, "العرض مطلوب"),
  seasonalTiming: z.string().optional(),
  competitors: z.string().min(5, "أدخل اسماء المنافسين"),
});

type Step5FormData = z.infer<typeof step5Schema>;

const CAMPAIGN_GOALS = [
  "زيادة المبيعات",
  "تعزيز الوعي بالبراند",
  "جذب عملاء جدد",
  "إطلاق منتج جديد",
];

interface Step5_CampaignProps {
  onBack: () => void;
  onNext: () => void;
  updateStepData: (step: number, data: any) => void;
}

export function Step5_Campaign({ onBack, onNext, updateStepData }: Step5_CampaignProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const form = useForm<Step5FormData>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      campaignGoals: [],
      campaignOffer: "",
      seasonalTiming: "",
      competitors: "",
    },
    mode: "onChange",
  });

  const toggleGoal = useCallback((goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }, []);

  const onSubmit = useCallback(
    (data: Step5FormData) => {
      updateStepData(5, {
        ...data,
        campaignGoals: selectedGoals,
        guarantees: [],
      });
      onNext();
    },
    [updateStepData, selectedGoals, onNext]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            الهدف من الحملة
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAMPAIGN_GOALS.map((goal) => (
              <div
                key={goal}
                onClick={() => toggleGoal(goal)}
                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer"
              >
                <span className="w-4 h-4 rounded border border-neutral-300"></span>
                <span className="text-sm font-medium">{goal}</span>
              </div>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="campaignOffer"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                عرض الحملة القوي
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormTextareaControl
                placeholder="وش عرضك القوي؟ الحافز والعروض..."
                className="resize-none h-24"
                {...field}
              />
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="seasonalTiming"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                المناسبة / الموسم
              </FormLabel>
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                className="flex h-11 w-full items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                <option value="" disabled>
                  اختر المناسبة
                </option>
                <option value="ramadan">رمضان</option>
                <option value="eid">العيد</option>
                <option value="end_year">نهاية العام</option>
                <option value="summer">الصيف</option>
              </select>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="competitors"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                المنافسون
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormInputControl placeholder="أقوى 3 علامات تجارية منافسة" {...field} />
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

export default Step5_Campaign;
