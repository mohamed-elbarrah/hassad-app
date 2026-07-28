"use client";

import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminAuditLogQuery,
  useGetAdminAuditLogFiltersQuery,
} from "@/features/admin/adminApi";

export default function AdminAuditPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data: filtersData } = useGetAdminAuditLogFiltersQuery();

  const { data, isLoading, isError } = useGetAdminAuditLogQuery({
    search: search || undefined,
    action: activeFilters.action?.[0],
    entity: activeFilters.entity?.[0],
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  });

  const auditLogs = useMemo(() => data?.items ?? [], [data]);

  const actionOptions = useMemo(
    () => (filtersData?.actions ?? []).map((a: string) => ({ label: a, value: a })),
    [filtersData],
  );

  const entityOptions = useMemo(
    () => (filtersData?.entityTypes ?? []).map((e: string) => ({ label: e, value: e })),
    [filtersData],
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سجل التدقيق</h1>
        <p className="text-muted-foreground">تتبع جميع الأحداث والتغييرات في المنصة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل الأحداث</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-4 space-y-3">
            <AdminListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="بحث في سجل التدقيق..."
              filterGroups={[
                {
                  key: "action",
                  label: "الإجراء",
                  options: actionOptions,
                },
                {
                  key: "entity",
                  label: "الكيان",
                  options: entityOptions,
                },
              ]}
              activeFilters={activeFilters}
              onFilterChange={(key, values) =>
                setActiveFilters((prev) => ({ ...prev, [key]: values }))
              }
            />
            <div className="flex gap-3">
              <Input
                placeholder="من تاريخ (YYYY-MM-DD)"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <Input
                placeholder="إلى تاريخ (YYYY-MM-DD)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 px-6 pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={ScrollText}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل سجل التدقيق."
              />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={ScrollText}
                title="لا يوجد سجل تدقيق"
                description="لم يتم تسجيل أي أحداث تدقيق بعد."
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الإجراء</TableHead>
                    <TableHead className="text-right">الكيان</TableHead>
                    <TableHead className="text-right">معرف الكيان</TableHead>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-right">
                        <AdminStatusBadge domain="audit" status={entry.action} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {entry.entityAr || entry.entity}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-mono">
                        {entry.entityId.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {entry.userName || "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {entry.userEmail || "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString("ar-SA")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data && data.totalPages > 1 && (
                <div className="flex justify-center py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        />
                      </PaginationItem>
                      {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={page === p}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
