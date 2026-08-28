"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, CircleDollarSign, RefreshCw, Search, Users } from "lucide-react";
import { CLIENT_STATUS_AR, ClientStatus, BUSINESS_TYPE_AR } from "@hassad/shared";
import { useGetAdminClientStatsQuery, useGetAdminClientsQuery } from "@/features/admin/adminClientsApi";
import { adminErrorMessage } from "@/lib/i18n";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { CreateClientDialog } from "./create-client-dialog";

type ClientFilter = "all" | "active" | "stopped" | "lead";

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusVariant(status: string) {
  return status === ClientStatus.ACTIVE ? "secondary" : status === ClientStatus.SUSPENDED ? "destructive" : "outline";
}

function statusLabel(status: string) {
  return CLIENT_STATUS_AR[status as ClientStatus] ?? status;
}

function LoadingState() {
  return <div className="flex flex-col gap-6" dir="rtl"><PageHeader title="العملاء" description="جارٍ تحميل بيانات العملاء." icon={Users} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Card key={index}><CardContent className="flex flex-col gap-3 p-6"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /></CardContent></Card>)}</div><Card><CardContent className="flex flex-col gap-4 p-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></CardContent></Card></div>;
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const limit = 20;
  const queryStatus = filter === "all" ? undefined : filter;
  const query = useGetAdminClientsQuery({ search: search.trim() || undefined, status: queryStatus, page, limit });
  const statsQuery = useGetAdminClientStatsQuery();


  if (query.isLoading || statsQuery.isLoading) return <LoadingState />;
  if (query.isError || statsQuery.isError) {
    return <div className="flex flex-col gap-6" dir="rtl"><PageHeader title="العملاء" description="تعذر تحميل قائمة العملاء." icon={Users} /><Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><Users /></EmptyMedia><EmptyHeader><EmptyTitle>تعذر تحميل العملاء</EmptyTitle><EmptyDescription>{adminErrorMessage(query.error ?? statsQuery.error)}</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => { query.refetch(); statsQuery.refetch(); }}>إعادة المحاولة</Button></EmptyContent></Empty></CardContent></Card></div>;
  }

  const clients = query.data?.items ?? [];
  const stats = statsQuery.data;
  const totalPages = query.data?.totalPages ?? 1;

  return <div className="flex flex-col gap-6" dir="rtl">
    <PageHeader title="العملاء" description="إدارة حسابات العملاء ومتابعة نشاطهم المالي والتشغيلي." icon={Building2} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { query.refetch(); statsQuery.refetch(); }}><RefreshCw data-icon="inline-start" />{query.isFetching ? "جاري التحديث" : "تحديث"}</Button><Button onClick={() => setCreateOpen(true)}>إضافة عميل</Button></div>} />

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="إجمالي العملاء" value={stats?.total ?? 0} hint="كل حسابات العملاء" icon={Users} />
      <MetricCard label="العملاء النشطون" value={stats?.active ?? 0} hint="حسابات قيد التشغيل" icon={CircleDollarSign} />
      <MetricCard label="العملاء المحتملون" value={stats?.lead ?? 0} hint="فرص قيد المتابعة" icon={Building2} />
      <MetricCard label="إجمالي المدفوعات" value={formatCurrency(stats?.totalRevenue ?? 0)} hint="المبالغ المحصلة" icon={CircleDollarSign} />
    </div>

    <div className="flex flex-col gap-4">
        <div className="grid max-w-3xl gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input id="admin-client-search" aria-label="البحث عن عميل" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="ابحث باسم العميل أو الشركة أو المدير" className="pr-10" /></div><Select value={filter} onValueChange={(value) => { setFilter(value as ClientFilter); setPage(1); }}><SelectTrigger id="admin-client-status" aria-label="تصفية حسب الحالة"><SelectValue placeholder="كل الحالات" /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem><SelectItem value="active">{statusLabel(ClientStatus.ACTIVE)}</SelectItem><SelectItem value="stopped">{statusLabel(ClientStatus.SUSPENDED)}</SelectItem><SelectItem value="lead">عميل محتمل</SelectItem></SelectContent></Select></div>
        {clients.length === 0 ? <div className="rounded-lg border p-8"><Empty><EmptyMedia variant="icon"><Users /></EmptyMedia><EmptyHeader><EmptyTitle>لا توجد نتائج</EmptyTitle><EmptyDescription>لم نعثر على عملاء يطابقون البحث أو الفلتر الحالي.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => { setSearch(""); setFilter("all"); }}>مسح الفلاتر</Button></EmptyContent></Empty></div> : <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>النشاط</TableHead><TableHead>الحالة</TableHead><TableHead>المدير</TableHead><TableHead>آخر نشاط</TableHead><TableHead>المشاريع</TableHead><TableHead>المدفوع</TableHead><TableHead>البوابة</TableHead><TableHead className="text-left">التفاصيل</TableHead></TableRow></TableHeader><TableBody>{clients.map((client) => <TableRow key={client.id}><TableCell><div className="flex items-center gap-3"><Avatar className="size-9"><AvatarFallback>{getInitials(client.name)}</AvatarFallback></Avatar><div className="flex min-w-0 flex-col gap-1"><Link href={`/dashboard/admin/clients/${client.id}`} className="font-medium hover:text-primary">{client.name}</Link><span className="text-xs text-muted-foreground">{client.companyName} · {client.email ?? "لا يوجد بريد"}</span></div></div></TableCell><TableCell>{BUSINESS_TYPE_AR[client.businessType as keyof typeof BUSINESS_TYPE_AR] ?? client.businessType}</TableCell><TableCell><Badge variant={statusVariant(client.status)}>{statusLabel(client.status)}</Badge></TableCell><TableCell>{client.manager?.name ?? "غير محدد"}</TableCell><TableCell>{client.lastActiveAt ? formatDateTime(client.lastActiveAt) : "لم يسجل الدخول"}</TableCell><TableCell><div className="flex flex-col gap-1"><span>{formatNumber(client.projectsCount)}</span><span className="text-xs text-muted-foreground">{formatNumber(client.activeProjects)} نشط</span></div></TableCell><TableCell>{formatCurrency(client.totalRevenue)}</TableCell><TableCell><Badge variant={client.portalAccess ? "secondary" : "outline"}>{client.portalAccess ? "مفعلة" : "غير مفعلة"}</Badge></TableCell><TableCell className="text-left"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/admin/clients/${client.id}`}><ArrowUpRight data-icon="inline-start" />فتح</Link></Button></TableCell></TableRow>)}</TableBody></Table></div>}
      {totalPages > 1 ? <Pagination><PaginationContent><PaginationItem><PaginationPrevious direction="rtl" text="السابق" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} /></PaginationItem><PaginationItem><span className="px-3 text-sm text-muted-foreground">صفحة {page} من {totalPages}</span></PaginationItem><PaginationItem><PaginationNext direction="rtl" text="التالي" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} /></PaginationItem></PaginationContent></Pagination> : null}
    </div>
    <CreateClientDialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { query.refetch(); statsQuery.refetch(); } }} />
  </div>;
}

function MetricCard({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint: string; icon: typeof Users }) {
  return <Card><CardContent className="flex items-start justify-between gap-4 p-6"><div className="flex flex-col gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="text-2xl font-semibold tracking-tight">{value}</span><span className="text-sm text-muted-foreground">{hint}</span></div><div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon /></div></CardContent></Card>;
}
