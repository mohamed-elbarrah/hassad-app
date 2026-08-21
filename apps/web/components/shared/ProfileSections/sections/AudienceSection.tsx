/**
 * AudienceSection - Section 3: Audience & Brand Voice
 *
 * Handles customer analysis, FAQs, tone of voice, and appearance.
 * Supports three modes: wizard, edit, view
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import {
  Users,
  MessageCircle,
  ShieldCheck,
  Hash,
  Video,
  Plus,
  X,
} from "lucide-react";
import {
  SectionLayout,
  NavigationButtons,
  SectionSubtitle,
} from "../SectionLayout";
import type { ProfileMode, FaqPair } from "../types";

const formSchema = z.object({
  customerAnalysis: z.string().optional(),
  toneOfVoice: z.string().optional(),
  boundaries: z.string().optional(),
  verbalSlogan: z.string().optional(),
  appearanceMethod: z.string().optional(),
});

type AudienceForm = z.infer<typeof formSchema>;

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

interface AudienceSectionProps {
  mode: ProfileMode;
  initialData?: {
    customerAnalysis?: string;
    faq?: FaqPair[];
    toneOfVoice?: string;
    boundaries?: string;
    verbalSlogan?: string;
    appearanceMethod?: string;
  };
  onDataChange?: (data: {
    audienceInfo: { customerAnalysis?: string; faq?: FaqPair[] };
    brandVoice: {
      toneOfVoice?: string;
      boundaries?: string;
      verbalSlogan?: string;
      appearanceMethod?: string;
    };
  }) => void;
  onValid?: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

export function AudienceSection({
  mode,
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
  hideNavigation = false,
}: AudienceSectionProps) {
  const [faqPairs, setFaqPairs] = useState<FaqPair[]>(() => {
    if (!initialData?.faq) return [];
    return Array.isArray(initialData.faq) ? initialData.faq : [];
  });

  const form = useForm<AudienceForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerAnalysis: initialData?.customerAnalysis ?? "",
      toneOfVoice: initialData?.toneOfVoice ?? "",
      boundaries: initialData?.boundaries ?? "",
      verbalSlogan: initialData?.verbalSlogan ?? "",
      appearanceMethod: initialData?.appearanceMethod ?? "",
    },
    mode: "onChange",
  });

  // Reset form when initialData changes (e.g., when profile loads from API)
  useEffect(() => {
    if (initialData) {
      form.reset({
        customerAnalysis: initialData.customerAnalysis ?? "",
        toneOfVoice: initialData.toneOfVoice ?? "",
        boundaries: initialData.boundaries ?? "",
        verbalSlogan: initialData?.verbalSlogan ?? "",
        appearanceMethod: initialData?.appearanceMethod ?? "",
      });
      setFaqPairs(initialData.faq ?? []);
    }
  }, [initialData, form]);

  useEffect(() => {
    onValid?.(true);
  }, [onValid]);

  useEffect(() => {
    if (mode === "view") return;

    const sub = form.watch((values) => {
      const v = values as AudienceForm;
      onDataChange?.({
        audienceInfo: {
          customerAnalysis: v.customerAnalysis,
          faq: faqPairs,
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
  }, [form, onDataChange, mode, faqPairs]);

  const { addFaqPair, removeFaqPair, updateFaqPair } =
    useFaqManager(setFaqPairs);

  const onSubmit = useCallback(
    (data: AudienceForm) => {
      onDataChange?.({
        audienceInfo: {
          customerAnalysis: data.customerAnalysis,
          faq: faqPairs,
        },
        brandVoice: {
          toneOfVoice: data.toneOfVoice,
          boundaries: data.boundaries,
          verbalSlogan: data.verbalSlogan,
          appearanceMethod: data.appearanceMethod,
        },
      });
      onNext?.();
    },
    [onDataChange, onNext, faqPairs],
  );

  // View mode: render read-only display
  if (mode === "view") {
    const data = initialData;
    if (!data) return null;

    const hasAudience =
      data.customerAnalysis || (data.faq && data.faq.length > 0);
    const hasBrandVoice =
      data.toneOfVoice ||
      data.boundaries ||
      data.verbalSlogan ||
      data.appearanceMethod;

    if (!hasAudience && !hasBrandVoice) return null;

    const brandVoiceFields = [
      {
        icon: Hash,
        label: "النبرة",
        value: TONE_OPTIONS.find((t) => t.value === data.toneOfVoice)?.label,
      },
      {
        icon: Video,
        label: "طريقة الظهور",
        value: APPEARANCE_OPTIONS.find((a) => a.value === data.appearanceMethod)
          ?.label,
      },
      {
        icon: Hash,
        label: "الشعار اللفظي",
        value: data.verbalSlogan,
      },
      {
        icon: ShieldCheck,
        label: "الحدود / العوائق",
        value: data.boundaries,
      },
    ];

    return (
      <SectionLayout mode="view" title="الجمهور المستهدف والرسائل">
        <div className="space-y-6">
          {hasBrandVoice && (
            <div className="space-y-4">
              <SectionSubtitle icon={MessageCircle}>
                الرسائل والهوية
              </SectionSubtitle>
              <div className="space-y-3">
                {brandVoiceFields.map(
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
            </div>
          )}

          {hasAudience && (
            <div className="space-y-4">
              <SectionSubtitle icon={Users}>تحليل الجمهور</SectionSubtitle>
              {data.customerAnalysis && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    تحليل العملاء
                  </p>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">
                    {data.customerAnalysis}
                  </p>
                </div>
              )}
              {data.faq && data.faq.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    الأسئلة الشائعة
                  </p>
                  {data.faq.map((pair, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {pair.question}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pair.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SectionLayout>
    );
  }

  // Edit/Wizard mode: render form
  return (
    <SectionLayout
      mode={mode}
      stepNumber={mode === "wizard" ? 3 : undefined}
      title="الجمهور المستهدف + الرسائل والهوية"
      instructions={
        mode === "wizard"
          ? [
              "أوصف لنا عميلك المثالي: كم عمره؟ وش جنسه؟ وين ساكن؟ وش اهتماماته؟ وش مشاكله اللي بتحلها؟",
              "الخطوط الحمراء: وش الأشياء أو الكلمات اللي ما ودك تطلع في المحتوى و إعلاناتك أبد؟",
            ]
          : undefined
      }
      isOptional={mode === "wizard"}
      onSkip={mode === "wizard" ? onSkip : undefined}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Brand Voice Section */}
          <div className="space-y-5">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              الرسائل والهوية
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="toneOfVoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">النبرة</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                      value={field.value || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النبرة" />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appearanceMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm flex items-center gap-2">
                      <Video className="w-4 h-4 text-muted-foreground" />
                      طريقة الظهور
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                      value={field.value || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طريقة الظهور" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPEARANCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="verbalSlogan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    الشعار اللفظي
                  </FormLabel>
                  <Input
                    placeholder="وش الشعار اللفظي الثابت لبراندك؟"
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="boundaries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    الحدود / العوائق
                  </FormLabel>
                  <Textarea
                    placeholder="الخطوط الحمراء: وش الأشياء أو الكلمات اللي ما ودك تطلع في المحتوى أبد؟"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormItem>
              )}
            />
          </div>

          {/* Audience Section */}
          <div className="space-y-5">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              تحليل الجمهور
            </h4>

            <FormField
              control={form.control}
              name="customerAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">تحليل العملاء</FormLabel>
                  <Textarea
                    placeholder="أوصف لنا عميلك المثالي: كم عمره؟ وش جنسه؟ وين ساكن؟ وش اهتماماته؟"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormItem>
              )}
            />

            <FaqEditor
              faqPairs={faqPairs}
              onUpdate={updateFaqPair}
              onRemove={removeFaqPair}
              onAdd={addFaqPair}
            />
          </div>

          {!hideNavigation && mode === "wizard" && (
            <NavigationButtons onBack={onBack} submitLabel="التالي" />
          )}
        </form>
      </Form>
    </SectionLayout>
  );
}

