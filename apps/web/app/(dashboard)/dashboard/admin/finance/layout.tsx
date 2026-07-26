"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "نظرة عامة" },
  { key: "/invoices", label: "الفواتير" },
  { key: "/payments", label: "المدفوعات" },
  { key: "/webhook-logs", label: "سجلات Webhook" },
  { key: "/payment-events", label: "أحداث الدفع" },
];

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (tab.key === "") {
        if (pathname === "/dashboard/admin/finance") return "";
      } else if (pathname.startsWith(`/dashboard/admin/finance${tab.key}`)) {
        return tab.key;
      }
    }
    return "";
  }, [pathname]);

  return (
    <div className="page-shell" dir="rtl">
      <div className="flex items-center gap-4 border-b border-portal-divider">
        {TABS.map((tab) => {
          const href = tab.key
            ? `/dashboard/admin/finance${tab.key}`
            : "/dashboard/admin/finance";
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
      <div>{children}</div>
    </div>
  );
}
