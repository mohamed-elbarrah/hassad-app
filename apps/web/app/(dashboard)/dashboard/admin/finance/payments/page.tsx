"use client";

import { Banknote } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";

export default function AdminFinancePaymentsPage() {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="المدفوعات"
        description="إدارة المدفوعات والمعاملات المالية"
        icon={Banknote}
      />
      <SurfaceCard>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Banknote className="h-12 w-12 text-portal-note-text mb-4" />
          <p className="text-lg font-medium text-natural-100">قريباً</p>
          <p className="text-sm text-portal-note-text mt-1">
            صفحة إدارة المدفوعات قيد التطوير وستتوفر قريباً.
          </p>
        </div>
      </SurfaceCard>
    </div>
  );
}
