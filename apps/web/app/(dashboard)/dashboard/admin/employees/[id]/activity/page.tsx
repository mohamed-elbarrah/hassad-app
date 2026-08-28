"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckSquare } from "lucide-react";
import { useGetAdminUserActivityQuery } from "@/features/admin/adminUsersApi";
import { adminActivityActionLabel, adminActivityEntityLabel, adminErrorMessage } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function EmployeeActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useGetAdminUserActivityQuery({ id, page, limit: 20 });

  if (isLoading) return <AdminDetailSkeleton />;
  if (isError || !data) {
    return <ErrorState message={adminErrorMessage(error)} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageHeader title="سجل نشاط الموظف" description="مراجعة العمليات المسجلة لهذا الموظف." icon={CheckSquare} actions={<Button variant="outline" asChild><Link href={`/dashboard/admin/employees/${id}`}><ArrowLeft data-icon="inline-start" />العودة للتفاصيل</Link></Button>} />
      <Card>
        <CardHeader><CardTitle>النشاط المسجل</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data.items.length === 0 ? <Empty><EmptyMedia variant="icon"><CheckSquare /></EmptyMedia><EmptyHeader><EmptyTitle>لا يوجد نشاط</EmptyTitle><EmptyDescription>لم يتم تسجيل نشاط لهذا الموظف.</EmptyDescription></EmptyHeader></Empty> : <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>العملية</TableHead><TableHead>النوع</TableHead><TableHead>العنصر</TableHead><TableHead>التاريخ</TableHead></TableRow></TableHeader><TableBody>{data.items.map((item) => <TableRow key={item.id}><TableCell><Badge variant="outline">{adminActivityActionLabel(item.action)}</Badge></TableCell><TableCell>{adminActivityEntityLabel(item.entity)}</TableCell><TableCell>{item.entityId ?? "غير محدد"}</TableCell><TableCell>{formatDateTime(item.createdAt)}</TableCell></TableRow>)}</TableBody></Table></div>}
          {data.totalPages > 1 ? <Pagination><PaginationContent><PaginationItem><PaginationPrevious direction="rtl" text="السابق" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} /></PaginationItem><PaginationItem><span className="px-3 text-sm text-muted-foreground">صفحة {page} من {data.totalPages}</span></PaginationItem><PaginationItem><PaginationNext direction="rtl" text="التالي" disabled={page >= data.totalPages} onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))} /></PaginationItem></PaginationContent></Pagination> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><CheckSquare /></EmptyMedia><EmptyHeader><EmptyTitle>تعذر تحميل سجل النشاط</EmptyTitle><EmptyDescription>{message}</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={onRetry}>إعادة المحاولة</Button></EmptyContent></Empty></CardContent></Card>;
}
