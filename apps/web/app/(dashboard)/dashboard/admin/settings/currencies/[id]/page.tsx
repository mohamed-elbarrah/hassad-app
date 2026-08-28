"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import CurrencyForm from "@/components/dashboard/admin/settings/CurrencyForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminEmptyState, AdminPageError, AdminPageLoading } from "@/components/dashboard/admin/shared";
import { useGetCurrencySettingQuery } from "@/features/settings/settingsApi";

export default function SettingsCurrencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: currency, isLoading, isError, refetch } = useGetCurrencySettingQuery(id);

  if (isLoading) return <div dir="rtl"><AdminPageLoading /></div>;

  if (isError || !currency) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <PageHeader title="إعدادات العملة" icon={Coins} />
        {isError ? <AdminPageError title="تعذر تحميل العملة" description="حدث خطأ أثناء جلب بيانات العملة. حاول مرة أخرى." onRetry={() => void refetch()} /> : <Card><CardContent className="p-8"><AdminEmptyState icon={Coins} title="العملة غير موجودة" description="لم نتمكن من العثور على هذه العملة." actionLabel="العودة إلى العملات" actionHref="/dashboard/admin/settings/currencies" /></CardContent></Card>}
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title={`تعديل ${currency.name}`}
        description={`إدارة إعدادات العملة ${currency.code}.`}
        icon={Coins}
        badges={<><Badge variant={currency.isActive ? "outline" : "warning"}>{currency.isActive ? "نشطة" : "غير نشطة"}</Badge>{currency.isDefault ? <Badge variant="secondary">العملة الافتراضية</Badge> : null}</>}
        actions={<Button asChild variant="outline"><Link href="/dashboard/admin/settings/currencies"><ArrowRight data-icon="inline-start" />العودة إلى العملات</Link></Button>}
      />
      <CurrencyForm mode="edit" initialData={currency} />
    </div>
  );
}
