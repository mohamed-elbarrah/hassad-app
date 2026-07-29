"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Phone, Users } from "lucide-react";
import { useGetAdminRequestByIdQuery } from "@/features/admin/adminRequestsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BUSINESS_TYPE_AR, CLIENT_SOURCE_AR, REQUEST_STATUS_AR } from "@hassad/shared";
import { formatDateTime, formatNumber } from "@/lib/format";

function LoadingState() {
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
          <CardContent className="flex gap-4 p-6">
            <Skeleton className="size-20 rounded-lg" />
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
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
    </div>
  );
}

function field(label: string, value?: string | number | null) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: request, isLoading, isError } = useGetAdminRequestByIdQuery(id);

  if (isLoading) return <LoadingState />;

  if (isError || !request) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>الطلب غير موجود</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذا الطلب.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/requests">
                    <ArrowLeft />
                    العودة إلى الطلبات
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                    <Link href="/dashboard/admin/requests">الطلبات</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{request.companyName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">تفاصيل الطلب</CardTitle>
                <CardDescription>
                  ملخص الطلب والخدمات المرتبطة والروابط التشغيلية.
                </CardDescription>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/requests">
                <ArrowLeft />
                العودة
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/admin/clients/${request.clientId}`}>
                <Users />
                العميل
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
            <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ClipboardList className="size-10" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {request.companyName}
                </h2>
                <Badge variant="outline">{REQUEST_STATUS_AR[request.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {request.contactName} — {request.businessName}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{BUSINESS_TYPE_AR[request.businessType]}</Badge>
                <Badge variant="outline">{CLIENT_SOURCE_AR[request.source]}</Badge>
                <Badge variant="outline">الخدمات {formatNumber(request.services.length)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "الخدمات", value: formatNumber(request.services.length), icon: ClipboardList },
            { label: "المقترحات", value: formatNumber(request.statusHistory.length), icon: Phone },
            { label: "العقود", value: formatNumber(request.statusHistory.length), icon: Phone },
            { label: "آخر تحديث", value: formatDateTime(request.updatedAt), icon: Phone },
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
            <CardTitle>بيانات العميل والاتصال</CardTitle>
            <CardDescription>البيانات الأساسية المرتبطة بالطلب.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field("الشركة", request.companyName)}
            {field("اسم النشاط", request.businessName)}
            {field("اسم جهة الاتصال", request.contactName)}
            {field("الهاتف", request.phoneWhatsapp)}
            {field("البريد", request.email || "—")}
            {field("المعرف", request.id)}
            {field("الحالة", REQUEST_STATUS_AR[request.status])}
            {field("الإنشاء", formatDateTime(request.createdAt))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>الربط التشغيلي</CardTitle>
            <CardDescription>العميل والمكلّف والروابط الحالية.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field("العميل", request.client?.companyName || "—")}
            {field("المكلّف", request.assignee?.name || "—")}
            {field("ملاحظات", request.notes || "—")}
            {field("آخر تحديث", formatDateTime(request.updatedAt))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>الخدمات المطلوبة</CardTitle>
          <CardDescription>تفاصيل الخدمات والوحدات المرتبطة بالطلب.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الخدمة</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    لا توجد خدمات
                  </TableCell>
                </TableRow>
              ) : (
                request.services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      {service.serviceId}
                    </TableCell>
                    <TableCell>{formatNumber(service.quantity)}</TableCell>
                    <TableCell>{service.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>تاريخ الحالة</CardTitle>
          <CardDescription>كل انتقالات الطلب.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>من</TableHead>
                <TableHead>إلى</TableHead>
                <TableHead>بواسطة</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.statusHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا يوجد سجل
                  </TableCell>
                </TableRow>
              ) : (
                request.statusHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fromStatus || "—"}</TableCell>
                    <TableCell>{item.toStatus}</TableCell>
                    <TableCell>{item.changer?.name || item.changedBy || "—"}</TableCell>
                    <TableCell>{formatDateTime(item.changedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
