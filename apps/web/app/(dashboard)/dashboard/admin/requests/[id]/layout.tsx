"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";
import { useGetAdminRequestByIdQuery } from "@/features/admin/adminRequestsApi";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "نظرة عامة" },
  { key: "/timeline", label: "التسلسل الزمني" },
  { key: "/notes", label: "الملاحظات والخدمات" },
];

export default function RequestDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const {
    data: request,
    isLoading,
    isError,
    refetch,
  } = useGetAdminRequestByIdQuery(id);

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (pathname.endsWith(`/requests/${id}${tab.key}`)) return tab.key;
    }
    return "";
  }, [pathname, id]);

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !request) {
    return (
      <AdminDetailError
        onRetry={refetch}
        backHref="/dashboard/admin/requests"
        backLabel="الطلبات"
        title="حدث خطأ أثناء تحميل بيانات الطلب"
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <AdminDetailBreadcrumb
          backHref="/dashboard/admin/requests"
          backLabel="الطلبات"
          title={request.companyName}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {request.contactName}
          </span>
        </div>
      </div>

      <Tabs value={currentTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
          {TABS.map((tab) => {
            const href = tab.key
              ? `/dashboard/admin/requests/${id}${tab.key}`
              : `/dashboard/admin/requests/${id}`;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                asChild
                className={cn(
                  "rounded-none border-b-2 px-4 pb-3 pt-0 text-sm font-medium data-[state=active]:shadow-none",
                  "data-[state=active]:border-primary data-[state=active]:text-primary",
                  "data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground",
                  "h-auto",
                )}
              >
                <Link href={href}>{tab.label}</Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
