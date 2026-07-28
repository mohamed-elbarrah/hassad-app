"use client";

import { useMemo, useState } from "react";
import { LogIn, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import {
  useGetAdminSessionsQuery,
  useRevokeAdminSessionMutation,
} from "@/features/admin/adminUsersApi";

export default function AdminSessionsPage() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data, isLoading, isError } = useGetAdminSessionsQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const [revokeSession, { isLoading: isRevoking }] =
    useRevokeAdminSessionMutation();

  const sessions = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(() => {
    const total = data?.total ?? 0;
    const active = sessions.filter((s) => s.isActive).length;
    const expired = sessions.filter((s) => !s.isActive).length;
    return { total, active, expired };
  }, [data, sessions]);

  const handleRevoke = async (id: string) => {
    try {
      await revokeSession(id).unwrap();
    } catch {
      // Error handled by RTK
    }
  };

  if (isError) {
    return (
      <div className="space-y-6" dir="rtl">
        <AdminEmptyState
          icon={LogIn}
          title="حدث خطأ أثناء تحميل الجلسات"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الجلسات</h1>
        <p className="text-muted-foreground">إدارة جلسات تسجيل دخول المستخدمين</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الإجمالي", value: statCards.total },
          { label: "نشط", value: statCards.active },
          { label: "منتهي", value: statCards.expired },
        ].map((card) => (
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
          <CardTitle>قائمة الجلسات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-4">
            <AdminListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="بحث بالاسم أو البريد الإلكتروني..."
              filterGroups={[
                {
                  key: "status",
                  label: "الحالة",
                  options: [
                    { label: "نشط", value: "active" },
                    { label: "منتهي", value: "expired" },
                  ],
                },
              ]}
              activeFilters={activeFilters}
              onFilterChange={(key, values) =>
                setActiveFilters((prev) => ({ ...prev, [key]: values }))
              }
            />
          </div>

          {isLoading ? (
            <div className="space-y-2 px-6 pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-6 pb-4">
              <AdminEmptyState
                icon={LogIn}
                title="لا توجد جلسات نشطة"
                description="لم يتم تسجيل أي جلسات دخول بعد."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">المتصفح</TableHead>
                  <TableHead className="text-right">IP</TableHead>
                  <TableHead className="text-right">تاريخ البدء</TableHead>
                  <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-right font-medium">
                      {session.userName}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {session.userEmail}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground max-w-[180px] truncate">
                      {session.userAgent || "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {session.ip || "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(session.expiresAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminStatusBadge
                        domain="client"
                        status={session.isActive ? "ACTIVE" : "STOPPED"}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {session.isActive && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(session.id)}
                          disabled={isRevoking}
                        >
                          <XCircle className="size-3.5" />
                          إنهاء
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
