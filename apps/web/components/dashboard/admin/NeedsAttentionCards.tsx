"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  Scale,
  DollarSign,
  Clock,
} from "lucide-react";
import { ActionItemCard } from "@/components/design-system/ActionItemCard";
import { Skeleton } from "@/components/design-system/Skeleton";

interface NeedsAttentionCardsProps {
  data?: {
    stalledProjects?: number;
    newRequests?: number;
    openDisputes?: number;
    overdueInvoices?: number;
    delayAlerts?: number;
  };
  isLoading: boolean;
}

export function NeedsAttentionCards({
  data,
  isLoading,
}: NeedsAttentionCardsProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  const items = [
    {
      key: "stalledProjects",
      icon: AlertTriangle,
      label: "مشاريع متعثرة",
      color: "bg-danger-100 text-danger-600 border-danger-200",
      iconBg: "bg-danger-500/10",
      count: data?.stalledProjects ?? 0,
      link: "/dashboard/admin/projects?status=STALLED",
    },
    {
      key: "newRequests",
      icon: ClipboardList,
      label: "طلبات جديدة",
      color: "bg-action-blue-soft text-action-blue border-action-blue-soft",
      iconBg: "bg-action-blue/10",
      count: data?.newRequests ?? 0,
      link: "/dashboard/admin/requests?status=NEW",
    },
    {
      key: "openDisputes",
      icon: Scale,
      label: "نزاعات مفتوحة",
      color: "bg-alert-100 text-alert-600 border-alert-200",
      iconBg: "bg-alert-500/10",
      count: data?.openDisputes ?? 0,
      link: "/dashboard/admin/disputes?status=OPEN",
    },
    {
      key: "overdueInvoices",
      icon: DollarSign,
      label: "فواتير متأخرة",
      color: "bg-danger-100 text-danger-600 border-danger-200",
      iconBg: "bg-danger-500/10",
      count: data?.overdueInvoices ?? 0,
      link: "/dashboard/admin/finance?status=OVERDUE",
    },
    {
      key: "delayAlerts",
      icon: Clock,
      label: "تنبيهات تأخير",
      color: "bg-alert-100 text-alert-600 border-alert-200",
      iconBg: "bg-alert-500/10",
      count: data?.delayAlerts ?? 0,
      link: "/dashboard/admin/alerts",
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ActionItemCard
          key={item.key}
          title={item.label}
          subtitle={`${item.count.toLocaleString()} ${item.key === "stalledProjects" ? "مشروع" : item.key === "newRequests" ? "طلب" : ""}`}
          icon={<item.icon className="w-6 h-6" />}
          primaryAction="عرض التفاصيل"
          secondaryAction="تجاهل"
          onPrimary={() => router.push(item.link)}
          primaryColor={item.key === "newRequests" ? "blue" : "purple"}
        />
      ))}
    </div>
  );
}
