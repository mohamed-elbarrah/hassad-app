"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { title: "المستخدمون والصلاحيات", href: "/dashboard/admin/settings" },
  { title: "إعدادات العملة", href: "/dashboard/admin/settings/currency" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">إعدادات النظام</h1>
        <p className="text-sm text-muted-foreground mt-1">
          إدارة الإعدادات العامة للمنصة.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-border pb-0">
        {TABS.map((tab) => {
          const active = tab.href === pathname;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.title}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