// ─── useFaqManager hook ──────────────────────────────────────────────────────

function useFaqManager(
  setFaqPairs: React.Dispatch<React.SetStateAction<FaqPair[]>>,
) {
  const addFaqPair = useCallback(() => {
    setFaqPairs((prev) => [...prev, { question: "", answer: "" }]);
  }, [setFaqPairs]);

  const removeFaqPair = useCallback(
    (index: number) => {
      setFaqPairs((prev) => prev.filter((_, i) => i !== index));
    },
    [setFaqPairs],
  );

  const updateFaqPair = useCallback(
    (index: number, field: "question" | "answer", value: string) => {
      setFaqPairs((prev) =>
        prev.map((pair, i) =>
          i === index ? { ...pair, [field]: value } : pair,
        ),
      );
    },
    [setFaqPairs],
  );

  return { addFaqPair, removeFaqPair, updateFaqPair };
}

// ─── FaqEditor sub-component ──────────────────────────────────────────────────

function FaqEditor({
  faqPairs,
  onUpdate,
  onRemove,
  onAdd,
}: {
  faqPairs: FaqPair[];
  onUpdate: (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-foreground">
        الأسئلة الشائعة
      </span>

      {faqPairs.map((pair, index) => (
        <div
          key={index}
          className="rounded-xl border border-border p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Input
              value={pair.question}
              onChange={(e) => onUpdate(index, "question", e.target.value)}
              placeholder="السؤال"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-1.5 rounded-full text-muted-foreground hover:text-danger-500 hover:bg-danger-50 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <Textarea
            value={pair.answer}
            onChange={(e) => onUpdate(index, "answer", e.target.value)}
            placeholder="الجواب"
            className="min-h-[60px] resize-y"
            rows={2}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="w-full px-4 py-2 rounded-xl text-sm border border-dashed border-border text-muted-foreground hover:border-secondary-300 transition-colors flex items-center gap-2 justify-center"
      >
        <Plus className="w-4 h-4" />
        إضافة سؤال وجواب
      </button>
    </div>
  );
}
