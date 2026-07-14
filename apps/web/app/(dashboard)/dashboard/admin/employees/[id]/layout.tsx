"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";
import { useGetAdminUserByIdQuery } from "@/features/admin/adminUsersApi";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "الملف الشخصي" },
  { key: "/sessions", label: "الجلسات" },
  { key: "/activity", label: "النشاط" },
  { key: "/permissions", label: "الصلاحيات" },
];

export default function EmployeeDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useGetAdminUserByIdQuery(id);

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (pathname.endsWith(`/employees/${id}${tab.key}`)) return tab.key;
    }
    return "";
  }, [pathname, id]);

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !user) {
    return (
      <AdminDetailError
        onRetry={refetch}
        backHref="/dashboard/admin/employees"
        backLabel="الموظفون"
        title="حدث خطأ أثناء تحميل بيانات الموظف"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <div className="flex items-center justify-between">
        <AdminDetailBreadcrumb
          backHref="/dashboard/admin/employees"
          backLabel="الموظفون"
          title={user.name}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-portal-note-text">{user.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-portal-divider">
        {TABS.map((tab) => {
          const href = tab.key
            ? `/dashboard/admin/employees/${id}${tab.key}`
            : `/dashboard/admin/employees/${id}`;
          const isActive = currentTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-secondary-500 text-secondary-500"
                  : "border-transparent text-portal-note-text hover:text-natural-100",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
