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
import { TrendingUp } from "lucide-react";

const step6Schema = z.object({
  topCampaigns: z.array(z.string()).optional(),
  integrationStatus: z.boolean().optional(),
});

type Step6FormData = z.infer<typeof step6Schema>;

interface Step6_PerformanceProps {
  onBack: () => void;
  onNext: () => void;
  updateStepData: (step: number, data: any) => void;
}

export function Step6_Performance({ onBack, onNext, updateStepData }: Step6_PerformanceProps) {
  const [hasIntegration, setHasIntegration] = useState(false);

  const form = useForm<Step6FormData>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      topCampaigns: [],
      integrationStatus: false,
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    (data: Step6FormData) => {
      updateStepData(6, {
        topCampaigns: [],
        integrationStatus: hasIntegration,
      });
      onNext();
    },
    [updateStepData, hasIntegration, onNext]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            أفضل الحملات السابقة
          </label>

          <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
            <p className="text-natural-100 font-medium mb-2">
              شارك معنا أفضل الحملات السابقة
            </p>
            <p className="text-sm text-neutral-400 mt-1">
              اذكر اسم الحملة، المنصات المستخدمة، والنتائج التي حققتها
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-natural-100">
            الربط والتتبع
          </label>

          <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div>
              <p className="font-medium text-natural-100">
                هل البكسل (Pixel) وأكواد التتبع مربوطة وشغالة؟
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                Google Analytics، Google Tag Manager، Meta Pixel
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasIntegration(!hasIntegration)}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                hasIntegration ? "bg-secondary-500" : "bg-neutral-300"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  hasIntegration ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

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

export default Step6_Performance;
