"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BusinessType, ClientSource } from "@hassad/shared";
import { useCreateRequestMutation } from "@/features/requests/requestsApi";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { useGetClientByIdQuery } from "@/features/clients/clientsApi";
import { useAppSelector } from "@/lib/hooks";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  PlusCircle,
  ArrowRight,
  User,
  Phone,
  Mail,
  Building2,
} from "lucide-react";
import { Checkbox } from "@/components/design-system/Checkbox";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { SelectItem } from "@/components/design-system/Select";
import { FormInput } from "@/components/design-system/FormInput";
import { FormTextarea } from "@/components/design-system/FormTextarea";
import { Select } from "@/components/design-system/Select";

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
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [createRequest, { isLoading }] = useCreateRequestMutation();
  const { data: services } = useGetServicesQuery(undefined);

  const isReturningClient = user?.clientId && user?.intakeCompleted === true;
  const { data: client } = useGetClientByIdQuery(user?.clientId ?? "", {
    skip: !isReturningClient,
  });

  const [step, setStep] = useState<1 | 2>(isReturningClient ? 2 : 1);

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

  useEffect(() => {
    if (isReturningClient && client) {
      form.setValue("contactName", client.contactName);
      form.setValue("phoneWhatsapp", client.phoneWhatsapp);
      form.setValue("email", client.email ?? "");
      form.setValue("companyName", client.companyName);
    }
  }, [isReturningClient, client, form]);

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
    {
      id: "social_media",
      label: "إدارة وسائل التواصل الاجتماعي",
      description: "",
    },
    { id: "content", label: "إنشاء المحتوى", description: "" },
    {
      id: "paid_ads",
      label: "الإعلانات المدفوعة (Meta / Google)",
      description: "",
    },
    { id: "seo", label: "تحسين محركات البحث (SEO)", description: "" },
    { id: "web_dev", label: "تطوير المواقع الإلكترونية", description: "" },
    { id: "design", label: "التصميم الجرافيكي", description: "" },
    { id: "branding", label: "إدارة العلامة التجارية", description: "" },
    {
      id: "email_marketing",
      label: "التسويق بالبريد الإلكتروني",
      description: "",
    },
  ];
  const serviceOptions =
    activeServices.length > 0
      ? activeServices.map((s) => ({
          id: s.id,
          label: s.nameAr || s.name,
          description: s.descriptionAr || s.description || "",
        }))
      : fallbackServices;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="إنشاء طلب جديد"
        description=" املأ البيانات المطلوبة في خطوتين لإنشاء طلبك الجديد"
        icon={PlusCircle}
      />

      <SurfaceCard>
        <div className="max-w-xl mx-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              {/* Returning client banner */}
              {isReturningClient && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary-50 border border-secondary-200 text-secondary-700 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  أنت عميل سابق — فقط أخبرنا بما تحتاج
                </div>
              )}

              {/* Stepper */}
              {!isReturningClient && (
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
              )}

              {/* Step 1 */}
              {step === 1 && !isReturningClient && (
                <div className="flex flex-col gap-5">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field, fieldState }) => (
                      <FormInput
                        label="الاسم الكامل"
                        placeholder="مثال: أحمد محمد العمري"
                        error={fieldState.error?.message}
                        autoFocus
                        {...field}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneWhatsapp"
                    render={({ field, fieldState }) => (
                      <FormInput
                        label="رقم الهاتف (واتساب)"
                        placeholder="+966 5X XXX XXXX"
                        type="tel"
                        dir="ltr"
                        error={fieldState.error?.message}
                        {...field}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormInput
                        label="البريد الإلكتروني (اختياري)"
                        placeholder="example@company.com"
                        type="email"
                        dir="ltr"
                        error={fieldState.error?.message}
                        {...field}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field, fieldState }) => (
                      <FormInput
                        label="اسم الشركة / المشروع"
                        placeholder="مثال: مطعم النخيل"
                        error={fieldState.error?.message}
                        {...field}
                      />
                    )}
                  />
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  {/* Returning client identity summary */}
                  {isReturningClient && client && (
                    <div className="rounded-2xl border border-portal-card-border bg-white p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-natural-100">معلوماتك المسجلة</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-neutral-400">
                          <User className="w-4 h-4 shrink-0" />
                          <span className="text-natural-100 font-medium">{client.contactName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400" dir="ltr">
                          <Phone className="w-4 h-4 shrink-0" />
                          <span className="text-natural-100 font-medium">{client.phoneWhatsapp}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2 text-neutral-400" dir="ltr">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="text-natural-100 font-medium">{client.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Building2 className="w-4 h-4 shrink-0" />
                          <span className="text-natural-100 font-medium">{client.companyName}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field, fieldState }) => (
                      <Select
                        label="نوع النشاط التجاري"
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        placeholder="اختر نوع نشاطك التجاري"
                        error={fieldState.error?.message}
                      >
                        {Object.values(BusinessType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {BUSINESS_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <FormTextarea
                        label="وصف المشروع (اختياري)"
                        placeholder="أخبرنا باختصار عن نشاطك وما تريد تحقيقه..."
                        className="h-24"
                        error={fieldState.error?.message}
                        {...field}
                      />
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
                                      <p className="text-xs text-portal-icon leading-snug">
                                        {service.description}
                                      </p>
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
                {step === 2 && !isReturningClient ? (
                  <ActionButton
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="h-12 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-5 text-base font-medium text-portal-icon hover:bg-badge-gray-bg gap-2 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" /> السابق
                  </ActionButton>
                ) : (
                  <div />
                )}
                {step === 1 ? (
                  <ActionButton
                    type="button"
                    onClick={handleNext}
                    className="gap-2 h-12 rounded-2xl px-5 text-base font-medium bg-secondary-500 hover:bg-secondary-600 text-white mr-auto cursor-pointer"
                  >
                    التالي <ChevronLeft className="w-4 h-4" />
                  </ActionButton>
                ) : (
                  <ActionButton
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
                  </ActionButton>
                )}
              </div>
            </form>
          </Form>
        </div>
      </SurfaceCard>
    </div>
  );
}
