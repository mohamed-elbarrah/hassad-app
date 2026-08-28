"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor } from "lucide-react";
import { useGetAdminSessionsQuery, useRevokeAdminSessionMutation } from "@/features/admin/adminUsersApi";
import { adminErrorMessage } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";

export default function EmployeeSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useGetAdminSessionsQuery({ userId: id, page, limit: 20 });
  const [revokeSession, { isLoading: isRevoking }] = useRevokeAdminSessionMutation();
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  async function handleRevoke(sessionId: string) {
    try {
      await revokeSession(sessionId).unwrap();
      toast.success("تم إلغاء الجلسة");
      setSessionToRevoke(null);
    } catch (mutationError) {
      toast.error(adminErrorMessage(mutationError));
    }
  }

  if (isLoading) return <AdminDetailSkeleton />;
  if (isError || !data) {
    return <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><Monitor /></EmptyMedia><EmptyHeader><EmptyTitle>تعذر تحميل الجلسات</EmptyTitle><EmptyDescription>{adminErrorMessage(error)}</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={() => refetch()}>إعادة المحاولة</Button></EmptyContent></Empty></CardContent></Card>;
  }

  return <div className="flex flex-col gap-6" dir="rtl">
    <PageHeader title="جلسات الموظف" description="مراجعة الجلسات النشطة والسابقة لهذا الموظف." icon={Monitor} actions={<Button variant="outline" asChild><Link href={`/dashboard/admin/employees/${id}`}><ArrowLeft data-icon="inline-start" />العودة للتفاصيل</Link></Button>} />
    <Card><CardHeader><CardTitle>الجلسات</CardTitle></CardHeader><CardContent className="flex flex-col gap-4">
      {data.items.length === 0 ? <Empty><EmptyMedia variant="icon"><Monitor /></EmptyMedia><EmptyHeader><EmptyTitle>لا توجد جلسات</EmptyTitle><EmptyDescription>لا توجد جلسات مسجلة لهذا الموظف.</EmptyDescription></EmptyHeader></Empty> : <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>الحالة</TableHead><TableHead>الجهاز</TableHead><TableHead>عنوان الشبكة</TableHead><TableHead>بدأت في</TableHead><TableHead>تنتهي في</TableHead><TableHead>الإجراء</TableHead></TableRow></TableHeader><TableBody>{data.items.map((session) => <TableRow key={session.id}><TableCell><Badge variant={session.isActive ? "secondary" : "outline"}>{session.isActive ? "نشطة" : "منتهية"}</Badge></TableCell><TableCell className="max-w-xs truncate">{session.userAgent ?? "غير محدد"}</TableCell><TableCell dir="ltr">{session.ip ?? "غير محدد"}</TableCell><TableCell>{formatDateTime(session.createdAt)}</TableCell><TableCell>{formatDateTime(session.expiresAt)}</TableCell><TableCell><Button variant="outline" size="sm" disabled={!session.isActive || isRevoking} onClick={() => setSessionToRevoke(session.id)}>إلغاء الجلسة</Button></TableCell></TableRow>)}</TableBody></Table></div>}
      {data.totalPages > 1 ? <Pagination><PaginationContent><PaginationItem><PaginationPrevious direction="rtl" text="السابق" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} /></PaginationItem><PaginationItem><span className="px-3 text-sm text-muted-foreground">صفحة {page} من {data.totalPages}</span></PaginationItem><PaginationItem><PaginationNext direction="rtl" text="التالي" disabled={page >= data.totalPages} onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))} /></PaginationItem></PaginationContent></Pagination> : null}
    </CardContent></Card>
    <AlertDialog open={sessionToRevoke !== null} onOpenChange={(open) => { if (!open) setSessionToRevoke(null); }}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader><AlertDialogTitle>إلغاء الجلسة؟</AlertDialogTitle><AlertDialogDescription>سيتم إنهاء هذه الجلسة ولن يتمكن الجهاز من استخدامها مرة أخرى.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction disabled={isRevoking} onClick={(event) => { event.preventDefault(); if (sessionToRevoke) void handleRevoke(sessionToRevoke); }}>تأكيد إلغاء الجلسة</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
