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
import {
  FormSelect,
  FormSelectTrigger,
  FormSelectValue,
  FormSelectContent,
  FormSelectItem,
} from "@/components/design-system/FormSelectControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Users, MessageCircle, ShieldCheck, Hash, Video } from "lucide-react";
import { StepLayout } from "../components/StepLayout";

const formSchema = z.object({
  customerAnalysis: z.string().optional(),
  faq: z.string().optional(),
  toneOfVoice: z.string().optional(),
  boundaries: z.string().optional(),
  verbalSlogan: z.string().optional(),
  appearanceMethod: z.string().optional(),
});

type AudienceMessagingForm = z.infer<typeof formSchema>;

const TONE_OPTIONS = [
  { value: "formal", label: "رسمي وجاد" },
  { value: "casual", label: "سواليف" },
  { value: "youthful", label: "شبابي" },
  { value: "professional", label: "احترافي" },
];

const APPEARANCE_OPTIONS = [
  { value: "voiceover", label: "مؤدي صوتي" },
  { value: "model", label: "مودل بوجه واضح" },
  { value: "hands", label: "تصوير يدين للمنتج" },
];

interface Step3Props {
  initialData?: { customerAnalysis?: string; faq?: string; toneOfVoice?: string; boundaries?: string; verbalSlogan?: string; appearanceMethod?: string };
  onDataChange: (data: { audienceInfo: { customerAnalysis?: string; faq?: string }; brandVoice: { toneOfVoice?: string; boundaries?: string; verbalSlogan?: string; appearanceMethod?: string } }) => void;
  onValid: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function Step3_AudienceMessaging({
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
}: Step3Props) {
  const form = useForm<AudienceMessagingForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerAnalysis: initialData?.customerAnalysis ?? "",
      faq: initialData?.faq ?? "",
      toneOfVoice: initialData?.toneOfVoice ?? "",
      boundaries: initialData?.boundaries ?? "",
      verbalSlogan: initialData?.verbalSlogan ?? "",
      appearanceMethod: initialData?.appearanceMethod ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    onValid(true);
  }, [onValid]);

  useEffect(() => {
    const sub = form.watch((values) => {
      const v = values as AudienceMessagingForm;
      onDataChange({
        audienceInfo: {
          customerAnalysis: v.customerAnalysis,
          faq: v.faq,
        },
        brandVoice: {
          toneOfVoice: v.toneOfVoice,
          boundaries: v.boundaries,
          verbalSlogan: v.verbalSlogan,
          appearanceMethod: v.appearanceMethod,
        },
      });
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange]);

  const onSubmit = useCallback(
    (data: AudienceMessagingForm) => {
      onDataChange({
        audienceInfo: { customerAnalysis: data.customerAnalysis, faq: data.faq },
        brandVoice: {
          toneOfVoice: data.toneOfVoice,
          boundaries: data.boundaries,
          verbalSlogan: data.verbalSlogan,
          appearanceMethod: data.appearanceMethod,
        },
      });
      onNext?.();
    },
    [onDataChange, onNext],
  );

  return (
    <StepLayout
      stepNumber={3}
      title="الجمهور المستهدف + الرسائل والهوية"
      instructions={[
        "أوصف لنا عميلك المثالي: كم عمره؟ وش جنسه؟ وين ساكن؟ وش اهتماماته؟ وش مشاكله اللي بتحلها؟",
        "الخطوط الحمراء: وش الأشياء أو الكلمات اللي ما ودك تطلع في المحتوى و إعلاناتك أبد؟",
      ]}
      isOptional
      onSkip={onSkip}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <h4 className="text-sm font-semibold text-natural-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-portal-icon" />
                تحليل الجمهور
              </h4>

              <FormField
                control={form.control}
                name="customerAnalysis"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm">تحليل العملاء</FormLabel>
                    <FormTextareaControl
                      placeholder="أوصف لنا عميلك المثالي: كم عمره؟ وش جنسه؟ وين ساكن؟ وش اهتماماته؟"
                      className="min-h-[120px]"
                      {...field}
                    />
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="faq"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm">الأسئلة الشائعة</FormLabel>
                    <FormTextareaControl
                      placeholder="وش أكثر الأسئلة اللي تجيك من العملاء؟ وكيف ترد عليهم؟"
                      className="min-h-[120px]"
                      {...field}
                    />
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-5">
              <h4 className="text-sm font-semibold text-natural-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-portal-icon" />
                الرسائل والهوية
              </h4>

              <FormField
                control={form.control}
                name="toneOfVoice"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm">النبرة</FormLabel>
                    <FormSelect
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                      value={field.value || ""}
                    >
                      <FormSelectTrigger>
                        <FormSelectValue placeholder="اختر النبرة" />
                      </FormSelectTrigger>
                      <FormSelectContent>
                        {TONE_OPTIONS.map((opt) => (
                          <FormSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="boundaries"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-portal-icon" />
                      الحدود / العوائق
                    </FormLabel>
                    <FormTextareaControl
                      placeholder="الخطوط الحمراء: وش الأشياء أو الكلمات اللي ما ودك تطلع في المحتوى أبد؟"
                      className="min-h-[80px]"
                      {...field}
                    />
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="verbalSlogan"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm flex items-center gap-2">
                      <Hash className="w-4 h-4 text-portal-icon" />
                      الشعار اللفظي
                    </FormLabel>
                    <FormInputControl
                      placeholder="وش الشعار اللفظي الثابت لبراندك؟"
                      {...field}
                    />
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appearanceMethod"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm flex items-center gap-2">
                      <Video className="w-4 h-4 text-portal-icon" />
                      طريقة الظهور
                    </FormLabel>
                    <FormSelect
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                      value={field.value || ""}
                    >
                      <FormSelectTrigger>
                        <FormSelectValue placeholder="اختر طريقة الظهور" />
                      </FormSelectTrigger>
                      <FormSelectContent>
                        {APPEARANCE_OPTIONS.map((opt) => (
                          <FormSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </FormSelectItem>
                        ))}
                      </FormSelectContent>
                    </FormSelect>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            </div>
          </div>

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
