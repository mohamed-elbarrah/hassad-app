"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, FileText, PenTool, PlusCircle } from "lucide-react";
import { useGetPortalRequestsQuery } from "@/features/portal/portalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/portal/StatusBadge";

const PAGE_SIZE = 6;

export default function PortalRequestsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetPortalRequestsQuery({
    page,
    limit: PAGE_SIZE,
  });

  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">الطلبات قيد الانتظار</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            قبل توقيع العقد ستظهر طلباتك هنا بالحالة المبسطة طلب قيد الانتظار.
            بعد التوقيع ينتقل الطلب تلقائياً إلى صفحة المشاريع كتنفيذ فعلي.
          </p>
        </div>
        <Link href="/portal/new-order">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            إنشاء طلب جديد
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-3xl" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive text-center">
            حدث خطأ أثناء تحميل الطلبات. يرجى المحاولة لاحقاً.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && requests.length === 0 && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <ClipboardList className="h-10 w-10 opacity-30" />
              <div className="space-y-1">
                <p className="font-medium">لا توجد طلبات معلقة حالياً.</p>
                <p className="text-sm text-muted-foreground">
                  عند إنشاء طلب جديد سيظهر هنا مباشرة حتى يكتمل التوقيع ويصبح
                  مشروعاً.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && requests.length > 0 && (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <CardTitle className="text-lg truncate">
                      {request.companyName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {request.contactName}
                    </p>
                  </div>
                  <StatusBadge status="pending" label={request.statusLabel} />
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-foreground/80">
                    {request.stageLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    تاريخ الطلب:{" "}
                    {new Date(request.createdAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>

                {request.notes && (
                  <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
                    {request.notes}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">الخدمات المطلوبة</p>
                  <div className="flex flex-wrap gap-2">
                    {request.services.map((service) => (
                      <span
                        key={service.id}
                        className="rounded-full border px-3 py-1 text-sm"
                        style={{
                          borderColor: "#E1E4EA",
                          background: "#F9FAFB",
                        }}
                      >
                        {service.nameAr ?? service.name}
                        {service.quantity > 1 ? ` × ${service.quantity}` : ""}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">العرض الفني</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.latestProposal
                            ? request.latestProposal.title
                            : "لم يتم نشر عرض فني بعد"}
                        </p>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                    {request.latestProposal?.url && (
                      <div className="mt-4">
                        <Link href={request.latestProposal.url}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            مراجعة العرض
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">العقد</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.latestContract
                            ? request.latestContract.title
                            : "سيظهر العقد هنا عند جاهزيته"}
                        </p>
                      </div>
                      <PenTool className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                    {request.latestContract?.url && (
                      <div className="mt-4">
                        <Link href={request.latestContract.url}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <PenTool className="h-4 w-4" />
                            {request.latestContract.status === "SENT"
                              ? "توقيع العقد"
                              : "فتح العقد"}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
