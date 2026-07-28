"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="space-y-6" dir="rtl">
      <Tabs value={currentTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
          {TABS.map((tab) => {
            const href = tab.key
              ? `/dashboard/admin/finance${tab.key}`
              : "/dashboard/admin/finance";
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
      <div>{children}</div>
    </div>
  );
}
