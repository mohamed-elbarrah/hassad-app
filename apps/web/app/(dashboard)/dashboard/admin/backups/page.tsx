"use client";

import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  HardDrive,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useCreateAdminBackupMutation,
  useGetAdminBackupsQuery,
  useLazyGetAdminBackupDownloadUrlQuery,
  type AdminBackup,
  type AdminBackupScope,
} from "@/features/admin/adminBackupsApi";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import { formatDateTime, formatFileSize } from "@/lib/format";

const STATUS_LABELS: Record<AdminBackup["status"], string> = {
  QUEUED: "في الانتظار",
  RUNNING: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  FAILED: "فشل",
  EXPIRED: "منتهي",
};

const SCOPE_LABELS: Record<AdminBackupScope, string> = {
  DATABASE_ONLY: "قاعدة البيانات",
  FULL_SYSTEM: "النظام الكامل",
};

function statusVariant(status: AdminBackup["status"]) {
  if (status === "COMPLETED") return "secondary" as const;
  if (status === "RUNNING") return "warning" as const;
  if (status === "FAILED") return "destructive" as const;
  return "outline" as const;
}

function StatusIcon({ status }: { status: AdminBackup["status"] }) {
  if (status === "COMPLETED") return <CheckCircle2 data-icon="inline-start" />;
  if (status === "FAILED") return <XCircle data-icon="inline-start" />;
  return <Archive data-icon="inline-start" />;
}

export default function AdminBackupsPage() {
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<AdminBackupScope>("FULL_SYSTEM");
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAdminBackupsQuery({ page, limit: 25 }, { pollingInterval: 10_000 });
  const [createBackup, createState] = useCreateAdminBackupMutation();
  const [getDownloadUrl] = useLazyGetAdminBackupDownloadUrlQuery();

  async function handleCreate() {
    try {
      const result = await createBackup({ scope }).unwrap();
      toast.success(adminSuccessMessage("BACKUP_QUEUED"));
      if (result.backup.status === "QUEUED") void refetch();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  async function handleDownload(backup: AdminBackup) {
    try {
      const result = await getDownloadUrl(backup.id).unwrap();
      window.location.assign(result.url);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HardDrive />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">النسخ الاحتياطي</CardTitle>
              <CardDescription>
                أنشئ نقاط استعادة آمنة واحفظها في Cloudflare R2 قبل العمليات
                الحساسة.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            {isFetching ? "جارٍ التحديث" : "تحديث"}
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck /> إنشاء نقطة استعادة
          </CardTitle>
          <CardDescription>
            تعمل العملية في الخلفية. لا تغلق الصفحة؛ يمكنك متابعة حالتها من
            السجل.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">نطاق النسخة</p>
            <ToggleGroup
              type="single"
              value={scope}
              onValueChange={(value) => {
                if (value) setScope(value as AdminBackupScope);
              }}
              aria-label="نطاق النسخة الاحتياطية"
              className="justify-start"
            >
              <ToggleGroupItem value="FULL_SYSTEM" aria-label="النظام الكامل">
                النظام الكامل
              </ToggleGroupItem>
              <ToggleGroupItem
                value="DATABASE_ONLY"
                aria-label="قاعدة البيانات فقط"
              >
                قاعدة البيانات فقط
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button
            onClick={() => void handleCreate()}
            disabled={createState.isLoading}
          >
            {createState.isLoading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Archive data-icon="inline-start" />
            )}
            إنشاء نسخة يدوية
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل النسخ الاحتياطية</CardTitle>
          <CardDescription>
            النسخ المكتملة متاحة لتنزيل قاعدة البيانات لمدة 30 يوماً وفق سياسة
            الاحتفاظ الحالية. ملفات النسخة الكاملة محفوظة داخلياً في R2 حتى
            تفعيل أرشيف التنزيل الكامل.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <Empty>
              <EmptyMedia variant="icon">
                <XCircle />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>تعذر تحميل النسخ الاحتياطية</EmptyTitle>
                <EmptyDescription>{adminErrorMessage(error)}</EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" onClick={() => void refetch()}>
                إعادة المحاولة
              </Button>
            </Empty>
          ) : !data?.items.length ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Archive />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>لا توجد نسخ احتياطية بعد</EmptyTitle>
                <EmptyDescription>
                  أنشئ أول نقطة استعادة يدوية أو انتظر النسخة اليومية المجدولة.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>النطاق</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الحجم</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead className="text-left">الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">
                          {SCOPE_LABELS[backup.scope]}
                        </TableCell>
                        <TableCell>
                          {backup.trigger === "SCHEDULED"
                            ? "يومي مجدول"
                            : "يدوي"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(backup.status)}>
                            <StatusIcon status={backup.status} />
                            {STATUS_LABELS[backup.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {backup.sizeBytes === null
                            ? "—"
                            : formatFileSize(backup.sizeBytes)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(backup.createdAt)}
                        </TableCell>
                        <TableCell className="text-left">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={backup.status !== "COMPLETED"}
                            onClick={() => void handleDownload(backup)}
                          >
                            <Download data-icon="inline-start" /> تنزيل قاعدة
                            البيانات
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {data.totalPages > 1 ? (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        text="السابق"
                        disabled={page === 1}
                        onClick={() =>
                          setPage((current) => Math.max(1, current - 1))
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-3 text-sm text-muted-foreground">
                        صفحة {page} من {data.totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        text="التالي"
                        disabled={page === data.totalPages}
                        onClick={() =>
                          setPage((current) =>
                            Math.min(data.totalPages, current + 1),
                          )
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
