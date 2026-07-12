"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "نظرة عامة" },
  { key: "/members", label: "الأعضاء" },
  { key: "/workload", label: "عبء العمل" },
];

export default function TeamDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ team: string }>;
}) {
  const { team } = use(params);
  const pathname = usePathname();
  const teamName = decodeURIComponent(team);

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (pathname.endsWith(`/teams/${team}${tab.key}`)) return tab.key;
    }
    return "";
  }, [pathname, team]);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <AdminDetailBreadcrumb
        backHref="/dashboard/admin/teams"
        backLabel="الفرق"
        title={teamName}
      />

      <div className="flex items-center gap-4 border-b border-portal-divider">
        {TABS.map((tab) => {
          const href = tab.key
            ? `/dashboard/admin/teams/${team}${tab.key}`
            : `/dashboard/admin/teams/${team}`;
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

      {children}
    </div>
  );
}
