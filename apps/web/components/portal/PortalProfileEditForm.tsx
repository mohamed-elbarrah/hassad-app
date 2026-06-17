"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpsertClientProfileSchema,
  type UpsertClientProfileInput,
  type ClientProfile,
} from "@hassad/shared";
import { useUpsertClientProfileMutation } from "@/features/clients/clientsApi";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  Target,
  DollarSign,
  Globe,
  MessageCircle,
  FileText,
  Link as LinkIcon,
  Clock,
  Crown,
  AlertCircle,
  Palette,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const COMMS_OPTIONS = [
  { value: "whatsapp", label: "واتساب" },
  { value: "email", label: "البريد الإلكتروني" },
  { value: "phone", label: "الهاتف" },
  { value: "chat", label: "المحادثة المباشرة" },
] as const;

interface PortalProfileEditFormProps {
  clientId: string;
  profile: ClientProfile | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function PortalProfileEditForm({
  clientId,
  profile,
  onCancel,
  onSuccess,
}: PortalProfileEditFormProps) {
  const [upsertProfile, { isLoading }] = useUpsertClientProfileMutation();

  const form = useForm<UpsertClientProfileInput>({
    resolver: zodResolver(UpsertClientProfileSchema),
    defaultValues: {
      industry: profile?.industry ?? "",
      businessDescription: profile?.businessDescription ?? "",
      targetAudience: profile?.targetAudience ?? "",
      budgetRangeMin: profile?.budgetRangeMin ?? undefined,
      budgetRangeMax: profile?.budgetRangeMax ?? undefined,
      preferredPlatforms: profile?.preferredPlatforms ?? "",
      communicationPreference: (profile?.communicationPreference as UpsertClientProfileInput["communicationPreference"]) ?? undefined,
      website: profile?.website ?? "",
      instagramHandle: profile?.instagramHandle ?? "",
      tiktokHandle: profile?.tiktokHandle ?? "",
      twitterHandle: profile?.twitterHandle ?? "",
      linkedinUrl: profile?.linkedinUrl ?? "",
      snapchatHandle: profile?.snapchatHandle ?? "",
      workingHours: profile?.workingHours ?? "",
      decisionMakerName: profile?.decisionMakerName ?? "",
      decisionMakerPhone: profile?.decisionMakerPhone ?? "",
      painPoints: profile?.painPoints ?? "",
      brandAssets: profile?.brandAssets
        ? {
            logoUrl: profile.brandAssets.logoUrl ?? undefined,
            brandColors: profile.brandAssets.brandColors ?? undefined,
            fonts: profile.brandAssets.fonts ?? undefined,
            guidelinesUrl: profile.brandAssets.guidelinesUrl ?? undefined,
          }
        : undefined,
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const onSubmit = useCallback(
    async (values: UpsertClientProfileInput) => {
      try {
        await upsertProfile({
          id: clientId,
          data: {
            ...values,
            website: values.website || undefined,
            instagramHandle: values.instagramHandle || undefined,
            tiktokHandle: values.tiktokHandle || undefined,
            twitterHandle: values.twitterHandle || undefined,
            linkedinUrl: values.linkedinUrl || undefined,
            snapchatHandle: values.snapchatHandle || undefined,
            workingHours: values.workingHours || undefined,
            decisionMakerName: values.decisionMakerName || undefined,
            decisionMakerPhone: values.decisionMakerPhone || undefined,
            painPoints: values.painPoints || undefined,
          },
        }).unwrap();

        toast.success("تم تحديث الملف التعريفي بنجاح");
        onSuccess();
      } catch (err: unknown) {
        const error = err as { data?: { message?: string | string[] } };
        const msg = error?.data?.message;
        toast.error(
          Array.isArray(msg) ? msg.join("; ") : msg || "حدث خطأ. يرجى المحاولة مرة أخرى.",
        );
      }
    },
    [upsertProfile, clientId, onSuccess],
  );

  return (
    <div className="rounded-2xl border border-portal-card-border bg-natural-0 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-natural-100">تعديل الملف التعريفي</h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-secondary-50 transition-colors"
        >
          <X className="h-5 w-5 text-neutral-400" />
        </button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Business Info */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-natural-100 mb-3 pb-2 border-b border-portal-divider">
              <Building2 className="h-4 w-4 text-secondary-500" />
              معلومات النشاط
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">المجال / النشاط التجاري</FormLabel>
                    <FormControl>
                      <FormInputControl
                        placeholder="مثال: تسويق إلكتروني، مطاعم..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      <Target className="h-3.5 w-3.5 inline me-1 text-neutral-400" />
                      الجمهور المستهدف
                    </FormLabel>
                    <FormControl>
                      <FormInputControl
                        placeholder="فئة عمرية، منطقة، اهتمامات..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessDescription"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-sm">
                      <FileText className="h-3.5 w-3.5 inline me-1 text-neutral-400" />
                      وصف النشاط
                    </FormLabel>
                    <FormControl>
                      <FormTextareaControl
                        placeholder="اخبرنا باختصار عن نشاطك التجاري..."
                        className="resize-none h-20"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Budget */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-natural-100 mb-3 pb-2 border-b border-portal-divider">
              <DollarSign className="h-4 w-4 text-secondary-500" />
              نطاق الميزانية (ر.س)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budgetRangeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">من</FormLabel>
                    <FormControl>
                      <FormInputControl
                        type="number"
                        placeholder="0"
                        dir="ltr"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budgetRangeMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">إلى</FormLabel>
                    <FormControl>
                      <FormInputControl
                        type="number"
                        placeholder="0"
                        dir="ltr"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Communication */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-natural-100 mb-3 pb-2 border-b border-portal-divider">
              <MessageCircle className="h-4 w-4 text-secondary-500" />
              تفضيلات التواصل
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="communicationPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">وسيلة التواصل المفضلة</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val || undefined);
                          }}
                          className={cn(
                            "flex h-11 w-full items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-right appearance-none",
                            "focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:border-secondary-500",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            !field.value && "text-neutral-400",
                          )}
                        >
                          <option value="" disabled>
                            اختر وسيلة التواصل المفضلة
                          </option>
                          {COMMS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferredPlatforms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">المنصات المفضلة</FormLabel>
                    <FormControl>
                      <FormInputControl
                        placeholder="مثال: انستغرام، جوجل..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workingHours"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-sm">
                      <Clock className="h-3.5 w-3.5 inline me-1 text-neutral-400" />
                      أوقات العمل المفضلة للتواصل
                    </FormLabel>
                    <FormControl>
                      <FormInputControl
                        placeholder="مثال: 9:00 ص – 12:00 م"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Digital Presence */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-natural-100 mb-3 pb-2 border-b border-portal-divider">
              <Globe className="h-4 w-4 text-secondary-500" />
              ال presence الرقمية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-sm">
                      <LinkIcon className="h-3.5 w-3.5 inline me-1 text-neutral-400" />
                      الموقع الإلكتروني
                    </FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="https://example.com"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagramHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      <Globe className="h-3.5 w-3.5 inline me-1 text-neutral-400" />
                      انستغرام
                    </FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="username"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tiktokHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">تيك توك</FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="@username"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twitterHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">تويتر / إكس</FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="@username"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">لينكد إن</FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="https://linkedin.com/company/..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="snapchatHandle"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-sm">سناب شات</FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="username"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Decision Maker */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-natural-100 mb-3 pb-2 border-b border-portal-divider">
              <Crown className="h-4 w-4 text-secondary-500" />
              صانع القرار
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="decisionMakerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">الاسم</FormLabel>
                    <FormControl>
                      <FormInputControl
                        placeholder="اسم صانع القرار"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="decisionMakerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">الهاتف</FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="05xxxxxxxx"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Pain Points */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-natural-100 mb-3 pb-2 border-b border-portal-divider">
              <AlertCircle className="h-4 w-4 text-secondary-500" />
              نقاط الألم والتحديات
            </h3>
            <FormField
              control={form.control}
              name="painPoints"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FormTextareaControl
                      placeholder="ما هي التحديات التي تواجهها حالياً؟"
                      className="resize-none h-24"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Brand Assets */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-natural-100 mb-3 pb-2 border-b border-portal-divider">
              <Palette className="h-4 w-4 text-secondary-500" />
              الهوية البصرية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brandAssets.logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">رابط الشعار</FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="https://..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brandAssets.guidelinesUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">دليل الهوية البصرية</FormLabel>
                    <FormControl>
                      <FormInputControl
                        dir="ltr"
                        placeholder="https://..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-portal-divider">
            <ActionButton variant="ghost" onClick={onCancel}>
              إلغاء
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              icon={
                isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )
              }
            >
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </ActionButton>
          </div>
        </form>
      </Form>
    </div>
  );
}
