"use client";

import { useState } from "react";
import { Flag, ToggleLeft, ToggleRight } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { ActionButton } from "@/components/design-system/ActionButton";
import { toast } from "sonner";

const MOCK_FLAGS = [
  {
    key: "admin_dashboard_v2",
    label: "لوحة الإدارة الجديدة",
    description: "تفعيل لوحة الإدارة المحدثة",
    enabled: true,
  },
  {
    key: "ai_module",
    label: "الذكاء الاصطناعي",
    description: "تفعيل وحدة الذكاء الاصطناعي",
    enabled: true,
  },
  {
    key: "client_portal",
    label: "بوابة العميل",
    description: "تفعيل بوابة العملاء",
    enabled: true,
  },
  {
    key: "automation_rules",
    label: "قواعد الأتمتة",
    description: "تفعيل قواعد أتمتة العملاء المحتملين",
    enabled: true,
  },
  {
    key: "public_registration",
    label: "التسجيل العام",
    description: "السماح بتسجيل حسابات جديدة للعملاء",
    enabled: false,
  },
];

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState(MOCK_FLAGS);

  const toggle = (key: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)),
    );
    toast.success("تم تحديث الخاصية");
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="خصائص المنصة"
        description="تفعيل أو تعطيل ميزات المنصة"
        icon={Flag}
      />

      <SurfaceCard>
        <div className="space-y-2">
          {flags.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between p-4 rounded-2xl border border-portal-divider hover:bg-badge-gray-bg/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-portal-note-text">{f.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <Pill tone={f.enabled ? "success" : "neutral"}>
                  {f.enabled ? "مفعل" : "معطل"}
                </Pill>
                <button
                  onClick={() => toggle(f.key)}
                  className="text-portal-icon hover:text-secondary-500 transition-colors"
                >
                  {f.enabled ? (
                    <ToggleRight className="size-6 text-secondary-500" />
                  ) : (
                    <ToggleLeft className="size-6" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
