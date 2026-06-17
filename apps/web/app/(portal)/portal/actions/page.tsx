"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pagination } from "@/components/design-system/Pagination";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { Pill } from "@/components/design-system/Pill";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useGetActionItemsQuery } from "@/features/portal/portalApi";

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "type",
    label: "النوع",
    options: [
      { label: "الكل", value: "" },
      { label: "مراجعة تسليمات", value: "DELIVERABLE_APPROVAL" },
      { label: "دفع فواتير", value: "INVOICE_PAYMENT" },
      { label: "مراجعة عروض", value: "PROPOSAL_REVIEW" },
      { label: "توقيع عقود", value: "CONTRACT_SIGN" },
      { label: "مراجعة دراسة تسويقية", value: "STRATEGY_REVIEW" },
    ],
  },
];

const TYPE_CONFIG: Record<string, { label: string; color: "purple" | "blue" }> =
  {
    DELIVERABLE_APPROVAL: { label: "مراجعة تسليم", color: "purple" },
    INVOICE_PAYMENT: { label: "دفع فاتورة", color: "blue" },
    PROPOSAL_REVIEW: { label: "مراجعة عرض", color: "purple" },
    CONTRACT_SIGN: { label: "توقيع عقد", color: "blue" },
    STRATEGY_REVIEW: { label: "مراجعة دراسة تسويقية", color: "purple" },
  };

const PRIORITY_PILL: Record<
  string,
  { label: string; tone: "danger" | "neutral" | "warning" }
> = {
  high: { label: "عاجل", tone: "danger" },
  normal: { label: "عادي", tone: "neutral" },
  low: { label: "منخفض", tone: "warning" },
};

const PAGE_SIZE = 6;

export default function PortalActionsPage() {
  const router = useRouter();
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);

  const typeFilter = activeFilters["type"]?.[0] ?? "";

  const { data, isLoading, isError } = useGetActionItemsQuery(
    {
      type: typeFilter || undefined,
      page,
      limit: PAGE_SIZE,
    },
    { pollingInterval: 30_000 },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = useCallback((groupKey: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
    setPage(1);
  }, []);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="إجراءات تتطلب تدخلك"
        description="جميع الإجراءات التي تحتاج مراجعتك أو موافقتك ضمن نفس تجربة العميل الموحدة."
        icon={CheckCircle2}
      />

      <SurfaceCard
        title="الإجراءات المعلقة"
        description="راجع ما يتطلب تدخلك واتخذ الإجراء المناسب"
        icon={Settings}
        action={
          <FilterBar groups={FILTER_GROUPS} activeFilters={activeFilters} onFilterChange={handleFilterChange} />
        }
      >
        <DataTable
          columns={[
            { id: "title", label: "الإجراء" },
            { id: "subtitle", label: "التفاصيل" },
            { id: "priority", label: "الأولوية" },
            { id: "type", label: "النوع" },
            { id: "dueDate", label: "تاريخ الاستحقاق" },
            { id: "action", label: "الإجراء" },
          ]}
          data={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل الإجراءات."
          emptyState={{
            icon: Settings,
            message: "لا توجد إجراءات معلقة.",
            hint: "ستظهر هنا جميع الإجراءات التي تتطلب مراجعتك وموافقتك.",
          }}
          renderRow={(item) => {
            const config =
              TYPE_CONFIG[item.type] ?? TYPE_CONFIG.DELIVERABLE_APPROVAL;
            const priorityCfg =
              PRIORITY_PILL[item.priority] ?? PRIORITY_PILL.normal;
            return (
              <tr
                key={item.id}
                className="border-b-[1.5px] border-portal-divider"
              >
                <td className="px-5 py-4 font-medium text-sm text-natural-100">
                  {item.title}
                </td>
                <td className="px-5 py-4 text-sm text-portal-note-text truncate max-w-[200px]">
                  {item.subtitle}
                </td>
                <td className="px-5 py-4">
                  <Pill tone={priorityCfg.tone}>{priorityCfg.label}</Pill>
                </td>
                <td className="px-5 py-4">
                  <Pill tone={config.color === "purple" ? "purple" : "blue"}>
                    {config.label}
                  </Pill>
                </td>
                <td className="px-5 py-4 text-sm text-portal-note-text">
                  {item.dueDate ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(item.dueDate).toLocaleDateString(
                          "ar-SA-u-nu-latn",
                        )}
                      </span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-4">
                  <ActionButton
                    variant="primary"
                    size="md"
                    onClick={() => router.push(item.actionUrl)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    اتخاذ إجراء
                  </ActionButton>
                </td>
              </tr>
            );
          }}
        />

        {!isLoading && !isError && items.length > 0 && (
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
