"use client";

import { useState, useEffect } from "react";
import {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} from "@/features/admin/adminApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { toast } from "sonner";
import {
  Settings,
  Save,
  RotateCcw,
  Building2,
  FileText,
  Palette,
  Shield,
  Brain,
  Bell,
} from "lucide-react";

const TABS = [
  { value: "general", label: "عام", icon: Building2 },
  { value: "billing", label: "الفوترة", icon: FileText },
  { value: "branding", label: "العلامة التجارية", icon: Palette },
  { value: "security", label: "الأمان", icon: Shield },
  { value: "ai", label: "الذكاء الاصطناعي", icon: Brain },
  { value: "notifications", label: "الإشعارات", icon: Bell },
];

const FIELD_DEFS: Record<
  string,
  Array<{ key: string; label: string; type: string; placeholder: string }>
> = {
  general: [
    {
      key: "companyName",
      label: "اسم الشركة (عربي)",
      type: "text",
      placeholder: "حصاد",
    },
    {
      key: "companyNameEn",
      label: "اسم الشركة (إنجليزي)",
      type: "text",
      placeholder: "Hassad",
    },
    {
      key: "supportEmail",
      label: "البريد الإلكتروني للدعم",
      type: "email",
      placeholder: "support@hassad.sa",
    },
    {
      key: "supportPhone",
      label: "رقم هاتف الدعم",
      type: "text",
      placeholder: "+966500000000",
    },
    {
      key: "defaultCurrency",
      label: "العملة الافتراضية",
      type: "text",
      placeholder: "SAR",
    },
    {
      key: "timezone",
      label: "المنطقة الزمنية",
      type: "text",
      placeholder: "Asia/Riyadh",
    },
    {
      key: "dateFormat",
      label: "صيغة التاريخ",
      type: "text",
      placeholder: "DD/MM/YYYY",
    },
    {
      key: "language",
      label: "اللغة الافتراضية",
      type: "text",
      placeholder: "ar",
    },
  ],
  billing: [
    {
      key: "invoicePrefix",
      label: "بادئة رقم الفاتورة",
      type: "text",
      placeholder: "INV",
    },
    {
      key: "down_payment_grace_days",
      label: "مهلة الدفعة المقدمة (يوم)",
      type: "number",
      placeholder: "7",
    },
    {
      key: "reminder_offset_days",
      label: "أيام التذكير (مفصولة بفاصلة)",
      type: "text",
      placeholder: "5,3,0",
    },
    {
      key: "suspend_on_overdue",
      label: "تعليق عند التأخر",
      type: "select",
      placeholder: "",
    },
    {
      key: "lowBalanceAlert",
      label: "حد التنبيه المالي (ريال)",
      type: "number",
      placeholder: "5000",
    },
    {
      key: "autoArchiveDays",
      label: "أرشفة تلقائية بعد (يوم)",
      type: "number",
      placeholder: "90",
    },
  ],
  branding: [
    {
      key: "brand_logo_url",
      label: "رابط الشعار",
      type: "text",
      placeholder: "https://...",
    },
    {
      key: "brand_primary_color",
      label: "اللون الأساسي",
      type: "text",
      placeholder: "#1a73e8",
    },
    {
      key: "brand_secondary_color",
      label: "اللون الثانوي",
      type: "text",
      placeholder: "#34a853",
    },
    {
      key: "brand_white_label",
      label: "العلامة البيضاء (إخفاء العلامة التجارية)",
      type: "select",
      placeholder: "",
    },
  ],
  security: [
    {
      key: "security_password_min_length",
      label: "الحد الأدنى لطول كلمة المرور",
      type: "number",
      placeholder: "8",
    },
    {
      key: "security_session_timeout",
      label: "مهلة الجلسة (دقيقة)",
      type: "number",
      placeholder: "60",
    },
    {
      key: "security_2fa_enforced",
      label: "إلزام المصادقة الثنائية",
      type: "select",
      placeholder: "",
    },
    {
      key: "security_max_login_attempts",
      label: "الحد الأقصى لمحاولات تسجيل الدخول",
      type: "number",
      placeholder: "5",
    },
    {
      key: "security_lockout_duration",
      label: "مدة القفل (دقيقة)",
      type: "number",
      placeholder: "30",
    },
  ],
  ai: [
    {
      key: "ai_gemini_enabled",
      label: "تفعيل الذكاء الاصطناعي",
      type: "select",
      placeholder: "",
    },
    {
      key: "ai_gemini_model",
      label: "نموذج Gemini",
      type: "text",
      placeholder: "gemini-2.0-flash",
    },
    {
      key: "ai_auto_lead_scoring",
      label: "التقييم التلقائي للعملاء المحتملين",
      type: "select",
      placeholder: "",
    },
    {
      key: "ai_auto_task_suggestions",
      label: "اقتراحات المهام التلقائية",
      type: "select",
      placeholder: "",
    },
  ],
  notifications: [
    {
      key: "notif_email_enabled",
      label: "إشعارات البريد الإلكتروني",
      type: "select",
      placeholder: "",
    },
    {
      key: "notif_sms_enabled",
      label: "إشعارات الرسائل النصية",
      type: "select",
      placeholder: "",
    },
    {
      key: "notif_in_app_enabled",
      label: "الإشعارات داخل التطبيق",
      type: "select",
      placeholder: "",
    },
    {
      key: "notif_reminder_before_days",
      label: "أيام التذكير قبل الاستحقاق",
      type: "number",
      placeholder: "3",
    },
  ],
};

