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
import { Palette, Image, Camera, Eye } from "lucide-react";
import { StepLayout } from "../components/StepLayout";

const formSchema = z.object({
  hasVisualIdentity: z.boolean().optional(),
  pastDesigns: z.string().optional(),
  visualDirection: z.array(z.string()).max(3).optional(),
});

type VisualIdentityForm = z.infer<typeof formSchema>;

interface Step7Props {
  initialData?: VisualIdentityForm & { productPhotos?: string[] };
  onDataChange: (data: VisualIdentityForm & { productPhotos?: string[] }) => void;
  onValid: (valid: boolean) => void;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function Step7_VisualIdentity({
  initialData,
  onDataChange,
  onValid,
  onNext,
  onBack,
  onSkip,
}: Step7Props) {
  const [hasIdentity, setHasIdentity] = useState(initialData?.hasVisualIdentity ?? false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const form = useForm<VisualIdentityForm>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? {
      hasVisualIdentity: false,
      pastDesigns: "",
      visualDirection: ["", "", ""],
    },
    mode: "onChange",
  });

  useEffect(() => {
    onValid(true);
  }, [onValid]);

  useEffect(() => {
    const sub = form.watch((values) => {
      onDataChange({
        ...(values as VisualIdentityForm),
        productPhotos: photoFiles.map((f) => f.name),
      });
    });
    return () => sub.unsubscribe();
  }, [form, onDataChange, photoFiles]);

  const toggleIdentity = useCallback(
    (value: boolean) => {
      setHasIdentity(value);
      form.setValue("hasVisualIdentity", value, { shouldDirty: true });
    },
    [form],
  );

  const onSubmit = useCallback(
    (data: VisualIdentityForm) => {
      onDataChange({
        ...data,
        productPhotos: photoFiles.map((f) => f.name),
      });
      onNext?.();
    },
    [onDataChange, onNext, photoFiles],
  );

  const visualDirection = form.watch("visualDirection") ?? ["", "", ""];

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
            <div className="rounded-2xl bg-secondary-50 border border-secondary-100 p-4 space-y-4">
              <p className="text-sm font-medium text-secondary-700">
                ملفات براندك البصرية
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-natural-100">Logo (PNG, SVG)</span>
                  <FileDropzone
                    files={[]}
                    onFilesChange={() => {}}
                    maxFiles={1}
                    maxSizeMB={5}
                    acceptedTypes={["image/png", "image/svg+xml"]}
                  />
                </div>
                <div>
                  <span className="text-xs font-medium text-natural-100">Brand Colors</span>
                  <div className="flex gap-2 mt-2">
                    {["#e7be52", "#121936", "#ffffff"].map((color) => (
                      <div
                        key={color}
                        className="w-8 h-8 rounded-lg border border-portal-divider"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-natural-100">الخطوط</span>
                  <FormInputControl placeholder="أسماء الخطوط المستخدمة" />
                </div>
                <div>
                  <span className="text-xs font-medium text-natural-100">دليل الهوية</span>
                  <FileDropzone
                    files={[]}
                    onFilesChange={() => {}}
                    maxFiles={1}
                    maxSizeMB={10}
                    acceptedTypes={["application/pdf"]}
                  />
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
                    form.setValue("visualDirection", updated, { shouldDirty: true });
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
            <ActionButton type="submit" variant="primary" className="mr-auto">
              التالي
            </ActionButton>
          </div>
        </form>
      </Form>
    </StepLayout>
  );
}
