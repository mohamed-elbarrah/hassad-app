/**
 * ProductSection - Section 2: Product/Service Info
 *
 * Handles product story, description, value proposition, and benefits.
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

import { X, Plus, Check, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductInfoSchema } from "@hassad/shared";
import { SectionLayout, NavigationButtons } from "../SectionLayout";
import type { ProfileMode } from "../types";

type ProductForm = z.infer<typeof ProductInfoSchema>;

const BENEFIT_SUGGESTIONS = [
  "توفير وقت",
  "توفير مال",
  "جودة أعلى",
  "خدمة أسرع",
  "دعم متواصل",
  "تجربة فريدة",
];

interface ProductSectionProps {
  mode: ProfileMode;
  initialData?: ProductForm;
  onDataChange?: (data: ProductForm) => void;
  onValid?: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

export function ProductSection({
  mode,
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
  hideNavigation = false,
}: ProductSectionProps) {
  const [benefits, setBenefits] = useState<string[]>(
    initialData?.benefits ?? [],
  );
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");

  const form = useForm<ProductForm>({
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

  // Reset form when initialData changes (e.g., when profile loads from API)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      form.reset(initialData);
      setBenefits(initialData.benefits ?? []);
    }
  }, [initialData, form]);

  useEffect(() => {
    onValid?.(true);
  }, [onValid]);

  // Persist values at the explicit submit boundary to keep editing local and
  // prevent parent updates from resetting the active form.

  const toggleBenefit = useCallback((benefit: string) => {
    setBenefits((prev) =>
      prev.includes(benefit)
        ? prev.filter((b) => b !== benefit)
        : [...prev, benefit],
    );
  }, []);

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
    (data: ProductForm) => {
      onDataChange?.({ ...data, benefits });
      onNext?.();
    },
    [onDataChange, onNext, benefits],
  );

  // View mode: render read-only display
  if (mode === "view") {
    const data = initialData;
    if (!data) return null;

    const fields = [
      { label: "قصة المنتج أو الخدمة", value: data.productStory },
      { label: "وصف تفصيلي", value: data.detailedDescription },
      { label: "القيمة المضافة", value: data.valueProposition },
      { label: "المزايا", value: data.advantages },
      { label: "المحتوى", value: data.contentDirection },
    ];

    const hasData =
      fields.some((f) => f.value) ||
      (data.benefits && data.benefits.length > 0);
    if (!hasData) return null;

    return (
      <SectionLayout mode="view" title="معلومات المنتج / الخدمة">
        <div className="space-y-4">
          {fields.map(
            (f) =>
              f.value && (
                <div key={f.label}>
                  <p className="text-xs font-medium text-muted-foreground">
                    {f.label}
                  </p>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">
                    {f.value}
                  </p>
                </div>
              ),
          )}

          {data.benefits && data.benefits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                الفوائد
              </p>
              <div className="flex flex-wrap gap-2">
                {data.benefits.map((benefit, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-sm bg-primary/10 text-foreground"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
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
      stepNumber={mode === "wizard" ? 2 : undefined}
      title="معلومات المنتج / الخدمة"
      instructions={
        mode === "wizard"
          ? [
              "قصة المنتج أو الخدمة — قصة البراند علمنا عن البداية و كواليس التصنيع أو تجارب عملائك الأوائل عشان نصنع منها قصة تبيع.",
              "وش ميزتك الجوهرية؟ وش الشيء الرهيب اللي يخليك تفرق عن كل الموجودين بالسوق؟",
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
            name="productStory"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">قصة المنتج أو الخدمة</FormLabel>
                <Textarea
                  placeholder="قصة البراند علمنا عن البداية و كواليس التصنيع أو تجارب عملائك الأوائل عشان نصنع منها قصة تبيع."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="detailedDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  وصف تفصيلي للمنتج أو الخدمة
                </FormLabel>
                <Textarea
                  placeholder="وش سالفة منتجك / خدمتك؟ اشرح لنا بالتفصيل وش تقدم تخيل العميل واقف قدامك وودك تقنعه"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valueProposition"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">القيمة المضافة</FormLabel>
                <Textarea
                  placeholder="وش ميزتك الجوهرية؟ وش الشيء الرهيب اللي يخليك تفرق عن كل الموجودين بالسوق؟"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="advantages"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">المزايا</FormLabel>
                <Textarea
                  placeholder="ليه العميل يختارك؟ وش أهم النقاط اللي تخلي العميل يشتري بدون ما يفكر؟"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <span className="text-sm font-medium text-foreground">الفوائد</span>
            <p className="text-xs text-muted-foreground">
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
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                        : "bg-background text-muted-foreground border-border hover:border-secondary-300",
                    )}
                  >
                    {benefit}
                  </button>
                );
              })}
              {showCustomInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    aria-label="فائدة مخصصة"
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
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInputValue("");
                      setShowCustomInput(false);
                    }}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-danger-500 hover:bg-danger-50 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="px-3 py-1.5 rounded-full text-sm border border-dashed border-border text-muted-foreground hover:border-secondary-300 transition-colors flex items-center gap-1"
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-primary/10 text-foreground"
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
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">المحتوى</FormLabel>
                <Textarea
                  placeholder="كيف لازم يكون المحتوى؟ حدد اهم النقاط اللي نركز عليها"
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
