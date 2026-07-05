"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, TrendingUp, Eye } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { StatCard } from "@/components/design-system/StatCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  useGetAdminProposalsQuery,
  useGetAdminProposalStatsQuery,
} from "@/features/admin/adminApi";
import { PROPOSAL_STATUS_AR } from "@hassad/shared";

export default function AdminProposalsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError } = useGetAdminProposalsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const { data: stats } = useGetAdminProposalStatsQuery();

  const proposals = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="العروض الفنية"
        description="إدارة ومتابعة جميع العروض الفنية"
        icon={FileText}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="الإجمالي"
          value={`${stats?.total ?? 0}`}
          icon={FileText}
        />
        <StatCard
          title="مرسل"
          value={`${stats?.sent ?? 0}`}
          icon={TrendingUp}
        />
        <StatCard
          title="مقبول"
          value={`${stats?.approved ?? 0}`}
          icon={TrendingUp}
          trend="up"
          trendValue={`${stats?.conversionRate ?? 0}%`}
        />
        <StatCard
          title="مرفوض"
          value={`${stats?.rejected ?? 0}`}
          icon={FileText}
        />
        <StatCard
          title="طلب مراجعة"
          value={`${stats?.revisionRequested ?? 0}`}
          icon={FileText}
        />
      </div>

      <SurfaceCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-note-text" />
            <FormInputControl
              placeholder="ابحث عن عرض..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-portal-divider px-3 py-2 text-sm"
          >
            <option value="">كل الحالات</option>
            {Object.entries(PROPOSAL_STATUS_AR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={[
            { id: "title", label: "العنوان" },
            { id: "client", label: "العميل" },
            { id: "totalPrice", label: "المبلغ" },
            { id: "status", label: "الحالة" },
            { id: "createdAt", label: "تاريخ الإنشاء", align: "left" },
            { id: "actions", label: "", align: "left" },
          ]}
          data={proposals}
          isLoading={isLoading}
          isError={isError}
          emptyState={{
            icon: FileText,
            message: "لا توجد عروض فنية",
            hint: "لم يتم إنشاء أي عروض فنية بعد",
          }}
          renderRow={(p: any) => (
            <tr
              key={p.id}
              className="border-b border-portal-divider cursor-pointer hover:bg-badge-gray-bg/50"
              onClick={() => router.push(`/dashboard/admin/proposals/${p.id}`)}
            >
              <td className="px-5 py-3 text-sm font-medium">{p.title}</td>
              <td className="px-5 py-3 text-sm text-portal-note-text">
                {p.client?.companyName ?? p.lead?.companyName ?? "—"}
              </td>
              <td className="px-5 py-3 text-sm">
                {p.totalPrice?.toLocaleString()} ر.س
              </td>
              <td className="px-5 py-3">
                <StatusBadge
                  status={p.status}
                  label={PROPOSAL_STATUS_AR[p.status] ?? p.status}
                />
              </td>
              <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                {p.createdAt?.slice(0, 10) ?? "—"}
              </td>
              <td className="px-5 py-3 text-left">
                <ActionButton variant="ghost" size="sm">
                  <Eye className="size-4" />
                </ActionButton>
              </td>
            </tr>
          )}
        />

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-portal-divider mt-4">
            <span className="text-sm text-portal-note-text">
              إجمالي {data.total} عرض
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
      </SurfaceCard>
    </div>
  );
}
