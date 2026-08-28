"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleDollarSign, FileClock, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { ContractStatus } from "@hassad/shared";
import { useGetAdminContractsQuery, type AdminContractItem } from "@/features/admin/adminContractsApi";
import { adminErrorMessage, contractStatusLabel, contractTypeLabel } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

function statusVariant(status: string) {
  return [ContractStatus.ACTIVE, ContractStatus.SIGNED, ContractStatus.COMPLETED].includes(status as ContractStatus) ? "secondary" : [ContractStatus.CANCELLED, ContractStatus.EXPIRED].includes(status as ContractStatus) ? "destructive" : "outline";
}

function LoadingState() {
  return <div className="flex flex-col gap-6" dir="rtl"><PageHeader title="العقود" description="جارٍ تحميل بيانات العقود." icon={FileClock} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="flex flex-col gap-3 p-6"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></CardContent></Card>)}</div><Card><CardContent className="flex flex-col gap-4 p-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></CardContent></Card></div>;
}

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [expiringDays, setExpiringDays] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;
  const query = useGetAdminContractsQuery({ search: search.trim() || undefined, status: status === "ALL" ? undefined : status, expiringDays: expiringDays === "ALL" ? undefined : Number(expiringDays), page, limit });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <div className="flex flex-col gap-6" dir="rtl"><PageHeader title="العقود" description="تعذر تحميل قائمة العقود." icon={FileClock} /><Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><FileClock /></EmptyMedia><EmptyHeader><EmptyTitle>تعذر تحميل العقود</EmptyTitle><EmptyDescription>{adminErrorMessage(query.error)}</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => query.refetch()}>إعادة المحاولة</Button></EmptyContent></Empty></CardContent></Card></div>;

  const data = query.data;
  const contracts = data?.items ?? [];
  const stats = data?.stats;
  const totalPages = data?.totalPages ?? 1;
  return <div className="flex flex-col gap-6" dir="rtl">
    <PageHeader title="العقود" description="متابعة التشغيل المالي والتجديدات والتوقيع الإلكتروني." icon={FileClock} actions={<Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw data-icon="inline-start" />{query.isFetching ? "جاري التحديث" : "تحديث"}</Button>} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="إجمالي العقود" value={data?.total ?? 0} hint="كل العقود المسجلة" icon={FileClock} />
      <Metric label="النشطة" value={stats?.active ?? 0} hint="عقود قيد التشغيل" icon={ShieldCheck} />
      <Metric label="الموقعة إلكترونياً" value={stats?.eSigned ?? 0} hint="عقود مكتملة التوقيع" icon={CalendarDays} />
      <Metric label="إجمالي القيمة" value={formatCurrency(stats?.totalValue ?? 0)} hint="القيمة التراكمية" icon={CircleDollarSign} />
    </div>
    <Card><CardContent className="flex flex-col gap-4 p-6">
      <div className="grid max-w-4xl gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]"><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input id="admin-contract-search" aria-label="البحث عن عقد" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ابحث بعنوان العقد أو العميل" className="pr-10" /></div><Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger id="admin-contract-status-filter" aria-label="تصفية حسب الحالة"><SelectValue placeholder="كل الحالات" /></SelectTrigger><SelectContent><SelectItem value="ALL">كل الحالات</SelectItem>{Object.values(ContractStatus).map((value) => <SelectItem key={value} value={value}>{contractStatusLabel(value)}</SelectItem>)}</SelectContent></Select><Select value={expiringDays} onValueChange={(v) => { setExpiringDays(v); setPage(1); }}><SelectTrigger id="admin-contract-expiring-filter" aria-label="تصفية حسب التجديد"><SelectValue placeholder="كل المدد" /></SelectTrigger><SelectContent><SelectItem value="ALL">كل المدد</SelectItem><SelectItem value="30">خلال 30 يوم</SelectItem><SelectItem value="60">خلال 60 يوم</SelectItem><SelectItem value="90">خلال 90 يوم</SelectItem></SelectContent></Select></div>
      {contracts.length === 0 ? <Empty className="border p-8"><EmptyMedia variant="icon"><FileClock /></EmptyMedia><EmptyHeader><EmptyTitle>لا توجد نتائج</EmptyTitle><EmptyDescription>لم نعثر على عقود تطابق الفلاتر الحالية.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => { setSearch(""); setStatus("ALL"); setExpiringDays("ALL"); setPage(1); }}>مسح الفلاتر</Button></EmptyContent></Empty> : <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>العقد</TableHead><TableHead>العميل</TableHead><TableHead>الحالة</TableHead><TableHead>النوع</TableHead><TableHead>الإجمالي</TableHead><TableHead>الفواتير</TableHead><TableHead className="text-left">التفاصيل</TableHead></TableRow></TableHeader><TableBody>{contracts.map((contract: AdminContractItem) => <TableRow key={contract.id}><TableCell><Link href={`/dashboard/admin/contracts/${contract.id}`} className="font-medium hover:text-primary">{contract.title}</Link><div className="text-xs text-muted-foreground">{contract.id}</div></TableCell><TableCell>{contract.clientName}</TableCell><TableCell><Badge variant={statusVariant(contract.status)}>{contractStatusLabel(contract.status)}</Badge></TableCell><TableCell>{contractTypeLabel(contract.type)}</TableCell><TableCell>{formatCurrency(contract.totalValue, contract.currency)}</TableCell><TableCell>{formatNumber(contract.invoiceCount)}</TableCell><TableCell className="text-left"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/admin/contracts/${contract.id}`}><ArrowUpRight data-icon="inline-start" />فتح</Link></Button></TableCell></TableRow>)}</TableBody></Table></div>}
      {totalPages > 1 ? <Pagination aria-label="ترقيم صفحات العقود"><PaginationContent><PaginationItem><PaginationPrevious direction="rtl" text="السابق" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} /></PaginationItem><PaginationItem><span className="px-3 text-sm text-muted-foreground">صفحة {page} من {totalPages}</span></PaginationItem><PaginationItem><PaginationNext direction="rtl" text="التالي" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} /></PaginationItem></PaginationContent></Pagination> : null}
    </CardContent></Card>
  </div>;
}

function Metric({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint: string; icon: typeof FileClock }) { return <Card><CardContent className="flex items-start justify-between gap-4 p-6"><div className="flex flex-col gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="text-2xl font-semibold tracking-tight">{typeof value === "number" ? formatNumber(value) : value}</span><span className="text-sm text-muted-foreground">{hint}</span></div><Icon className="size-10 rounded-lg bg-muted p-2 text-muted-foreground" /></CardContent></Card>; }
