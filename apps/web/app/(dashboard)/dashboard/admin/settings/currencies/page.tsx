"use client";

import Link from "next/link";
import { Coins, Eye, Pencil, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCurrencySettingsQuery, type CurrencySetting } from "@/features/settings/settingsApi";

function CurrencyListLoading() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader title="إعدادات العملات" description="إدارة العملات والعملة الافتراضية للنظام." icon={Coins} actions={<Skeleton className="h-10 w-32" />} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-lg" />)}
      </div>
    </div>
  );
}

function CurrencyCard({ currency }: { currency: CurrencySetting }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
            <SymbolRenderer currency={currency} width={28} height={24} />
          </div>
          <div>
            <CardTitle className="text-lg">{currency.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{currency.code}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {currency.isDefault ? <Badge variant="secondary">افتراضية</Badge> : null}
          <Badge variant={currency.isActive ? "outline" : "warning"}>{currency.isActive ? "نشطة" : "غير نشطة"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>الرمز:</span>
          <SymbolRenderer currency={currency} />
          <span>{currency.symbol}</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="icon" aria-label={`عرض ${currency.name}`}>
            <Link href={`/dashboard/admin/settings/currencies/${currency.id}`}><Eye data-icon="inline-start" /></Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/admin/settings/currencies/${currency.id}`}><Pencil data-icon="inline-start" />تعديل</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsCurrenciesPage() {
  const { data: currencies, isLoading, isFetching, isError, refetch } = useGetCurrencySettingsQuery();

  if (isLoading) return <CurrencyListLoading />;

  if (isError) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <PageHeader title="إعدادات العملات" icon={Coins} />
        <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><Coins /></EmptyMedia><EmptyHeader><EmptyTitle>تعذر تحميل العملات</EmptyTitle><EmptyDescription>حدث خطأ أثناء جلب إعدادات العملات. حاول مرة أخرى.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => refetch()}><RefreshCw data-icon="inline-start" />إعادة المحاولة</Button></EmptyContent></Empty></CardContent></Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader title="إعدادات العملات" description="إدارة العملات والعملة الافتراضية للنظام." icon={Coins} actions={<><Button asChild><Link href="/dashboard/admin/settings/currencies/new"><Plus data-icon="inline-start" />إضافة عملة</Link></Button><Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw data-icon="inline-start" />{isFetching ? "جارٍ التحديث" : "تحديث"}</Button></>} />
      {!currencies?.length ? (
        <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><Coins /></EmptyMedia><EmptyHeader><EmptyTitle>لا توجد عملات</EmptyTitle><EmptyDescription>أضف أول عملة لاستخدامها في النظام.</EmptyDescription></EmptyHeader><EmptyContent><Button asChild><Link href="/dashboard/admin/settings/currencies/new"><Plus data-icon="inline-start" />إضافة عملة</Link></Button></EmptyContent></Empty></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{currencies.map((currency) => <CurrencyCard key={currency.id} currency={currency} />)}</div>
      )}
    </div>
  );
}
