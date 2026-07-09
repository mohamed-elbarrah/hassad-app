"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, Eye, Globe, GlobeOff } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { StatCard } from "@/components/design-system/StatCard";
import { DataTable } from "@/components/design-system/DataTable";
import { FilterPills } from "@/components/design-system/FilterPills";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Pill } from "@/components/design-system/Pill";
import { useGetAdminClientsQuery, useGetAdminClientsStatsQuery, useTogglePortalAccessMutation } from "@/features/admin/adminApi";
import { formatDate, formatCurrency } from "@/lib/format";
import { CLIENT_STATUS_AR } from "@hassad/shared";
import { toast } from "sonner";

const STATUS_FILTERS = [
  { label: "الكل", value: "all" },
  { label: "نشط", value: "active" },
  { label: "متوقف", value: "stopped" },
];

export default function AdminClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetAdminClientsQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = useGetAdminClientsStatsQuery();

  const [togglePortal] = useTogglePortalAccessMutation();

  const clients = data?.items ?? [];

  const handleTogglePortal = async (clientId: string) => {
    try {
      const result = await togglePortal(clientId).unwrap();
      toast.success(result.enabled ? "تم تفعيل البوابة" : "تم تعطيل البوابة");
    } catch {
      toast.error("فشل تحديث حالة البوابة");
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="إدارة حسابات العملاء"
        description={`إجمالي ${data?.total ?? 0} عميل`}
        icon={Building2}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي العملاء" value={stats?.total ?? 0} icon={Building2} />
        <StatCard title="نشط" value={stats?.active ?? 0} icon={Building2} variant="success" />
        <StatCard title="متوقف" value={stats?.inactive ?? 0} icon={Building2} variant="warning" />
        <StatCard title="جديد هذا الشهر" value={stats?.newThisMonth ?? 0} icon={Building2} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
          <FormInputControl
            placeholder="ابحث بالاسم أو الإيميل أو الشركة..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pr-9"
          />
        </div>
        <FilterPills
          options={STATUS_FILTERS}
          active={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </div>

      <DataTable
        columns={[
          { id: "name", label: "الاسم" },
          { id: "company", label: "الشركة" },
          { id: "contracts", label: "العقود" },
          { id: "projects", label: "المشاريع" },
          { id: "overdue", label: "فواتير متأخرة" },
          { id: "revenue", label: "الإيرادات" },
          { id: "portal", label: "البوابة" },
          { id: "status", label: "الحالة" },
          { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
          { id: "actions", label: "", align: "left" },
        ]}
        data={clients}
        isLoading={isLoading}
        isError={isError}
        emptyState={{
          icon: Building2,
          message: "لا يوجد عملاء",
          hint: "لا توجد نتائج مطابقة للبحث",
        }}
        renderRow={(c: any) => {
          const statusLabel = c.status ? (CLIENT_STATUS_AR as Record<string, string>)[c.status] ?? c.status : (c.isActive ? "نشط" : "معطل");
          return (
            <tr
              key={c.id}
              className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
              onClick={() => router.push(`/dashboard/admin/clients/${c.id}`)}
            >
              <td className="px-5 py-4 text-sm font-medium">{c.name}</td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {c.companyName}
              </td>
              <td className="px-5 py-4 text-sm">{c.contractsCount}</td>
              <td className="px-5 py-4 text-sm">{c.projectsCount}</td>
              <td className="px-5 py-4">
                <Pill tone={c.overdueInvoicesCount > 0 ? "danger" : "neutral"}>
                  {c.overdueInvoicesCount ?? 0}
                </Pill>
              </td>
              <td className="px-5 py-4 text-sm font-medium">
                {formatCurrency(c.totalRevenue)}
              </td>
              <td className="px-5 py-4">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleTogglePortal(c.id)}
                  className={c.portalAccess ? "text-success-600" : "text-portal-icon"}
                >
                  {c.portalAccess ? <Globe className="size-4" /> : <GlobeOff className="size-4" />}
                </ActionButton>
              </td>
              <td className="px-5 py-4">
                <StatusBadge
                  status={c.isActive ? "ACTIVE" : "STOPPED"}
                  label={statusLabel}
                />
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text text-left">
                {formatDate(c.createdAt)}
              </td>
              <td className="px-5 py-4 text-left">
                <ActionButton variant="ghost" size="sm">
                  <Eye className="size-4" />
                </ActionButton>
              </td>
            </tr>
          );
        }}
      />

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-portal-divider">
          <span className="text-sm text-portal-note-text">
            إجمالي {data.total} عميل
          </span>
          <div className="flex gap-2">
            <ActionButton
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </ActionButton>
            <ActionButton
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
