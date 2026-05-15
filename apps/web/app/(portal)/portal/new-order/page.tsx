"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BusinessType, ClientSource } from "@hassad/shared";
import { useCreateRequestMutation } from "@/features/requests/requestsApi";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { PortalPageIntro } from "@/components/portal/PortalPageIntro";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  SelectItem,
} from "@/components/ui/select";
import { PortalInput } from "@/components/portal/PortalInput";
import { PortalTextarea } from "@/components/portal/PortalTextarea";
import { PortalSelect } from "@/components/portal/PortalSelect";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم / كافيه",
  [BusinessType.CLINIC]: "عيادة / مركز صحي",
  [BusinessType.STORE]: "متجر / تجزئة",
  [BusinessType.SERVICE]: "شركة خدمات",
  [BusinessType.OTHER]: "أخرى",
};

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
  email: z
    .string()
    .email("بريد إلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),
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
  serviceIds: z.array(z.string()).min(1, "اختر خدمة واحدة على الأقل"),
});

const orderSchema = step1Schema.merge(step2Schema);
type OrderFormValues = z.infer<typeof orderSchema>;

export default function PortalNewOrderPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const router = useRouter();
  const [createRequest, { isLoading }] = useCreateRequestMutation();
  const { data: services } = useGetServicesQuery(undefined);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      contactName: "",
      phoneWhatsapp: "",
      email: "",
      companyName: "",
      businessType: undefined as any,
      description: "",
      serviceIds: [],
    },
    mode: "onSubmit",
  });

  async function handleNext() {
    form.clearErrors(["contactName", "phoneWhatsapp", "companyName"]);
    const values = form.getValues();
    const result = step1Schema.safeParse(values);
    if (result.success) {
      setStep(2);
    } else {
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as keyof OrderFormValues;
        form.setError(fieldName, { message: issue.message });
      }
    }
  }

  async function onSubmit(values: OrderFormValues) {
    try {
      const notes = JSON.stringify({
        description: values.description || "",
        services: values.serviceIds,
      });
      await createRequest({
        contactName: values.contactName,
        companyName: values.companyName,
        businessName: values.companyName,
        phoneWhatsapp: values.phoneWhatsapp,
        email: values.email || undefined,
        businessType: values.businessType,
        source: ClientSource.PLATFORM,
        notes,
        services: values.serviceIds.map((id) => ({
          serviceId: id,
          quantity: 1,
        })),
      }).unwrap();
      toast.success("تم إنشاء الطلب بنجاح! سيتواصل معك فريق المبيعات قريباً.");
      router.push("/portal");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "حدث خطأ. يرجى المحاولة مرة أخرى.");
    }
  }

  const activeServices = (services ?? []).filter((s) => s.isActive);
  const fallbackServices = [
    { id: "social_media", label: "إدارة وسائل التواصل الاجتماعي", description: "" },
    { id: "content", label: "إنشاء المحتوى", description: "" },
    { id: "paid_ads", label: "الإعلانات المدفوعة (Meta / Google)", description: "" },
    { id: "seo", label: "تحسين محركات البحث (SEO)", description: "" },
    { id: "web_dev", label: "تطوير المواقع الإلكترونية", description: "" },
    { id: "design", label: "التصميم الجرافيكي", description: "" },
    { id: "branding", label: "إدارة العلامة التجارية", description: "" },
    { id: "email_marketing", label: "التسويق بالبريد الإلكتروني", description: "" },
  ];
  const serviceOptions =
    activeServices.length > 0
      ? activeServices.map((s) => ({ id: s.id, label: s.nameAr || s.name, description: s.descriptionAr || s.description || "" }))
      : fallbackServices;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PortalPageIntro
        title="إنشاء طلب جديد"
        description=" املأ البيانات المطلوبة في خطوتين لإنشاء طلبك الجديد"
        icon={PlusCircle}
      />

      <PortalSurfaceCard>
        <div className="max-w-xl mx-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              {/* Stepper */}
              <div className="flex items-center gap-3">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors",
                        step === s
                          ? "bg-secondary-500 text-white"
                          : step > s
                            ? "bg-success-500 text-white"
                            : "bg-portal-divider text-portal-icon",
                      )}
                    >
                      {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        step >= s ? "text-secondary-500" : "text-portal-icon",
                      )}
                    >
                      {s === 1 ? "المعلومات الأساسية" : "تفاصيل المشروع"}
                    </span>
                    {s < 2 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 rounded",
                          step > s ? "bg-success-500" : "bg-portal-divider",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          الاسم الكامل{" "}
                          <span className="text-danger-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <PortalInput
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
                          <PortalInput
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                        <FormControl>
                          <PortalInput
                            placeholder="example@company.com"
                            type="email"
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
                          <PortalInput placeholder="مثال: مطعم النخيل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2 */}
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
                        <FormControl>
                          <PortalSelect
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            placeholder="اختر نوع نشاطك التجاري"
                          >
                            {Object.values(BusinessType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {BUSINESS_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </PortalSelect>
                        </FormControl>
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
                          <PortalTextarea
                            placeholder="أخبرنا باختصار عن نشاطك وما تريد تحقيقه..."
                            className="h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>
                          الخدمات المطلوبة{" "}
                          <span className="text-danger-500">*</span>
                        </FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                          {serviceOptions.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="serviceIds"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-2xl border-portal-card-border border p-3 hover:bg-portal-bg transition-colors cursor-pointer">
                                   <FormControl>
                                     <Checkbox
                                       checked={field.value?.includes(
                                         service.id,
                                       )}
                                       onCheckedChange={(checked) => {
                                         const current = field.value ?? [];
                                         field.onChange(
                                           checked
                                             ? [...current, service.id]
                                             : current.filter(
                                                 (v) => v !== service.id,
                                               ),
                                         );
                                       }}
                                     />
                                   </FormControl>
                                   <div className="flex flex-col gap-0.5">
                                     <FormLabel className="font-normal cursor-pointer text-sm leading-tight">
                                       {service.label}
                                     </FormLabel>
                                     {service.description && (
                                       <p className="text-xs text-portal-icon leading-snug">{service.description}</p>
                                     )}
                                   </div>
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

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t-[1.5px] border-portal-card-border">
                {step === 2 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg gap-2 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" /> السابق
                  </Button>
                ) : (
                  <div />
                )}
                {step === 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2 h-12 rounded-2xl px-5 text-base font-medium bg-secondary-500 hover:bg-secondary-600 text-white mr-auto cursor-pointer"
                  >
                    التالي <ChevronLeft className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="gap-2 h-12 rounded-2xl px-5 text-base font-medium bg-secondary-500 hover:bg-secondary-600 text-white cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> جاري
                        الإنشاء...
                      </>
                    ) : (
                      <>
                        إنشاء الطلب <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </PortalSurfaceCard>
    </div>
  );
}
