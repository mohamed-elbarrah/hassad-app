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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save, RotateCcw, Wrench, DollarSign, CreditCard, Shield } from "lucide-react";
import Link from "next/link";

const FIELD_DEFS = [
  { key: "companyName", label: "اسم الشركة (عربي)", type: "text", placeholder: "حصاد" },
  { key: "companyNameEn", label: "اسم الشركة (إنجليزي)", type: "text", placeholder: "Hassad" },
  { key: "supportEmail", label: "البريد الإلكتروني للدعم", type: "email", placeholder: "support@hassad.sa" },
  { key: "supportPhone", label: "رقم هاتف الدعم", type: "text", placeholder: "+966500000000" },
  { key: "defaultCurrency", label: "العملة الافتراضية", type: "text", placeholder: "SAR" },
  { key: "timezone", label: "المنطقة الزمنية", type: "text", placeholder: "Asia/Riyadh" },
  { key: "dateFormat", label: "صيغة التاريخ", type: "text", placeholder: "DD/MM/YYYY" },
  { key: "language", label: "اللغة الافتراضية", type: "text", placeholder: "ar" },
  { key: "invoicePrefix", label: "بادئة رقم الفاتورة", type: "text", placeholder: "INV" },
  { key: "lowBalanceAlert", label: "حد التنبيه المالي (ريال)", type: "number", placeholder: "5000" },
  { key: "autoArchiveDays", label: "أرشفة تلقائية بعد (يوم)", type: "number", placeholder: "90" },
  // ── Billing settings (Phase 3/4) ──
  { key: "down_payment_grace_days", label: "مهلة الدفعة المقدمة (يوم)", type: "number", placeholder: "7" },
  { key: "reminder_offset_days", label: "أيام التذكير (مفصولة بفاصلة)", type: "text", placeholder: "5,3,0" },
  { key: "suspend_on_overdue", label: "تعليق عند التأخر (true/false)", type: "text", placeholder: "true" },
];

const QUICK_LINKS = [
  { title: "الخدمات", desc: "كتالوج الخدمات", href: "/dashboard/admin/services", icon: Wrench },
  { title: "العملات", desc: "إدارة العملات", href: "/dashboard/admin/currency", icon: DollarSign },
  { title: "بوابات الدفع", desc: "Stripe وتحويل بنكي", href: "/dashboard/admin/payments", icon: CreditCard },
  { title: "الأدوار والصلاحيات", desc: "إدارة الوصول", href: "/dashboard/admin/roles", icon: Shield },
];

export default function AdminSettingsPage() {
  const { data: serverSettings, isLoading } = useGetAdminSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateAdminSettingsMutation();

  const [form, setForm] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const toFormValue = (key: string, val: any): string => {
    if (key === "reminder_offset_days" && Array.isArray(val)) return val.join(",");
    if (typeof val === "boolean") return val ? "true" : "false";
    return String(val ?? "");
  };

  useEffect(() => {
    if (serverSettings && Object.keys(form).length === 0) {
      const initial: Record<string, string> = {};
      for (const def of FIELD_DEFS) {
        initial[def.key] = toFormValue(def.key, serverSettings[def.key]);
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
      for (const def of FIELD_DEFS) {
        let val: any = form[def.key] ?? "";
        if (def.key === "reminder_offset_days") {
          val = val.split(",").map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n));
        } else if (def.key === "suspend_on_overdue") {
          val = val === "true" || val === "1";
        } else if (def.type === "number") {
          val = Number(val) || 0;
        }
        payload[def.key] = val;
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
    for (const def of FIELD_DEFS) {
      initial[def.key] = toFormValue(def.key, serverSettings[def.key]);
    }
    setForm(initial);
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إعدادات المنصة"
        description="تكوين الإعدادات الأساسية للمنصة"
        icon={Settings}
        actions={
          isDirty ? (
            <div className="flex gap-2">
              <ActionButton variant="outline" size="md" onClick={handleReset} disabled={isSaving}>
                <RotateCcw className="size-4 mr-1" />
                استعادة
              </ActionButton>
              <ActionButton size="md" onClick={handleSave} disabled={isSaving}>
                <Save className="size-4 mr-1" />
                {isSaving ? "جارٍ الحفظ..." : "حفظ"}
              </ActionButton>
            </div>
          ) : undefined
        }
      />

      <SurfaceCard>
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FIELD_DEFS.map((def) => (
              <div key={def.key} className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-natural-100">{def.label}</Label>
                <FormInputControl
                  type={def.type}
                  value={form[def.key] ?? ""}
                  onChange={(e) => handleChange(def.key, e.target.value)}
                  placeholder={def.placeholder}
                />
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      {/* Quick links to other settings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <SurfaceCard className="hover:bg-badge-gray-bg transition-colors cursor-pointer text-center py-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-badge-gray-bg">
                    <Icon className="h-6 w-6 text-secondary-500" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-natural-100">{link.title}</p>
                    <p className="text-sm text-portal-note-text mt-0.5">{link.desc}</p>
                  </div>
                </div>
              </SurfaceCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
