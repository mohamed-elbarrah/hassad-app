"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BusinessType, ClientSource } from "@hassad/shared";
import { useCreateLeadMutation } from "@/features/leads/leadsApi";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, PlusCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم / كافيه",
  [BusinessType.CLINIC]: "عيادة / مركز صحي",
  [BusinessType.STORE]: "متجر / تجزئة",
  [BusinessType.SERVICE]: "شركة خدمات",
  [BusinessType.OTHER]: "أخرى",
};

const step1Schema = z.object({
  contactName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(80, "الاسم طويل جداً"),
  phoneWhatsapp: z.string().min(8, "رقم الهاتف غير صحيح").max(20, "رقم الهاتف غير صحيح").regex(/^[+\d\s\-()]+$/, "أدخل رقماً صحيحاً"),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
  companyName: z.string().min(2, "اسم الشركة يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً"),
});

const step2Schema = z.object({
  businessType: z.nativeEnum(BusinessType, { message: "اختر نوع النشاط التجاري" }),
  description: z.string().max(500, "الوصف طويل جداً").optional(),
  serviceIds: z.array(z.string()).min(1, "اختر خدمة واحدة على الأقل"),
});

const orderSchema = step1Schema.merge(step2Schema);
type OrderFormValues = z.infer<typeof orderSchema>;

export default function PortalNewOrderPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const router = useRouter();
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const { data: services } = useGetServicesQuery(undefined);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      contactName: "",
      phoneWhatsapp: "",
      email: "",
      companyName: "",
      businessType: undefined,
      description: "",
      serviceIds: [],
    },
    mode: "onChange",
  });

  async function handleNext() {
    const valid = await form.trigger(["contactName", "phoneWhatsapp", "companyName"]);
    if (valid) setStep(2);
  }

  async function onSubmit(values: OrderFormValues) {
    try {
      const notes = JSON.stringify({
        description: values.description || "",
        services: values.serviceIds,
      });

      const result = await createLead({
        contactName: values.contactName,
        companyName: values.companyName,
        businessName: values.companyName,
        phoneWhatsapp: values.phoneWhatsapp,
        email: values.email || undefined,
        businessType: values.businessType,
        source: ClientSource.PLATFORM,
        notes,
        services: values.serviceIds.map((id) => ({ serviceId: id, quantity: 1 })),
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
    { id: "social_media", label: "إدارة وسائل التواصل الاجتماعي" },
    { id: "content", label: "إنشاء المحتوى" },
    { id: "paid_ads", label: "الإعلانات المدفوعة (Meta / Google)" },
    { id: "seo", label: "تحسين محركات البحث (SEO)" },
    { id: "web_dev", label: "تطوير المواقع الإلكترونية" },
    { id: "design", label: "التصميم الجرافيكي" },
    { id: "branding", label: "إدارة العلامة التجارية" },
    { id: "email_marketing", label: "التسويق بالبريد الإلكتروني" },
  ];
  const serviceOptions = activeServices.length > 0
    ? activeServices.map((s) => ({ id: s.id, label: s.nameAr || s.name }))
    : fallbackServices;

  return (
    <div dir="rtl" style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(18,25,54,0.05)" }}>
          <PlusCircle style={{ width: 22, height: 22, color: "#121936" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#000000" }}>إنشاء طلب جديد</h1>
          <p style={{ fontSize: 16, color: "rgba(0,0,0,0.6)" }}>
            أنشئ طلباً جديداً لمتابعته عبر مراحل خط المبيعات
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Stepper */}
          <div className="flex items-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors",
                    step === s ? "bg-[#121936] text-white" : step > s ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500",
                  )}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span className={cn("text-sm font-medium", step >= s ? "text-[#121936]" : "text-gray-400")}>
                  {s === 1 ? "المعلومات الأساسية" : "تفاصيل المشروع"}
                </span>
                {s < 2 && <div className={cn("flex-1 h-0.5 rounded", step > s ? "bg-emerald-400" : "bg-gray-200")} />}
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
                    <FormLabel>الاسم الكامل <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="مثال: أحمد محمد العمري" autoFocus {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف (واتساب) <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="+966 5X XXX XXXX" type="tel" dir="ltr" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="example@company.com" type="email" dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الشركة / المشروع <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="مثال: مطعم النخيل" {...field} /></FormControl>
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
                    <FormLabel>نوع النشاط التجاري <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر نوع نشاطك التجاري" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.values(BusinessType).map((type) => (
                          <SelectItem key={type} value={type}>{BUSINESS_TYPE_LABELS[type]}</SelectItem>
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
                    <FormControl><Textarea placeholder="أخبرنا باختصار عن نشاطك وما تريد تحقيقه..." className="resize-none h-24" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceIds"
                render={() => (
                  <FormItem>
                    <FormLabel>الخدمات المطلوبة <span className="text-red-500">*</span></FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {serviceOptions.map((service) => (
                        <FormField
                          key={service.id}
                          control={form.control}
                          name="serviceIds"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border p-3 hover:bg-gray-50 transition-colors cursor-pointer" style={{ borderColor: "#E1E4EA" }}>
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? [];
                                    field.onChange(checked ? [...current, service.id] : current.filter((v) => v !== service.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer text-sm leading-tight">{service.label}</FormLabel>
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
          <div className="flex items-center justify-between pt-4" style={{ borderTop: "1.5px solid #E1E4EA" }}>
            {step === 2 ? (
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isLoading} className="gap-2">
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
            ) : <div />}
            {step === 1 ? (
              <Button type="button" onClick={handleNext} className="gap-2 mr-auto" style={{ background: "#121936" }}>
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="gap-2" style={{ background: "#121936" }}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</> : <>إنشاء الطلب <ArrowRight className="w-4 h-4" /></>}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}