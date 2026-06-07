"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  FileText,
  BarChart3,
  Settings,
  CheckCircle2,
  PlusCircle,
  FolderOpen,
  Bell,
  ClipboardList,
  MessageSquare,
  X,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MORE_ITEMS = [
  { label: "المحادثات", href: "/portal/chat", icon: MessageSquare },
  { label: "الإشعارات", href: "/portal/notifications", icon: Bell },
  { label: "طلبات جديدة", href: "/portal/new-order", icon: PlusCircle },
  { label: "الطلبات", href: "/portal/requests", icon: ClipboardList },
  { label: "العقود", href: "/portal/contracts", icon: FileText },
  { label: "العروض", href: "/portal/proposals", icon: FileText },
  { label: "مراجعة التسليمات", href: "/portal/deliverables", icon: Inbox },
  { label: "الحملات", href: "/portal/campaigns", icon: TrendingUp },
  { label: "التقارير", href: "/portal/reports", icon: BarChart3 },
  { label: "الإعدادات", href: "/portal/account", icon: Settings },
];

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const pathname = usePathname();

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", onEsc);
    }
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      {/* panel */}
      <div
        className="fixed bottom-0 right-0 left-0 z-50 rounded-t-[30px] border-t-[1.5px] border-portal-card-border bg-natural-0 p-6"
        style={{ maxHeight: "70vh" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-natural-100">المزيد</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-badge-gray-bg hover:bg-portal-divider transition-colors"
          >
            <X className="h-5 w-5 text-secondary-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3 transition-colors",
                  isActive
                    ? "border-secondary-500 bg-badge-gray-bg text-secondary-500 font-bold"
                    : "border-portal-card-border bg-portal-bg text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500",
                )}
              >
                <Icon className="shrink-0" style={{ width: 22, height: 22 }} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
