"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { useGetPortalProjectsQuery } from "@/features/portal/portalApi";
import { ProjectStatus } from "@hassad/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { mapProjectStatusToUI } from "@/lib/utils/statusMapping";
import { PROJECT_STATUS_AR } from "@hassad/shared";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "الكل", value: "" },
  { label: "نشط", value: ProjectStatus.ACTIVE },
  { label: "تخطيط", value: ProjectStatus.PLANNING },
  { label: "معلق", value: ProjectStatus.ON_HOLD },
  { label: "مكتمل", value: ProjectStatus.COMPLETED },
  { label: "ملغى", value: ProjectStatus.CANCELLED },
];

const PAGE_SIZE = 6;

export default function PortalProjectsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetPortalProjectsQuery({
    status: statusFilter || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const projects = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">مشاريعي</h1>
        <p className="text-sm text-muted-foreground mt-1">
          تتبع جميع مشاريعك وحالة كل مشروع ونسبة التقدم.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة المشاريع</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              حدث خطأ أثناء تحميل المشاريع. يرجى المحاولة لاحقاً.
            </p>
          )}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المشروع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التقدم</TableHead>
                  <TableHead className="text-right">مدير المشروع</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">تاريخ النهاية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-10"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FolderOpen className="h-8 w-8 opacity-30" />
                        <span>لا توجد مشاريع حالياً.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={mapProjectStatusToUI(p.status)}
                        label={p.statusAr}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className="h-full bg-[#121936] rounded-full"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {p.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.projectManager?.name ?? "غير معين"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.startDate).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.endDate).toLocaleDateString("ar-SA")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
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
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}