export default function AdminSettingsPage() {
  const { data: serverSettings, isLoading } = useGetAdminSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateAdminSettingsMutation();
  const [form, setForm] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const toFormValue = (key: string, val: any): string => {
    if (Array.isArray(val)) return val.join(",");
    if (typeof val === "boolean") return val ? "true" : "false";
    return String(val ?? "");
  };

  useEffect(() => {
    if (serverSettings && Object.keys(form).length === 0) {
      const initial: Record<string, string> = {};
      for (const defs of Object.values(FIELD_DEFS)) {
        for (const def of defs) {
          initial[def.key] = toFormValue(def.key, serverSettings[def.key]);
        }
      }
      setForm(initial);
    }
  }, [serverSettings]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const payload: Record<string, any> = {};
      for (const defs of Object.values(FIELD_DEFS)) {
        for (const def of defs) {
          let val: any = form[def.key] ?? "";
          if (def.key === "reminder_offset_days") {
            val = val
              .split(",")
              .map((s: string) => Number(s.trim()))
              .filter((n: number) => !isNaN(n));
          } else if (
            [
              "suspend_on_overdue",
              "brand_white_label",
              "security_2fa_enforced",
              "ai_gemini_enabled",
              "ai_auto_lead_scoring",
              "ai_auto_task_suggestions",
              "notif_email_enabled",
              "notif_sms_enabled",
              "notif_in_app_enabled",
            ].includes(def.key)
          ) {
            val = val === "true" || val === "1";
          } else if (def.type === "number") {
            val = Number(val) || 0;
          }
          payload[def.key] = val;
        }
      }
      await updateSettings(payload).unwrap();
      toast.success("تم حفظ الإعدادات بنجاح");
      setIsDirty(false);
    } catch {
      toast.error("فشل حفظ الإعدادات");
    }
  };

  const handleReset = () => {
    if (!serverSettings) return;
    const initial: Record<string, string> = {};
    for (const defs of Object.values(FIELD_DEFS)) {
      for (const def of defs) {
        initial[def.key] = toFormValue(def.key, serverSettings[def.key]);
      }
    }
    setForm(initial);
    setIsDirty(false);
  };

  const renderFields = (tab: string) => {
    const defs = FIELD_DEFS[tab] ?? [];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {defs.map((def) => (
          <div key={def.key} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-natural-100">
              {def.label}
            </label>
            {def.type === "select" ? (
              <select
                value={form[def.key] ?? ""}
                onChange={(e) => handleChange(def.key, e.target.value)}
                className="w-full rounded-xl border border-portal-divider px-4 py-2.5 text-sm bg-white"
              >
                <option value="">اختر...</option>
                <option value="true">نعم</option>
                <option value="false">لا</option>
              </select>
            ) : (
              <FormInputControl
                type={def.type}
                value={form[def.key] ?? ""}
                onChange={(e) => handleChange(def.key, e.target.value)}
                placeholder={def.placeholder}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إعدادات المنصة"
        description="تكوين جميع إعدادات المنصة"
        icon={Settings}
        actions={
          isDirty ? (
            <div className="flex gap-2">
              <ActionButton
                variant="outline"
                size="md"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="size-4 ml-1" />
                استعادة
              </ActionButton>
              <ActionButton size="md" onClick={handleSave} disabled={isSaving}>
                <Save className="size-4 ml-1" />
                {isSaving ? "جارٍ الحفظ..." : "حفظ"}
              </ActionButton>
            </div>
          ) : undefined
        }
      />

      <SurfaceCard>
        {isLoading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="w-full justify-start gap-1 px-4 pt-4 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="whitespace-nowrap"
                  >
                    <Icon className="size-4 ml-1" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <div className="p-6">
              {TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  {renderFields(tab.value)}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}
      </SurfaceCard>
    </div>
  );
}
