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
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ColorPickerControl } from "@/components/design-system/ColorPickerControl";
import { Palette, Image, Camera, Eye, Plus } from "lucide-react";
import { StepLayout } from "../components/StepLayout";

const formSchema = z.object({
  hasVisualIdentity: z.boolean().optional(),
  pastDesigns: z.string().optional(),
  visualDirection: z.array(z.string()).max(3).optional(),
});

type VisualIdentityForm = z.infer<typeof formSchema>;

interface BrandAssets {
  logoUrl?: string;
  brandColors?: string[];
  fonts?: string[];
  guidelinesUrl?: string;
}

interface Step7Props {
  initialData?: VisualIdentityForm & {
    brandAssets?: BrandAssets;
    productPhotos?: string[];
  };
  onDataChange: (
    data: VisualIdentityForm & {
      brandAssets?: BrandAssets;
      productPhotos?: string[];
    },
  ) => void;
  onValid: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

const DEFAULT_COLORS = ["#e7be52", "#121936", "#ffffff"];

export function Step7_VisualIdentity({
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
}: Step7Props) {
  const [hasIdentity, setHasIdentity] = useState(
    initialData?.hasVisualIdentity ?? false,
  );
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [guidelinesFiles, setGuidelinesFiles] = useState<File[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>(
    initialData?.brandAssets?.brandColors ?? DEFAULT_COLORS,
  );
  const [fontInput, setFontInput] = useState(
    initialData?.brandAssets?.fonts?.join("، ") ?? "",
  );
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const form = useForm<VisualIdentityForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasVisualIdentity: initialData?.hasVisualIdentity ?? false,
      pastDesigns: initialData?.pastDesigns ?? "",
      visualDirection: initialData?.visualDirection ?? ["", "", ""],
    },
    mode: "onChange",
  });

  useEffect(() => {
    onValid(true);
  }, [onValid]);

  useEffect(() => {
    const sub = form.watch((values) => {
      const fonts = fontInput
        .split("،")
        .map((f) => f.trim())
        .filter(Boolean);

      onDataChange({
        ...(values as VisualIdentityForm),
        brandAssets: {
          logoUrl: logoFiles[0]?.name ?? "",
          brandColors,
          fonts: fonts.length > 0 ? fonts : undefined,
          guidelinesUrl: guidelinesFiles[0]?.name ?? "",
        },
        productPhotos: photoFiles.map((f) => f.name),
      });
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange, logoFiles, guidelinesFiles, brandColors, fontInput, photoFiles]);

  const toggleIdentity = useCallback(
    (value: boolean) => {
      setHasIdentity(value);
      form.setValue("hasVisualIdentity", value, { shouldDirty: true });
    },
    [form],
  );

  const onSubmit = useCallback(
    (data: VisualIdentityForm) => {
      const fonts = fontInput
        .split("،")
        .map((f) => f.trim())
        .filter(Boolean);

      onDataChange({
        ...data,
        brandAssets: {
          logoUrl: logoFiles[0]?.name ?? "",
          brandColors,
          fonts: fonts.length > 0 ? fonts : undefined,
          guidelinesUrl: guidelinesFiles[0]?.name ?? "",
        },
        productPhotos: photoFiles.map((f) => f.name),
      });
      onNext?.();
    },
    [onDataChange, onNext, logoFiles, guidelinesFiles, brandColors, fontInput, photoFiles],
  );

  const visualDirection = form.watch("visualDirection") ?? ["", "", ""];

  const addColor = useCallback(() => {
    setBrandColors((prev) => [...prev, "#000000"]);
  }, []);

  const updateColor = useCallback((index: number, value: string) => {
    setBrandColors((prev) => prev.map((c, i) => (i === index ? value : c)));
  }, []);

  const removeColor = useCallback((index: number) => {
    setBrandColors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <StepLayout
      stepNumber={7}
      title="الهوية البصرية + التصميم"
      instructions={[
        "هل عندك هوية بصرية جاهزة؟ (شعار، خطوط، ألوان) أو بنصممها من الصفر؟",
        "عطنا 3 حسابات يعجبك ستايل تصاميمها في السوشيال ميديا؟ ودنا نعرف المظهر البصري اللي تبيه في التصاميم",
      ]}
      isOptional
      onSkip={onSkip}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <span className="text-sm font-medium text-natural-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-portal-icon" />
              هل عندك هوية بصرية جاهزة؟
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleIdentity(true)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-medium border transition-colors",
                  hasIdentity
                    ? "bg-secondary-500 text-white border-secondary-500"
                    : "bg-natural-0 text-portal-icon border-portal-divider hover:border-secondary-300",
                )}
              >
                نعم
              </button>
              <button
                type="button"
                onClick={() => toggleIdentity(false)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-medium border transition-colors",
                  !hasIdentity
                    ? "bg-secondary-500 text-white border-secondary-500"
                    : "bg-natural-0 text-portal-icon border-portal-divider hover:border-secondary-300",
                )}
              >
                لا
              </button>
            </div>
          </div>

          {hasIdentity && (
            <div className="rounded-2xl bg-secondary-50 border border-secondary-100 p-4 sm:p-6 space-y-5">
              <p className="text-sm font-medium text-secondary-700">
                ملفات براندك البصرية
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-natural-100">
                    الشعار
                  </span>
                  <FileDropzone
                    files={logoFiles}
                    onFilesChange={setLogoFiles}
                    maxFiles={1}
                    maxSizeMB={5}
                    acceptedTypes={["image/png", "image/svg+xml"]}
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-natural-100">
                    دليل الهوية
                  </span>
                  <FileDropzone
                    files={guidelinesFiles}
                    onFilesChange={setGuidelinesFiles}
                    maxFiles={1}
                    maxSizeMB={10}
                    acceptedTypes={["application/pdf"]}
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-natural-100">
                    ألوان العلامة التجارية
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {brandColors.map((color, index) => (
                      <ColorPickerControl
                        key={index}
                        value={color}
                        onChange={(value) => updateColor(index, value)}
                        onRemove={
                          brandColors.length > 1
                            ? () => removeColor(index)
                            : undefined
                        }
                      />
                    ))}
                    <button
                      type="button"
                      onClick={addColor}
                      className="w-9 h-9 rounded-lg border border-dashed border-portal-divider flex items-center justify-center text-portal-icon hover:border-secondary-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-natural-100">
                    الخطوط
                  </span>
                  <FormInputControl
                    placeholder="أسماء الخطوط المستخدمة"
                    value={fontInput}
                    onChange={(e) => setFontInput(e.target.value)}
                  />
                  <p className="text-xs text-portal-note-text">
                    اكتب أسماء الخطوط مفصولة بفاصلة (،)
                  </p>
                </div>
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="pastDesigns"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Image className="w-4 h-4 text-portal-icon" />
                  تصاميم سابقة
                </FormLabel>
                <FormTextareaControl
                  placeholder="وش نوع البوستات وتصاميم الصور الإعلانية اللي جابت نتيجة ومبيعات؟"
                  className="min-h-[80px]"
                  {...field}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <span className="text-sm font-medium text-natural-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-portal-icon" />
              صور المنتج
            </span>
            <FileDropzone
              files={photoFiles}
              onFilesChange={setPhotoFiles}
              maxFiles={10}
              maxSizeMB={10}
              acceptedTypes={["image/png", "image/jpeg", "image/webp"]}
            />
          </div>

          <div className="space-y-3">
            <span className="text-sm font-medium text-natural-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-portal-icon" />
              التوجه البصري — 3 حسابات يعجبك ستايلها
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <FormInputControl
                  key={i}
                  placeholder={`حساب ${i + 1}`}
                  value={visualDirection[i] ?? ""}
                  onChange={(e) => {
                    const updated = [...visualDirection];
                    updated[i] = e.target.value;
                    form.setValue("visualDirection", updated, {
                      shouldDirty: true,
                    });
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-portal-divider">
            {onBack && (
              <ActionButton type="button" variant="outline" onClick={onBack}>
                السابق
              </ActionButton>
            )}
            <ActionButton
              type="button"
              variant="primary"
              className="mr-auto"
              onClick={form.handleSubmit(onSubmit)}
            >
              التالي
            </ActionButton>
          </div>
        </form>
      </Form>
    </StepLayout>
  );
}
