"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp, Download, UserPlus } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { AdminListToolbar } from "@/components/dashboard/admin/shared/AdminListToolbar";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import {
  useGetAdminLeadsQuery,
  useGetAdminLeadStatsQuery,
} from "@/features/admin/adminLeadsApi";
import {
  LEAD_STAGE_AR,
  CLIENT_SOURCE_AR,
  BUSINESS_TYPE_AR,
} from "@hassad/shared";
import { cn } from "@/lib/utils";

const COLUMNS: DataTableColumn[] = [
  { id: "companyName", label: "الشركة", align: "right" },
  { id: "contactName", label: "جهة الاتصال", align: "right" },
  { id: "pipelineStage", label: "المرحلة", align: "right" },
  { id: "source", label: "المصدر", align: "right" },
  { id: "assigneeName", label: "المسؤول", align: "right" },
  { id: "lastContactAt", label: "آخر تواصل", align: "right" },
  { id: "potentialValue", label: "القيمة", align: "center" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: TrendingUp,
  message: "لا يوجد عملاء متوقعون",
  hint: "لم يتم إضافة أي عملاء متوقعين بعد.",
};

export default function AdminLeadsPage() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const filters = useMemo(() => {
    const f: Record<string, string | number | undefined> = {
      search: search || undefined,
      page,
      limit: 20,
    };
    if (activeFilters.stage?.length) f.stage = activeFilters.stage[0];
    if (activeFilters.source?.length) f.source = activeFilters.source[0];
    if (activeFilters.businessType?.length)
      f.businessType = activeFilters.businessType[0];
    return f;
  }, [search, page, activeFilters]);

  const { data, isLoading, isError } = useGetAdminLeadsQuery(filters as any);
  const { data: stats } = useGetAdminLeadStatsQuery();

  const leads = useMemo(() => data?.items ?? [], [data]);

  const newCount = useMemo(
    () => stats?.byStage?.find((s) => s.stage === "NEW")?.count ?? 0,
    [stats],
  );

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="العملاء المتوقعون"
        description="إدارة جميع العملاء المتوقعين وفرص البيع"
        icon={TrendingUp}
        actions={
          <ActionButton variant="primary" size="md">
            <UserPlus className="h-4 w-4" />
            إضافة عميل متوقع
          </ActionButton>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "الإجمالي",
            value: data?.total ?? 0,
            className: "",
          },
          {
            label: "جديد",
            value: newCount,
            className:
              "bg-secondary-100/50 border-secondary-200 text-secondary-600",
          },
          {
            label: "معدل التحويل",
            value:
              stats?.conversionRate != null
                ? `${(stats.conversionRate * 100).toFixed(1)}%`
                : "—",
            className: "bg-success-100/50 border-success-200 text-success-600",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-[30px] border-[1.5px] border-portal-card-border p-5",
              card.className,
            )}
          >
            <p className="text-sm text-portal-note-text">{card.label}</p>
            <p className="text-2xl font-semibold text-natural-100 mt-2">
              {isLoading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <SurfaceCard
        title="قائمة العملاء المتوقعين"
        action={
          <ActionButton variant="outline" size="sm">
            <Download className="h-4 w-4" />
            تصدير CSV
          </ActionButton>
        }
      >
        <div className="mb-4">
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="بحث بالشركة أو جهة الاتصال..."
            filterGroups={[
              {
                key: "stage",
                label: "المرحلة",
                options: Object.entries(LEAD_STAGE_AR).map(
                  ([value, label]) => ({ label, value }),
                ),
              },
              {
                key: "source",
                label: "المصدر",
                options: Object.entries(CLIENT_SOURCE_AR).map(
                  ([value, label]) => ({ label, value }),
                ),
              },
              {
                key: "businessType",
                label: "نوع النشاط",
                options: Object.entries(BUSINESS_TYPE_AR).map(
                  ([value, label]) => ({ label, value }),
                ),
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
          data={leads}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل العملاء المتوقعين."
          emptyState={EMPTY_STATE}
          renderRow={(lead: any) => (
            <tr
              key={lead.id}
              className="border-b border-portal-divider last:border-0"
            >
              <td className="py-3 px-2 text-right">
                <Link
                  href={`/dashboard/admin/leads/${lead.id}`}
                  className="hover:underline text-secondary-500 font-medium text-sm"
                >
                  {lead.companyName}
                </Link>
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {lead.contactName}
              </td>
              <td className="py-3 px-2 text-right">
                <AdminStatusBadge domain="lead" status={lead.pipelineStage} />
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {CLIENT_SOURCE_AR[
                  lead.source as keyof typeof CLIENT_SOURCE_AR
                ] || lead.source}
              </td>
              <td className="py-3 px-2 text-right text-sm text-portal-note-text">
                {lead.assigneeName || "—"}
              </td>
              <td className="py-3 px-2 text-right text-xs text-portal-note-text">
                {lead.lastContactAt
                  ? new Date(lead.lastContactAt).toLocaleDateString("ar-SA")
                  : "—"}
              </td>
              <td className="py-3 px-2 text-center text-sm font-medium text-natural-100">
                {lead.potentialValue != null
                  ? `${lead.potentialValue.toLocaleString()} ر.س`
                  : "—"}
              </td>
            </tr>
          )}
        />
      </SurfaceCard>
    </div>
  );
}
