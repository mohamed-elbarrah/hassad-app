/**
 * CampaignSection - Section 5: Campaign Info
 *
 * Handles campaign goals, details, offers, and competitors.
 * Supports three modes: wizard, edit, view
 */

"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import {
  Target,
  Megaphone,
  Gift,
  ShieldCheck,
  Calendar,
  Users,
} from "lucide-react";
import { SectionLayout, NavigationButtons } from "../SectionLayout";
import type { ProfileMode } from "../types";

const formSchema = z.object({
  campaignGoal: z.string().optional(),
  campaignDetails: z.string().optional(),
  campaignOffer: z.string().optional(),
  guarantees: z.string().optional(),
  campaignSeason: z.string().optional(),
  competitors: z.string().optional(),
});

type CampaignForm = z.infer<typeof formSchema>;

interface CampaignSectionProps {
  mode: ProfileMode;
  initialData?: CampaignForm;
  onDataChange?: (data: CampaignForm) => void;
  onValid?: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

export function CampaignSection({
  mode,
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
  hideNavigation = false,
}: CampaignSectionProps) {
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

  // Reset form when initialData changes (e.g., when profile loads from API)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  useEffect(() => {
    onValid?.(true);
  }, [onValid]);

  // Persist values at the explicit submit boundary so parent rerenders cannot
  // reset fields while the user is typing.

  const onSubmit = useCallback(
    (data: CampaignForm) => {
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
      { icon: Target, label: "الهدف", value: data.campaignGoal },
      { icon: Megaphone, label: "تفاصيل الحملة", value: data.campaignDetails },
      { icon: Gift, label: "العرض في الحملة", value: data.campaignOffer },
      { icon: ShieldCheck, label: "الضمانات", value: data.guarantees },
      {
        icon: Calendar,
        label: "المناسبة / الموسم",
        value: data.campaignSeason,
      },
      { icon: Users, label: "المنافسون", value: data.competitors },
    ];

    const hasData = fields.some((f) => f.value);
    if (!hasData) return null;

    return (
      <SectionLayout mode="view" title="الحملة الإعلانية">
        <div className="space-y-3">
          {fields.map(
            (f) =>
              f.value && (
                <ClientBriefField
                  key={f.label}
                  icon={f.icon}
                  label={f.label}
                  value={f.value}
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
      stepNumber={mode === "wizard" ? 5 : undefined}
      title="الحملة الإعلانية"
      instructions={
        mode === "wizard"
          ? [
              "وش الهدف الأول والثاني من هالحملة؟ وكيف تقيس نجاح حملاتك عادة؟",
              "وش عرضك القوي؟ وش الحافز والعروض القوية اللي بنصيد فيها العميل؟",
            ]
          : undefined
      }
      isOptional={mode === "wizard"}
      onSkip={mode === "wizard" ? onSkip : undefined}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="campaignGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  الهدف
                </FormLabel>
                <Textarea
                  placeholder="وش الهدف الأول والثاني من هالحملة؟ وكيف تقيس نجاح حملاتك عادة؟"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campaignDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-muted-foreground" />
                  تفاصيل الحملة الإعلانية
                </FormLabel>
                <Textarea
                  placeholder="وش بنعلن عنه؟ الحملة لمنتج واحد وإلا مجموعة منتجات؟ إذا مجموعة عطنا أهمها بالترتيب."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campaignOffer"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4 text-muted-foreground" />
                  العرض في الحملة
                </FormLabel>
                <Textarea
                  placeholder="وش عرضك القوي؟ وش الحافز والعروض القوية اللي بنصيد فيها العميل؟"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guarantees"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  الضمانات
                </FormLabel>
                <Textarea
                  placeholder="عندك سياسة إرجاع أو ضمان ذهبي يخلي العميل يشتري وهو مرتاح البال؟"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campaignSeason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  المناسبة / الموسم
                </FormLabel>
                <Input
                  placeholder="هل الحملة مرتبطة بموسم أو توقيت معين؟"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="competitors"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  المنافسون
                </FormLabel>
                <Textarea
                  placeholder="مين منافسينك في السوق؟ عطنا اقوى 3 علامات تجارية منافسة لك"
                  className="min-h-[80px]"
                  {...field}
                />
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
