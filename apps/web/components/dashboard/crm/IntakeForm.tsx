"use client";

import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BusinessType, ClientSource } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
// Radix Checkbox removed — causes infinite re-render loops with
// react-hook-form Controller. Replaced with styled div below.
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
// Radix Select removed — causes infinite re-render loops with
// react-hook-form Controller when value starts as undefined.
import { useCreateRequestMutation } from "@/features/requests/requestsApi";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Building2,
  Phone,
  User,
  Briefcase,
  FileText,
  ShoppingCart,
  ChevronDown,
  Check,
} from "lucide-react";

// ─── Business Type Labels ──────────────────────────────────────────────────────
const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم / كافيه",
  [BusinessType.CLINIC]: "عيادة / مركز صحي",
  [BusinessType.STORE]: "متجر / تجزئة",
  [BusinessType.SERVICE]: "شركة خدمات",
  [BusinessType.OTHER]: "أخرى",
};

// ─── Zod Schemas ───────────────────────────────────────────────────────────────
const step1Schema = z.object({
  contactName: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(80, "الاسم طويل جداً"),
  phoneWhatsapp: z
    .string()
    .min(8, "رقم الهاتف غير صحيح")
    .max(20, "رقم الهاتف غير صحيح")
    .regex(/^[+\d\s\-()]+$/, "أدخل رقماً صحيحاً"),
  companyName: z
    .string()
    .min(2, "اسم الشركة يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
});

const step2Schema = z.object({
  businessType: z.nativeEnum(BusinessType, {
    message: "اختر نوع النشاط التجاري",
  }),
  description: z.string().max(500, "الوصف طويل جداً").optional(),
  services: z.array(z.string()).min(1, "اختر خدمة واحدة على الأقل"),
});

const intakeSchema = step1Schema.merge(step2Schema);
type IntakeFormValues = z.infer<typeof intakeSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
interface IntakeFormProps {
  onSuccess: () => void;
  submitLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function IntakeForm({
  onSuccess,
  submitLabel = "إرسال",
}: IntakeFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [createRequest, { isLoading }] = useCreateRequestMutation();
  const { data: services = [], isLoading: servicesLoading } =
    useGetServicesQuery(undefined);

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      contactName: "",
      phoneWhatsapp: "",
      companyName: "",
      businessType: undefined,
      description: "",
      services: [],
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const handleNext = useCallback(async () => {
    const valid = await form.trigger([
      "contactName",
      "phoneWhatsapp",
      "companyName",
    ]);
    if (valid) setStep(2);
  }, [form]);

  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  const onSubmit = useCallback(
    async (values: IntakeFormValues) => {
      try {
        const selectedServices = services.filter((s) =>
          values.services.includes(s.id),
        );

        const notes = JSON.stringify({
          description: values.description || "",
          services: selectedServices.map((s) => s.nameAr),
        });

        await createRequest({
          contactName: values.contactName,
          companyName: values.companyName,
          businessName: values.companyName,
          phoneWhatsapp: values.phoneWhatsapp,
          businessType: values.businessType,
          source: ClientSource.PLATFORM,
          notes,
          services: values.services.map((serviceId) => ({
            serviceId,
            quantity: 1,
          })),
        }).unwrap();

        toast.success(
          "تم إرسال بياناتك بنجاح! سيتواصل معك فريق المبيعات قريباً.",
          { duration: 5000 },
        );
        onSuccess();
      } catch (err: unknown) {
        const error = err as { data?: { message?: string | string[] } };
        const msg = error?.data?.message;
        toast.error(
          Array.isArray(msg)
            ? msg.join("; ")
            : msg || "حدث خطأ. يرجى المحاولة مرة أخرى.",
        );
      }
    },
    [createRequest, onSuccess, services],
  );

  // Memoized service items
  const serviceItems = useMemo(() => {
    return services.map((service) => ({
      id: service.id,
      name: service.nameAr,
    }));
  }, [services]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
        {/* ── Progress Stepper ─────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2].map((s, index) => (
              <div key={s} className="flex items-center flex-1">
                {/* Step Circle + Label */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300",
                      step === s
                        ? "bg-secondary-500 text-white shadow-lg shadow-secondary-500/25"
                        : step > s
                          ? "bg-success-500 text-white"
                          : "bg-neutral-100 text-neutral-400",
                    )}
                  >
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors whitespace-nowrap",
                      step >= s ? "text-natural-100" : "text-neutral-300",
                    )}
                  >
                    {s === 1 ? "بيانات التواصل" : "تفاصيل المشروع"}
                  </span>
                </div>

                {/* Connecting Line */}
                {index < 1 && (
                  <div className="flex-1 mx-4 flex items-center self-start mt-5">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500 flex-1",
                        step > s ? "bg-success-400" : "bg-neutral-100",
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1: Basic Information ─────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Name and Phone Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-neutral-400" />
                      الاسم الكامل
                      <span className="text-danger-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <FormInputControl
                        placeholder="مثال: أحمد محمد"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      رقم الهاتف (واتساب)
                      <span className="text-danger-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <FormInputControl
                        placeholder="+966 5X XXX XXXX"
                        type="tel"
                        dir="ltr"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                    اسم الشركة / المشروع
                    <span className="text-danger-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <FormInputControl
                      placeholder="مثال: مطعم النخيل"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* ── Step 2: Business & Needs ───────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Business Type — native <select> avoids Radix infinite loop */}
            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-neutral-400" />
                    نوع النشاط التجاري
                    <span className="text-danger-500">*</span>
                  </FormLabel>
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
                          اختر نوع نشاطك التجاري
                        </option>
                        {Object.values(BusinessType).map((type) => (
                          <option key={type} value={type}>
                            {BUSINESS_TYPE_LABELS[type]}
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

            {/* Description Textarea */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    وصف المشروع (اختياري)
                  </FormLabel>
                  <FormControl>
                    <FormTextareaControl
                      placeholder="أخبرنا باختصار عن نشاطك وما تريد تحقيقه..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Services Selection */}
            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <ShoppingCart className="w-4 h-4 text-neutral-400" />
                    الخدمات المطلوبة
                    <span className="text-danger-500">*</span>
                  </FormLabel>
                  {servicesLoading ? (
                    <div className="flex items-center justify-center p-6 bg-neutral-50 rounded-xl">
                      <Loader2 className="w-5 h-5 animate-spin text-secondary-500" />
                      <span className="mr-2 text-sm text-neutral-400">
                        جاري تحميل الخدمات...
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {serviceItems.map((service) => {
                        const isSelected = field.value?.includes(service.id);
                        return (
                          <div
                            key={service.id}
                            onClick={() => {
                              const current = field.value || [];
                              const newValue = current.includes(service.id)
                                ? current.filter((v) => v !== service.id)
                                : [...current, service.id];
                              field.onChange(newValue);
                            }}
                            className={cn(
                              "flex flex-row items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-200",
                              isSelected
                                ? "border-secondary-500 bg-secondary-50/50 shadow-sm"
                                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/40",
                            )}
                          >
                            {/* Purely-visual checkmark — no Radix primitive */}
                            <span
                              className={cn(
                                "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-colors",
                                isSelected
                                  ? "border-secondary-500 bg-secondary-500 text-white"
                                  : "border-portal-card-border bg-white",
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                            <span className="font-medium text-sm leading-tight flex-1 cursor-pointer select-none">
                              {service.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* ── Navigation Buttons ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-10 gap-3">
          {step === 2 ? (
            <ActionButton
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              icon={<ChevronRight className="w-4 h-4" />}
              className="min-w-[100px]"
            >
              السابق
            </ActionButton>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <ActionButton
              type="button"
              variant="primary"
              onClick={handleNext}
              disabled={servicesLoading}
              icon={<ChevronLeft className="w-4 h-4" />}
              iconPosition="right"
              className="min-w-[120px]"
            >
              التالي
            </ActionButton>
          ) : (
            <ActionButton
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                submitLabel
              )}
            </ActionButton>
          )}
        </div>
      </form>
    </Form>
  );
}
