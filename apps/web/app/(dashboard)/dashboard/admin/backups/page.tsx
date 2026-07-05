"use client";

import { useState } from "react";
import {
  Download,
  Database,
  Users,
  Building2,
  FileText,
  ScrollText,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { toast } from "sonner";

const EXPORT_TYPES = [
  {
    type: "users",
    label: "المستخدمين",
    description: "تصدير جميع المستخدمين",
    icon: Users,
  },
  {
    type: "clients",
    label: "العملاء",
    description: "تصدير جميع العملاء",
    icon: Building2,
  },
  {
    type: "invoices",
    label: "الفواتير",
    description: "تصدير جميع الفواتير",
    icon: FileText,
  },
  {
    type: "audit-log",
    label: "سجل النشاطات",
    description: "تصدير آخر 1000 سجل نشاط",
    icon: ScrollText,
  },
];

export default function AdminBackupsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    setLoading(type);
    try {
      const res = await fetch(`/v1/admin/exports/${type}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("فشل التصدير");
      const csv = await res.text();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`تم تصدير ${type}`);
    } catch {
      toast.error("فشل التصدير");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="النسخ الاحتياطي والتصدير"
        description="تصدير بيانات المنصة"
        icon={Database}
      />

      <SurfaceCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORT_TYPES.map((exp) => {
            const Icon = exp.icon;
            return (
              <div
                key={exp.type}
                className="flex items-center justify-between p-4 rounded-2xl border border-portal-divider"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-badge-gray-bg">
                    <Icon className="size-5 text-secondary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{exp.label}</p>
                    <p className="text-xs text-portal-note-text">
                      {exp.description}
                    </p>
                  </div>
                </div>
                <ActionButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(exp.type)}
                  disabled={loading === exp.type}
                >
                  <Download className="size-4 ml-1" />
                  {loading === exp.type ? "جارٍ..." : "تصدير CSV"}
                </ActionButton>
              </div>
            );
          })}
        </div>
      </SurfaceCard>
    </div>
  );
}
