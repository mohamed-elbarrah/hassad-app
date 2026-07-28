"use client";

import { useMemo, useState } from "react";
import { Shield, AlertTriangle, UserX, Key, Users, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminSecurityEventsQuery,
  useGetAdminSecurityStatsQuery,
} from "@/features/admin/adminUsersApi";

const EVENT_TYPE_OPTIONS = [
  { label: "محاولة دخول فاشلة", value: "FAILED_LOGIN" },
  { label: "انتحال شخصية", value: "IMPERSONATE" },
  { label: "إعادة تعيين كلمة المرور", value: "PASSWORD_RESET" },
  { label: "جلسة نشطة", value: "ACTIVE_SESSION" },
  { label: "تفعيل المصادقة الثنائية", value: "TWO_FACTOR" },
];

export default function AdminSecurityPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data, isLoading, isError } = useGetAdminSecurityEventsQuery({
    type: activeFilters.type?.[0],
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  });

  const { data: stats } = useGetAdminSecurityStatsQuery();

  const events = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(
    () => [
      { label: "إجمالي الأحداث", value: stats?.totalEvents ?? 0 },
      { label: "محاولات دخول فاشلة (24 ساعة)", value: stats?.failedLogins24h ?? 0 },
      { label: "انتحال شخصية (7 أيام)", value: stats?.impersonations7d ?? 0 },
      { label: "إعادة تعيين كلمة المرور (7 أيام)", value: stats?.passwordResets7d ?? 0 },
      { label: "الجلسات النشطة", value: stats?.activeSessions ?? 0 },
      { label: "المصادقة الثنائية", value: stats?.twoFactorEnabled ?? 0 },
    ],
    [stats],
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الأمان</h1>
        <p className="text-muted-foreground">مراقبة الأحداث الأمنية والجلسات النشطة</p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الأحداث الأمنية</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-4 space-y-3">
            <AdminListToolbar
              search=""
              onSearchChange={() => {}}
              searchPlaceholder=""
              filterGroups={[
                {
                  key: "type",
                  label: "النوع",
                  options: EVENT_TYPE_OPTIONS,
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
                icon={Shield}
                title="حدث خطأ"
                description="حدث خطأ أثناء تحميل الأحداث الأمنية."
              />
            </div>
          ) : events.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={Shield}
                title="لا يوجد أحداث أمنية"
                description="لم يتم تسجيل أي أحداث أمنية بعد."
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">عنوان IP</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-right font-medium">
                        {event.type}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {event.userName || "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {event.userEmail || "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-mono">
                        {event.ip || "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString("ar-SA")}
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
