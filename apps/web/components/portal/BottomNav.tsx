"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  FileText,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "الرئيسية", href: "/portal", icon: Home },
  { label: "التسليمات", href: "/portal/deliverables", icon: Inbox },
  { label: "العقود", href: "/portal/contracts", icon: FileText },
  { label: "الفواتير", href: "/portal/finance", icon: Receipt },
  { label: "الإعدادات", href: "/portal/account", icon: Settings },
];

/* ── Bottom Navigation Bar (Mobile + Tablet) ──────────────────────────── */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 right-0 left-0 z-50 bg-white border-t border-[#E1E4EA] px-2 pt-2 pb-4"
      style={{ borderTopWidth: 1.5 }}
    >
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors min-w-[56px]",
                isActive ? "text-[#121936]" : "text-[#A8ABB2]"
              )}
            >
              <Icon
                className="shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  color: isActive ? "#121936" : "#A8ABB2",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isActive ? "#121936" : "#A8ABB2",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
