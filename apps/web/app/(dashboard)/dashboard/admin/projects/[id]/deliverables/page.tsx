"use client";

import { use, useState } from "react";
import { AdminPageError } from "@/components/dashboard/admin/shared/AdminPageError";
import { AdminPageLoading } from "@/components/dashboard/admin/shared/AdminPageLoading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAdminProjectDeliverablesQuery } from "@/features/admin/adminProjectsApi";
import { DELIVERABLE_STATUS_AR, DeliverableStatus } from "@hassad/shared";
import { UNKNOWN_STATUS_LABEL } from "@/lib/i18n";

export default function ProjectsDetailDeliverables({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const query = useGetAdminProjectDeliverablesQuery({ id, page, limit: 20 });
  if (query.isLoading) return <AdminPageLoading />;
  if (query.isError || !query.data) return <AdminPageError onRetry={query.refetch} title="تعذر تحميل التسليمات" />;
  if (!query.data.items.length) return <Card><CardContent className="p-8"><Empty><EmptyHeader><EmptyTitle>لا توجد تسليمات</EmptyTitle></EmptyHeader></Empty></CardContent></Card>;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>التسليم</TableHead><TableHead>الحالة</TableHead><TableHead>المهمة</TableHead><TableHead>الفترة</TableHead></TableRow></TableHeader>
          <TableBody>{query.data.items.map((item) => <TableRow key={item.id}><TableCell>{item.title || "—"}</TableCell><TableCell><Badge variant="outline">{DELIVERABLE_STATUS_AR[item.status as DeliverableStatus] || UNKNOWN_STATUS_LABEL}</Badge></TableCell><TableCell>{item.task?.title || "—"}</TableCell><TableCell>{item.period ? `الفترة ${item.period.periodNumber}` : "—"}</TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
      {query.data.totalPages > 1 && <div className="flex items-center justify-between gap-3" dir="rtl" aria-label="ترقيم صفحات التسليمات"><span className="text-sm text-muted-foreground">الصفحة {query.data.page} من {query.data.totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>السابقة</Button><Button variant="outline" size="sm" disabled={page >= query.data.totalPages} onClick={() => setPage((current) => current + 1)}>التالية</Button></div></div>}
    </div>
  );
}
