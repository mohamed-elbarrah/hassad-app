"use client";

import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import CurrencyForm from "@/components/dashboard/admin/settings/CurrencyForm";
import { Button } from "@/components/ui/button";

export default function SettingsCurrenciesNewPage() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="إضافة عملة جديدة"
        description="أدخل بيانات العملة وإعدادات عرضها في النظام."
        icon={Coins}
        actions={<Button asChild variant="outline"><Link href="/dashboard/admin/settings/currencies"><ArrowRight data-icon="inline-start" />العودة إلى العملات</Link></Button>}
      />
      <CurrencyForm mode="create" />
    </div>
  );
}
