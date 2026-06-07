"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BusinessType, ClientSource } from "@hassad/shared";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import { Checkbox } from "@/components/design-system/Checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/design-system/FormSelectControl";
import { useCreateRequestMutation } from "@/features/requests/requestsApi";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

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
    mode: "onChange",
  });

  async function handleNext() {
    const valid = await form.trigger([
      "contactName",
      "phoneWhatsapp",
      "companyName",
    ]);
    if (valid) setStep(2);
  }

  async function onSubmit(values: IntakeFormValues) {
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
      );
      onSuccess();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string | string[] } };
      const msg = error?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join("; ") : msg || "حدث خطأ. يرجى المحاولة مرة أخرى.",
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {/* ── Stepper ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors",
                  step === s
                    ? "bg-secondary-500 text-natural-0"
                    : step > s
                      ? "bg-success-500 text-white"
                      : "bg-neutral-50 text-neutral-300",
                )}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  step >= s ? "text-natural-100" : "text-neutral-300",
                )}
              >
                {s === 1 ? "المعلومات الأساسية" : "تفاصيل المشروع"}
              </span>
              {s < 2 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 rounded transition-colors",
                    step > s ? "bg-success-400" : "bg-neutral-50",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Basic Information ─────────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    الاسم الكامل <span className="text-danger-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <FormInputControl
                      placeholder="مثال: أحمد محمد العمري"
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
                  <FormLabel>
                    رقم الهاتف (واتساب){" "}
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

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    اسم الشركة / المشروع{" "}
                    <span className="text-danger-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <FormInputControl placeholder="مثال: مطعم النخيل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* ── Step 2: Business & Needs ──────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    نوع النشاط التجاري{" "}
                    <span className="text-danger-500">*</span>
                  </FormLabel>
                  <FormSelect
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <FormSelectTrigger>
                        <FormSelectValue placeholder="اختر نوع نشاطك التجاري" />
                      </FormSelectTrigger>
                    </FormControl>
                    <FormSelectContent>
                      {Object.values(BusinessType).map((type) => (
                        <FormSelectItem key={type} value={type}>
                          {BUSINESS_TYPE_LABELS[type]}
                        </FormSelectItem>
                      ))}
                    </FormSelectContent>
                  </FormSelect>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف المشروع (اختياري)</FormLabel>
                  <FormControl>
                    <FormTextareaControl
                      placeholder="أخبرنا باختصار عن نشاطك وما تريد تحقيقه..."
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="services"
              render={() => (
                <FormItem>
                  <FormLabel>
                    الخدمات المطلوبة <span className="text-danger-500">*</span>
                  </FormLabel>
                  {servicesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-neutral-300" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {services.map((service) => (
                        <FormField
                          key={service.id}
                          control={form.control}
                          name="services"
                          render={({ field }) => (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-center gap-3 space-y-0 rounded-lg border p-3 hover:bg-neutral-50/40 transition-colors cursor-pointer"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? [];
                                    if (checked) {
                                      field.onChange([...current, service.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((v) => v !== service.id),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer text-sm leading-tight">
                                {service.nameAr}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* ── Navigation Buttons ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t gap-3">
          {step === 2 ? (
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isLoading}
              icon={<ChevronRight className="w-4 h-4" />}
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
            >
              التالي
            </ActionButton>
          ) : (
            <ActionButton
              type="submit"
              variant="primary"
              loading={isLoading}
              icon={<Loader2 className="w-4 h-4" />}
              iconPosition="right"
            >
              {isLoading ? "جاري الإرسال..." : submitLabel}
            </ActionButton>
          )}
        </div>
      </form>
    </Form>
  );
}
