/**
 * VisualSection - Section 7: Visual Identity
 *
 * Handles brand assets, colors, fonts, and visual direction.
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
import { FileDropzone } from "@/components/shared/FileDropzone";

import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import { ColorPickerControl } from "@/components/design-system/ColorPickerControl";
import { cn } from "@/lib/utils";
import { Palette, Image, Camera, Eye, Plus, ExternalLink } from "lucide-react";

import {
  SectionLayout,
  NavigationButtons,
  SectionSubtitle,
} from "../SectionLayout";
import type { ProfileMode, BrandAssets } from "../types";

const formSchema = z.object({
  hasVisualIdentity: z.boolean().optional(),
  pastDesigns: z.string().optional(),
  visualDirection: z.array(z.string()).max(3).optional(),
});

type VisualForm = z.infer<typeof formSchema>;

interface VisualSectionProps {
  mode: ProfileMode;
  initialData?: VisualForm & {
    brandAssets?: BrandAssets;
    productPhotos?: string[];
  };
  onDataChange?: (
    data: VisualForm & {
      brandAssets?: BrandAssets;
      productPhotos?: string[];
    },
  ) => void;
  onValid?: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  hideNavigation?: boolean;
}

const DEFAULT_COLORS = ["#e7be52", "#121936", "#ffffff"];

export function VisualSection({
  mode,
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
  hideNavigation = false,
}: VisualSectionProps) {
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

  const form = useForm<VisualForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasVisualIdentity: initialData?.hasVisualIdentity ?? false,
      pastDesigns: initialData?.pastDesigns ?? "",
      visualDirection: initialData?.visualDirection ?? ["", "", ""],
    },
    mode: "onChange",
  });

  // Reset form when initialData changes (e.g., when profile loads from API)
  useEffect(() => {
    if (initialData) {
      form.reset({
        hasVisualIdentity: initialData.hasVisualIdentity ?? false,
        pastDesigns: initialData.pastDesigns ?? "",
        visualDirection: initialData.visualDirection ?? ["", "", ""],
      });
      setHasIdentity(initialData.hasVisualIdentity ?? false);
      setBrandColors(initialData.brandAssets?.brandColors ?? DEFAULT_COLORS);
      setFontInput(initialData.brandAssets?.fonts?.join("، ") ?? "");
    }
  }, [initialData, form]);

  useEffect(() => {
    onValid?.(true);
  }, [onValid]);

  useEffect(() => {
    if (mode === "view") return;

    const sub = form.watch((values) => {
      const fonts = fontInput
        .split("،")
        .map((f) => f.trim())
        .filter(Boolean);

      onDataChange?.({
        ...(values as VisualForm),
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
  }, [
    form,
    onDataChange,
    mode,
    logoFiles,
    guidelinesFiles,
    brandColors,
    fontInput,
    photoFiles,
  ]);

  const toggleIdentity = useCallback(
    (value: boolean) => {
      setHasIdentity(value);
      form.setValue("hasVisualIdentity", value, { shouldDirty: true });
    },
    [form],
  );

  const onSubmit = useCallback(
    (data: VisualForm) => {
      const fonts = fontInput
        .split("،")
        .map((f) => f.trim())
        .filter(Boolean);

      onDataChange?.({
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
    [
      onDataChange,
      onNext,
      logoFiles,
      guidelinesFiles,
      brandColors,
      fontInput,
      photoFiles,
    ],
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

  // View mode: render read-only display
  if (mode === "view") {
    const data = initialData;
    if (!data) return null;

    const hasBrandAssets =
      data.brandAssets?.logoUrl ||
      (data.brandAssets?.brandColors &&
        data.brandAssets.brandColors.length > 0) ||
      (data.brandAssets?.fonts && data.brandAssets.fonts.length > 0) ||
      data.brandAssets?.guidelinesUrl;
    const hasVisual =
      data.hasVisualIdentity ||
      hasBrandAssets ||
      data.pastDesigns ||
      data.productPhotos?.length ||
      (data.visualDirection && data.visualDirection.some((v) => v));

    if (!hasVisual) return null;

    return (
      <SectionLayout mode="view" title="الهوية البصرية والتصميم">
        <div className="space-y-6">
          {hasBrandAssets && (
            <div className="space-y-4">
              <SectionSubtitle icon={Palette}>
                ملفات براندك البصرية
              </SectionSubtitle>

              {data.brandAssets?.logoUrl && (
                <div className="flex items-center gap-3">
                  <img
                    src={data.brandAssets.logoUrl}
                    alt="الشعار"
                    className="w-12 h-12 rounded-lg object-contain border border-border bg-white"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-300">الشعار</p>
                    <p
                      className="text-xs text-muted-foreground truncate"
                      dir="ltr"
                    >
                      {data.brandAssets.logoUrl}
                    </p>
                  </div>
                </div>
              )}

              {data.brandAssets?.brandColors &&
                data.brandAssets.brandColors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      ألوان العلامة
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.brandAssets.brandColors.map((color, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5"
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-foreground" dir="ltr">
                            {color}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {data.brandAssets?.fonts && data.brandAssets.fonts.length > 0 && (
                <ClientBriefField
                  icon={Palette}
                  label="الخطوط"
                  value={data.brandAssets.fonts.join("، ")}
                />
              )}

              {data.brandAssets?.guidelinesUrl && (
                <a
                  href={data.brandAssets.guidelinesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  دليل الهوية البصرية
                </a>
              )}
            </div>
          )}

          <div className="space-y-4">
            {data.pastDesigns && (
              <ClientBriefField
                icon={Image}
                label="تصاميم سابقة"
                value={data.pastDesigns}
              />
            )}

            {data.productPhotos && data.productPhotos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  صور المنتج ({data.productPhotos.length} ملفات)
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.productPhotos.slice(0, 5).map((photo, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-xs bg-primary/10 text-foreground"
                    >
                      {photo}
                    </span>
                  ))}
                  {data.productPhotos.length > 5 && (
                    <span className="px-2 py-1 text-xs text-muted-foreground">
                      +{data.productPhotos.length - 5} أخرى
                    </span>
                  )}
                </div>
              </div>
            )}

            {data.visualDirection && data.visualDirection.some((v) => v) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  التوجه البصري
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.visualDirection
                    .filter((v): v is string => Boolean(v))
                    .map((account, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg text-sm bg-primary/10 text-foreground"
                      >
                        {account}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionLayout>
    );
  }

  // Edit/Wizard mode: render form
  return (
    <SectionLayout
      mode={mode}
      stepNumber={mode === "wizard" ? 7 : undefined}
      title="الهوية البصرية + التصميم"
      instructions={
        mode === "wizard"
          ? [
              "هل عندك هوية بصرية جاهزة؟ (شعار، خطوط، ألوان) أو بنصممها من الصفر؟",
              "عطنا 3 حسابات يعجبك ستايل تصاميمها في السوشيال ميديا؟ ودنا نعرف المظهر البصري اللي تبيه في التصاميم",
            ]
          : undefined
      }
      isOptional={mode === "wizard"}
      onSkip={mode === "wizard" ? onSkip : undefined}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              هل عندك هوية بصرية جاهزة؟
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleIdentity(true)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-medium border transition-colors",
                  hasIdentity
                    ? "bg-primary text-white border-secondary-500"
                    : "bg-background text-muted-foreground border-border hover:border-secondary-300",
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
                    ? "bg-primary text-white border-secondary-500"
                    : "bg-background text-muted-foreground border-border hover:border-secondary-300",
                )}
              >
                لا
              </button>
            </div>
          </div>

          {hasIdentity && (
            <BrandAssetsForm
              logoFiles={logoFiles}
              onLogoFilesChange={setLogoFiles}
              guidelinesFiles={guidelinesFiles}
              onGuidelinesFilesChange={setGuidelinesFiles}
              brandColors={brandColors}
              onAddColor={addColor}
              onUpdateColor={updateColor}
              onRemoveColor={removeColor}
              fontInput={fontInput}
              onFontInputChange={setFontInput}
            />
          )}

          <FormField
            control={form.control}
            name="pastDesigns"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  تصاميم سابقة
                </FormLabel>
                <Textarea
                  placeholder="وش نوع البوستات وتصاميم الصور الإعلانية اللي جابت نتيجة ومبيعات؟"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
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

          <VisualDirectionForm
            visualDirection={visualDirection}
            onChange={(index, value) => {
              const updated = [...visualDirection];
              updated[index] = value;
              form.setValue("visualDirection", updated, {
                shouldDirty: true,
              });
            }}
          />

          {!hideNavigation && mode === "wizard" && (
            <NavigationButtons onBack={onBack} submitLabel="التالي" />
          )}
        </form>
      </Form>
    </SectionLayout>
  );
}

// ─── BrandAssetsForm sub-component ────────────────────────────────────────────

function BrandAssetsForm({
  logoFiles,
  onLogoFilesChange,
  guidelinesFiles,
  onGuidelinesFilesChange,
  brandColors,
  onAddColor,
  onUpdateColor,
  onRemoveColor,
  fontInput,
  onFontInputChange,
}: {
  logoFiles: File[];
  onLogoFilesChange: (files: File[]) => void;
  guidelinesFiles: File[];
  onGuidelinesFilesChange: (files: File[]) => void;
  brandColors: string[];
  onAddColor: () => void;
  onUpdateColor: (index: number, value: string) => void;
  onRemoveColor: (index: number) => void;
  fontInput: string;
  onFontInputChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-primary/5 border border-secondary-100 p-4 sm:p-6 space-y-5">
      <p className="text-sm font-medium text-foreground">
        ملفات براندك البصرية
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">الشعار</span>
          <FileDropzone
            files={logoFiles}
            onFilesChange={onLogoFilesChange}
            maxFiles={1}
            maxSizeMB={5}
            acceptedTypes={["image/png", "image/svg+xml"]}
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">
            دليل الهوية
          </span>
          <FileDropzone
            files={guidelinesFiles}
            onFilesChange={onGuidelinesFilesChange}
            maxFiles={1}
            maxSizeMB={10}
            acceptedTypes={["application/pdf"]}
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">
            ألوان العلامة التجارية
          </span>
          <div className="flex flex-wrap gap-2 mt-1">
            {brandColors.map((color, index) => (
              <ColorPickerControl
                key={index}
                value={color}
                onChange={(value) => onUpdateColor(index, value)}
                onRemove={
                  brandColors.length > 1
                    ? () => onRemoveColor(index)
                    : undefined
                }
              />
            ))}
            <button
              type="button"
              onClick={onAddColor}
              className="w-9 h-9 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-secondary-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">الخطوط</span>
          <Input
            placeholder="أسماء الخطوط المستخدمة"
            value={fontInput}
            onChange={(e) => onFontInputChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            اكتب أسماء الخطوط مفصولة بفاصلة (،)
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── VisualDirectionForm sub-component ────────────────────────────────────────

function VisualDirectionForm({
  visualDirection,
  onChange,
}: {
  visualDirection: (string | undefined)[];
  onChange: (index: number, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-foreground flex items-center gap-2">
        <Eye className="w-4 h-4 text-muted-foreground" />
        التوجه البصري — 3 حسابات يعجبك ستايلها
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Input
            key={i}
            placeholder={`حساب ${i + 1}`}
            value={visualDirection[i] ?? ""}
            onChange={(e) => onChange(i, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
}
