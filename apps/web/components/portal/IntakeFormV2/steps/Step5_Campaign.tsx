"use client";

import { useCallback, useEffect } from "react";
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
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Target, Megaphone, Gift, ShieldCheck, Calendar, Users } from "lucide-react";
import { StepLayout } from "../components/StepLayout";

const formSchema = z.object({
  campaignGoal: z.string().optional(),
  campaignDetails: z.string().optional(),
  campaignOffer: z.string().optional(),
  guarantees: z.string().optional(),
  campaignSeason: z.string().optional(),
  competitors: z.string().optional(),
});

type CampaignForm = z.infer<typeof formSchema>;

interface Step5Props {
  initialData?: CampaignForm;
  onDataChange: (data: CampaignForm) => void;
  onValid: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function Step5_Campaign({
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
}: Step5Props) {
  const form = useForm<CampaignForm>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? {
      campaignGoal: "",
      campaignDetails: "",
      campaignOffer: "",
      guarantees: "",
      campaignSeason: "",
      competitors: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    onValid(true);
  }, [onValid]);

  useEffect(() => {
    const sub = form.watch((values) => {
      onDataChange(values as CampaignForm);
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange]);

  const onSubmit = useCallback(
    (data: CampaignForm) => {
      onDataChange(data);
      onNext?.();
    },
    [onDataChange, onNext],
  );

  return (
    <StepLayout
      stepNumber={5}
      title="الحملة الإعلانية"
      instructions={[
        "وش الهدف الأول والثاني من هالحملة؟ وكيف تقيس نجاح حملاتك عادة؟",
        "وش عرضك القوي؟ وش الحافز والعروض القوية اللي بنصيد فيها العميل؟",
      ]}
      isOptional
      onSkip={onSkip}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="campaignGoal"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-portal-icon" />
                  الهدف
                </FormLabel>
                <FormTextareaControl
                  placeholder="وش الهدف الأول والثاني من هالحملة؟ وكيف تقيس نجاح حملاتك عادة؟"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campaignDetails"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-portal-icon" />
                  تفاصيل الحملة الإعلانية
                </FormLabel>
                <FormTextareaControl
                  placeholder="وش بنعلن عنه؟ الحملة لمنتج واحد وإلا مجموعة منتجات؟ إذا مجموعة عطنا أهمها بالترتيب."
                  className="min-h-[120px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campaignOffer"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4 text-portal-icon" />
                  العرض في الحملة
                </FormLabel>
                <FormTextareaControl
                  placeholder="وش عرضك القوي؟ وش الحافز والعروض القوية اللي بنصيد فيها العميل؟"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guarantees"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-portal-icon" />
                  الضمانات
                </FormLabel>
                <FormTextareaControl
                  placeholder="عندك سياسة إرجاع أو ضمان ذهبي يخلي العميل يشتري وهو مرتاح البال؟"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campaignSeason"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-portal-icon" />
                  المناسبة / الموسم
                </FormLabel>
                <FormInputControl
                  placeholder="هل الحملة مرتبطة بموسم أو توقيت معين؟"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="competitors"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-portal-icon" />
                  المنافسون
                </FormLabel>
                <FormTextareaControl
                  placeholder="مين منافسينك في السوق؟ عطنا اقوى 3 علامات تجارية منافسة لك"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-portal-divider">
            {onBack && (
              <ActionButton type="button" variant="outline" onClick={onBack}>
                السابق
              </ActionButton>
            )}
            <ActionButton type="submit" variant="primary" className="mr-auto">
              التالي
            </ActionButton>
          </div>
        </form>
      </Form>
    </StepLayout>
  );
}
