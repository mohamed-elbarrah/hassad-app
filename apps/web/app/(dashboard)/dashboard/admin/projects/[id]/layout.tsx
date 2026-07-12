"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";
import { useGetAdminProjectByIdQuery } from "@/features/admin/adminProjectsApi";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "الملخص" },
  { key: "/timeline", label: "التسلسل الزمني" },
  { key: "/periods", label: "الفترات" },
  { key: "/tasks", label: "المهام" },
  { key: "/deliverables", label: "التسليمات" },
];

export default function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = useGetAdminProjectByIdQuery(id);

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (pathname.endsWith(`/projects/${id}${tab.key}`)) return tab.key;
    }
    return "";
  }, [pathname, id]);

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !project) {
    return (
      <AdminDetailError
        onRetry={refetch}
        backHref="/dashboard/admin/projects"
        backLabel="المشاريع"
        title="حدث خطأ أثناء تحميل بيانات المشروع"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <div className="flex items-center justify-between">
        <AdminDetailBreadcrumb
          backHref="/dashboard/admin/projects"
          backLabel="المشاريع"
          title={project.name}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-portal-note-text">
            {project.client.companyName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-portal-divider">
        {TABS.map((tab) => {
          const href = tab.key
            ? `/dashboard/admin/projects/${id}${tab.key}`
            : `/dashboard/admin/projects/${id}`;
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
