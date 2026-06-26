"use client";

import { useCallback, useEffect, useState } from "react";
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
import { FormInput } from "@/components/design-system/FormInput";
import { X, Plus, Check, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductInfoSchema, type IntakeFormV2Input } from "@hassad/shared";
import { StepLayout } from "../components/StepLayout";

type ProductInfoForm = z.infer<typeof ProductInfoSchema>;

const BENEFIT_SUGGESTIONS = [
  "توفير وقت",
  "توفير مال",
  "جودة أعلى",
  "خدمة أسرع",
  "دعم متواصل",
  "تجربة فريدة",
];

interface Step2Props {
  initialData?: IntakeFormV2Input["productInfo"];
  onDataChange: (data: IntakeFormV2Input["productInfo"]) => void;
  onValid: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

export function Step2_ProductInfo({
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
  hideNavigation = false,
}: Step2Props) {
  const [benefits, setBenefits] = useState<string[]>(initialData?.benefits ?? []);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");

  const form = useForm<ProductInfoForm>({
    resolver: zodResolver(ProductInfoSchema),
    defaultValues: initialData ?? {
      productStory: "",
      detailedDescription: "",
      valueProposition: "",
      advantages: "",
      benefits: [],
      contentDirection: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    onValid(true);
  }, [onValid]);

  useEffect(() => {
    const sub = form.watch((values) => {
      onDataChange({ ...values, benefits } as IntakeFormV2Input["productInfo"]);
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange, benefits]);

  const toggleBenefit = useCallback(
    (benefit: string) => {
      setBenefits((prev) =>
        prev.includes(benefit)
          ? prev.filter((b) => b !== benefit)
          : [...prev, benefit],
      );
    },
    [],
  );

  const addCustomBenefit = useCallback(() => {
    const value = customInputValue.trim();
    if (value) {
      setBenefits((prev) => (prev.includes(value) ? prev : [...prev, value]));
      setCustomInputValue("");
      setShowCustomInput(false);
    }
  }, [customInputValue]);

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomBenefit();
      } else if (e.key === "Escape") {
        setCustomInputValue("");
        setShowCustomInput(false);
      }
    },
    [addCustomBenefit],
  );

  const onSubmit = useCallback(
    (data: ProductInfoForm) => {
      onDataChange({ ...data, benefits } as IntakeFormV2Input["productInfo"]);
      onNext?.();
    },
    [onDataChange, onNext, benefits],
  );

  return (
    <StepLayout
      stepNumber={2}
      title="معلومات المنتج / الخدمة"
      instructions={[
        "قصة المنتج أو الخدمة — قصة البراند علمنا عن البداية و كواليس التصنيع أو تجارب عملائك الأوائل عشان نصنع منها قصة تبيع.",
        "وش ميزتك الجوهرية؟ وش الشيء الرهيب اللي يخليك تفرق عن كل الموجودين بالسوق؟",
      ]}
      isOptional
      onSkip={onSkip}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="productStory"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm">قصة المنتج أو الخدمة</FormLabel>
                <FormTextareaControl
                  placeholder="قصة البراند علمنا عن البداية و كواليس التصنيع أو تجارب عملائك الأوائل عشان نصنع منها قصة تبيع."
                  className="min-h-[120px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="detailedDescription"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm">وصف تفصيلي للمنتج أو الخدمة</FormLabel>
                <FormTextareaControl
                  placeholder="وش سالفة منتجك / خدمتك؟ اشرح لنا بالتفصيل وش تقدم تخيل العميل واقف قدامك وودك تقنعه"
                  className="min-h-[120px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valueProposition"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm">القيمة المضافة</FormLabel>
                <FormTextareaControl
                  placeholder="وش ميزتك الجوهرية؟ وش الشيء الرهيب اللي يخليك تفرق عن كل الموجودين بالسوق؟"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="advantages"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm">المزايا</FormLabel>
                <FormTextareaControl
                  placeholder="ليه العميل يختارك؟ وش أهم النقاط اللي تخلي العميل يشتري بدون ما يفكر؟"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <span className="text-sm font-medium text-natural-100">الفوائد</span>
            <p className="text-xs text-portal-note-text">
              وش بيستفيد العميل؟ زبونك وش بيتغير في حياته أو يومه بعد ما يجرب
              منتجك أو خدمتك؟
            </p>
            <div className="flex flex-wrap gap-2">
              {BENEFIT_SUGGESTIONS.map((benefit) => {
                const selected = benefits.includes(benefit);
                return (
                  <button
                    key={benefit}
                    type="button"
                    onClick={() => toggleBenefit(benefit)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-colors",
                      selected
                        ? "bg-secondary-500 text-white border-secondary-500"
                        : "bg-natural-0 text-portal-icon border-portal-divider hover:border-secondary-300",
                    )}
                  >
                    {benefit}
                  </button>
                );
              })}
              {showCustomInput ? (
                <div className="flex items-center gap-2">
                  <FormInput
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="اكتب فائدة جديدة..."
                    className="h-9 text-sm rounded-full px-4 w-48"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={addCustomBenefit}
                    disabled={!customInputValue.trim()}
                    className="p-1.5 rounded-full text-portal-icon hover:text-secondary-600 hover:bg-secondary-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInputValue("");
                      setShowCustomInput(false);
                    }}
                    className="p-1.5 rounded-full text-portal-icon hover:text-danger-500 hover:bg-danger-50 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="px-3 py-1.5 rounded-full text-sm border border-dashed border-portal-divider text-portal-icon hover:border-secondary-300 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة
                </button>
              )}
            </div>
            {benefits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-secondary-100 text-secondary-700"
                  >
                    {benefit}
                    <button
                      type="button"
                      onClick={() => toggleBenefit(benefit)}
                      className="hover:text-danger-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="contentDirection"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm">المحتوى</FormLabel>
                <FormTextareaControl
                  placeholder="كيف لازم يكون المحتوى؟ حدد اهم النقاط اللي نركز عليها"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          {!hideNavigation && (
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
          )}
        </form>
      </Form>
    </StepLayout>
  );
}
