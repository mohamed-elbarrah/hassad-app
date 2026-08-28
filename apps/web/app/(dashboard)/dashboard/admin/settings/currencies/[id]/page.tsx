"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight, Coins, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import CurrencyForm from "@/components/dashboard/admin/settings/CurrencyForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useGetCurrencySettingQuery } from "@/features/settings/settingsApi";

export default function SettingsCurrencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: currency, isLoading, isError, refetch } = useGetCurrencySettingQuery(id);

  if (isLoading) return <div dir="rtl" className="flex flex-col gap-6"><PageHeader title="إعدادات العملة" icon={Coins} /><Skeleton className="h-96 rounded-lg" /></div>;

  if (isError || !currency) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <PageHeader title="إعدادات العملة" icon={Coins} />
        <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><Coins /></EmptyMedia><EmptyHeader><EmptyTitle>{isError ? "تعذر تحميل العملة" : "العملة غير موجودة"}</EmptyTitle><EmptyDescription>{isError ? "حدث خطأ أثناء جلب بيانات العملة. حاول مرة أخرى." : "لم نتمكن من العثور على هذه العملة."}</EmptyDescription></EmptyHeader><EmptyContent><div className="flex flex-wrap justify-center gap-2">{isError ? <Button variant="outline" onClick={() => refetch()}><RefreshCw data-icon="inline-start" />إعادة المحاولة</Button> : null}<Button asChild><Link href="/dashboard/admin/settings/currencies"><ArrowRight data-icon="inline-start" />العودة إلى العملات</Link></Button></div></EmptyContent></Empty></CardContent></Card>
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
