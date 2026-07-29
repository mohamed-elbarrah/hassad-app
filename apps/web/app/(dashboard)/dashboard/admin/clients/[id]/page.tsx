"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileClock,
  FolderKanban,
  Globe,
  History,
  Inbox,
  Layers3,
  MessageSquare,
  PencilLine,
  Phone,
  Shield,
  Users,
} from "lucide-react";
import type { Client, ClientHistoryLogItem } from "@hassad/shared";
import { BUSINESS_TYPE_AR, CLIENT_STATUS_AR, ClientStatus } from "@hassad/shared";
import { useGetClientByIdQuery } from "@/features/clients/clientsApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime, formatPortalDate, formatNumber } from "@/lib/format";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusVariant(status: ClientStatus) {
  switch (status) {
    case ClientStatus.ACTIVE:
      return "secondary";
    case ClientStatus.STOPPED:
      return "destructive";
    default:
      return "outline";
  }
}

function ClientDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-60" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-40" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="size-10 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-lg" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 4 }).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, row) => (
                <TableRow key={row}>
                  {Array.from({ length: 4 }).map((_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function renderProfileField(label: string, value?: string | number | null) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function formatHistoryLabel(item: ClientHistoryLogItem) {
  return item.eventType.replaceAll("_", " ");
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: client, isLoading, isError } = useGetClientByIdQuery(id);

  const history = useMemo(() => {
    return [...(client?.historyLogs || [])].sort((a, b) => {
      const aDate = new Date(a.occurredAt).getTime();
      const bDate = new Date(b.occurredAt).getTime();
      return bDate - aDate;
    });
  }, [client]);

  if (isLoading) {
    return <ClientDetailLoading />;
  }

  if (isError || !client) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>العميل غير موجود</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذا العميل.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/clients">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى القائمة
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = client.profile;

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">الرئيسية</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard/admin/clients">العملاء</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{client.companyName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">تفاصيل العميل</CardTitle>
                <CardDescription>
                  ملخص إداري ومالي سريع للحساب، مع بيانات التواصل والسجل.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/clients">
                <ArrowLeft data-icon="inline-start" />
                العودة
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/dashboard/admin/clients/${client.id}`}>
                <BadgeCheck data-icon="inline-start" />
                تحديث العرض
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
            <Avatar className="size-20">
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(client.companyName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">{client.companyName}</h2>
                <Badge variant={statusVariant(client.status)}>{CLIENT_STATUS_AR[client.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{client.businessName}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{BUSINESS_TYPE_AR[client.businessType]}</Badge>
                <Badge variant="outline">
                  <Users data-icon="inline-start" />
                  {client.totalProjects || 0} مشاريع
                </Badge>
                <Badge variant="outline">
                  <CircleDollarSign data-icon="inline-start" />
                  {formatCurrency(client.totalPaid || 0)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              label: "إجمالي المشاريع",
              value: formatNumber(client.totalProjects || 0),
              icon: FolderKanban,
            },
            {
              label: "المشاريع النشطة",
              value: formatNumber(client.activeProjects || 0),
              icon: Layers3,
            },
            {
              label: "إجمالي العقود",
              value: formatCurrency(client.totalContractValue || 0),
              icon: FileClock,
            },
            {
              label: "إجمالي المدفوع",
              value: formatCurrency(client.totalPaid || 0),
              icon: CircleDollarSign,
            },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-lg font-semibold">{item.value}</span>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <item.icon />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>البيانات الأساسية</CardTitle>
            <CardDescription>
              معلومات الحساب، الاتصال، والمرجع الداخلي.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {renderProfileField("اسم الشركة", client.companyName)}
            {renderProfileField("اسم النشاط", client.businessName)}
            {renderProfileField("نوع النشاط", BUSINESS_TYPE_AR[client.businessType])}
            {renderProfileField("مدير الحساب", client.manager?.name || "غير محدد")}
            {renderProfileField("المعرف الداخلي", client.id)}
            {renderProfileField("تاريخ الإنشاء", formatPortalDate(client.createdAt) || "—")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>التواصل والربط</CardTitle>
            <CardDescription>
              بيانات المستخدم المرتبط وقنوات التواصل الأساسية.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users />
                <span>المستخدم المرتبط</span>
              </div>
              <p className="mt-2 text-sm font-medium">
                {client.user ? client.user.name : "لا يوجد حساب مرتبط"}
              </p>
              {client.user?.email ? (
                <p className="mt-1 text-sm text-muted-foreground">{client.user.email}</p>
              ) : null}
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone />
                <span>هاتف/واتساب</span>
              </div>
              <p className="mt-2 text-sm font-medium">
                {client.user?.phoneWhatsapp || profile?.decisionMakerPhone || "—"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe />
                <span>الموقع</span>
              </div>
              <p className="mt-2 text-sm font-medium">{profile?.website || "—"}</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare />
                <span>اللغة المفضلة</span>
              </div>
              <p className="mt-2 text-sm font-medium">{profile?.preferredLanguage || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>ملف العميل</CardTitle>
            <CardDescription>
              الحقول المهمة من الملف التشغيلي والتسويقي.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {renderProfileField("جهة القرار", profile?.decisionMakerName)}
            {renderProfileField("البريد", profile?.communicationInfo?.email)}
            {renderProfileField("القطاع", profile?.industry)}
            {renderProfileField("الميزانية", profile?.budgetRangeMin || profile?.budgetRangeMax ? `${formatCurrency(profile?.budgetRangeMin || 0)} - ${formatCurrency(profile?.budgetRangeMax || 0)}` : "—")}
            {renderProfileField("المنصات المفضلة", profile?.preferredPlatforms)}
            {renderProfileField("ساعات العمل", profile?.workingHours)}
            {renderProfileField("المنطقة الزمنية", profile?.timezone)}
            {renderProfileField("تفضيل التواصل", profile?.communicationPreference)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>
              انتقال مباشر إلى الصفحات المرتبطة بهذا العميل.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { href: `/dashboard/admin/clients/${client.id}/projects`, label: "المشاريع", icon: FolderKanban },
              { href: `/dashboard/admin/clients/${client.id}/contracts`, label: "العقود", icon: FileClock },
              { href: `/dashboard/admin/clients/${client.id}/invoices`, label: "الفواتير", icon: Inbox },
              { href: `/dashboard/admin/clients/${client.id}/history`, label: "السجل", icon: History },
            ].map((item) => (
              <Button key={item.href} variant="outline" className="justify-between" asChild>
                <Link href={item.href}>
                  <span className="flex items-center gap-2">
                    <item.icon className="size-4" />
                    {item.label}
                  </span>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>سجل النشاط</CardTitle>
          <CardDescription>
            أحدث الأحداث المرتبطة بهذا العميل.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="rounded-lg border p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <History />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>لا يوجد سجل نشاط</EmptyTitle>
                  <EmptyDescription>
                    لم يتم تسجيل أي أحداث لهذا العميل بعد.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحدث</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>بواسطة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{formatHistoryLabel(item)}</Badge>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.user?.name || "—"}</TableCell>
                      <TableCell>{formatDateTime(item.occurredAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
