"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  SendHorizonal,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { Pagination } from "@/components/design-system/Pagination";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import {
  useGetAdminProposalsQuery,
  useGetAdminProposalStatsQuery,
} from "@/features/admin/adminProposalsApi";

const COLUMNS: DataTableColumn[] = [
  { id: "title", label: "العنوان", align: "right" },
  { id: "client", label: "العميل / الفرصة", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "creator", label: "المنشئ", align: "right" },
  { id: "totalPrice", label: "المبلغ الإجمالي", align: "right" },
  { id: "createdAt", label: "التاريخ", align: "right" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: FileText,
  message: "لا يوجد عروض أسعار",
  hint: "لم يتم إضافة أي عروض أسعار بعد.",
};

const STATUS_OPTIONS = [
  { label: "مسودة", value: "DRAFT" },
  { label: "مرسل", value: "SENT" },
  { label: "قيد المراجعة", value: "UNDER_REVIEW" },
  { label: "مقبول", value: "ACCEPTED" },
  { label: "مرفوض", value: "REJECTED" },
  { label: "ملغي", value: "CANCELLED" },
];

export default function AdminProposalsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const { data, isLoading, isError } = useGetAdminProposalsQuery({
    search: search || undefined,
    status: activeFilters.status?.[0],
    page,
    limit: 20,
  });

  const { data: stats } = useGetAdminProposalStatsQuery();

  const proposals = useMemo(() => data?.items ?? [], [data]);

  const statCards = useMemo(
    () => [
      {
        label: "الإجمالي",
        value: stats?.total ?? 0,
        icon: FileText,
        variant: "default" as const,
      },
      {
        label: "مرسل",
        value: stats?.sent ?? 0,
        icon: SendHorizonal,
        variant: "success" as const,
      },
      {
        label: "مقبول",
        value: stats?.approved ?? 0,
        icon: CheckCircle,
        variant: "success" as const,
      },
      {
        label: "مرفوض",
        value: stats?.rejected ?? 0,
        icon: XCircle,
        variant: "danger" as const,
      },
      {
        label: "معدل التحويل",
        value: stats ? `${stats.conversionRate}%` : "—",
        icon: TrendingUp,
        variant: "warning" as const,
      },
    ],
    [stats],
  );

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="عروض الأسعار"
        description="إدارة جميع عروض الأسعار في المنصة"
        icon={FileText}
      />

      <div className="grid grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[30px] border-[1.5px] border-portal-card-border p-5"
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard title="قائمة عروض الأسعار">
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث بالعنوان أو اسم العميل..."
            filterGroups={[
              {
                key: "status",
                label: "الحالة",
                options: STATUS_OPTIONS,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(key, values) =>
              setActiveFilters((prev) => ({ ...prev, [key]: values }))
            }
          />
        </div>

        <DataTable
          columns={COLUMNS}
          data={proposals}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل عروض الأسعار."
          emptyState={EMPTY_STATE}
          renderRow={(proposal) => (
            <tr
              key={proposal.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/proposals/${proposal.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {proposal.title}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {proposal.client?.companyName ||
                  proposal.lead?.companyName ||
                  "—"}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="proposal" status={proposal.status} />
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {proposal.creator?.name || "—"}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {proposal.totalPrice.toLocaleString("ar-SA", {
                  style: "currency",
                  currency: "SAR",
                })}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {new Date(proposal.createdAt).toLocaleDateString("ar-SA")}
              </td>
            </tr>
          )}
        />

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
