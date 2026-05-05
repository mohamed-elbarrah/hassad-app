"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BusinessType, ClientSource } from "@hassad/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequestMutation } from "@/features/requests/requestsApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

// ─── Services List ─────────────────────────────────────────────────────────────
const SERVICES = [
  { id: "social_media", label: "إدارة وسائل التواصل الاجتماعي" },
  { id: "content", label: "إنشاء المحتوى" },
  { id: "paid_ads", label: "الإعلانات المدفوعة (Meta / Google)" },
  { id: "seo", label: "تحسين محركات البحث (SEO)" },
  { id: "web_dev", label: "تطوير المواقع الإلكترونية" },
  { id: "design", label: "التصميم الجرافيكي" },
  { id: "branding", label: "إدارة العلامة التجارية" },
  { id: "email_marketing", label: "التسويق بالبريد الإلكتروني" },
] as const;

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
  /** Optional label override for the submit button */
  submitLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function IntakeForm({
  onSuccess,
  submitLabel = "إرسال",
}: IntakeFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [createRequest, { isLoading }] = useCreateRequestMutation();

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

  // Validate only step 1 fields before advancing
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
      const notes = JSON.stringify({
        description: values.description || "",
        services: values.services,
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
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "حدث خطأ. يرجى المحاولة مرة أخرى.");
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
                    ? "bg-primary text-primary-foreground"
                    : step > s
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  step >= s ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s === 1 ? "المعلومات الأساسية" : "تفاصيل المشروع"}
              </span>
              {s < 2 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 rounded transition-colors",
                    step > s ? "bg-emerald-400" : "bg-muted",
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
                    الاسم الكامل <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
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
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
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
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: مطعم النخيل" {...field} />
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
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع نشاطك التجاري" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(BusinessType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {BUSINESS_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Textarea
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
                    الخدمات المطلوبة <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {SERVICES.map((service) => (
                      <FormField
                        key={service.id}
                        control={form.control}
                        name="services"
                        render={({ field }) => (
                          <FormItem
                            key={service.id}
                            className="flex flex-row items-center gap-3 space-y-0 rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer"
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
                              {service.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* ── Navigation Buttons ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t gap-3">
          {step === 2 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="gap-2 mr-auto"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2 mr-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
