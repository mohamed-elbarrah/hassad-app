"use client";

import { DollarSign } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import CurrencyForm from "@/components/dashboard/admin/settings/CurrencyForm";

export default function AdminNewCurrencyPage() {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="إضافة عملة جديدة"
        description="أضف عملة جديدة لاستخدامها في النظام مع إمكانية رفع رمز SVG"
        icon={DollarSign}
      />
      <CurrencyForm mode="create" />
    </div>
  );
}
