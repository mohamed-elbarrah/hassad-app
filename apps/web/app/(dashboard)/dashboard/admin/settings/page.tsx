"use client";

import Link from "next/link";
import {
  Shield,
  DollarSign,
  CreditCard,
  Wrench,
  ChevronLeft,
} from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";

const SETTINGS_CATEGORIES = [
  {
    title: "الصلاحيات",
    description: "إدارة الأدوار والأذونات والوصول",
    icon: Shield,
    href: "/dashboard/admin/settings",
    active: true,
  },
  {
    title: "إعدادات العملة",
    description: "تكوين العملات والأسعار",
    icon: DollarSign,
    href: "/dashboard/admin/settings/currency",
  },
  {
    title: "بوابات الدفع",
    description: "إدارة بوابات الدفع والفوترة",
    icon: CreditCard,
    href: "/dashboard/admin/payments",
  },
  {
    title: "الخدمات",
    description: "كتالوج الخدمات والعروض",
    icon: Wrench,
    href: "/dashboard/admin/settings/services",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">إعدادات النظام</h1>
        <p className="text-sm text-neutral-300 mt-1">
          إدارة التكوينات الأساسية للمنصة
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link key={cat.title} href={cat.href} className="group">
              <SurfaceCard className="h-full transition-colors hover:bg-neutral-50/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{cat.title}</h3>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                  <ChevronLeft className="size-4 text-neutral-300 group-hover:text-primary transition-colors" />
                </div>
              </SurfaceCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
