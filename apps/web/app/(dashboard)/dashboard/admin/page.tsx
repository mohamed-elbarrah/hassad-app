"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetAdminStatsQuery } from "@/features/admin/adminApi";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { useGetDisputeStatsQuery } from "@/features/disputes/adminDisputesApi";
import { useCurrency } from "@/hooks/useCurrency";
import { PageIntro } from "@/components/design-system/PageIntro";
import { StatCard } from "@/components/design-system/StatCard";
import { DashboardCard } from "@/components/design-system/DashboardCard";
import { DataTable } from "@/components/design-system/DataTable";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { ActionButton } from "@/components/design-system/ActionButton";
import { InvoiceStatus } from "@hassad/shared";
import { formatDate } from "@/lib/format";
import {
  Users,
  Building2,
  Briefcase,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  PlusCircle,
  LayoutDashboard,
  Ticket,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: invoicesData, isLoading: invoicesLoading } =
    useGetInvoicesQuery({ status: InvoiceStatus.DUE, limit: 5 });
  const { data: disputeStats } = useGetDisputeStatsQuery();
  const { fmtNumber } = useCurrency();

  if (!user) return null;

  const invoices = invoicesData?.items ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="لوحة الإدارة العليا"
        description={`مرحباً، ${user.name || "الإدارة"} — نظرة شاملة على أداء المنصة`}
        icon={LayoutDashboard}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/admin/settings">
              <ActionButton variant="outline" size="md">الإعدادات</ActionButton>
            </Link>
            <Link href="/dashboard/admin/audit-log">
              <ActionButton variant="ghost" size="md">سجل النشاطات</ActionButton>
            </Link>
          </div>
        }
      />

      {/* KPI Row 1 — People & Revenue */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="المستخدمين"
          value={statsLoading ? "—" : fmtNumber(stats?.totalUsers)}
          icon={Users}
          trend={stats?.recentUsers && stats.recentUsers > 0 ? "up" : "neutral"}
          trendValue={stats?.recentUsers ? `+${fmtNumber(stats.recentUsers)} جديد` : undefined}
        />
        <StatCard
          title="العملاء النشطين"
          value={statsLoading ? "—" : fmtNumber(stats?.activeClients)}
          icon={Building2}
        />
        <StatCard
          title="المشاريع الجارية"
          value={statsLoading ? "—" : fmtNumber(stats?.activeProjects)}
          icon={Briefcase}
        />
        <StatCard
          title="الإيرادات الشهرية"
          value={statsLoading ? "—" : <CurrencyDisplay amount={stats?.monthlyRevenue} size="lg" />}
          icon={DollarSign}
          trend={stats?.revenueChange && stats.revenueChange > 0 ? "up" : stats?.revenueChange && stats.revenueChange < 0 ? "down" : "neutral"}
          trendValue={stats?.revenueChange ? `${Math.abs(stats.revenueChange)}%` : undefined}
        />
      </div>

      {/* KPI Row 2 — Operations */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="المهام المتأخرة"
          value={statsLoading ? "—" : fmtNumber(stats?.overdueTasks)}
          icon={AlertTriangle}
          variant={stats?.overdueTasks && stats.overdueTasks > 0 ? "danger" : "default"}
        />
        <StatCard
          title="فواتير غير مسددة"
          value={statsLoading ? "—" : fmtNumber(stats?.unpaidInvoicesCount)}
          icon={Clock}
          variant={stats?.unpaidInvoicesCount && stats.unpaidInvoicesCount > 0 ? "warning" : "default"}
        />
        <StatCard
          title="طلبات معلقة"
          value={statsLoading ? "—" : fmtNumber(stats?.pendingRequests)}
          icon={PlusCircle}
        />
        <StatCard
          title="حملات نشطة"
          value={statsLoading ? "—" : fmtNumber(stats?.activeCampaigns)}
          icon={TrendingUp}
        />
      </div>

      {/* KPI Row 3 — Disputes */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/dashboard/admin/disputes?status=PENDING_APPROVAL">
          <div className="rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5 transition-all hover:border-yellow-300 hover:shadow-sm cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-portal-note-text">بانتظار الموافقة</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-natural-100">
              {disputeStats?.pendingApproval ?? 0}
            </p>
          </div>
        </Link>
        <Link href="/dashboard/admin/disputes?status=ESCALATED">
          <div className="rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5 transition-all hover:border-red-300 hover:shadow-sm cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-portal-note-text">تم التصعيد</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-natural-100">
              {disputeStats?.escalated ?? 0}
            </p>
          </div>
        </Link>
        <Link href="/dashboard/admin/disputes">
          <div className="rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5 transition-all hover:border-blue-300 hover:shadow-sm cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-portal-note-text">نشطة</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Ticket className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-natural-100">
              {disputeStats?.active ?? 0}
            </p>
          </div>
        </Link>
        <Link href="/dashboard/admin/disputes?status=RESOLVED">
          <div className="rounded-[24px] border-[1.5px] border-portal-divider bg-natural-0 p-5 transition-all hover:border-green-300 hover:shadow-sm cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-portal-note-text">تم الحل</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <Ticket className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-natural-100">
              {disputeStats?.resolved ?? 0}
            </p>
          </div>
        </Link>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users by Role */}
        <DashboardCard title="توزيع المستخدمين" icon={Users} showAll={false}>
          {statsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-neutral-100" />
                    <span className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
                  </div>
                  <span className="h-4 w-8 bg-neutral-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.usersByRole?.map((item) => (
                <div key={item.role} className="flex items-center justify-between py-2 border-b border-portal-divider last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary-500" />
                    <span className="text-base font-medium text-natural-100">{item.role}</span>
                  </div>
                  <span className="text-base text-portal-note-text">{fmtNumber(item.count)}</span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        {/* Due Invoices */}
        <DashboardCard title="فواتير مستحقة" icon={DollarSign} showAll={false}>
          <DataTable
            columns={[
              { id: "client", label: "العميل" },
              { id: "amount", label: "القيمة", align: "left" },
              { id: "dueDate", label: "تاريخ الاستحقاق", align: "left" },
            ]}
            data={invoices}
            isLoading={invoicesLoading}
            isError={false}
            emptyState={{
              icon: DollarSign,
              message: "لا توجد فواتير مستحقة",
              hint: "جميع الفواتير مدفوعة أو لم تصدر بعد",
            }}
            renderRow={(invoice) => (
              <tr key={invoice.id} className="border-b-[1.5px] border-portal-divider">
                <td className="px-5 py-4 text-base font-medium text-natural-100">
                  {invoice.client?.companyName ?? "—"}
                </td>
                <td className="px-5 py-4 text-left" dir="ltr">
                  <CurrencyDisplay amount={invoice.amount} size="sm" />
                </td>
                <td className="px-5 py-4 text-left text-sm text-portal-note-text" dir="ltr">
                  {formatDate(invoice.dueDate)}
                </td>
              </tr>
            )}
          />
        </DashboardCard>
      </div>

      {/* Quick Stats Footer */}
      {!statsLoading && stats && (
        <div className="flex flex-wrap gap-3 text-sm text-portal-note-text">
          <span className="px-3 py-1.5 rounded-full bg-badge-gray-bg text-natural-100">
            {fmtNumber(stats.completedProjects)} مشروع مكتمل
          </span>
          <span className="px-3 py-1.5 rounded-full bg-badge-gray-bg text-natural-100">
            {fmtNumber(stats.totalTasks)} مهمة
          </span>
          <span className="px-3 py-1.5 rounded-full bg-badge-gray-bg text-natural-100">
            {fmtNumber(stats.employeesCount)} موظف
          </span>
          <span className="px-3 py-1.5 rounded-full bg-badge-gray-bg text-natural-100">
            {fmtNumber(stats.conversationsCount)} محادثة
          </span>
          <span className="px-3 py-1.5 rounded-full bg-badge-gray-bg text-natural-100">
            {fmtNumber(stats.totalInvoices)} فاتورة
          </span>
        </div>
      )}
    </div>
  );
}
