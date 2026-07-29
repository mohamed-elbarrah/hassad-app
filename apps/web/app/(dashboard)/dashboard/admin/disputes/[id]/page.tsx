"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, ShieldAlert, Users } from "lucide-react";
import { useGetAdminDisputeByIdQuery } from "@/features/admin/adminDisputesApi";
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
import {
  DISPUTE_CATEGORY_AR,
  DISPUTE_PRIORITY_AR,
  DISPUTE_STATUS_AR,
} from "@hassad/shared";
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

export default function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dispute, isLoading, isError } = useGetAdminDisputeByIdQuery(id);

  if (isLoading) return <LoadingState />;

  if (isError || !dispute) {
    return (
      <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <ShieldAlert />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>النزاع غير موجود</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذا النزاع.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/disputes">
                    <ArrowLeft />
                    العودة إلى النزاعات
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
                    <Link href="/dashboard/admin/disputes">النزاعات</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{dispute.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldAlert />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">تفاصيل النزاع</CardTitle>
                <CardDescription>
                  سجل شامل للحل، الرسائل، والمرفقات.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/disputes">
                <ArrowLeft />
                العودة
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/admin/projects/${dispute.projectId}`}>
                <Users />
                المشروع
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start">
            <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShieldAlert className="size-10" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {dispute.title}
                </h2>
                <Badge variant="outline">
                  {DISPUTE_STATUS_AR[dispute.status as keyof typeof DISPUTE_STATUS_AR] ||
                    dispute.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                #{dispute.ticketNumber} — {dispute.project.name}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {DISPUTE_CATEGORY_AR[dispute.category as keyof typeof DISPUTE_CATEGORY_AR] ||
                    dispute.category}
                </Badge>
                <Badge variant="outline">
                  {DISPUTE_PRIORITY_AR[dispute.priority as keyof typeof DISPUTE_PRIORITY_AR] ||
                    dispute.priority}
                </Badge>
                <Badge variant="outline">
                  الرسائل {formatNumber(dispute._count.messages)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              label: "الحالة",
              value:
                DISPUTE_STATUS_AR[dispute.status as keyof typeof DISPUTE_STATUS_AR] ||
                dispute.status,
              icon: ShieldAlert,
            },
            {
              label: "التصنيف",
              value:
                DISPUTE_CATEGORY_AR[dispute.category as keyof typeof DISPUTE_CATEGORY_AR] ||
                dispute.category,
              icon: MessageSquare,
            },
            {
              label: "الأولوية",
              value:
                DISPUTE_PRIORITY_AR[dispute.priority as keyof typeof DISPUTE_PRIORITY_AR] ||
                dispute.priority,
              icon: MessageSquare,
            },
            { label: "المشروع", value: dispute.project.name, icon: Users },
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
            <CardDescription>المرجع الإداري للنزاع.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field("العميل", dispute.client.companyName)}
            {field("المشروع", dispute.project.name)}
            {field("مدير المشروع", dispute.pm.name)}
            {field("المراجع", dispute.reviewer?.name || "—")}
            {field("المحل", dispute.resolver?.name || "—")}
            {field("فتح النزاع", formatDateTime(dispute.openedAt))}
            {field("الموعد النهائي", formatDateTime(dispute.deadlineAt))}
            {field("النتيجة", dispute.resolution || "—")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>مؤشرات الحالة</CardTitle>
            <CardDescription>مراحل النزاع ومراجعة التقدم.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {field("أُعتمد", formatDateTime(dispute.approvedAt))}
            {field("صعّد", formatDateTime(dispute.escalatedAt))}
            {field("حل", formatDateTime(dispute.resolvedAt))}
            {field("أغلق", formatDateTime(dispute.closedAt))}
            {field("أُبلغ العميل", formatDateTime(dispute.clientNotifiedAt))}
            {field("رد العميل", formatDateTime(dispute.clientRespondedAt))}
            {field("تغيير PM", dispute.pmChanged ? "نعم" : "لا")}
            {field("PM جديد", dispute.newPmId || "—")}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>الرسائل</CardTitle>
            <CardDescription>الحوار الكامل بين الأطراف.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكاتب</TableHead>
                  <TableHead>الرسالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispute.messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      لا توجد رسائل
                    </TableCell>
                  </TableRow>
                ) : (
                  dispute.messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        {message.author.name}
                        {message.isInternal ? " (داخلي)" : ""}
                      </TableCell>
                      <TableCell>{message.content}</TableCell>
                      <TableCell>{formatDateTime(message.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>المرفقات</CardTitle>
            <CardDescription>الملفات المرفوعة مع النزاع.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الملف</TableHead>
                  <TableHead>الحجم</TableHead>
                  <TableHead>بواسطة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispute.attachments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      لا توجد مرفقات
                    </TableCell>
                  </TableRow>
                ) : (
                  dispute.attachments.map((attachment) => (
                    <TableRow key={attachment.id}>
                      <TableCell>{attachment.fileName}</TableCell>
                      <TableCell>{formatNumber(attachment.fileSize)}</TableCell>
                      <TableCell>{attachment.uploader.name}</TableCell>
                      <TableCell>{formatDateTime(attachment.uploadedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>سجل الحالة</CardTitle>
          <CardDescription>تحركات الحالة والقرارات.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>من</TableHead>
                <TableHead>إلى</TableHead>
                <TableHead>بواسطة</TableHead>
                <TableHead>ملاحظة</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispute.history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    لا يوجد سجل
                  </TableCell>
                </TableRow>
              ) : (
                dispute.history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fromStatus || "—"}</TableCell>
                    <TableCell>{item.toStatus}</TableCell>
                    <TableCell>{item.changer.name}</TableCell>
                    <TableCell>{item.note || "—"}</TableCell>
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
